from app import db, bcrypt
from app.models.user import User
from flask_jwt_extended import create_access_token
import uuid

def register_user(name, email, password):
    # Check if email already exists
    existing = User.query.filter_by(Email=email).first()
    if existing:
        return None, 'Email already registered'

    hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')

    user = User(
        Id=uuid.uuid4(),
        Name=name,
        Email=email,
        Password=hashed_pw,
        Role='user'
    )

    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.Id))
    return {'token': token, 'user': user.to_dict()}, None


def login_user(email, password):
    user = User.query.filter_by(Email=email).first()

    if not user:
        return None, 'Invalid email or password'

    if not bcrypt.check_password_hash(user.Password, password):
        return None, 'Invalid email or password'

    token = create_access_token(identity=str(user.Id))
    return {'token': token, 'user': user.to_dict()}, None