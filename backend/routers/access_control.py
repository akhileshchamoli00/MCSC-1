from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models, schemas, database, auth

router = APIRouter(
    prefix="/api/access-control",
    tags=["Access Control"],
    dependencies=[Depends(auth.get_current_user)]
)

async def require_admin(current_user: models.User = Depends(auth.get_current_user)):
    if not auth.is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Administrator permissions required."
        )
    return current_user

@router.get("/modules", response_model=List[schemas.ModuleResponse], dependencies=[Depends(require_admin)])
def get_modules(db: Session = Depends(database.get_db)):
    root_modules = db.query(models.Module).filter(models.Module.parent_id == None).all()
    return root_modules

@router.get("/permissions", response_model=List[schemas.PermissionResponse], dependencies=[Depends(require_admin)])
def get_permissions(db: Session = Depends(database.get_db)):
    return db.query(models.Permission).all()

@router.get("/role-permissions/{role_id}", response_model=List[schemas.RolePermissionResponse], dependencies=[Depends(require_admin)])
def get_role_permissions(role_id: int, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return db.query(models.RolePermission).filter(models.RolePermission.role_id == role_id).all()

class RolePermissionsUpdate(schemas.BaseModel):
    permissions: List[schemas.RolePermissionBase]

@router.post("/role-permissions/{role_id}", dependencies=[Depends(require_admin)])
def update_role_permissions(
    role_id: int, 
    payload: RolePermissionsUpdate, 
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    db.query(models.RolePermission).filter(models.RolePermission.role_id == role_id).delete()
    
    for p in payload.permissions:
        rp = models.RolePermission(
            role_id=role_id,
            module_id=p.module_id,
            permission_id=p.permission_id
        )
        db.add(rp)
        
    employee_id = current_user.employee.id if current_user.employee else None
        
    audit_log = models.AuditLog(
        employee_id=employee_id,
        activity=f"Permission Change: Updated permissions for role '{role.name}' (assigned {len(payload.permissions)} rules)."
    )
    db.add(audit_log)
    
    db.commit()
    return {"message": "Permissions updated successfully", "count": len(payload.permissions)}

class ClonePermissionsRequest(schemas.BaseModel):
    from_role_id: int
    to_role_id: int

@router.post("/clone-permissions", dependencies=[Depends(require_admin)])
def clone_permissions(
    payload: ClonePermissionsRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    from_role = db.query(models.Role).filter(models.Role.id == payload.from_role_id).first()
    to_role = db.query(models.Role).filter(models.Role.id == payload.to_role_id).first()
    if not from_role or not to_role:
        raise HTTPException(status_code=404, detail="One or both roles not found")
        
    db.query(models.RolePermission).filter(models.RolePermission.role_id == payload.to_role_id).delete()
    
    src_perms = db.query(models.RolePermission).filter(models.RolePermission.role_id == payload.from_role_id).all()
    for sp in src_perms:
        rp = models.RolePermission(
            role_id=payload.to_role_id,
            module_id=sp.module_id,
            permission_id=sp.permission_id
        )
        db.add(rp)
        
    employee_id = current_user.employee.id if current_user.employee else None
    audit_log = models.AuditLog(
        employee_id=employee_id,
        activity=f"Permission Change: Cloned permissions from role '{from_role.name}' to role '{to_role.name}'."
    )
    db.add(audit_log)
    
    db.commit()
    return {"message": "Permissions cloned successfully", "count": len(src_perms)}

@router.post("/reset-permissions/{role_id}", dependencies=[Depends(require_admin)])
def reset_role_permissions(
    role_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db)
):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    db.query(models.RolePermission).filter(models.RolePermission.role_id == role_id).delete()
    
    # Re-seed default permissions if the role is Admin or Employee
    role_name_upper = role.name.upper()
    if role_name_upper in ["ADMIN", "SUPER ADMIN", "SUPERADMIN", "SYSTEM ADMIN"]:
        # Seed all permissions for all modules
        all_modules = db.query(models.Module).all()
        all_permissions = db.query(models.Permission).all()
        for mod in all_modules:
            for perm in all_permissions:
                rp = models.RolePermission(role_id=role_id, module_id=mod.id, permission_id=perm.id)
                db.add(rp)
                
    elif role_name_upper == "EMPLOYEE":
        # Seed 18 default employee permissions
        employee_defaults = [
            ("dashboard", "view"),
            ("employees_profile", "view"),
            ("employees_profile", "edit"),
            ("attendance_my", "view"),
            ("attendance_my", "create"),
            ("timesheets_my", "view"),
            ("timesheets_my", "create"),
            ("timesheets_my", "edit"),
            ("leave_my", "view"),
            ("leave_my", "create"),
            ("leave_my", "edit"),
            ("payroll_my", "view"),
            ("payroll_my", "download"),
            ("assets_my", "view"),
        ]
        
        all_modules = db.query(models.Module).all()
        all_permissions = db.query(models.Permission).all()
        modules_map = {m.code: m.id for m in all_modules}
        perms_map = {p.code: p.id for p in all_permissions}
        
        for m_code, p_code in employee_defaults:
            m_id = modules_map.get(m_code)
            p_id = perms_map.get(p_code)
            if m_id and p_id:
                rp = models.RolePermission(role_id=role_id, module_id=m_id, permission_id=p_id)
                db.add(rp)
                
    employee_id = current_user.employee.id if current_user.employee else None
    audit_log = models.AuditLog(
        employee_id=employee_id,
        activity=f"Permission Change: Reset permissions for role '{role.name}' to system defaults."
    )
    db.add(audit_log)
    
    db.commit()
    return {"message": "Permissions reset successfully"}


@router.get("/audit-logs", dependencies=[Depends(require_admin)])
def get_permission_audit_logs(db: Session = Depends(database.get_db)):
    logs = db.query(models.AuditLog)\
        .filter(models.AuditLog.activity.like("Permission Change:%"))\
        .order_by(models.AuditLog.created_at.desc()).all()
        
    result = []
    for log in logs:
        employee_name = "System"
        if log.employee:
            employee_name = f"{log.employee.first_name} {log.employee.last_name}"
        result.append({
            "id": log.id,
            "employee_name": employee_name,
            "activity": log.activity,
            "created_at": log.created_at
        })
    return result
