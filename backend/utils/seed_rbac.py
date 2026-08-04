from sqlalchemy.orm import Session
import models

def seed_rbac_data(db: Session):
    # 1. Seed Permissions
    permissions_to_seed = [
        {"name": "View", "code": "view"},
        {"name": "Create", "code": "create"},
        {"name": "Edit", "code": "edit"},
        {"name": "Delete", "code": "delete"},
        {"name": "Approve", "code": "approve"},
        {"name": "Export", "code": "export"},
        {"name": "Download", "code": "download"},
        {"name": "Manage", "code": "manage"},
    ]
    
    perm_map = {}
    for p in permissions_to_seed:
        db_perm = db.query(models.Permission).filter(models.Permission.code == p["code"]).first()
        if not db_perm:
            db_perm = models.Permission(name=p["name"], code=p["code"])
            db.add(db_perm)
            db.flush()
        perm_map[p["code"]] = db_perm
        
    # 2. Seed Modules
    modules_definition = [
        {"name": "Dashboard", "code": "dashboard", "submodules": []},
        {"name": "Employees", "code": "employees", "submodules": [
            {"name": "All Employees", "code": "employees_all"},
            {"name": "My Profile", "code": "employees_profile"},
        ]},
        {"name": "Attendance", "code": "attendance", "submodules": [
            {"name": "Attendance Management", "code": "attendance_management"},
            {"name": "My Attendance", "code": "attendance_my"},
        ]},
        {"name": "Timesheets", "code": "timesheets", "submodules": [
            {"name": "Timesheet Management", "code": "timesheets_management"},
            {"name": "My Timesheets", "code": "timesheets_my"},
        ]},
        {"name": "Leave", "code": "leave", "submodules": [
            {"name": "Leave Overview", "code": "leave_overview"},
            {"name": "Leave Management", "code": "leave_management"},
            {"name": "My Leave", "code": "leave_my"},
        ]},
        {"name": "Leave Approval", "code": "leave_approval", "submodules": []},
        {"name": "Payroll", "code": "payroll", "submodules": [
            {"name": "Payroll Management", "code": "payroll_management"},
            {"name": "My Payroll", "code": "payroll_my"},
        ]},
        {"name": "Assets", "code": "assets", "submodules": [
            {"name": "Asset Management", "code": "assets_management"},
            {"name": "My Assets", "code": "assets_my"},
        ]},
        {"name": "Reports", "code": "reports", "submodules": [
            {"name": "Payroll Reports", "code": "reports_payroll"},
            {"name": "Attendance Reports", "code": "reports_attendance"},
        ]},
        {"name": "Public Holidays", "code": "public_holidays", "submodules": []},
        {"name": "Clients", "code": "clients", "submodules": [
            {"name": "All Clients", "code": "clients_all"},
            {"name": "Add Company", "code": "clients_company"},
            {"name": "Assign Consultant", "code": "clients_assign"},
            {"name": "My Clients", "code": "clients_my"},
        ]},
        {"name": "Chat", "code": "chat", "submodules": [
            {"name": "Chat Center", "code": "chat_center"},
            {"name": "Client Chat", "code": "chat_client"},
            {"name": "Assigned Company", "code": "chat_assigned_companies"},
        ]},
        {"name": "Notifications", "code": "notifications", "submodules": []},
        {"name": "Access Control", "code": "access_control", "submodules": [
            {"name": "Roles List", "code": "roles_list"},
            {"name": "Permission Matrix", "code": "access_control_matrix"},
        ]},
        {"name": "Settings", "code": "settings", "submodules": []},
    ]

    modules_by_code = {}
    for m_def in modules_definition:
        db_parent = db.query(models.Module).filter(models.Module.code == m_def["code"]).first()
        if not db_parent:
            db_parent = models.Module(name=m_def["name"], code=m_def["code"], parent_id=None)
            db.add(db_parent)
            db.flush()
        else:
            db_parent.name = m_def["name"]
        
        modules_by_code[m_def["code"]] = db_parent
        
        for sub_def in m_def["submodules"]:
            db_sub = db.query(models.Module).filter(models.Module.code == sub_def["code"]).first()
            if not db_sub:
                db_sub = models.Module(name=sub_def["name"], code=sub_def["code"], parent_id=db_parent.id)
                db.add(db_sub)
                db.flush()
            else:
                db_sub.name = sub_def["name"]
                db_sub.parent_id = db_parent.id
            modules_by_code[sub_def["code"]] = db_sub
            
    db.commit()
    
    # 3. Seed default permissions for ADMIN and EMPLOYEE
    # Only seed default permissions if the role permissions table is empty to avoid overwriting user edits.
    role_perms_exist = db.query(models.RolePermission).first() is not None
    if not role_perms_exist:
        admin_role = db.query(models.Role).filter(models.Role.name.ilike("admin")).first()
        if admin_role:
            for mod in modules_by_code.values():
                for perm in perm_map.values():
                    exists = db.query(models.RolePermission).filter(
                        models.RolePermission.role_id == admin_role.id,
                        models.RolePermission.module_id == mod.id,
                        models.RolePermission.permission_id == perm.id
                    ).first()
                    if not exists:
                        rp = models.RolePermission(role_id=admin_role.id, module_id=mod.id, permission_id=perm.id)
                        db.add(rp)
                        
        emp_role = db.query(models.Role).filter(models.Role.name.ilike("employee")).first()
        if emp_role:
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
                ("chat_client", "view"),
                ("chat_client", "create"),
                ("chat_assigned_companies", "view"),
                ("notifications", "view"),
            ]
            for m_code, p_code in employee_defaults:
                mod = modules_by_code.get(m_code)
                perm = perm_map.get(p_code)
                if mod and perm:
                    exists = db.query(models.RolePermission).filter(
                        models.RolePermission.role_id == emp_role.id,
                        models.RolePermission.module_id == mod.id,
                        models.RolePermission.permission_id == perm.id
                    ).first()
                    if not exists:
                        rp = models.RolePermission(role_id=emp_role.id, module_id=mod.id, permission_id=perm.id)
                        db.add(rp)
                        
        db.commit()

    # 4. Seed Internal/Employing Companies
    companies_to_seed = [
        "PT Citra Selaras Solusi",
        "PT Mandiri Cipta Solusi",
        "PT Mcs Paten Solusi"
    ]
    for c_name in companies_to_seed:
        exists = db.query(models.Company).filter(models.Company.name == c_name).first()
        if not exists:
            db.add(models.Company(name=c_name, description=f"Internal company: {c_name}"))
    db.commit()

    print("RBAC Database seeding completed successfully.")

