import io
import os
import re
import uuid
import zipfile
from typing import Tuple, List, Optional, Set
from PIL import Image, ImageOps
from fastapi import HTTPException, status

# 1. Strictly Blocked / Dangerous Extensions (Never allowed under any circumstances)
DANGEROUS_EXTENSIONS: Set[str] = {
    # Windows / DOS executables & installers
    "exe", "bat", "cmd", "com", "msi", "msp", "scr", "pif", "cpl", "hta", "vbs", "vbe", "wsf", "wsh", "msc", "reg",
    # Scripts & Shells
    "sh", "bash", "zsh", "ps1", "ps1xml", "ps2", "ps2xml", "psc1", "psc2", "py", "pyc", "pyo", "pyd", "rb", "pl", "cgi",
    # Web scripts
    "php", "phtml", "php3", "php4", "php5", "phps", "js", "jse", "jsp", "jspx", "asp", "aspx", "ashx", "asmx",
    # Macro-enabled Office files
    "docm", "dotm", "xlsm", "xltm", "xlam", "pptm", "potm", "ppam", "ppsm", "sldm",
    # Binary libraries / drivers / disk images
    "dll", "sys", "drv", "so", "dylib", "bin", "iso", "img", "dmg", "jar", "class"
}

# 2. Blocked Binary File Signatures (Detects executables disguised with fake extensions)
BLOCKED_BINARY_SIGNATURES: List[Tuple[bytes, str]] = [
    (b"MZ", "DOS/Windows Executable (PE) binary"),
    (b"\x7fELF", "Linux ELF binary"),
    (b"\xfe\xed\xfa\xce", "Mach-O 32-bit binary"),
    (b"\xfe\xed\xfa\xcf", "Mach-O 64-bit binary"),
    (b"\xce\xfa\xed\xfe", "Mach-O binary (reverse byte order)"),
    (b"\xcf\xfa\xed\xfe", "Mach-O binary (reverse byte order)"),
    (b"\xca\xfe\xba\xbe", "Java class file or Mach-O universal binary"),
    (b"<?php", "PHP executable script"),
    (b"<script", "Inline HTML/JS script execution"),
    (b"#!", "Shell/script shebang executable")
]

# 3. Allowed Extensions Categorization
ALLOWED_DOC_EXTS: Set[str] = {"pdf", "docx", "doc", "xlsx", "xls", "csv", "txt", "pptx", "ppt", "odt", "ods", "rtf"}
ALLOWED_IMG_EXTS: Set[str] = {"jpg", "jpeg", "png", "webp", "gif", "bmp", "tiff", "heic", "heif"}
ALLOWED_ARCHIVE_EXTS: Set[str] = {"zip", "rar", "7z"}

ALL_ALLOWED_EXTENSIONS: Set[str] = ALLOWED_DOC_EXTS | ALLOWED_IMG_EXTS | ALLOWED_ARCHIVE_EXTS

