import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from database import SessionLocal
import models
from routers.clients import parse_consultant_ids

def run_backfill():
    db = SessionLocal()
    try:
        print("Starting backfill for active order assignment notifications...")
        
        # Query all active orders that have consultant or reviewer assignments
        all_orders = db.query(models.ClientOrder).filter(
            ~models.ClientOrder.status.in_(["COMPLETED", "CANCELLED"])
        ).all()
        
        # Group orders by order_number
        grouped_orders = {}
        for ord_obj in all_orders:
            num = ord_obj.order_number
            if not num:
                continue
            if num not in grouped_orders:
                grouped_orders[num] = []
            grouped_orders[num].append(ord_obj)
            
        print(f"Found {len(grouped_orders)} unique active orders.")
        
        created_count = 0
        skipped_count = 0
        
        for order_number, order_items in grouped_orders.items():
            first_order = order_items[0]
            
            # Extract company name and service names
            company_name = None
            if first_order.company:
                company_name = first_order.company.company_name
            elif first_order.client and first_order.client.companies:
                company_name = first_order.client.companies[0].company_name
            elif first_order.client:
                company_name = first_order.client.contact_person
                
            service_names = [o.job_title for o in order_items if o.job_title]
            company_info = f" for {company_name}" if company_name else ""
            services_info = f" ({', '.join(service_names[:2])})" if service_names else ""
            
            # Collect unique consultant IDs across items in order group
            consultant_ids = set()
            reviewer_ids = set()
            for o in order_items:
                consultant_ids.update(parse_consultant_ids(o.consultant_ids))
                r_ids = parse_consultant_ids(getattr(o, "reviewer_ids", None))
                if o.reviewer_id and o.reviewer_id not in r_ids:
                    r_ids.append(o.reviewer_id)
                reviewer_ids.update(r_ids)
                
            # 1. Backfill Consultants
            for cid in consultant_ids:
                emp = db.query(models.Employee).filter(models.Employee.id == cid).first()
                if not emp or not emp.user_id:
                    continue
                    
                exists = db.query(models.Notification).filter(
                    models.Notification.user_id == emp.user_id,
                    models.Notification.reference_id == first_order.id,
                    models.Notification.type == "order_assignment"
                ).first()
                
                if exists:
                    skipped_count += 1
                    continue
                    
                notif = models.Notification(
                    user_id=emp.user_id,
                    title=f"Assigned as Consultant - Order #{order_number}",
                    message=f"You have been assigned as an executing consultant on Order #{order_number}{company_info}{services_info}.",
                    type="order_assignment",
                    module="orders",
                    system_area="shared",
                    reference_id=first_order.id,
                    action_url=f"/business/assigned-orders?order={order_number}&chat=false"
                )
                db.add(notif)
                created_count += 1
                
            # 2. Backfill Reviewers
            for rid in reviewer_ids:
                emp = db.query(models.Employee).filter(models.Employee.id == rid).first()
                if not emp or not emp.user_id:
                    continue
                    
                exists = db.query(models.Notification).filter(
                    models.Notification.user_id == emp.user_id,
                    models.Notification.reference_id == first_order.id,
                    models.Notification.type == "order_review_assignment"
                ).first()
                
                if exists:
                    skipped_count += 1
                    continue
                    
                notif = models.Notification(
                    user_id=emp.user_id,
                    title=f"Assigned as Reviewer - Order #{order_number}",
                    message=f"You have been assigned as a designated reviewer on Order #{order_number}{company_info}{services_info}.",
                    type="order_review_assignment",
                    module="orders",
                    system_area="shared",
                    reference_id=first_order.id,
                    action_url=f"/business/assigned-orders?order={order_number}&chat=false"
                )
                db.add(notif)
                created_count += 1
                
        db.commit()
        print(f"Backfill complete! Created {created_count} notifications, skipped {skipped_count} existing notifications.")
    except Exception as e:
        db.rollback()
        print(f"Backfill failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    run_backfill()
