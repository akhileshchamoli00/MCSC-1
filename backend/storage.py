import os
import uuid
import shutil
from dotenv import load_dotenv

# Load environment variables from .env.local / .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

# Persistent upload directory outside the codebase on AWS, or local uploads in development
DEFAULT_UPLOAD_DIR = "/var/data/mcsc/uploads" if os.name != "nt" and os.path.exists("/var/data") else os.path.join(os.path.dirname(__file__), "uploads")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", DEFAULT_UPLOAD_DIR)

# Ensure base upload directories exist
for subfolder in [
    "profile-photos",
    "logos",
    "documents",
    "hrms-documents",
    "client-documents",
    "client_documents",
    "chat_attachments",
]:
    try:
        os.makedirs(os.path.join(UPLOAD_DIR, subfolder), exist_ok=True)
    except Exception:
        pass


def save_file_locally(file_bytes: bytes, filename: str, subfolder: str = "documents") -> str:
    """
    Saves binary content to the persistent disk storage outside the code repository.
    Sanitizes filename and prevents directory traversal attacks.
    Returns the public web URL path: `/uploads/<subfolder>/<filename>`.
    """
    clean_subfolder = os.path.basename(subfolder.replace("\\", "/").strip().rstrip("/")) or "documents"
    clean_filename = os.path.basename(filename.replace("\\", "/").strip())
    if not clean_filename:
        clean_filename = f"file_{uuid.uuid4().hex[:12]}"

    target_dir = os.path.abspath(os.path.join(UPLOAD_DIR, clean_subfolder))
    base_upload_dir = os.path.abspath(UPLOAD_DIR)

    # Path traversal validation guard
    if not target_dir.startswith(base_upload_dir):
        target_dir = os.path.abspath(os.path.join(UPLOAD_DIR, "documents"))

    os.makedirs(target_dir, exist_ok=True)
    file_path = os.path.abspath(os.path.join(target_dir, clean_filename))

    if not file_path.startswith(base_upload_dir):
        raise ValueError("Invalid file destination path")

    with open(file_path, "wb") as f:
        f.write(file_bytes)
    return f"/uploads/{clean_subfolder}/{clean_filename}"


def upload_file(file_bytes: bytes, filename: str, bucket_name: str = "hrms-documents") -> str:
    """
    Uploads a file directly to persistent disk storage.
    """
    return save_file_locally(file_bytes, filename, bucket_name)


def upload_public_file(file_bytes: bytes, filename: str, bucket_name: str = "profile-photos") -> str:
    """
    Uploads a public asset (e.g. profile photo or company logo) directly to persistent disk storage.
    """
    return save_file_locally(file_bytes, filename, bucket_name)


def get_file_url(file_url_or_path: str, bucket_name: str = "hrms-documents", expires_in: int = 900) -> str:
    """
    Returns the URL path for accessing the file.
    """
    if not file_url_or_path:
        return ""
    return file_url_or_path


def delete_file(file_url: str, bucket_name: str = "hrms-documents") -> bool:
    """
    Deletes a file from persistent disk storage.
    Validates destination path to prevent path traversal deletions.
    """
    if not file_url:
        return False

    if file_url.startswith("/uploads/"):
        rel_path = file_url.replace("/uploads/", "").lstrip("/\\")
        base_upload_dir = os.path.abspath(UPLOAD_DIR)
        local_path = os.path.abspath(os.path.join(UPLOAD_DIR, rel_path))
        
        # Verify local path is strictly within base upload dir
        if not local_path.startswith(base_upload_dir):
            return False

        if os.path.exists(local_path) and os.path.isfile(local_path):
            try:
                os.remove(local_path)
                return True
            except Exception as e:
                print(f"Error removing local file {local_path}: {e}")
                return False
    return False


# Legacy function aliases for seamless backward compatibility across routers
upload_file_to_supabase = upload_file
upload_public_file_to_supabase = upload_public_file
get_signed_file_url = get_file_url
delete_file_from_supabase = delete_file

