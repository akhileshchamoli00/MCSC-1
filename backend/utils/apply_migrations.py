import sys
from sqlalchemy import text

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
            ("CREATE INDEX IF NOT EXISTS ix_attendance_corrections_status ON attendance_corrections (status)", "ix_attendance_corrections_status")
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

    print("Migration check complete.")

if __name__ == "__main__":
    run_migrations()
