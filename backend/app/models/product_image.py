
from app.extensions import db

class ProductImage(db.Model):
    __tablename__ = 'ProductImages'

    Id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    ProductId = db.Column(db.UUID(as_uuid=True), nullable=True)
    Priority = db.Column(db.Integer, nullable=True)
    Url = db.Column(db.String, nullable=False)
    SdataId = db.Column(db.UUID(as_uuid=True), db.ForeignKey('Sdata.Id'), nullable=False)

    def to_dict(self):
        return {
            'id': self.Id,
            'url': self.Url,
            'priority': self.Priority
        }