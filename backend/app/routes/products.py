import uuid as uuid_lib
from io import BytesIO
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import text
from PIL import Image
from app.extensions import db
from app.models.product import Product
from app.models.duplicate import DuplicatePair
from app.repositories.Sdata_repo import get_products_paginated, get_distinct_filters, get_products_by_id_list
from app.repositories.duplicate_repo import get_pending_cluster_ids_for_products
from app.services.clip_service import CLIPService

_clip = CLIPService()

products_bp = Blueprint('products', __name__)


@products_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    user_id = get_jwt_identity()
    page     = request.args.get('page',     1,  type=int)
    per_page = request.args.get('per_page', 20, type=int)
    brand    = request.args.get('brand',    None, type=str)
    type_    = request.args.get('type',     None, type=str)
    q        = request.args.get('q',        None, type=str)

    products, total = get_products_paginated(user_id, page, per_page, brand, q, type_)

    product_ids = [p.Id for p in products]

    # Batch-fetch which product IDs are winners in a resolved cluster
    master_ids = set()
    cluster_map: dict = {}
    if product_ids:
        rows = (
            db.session.query(DuplicatePair.WinnerId)
            .filter(
                DuplicatePair.WinnerId.in_(product_ids),
                DuplicatePair.Status == 'resolved',
                DuplicatePair.WinnerId.isnot(None),
            )
            .all()
        )
        master_ids = {str(r.WinnerId) for r in rows}
        cluster_map = get_pending_cluster_ids_for_products(user_id, product_ids)

    result = []
    for p in products:
        d = p.to_dict()
        d['images']           = [img.to_dict() for img in sorted(p.images, key=lambda x: x.Priority or 0)]
        d['variants']         = [v.to_dict() for v in p.variants]
        d['variantCount']     = len(p.variants)
        d['hasEmbedding']     = p.embedding is not None
        d['isMaster']         = str(p.Id) in master_ids
        d['pendingClusterId'] = cluster_map.get(str(p.Id))
        result.append(d)

    return jsonify({
        'products': result,
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    (total + per_page - 1) // per_page,
    }), 200


@products_bp.route('/<string:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    user_id = get_jwt_identity()

    try:
        pid = uuid_lib.UUID(product_id)
    except ValueError:
        return jsonify({'error': 'Invalid product ID'}), 400

    product = (
        db.session.query(Product)
        .filter(Product.Id == pid, Product.UserId == user_id)
        .first()
    )
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # How many products were merged into this one?
    merged_cluster = (
        db.session.query(DuplicatePair)
        .filter(
            DuplicatePair.WinnerId == pid,
            DuplicatePair.Status == 'resolved',
        )
        .first()
    )
    merged_count = (len(merged_cluster.ProductIds) - 1) if merged_cluster else 0

    d = product.to_dict()
    d['images']       = [img.to_dict() for img in sorted(product.images, key=lambda x: x.Priority or 0)]
    d['variants']     = [v.to_dict() for v in product.variants]
    d['hasEmbedding'] = product.embedding is not None
    d['isMaster']     = merged_count > 0
    d['mergedCount']  = merged_count

    return jsonify(d), 200


@products_bp.route('/search-by-image', methods=['POST'])
@jwt_required()
def search_by_image():
    user_id = get_jwt_identity()

    file = request.files.get('image')
    if not file:
        return jsonify({'error': 'No image file provided'}), 400

    try:
        pil_image = Image.open(BytesIO(file.read()))
    except Exception:
        return jsonify({'error': 'Could not read image file'}), 400

    query_vector = _clip.encode_image_from_pil(pil_image)
    vector_str = '[' + ','.join(str(v) for v in query_vector) + ']'
    limit = min(request.args.get('limit', 20, type=int), 100)

    rows = db.session.execute(
        text("""
            SELECT e."SdataId" AS id,
                   (1 - (e."ImageVector" <=> CAST(:vec AS vector))) AS image_sim
            FROM "Embeddings" e
            JOIN "Sdata" s ON s."Id" = e."SdataId"
            WHERE e."UserId" = CAST(:user_id AS uuid)
              AND (s."Status" IS NULL OR s."Status" != 'duplicate')
            ORDER BY e."ImageVector" <=> CAST(:vec AS vector)
            LIMIT :limit
        """),
        {'vec': vector_str, 'user_id': str(user_id), 'limit': limit},
    ).fetchall()

    if not rows:
        return jsonify({'products': [], 'total': 0}), 200

    ordered_ids  = [row.id for row in rows]
    sim_map      = {str(row.id): round(float(row.image_sim), 4) for row in rows}
    product_map  = get_products_by_id_list(ordered_ids)
    cluster_map  = get_pending_cluster_ids_for_products(user_id, ordered_ids)

    master_ids: set = set()
    master_rows = (
        db.session.query(DuplicatePair.WinnerId)
        .filter(
            DuplicatePair.WinnerId.in_(ordered_ids),
            DuplicatePair.Status == 'resolved',
            DuplicatePair.WinnerId.isnot(None),
        )
        .all()
    )
    master_ids = {str(r.WinnerId) for r in master_rows}

    result = []
    for pid in [str(r.id) for r in rows]:
        p = product_map.get(pid)
        if not p:
            continue
        d = p.to_dict()
        d['images']           = [img.to_dict() for img in sorted(p.images, key=lambda x: x.Priority or 0)]
        d['variants']         = [v.to_dict() for v in p.variants]
        d['variantCount']     = len(p.variants)
        d['hasEmbedding']     = True
        d['isMaster']         = pid in master_ids
        d['pendingClusterId'] = cluster_map.get(pid)
        d['imageSimilarity']  = sim_map.get(pid)
        result.append(d)

    return jsonify({'products': result, 'total': len(result)}), 200


@products_bp.route('/filters', methods=['GET'])
@jwt_required()
def get_filters():
    user_id = get_jwt_identity()
    filters = get_distinct_filters(user_id)
    return jsonify(filters), 200