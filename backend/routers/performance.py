from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/performance",
    tags=["performance"],
    dependencies=[Depends(auth.get_current_user)]
)

# ----------------- Review Cycles -----------------

@router.get("/review-cycles", response_model=List[schemas.ReviewCycleResponse])
def get_review_cycles(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Admins see all, others see active or closed
    if current_user.role and "ADMIN" in current_user.role.name.upper():
        return db.query(models.ReviewCycle).order_by(models.ReviewCycle.start_date.desc()).all()
    else:
        return db.query(models.ReviewCycle).filter(models.ReviewCycle.status != "Draft").order_by(models.ReviewCycle.start_date.desc()).all()

@router.post("/review-cycles", response_model=schemas.ReviewCycleResponse)
def create_review_cycle(cycle: schemas.ReviewCycleCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Only Admins can create review cycles")
        
    db_cycle = models.ReviewCycle(
        name=cycle.name,
        start_date=cycle.start_date,
        end_date=cycle.end_date,
        department_id=cycle.department_id,
        status=cycle.status
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

@router.put("/review-cycles/{id}", response_model=schemas.ReviewCycleResponse)
def update_review_cycle(id: int, cycle_update: schemas.ReviewCycleCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.role or "ADMIN" not in current_user.role.name.upper():
        raise HTTPException(status_code=403, detail="Only Admins can update review cycles")
        
    db_cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == id).first()
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
        
    db_cycle.name = cycle_update.name
    db_cycle.start_date = cycle_update.start_date
    db_cycle.end_date = cycle_update.end_date
    db_cycle.department_id = cycle_update.department_id
    db_cycle.status = cycle_update.status
    
    db.commit()
    db.refresh(db_cycle)
    return db_cycle


# ----------------- Employee Reviews -----------------

@router.get("/reviews", response_model=List[schemas.EmployeeReviewResponse])
def get_reviews(
    employee_id: Optional[int] = None,
    review_cycle_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.EmployeeReview)
    
    # Filter based on role/auth context
    if current_user.role and "ADMIN" in current_user.role.name.upper():
        # Admin can see everything
        pass
    elif current_user.employee:
        # Managers can see reviews they authored or reviews of their direct reports
        # Employees can only see their own reviews
        is_manager = db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).first() is not None
        
        if is_manager:
            # Show reviews authored by manager, or of direct reports, or their own review
            direct_report_ids = [e.id for e in db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).all()]
            query = query.filter(
                (models.EmployeeReview.reviewer_id == current_user.id) | 
                (models.EmployeeReview.employee_id.in_(direct_report_ids)) |
                (models.EmployeeReview.employee_id == current_user.employee.id)
            )
        else:
            # Employee only sees their own finalized reviews
            query = query.filter(
                models.EmployeeReview.employee_id == current_user.employee.id,
                models.EmployeeReview.status == "Submitted"
            )
    else:
        # Fallback if user has no employee linked
        query = query.filter(models.EmployeeReview.reviewer_id == current_user.id)
        
    if employee_id:
        query = query.filter(models.EmployeeReview.employee_id == employee_id)
    if review_cycle_id:
        query = query.filter(models.EmployeeReview.review_cycle_id == review_cycle_id)
        
    return query.order_by(models.EmployeeReview.created_at.desc()).all()

@router.get("/reviews/{id}", response_model=schemas.EmployeeReviewResponse)
def get_review_by_id(id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    review = db.query(models.EmployeeReview).filter(models.EmployeeReview.id == id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    # Access check
    if current_user.role and "ADMIN" in current_user.role.name.upper():
        return review
        
    if current_user.employee:
        # Allowed if employee is target, reviewer is author, or employee's manager matches
        is_target = review.employee_id == current_user.employee.id
        is_author = review.reviewer_id == current_user.id
        is_manager = db.query(models.Employee).filter(
            models.Employee.id == review.employee_id,
            models.Employee.manager_id == current_user.employee.id
        ).first() is not None
        
        if is_target and review.status == "Draft":
            raise HTTPException(status_code=403, detail="Self reviews can only see completed reviews")
            
        if is_target or is_author or is_manager:
            return review
            
    raise HTTPException(status_code=403, detail="Not authorized to view this review")

@router.post("/reviews", response_model=schemas.EmployeeReviewResponse)
def create_employee_review(review: schemas.EmployeeReviewCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Validate reviewer roles
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    is_manager = current_user.employee and db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).first() is not None
    
    if not is_admin and not is_manager:
        raise HTTPException(status_code=403, detail="Only Managers and Admins can create performance reviews")
        
    # Ensure cycle exists and is active
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == review.review_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    if cycle.status == "Closed" and not is_admin:
        raise HTTPException(status_code=400, detail="Cannot create review for a closed cycle")
        
    # Ensure review doesn't already exist for this cycle/employee combo
    existing = db.query(models.EmployeeReview).filter(
        models.EmployeeReview.review_cycle_id == review.review_cycle_id,
        models.EmployeeReview.employee_id == review.employee_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this employee in this cycle")

    db_review = models.EmployeeReview(
        review_cycle_id=review.review_cycle_id,
        employee_id=review.employee_id,
        reviewer_id=current_user.id, # Assign current logged in user as reviewer
        overall_rating=review.overall_rating,
        key_strengths=review.key_strengths,
        improvement_areas=review.improvement_areas,
        goals_achieved=review.goals_achieved,
        new_goals=review.new_goals,
        comments=review.comments,
        development_plan=review.development_plan,
        promotion_readiness=review.promotion_readiness,
        training_recommendation=review.training_recommendation,
        status=review.status
    )
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review

@router.put("/reviews/{id}", response_model=schemas.EmployeeReviewResponse)
def update_employee_review(id: int, review_update: schemas.EmployeeReviewUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_review = db.query(models.EmployeeReview).filter(models.EmployeeReview.id == id).first()
    if not db_review:
        raise HTTPException(status_code=404, detail="Review not found")
        
    # Access check: only author or admin
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    if db_review.reviewer_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to edit this review")
        
    # Cannot edit submitted reviews unless Admin
    if db_review.status == "Submitted" and not is_admin:
        raise HTTPException(status_code=400, detail="Cannot edit a submitted review")

    update_data = review_update.model_dump(exclude_unset=True) if hasattr(review_update, "model_dump") else review_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_review, key, value)
        
    db.commit()
    db.refresh(db_review)
    return db_review


# ----------------- Self-Reviews -----------------

@router.post("/self-review", response_model=schemas.SelfReviewResponse)
def submit_self_review(review: schemas.SelfReviewCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    if not current_user.employee:
        raise HTTPException(status_code=400, detail="No employee profile linked to your user account")
        
    if review.employee_id != current_user.employee.id:
        raise HTTPException(status_code=403, detail="You can only submit self-reviews for yourself")
        
    # Ensure cycle is active
    cycle = db.query(models.ReviewCycle).filter(models.ReviewCycle.id == review.review_cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Review cycle not found")
    if cycle.status != "Active":
        raise HTTPException(status_code=400, detail="Self-reviews can only be submitted for active cycles")

    # Check existing self review
    existing = db.query(models.SelfReview).filter(
        models.SelfReview.review_cycle_id == review.review_cycle_id,
        models.SelfReview.employee_id == review.employee_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Self review already submitted for this cycle")

    db_self = models.SelfReview(
        review_cycle_id=review.review_cycle_id,
        employee_id=review.employee_id,
        achievements=review.achievements,
        challenges=review.challenges,
        support_needed=review.support_needed,
        skills_to_improve=review.skills_to_improve,
        self_rating=review.self_rating
    )
    db.add(db_self)
    db.commit()
    db.refresh(db_self)
    return db_self

@router.get("/self-reviews", response_model=List[schemas.SelfReviewResponse])
def get_self_reviews(
    employee_id: Optional[int] = None,
    review_cycle_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.SelfReview)
    
    if current_user.role and "ADMIN" in current_user.role.name.upper():
        pass
    elif current_user.employee:
        is_manager = db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).first() is not None
        if is_manager:
            direct_report_ids = [e.id for e in db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).all()]
            query = query.filter(
                (models.SelfReview.employee_id.in_(direct_report_ids)) |
                (models.SelfReview.employee_id == current_user.employee.id)
            )
        else:
            query = query.filter(models.SelfReview.employee_id == current_user.employee.id)
    else:
        return []
        
    if employee_id:
        query = query.filter(models.SelfReview.employee_id == employee_id)
    if review_cycle_id:
        query = query.filter(models.SelfReview.review_cycle_id == review_cycle_id)
        
    return query.all()


# ----------------- Review Goals -----------------

@router.get("/goals", response_model=List[schemas.ReviewGoalResponse])
def get_goals(
    employee_id: Optional[int] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.ReviewGoal)
    
    if current_user.role and "ADMIN" in current_user.role.name.upper():
        pass
    elif current_user.employee:
        is_manager = db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).first() is not None
        if is_manager:
            direct_report_ids = [e.id for e in db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).all()]
            query = query.filter(
                (models.ReviewGoal.employee_id.in_(direct_report_ids)) |
                (models.ReviewGoal.employee_id == current_user.employee.id)
            )
        else:
            query = query.filter(models.ReviewGoal.employee_id == current_user.employee.id)
    else:
        return []
        
    if employee_id:
        query = query.filter(models.ReviewGoal.employee_id == employee_id)
        
    return query.order_by(models.ReviewGoal.target_date.asc()).all()

@router.post("/goals", response_model=schemas.ReviewGoalResponse)
def create_goal(goal: schemas.ReviewGoalCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    is_self = current_user.employee and current_user.employee.id == goal.employee_id
    is_manager = False
    
    if current_user.employee:
        is_manager = db.query(models.Employee).filter(
            models.Employee.id == goal.employee_id,
            models.Employee.manager_id == current_user.employee.id
        ).first() is not None

    if not is_admin and not is_self and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to set goals for this employee")

    db_goal = models.ReviewGoal(
        employee_id=goal.employee_id,
        review_cycle_id=goal.review_cycle_id,
        title=goal.title,
        description=goal.description,
        target_date=goal.target_date,
        priority=goal.priority,
        status=goal.status,
        progress_pct=goal.progress_pct,
        created_by=current_user.id
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@router.put("/goals/{id}", response_model=schemas.ReviewGoalResponse)
def update_goal(id: int, goal_update: schemas.ReviewGoalUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_goal = db.query(models.ReviewGoal).filter(models.ReviewGoal.id == id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    is_self = current_user.employee and current_user.employee.id == db_goal.employee_id
    is_manager = False
    
    if current_user.employee:
        is_manager = db.query(models.Employee).filter(
            models.Employee.id == db_goal.employee_id,
            models.Employee.manager_id == current_user.employee.id
        ).first() is not None

    if not is_admin and not is_self and not is_manager:
        raise HTTPException(status_code=403, detail="Not authorized to edit this goal")

    update_data = goal_update.model_dump(exclude_unset=True) if hasattr(goal_update, "model_dump") else goal_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_goal, key, value)
        
    db.commit()
    db.refresh(db_goal)
    return db_goal


# ----------------- Dashboard & Analytics -----------------

@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    is_admin = current_user.role and "ADMIN" in current_user.role.name.upper()
    is_manager = current_user.employee and db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).first() is not None
    
    reviews_query = db.query(models.EmployeeReview)
    goals_query = db.query(models.ReviewGoal)
    
    if not is_admin:
        if is_manager:
            direct_report_ids = [e.id for e in db.query(models.Employee).filter(models.Employee.manager_id == current_user.employee.id).all()]
            reviews_query = reviews_query.filter(
                (models.EmployeeReview.reviewer_id == current_user.id) | 
                (models.EmployeeReview.employee_id.in_(direct_report_ids))
            )
            goals_query = goals_query.filter(models.ReviewGoal.employee_id.in_(direct_report_ids))
        else:
            reviews_query = reviews_query.filter(models.EmployeeReview.employee_id == current_user.employee.id, models.EmployeeReview.status == "Submitted")
            goals_query = goals_query.filter(models.ReviewGoal.employee_id == current_user.employee.id)

    # Optimize by querying counts in grouped queries
    reviews_data = reviews_query.with_entities(
        models.EmployeeReview.status,
        models.EmployeeReview.overall_rating,
        func.count(models.EmployeeReview.id)
    ).group_by(models.EmployeeReview.status, models.EmployeeReview.overall_rating).all()

    pending_reviews = 0
    completed_reviews = 0
    needing_improvement = 0
    top_performers = 0

    ratings_dist = []
    counts_dict = {"Excellent": 0, "Good": 0, "Average": 0, "Needs Improvement": 0, "Poor": 0}

    for status, rating, count in reviews_data:
        if status == "Draft":
            pending_reviews += count
        elif status == "Submitted":
            completed_reviews += count
            if rating in ["Needs Improvement", "Poor"]:
                needing_improvement += count
            if rating in ["Excellent", "Good"]:
                top_performers += count
            if rating in counts_dict:
                counts_dict[rating] += count

    for r_type in ["Excellent", "Good", "Average", "Needs Improvement", "Poor"]:
        ratings_dist.append({"name": r_type, "value": counts_dict[r_type]})
    
    upcoming_goals_list = []
    upcoming_goals = goals_query.options(joinedload(models.ReviewGoal.employee)).filter(
        models.ReviewGoal.status.in_(["Not Started", "In Progress"]),
        models.ReviewGoal.target_date >= date.today()
    ).order_by(models.ReviewGoal.target_date.asc()).limit(5).all()
    
    for g in upcoming_goals:
        upcoming_goals_list.append({
            "id": g.id,
            "title": g.title,
            "target_date": g.target_date.strftime("%Y-%m-%d") if g.target_date else None,
            "progress_pct": g.progress_pct,
            "employee_name": f"{g.employee.first_name} {g.employee.last_name}" if g.employee else "Unknown"
        })
        
    dept_summary = []
    if is_admin or is_manager:
        results = db.query(
            models.Department.name,
            func.count(models.EmployeeReview.id)
        ).select_from(models.Department).outerjoin(
            models.Employee, models.Employee.department_id == models.Department.id
        ).outerjoin(
            models.EmployeeReview, 
            (models.EmployeeReview.employee_id == models.Employee.id) & 
            (models.EmployeeReview.status == "Submitted")
        ).group_by(
            models.Department.id, models.Department.name
        ).all()
        
        for name, count in results:
            dept_summary.append({
                "department_name": name,
                "completed_reviews": count
            })

    goals_dist = []
    goal_counts = goals_query.with_entities(
        models.ReviewGoal.status,
        func.count(models.ReviewGoal.id)
    ).group_by(models.ReviewGoal.status).all()
    
    goal_counts_dict = {status: count for status, count in goal_counts}
    for g_status in ["Not Started", "In Progress", "Completed"]:
        goals_dist.append({"name": g_status, "value": goal_counts_dict.get(g_status, 0)})

    return {
        "pending_reviews": pending_reviews,
        "completed_reviews": completed_reviews,
        "needing_improvement": needing_improvement,
        "top_performers": top_performers,
        "upcoming_goals": upcoming_goals_list,
        "department_summary": dept_summary,
        "ratings_distribution": ratings_dist,
        "goals_status_distribution": goals_dist
    }
