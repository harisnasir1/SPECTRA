from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.repositories.duplicate_repo import get_pending_clusters
from app.repositories.Sdata_repo import get_products_by_id_list

duplicates_bp = Blueprint('duplicates', __name__)


@duplicates_bp.route('/', methods=['GET'])
@jwt_required()
def get_duplicate_clusters():
    user_id = get_jwt_identity()

    pairs = get_pending_clusters(user_id)

    result = []
    for pair in pairs:
        product_map = get_products_by_id_list(pair.ProductIds)

        products = []
        for pid in pair.ProductIds:
            p = product_map.get(str(pid))
            if not p:
                continue
            first_image = next(
                (img.Url for img in sorted(p.images, key=lambda x: x.Priority or 0)),
                None
            )
            products.append({
                'id':          str(p.Id),
                'title':       p.Title,
                'brand':       p.Brand,
                'description': p.Description,
                'gender':      p.Gender,
                'sku':         p.Sku,
                'productType': p.ProductType,
                'image':       first_image,
            })

        result.append({
            'clusterId': pair.Id,
            'scores':    pair.Scores,
            'products':  products,
        })

    return jsonify({'clusters': result, 'total': len(result)}), 200