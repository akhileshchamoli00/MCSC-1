import sys
import os
from sqlalchemy import text

# Add backend directory to system path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
import models
from utils.seed_rbac import seed_rbac_data

def migrate():
    print("Starting database migration via SQLAlchemy...")
    
    db = SessionLocal()
    
    # 1. Execute raw ALTER TABLE to add the column safely
    try:
        print("Attempting to add 'system_area' column to 'modules' table...")
        db.execute(text("ALTER TABLE modules ADD COLUMN system_area VARCHAR DEFAULT 'shared';"))
        db.commit()
        print("Successfully added 'system_area' column!")
    except Exception as sql_err:
        db.rollback()
        err_msg = str(sql_err).lower()
        if "already exists" in err_msg or "duplicate column" in err_msg or "duplicate" in err_msg:
            print("Column 'system_area' already exists. Skipping alteration.")
        else:
            print(f"Note/Warning during ALTER TABLE: {sql_err}")
            
    # 2. Re-run seeder to populate values
    print("Re-seeding modules in database...")
    try:
        seed_rbac_data(db)
        print("Database migration and seeding completed successfully!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
