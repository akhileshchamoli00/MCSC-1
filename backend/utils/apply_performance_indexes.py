import sys
import os
from sqlalchemy import text

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import engine

INDEXES_TO_CREATE = [
    # Client Orders
    ("ix_client_orders_client_id", "client_orders", "client_id"),
    ("ix_client_orders_company_id", "client_orders", "company_id"),
    ("ix_client_orders_billing_company_id", "client_orders", "billing_company_id"),
    ("ix_client_orders_service_id", "client_orders", "service_id"),
    ("ix_client_orders_customer_id", "client_orders", "customer_id"),
    ("ix_client_orders_reviewer_id", "client_orders", "reviewer_id"),
    ("ix_client_orders_notary_id", "client_orders", "notary_id"),
    ("ix_client_orders_status", "client_orders", "status"),
    
    # Payrolls
    ("ix_payrolls_employee_id", "payrolls", "employee_id"),
    ("ix_payrolls_month_year", "payrolls", "payroll_month, payroll_year"),
    
    # Leave Requests
    ("ix_leave_requests_employee_id", "leave_requests", "employee_id"),
    ("ix_leave_requests_status", "leave_requests", "status"),
    ("ix_leave_requests_dates", "leave_requests", "start_date, end_date"),
    
    # HRMS & Assets
    ("ix_employee_documents_employee_id", "employee_documents", "employee_id"),
    ("ix_asset_assignments_employee_id", "asset_assignments", "employee_id"),
    ("ix_asset_assignments_asset_id", "asset_assignments", "asset_id"),
    ("ix_employees_user_id", "employees", "user_id"),
    ("ix_employees_department_id", "employees", "department_id"),
    
    # Notary Services
    ("ix_notary_service_fees_notary_id", "notary_service_fees", "notary_id"),
    ("ix_notary_service_fees_service_id", "notary_service_fees", "service_id"),
]

def apply_performance_indexes():
    print("Applying performance database indexes (zero-data-loss, CREATE INDEX IF NOT EXISTS)...")
    success_count = 0
    with engine.connect() as conn:
        for idx_name, table_name, columns in INDEXES_TO_CREATE:
            try:
                # First check if table exists
                table_exists_query = text(f"""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = '{table_name}'
                    )
                """)
                if not conn.execute(table_exists_query).scalar():
                    print(f"Skipping {idx_name}: table '{table_name}' does not exist.")
                    continue

                sql = f"CREATE INDEX IF NOT EXISTS {idx_name} ON {table_name} ({columns});"
                conn.execute(text(sql))
                conn.commit()
                print(f"[OK] {idx_name} on {table_name}({columns})")
                success_count += 1
            except Exception as e:
                print(f"[ERROR] Failed to create {idx_name} on {table_name}: {e}")
                conn.rollback()

    print(f"\nCompleted! {success_count}/{len(INDEXES_TO_CREATE)} indexes verified/created successfully.")

if __name__ == "__main__":
    apply_performance_indexes()
