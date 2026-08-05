import io
import uuid
import re
from typing import Tuple, List
from PIL import Image, ImageOps
from fastapi import HTTPException, status

# Magic byte signatures for server-side file type validation
ALLOWED_MAGIC_BYTES = {
    "jpeg": [b"\xFF\xD8\xFF"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "pdf": [b"%PDF-"]
}

def validate_and_sanitize_file(
    file_bytes: bytes, 
    original_filename: str, 
    allowed_types: List[str] = ["jpeg", "png", "pdf"],
    strip_exif: bool = True
) -> Tuple[bytes, str]:
    """
    1. Validates magic byte signature (detects spoofed file extensions).
    2. Randomizes filename with secure UUID.
    3. Strips EXIF metadata (GPS/camera info) & re-encodes images if strip_exif=True.
    Returns (sanitized_bytes, secure_filename).
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # 1. Magic Bytes Validation
    detected_type = None
    for file_type in allowed_types:
        signatures = ALLOWED_MAGIC_BYTES.get(file_type, [])
        for sig in signatures:
            if file_bytes.startswith(sig):
                detected_type = file_type
                break
        if detected_type:
            break

    if not detected_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted file format. Allowed types: {', '.join(allowed_types).upper()}."
        )

    # 2. Secure Filename Randomization
    ext = "jpg" if detected_type == "jpeg" else detected_type
    safe_orig_name = re.sub(r'[^a-zA-Z0-9_]', '_', original_filename.rsplit('.', 1)[0])[:30]
    unique_suffix = uuid.uuid4().hex[:8]
    secure_filename = f"{safe_orig_name}_{unique_suffix}.{ext}"

    # 3. EXIF Metadata Stripping & Image Re-encoding
    if strip_exif and detected_type in ["jpeg", "png"]:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            
            # Correct orientation based on EXIF before stripping
            image = ImageOps.exif_transpose(image)
            
            # Convert palette/transparent modes to RGB for JPEG
            if detected_type == "jpeg" and image.mode in ("RGBA", "P", "LA"):
                image = image.convert("RGB")
            
            out_buffer = io.BytesIO()
            # Saving image without info/exif dict automatically strips all metadata
            if detected_type == "jpeg":
                image.save(out_buffer, format="JPEG", quality=85, optimize=True)
            else:
                image.save(out_buffer, format="PNG", optimize=True)
                
            file_bytes = out_buffer.getvalue()
        except Exception as e:
            print(f"Warning: Image sanitization failed: {e}")

    return file_bytes, secure_filename
