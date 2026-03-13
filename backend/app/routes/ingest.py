from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.repositories.Sdata_repo import get_products_by_ids, get_products_without_embeddings
from app.repositories.embedding_repo import bulk_insert_embeddings
from app.services.clip_service import CLIPService
from app.services.duplicate_service import detect_duplicates

ingest_bp = Blueprint('ingest', __name__)
clip = CLIPService()

@ingest_bp.route('/test', methods=['POST'])
def Test():
    data = request.get_json()

    id1 = data.get('id1')
    id2 = data.get('id2')

    if not id1 or not id2:
        return jsonify({'error': 'Both id1 and id2 are required'}), 400

    try:
        products = get_products_by_ids(id1, id2)
        
        for product in products:
            if not product.images:
                return jsonify({'error': f"Product {product.Id} has no images"}), 400

        urls = [p.images[0].Url for p in products]
        texts = [clip.build_text_input(p) for p in products]

        vectors = clip.encode_images_batch(urls)
        vtext = clip.encode_texts_batch(texts)

        score = clip.cosine_similarity(vectors[0], vectors[1])
        textscore=clip.cosine_similarity(vtext[0],vtext[1])
        final_score=clip.combine_similarity(score,textscore)
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except LookupError as e:
        return jsonify({'error': str(e)}), 404

    return jsonify({
    'image_similarity': score,
    'text_similarity': textscore,
    'final_score': round(final_score, 4)
     }), 200


# Batch size tuned for ViT-L-14 on CPU — 8 images per forward pass is a safe
# balance between throughput and RAM usage (~2–3 GB peak per batch).
BATCH_SIZE = 8


@ingest_bp.route('/sync', methods=['POST'])
@jwt_required()
def sync_embeddings():
    user_id = get_jwt_identity()

    products = get_products_without_embeddings(limit=100)

    if not products:
        return jsonify({'message': 'All products already have embeddings', 'synced': 0}), 200

    records = []

    for i in range(0, len(products), BATCH_SIZE):
        batch = products[i:i + BATCH_SIZE]

        urls = [p.images[0].Url for p in batch]
        texts = [clip.build_text_input(p) for p in batch]

        image_vectors = clip.encode_images_batch(urls)
        text_vectors = clip.encode_texts_batch(texts)

        for product, img_vec, txt_vec in zip(batch, image_vectors, text_vectors):
            records.append({
                'SdataId': product.Id,
                'UserId': user_id,
                'ImageVector': img_vec,
                'TextVector': txt_vec,
            })

    count = bulk_insert_embeddings(records)

    clusters = detect_duplicates(user_id)

    return jsonify({'message': 'Sync complete', 'synced': count, 'clusters': clusters}), 200
