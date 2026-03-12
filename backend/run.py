from app import create_app
from app.extensions import db,migrate

app = create_app()

with app.app_context():
    from app.models.user import User
    from app.models.product import Product
    from app.models.product_image import ProductImage
    from app.models.product_variant import ProductVariant
    from app.models.embedding import Embedding
    from app.models.duplicate import DuplicatePair
    migrate.init_app(app, db)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True,use_reloader=True)