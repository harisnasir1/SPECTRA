from flask import Blueprint,request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.product import Product
from app.repositories.Sdata_repo import get_products_paginated
products_bp = Blueprint('products', __name__)

@products_bp.route('/', methods=['GET'])
@jwt_required()
def get_products():
    user_id = get_jwt_identity()
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    brand=request.args.get('brand',None,type=str)
    type=request.args.get('type',None,type=str)
    q=request.args.get('q',None,type=str)
    
    products, total = get_products_paginated(user_id,page,per_page,brand,q)

    result = []
    for p in products:
        d = p.to_dict()
        d['images'] = [img.to_dict() for img in p.images]
        d['hasEmbedding'] = p.embedding is not None
        result.append(d)

    return jsonify({
        'products': result,
        'total': total,
        'page': page,
        'per_page': per_page,
        'pages': (total + per_page - 1) // per_page
    }), 200
