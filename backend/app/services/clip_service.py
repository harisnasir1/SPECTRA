# app/services/clip_service.py
import torch
import open_clip
from PIL import Image
import requests
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor


class CLIPService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(
            'ViT-L-14',
            pretrained='laion2b_s32b_b82k'
        )
        self.tokenizer = open_clip.get_tokenizer('ViT-L-14')
        self.model.to(self.device)
        self.model.eval()
        self._initialized = True

        print(f"[CLIP] Model loaded on {self.device}")

    def encode_image(self, image_url: str):
        """Download image from URL and return a 768-dim vector as a list of floats"""
        # Download the image bytes
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()

        # Open as PIL image, convert to RGB (CLIP expects RGB, some images are RGBA/grayscale)
        image = Image.open(BytesIO(response.content)).convert('RGB')

        # Preprocess: resize, center crop, normalize — whatever ViT-L-14 expects
        # unsqueeze(0) adds a batch dimension: [3, 224, 224] → [1, 3, 224, 224]
        image_tensor = self.preprocess(image).unsqueeze(0).to(self.device)

        # No gradient tracking — we're not training, just extracting features
        with torch.no_grad():
            vector = self.model.encode_image(image_tensor)

        # L2 normalize — required for cosine similarity to work correctly
        vector = vector / vector.norm(dim=-1, keepdim=True)

        # Convert: torch tensor → numpy array → flat list of floats (pgvector needs this)
        return vector.cpu().numpy().flatten().tolist()

    def encode_text(self, text: str):
        """Encode a text string and return a 768-dim vector as a list of floats"""
        # Tokenize: converts string to   IDs that the model understands
        # Wrapping in list because tokenizer expects a batch: ["some text"]
        tokens = self.tokenizer([text]).to(self.device)

        with torch.no_grad():
            vector = self.model.encode_text(tokens)

        vector = vector / vector.norm(dim=-1, keepdim=True)

        return vector.cpu().numpy().flatten().tolist()

    def _download_image(self, url: str) -> Image.Image | None:
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            return Image.open(BytesIO(response.content)).convert('RGB')
        except Exception as e:
            print(f"[CLIP] skipping image, download failed ({url}): {e}")
            return None

    def encode_images_batch(self, image_urls: list[str]) -> list[list[float] | None]:
        """
        Download images in parallel then encode the successful ones in a single
        forward pass. Returns a list aligned with image_urls — None for any URL
        that failed to download or open.
        """
        with ThreadPoolExecutor() as executor:
            images = list(executor.map(self._download_image, image_urls))

        # Separate good images and remember their original positions
        good_indices = [i for i, img in enumerate(images) if img is not None]
        if not good_indices:
            return [None] * len(image_urls)

        tensors = torch.stack(
            [self.preprocess(images[i]) for i in good_indices]
        ).to(self.device)

        with torch.no_grad():
            vectors = self.model.encode_image(tensors)

        vectors = vectors / vectors.norm(dim=-1, keepdim=True)
        vector_list = vectors.cpu().numpy().tolist()

        # Re-align results with the original input list
        result = [None] * len(image_urls)
        for out_idx, orig_idx in enumerate(good_indices):
            result[orig_idx] = vector_list[out_idx]

        return result

    def encode_texts_batch(self, texts: list[str]) -> list[list[float]]:
        """Encode multiple texts in a single forward pass."""
        tokens = self.tokenizer(texts).to(self.device)

        with torch.no_grad():
            vectors = self.model.encode_text(tokens)

        vectors = vectors / vectors.norm(dim=-1, keepdim=True)
        return vectors.cpu().numpy().tolist()

    def build_text_input(self, product) -> str:
        """
        Combine product fields into one string for encoding.
        Uses pipe separator so CLIP treats them as distinct concepts
        rather than one run-on sentence.
        
        Truncates description at 200 chars — CLIP's text encoder 
        has a 77 token limit anyway, anything longer gets cut off.
        """
        parts = []
        if product.Title:
            parts.append(product.Title)
        if product.Brand:
            parts.append(product.Brand)
        if product.Description:
            parts.append(product.Description[:200])
        return " | ".join(parts)
    
    def cosine_similarity(self, vector_a: list[float], vector_b: list[float]) -> float:
        """
        Compute cosine similarity between two vectors.
        Returns a float between -1 and 1 (for normalized vectors, 0 to 1).
        """
        a = torch.tensor(vector_a)
        b = torch.tensor(vector_b)
    
        score = torch.nn.functional.cosine_similarity(a.unsqueeze(0), b.unsqueeze(0))
    
        return round(score.item(), 4)
    
    def combine_similarity(slef,image_vector:list[float],text_vector:list[float]) ->float:
         combine_score=(image_vector*0.6)+(text_vector*0.4)
         return combine_score