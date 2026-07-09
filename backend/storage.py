import os
import uuid
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Initialize the Supabase client if credentials exist
if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def upload_file_to_supabase(file_bytes: bytes, filename: str, bucket_name: str = "hrms-documents") -> str:
    """
    Uploads a file (bytes) to Supabase Storage and returns its public URL.
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
        # Retrieve and return the public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
        return public_url
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
        raise e

def delete_file_from_supabase(file_url: str, bucket_name: str = "hrms-documents") -> bool:
    """
    Deletes a file from Supabase Storage given its public URL.
    """
    if not supabase or not file_url:
        print("Warning: Missing Supabase credentials or file_url.")
        return False

    try:
        if f"/{bucket_name}/" in file_url:
            file_path = file_url.split(f"/{bucket_name}/")[-1]
            supabase.storage.from_(bucket_name).remove([file_path])
            return True
        return False
    except Exception as e:
        print(f"Error deleting from Supabase: {e}")
        return False
