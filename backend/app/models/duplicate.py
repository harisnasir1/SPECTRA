from app.extensions import db
from datetime import datetime, timezone


class DuplicatePair(db.Model):
    __tablename__ = 'DuplicatePairs'

    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    UserId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Users.Id'), nullable=False)
    ProductIds = db.Column(db.ARRAY(db.UUID(as_uuid=True)), nullable=False)
    WinnerId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Sdata.Id'), nullable=True)
    Scores = db.Column(db.JSON, nullable=True)
    Status = db.Column(db.String, nullable=False, default='pending')
    ResolvedAt = db.Column(db.DateTime(timezone=True), nullable=True)
    CreatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    @staticmethod
    def build_score_key(id_a, id_b):
        a, b = sorted([str(id_a).replace('-', ''), str(id_b).replace('-', '')])
        return f"{a}{b}"
    
    @staticmethod
    def build_score_entry(image_sim, text_sim, final_score):
        return {
            'image': round(float(image_sim), 4),
            'text': round(float(text_sim), 4),
            'final': round(float(final_score), 4)
        }

    def to_dict(self):
        return {
        'id': self.Id,
        'productIds': [str(pid) for pid in self.ProductIds],
        'winnerId': str(self.WinnerId) if self.WinnerId else None,
        'scores': self.Scores,
        'status': self.Status,
        'resolvedAt': self.ResolvedAt.isoformat() if self.ResolvedAt else None,
        'createdAt': self.CreatedAt.isoformat()
        }