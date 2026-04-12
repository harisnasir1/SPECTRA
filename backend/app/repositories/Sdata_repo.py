import uuid
from app.extensions import db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.models.product_variant import ProductVariant
from app.models.embedding import Embedding


def bulk_insert_products(user_id: str, products_data: list[dict]) -> list[Product]:
    """
    Insert multiple products and their images in a single flush.
    Each item in products_data must already be validated.
    Returns the list of persisted Product objects (committed).
    """
    inserted = []
    for data in products_data:
        product = Product(
            UserId=uuid.UUID(user_id),
            Title=data['title'],
            Brand=data['brand'],
            Description=data['description'],
            Price=int(data['price']),
            Category=data['category'],
            Gender=data['gender'],
            ProductUrl=data['product_url'],
            ProductType=data['product_type'],
            Condition=data['condition'],
            Sku=data.get('sku') or None,
            ConditionGrade=data.get('condition_grade') or None,
            Status='Uncategorized',
        )
        db.session.add(product)
        db.session.flush()  # get product.Id before inserting images

        images = [{'url': data['image'], 'priority': 1}]
        for idx, url in enumerate(data.get('extra_images', []), start=2):
            images.append({'url': url, 'priority': idx})

        for img in images:
            db.session.add(ProductImage(
                ProductId=product.Id,
                SdataId=product.Id,
                Url=img['url'],
                Priority=img['priority'],
            ))

        for variant in data.get('variants', []):
            db.session.add(ProductVariant(
                SdataId=product.Id,
                Size=variant['size'],
                SKU=variant['sku'],
                Price=variant['price'],
                InStock=variant['in_stock'],
            ))

        inserted.append(product)

    db.session.commit()
    return inserted


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


def get_products_by_id_list(product_ids: list) -> dict:
    """
    Fetch products for a list of UUIDs.
    Returns a dict keyed by str(Id) for O(1) lookup.
    """
    products = db.session.query(Product).filter(Product.Id.in_(product_ids)).all()
    return {str(p.Id): p for p in products}


def get_products_without_embeddings(limit=10):
    return (
        db.session.query(Product)
        .outerjoin(Embedding, Product.Id == Embedding.SdataId)
        .filter(Embedding.Id == None)
        .filter(Product.images.any())
        .limit(limit)
        .all()
    )


def get_products_paginated(user_id, page=1, per_page=20, brand=None,q=None,type=None):
    query = db.session.query(Product).filter(Product.UserId == user_id)

    if brand:
        query = query.filter(Product.Brand.ilike(f'%{brand}%'))

    if q:
        query = query.filter(Product.Brand.ilike(f'%{q}%') | Product.Title.ilike(f'%{q}%'))

    if type:
        query = query.filter(Product.ProductType.ilike(f'%{type}%') )

    total = query.count()
    products = query.offset((page - 1) * per_page).limit(per_page).all()

    return products, total

def get_distinct_filters(user_id):
    brands = db.session.query(Product.Brand).filter(
        Product.UserId == user_id,
        Product.Brand.isnot(None)
    ).distinct().order_by(Product.Brand).all()

    product_types = db.session.query(Product.ProductType).filter(
        Product.UserId == user_id,
        Product.ProductType.isnot(None)
    ).distinct().order_by(Product.ProductType).all()

    category= db.session.query(Product.Category).filter(
        Product.UserId == user_id,
        Product.Category.isnot(None)
    ).distinct().order_by(Product.Category).all()

    return {
        'brands': [b[0] for b in brands],
        'productTypes': [pt[0] for pt in product_types],
        'category': [ct[0] for ct in category]
    }