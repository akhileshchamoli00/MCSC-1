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

    # Generate a unique filename to prevent overwrites
    file_ext = filename.split('.')[-1] if '.' in filename else ''
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    
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