# 4. Safe Magic Bytes Signatures for Legitimate Formats
MAGIC_BYTES_MAP = {
    "jpeg": [b"\xFF\xD8\xFF"],
    "png": [b"\x89PNG\r\n\x1a\n"],
    "gif": [b"GIF87a", b"GIF89a"],
    "bmp": [b"BM"],
    "tiff": [b"II*\x00", b"MM\x00*"],
    "pdf": [b"%PDF-"],
    "openxml": [b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08"], # docx, xlsx, pptx, zip
    "ole": [b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"],             # doc, xls, ppt (legacy Microsoft Office)
    "rar": [b"Rar!\x1a\x07\x00", b"Rar!\x1a\x07\x01\x00"],
    "7z": [b"7z\xbc\xaf\x27\x1c"]
}


def sanitize_filename(original_filename: str) -> str:
    """
    Sanitizes raw client-supplied filenames:
    - Removes path traversal sequences (../, ..\\)
    - Strips dangerous control and non-ASCII characters
    - Normalizes double extensions
    """
    if not original_filename:
        return "unnamed_document"
        
    # Get only the base name (strip any folder paths)
    base = os.path.basename(original_filename)
    base = base.replace("/", "_").replace("\\", "_")
    
    # Remove null bytes and control characters
    base = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', base)
    
    # Replace dangerous characters with underscore, preserve dots, hyphens, alphanumeric
    base = re.sub(r'[^a-zA-Z0-9._\- ]', '_', base).strip(' ._')
    
    if not base:
        base = "uploaded_document"
        
    # Check for double extension spoofing (e.g., invoice.pdf.exe)
    parts = base.split('.')
    if len(parts) > 2:
        for part in parts[1:]:
            if part.lower() in DANGEROUS_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Security violation: dangerous extension '.{part}' detected in filename."
                )
                
    return base[:120]


def inspect_zip_safety(file_bytes: bytes) -> None:
    """
    Inspects ZIP archives for security hazards:
    1. Zip Slip (path traversal / writing outside target directory)
    2. Embedded executables or dangerous scripts
    3. Zip Bomb (excessive uncompressed size or compression ratio > 100x)
    """
    try:
        with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
            total_uncompressed_size = 0
            
            for info in zf.infolist():
                filename = info.filename
                
                # Check for Zip Slip path traversal
                if ".." in filename or filename.startswith("/") or filename.startswith("\\"):
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Security violation: ZIP archive contains invalid path traversal references."
                    )
                
                # Check for dangerous nested files
                nested_ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ""
                if nested_ext in DANGEROUS_EXTENSIONS:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Security violation: ZIP archive contains forbidden executable/script file '{filename}'."
                    )
                    
                total_uncompressed_size += info.file_size
                
                # Zip Bomb check: Individual member ratio
                if info.compress_size > 0 and (info.file_size / info.compress_size) > 100:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Security violation: Suspected decompression bomb in ZIP archive."
                    )
                    
            # Total uncompressed size limit (250MB maximum safety cap)
            if total_uncompressed_size > 250 * 1024 * 1024:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Security violation: Uncompressed archive size exceeds safety limit (250MB)."
                )
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded ZIP archive is corrupted or invalid."
        )


