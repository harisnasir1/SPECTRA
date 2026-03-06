from flask import Blueprint, request, jsonify
from app.services.auth_service import register_user, login_user

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name')
    email = data.get('email')
    password = data.get('password')

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email and password are required'}), 400

    result, error = register_user(name, email, password)
    if error:
        return jsonify({'error': error}), 409

    return jsonify(result), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return jsonify({'error': 'No data provided'}), 400

    email = data.get('email')
    password = data.get('password')

    if not all([email, password]):
        return jsonify({'error': 'Email and password are required'}), 400

    result, error = login_user(email, password)
    if error:
        return jsonify({'error': error}), 401

    return jsonify(result), 200