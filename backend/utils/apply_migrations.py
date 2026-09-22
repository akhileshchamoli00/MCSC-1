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
    
    with engine.connect() as conn:
        # 0. Automatically rename 'customers' table to 'clients' if 'customers' exists
        try:
            customers_exists = False
            clients_table_exists = False
            try:
                customers_exists = bool(conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'customers'
                    )
                """)).scalar())
                clients_table_exists = bool(conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'clients'
                    )
                """)).scalar())
            except Exception:
                customers_exists = bool(conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='customers'")).first())
                clients_table_exists = bool(conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='clients'")).first())

            if customers_exists and not clients_table_exists:
                conn.execute(text("ALTER TABLE customers RENAME TO clients"))
                conn.commit()
                print("Successfully renamed database table 'customers' to 'clients'.")

                # Rename sequence if applicable
                try:
                    conn.execute(text("ALTER SEQUENCE IF EXISTS customers_id_seq RENAME TO clients_id_seq"))
                    conn.commit()
                except Exception:
                    pass
            elif customers_exists and clients_table_exists:
                try:
                    cust_count = conn.execute(text("SELECT count(*) FROM customers")).scalar()
                    cli_count = conn.execute(text("SELECT count(*) FROM clients")).scalar()
                    if cust_count and cust_count > 0 and (cli_count == 0 or cli_count is None):
                        conn.execute(text("INSERT INTO clients SELECT * FROM customers ON CONFLICT DO NOTHING"))
                        conn.commit()
                        print("Transferred data from 'customers' to 'clients'.")
                    conn.execute(text("DROP TABLE IF EXISTS customers CASCADE"))
                    conn.commit()
                    print("Cleaned up legacy 'customers' table.")
                except Exception as e_c:
                    conn.rollback()
                    print(f"Notice on copying customers to clients: {e_c}")
        except Exception as e:
            conn.rollback()
            print(f"Notice on clients table migration: {e}")

    # Create any new tables defined in models.py
    import models
    models.Base.metadata.create_all(bind=engine)
    print("Ensured all base tables exist in the database.")
    
    with engine.connect() as conn:
        # 0b. Automatically migrate legacy 'members' records into 'customers' table and drop 'members'
        try:
            members_exists = False
            try:
                members_exists = bool(conn.execute(text("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = 'members'
                    )
                """)).scalar())
            except Exception:
                members_exists = bool(conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='members'")).first())

            if members_exists:
                member_rows = conn.execute(text("SELECT * FROM members ORDER BY id ASC")).fetchall()
                for m in member_rows:
                    m_dict = dict(m._mapping)
                    m_user_id = m_dict.get("user_id")
                    m_email = m_dict.get("email")
                    m_full_name = m_dict.get("full_name") or "Customer"
                    m_phone = m_dict.get("phone")
                    m_dob = m_dict.get("date_of_birth")
                    m_status = m_dict.get("status") or "ACTIVE"
                    m_created_at = m_dict.get("created_at")

                    # Check if customer already exists for this user_id or email
                    existing_cust = None
                    if m_user_id:
                        existing_cust = conn.execute(text("SELECT id FROM customers WHERE user_id = :uid"), {"uid": m_user_id}).first()
                    if not existing_cust and m_email:
                        existing_cust = conn.execute(text("SELECT id FROM customers WHERE email = :email"), {"email": m_email}).first()

                    if not existing_cust:
                        max_seq = 0
                        all_codes = conn.execute(text("SELECT customer_code FROM customers WHERE customer_code LIKE 'CUST-%'")).fetchall()
                        for c_row in all_codes:
                            code_val = c_row[0]
                            if code_val and code_val.startswith("CUST-"):
                                try:
                                    num_part = int(code_val.split("-")[1])
                                    if num_part > max_seq:
                                        max_seq = num_part
                                except Exception:
                                    pass
                        next_code = f"CUST-{(max_seq + 1):04d}"

                        conn.execute(text("""
                            INSERT INTO customers (customer_code, full_name, email, phone, date_of_birth, status, user_id, created_at)
                            VALUES (:code, :name, :email, :phone, :dob, :status, :uid, :created_at)
                        """), {
                            "code": next_code,
                            "name": m_full_name,
                            "email": m_email,
                            "phone": m_phone,
                            "dob": m_dob,
                            "status": m_status,
                            "uid": m_user_id,
                            "created_at": m_created_at
                        })
                        conn.commit()
                        print(f"Migrated legacy member '{m_full_name}' ({m_email}) to customer code '{next_code}'.")

                conn.execute(text("DROP TABLE IF EXISTS members CASCADE"))
                conn.commit()
                print("Successfully dropped legacy 'members' table after migrating all records to 'customers'.")
        except Exception as e_mem:
            conn.rollback()
            print(f"Notice on migrating members table: {e_mem}")

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

        try:
            conn.execute(text("ALTER TABLE leave_requests ADD COLUMN half_day_session VARCHAR(20)"))
            conn.commit()
            print("Added column 'half_day_session' to 'leave_requests' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("half_day_session", "leave_requests", e)

        try:
            conn.execute(text("UPDATE leave_requests SET half_day_session = 'MORNING' WHERE days_requested = 0.5 AND (half_day_session IS NULL OR half_day_session = '')"))
            conn.commit()
        except Exception as e:
            conn.rollback()

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

        # Add client_code to partners table
        try:
            conn.execute(text("ALTER TABLE partners ADD COLUMN client_code VARCHAR(255) UNIQUE"))
            conn.commit()
            print("Added column 'client_code' to 'partners' table.")
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

        # Add payment_link, xendit_invoice_id, payment_link_created_at, and reviewer_id to client_orders table
        for col, col_type in [("payment_link", "VARCHAR(500)"), ("xendit_invoice_id", "VARCHAR(255)"), ("payment_link_created_at", "TIMESTAMP"), ("reviewer_id", "INTEGER REFERENCES employees(id) ON DELETE SET NULL")]:
            try:
                conn.execute(text(f"ALTER TABLE client_orders ADD COLUMN {col} {col_type}"))
                conn.commit()
                print(f"Added column '{col}' to 'client_orders' table.")
            except Exception as e:
                conn.rollback()
                handle_migration_error(col, "client_orders", e)

        # Seed existing partners without client_code
        try:
            res = conn.execute(text("SELECT id, created_at FROM partners WHERE client_code IS NULL ORDER BY id ASC")).fetchall()
            import datetime
            for row in res:
                cid = row[0]
                created_dt = row[1] or datetime.datetime.now()
                year_str = created_dt.strftime("%y")
                seq_num = 1
                while True:
                    test_code = f"X{year_str}{seq_num:04d}"
                    exists = conn.execute(text("SELECT 1 FROM partners WHERE client_code = :code"), {"code": test_code}).first()
                    if not exists:
                        conn.execute(text("UPDATE partners SET client_code = :code WHERE id = :id"), {"code": test_code, "id": cid})
                        conn.commit()
                        print(f"Migrated partner ID {cid} to code {test_code}")
                        break
                    seq_num += 1
        except Exception as e:
            conn.rollback()
            print(f"Error migrating partner codes: {e}")

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

        # Add channel, attachment_url, attachment_name, and quote columns to client_order_progress
        progress_cols = [
            ("channel", "VARCHAR(50) DEFAULT 'INTERNAL'"),
            ("attachment_url", "VARCHAR(500) DEFAULT NULL"),
            ("attachment_name", "VARCHAR(255) DEFAULT NULL"),
            ("quoted_message_id", "INTEGER DEFAULT NULL"),
            ("quoted_message_text", "TEXT DEFAULT NULL"),
            ("quoted_sender_name", "VARCHAR(255) DEFAULT NULL"),
            ("is_deleted", "BOOLEAN DEFAULT FALSE")
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
            ("signed_docs_sent_at", "TIMESTAMP"),
            ("signed_docs_sent_to", "VARCHAR(255)"),
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

        # Add customer_id to client_companies
        try:
            conn.execute(text("ALTER TABLE client_companies ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL"))
            conn.commit()
            print("Added column 'customer_id' to 'client_companies' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("customer_id", "client_companies", e)

        # Add customer_id to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL"))
            conn.commit()
            print("Added column 'customer_id' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("customer_id", "client_orders", e)

        # Add service_instructions to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN service_instructions TEXT"))
            conn.commit()
            print("Added column 'service_instructions' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("service_instructions", "client_orders", e)

        # Add reviewer_id to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL"))
            conn.commit()
            print("Added column 'reviewer_id' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("reviewer_id", "client_orders", e)

        # Add reviewer_ids to client_orders
        try:
            conn.execute(text("ALTER TABLE client_orders ADD COLUMN reviewer_ids JSON DEFAULT '[]'::json"))
            conn.commit()
            print("Added column 'reviewer_ids' to 'client_orders' table.")
        except Exception as e:
            conn.rollback()
            handle_migration_error("reviewer_ids", "client_orders", e)

        # Backfill reviewer_ids from existing reviewer_id if empty
        try:
            conn.execute(text("""
                UPDATE client_orders 
                SET reviewer_ids = json_build_array(reviewer_id)
                WHERE reviewer_id IS NOT NULL 
                  AND (reviewer_ids IS NULL OR reviewer_ids::text = '[]' OR reviewer_ids::text = 'null')
            """))
            conn.commit()
        except Exception as e:
            conn.rollback()
            pass

        # Create client_order_progress_reactions table if not exists
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS client_order_progress_reactions (
                    id SERIAL PRIMARY KEY,
                    progress_id INTEGER NOT NULL REFERENCES client_order_progress(id) ON DELETE CASCADE,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    emoji VARCHAR(32) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    CONSTRAINT uq_client_order_msg_user_emoji UNIQUE (progress_id, user_id, emoji)
                )
            """))
            conn.commit()
            print("Verified/created table 'client_order_progress_reactions'.")
        except Exception as e:
            conn.rollback()
            print(f"Notice on client_order_progress_reactions table: {e}")

        # Create indexes for clients/customers and relations
        for idx_sql, idx_name in [
            ("CREATE INDEX IF NOT EXISTS ix_clients_customer_code ON clients (customer_code)", "ix_clients_customer_code"),
            ("CREATE INDEX IF NOT EXISTS ix_clients_company_id ON clients (company_id)", "ix_clients_company_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_companies_customer_id ON client_companies (customer_id)", "ix_client_companies_customer_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_customer_id ON client_orders (customer_id)", "ix_client_orders_customer_id"),
            ("CREATE INDEX IF NOT EXISTS ix_client_orders_reviewer_id ON client_orders (reviewer_id)", "ix_client_orders_reviewer_id"),
            ("CREATE UNIQUE INDEX IF NOT EXISTS uq_order_user_reads_order_chan_user ON client_order_user_reads (order_number, channel, user_id)", "uq_order_user_reads_order_chan_user"),
            ("CREATE INDEX IF NOT EXISTS ix_order_user_reads_order_chan ON client_order_user_reads (order_number, channel)", "ix_order_user_reads_order_chan"),
            ("CREATE INDEX IF NOT EXISTS ix_order_msg_reactions_progress_id ON client_order_progress_reactions (progress_id)", "ix_order_msg_reactions_progress_id"),
            ("CREATE INDEX IF NOT EXISTS ix_order_msg_reactions_user_id ON client_order_progress_reactions (user_id)", "ix_order_msg_reactions_user_id"),
        ]:
            try:
                conn.execute(text(idx_sql))
                conn.commit()
                print(f"Created/verified index '{idx_name}'.")
            except Exception as e:
                conn.rollback()

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

    # Migrate any customer records incorrectly created in employees table (MCS0017)
    try:
        from utils.migrate_mcs0017_customer import migrate_mcs0017_to_customer
        migrate_mcs0017_to_customer()
    except Exception as e:
        print(f"Note on MCS0017 customer migration: {e}")

    # Ensure performance indexes
    try:
        from utils.apply_performance_indexes import apply_performance_indexes
        apply_performance_indexes()
    except Exception as e:
        print(f"Note on performance indexes migration: {e}")

    print("Migration check complete.")

if __name__ == "__main__":
    run_migrations()
