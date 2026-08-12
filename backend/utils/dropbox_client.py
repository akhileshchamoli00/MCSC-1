import dropbox
import os
from dropbox.exceptions import ApiError, AuthError
from dotenv import load_dotenv

load_dotenv()

def get_dropbox_client():
    refresh_token = os.getenv("DROPBOX_REFRESH_TOKEN")
    app_key = os.getenv("DROPBOX_APP_KEY")
    app_secret = os.getenv("DROPBOX_APP_SECRET")
    access_token = os.getenv("DROPBOX_ACCESS_TOKEN")
    
    if refresh_token and app_key and app_secret:
        return dropbox.Dropbox(
            oauth2_refresh_token=refresh_token,
            app_key=app_key,
            app_secret=app_secret
        )
    elif access_token:
        return dropbox.Dropbox(access_token)
    else:
        raise ValueError("Dropbox credentials (DROPBOX_REFRESH_TOKEN, DROPBOX_APP_KEY, DROPBOX_APP_SECRET) not found in environment")

def list_folder(path: str = ""):
    """List contents of a Dropbox folder."""
    dbx = get_dropbox_client()
    try:
        # Dropbox expects "" for root folder instead of "/"
        if path == "/":
            path = ""
        res = dbx.files_list_folder(path)
        items = []
        for entry in res.entries:
            items.append({
                "name": entry.name,
                "path_lower": entry.path_lower,
                "path_display": entry.path_display,
                "type": "folder" if isinstance(entry, dropbox.files.FolderMetadata) else "file",
                "size": getattr(entry, "size", 0),
                "client_modified": entry.client_modified.isoformat() if hasattr(entry, "client_modified") else None
            })
        return {"success": True, "items": items}
    except ApiError as err:
        return {"success": False, "error": str(err)}
    except AuthError:
        return {"success": False, "error": "Invalid Dropbox authentication token"}

def upload_file(file_bytes: bytes, destination_path: str):
    """Upload a file to Dropbox."""
    dbx = get_dropbox_client()
    try:
        res = dbx.files_upload(
            file_bytes, 
            destination_path, 
            mode=dropbox.files.WriteMode("overwrite")
        )
        return {"success": True, "path": res.path_display}
    except ApiError as err:
        return {"success": False, "error": str(err)}

def get_temporary_link(path: str):
    """Get a temporary link to download a file."""
    dbx = get_dropbox_client()
    try:
        res = dbx.files_get_temporary_link(path)
        return {"success": True, "link": res.link}
    except ApiError as err:
        return {"success": False, "error": str(err)}

def delete_path(path: str):
    """Delete a file or folder in Dropbox."""
    dbx = get_dropbox_client()
    try:
        res = dbx.files_delete_v2(path)
        return {"success": True, "path": res.metadata.path_display}
    except ApiError as err:
        return {"success": False, "error": str(err)}

def create_folder(path: str):
    """Create a new folder in Dropbox."""
    dbx = get_dropbox_client()
    try:
        res = dbx.files_create_folder_v2(path)
        return {"success": True, "path": res.metadata.path_display}
    except ApiError as err:
        return {"success": False, "error": str(err)}
