import uuid
from datetime import datetime, timezone

from app.extensions import db
from app.models.product import Product
from app.repositories.duplicate_repo import get_cluster_by_id, get_clusters_containing_any


def remove_product_from_cluster(user_id: str, cluster_id: int, product_id_str: str) -> dict:
    """
    Remove a single product from a pending cluster (user marked it as unique).

    - If the cluster shrinks to 1 product it is auto-resolved (no winner).
    - The product itself is NOT soft-deleted; it remains a normal listing.

    Raises:
        ValueError  – validation / business-rule failure
        LookupError – cluster not found
    """
    # Validate product UUID
    try:
        product_uuid = uuid.UUID(product_id_str)
    except ValueError:
        raise ValueError("Invalid UUID format for product_id")

    cluster = get_cluster_by_id(cluster_id, user_id)
    if cluster is None:
        raise LookupError("Cluster not found")
    if cluster.Status != 'pending':
        raise ValueError(f"Cluster cannot be modified (status: {cluster.Status})")

    cluster_ids = [str(pid) for pid in cluster.ProductIds]
    if product_id_str not in cluster_ids:
        # Already removed in a prior attempt — return current state (idempotent)
        return {
            'clusterId': cluster_id,
            'status': cluster.Status,
            'remainingProductIds': cluster_ids,
        }

    updated_ids = [pid for pid in cluster.ProductIds if str(pid) != product_id_str]

    now = datetime.now(timezone.utc)

    if len(updated_ids) < 2:
        # One or zero products left — nothing left to compare, resolve the cluster
        cluster.Status = 'resolved'
        cluster.ResolvedAt = now
        cluster.ProductIds = updated_ids
        db.session.commit()
        return {'clusterId': cluster_id, 'status': 'resolved', 'reason': 'too_few_products'}

    cluster.ProductIds = updated_ids
    db.session.commit()

    return {
        'clusterId': cluster_id,
        'status': 'pending',
        'remainingProductIds': [str(pid) for pid in cluster.ProductIds],
    }


def dismiss_cluster(user_id: str, cluster_id: int) -> dict:
    """
    Resolve an entire cluster without merging (user marked all products as unique).

    No product is soft-deleted. No winner is set. The cluster is closed.

    Raises:
        ValueError  – cluster already resolved
        LookupError – cluster not found
    """
    cluster = get_cluster_by_id(cluster_id, user_id)
    if cluster is None:
        raise LookupError("Cluster not found")
    if cluster.Status == 'resolved':
        raise ValueError("Cluster has already been resolved")
    if cluster.Status != 'pending':
        raise ValueError(f"Cluster cannot be dismissed (status: {cluster.Status})")

    now = datetime.now(timezone.utc)
    cluster.Status = 'resolved'
    cluster.ResolvedAt = now
    # WinnerId intentionally left None — no master, all treated as unique

    db.session.commit()

    return {'clusterId': cluster_id, 'status': 'resolved'}


