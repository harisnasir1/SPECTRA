import uuid as uuid_lib
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.product import Product
from app.models.duplicate import DuplicatePair
from app.repositories.Sdata_repo import get_products_paginated, get_distinct_filters
from app.repositories.duplicate_repo import get_pending_cluster_ids_for_products

products_bp = Blueprint('products', __name__)


@products_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    user_id = get_jwt_identity()
    page     = request.args.get('page',     1,  type=int)
    per_page = request.args.get('per_page', 20, type=int)
    brand    = request.args.get('brand',    None, type=str)
    type_    = request.args.get('type',     None, type=str)
    q        = request.args.get('q',        None, type=str)

    products, total = get_products_paginated(user_id, page, per_page, brand, q, type_)

    product_ids = [p.Id for p in products]

    # Batch-fetch which product IDs are winners in a resolved cluster
    master_ids = set()
    cluster_map: dict = {}
    if product_ids:
        rows = (
            db.session.query(DuplicatePair.WinnerId)
            .filter(
                DuplicatePair.WinnerId.in_(product_ids),
                DuplicatePair.Status == 'resolved',
                DuplicatePair.WinnerId.isnot(None),
            )
            .all()
        )
        master_ids = {str(r.WinnerId) for r in rows}
        cluster_map = get_pending_cluster_ids_for_products(user_id, product_ids)

    result = []
    for p in products:
        d = p.to_dict()
        d['images']           = [img.to_dict() for img in sorted(p.images, key=lambda x: x.Priority or 0)]
        d['variants']         = [v.to_dict() for v in p.variants]
        d['variantCount']     = len(p.variants)
        d['hasEmbedding']     = p.embedding is not None
        d['isMaster']         = str(p.Id) in master_ids
        d['pendingClusterId'] = cluster_map.get(str(p.Id))
        result.append(d)

    return jsonify({
        'products': result,
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    (total + per_page - 1) // per_page,
    }), 200


@products_bp.route('/<string:product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    user_id = get_jwt_identity()

    try:
        pid = uuid_lib.UUID(product_id)
    except ValueError:
        return jsonify({'error': 'Invalid product ID'}), 400

    product = (
        db.session.query(Product)
        .filter(Product.Id == pid, Product.UserId == user_id)
        .first()
    )
    if product is None:
        return jsonify({'error': 'Product not found'}), 404

    # How many products were merged into this one?
    merged_cluster = (
        db.session.query(DuplicatePair)
        .filter(
            DuplicatePair.WinnerId == pid,
            DuplicatePair.Status == 'resolved',
        )
        .first()
    )
    merged_count = (len(merged_cluster.ProductIds) - 1) if merged_cluster else 0

    d = product.to_dict()
    d['images']       = [img.to_dict() for img in sorted(product.images, key=lambda x: x.Priority or 0)]
    d['variants']     = [v.to_dict() for v in product.variants]
    d['hasEmbedding'] = product.embedding is not None
    d['isMaster']     = merged_count > 0
    d['mergedCount']  = merged_count

    return jsonify(d), 200


@products_bp.route('/filters', methods=['GET'])
@jwt_required()
def get_filters():
    user_id = get_jwt_identity()
    filters = get_distinct_filters(user_id)
    return jsonify(filters), 200