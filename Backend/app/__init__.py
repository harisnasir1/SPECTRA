from flask import Flask
from .config import Config
from .extensions import db, jwt, bcrypt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    from .routes.auth import auth_bp
    from .routes.products import products_bp
    from .routes.ingest import ingest_bp
    from .routes.duplicates import duplicates_bp
    from .routes.reports import reports_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(ingest_bp, url_prefix='/api/ingest')
    app.register_blueprint(duplicates_bp, url_prefix='/api/duplicates')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')

    return app