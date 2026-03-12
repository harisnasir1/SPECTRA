from app.extensions import db
import uuid
from datetime import datetime, timezone

class Product(db.Model):
    __tablename__ = 'Sdata'

    Id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    UserId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Users.Id'), nullable=False)
    Title = db.Column(db.String, nullable=False)
    Brand = db.Column(db.String, nullable=False)
    Description = db.Column(db.String, nullable=False)
    Price = db.Column(db.Integer, nullable=False)
    Category = db.Column(db.String, nullable=False)
    Gender = db.Column(db.String, nullable=False)
    Status = db.Column(db.String, nullable=True)
    ProductUrl = db.Column(db.String, nullable=False)
    ProductType = db.Column(db.String, nullable=False)
    Condition = db.Column(db.String, nullable=False)
    Sku = db.Column(db.String, nullable=True)
    ConditionGrade = db.Column(db.String, nullable=True)
    CreatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    UpdatedAt = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    images = db.relationship('ProductImage', backref='product', lazy=True)
    variants = db.relationship('ProductVariant', backref='product', lazy=True)
    embedding = db.relationship('Embedding', backref='product', uselist=False)

    def to_dict(self):
        return {
            'id': str(self.Id),
            'title': self.Title,
            'brand': self.Brand,
            'description': self.Description,
            'price': self.Price,
            'category': self.Category,
            'gender': self.Gender,
            'status': self.Status,
            'productUrl': self.ProductUrl,
            'productType': self.ProductType,
            'condition': self.Condition,
            'sku': self.Sku,
            'conditionGrade': self.ConditionGrade,
            'createdAt': self.CreatedAt.isoformat()
        }