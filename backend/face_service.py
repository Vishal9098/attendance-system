import face_recognition
import numpy as np
import base64
import cv2
from io import BytesIO
from PIL import Image

def decode_base64_image(b64_string: str) -> np.ndarray:
    """Decode base64 image to numpy array."""
    if "," in b64_string:
        b64_string = b64_string.split(",")[1]
    img_bytes = base64.b64decode(b64_string)
    img_array = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

def encode_face(b64_image: str) -> list:
    """Extract face encoding from base64 image."""
    img = decode_base64_image(b64_image)
    encodings = face_recognition.face_encodings(img)
    if not encodings:
        raise ValueError("No face detected in image. Please ensure your face is clearly visible.")
    return encodings[0].tolist()

def compare_faces(stored_encoding: list, live_b64: str, tolerance: float = 0.5) -> dict:
    """
    Compare stored face encoding with live capture.
    Returns dict with matched (bool) and confidence (float).
    """
    stored = np.array(stored_encoding)
    live_img = decode_base64_image(live_b64)
    live_encodings = face_recognition.face_encodings(live_img)

    if not live_encodings:
        return {"matched": False, "confidence": 0.0, "error": "No face detected in live image"}

    live_enc = live_encodings[0]
    distance = face_recognition.face_distance([stored], live_enc)[0]
    matched = bool(distance <= tolerance)
    confidence = round((1 - distance) * 100, 2)

    return {
        "matched": matched,
        "confidence": confidence,
        "distance": round(float(distance), 4)
    }

def anti_spoofing_check(b64_image: str) -> bool:
    """
    Basic liveness check using image variance.
    Real faces have more texture variation than printed photos.
    """
    img = decode_base64_image(b64_image)
    gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    # Low variance = likely printed photo
    return laplacian_var > 80