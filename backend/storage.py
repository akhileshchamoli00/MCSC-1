import os
from supabase import create_client, Client
from fastapi import UploadFile
import uuid
import tempfile
import shutil

# Read from env (which is populated via dotenv in database.py or main.py)
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None

def upload_file_to_supabase(file: UploadFile, bucket: str, path_prefix: str) -> str:
    """
    Uploads a file to a Supabase storage bucket.
    Returns the public URL of the uploaded file.
    """
    if not supabase:
        raise Exception("Supabase is not configured.")

    ext = file.filename.split(".")[-1]
    filename = f"{path_prefix}_{uuid.uuid4().hex[:12]}.{ext}"
    
    # Save upload file to a temp file first, as supabase-py expects a file path or bytes
    with tempfile.NamedTemporaryFile(delete=False) as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_file_path = temp_file.name

    try:
        # Check if bucket exists, if not this might fail depending on permissions, but usually buckets are created in dashboard
        # Upload file
        res = supabase.storage.from_(bucket).upload(filename, temp_file_path)
        
        # Get public URL
        public_url = supabase.storage.from_(bucket).get_public_url(filename)
        return public_url
    finally:
        os.remove(temp_file_path)
