
from app.extensions import db

class ProductVariant(db.Model):
    __tablename__ = 'ProductVariants'

    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    Size = db.Column(db.String, nullable=False)
    SKU = db.Column(db.String, nullable=False)
    Price = db.Column(db.Numeric, nullable=False)
    InStock = db.Column(db.Boolean, nullable=False)
    SdataId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Sdata.Id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.Id,
            'size': self.Size,
            'sku': self.SKU,
            'price': float(self.Price),
            'inStock': self.InStock
        }