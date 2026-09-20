from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
import re
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

def resolve_company_and_order_from_path(path: str, db: Session):
    """
    Parses a Dropbox path to determine company_id, client_id, and order_number.
    E.g. /Clients/A261226/MCSX-260001/Pre Docs/passport.pdf
    """
    if not path:
        return None, None, None
        
    normalized = path.replace("\\", "/").strip().strip("/")
    parts = [p.strip() for p in normalized.split("/") if p.strip()]
    
    company = None
    order_number = None
    
    # 1. Look for order number in path parts (e.g. MCSX-260001, MSCX-260001, MCS-..., ORD-...)
    order_regex = re.compile(r"^(MCSX|MSCX|MCS|ORD)-?\d+", re.IGNORECASE)
    for part in parts:
        if order_regex.match(part):
            order_number = part.upper()
            break
            
    # 2. Extract company code or comp_{id}
    candidate_codes = []
    for idx, part in enumerate(parts):
        if part.lower() == "clients" and idx + 1 < len(parts):
            candidate_codes.append(parts[idx + 1])
        else:
            candidate_codes.append(part)
            
    for cand in candidate_codes:
        if not cand or cand.lower() == "clients":
            continue
            
        # Check comp_{id}
        if cand.lower().startswith("comp_"):
            try:
                comp_id = int(cand.lower().replace("comp_", ""))
                comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == comp_id).first()
                if comp:
                    company = comp
                    break
            except Exception:
                pass
                
        # Check company_code
        comp = db.query(models.ClientCompany).filter(
            func.upper(models.ClientCompany.company_code) == cand.upper()
        ).first()
        if comp:
            company = comp
            break

    # If order_number was found and company was not resolved, look up in ClientOrder
    if not company and order_number:
        db_order = db.query(models.ClientOrder).filter(
            func.upper(models.ClientOrder.order_number) == order_number
        ).first()
        if db_order and db_order.company_id:
            company = db.query(models.ClientCompany).filter(
                models.ClientCompany.id == db_order.company_id
            ).first()

    company_id = company.id if company else None
    client_id = (company.client_id or company.customer_id) if company else None
    
    return company_id, client_id, order_number

def log_dropbox_activity(
    db: Session, 
    action_type: str, 
    description: str, 
    company_id: Optional[int] = None, 
    client_id: Optional[int] = None, 
    user_id: Optional[int] = None
):
    """Safely records an audit log entry for Dropbox file operations."""
    try:
        log_entry = models.ClientActivityLog(
            company_id=company_id,
            client_id=client_id,
            user_id=user_id,
            action_type=action_type,
            description=description
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        db.rollback()
        print("Failed to record Dropbox activity log:", e)

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

def validate_user_dropbox_access(user: models.User, path: str, db: Session):
    """
    Ensures users cannot access arbitrary paths outside their authorization scope.
    Super Admins and staff with clients_documents permissions have full access.
    Clients and members are strictly restricted to their own /Clients/{company_code} paths.
    """
    if auth.is_super_admin(user):
        return True
        
    role_name = (user.role.name if user.role else "").strip().upper()
    if role_name in ("CLIENT", "MEMBER"):
        norm_path = path.replace("\\", "/").strip().lower()
        if not norm_path.startswith("/"):
            norm_path = "/" + norm_path
        norm_path_clean = norm_path.rstrip("/")
        
        allowed_codes = []
        if user.client:
            for comp in user.client.companies:
                if comp.company_code:
                    allowed_codes.append(comp.company_code.strip().lower())
                allowed_codes.append(f"comp_{comp.id}".lower())
                
        is_allowed = False
        for code in allowed_codes:
            expected_prefix = f"/clients/{code}"
            # Strict boundary check: exact folder or slash-delimited sub-item
            if norm_path_clean == expected_prefix or norm_path.startswith(f"{expected_prefix}/"):
                is_allowed = True
                break

        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are only authorized to access your company's documents."
            )
        return True
        
    # For internal staff, verify document viewing permissions
    if not (
        auth.has_permission(user, "clients_documents", "view", db) 
        or auth.has_permission(user, "clients_company", "view", db)
        or auth.has_permission(user, "clients_all", "view", db)
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Insufficient permissions to access corporate cloud storage."
        )
    return True

