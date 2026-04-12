from sqlalchemy import text
from app.extensions import db
from app.models.duplicate import DuplicatePair


def find_similar_embeddings(user_id, current_sdata_id, image_vector, text_vector, threshold=0.93) -> list[dict]:
    """
    Query pgvector for products where the combined similarity score > threshold.
    combined_score = 0.6 * image_similarity + 0.4 * text_similarity
    Excludes the current product and any with Sdata.Status = 'duplicate'.
    Returns list of dicts: { sdata_id, image_sim, text_sim, final_score }
    """
    sql = text("""
        SELECT
        e2."SdataId",
        (1 - (e2."ImageVector" <=> e1."ImageVector")) AS image_sim,
        (1 - (e2."TextVector"  <=> e1."TextVector"))  AS text_sim,
        (
            0.6 * (1 - (e2."ImageVector" <=> e1."ImageVector")) +
            0.4 * (1 - (e2."TextVector"  <=> e1."TextVector"))
        ) AS combined_score
    FROM "Embeddings" e1
    JOIN "Embeddings" e2 ON e2."UserId" = e1."UserId"
    JOIN "Sdata" s ON s."Id" = e2."SdataId"
    WHERE e1."SdataId" = CAST(:current_id AS uuid)
      AND e2."SdataId" != e1."SdataId"
      AND (s."Status" IS NULL OR s."Status" != 'duplicate')
      AND (
            0.6 * (1 - (e2."ImageVector" <=> e1."ImageVector")) +
            0.4 * (1 - (e2."TextVector"  <=> e1."TextVector"))
          ) > :threshold
    ORDER BY combined_score DESC
    """)

    rows = db.session.execute(sql, {
        'current_id': str(current_sdata_id),
        'threshold':  threshold,
    }).fetchall()

    return [
        {
            'sdata_id':    str(row.SdataId),
            'image_sim':   float(row.image_sim),
            'text_sim':    float(row.text_sim),
            'final_score': float(row.combined_score),
        }
        for row in rows
    ]


def find_similar_embeddings_in(
    current_sdata_id, image_vector, text_vector, candidate_ids: list[str], threshold=0.93
) -> list[dict]:
    """
    Same as find_similar_embeddings but restricts matches to candidate_ids only.
    Used after ingest to compare new products only against each other.
    """
    if not candidate_ids:
        return []

    pg_array = '{' + ','.join(str(cid) for cid in candidate_ids) + '}'

    sql = text("""
        SELECT
            e2."SdataId",
            (1 - (e2."ImageVector" <=> e1."ImageVector")) AS image_sim,
            (1 - (e2."TextVector"  <=> e1."TextVector"))  AS text_sim,
            (
                0.6 * (1 - (e2."ImageVector" <=> e1."ImageVector")) +
                0.4 * (1 - (e2."TextVector"  <=> e1."TextVector"))
            ) AS combined_score
        FROM "Embeddings" e1
        JOIN "Embeddings" e2 ON e2."SdataId" != e1."SdataId"
        JOIN "Sdata" s ON s."Id" = e2."SdataId"
        WHERE e1."SdataId" = CAST(:current_id AS uuid)
          AND e2."SdataId" = ANY(CAST(:candidate_ids AS uuid[]))
          AND (s."Status" IS NULL OR s."Status" != 'duplicate')
          AND (
                0.6 * (1 - (e2."ImageVector" <=> e1."ImageVector")) +
                0.4 * (1 - (e2."TextVector"  <=> e1."TextVector"))
              ) > :threshold
        ORDER BY combined_score DESC
    """)

    rows = db.session.execute(sql, {
        'current_id':    str(current_sdata_id),
        'candidate_ids': pg_array,
        'threshold':     threshold,
    }).fetchall()

    return [
        {
            'sdata_id':    str(row.SdataId),
            'image_sim':   float(row.image_sim),
            'text_sim':    float(row.text_sim),
            'final_score': float(row.combined_score),
        }
        for row in rows
    ]


def find_existing_duplicate_pair(user_id, product_ids: list[str]):
    """
    Return the first pending DuplicatePairs row whose ProductIds array
    overlaps with product_ids (PostgreSQL && operator).
    Returns a DuplicatePair ORM object or None.
    """
    if not product_ids:
        return None

    pg_array = '{' + ','.join(str(pid) for pid in product_ids) + '}'

    sql = text("""
        SELECT "Id"
        FROM "DuplicatePairs"
        WHERE "UserId" = CAST(:user_id AS uuid)
          AND "Status" = 'pending'
          AND "ProductIds" && CAST(:product_ids AS uuid[])
        LIMIT 1
    """)

    row = db.session.execute(sql, {
        'user_id':     str(user_id),
        'product_ids': pg_array,
    }).first()

    if row is None:
        return None

    return db.session.get(DuplicatePair, row.Id)


def add_duplicate_pair(user_id, product_ids: list, scores: dict) -> DuplicatePair:
    """Add a new DuplicatePairs row to the session (caller must commit)."""
    pair = DuplicatePair(
        UserId=user_id,
        ProductIds=product_ids,
        Scores=scores,
        Status='pending',
    )
    db.session.add(pair)
    return pair


def get_pending_clusters(user_id) -> list[DuplicatePair]:
    """Return all pending DuplicatePairs for a user, newest first."""
    return (
        db.session.query(DuplicatePair)
        .filter(
            DuplicatePair.UserId == user_id,
            DuplicatePair.Status == 'pending',
        )
        .order_by(DuplicatePair.CreatedAt.desc())
        .all()
    )
