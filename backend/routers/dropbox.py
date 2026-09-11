from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from typing import Optional, List
from sqlalchemy.orm import Session
import os
import models
import auth
import database
import utils.dropbox_client as dbx_client

router = APIRouter(
    prefix="/api/dropbox",
    tags=["dropbox"],
    responses={404: {"description": "Not found"}},
)

def is_invoice_path_or_item(path_or_name: str) -> bool:
    """Checks if a Dropbox path or item name corresponds to an Invoice folder or invoice file."""
    if not path_or_name:
        return False
    normalized = path_or_name.replace("\\", "/").strip().lower()
    parts = [p.strip() for p in normalized.split("/") if p.strip()]
    for part in parts:
        if (
            part in ("invoice", "invoices") 
            or part.startswith("invoice_") 
            or part.startswith("invoices_") 
            or "invoice" in part
        ):
            return True
    return False

def check_invoice_permission(user: models.User, action: str, db: Session) -> bool:
    """
    Checks whether the user has permission to perform an action on invoice documents.
    Super Admins and Admins always have full access.
    Clients/Members have read/view access to their own files.
    Other roles require explicit permission on 'clients_documents_invoices'.
    """
    if auth.is_super_admin(user):
        return True
    
    # Check for direct permission code (e.g. view, download, create, delete)
    if auth.has_permission(user, "clients_documents_invoices", action, db):
        return True
        
    # 'view' permission also grants read/download capability
    if action in ("download", "view") and auth.has_permission(user, "clients_documents_invoices", "view", db):
        return True
        
    # If user is client role, allow read/view access
    if action in ("download", "view") and user.role and user.role.name.strip().upper() in ("CLIENT", "MEMBER"):
        return True
        
    return False

@router.get("/list")
async def list_files(
    path: str = "", 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """List files in a given Dropbox path with dynamic RBAC filtering on invoice folders/files."""
    can_view_invoices = check_invoice_permission(current_user, "view", db)
    
    # If user lacks invoice permission and attempts to directly list an invoice folder, return empty items
    if not can_view_invoices and is_invoice_path_or_item(path):
        return {
            "success": True,
            "path": path,
            "items": []
        }

    res = dbx_client.list_folder(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to list folder"))
        
    # Filter out invoice items for unauthorized roles
    if not can_view_invoices and "items" in res and isinstance(res["items"], list):
        filtered_items = []
        for item in res["items"]:
            item_name = item.get("name", "")
            item_path = item.get("path_lower", "") or item.get("path_display", "")
            if is_invoice_path_or_item(item_name) or is_invoice_path_or_item(item_path):
                continue
            filtered_items.append(item)
        res["items"] = filtered_items

    return res

@router.post("/upload")
async def upload_file(
    path: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Upload a file to a specific path in Dropbox."""
    destination_path = f"{path.rstrip('/')}/{file.filename}"
    if destination_path.startswith("//"):
        destination_path = destination_path[1:] # clean up double slashes
        
    if is_invoice_path_or_item(destination_path) and not check_invoice_permission(current_user, "create", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to upload invoice documents."
        )
        
    contents = await file.read()
    res = dbx_client.upload_file(contents, destination_path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to upload file"))
    return res

@router.post("/folder")
async def create_folder(
    path: str = Form(...), 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Create a new folder."""
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "create", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to create invoice folders."
        )
        
    res = dbx_client.create_folder(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to create folder"))
    return res

@router.get("/download")
async def get_download_link(
    path: str, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a temporary direct link to download or preview a file."""
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "download", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to view or download invoice documents."
        )
        
    res = dbx_client.get_temporary_link(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to get download link"))
    return res

@router.delete("/delete")
async def delete_item(
    path: str, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete a file or folder from Dropbox."""
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "delete", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to delete invoice documents."
        )
        
    res = dbx_client.delete_path(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to delete item"))
    return {"message": f"Successfully deleted {path}"}