@router.get("/list")
async def list_files(
    path: str = "", 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """List files in a given Dropbox path with dynamic RBAC filtering on invoice folders/files."""
    validate_user_dropbox_access(current_user, path, db)
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
    validate_user_dropbox_access(current_user, path, db)
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

    # Audit Logging
    comp_id, client_id, order_num = resolve_company_and_order_from_path(destination_path, db)
    order_suffix = f" for order {order_num}" if order_num else ""
    log_dropbox_activity(
        db,
        action_type="DROPBOX_FILE_UPLOADED",
        description=f"Uploaded file '{file.filename}' to Dropbox ({destination_path}){order_suffix}",
        company_id=comp_id,
        client_id=client_id,
        user_id=current_user.id
    )

    return res

@router.post("/folder")
async def create_folder(
    path: str = Form(...), 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Create a new folder in Dropbox."""
    validate_user_dropbox_access(current_user, path, db)
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "create", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to create invoice folders."
        )
        
    res = dbx_client.create_folder(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to create folder"))

    # Audit Logging
    folder_name = os.path.basename(path.rstrip("/"))
    comp_id, client_id, order_num = resolve_company_and_order_from_path(path, db)
    order_suffix = f" for order {order_num}" if order_num else ""
    log_dropbox_activity(
        db,
        action_type="DROPBOX_FOLDER_CREATED",
        description=f"Created folder '{folder_name}' in Dropbox ({path}){order_suffix}",
        company_id=comp_id,
        client_id=client_id,
        user_id=current_user.id
    )

    return res

@router.get("/download")
async def get_download_link(
    path: str, 
    action: str = Query("DOWNLOAD"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a temporary direct link to download or preview a file."""
    validate_user_dropbox_access(current_user, path, db)
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "download", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to view or download invoice documents."
        )
        
    res = dbx_client.get_temporary_link(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to get download link"))

    # Audit Logging
    comp_id, client_id, order_num = resolve_company_and_order_from_path(path, db)
    file_name = os.path.basename(path.rstrip("/"))
    order_suffix = f" for order {order_num}" if order_num else ""
    
    is_view = action.strip().upper() in ("VIEW", "PREVIEW")
    action_type = "DROPBOX_FILE_VIEWED" if is_view else "DROPBOX_FILE_DOWNLOADED"
    verb = "Viewed" if is_view else "Downloaded"
    
    log_dropbox_activity(
        db,
        action_type=action_type,
        description=f"{verb} file '{file_name}' from Dropbox ({path}){order_suffix}",
        company_id=comp_id,
        client_id=client_id,
        user_id=current_user.id
    )

    return res

@router.delete("/delete")
async def delete_item(
    path: str, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete a file or folder from Dropbox."""
    validate_user_dropbox_access(current_user, path, db)
    if is_invoice_path_or_item(path) and not check_invoice_permission(current_user, "delete", db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Access denied. You do not have permission to delete invoice documents."
        )
        
    res = dbx_client.delete_path(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Failed to delete item"))

    # Audit Logging
    comp_id, client_id, order_num = resolve_company_and_order_from_path(path, db)
    item_name = os.path.basename(path.rstrip("/"))
    order_suffix = f" from order {order_num}" if order_num else ""
    log_dropbox_activity(
        db,
        action_type="DROPBOX_FILE_DELETED",
        description=f"Deleted '{item_name}' from Dropbox ({path}){order_suffix}",
        company_id=comp_id,
        client_id=client_id,
        user_id=current_user.id
    )

    return {"message": f"Successfully deleted {path}"}

class DropboxActionLogRequest(BaseModel):
    path: str
    action_type: str # VIEW, DOWNLOAD, DELETE, UPLOAD
    description: Optional[str] = None
    order_number: Optional[str] = None
    company_id: Optional[int] = None

@router.post("/log-action")
def log_dropbox_action_endpoint(
    req: DropboxActionLogRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    """Generic endpoint to record a custom document activity log."""
    comp_id = req.company_id
    client_id = None
    order_num = req.order_number
    
    if not comp_id or not order_num:
        r_comp_id, r_client_id, r_order_num = resolve_company_and_order_from_path(req.path, db)
        comp_id = comp_id or r_comp_id
        client_id = r_client_id
        order_num = order_num or r_order_num
        
    file_name = os.path.basename(req.path.rstrip("/"))
    order_suffix = f" for order {order_num}" if order_num else ""
    
    action_upper = req.action_type.strip().upper()
    if action_upper in ("VIEW", "PREVIEW", "DROPBOX_FILE_VIEWED", "DOCUMENT_VIEWED"):
        act_type = "DROPBOX_FILE_VIEWED"
        desc = req.description or f"Viewed file '{file_name}' ({req.path}){order_suffix}"
    elif action_upper in ("DOWNLOAD", "DROPBOX_FILE_DOWNLOADED", "DOCUMENT_DOWNLOADED"):
        act_type = "DROPBOX_FILE_DOWNLOADED"
        desc = req.description or f"Downloaded file '{file_name}' ({req.path}){order_suffix}"
    elif action_upper in ("DELETE", "DROPBOX_FILE_DELETED", "DOCUMENT_DELETED"):
        act_type = "DROPBOX_FILE_DELETED"
        desc = req.description or f"Deleted '{file_name}' ({req.path}){order_suffix}"
    else:
        act_type = req.action_type
        desc = req.description or f"Performed {req.action_type} on '{file_name}' ({req.path}){order_suffix}"

    log_dropbox_activity(
        db,
        action_type=act_type,
        description=desc,
        company_id=comp_id,
        client_id=client_id,
        user_id=current_user.id
    )
    return {"success": True}

