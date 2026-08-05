import os
import uuid
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables from .env.local
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local'))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize the Supabase client if credentials exist
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def upload_file_to_supabase(file_bytes: bytes, filename: str, bucket_name: str = "hrms-documents") -> str:
    """
    Uploads a file (bytes) to Supabase Storage and returns its signed URL or public URL.
    """
    if not supabase:
        print("Warning: SUPABASE_URL or SUPABASE_KEY is missing. Cannot upload to Supabase.")
        return f"/uploads/{filename}"

    # Use the provided filename as it's already sanitized and unique
    unique_filename = filename
    
    try:
        # Upload the file to the specified bucket
        supabase.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": "application/octet-stream"}
        )
        # Return stored path directly (signed URL will be generated dynamically on read)
        return unique_filename
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        raise e

def upload_public_file_to_supabase(file_bytes: bytes, filename: str, bucket_name: str = "profile-photos") -> str:
    """
    Uploads a public asset (e.g. profile photo or logo) to Supabase Public Bucket and returns permanent public URL.
    """
    if not supabase:
        print("Warning: SUPABASE_URL or SUPABASE_KEY is missing. Cannot upload to Supabase.")
        return f"/uploads/{filename}"

    try:
        supabase.storage.from_(bucket_name).upload(
            path=filename,
            file=file_bytes,
            file_options={"content-type": "image/jpeg"}
        )
        return supabase.storage.from_(bucket_name).get_public_url(filename)
    except Exception as e:
        print(f"Error uploading public file to Supabase: {e}")
        try:
            return supabase.storage.from_(bucket_name).get_public_url(filename)
        except Exception:
            raise e

def get_signed_file_url(file_url_or_path: str, bucket_name: str = "hrms-documents", expires_in: int = 3600) -> str:
    """
    Generates a temporary signed URL (valid for `expires_in` seconds, default 1 hr)
    for private bucket files.
    """
    if not supabase or not file_url_or_path:
        return file_url_or_path or ""

    if file_url_or_path.startswith("/uploads/") or "/profile-photos/" in file_url_or_path or bucket_name == "profile-photos":
        return file_url_or_path

    try:
        # Extract relative path inside bucket if full URL is passed
        file_path = file_url_or_path
        if f"/{bucket_name}/" in file_url_or_path:
            file_path = file_url_or_path.split(f"/{bucket_name}/")[-1].split("?")[0]
        elif file_url_or_path.startswith("http"):
            file_path = file_url_or_path.split("/")[-1].split("?")[0]

        res = supabase.storage.from_(bucket_name).create_signed_url(file_path, expires_in)
        if isinstance(res, dict):
            return res.get("signedUrl") or res.get("signed_url") or file_url_or_path
        elif hasattr(res, "signed_url"):
            return getattr(res, "signed_url")
        elif hasattr(res, "get"):
            return res.get("signedUrl") or res.get("signed_url") or file_url_or_path
        return file_url_or_path
    except Exception as e:
        print(f"Error generating signed URL: {e}")
        return file_url_or_path

def delete_file_from_supabase(file_url: str, bucket_name: str = "hrms-documents") -> bool:
    """
    Deletes a file from Supabase Storage given its URL or file path.
    """
    if not supabase or not file_url:
        print("Warning: Missing Supabase credentials or file_url.")
        return False

    try:
        if f"/{bucket_name}/" in file_url:
            file_path = file_url.split(f"/{bucket_name}/")[-1].split("?")[0]
            supabase.storage.from_(bucket_name).remove([file_path])
            return True
        elif not file_url.startswith("http"):
            supabase.storage.from_(bucket_name).remove([file_url.split("?")[0]])
            return True
        return False
    except Exception as e:
        print(f"Error deleting from Supabase: {e}")
        return False
