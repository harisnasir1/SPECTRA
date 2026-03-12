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
