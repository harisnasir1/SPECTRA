# app/models/embedding.py
from app.extensions import db
from pgvector.sqlalchemy import Vector
from datetime import datetime, timezone

class Embedding(db.Model):
    __tablename__ = 'Embeddings'

    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    SdataId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Sdata.Id'), nullable=False)
    UserId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Users.Id'), nullable=False)
    ImageVector = db.Column(Vector(768), nullable=True)
    TextVector = db.Column(Vector(768), nullable=True)
    CreatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    UpdatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))