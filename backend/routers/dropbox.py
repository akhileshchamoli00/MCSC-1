from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Optional, List
import models
import auth
import utils.dropbox_client as dbx_client

router = APIRouter(
    prefix="/api/dropbox",
    tags=["dropbox"],
    responses={404: {"description": "Not found"}},
)

@router.get("/list")
async def list_files(path: str = "", current_user: models.User = Depends(auth.get_current_user)):
    """List files in a given Dropbox path."""
    res = dbx_client.list_folder(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to list folder"))
    return res

@router.post("/upload")
async def upload_file(
    path: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Upload a file to a specific path in Dropbox."""
    contents = await file.read()
    destination_path = f"{path.rstrip('/')}/{file.filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:] # clean up double slashes
        
    res = dbx_client.upload_file(contents, destination_path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to upload file"))
    return res

@router.post("/folder")
async def create_folder(path: str = Form(...), current_user: models.User = Depends(auth.get_current_user)):
    """Create a new folder."""
    res = dbx_client.create_folder(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to create folder"))
    return res

@router.get("/download")
async def get_download_link(path: str, current_user: models.User = Depends(auth.get_current_user)):
    """Get a temporary direct link to download or preview a file."""
    res = dbx_client.get_temporary_link(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to get download link"))
    return res

@router.delete("/delete")
async def delete_item(path: str, current_user: models.User = Depends(auth.get_current_user)):
    """Delete a file or folder from Dropbox."""
    res = dbx_client.delete_path(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to delete item"))
    return {"message": f"Successfully deleted {path}"}