def merge_cluster(user_id: str, cluster_id: int, products_payload: list[dict]) -> dict:
    """
    Merge a duplicate cluster into a single master product.

    products_payload: list of {"id": str, "is_master": bool}

    The master product absorbs all variants and images from non-master products.
    Non-masters are soft-deleted (Status='duplicate') and their embeddings removed.
    The cluster is resolved, and any other pending clusters that referenced the
    now-absorbed products are cleaned up.

    Raises:
        ValueError  – for any validation / business-rule failure
        LookupError – when the cluster or products cannot be found
    """
    # ── 1. Payload structure validation ──────────────────────────────────────

    if not products_payload or not isinstance(products_payload, list):
        raise ValueError("products must be a non-empty list")

    masters = [p for p in products_payload if p.get('is_master') is True]

    if len(masters) == 0:
        raise ValueError("Exactly one product must be marked as master (is_master: true)")
    if len(masters) > 1:
        raise ValueError("Only one product can be marked as master")

    if len(products_payload) < 2:
        raise ValueError("At least 2 products are required to perform a merge")

    # Validate and parse UUIDs
    try:
        master_uuid = uuid.UUID(str(masters[0]['id']))
        non_master_uuids = [
            uuid.UUID(str(p['id']))
            for p in products_payload
            if not p.get('is_master')
        ]
    except (ValueError, KeyError):
        raise ValueError("Invalid UUID format in product IDs")

    all_submitted_uuids = [master_uuid] + non_master_uuids

    # Guard against duplicate IDs in the payload
    if len(all_submitted_uuids) != len(set(str(u) for u in all_submitted_uuids)):
        raise ValueError("Duplicate product IDs in request")

    # ── 2. Cluster validation ─────────────────────────────────────────────────

    cluster = get_cluster_by_id(cluster_id, user_id)
    if cluster is None:
        raise LookupError("Cluster not found")

    if cluster.Status == 'resolved':
        raise ValueError("Cluster has already been resolved")
    if cluster.Status != 'pending':
        raise ValueError(f"Cluster cannot be merged (status: {cluster.Status})")

    # ── 3. Submitted IDs must exactly match the cluster's ProductIds ──────────

    cluster_ids_set = {str(pid) for pid in cluster.ProductIds}
    submitted_ids_set = {str(u) for u in all_submitted_uuids}

    extra = submitted_ids_set - cluster_ids_set
    missing = cluster_ids_set - submitted_ids_set

    if extra:
        raise ValueError(f"Product IDs not part of this cluster: {extra}")
    if missing:
        raise ValueError(f"Missing products from cluster that must be accounted for: {missing}")

    # ── 4. Fetch products and verify ownership ────────────────────────────────

    try:
        user_uuid = uuid.UUID(str(user_id))
    except ValueError:
        raise ValueError("Invalid user ID")

    all_products = (
        db.session.query(Product)
        .filter(
            Product.Id.in_(all_submitted_uuids),
            Product.UserId == user_uuid,
        )
        .all()
    )

    if len(all_products) != len(all_submitted_uuids):
        found_ids = {str(p.Id) for p in all_products}
        not_found = submitted_ids_set - found_ids
        raise LookupError(f"Products not found or not owned by this user: {not_found}")

    product_map = {str(p.Id): p for p in all_products}
    master = product_map[str(master_uuid)]
    non_masters = [product_map[str(u)] for u in non_master_uuids]

    # Guard: master must not already be soft-deleted
    if master.Status == 'duplicate':
        raise ValueError("The selected master product is already marked as a duplicate")

    # ── 5. Absorb variants ────────────────────────────────────────────────────
    # Deduplicate on (Size, SKU) — identical Size+SKU is the same stock item.
    # Same Size with a different SKU is distinct inventory and is kept.

    existing_variant_keys = {(v.Size, v.SKU) for v in master.variants}

    for non_master in non_masters:
        for variant in list(non_master.variants):
            key = (variant.Size, variant.SKU)
            if key not in existing_variant_keys:
                variant.SdataId = master.Id
                existing_variant_keys.add(key)
            # identical Size+SKU already on master — discard duplicate

    # ── 6. Absorb images ──────────────────────────────────────────────────────
    # Master's images retain their priorities. Non-master images are appended
    # after the highest existing priority, skipping URL duplicates.

    existing_image_urls = {img.Url for img in master.images}
    next_priority = max((img.Priority or 0 for img in master.images), default=0)

    for non_master in non_masters:
        for img in list(non_master.images):
            if img.Url not in existing_image_urls:
                next_priority += 1
                img.SdataId = master.Id
                img.Priority = next_priority
                existing_image_urls.add(img.Url)
            # duplicate URL — discard

    # ── 7. Delete embeddings and soft-delete non-master products ─────────────

    now = datetime.now(timezone.utc)

    for non_master in non_masters:
        if non_master.embedding:
            db.session.delete(non_master.embedding)
        non_master.Status = 'duplicate'
        non_master.UpdatedAt = now

    # ── 8. Resolve the cluster ────────────────────────────────────────────────

    cluster.WinnerId = master.Id
    cluster.Status = 'resolved'
    cluster.ResolvedAt = now

    # ── 9. Clean up other pending clusters that reference absorbed products ───
    # If another cluster still lists a now-duplicate product, shrink its
    # ProductIds array. If fewer than 2 products remain, auto-resolve it.

    non_master_id_strs = [str(u) for u in non_master_uuids]
    absorbed_set = set(non_master_id_strs)

    stale_clusters = get_clusters_containing_any(user_id, non_master_id_strs, cluster_id)

    for stale in stale_clusters:
        updated_ids = [pid for pid in stale.ProductIds if str(pid) not in absorbed_set]
        if len(updated_ids) < 2:
            stale.Status = 'resolved'
            stale.ResolvedAt = now
        else:
            stale.ProductIds = updated_ids

    # ── 10. Commit and return ─────────────────────────────────────────────────

    db.session.commit()
    db.session.refresh(master)

    return {
        'masterId':    str(master.Id),
        'title':       master.Title,
        'brand':       master.Brand,
        'variants':    [v.to_dict() for v in master.variants],
        'images':      [
            img.to_dict()
            for img in sorted(master.images, key=lambda x: x.Priority or 0)
        ],
        'mergedCount': len(non_masters),
    }
