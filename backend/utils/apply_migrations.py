import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine

def handle_migration_error(col, table_name, exception):
    err_str = str(exception)
    if "already exists" in err_str:
        print(f"Column '{col}' already exists in '{table_name}' table (verified).")
    else:
        print(f"Error checking/adding column '{col}' in '{table_name}': {exception}")

def run_migrations():
    print("Running migrations...")
    # Create any new tables defined in models.py
    import models
    models.Base.metadata.create_all(bind=engine)
    print("Ensured all base tables exist in the database.")
    
    with engine.connect() as conn:
        # Columns to add to leave_balances
        balance_cols = [
            ("annual_leave_taken", "FLOAT DEFAULT 0.0"),
            ("sick_leave_taken", "FLOAT DEFAULT 0.0")
        ]
        
        for col, col_type in balance_cols:
            try:
                conn.execute(text(f"ALTER TABLE leave_balances ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'leave_balances' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "leave_balances", e)

        # Columns to add to leave_balance_audit
        audit_cols = [
            ("old_annual_taken", "FLOAT DEFAULT 0.0"),
            ("new_annual_taken", "FLOAT DEFAULT 0.0"),
            ("old_sick_taken", "FLOAT DEFAULT 0.0"),
            ("new_sick_taken", "FLOAT DEFAULT 0.0")
        ]
        
        for col, col_type in audit_cols:
            try:
                conn.execute(text(f"ALTER TABLE leave_balance_audit ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'leave_balance_audit' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "leave_balance_audit", e)

        # Create system_settings table if not exists
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(255) PRIMARY KEY,
                    value VARCHAR(255)
                )
            """))
            conn.commit()
            print("Ensured system_settings table exists.")
        except Exception as e:
            conn.rollback()
            print(f"Error creating system_settings table: {e}")

        # Columns to add to employees
        try:
            conn.execute(text("ALTER TABLE employees ADD COLUMN payslip_password VARCHAR(255)"))
            conn.commit()
            print("Added column 'payslip_password' to 'employees' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("payslip_password", "employees", e)

        # Columns to add to employees (per-day allowance rates)
        for col, col_type in [("meal_allowance_per_day", "FLOAT DEFAULT 40000.0"), ("work_support_allowance_per_day", "FLOAT DEFAULT 30000.0")]:
            try:
                conn.execute(text(f"ALTER TABLE employees ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'employees' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "employees", e)

        # Columns to add to client_documents
        for col, col_type in [("document_date", "DATE"), ("document_path", "VARCHAR(500)")]:
            try:
                conn.execute(text(f"ALTER TABLE client_documents ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_documents' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_documents", e)

        # Columns to add to leave_requests
        try:
            conn.execute(text("ALTER TABLE leave_requests ADD COLUMN allocation_date DATE"))
            conn.commit()
            print("Added column 'allocation_date' to 'leave_requests' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("allocation_date", "leave_requests", e)

        # Columns to add to client_companies
        for col, col_type in [("director_name", "VARCHAR(255)"), ("director_email", "VARCHAR(255)"), ("director_contact", "VARCHAR(255)"), ("notes", "TEXT")]:
            try:
                conn.execute(text(f"ALTER TABLE client_companies ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_companies' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_companies", e)

        # Indexes for attendance and attendance_corrections tables
        for idx_sql, idx_name in [
            ("CREATE INDEX IF NOT EXISTS ix_attendance_employee_id ON attendance (employee_id)", "ix_attendance_employee_id"),
            ("CREATE INDEX IF NOT EXISTS ix_attendance_corrections_employee_id ON attendance_corrections (employee_id)", "ix_attendance_corrections_employee_id"),
            ("CREATE INDEX IF NOT EXISTS ix_attendance_corrections_status ON attendance_corrections (status)", "ix_attendance_corrections_status"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_order_number ON client_orders (order_number)", "ix_client_orders_order_number"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_client_id ON client_orders (client_id)", "ix_client_orders_client_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_company_id ON client_orders (company_id)", "ix_client_orders_company_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_status ON client_orders (status)", "ix_client_orders_status"),
            ("CREATE INDEX IF NOT EXISTS ix_client_order_progress_order_number ON client_order_progress (order_number)", "ix_client_order_progress_order_number"),
            ("CREATE INDEX IF NOT EXISTS ix_client_companies_client_id ON client_companies (client_id)", "ix_client_companies_client_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_consultants_company_id ON client_consultants (company_id)", "ix_client_consultants_company_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_consultants_employee_id ON client_consultants (employee_id)", "ix_client_consultants_employee_id")
        ]:
            try:
                conn.execute(text(idx_sql))
                conn.commit()
                print(f"Created/verified index '{idx_name}'.")
            except Exception as e:
                conn.rollback()

        # Add client_code to clients table
        try:
            conn.execute(text("ALTER TABLE clients ADD COLUMN client_code VARCHAR(255) UNIQUE"))
            conn.commit()
            print("Added column 'client_code' to 'clients' table.")
        except Exception as e:
            conn.rollback()

        # Columns to add to company_stakeholders
        for col, col_type in [("phone", "VARCHAR(255)"), ("email", "VARCHAR(255)"), ("is_key_contact", "BOOLEAN DEFAULT FALSE")]:
            try:
                conn.execute(text(f"ALTER TABLE company_stakeholders ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'company_stakeholders' table.")
            except Exception as e:
                conn.rollback()

        # Add order_number to client_documents table
        try:
            conn.execute(text("ALTER TABLE client_documents ADD COLUMN order_number VARCHAR(255)"))
            conn.commit()
            print("Added column 'order_number' to 'client_documents' table.")
        except Exception as e:
            conn.rollback()

        # Add is_proforma_finalized to client_orders table
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN is_proforma_finalized BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added column 'is_proforma_finalized' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("is_proforma_finalized", "client_orders", e)

        # Add proforma_stage_percent to client_orders table
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN proforma_stage_percent INTEGER DEFAULT 50"))
            conn.commit()
            print("Added column 'proforma_stage_percent' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("proforma_stage_percent", "client_orders", e)

        # Add is_final_invoice_finalized to client_orders table
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN is_final_invoice_finalized BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added column 'is_final_invoice_finalized' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("is_final_invoice_finalized", "client_orders", e)

        # Add payment_link, xendit_invoice_id, and payment_link_created_at to client_orders table
        for col, col_type in [("payment_link", "VARCHAR(500)"), ("xendit_invoice_id", "VARCHAR(255)"), ("payment_link_created_at", "TIMESTAMP")]:
            try:
                conn.execute(text(f"ALTER TABLE client_orders ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_orders' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_orders", e)

        # Seed existing clients without client_code
        try:
            res = conn.execute(text("SELECT id, created_at FROM clients WHERE client_code IS NULL ORDER BY id ASC")).fetchall()
            import datetime
            for row in res:
                cid = row[0]
                created_dt = row[1] or datetime.datetime.now()
                year_str = created_dt.strftime("%y")
                seq_num = 1
                while True:
                    test_code = f"X{year_str}{seq_num:04d}"
                    exists = conn.execute(text("SELECT 1 FROM clients WHERE client_code = :code"), {"code": test_code}).first()
                    if not exists:
                        conn.execute(text("UPDATE clients SET client_code = :code WHERE id = :id"), {"code": test_code, "id": cid})
                        conn.commit()
                        print(f"Migrated client ID {cid} to code {test_code}")
                        break
                    seq_num += 1
        except Exception as e:
            conn.rollback()
            print(f"Error migrating client codes: {e}")

        # Add needs_notary, needs_gov_officer, needs_other_vendors to client_services
        try:
            conn.execute(text("ALTER TABLE client_services ADD COLUMN needs_notary BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added column 'needs_notary' to 'client_services' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("needs_notary", "client_services", e)

        try:
            conn.execute(text("ALTER TABLE client_services ADD COLUMN needs_gov_officer BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added column 'needs_gov_officer' to 'client_services' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("needs_gov_officer", "client_services", e)

        try:
            conn.execute(text("ALTER TABLE client_services ADD COLUMN needs_other_vendors BOOLEAN DEFAULT FALSE"))
            conn.commit()
            print("Added column 'needs_other_vendors' to 'client_services' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("needs_other_vendors", "client_services", e)

        # Add notary_id to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN notary_id INTEGER"))
            conn.commit()
            print("Added column 'notary_id' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("notary_id", "client_orders", e)

        # Add notary payment tracking columns to client_orders
        notary_pay_cols = [
            ("notary_fee", "FLOAT DEFAULT 0.0"),
            ("notary_payment_status", "VARCHAR(50) DEFAULT 'UNPAID'"),
            ("notary_payment_date", "DATE"),
            ("notary_payment_ref", "VARCHAR(255)")
        ]
        for col, col_type in notary_pay_cols:
            try:
                conn.execute(text(f"ALTER TABLE client_orders ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_orders' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_orders", e)

        # Add proforma_paid_amount to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN proforma_paid_amount FLOAT DEFAULT NULL"))
            conn.commit()
            print("Added column 'proforma_paid_amount' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("proforma_paid_amount", "client_orders", e)

        # Add billing_company_id to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN billing_company_id INTEGER REFERENCES client_companies(id) ON DELETE SET NULL"))
            conn.commit()
            print("Added column 'billing_company_id' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("billing_company_id", "client_orders", e)

        # Add branch_name to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN branch_name VARCHAR(255) DEFAULT NULL"))
            conn.commit()
            print("Added column 'branch_name' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("branch_name", "client_orders", e)

        # Add notary_payout_id to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN notary_payout_id VARCHAR(255) DEFAULT NULL"))
            conn.commit()
            print("Added column 'notary_payout_id' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("notary_payout_id", "client_orders", e)

        # Add bank details and vendor type columns to notaries
        notary_cols = [
            ("bank_name", "VARCHAR(255) DEFAULT NULL"),
            ("bank_account_number", "VARCHAR(255) DEFAULT NULL"),
            ("bank_account_holder_name", "VARCHAR(255) DEFAULT NULL"),
            ("bank_branch", "VARCHAR(255) DEFAULT NULL"),
            ("bank_swift_code", "VARCHAR(255) DEFAULT NULL"),
            ("vendor_type", "VARCHAR(50) DEFAULT 'NOTARY'"),
            ("is_notary", "BOOLEAN DEFAULT TRUE"),
            ("is_gov_officer", "BOOLEAN DEFAULT FALSE"),
            ("is_other_vendor", "BOOLEAN DEFAULT FALSE")
        ]
        for col, col_type in notary_cols:
            try:
                conn.execute(text(f"ALTER TABLE notaries ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'notaries' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "notaries", e)

        # Add validation and approval columns to client_companies
        company_cols = [
            ("validation_status", "VARCHAR(50) DEFAULT 'PENDING_VALIDATION'"),
            ("created_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
            ("validated_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
            ("validated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NULL"),
            ("validation_notes", "TEXT DEFAULT NULL")
        ]
        for col, col_type in company_cols:
            try:
                conn.execute(text(f"ALTER TABLE client_companies ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_companies' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_companies", e)

        # For existing active companies, mark them as VALIDATED so they are already verified
        try:
            conn.execute(text("UPDATE client_companies SET validation_status = 'VALIDATED' WHERE validation_status IS NULL OR validation_status = ''"))
            conn.commit()
            print("Set default validation_status = 'VALIDATED' for existing client_companies.")
        except Exception as e:
            conn.rollback()
            print(f"Notice on updating existing client_companies: {e}")

        # Add validation and approval columns to notaries (vendors)
        notary_val_cols = [
            ("validation_status", "VARCHAR(50) DEFAULT 'PENDING_VALIDATION'"),
            ("created_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
            ("validated_by_user_id", "INTEGER REFERENCES users(id) ON DELETE SET NULL"),
            ("validated_at", "TIMESTAMP WITH TIME ZONE DEFAULT NULL"),
            ("validation_notes", "TEXT DEFAULT NULL")
        ]
        for col, col_type in notary_val_cols:
            try:
                conn.execute(text(f"ALTER TABLE notaries ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'notaries' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "notaries", e)

        # Add channel, attachment_url, and attachment_name columns to client_order_progress
        progress_cols = [
            ("channel", "VARCHAR(50) DEFAULT 'INTERNAL'"),
            ("attachment_url", "VARCHAR(500) DEFAULT NULL"),
            ("attachment_name", "VARCHAR(255) DEFAULT NULL")
        ]
        for col, col_type in progress_cols:
            try:
                conn.execute(text(f"ALTER TABLE client_order_progress ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_order_progress' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_order_progress", e)

        # Ensure any existing progress records without channel get default 'INTERNAL' or 'CLIENT'
        try:
            conn.execute(text("UPDATE client_order_progress SET channel = 'INTERNAL' WHERE channel IS NULL OR channel = ''"))
            conn.execute(text("""
                UPDATE client_order_progress
                SET channel = 'CLIENT'
                WHERE user_id IS NULL
                   OR message ILIKE 'Order execution status has been updated to%'
                   OR message ILIKE 'Pipeline order has been moved to Active Orders%'
                   OR message ILIKE '%payment completed successfully via Xendit%'
                   OR message ILIKE 'Additional payment received via Xendit%'
                   OR message ILIKE 'Proforma invoice (%has been generated and saved%'
                   OR message ILIKE 'Final invoice has been generated and saved%'
                   OR message ILIKE 'Final documents uploaded to Dropbox%'
                   OR message ILIKE 'Final documents (%have been emailed to client%'
                   OR message ILIKE 'Amount Received / Proforma Paid manually updated%'
            """))
            conn.commit()
            print("Updated client messages and automated lifecycle & payment status messages to channel='CLIENT'.")
        except Exception as e:
            conn.rollback()

        # Add invitation tracking columns to client_companies
        for col, col_type in [("invitation_sent_at", "TIMESTAMP"), ("invitation_sent_to", "VARCHAR(255)")]:
            try:
                conn.execute(text(f"ALTER TABLE client_companies ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_companies' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_companies", e)

        # Add invoice and deliverables dispatch tracking columns to client_orders
        order_dispatch_cols = [
            ("proforma_sent_at", "TIMESTAMP"),
            ("proforma_sent_to", "VARCHAR(255)"),
            ("final_invoice_sent_at", "TIMESTAMP"),
            ("final_invoice_sent_to", "VARCHAR(255)"),
            ("last_invoice_sent_at", "TIMESTAMP"),
            ("last_invoice_sent_to", "VARCHAR(255)"),
            ("invoice_delivery_channel", "VARCHAR(50)"),
            ("deliverables_sent_at", "TIMESTAMP"),
            ("deliverables_sent_to", "VARCHAR(255)"),
            ("notary_voucher_sent_at", "TIMESTAMP"),
            ("notary_voucher_sent_to", "VARCHAR(255)")
        ]
        for col, col_type in order_dispatch_cols:
            try:
                conn.execute(text(f"ALTER TABLE client_orders ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_orders' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_orders", e)

    # Update RBAC permissions and role access descriptions
    try:
        from database import SessionLocal
        from utils.seed_rbac import seed_rbac_data
        import models
        with SessionLocal() as db_session:
            seed_rbac_data(db_session)
            
            # Ensure Order Management module name is updated in DB
            order_mod = db_session.query(models.Module).filter(models.Module.code == "clients_orders").first()
            if order_mod:
                order_mod.name = "Order Management"
                
            role_descriptions = {
                1: ("Super Admin", "Full unrestricted access across all platform modules: HRMS, Business & Client Operations, End-to-End Order Management, Finance, User Management, Access Control Matrix, and System Settings."),
                6: ("Employee", "Self-Service HRMS & Assigned Orders: Attendance check-in/out, Timesheets submission, Leave requests, Personal Payslips, Employee Profile, Assigned Client Orders view, and Company Chat."),
                14: ("ADMIN", "System & Order Administration: Comprehensive management of HRMS modules, Employee records, Payroll processing, Leave approvals, Business Operations, Full Order Management & Pipelines, and Platform Configurations."),
                16: ("CLIENT", "Client Portal & Order Tracking: View registered company profile, track placed Client Orders in real-time, inspect milestone progress & deliverables, download invoices, and communicate via Client Chat."),
                20: ("Employee Admin", "Business Operations & HRMS Oversight: Full management (View, Create, Edit, Delete) of Client Services, Client Companies, and Documents & Invoices. Includes administrative oversight of Attendance Management and Asset Management, plus HRMS Self-Service access (Profile, Attendance, Timesheets, Leaves, Payslips, Assets)."),
                21: ("MEMBER", "Public Portal & Service Ordering: Browse corporate services catalog, submit online service applications, request consultations, and track submitted service orders."),
                22: ("Processing Team", "Order Management & Assigned Orders: Access to Business Platform for Order Management (view), full management of Assigned Client Orders (create, view, edit, delete), Order Documents & Invoices (create, edit, delete), and Client Chat. Includes HRMS Self-Service access for Attendance, Timesheets, Leaves, Payslips, Profile, and Assets.")
            }
            
            for r_id, (r_name, r_desc) in role_descriptions.items():
                db_role = db_session.query(models.Role).filter((models.Role.id == r_id) | (models.Role.name == r_name) | (models.Role.name == "Order Management Team")).first()
                if db_role:
                    db_role.description = r_desc
            db_session.commit()
    except Exception as e:
        print(f"Error updating role descriptions in migrations: {e}")

    print("Migration check complete.")

if __name__ == "__main__":
    run_migrations()
