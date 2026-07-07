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

    print("Migration check complete.")

if __name__ == "__main__":
    run_migrations()
