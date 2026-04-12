from sqlalchemy import text
from app.extensions import db
from app.models.embedding import Embedding


def bulk_insert_embeddings(records: list[dict]) -> int:
    """
    Insert multiple embeddings at once.
    Each record: { SdataId, UserId, ImageVector, TextVector }
    Returns count of inserted rows.
    """
    embeddings = [Embedding(**r) for r in records]
    db.session.bulk_save_objects(embeddings)
    db.session.commit()
    return len(embeddings)


def get_embeddings_by_ids(product_ids: list) -> list:
    """Fetch embeddings for a specific list of product IDs."""
    if not product_ids:
        return []
    return db.session.query(Embedding).filter(Embedding.SdataId.in_(product_ids)).all()


def get_embeddings_by_user(user_id) -> list:
    """
    Fetch embeddings for a user, excluding products already assigned
    to a DuplicatePairs cluster.
    """
    sql = text("""
        SELECT e."Id", e."SdataId", e."UserId", e."ImageVector", e."TextVector"
        FROM "Embeddings" e
        WHERE e."UserId" = CAST(:user_id AS uuid)
          AND e."SdataId" NOT IN (
              SELECT unnest(dp."ProductIds")
              FROM "DuplicatePairs" dp
              WHERE dp."UserId" = CAST(:user_id AS uuid)
          )
    """)
    rows = db.session.execute(sql, {'user_id': str(user_id)}).fetchall()

    # Map raw rows back to ORM objects so callers can access .ImageVector etc.
    id_list = [row.Id for row in rows]
    if not id_list:
        return []
    return db.session.query(Embedding).filter(Embedding.Id.in_(id_list)).all()
