from flask import Blueprint, request, jsonify
from app.repositories.Sdata_repo import get_products_by_ids
from app.services.clip_service import CLIPService

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
