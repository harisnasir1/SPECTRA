from app.extensions import db
import uuid
from datetime import datetime, timezone

class User(db.Model):
    __tablename__ = 'Users'

    Id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    Name = db.Column(db.String, nullable=False)
    Email = db.Column(db.String, nullable=False, unique=True)
    Password = db.Column(db.String, nullable=False)
    Role = db.Column(db.String, nullable=False, default='user')
    CreatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    UpdatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # relationships
    products = db.relationship('Product', backref='owner', lazy=True)
    embeddings = db.relationship('Embedding', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': str(self.Id),
            'name': self.Name,
            'email': self.Email,
            'role': self.Role,
            'createdAt': self.CreatedAt.isoformat()
        }