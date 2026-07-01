from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/assets",
    tags=["assets"],
    dependencies=[Depends(auth.get_current_user)]
)

def log_asset_history(db: Session, asset_id: int, action: str, description: str, user_id: int):
    history = models.AssetHistory(
        asset_id=asset_id,
        action=action,
        description=description,
        performed_by=user_id
    )
    db.add(history)

# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@router.get("")
def get_assets(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    assets = db.query(models.Asset).filter(models.Asset.status != "ARCHIVED").order_by(models.Asset.asset_type, models.Asset.brand, models.Asset.model).offset(skip).limit(limit).all()
    
    result = []
    for asset in assets:
        # Find active assignment
        assignment = db.query(models.AssetAssignment).filter(
            models.AssetAssignment.asset_id == asset.id,
            models.AssetAssignment.status == "ACTIVE"
        ).first()
        
        asset_data = {
            "id": asset.id,
            "asset_type": asset.asset_type,
            "brand": asset.brand,
            "model": asset.model,
            "asset_tag": asset.asset_tag,
            "serial_number": asset.serial_number,
            "condition": asset.condition,
            "status": asset.status,
            "remarks": asset.remarks,
            "created_at": asset.created_at,
            "updated_at": asset.updated_at,
            "current_assignment": None
        }
        
        if assignment and assignment.employee:
            asset_data["current_assignment"] = {
                "employee_id": assignment.employee.id,
                "first_name": assignment.employee.first_name,
                "last_name": assignment.employee.last_name,
                "department": assignment.employee.department.name if assignment.employee.department else "N/A",
                "assigned_date": assignment.assigned_date
            }
            
        result.append(asset_data)
        
    return result

@router.post("", response_model=schemas.AssetResponse)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    data = asset.model_dump() if hasattr(asset, "model_dump") else asset.dict()
    
    if "asset_tag" in data and data["asset_tag"]:
        existing = db.query(models.Asset).filter(models.Asset.asset_tag == data["asset_tag"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Asset Tag '{data['asset_tag']}' already exists.")
            
    if "serial_number" in data and data["serial_number"]:
        existing = db.query(models.Asset).filter(models.Asset.serial_number == data["serial_number"]).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Serial Number '{data['serial_number']}' already exists.")

    db_asset = models.Asset(**data)
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    
    log_asset_history(db, db_asset.id, "CREATED", f"Asset created with status {db_asset.status}", current_user.id)
    db.commit()
    
    return db_asset

@router.put("/{asset_id}", response_model=schemas.AssetResponse)
def update_asset(asset_id: int, asset_update: schemas.AssetUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    update_data = asset_update.model_dump() if hasattr(asset_update, "model_dump") else asset_update.dict()
    
    if "asset_tag" in update_data and update_data["asset_tag"] and update_data["asset_tag"] != db_asset.asset_tag:
        existing = db.query(models.Asset).filter(models.Asset.asset_tag == update_data["asset_tag"], models.Asset.id != asset_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Asset Tag '{update_data['asset_tag']}' already exists.")
            
    if "serial_number" in update_data and update_data["serial_number"] and update_data["serial_number"] != db_asset.serial_number:
        existing = db.query(models.Asset).filter(models.Asset.serial_number == update_data["serial_number"], models.Asset.id != asset_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Serial Number '{update_data['serial_number']}' already exists.")
    
    changes = []
    for key, value in update_data.items():
        old_value = getattr(db_asset, key)
        if old_value != value:
            changes.append(f"{key}: {old_value} -> {value}")
            setattr(db_asset, key, value)
            
    db_asset.updated_at = datetime.now()
    
    if changes:
        log_asset_history(db, db_asset.id, "UPDATED", " | ".join(changes), current_user.id)
        
    db.commit()
    db.refresh(db_asset)
    return db_asset

@router.delete("/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    # Soft delete
    db_asset.status = "ARCHIVED"
    db_asset.updated_at = datetime.now()
    
    # End active assignments
    active_assignments = db.query(models.AssetAssignment).filter(
        models.AssetAssignment.asset_id == asset_id,
        models.AssetAssignment.status == "ACTIVE"
    ).all()
    
    for assignment in active_assignments:
        assignment.status = "RETURNED"
        assignment.returned_date = datetime.now().date()
        
    log_asset_history(db, db_asset.id, "DELETED", "Asset was soft-deleted (Archived)", current_user.id)
    db.commit()
    return {"message": "Asset archived successfully"}

@router.post("/bulk-assign")
def bulk_assign_assets(payload: schemas.BulkAssetAssignmentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    employee = db.query(models.Employee).filter(models.Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    created_assets = []
    
    requested_tags = set()
    requested_serials = set()
    
    for asset_data in payload.assets:
        data = asset_data.model_dump() if hasattr(asset_data, "model_dump") else asset_data.dict()
        data["status"] = "ASSIGNED" # Override status to assigned
        
        tag = data.get("asset_tag")
        serial = data.get("serial_number")
        
        if tag:
            if tag in requested_tags:
                raise HTTPException(status_code=400, detail=f"Duplicate Asset Tag '{tag}' in bulk upload request.")
            requested_tags.add(tag)
            
            existing = db.query(models.Asset).filter(models.Asset.asset_tag == tag).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Asset Tag '{tag}' already exists.")
                
        if serial:
            if serial in requested_serials:
                raise HTTPException(status_code=400, detail=f"Duplicate Serial Number '{serial}' in bulk upload request.")
            requested_serials.add(serial)
            
            existing = db.query(models.Asset).filter(models.Asset.serial_number == serial).first()
            if existing:
                raise HTTPException(status_code=400, detail=f"Serial Number '{serial}' already exists.")
        
        # 1. Create Asset
        db_asset = models.Asset(**data)
        db.add(db_asset)
        db.flush() # flush to get the ID without committing
        
        # 2. Create Assignment
        assignment = models.AssetAssignment(
            asset_id=db_asset.id,
            employee_id=payload.employee_id,
            assigned_date=payload.assigned_date,
            assigned_by=current_user.id,
            status="ACTIVE"
        )
        db.add(assignment)
        
        # 3. Log History
        log_asset_history(db, db_asset.id, "CREATED & ASSIGNED", f"Assigned to {employee.first_name} {employee.last_name}", current_user.id)
        
        created_assets.append(db_asset.id)
        
    db.commit()
    return {"message": f"Successfully created and assigned {len(created_assets)} assets", "asset_ids": created_assets}

@router.get("/{asset_id}/history", response_model=List[schemas.AssetHistoryResponse])
def get_asset_history(asset_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not auth.has_permission(current_user, "assets_management", "view", db):
        raise HTTPException(status_code=403, detail="Access denied. Required permission 'assets_management:view' not granted.")
        
    history = db.query(models.AssetHistory).filter(models.AssetHistory.asset_id == asset_id).order_by(desc(models.AssetHistory.created_at)).all()
    return history

# ==========================================
# EMPLOYEE ENDPOINTS
# ==========================================

@router.get("/my-assets")
def get_my_assets(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="User is not linked to an employee profile")
        
    assignments = db.query(models.AssetAssignment).filter(
        models.AssetAssignment.employee_id == current_user.employee.id,
        models.AssetAssignment.status == "ACTIVE"
    ).all()
    
    result = []
    for assignment in assignments:
        asset = assignment.asset
        if asset and asset.status != "ARCHIVED":
            result.append({
                "assignment_id": assignment.id,
                "assigned_date": assignment.assigned_date,
                "asset": {
                    "id": asset.id,
                    "asset_type": asset.asset_type,
                    "brand": asset.brand,
                    "model": asset.model,
                    "asset_tag": asset.asset_tag,
                    "serial_number": asset.serial_number,
                    "condition": asset.condition,
                    "status": asset.status,
                    "remarks": asset.remarks
                }
            })
            
    return result
