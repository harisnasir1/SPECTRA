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

    result = {}
    for i, pair in enumerate(pairs, 1):
        product_map = get_products_by_id_list(pair.ProductIds)
        ordered_products = [
            {
                **product_map[str(pid)].to_dict(),
                'images': [img.to_dict() for img in product_map[str(pid)].images],
            }
            for pid in pair.ProductIds
            if str(pid) in product_map
        ]
        result[str(i)] = {
            **pair.to_dict(),
            'products': ordered_products,
        }

    return jsonify({'clusters': result, 'total': len(result)}), 200