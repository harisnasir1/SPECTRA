import uuid
from app.extensions import db
from app.models.product import Product


def get_products_by_ids(id1, id2):
    try:
        uid1 = uuid.UUID(str(id1))
        uid2 = uuid.UUID(str(id2))
    except (ValueError, AttributeError) as e:
        raise ValueError(f"Invalid UUID format: {e}")

    products = db.session.query(Product).filter(Product.Id.in_([uid1, uid2])).all()

    found_ids = {str(p.Id) for p in products}
    missing = [i for i in [str(uid1), str(uid2)] if i not in found_ids]

    if missing:
        raise LookupError(f"Products not found for IDs: {missing}")

    id_order = {str(uid1): 0, str(uid2): 1}
    products.sort(key=lambda p: id_order[str(p.Id)])

    return products