def validate_file_security(
    file_bytes: bytes,
    original_filename: str,
    max_size_mb: int = 50,
    allowed_category: str = "all", # "document", "image", "all"
    strip_image_exif: bool = True
) -> Tuple[bytes, str]:
    """
    Comprehensive Server-Side File Security Validation:
    1. Rejects empty files and files exceeding size limit.
    2. Sanitizes filename against path traversal & multi-extension injection.
    3. Blocks dangerous extensions (exe, bat, sh, php, js, vbs, docm, xlsm, etc.).
    4. Scans magic bytes against known binary/malware headers.
    5. Validates file header against declared extension (detects disguised payloads).
    6. Deeply inspects ZIP archives for nested malware & Zip Slip.
    7. Strips EXIF metadata and re-encodes images.
    
    Returns (cleaned_bytes, safe_filename).
    """
    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty."
        )

    # 1. File Size Check
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > max_size_mb:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size ({size_mb:.1f} MB) exceeds maximum allowed limit of {max_size_mb} MB."
        )

    # 2. Filename Sanitization & Extension Extraction
    safe_filename = sanitize_filename(original_filename)
    ext = safe_filename.rsplit('.', 1)[-1].lower() if '.' in safe_filename else ""

    if not ext:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must have a valid file extension (e.g. .pdf, .docx, .jpg)."
        )

    # 3. Extension Check
    if ext in DANGEROUS_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Security violation: File type '.{ext}' is strictly prohibited for security reasons."
        )

    if allowed_category == "image" and ext not in ALLOWED_IMG_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image format. Allowed image formats: {', '.join(sorted(ALLOWED_IMG_EXTS)).upper()}."
        )
    elif allowed_category == "document" and ext not in ALLOWED_DOC_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid document format. Allowed document formats: {', '.join(sorted(ALLOWED_DOC_EXTS)).upper()}."
        )
    elif ext not in ALL_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '.{ext}'. Supported types include PDF, Office documents, Images, and ZIP archives."
        )

    # 4. Binary Malware Signatures Check
    header_1024 = file_bytes[:1024]
    for bad_sig, desc in BLOCKED_BINARY_SIGNATURES:
        if header_1024.startswith(bad_sig) or (bad_sig in header_1024 and bad_sig in [b"<?php", b"<script", b"#!"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: File header matches blocked executable format ({desc})."
            )

    # 5. Magic Bytes Matching for Declared Extensions
    if ext in ["jpg", "jpeg"]:
        if not file_bytes.startswith(b"\xFF\xD8\xFF"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: File claims to be JPEG but file signature does not match."
            )
    elif ext == "png":
        if not file_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: File claims to be PNG but file signature does not match."
            )
    elif ext == "webp":
        if not (file_bytes.startswith(b"RIFF") and b"WEBP" in file_bytes[:16]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: File claims to be WebP but file signature does not match."
            )
    elif ext == "pdf":
        # PDF signature %PDF- should appear in the first 1024 bytes
        if b"%PDF-" not in header_1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: File claims to be PDF but valid %PDF- signature was not found."
            )
    elif ext in ["docx", "xlsx", "pptx", "zip"]:
        if not (file_bytes.startswith(b"PK\x03\x04") or file_bytes.startswith(b"PK\x05\x06") or file_bytes.startswith(b"PK\x07\x08")):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: File claims to be .{ext} but OpenXML/ZIP archive header is missing."
            )
        # Deep inspection for ZIP archives
        if ext == "zip":
            inspect_zip_safety(file_bytes)
    elif ext in ["doc", "xls", "ppt"]:
        if not file_bytes.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Security violation: File claims to be legacy Office file (.{ext}) but OLE signature is missing."
            )
    elif ext in ["csv", "txt"]:
        # Verify text files don't contain binary null bytes or shellcode
        if b"\x00" in header_1024:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security violation: Text/CSV file contains invalid binary content or null bytes."
            )

    # 6. Image Sanitization & EXIF Stripping
    if strip_image_exif and ext in ["jpg", "jpeg", "png", "webp"]:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image = ImageOps.exif_transpose(image)
            
            if ext in ["jpg", "jpeg"] and image.mode in ("RGBA", "P", "LA"):
                image = image.convert("RGB")
                
            out_buffer = io.BytesIO()
            if ext in ["jpg", "jpeg"]:
                image.save(out_buffer, format="JPEG", quality=90, optimize=True)
            elif ext == "png":
                image.save(out_buffer, format="PNG", optimize=True)
            elif ext == "webp":
                image.save(out_buffer, format="WEBP", quality=90)
                
            file_bytes = out_buffer.getvalue()
        except Exception as img_err:
            # If PIL fails to parse an image that claimed to be jpg/png, reject it as malformed
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Corrupted or malicious image structure detected: {img_err}"
            )

    return file_bytes, safe_filename


def validate_and_sanitize_file(
    file_bytes: bytes, 
    original_filename: str, 
    allowed_types: Optional[List[str]] = None,
    strip_exif: bool = True
) -> Tuple[bytes, str]:
    """
    Backwards-compatible wrapper that applies full security validation.
    """
    cleaned_bytes, safe_name = validate_file_security(
        file_bytes=file_bytes,
        original_filename=original_filename,
        max_size_mb=50,
        allowed_category="all",
        strip_image_exif=strip_exif
    )
    
    # If specific allowed_types list was requested, enforce it
    if allowed_types:
        ext = safe_name.rsplit('.', 1)[-1].lower() if '.' in safe_name else ""
        norm_allowed = {t.lower().replace('.', '').replace('jpeg', 'jpg') for t in allowed_types}
        norm_ext = ext.replace('jpeg', 'jpg')
        if norm_ext not in norm_allowed and ext not in allowed_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type '.{ext}'. Allowed types: {', '.join(allowed_types)}."
            )
            
    # Generate secure storage filename with random suffix
    safe_base = re.sub(r'[^a-zA-Z0-9_]', '_', safe_name.rsplit('.', 1)[0])[:30]
    unique_suffix = uuid.uuid4().hex[:8]
    ext = safe_name.rsplit('.', 1)[-1].lower() if '.' in safe_name else "dat"
    secure_filename = f"{safe_base}_{unique_suffix}.{ext}"
    
    return cleaned_bytes, secure_filename

