from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.repositories.duplicate_repo import get_pending_clusters
from app.repositories.Sdata_repo import get_products_by_id_list
from app.services.merge_service import merge_cluster, remove_product_from_cluster, dismiss_cluster

duplicates_bp = Blueprint('duplicates', __name__)


@duplicates_bp.route('/', methods=['GET'])
@jwt_required()
def get_duplicate_clusters():
    user_id = get_jwt_identity()

    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    except (TypeError, ValueError):
        page, per_page = 1, 10

    pairs, total = get_pending_clusters(user_id, page, per_page)
    pages = (total + per_page - 1) // per_page if per_page else 1

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

    return jsonify({
        'clusters': result,
        'total':    total,
        'page':     page,
        'per_page': per_page,
        'pages':    pages,
    }), 200


@duplicates_bp.route('/merge', methods=['POST'])
@jwt_required()
def merge_duplicate_cluster():
    user_id = get_jwt_identity()
    body = request.get_json(silent=True)

    if not body:
        return jsonify({'error': 'Request body is required'}), 400

    cluster_id = body.get('cluster_id')
    products = body.get('products')

    # ── top-level field validation ────────────────────────────────────────────

    if cluster_id is None:
        return jsonify({'error': 'cluster_id is required'}), 400
    if not isinstance(cluster_id, int):
        return jsonify({'error': 'cluster_id must be an integer'}), 400

    if products is None:
        return jsonify({'error': 'products is required'}), 400
    if not isinstance(products, list) or len(products) == 0:
        return jsonify({'error': 'products must be a non-empty list'}), 400

    # ── per-item validation ───────────────────────────────────────────────────

    for i, p in enumerate(products):
        if not isinstance(p, dict):
            return jsonify({'error': f'products[{i}] must be an object'}), 400
        if 'id' not in p:
            return jsonify({'error': f'products[{i}].id is required'}), 400
        if not isinstance(p.get('id'), str) or not p['id'].strip():
            return jsonify({'error': f'products[{i}].id must be a non-empty string'}), 400
        if 'is_master' not in p:
            return jsonify({'error': f'products[{i}].is_master is required'}), 400
        if not isinstance(p.get('is_master'), bool):
            return jsonify({'error': f'products[{i}].is_master must be a boolean'}), 400

    # ── delegate to service ───────────────────────────────────────────────────

    try:
        result = merge_cluster(user_id, cluster_id, products)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except LookupError as e:
        return jsonify({'error': str(e)}), 404
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@duplicates_bp.route('/<int:cluster_id>/remove-product', methods=['POST'])
@jwt_required()
def remove_product(cluster_id):
    user_id = get_jwt_identity()
    body = request.get_json(silent=True)

    if not body:
        return jsonify({'error': 'Request body is required'}), 400

    product_id = body.get('product_id')
    if not product_id:
        return jsonify({'error': 'product_id is required'}), 400
    if not isinstance(product_id, str) or not product_id.strip():
        return jsonify({'error': 'product_id must be a non-empty string'}), 400

    try:
        result = remove_product_from_cluster(user_id, cluster_id, product_id.strip())
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except LookupError as e:
        return jsonify({'error': str(e)}), 404
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'An unexpected error occurred'}), 500


@duplicates_bp.route('/<int:cluster_id>/dismiss', methods=['POST'])
@jwt_required()
def dismiss_duplicate_cluster(cluster_id):
    user_id = get_jwt_identity()

    try:
        result = dismiss_cluster(user_id, cluster_id)
        return jsonify(result), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except LookupError as e:
        return jsonify({'error': str(e)}), 404
    except Exception:
        db.session.rollback()
        return jsonify({'error': 'An unexpected error occurred'}), 500