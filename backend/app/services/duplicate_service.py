from app.extensions import db, clip
from app.models.duplicate import DuplicatePair
from app.repositories.embedding_repo import get_embeddings_by_user
from app.repositories.duplicate_repo import (
    find_similar_embeddings,
    find_existing_duplicate_pair,
    add_duplicate_pair,
)


def _pairwise_scores(cluster_ids: list[str], embedding_map: dict) -> dict:
    """
    Compute all pairwise similarity scores for every pair in the cluster.
    Returns a Scores JSONB dict using DuplicatePair canonical key/entry helpers.
    """
    scores = {}
    for i in range(len(cluster_ids)):
        for j in range(i + 1, len(cluster_ids)):
            id_a  = cluster_ids[i]
            id_b  = cluster_ids[j]
            emb_a = embedding_map.get(id_a)
            emb_b = embedding_map.get(id_b)
            if emb_a is None or emb_b is None:
                continue
            image_sim = clip.cosine_similarity(emb_a.ImageVector, emb_b.ImageVector)
            text_sim  = clip.cosine_similarity(emb_a.TextVector,  emb_b.TextVector)
            final     = clip.combine_similarity(image_sim, text_sim)
            key = DuplicatePair.build_score_key(id_a, id_b)
            scores[key] = DuplicatePair.build_score_entry(image_sim, text_sim, final)
    return scores


def detect_duplicates(user_id: str) -> int:
    """
    For every un-grouped embedding that belongs to user_id:
    1. Query pgvector for products with combined similarity > 0.89.
    2. Merge into an existing pending DuplicatePairs cluster if one already
       contains any of the matched IDs; otherwise create a new cluster.
    3. Compute pairwise scores for all cluster members.
    4. Persist everything in a single commit.

    Returns the number of new DuplicatePairs rows created.
    """
    embeddings = get_embeddings_by_user(user_id)
    if not embeddings:
        return 0

    embedding_map: dict = {str(e.SdataId): e for e in embeddings}
    seen: set = set()
    new_pairs_count = 0

    for embedding in embeddings:
        product_id = str(embedding.SdataId)

        if product_id in seen:
            continue

        if embedding.ImageVector is None or embedding.TextVector is None:
            continue

        matches = find_similar_embeddings(
            user_id=user_id,
            current_sdata_id=embedding.SdataId,
            image_vector=embedding.ImageVector,
            text_vector=embedding.TextVector,
            threshold=0.89,
        )

        if not matches:
            continue

        match_ids = [m['sdata_id'] for m in matches]
        all_ids   = [product_id] + match_ids

        existing = find_existing_duplicate_pair(user_id, match_ids)

        if existing:
            existing_ids = [str(pid) for pid in existing.ProductIds]
            merged = list(dict.fromkeys(existing_ids + [product_id]))
            existing.ProductIds = merged
            existing.Scores     = _pairwise_scores(merged, embedding_map)
        else:
            scores = _pairwise_scores(all_ids, embedding_map)
            add_duplicate_pair(user_id, all_ids, scores)
            new_pairs_count += 1

        for pid in all_ids:
            seen.add(pid)

    db.session.commit()
    return new_pairs_count
