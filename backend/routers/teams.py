from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/teams",
    tags=["teams"],
    dependencies=[Depends(auth.get_current_user)]
)

def generate_team_code(name: str, db: Session) -> str:
    import re
    # Clean the name: keep only letters and numbers
    words = re.findall(r'[a-zA-Z0-9]+', name)
    if len(words) == 1:
        code_base = words[0][:4].upper()
    else:
        code_base = "".join(w[0] for w in words).upper()
        
    if not code_base:
        code_base = "TEAM"
        
    # Check uniqueness and append sequence number if needed
    code = code_base
    existing = db.query(models.Team).filter(models.Team.code == code).first()
    seq = 1
    while existing:
        code = f"{code_base}{seq}"
        existing = db.query(models.Team).filter(models.Team.code == code).first()
        seq += 1
        
    return code

@router.get("", response_model=List[schemas.TeamResponse])
def get_teams(active_only: bool = False, db: Session = Depends(database.get_db)):
    query = db.query(models.Team)
    if active_only:
        query = query.filter(models.Team.is_active == True)
    return query.order_by(models.Team.name).all()

@router.get("/{team_id}", response_model=schemas.TeamResponse)
def get_team(team_id: int, db: Session = Depends(database.get_db)):
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team

@router.post("", response_model=schemas.TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(team_data: schemas.TeamCreate, db: Session = Depends(database.get_db)):
    # Check if team name already exists
    existing = db.query(models.Team).filter(models.Team.name.ilike(team_data.name)).first()
    if existing:
        raise HTTPException(status_code=400, detail="A team with this name already exists")
        
    code = generate_team_code(team_data.name, db)
    
    data = team_data.model_dump() if hasattr(team_data, "model_dump") else team_data.dict()
    db_team = models.Team(code=code, **data)
    
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team

@router.put("/{team_id}", response_model=schemas.TeamResponse)
def update_team(team_id: int, team_data: schemas.TeamUpdate, db: Session = Depends(database.get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    data = team_data.model_dump(exclude_unset=True) if hasattr(team_data, "model_dump") else team_data.dict(exclude_unset=True)
    
    # If name is being changed, check uniqueness and regenerate code
    if "name" in data and data["name"] != db_team.name:
        existing = db.query(models.Team).filter(models.Team.name.ilike(data["name"]), models.Team.id != team_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="A team with this name already exists")
        db_team.code = generate_team_code(data["name"], db)
        
    for key, value in data.items():
        setattr(db_team, key, value)
        
    db.commit()
    db.refresh(db_team)
    return db_team

@router.post("/{team_id}/members", response_model=schemas.TeamResponse)
def assign_team_members(team_id: int, member_data: schemas.TeamMemberAssign, db: Session = Depends(database.get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    # Get employees
    employees = db.query(models.Employee).filter(models.Employee.id.in_(member_data.employee_ids)).all()
    db_team.members = employees
    
    db.commit()
    db.refresh(db_team)
    return db_team

@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_team(team_id: int, db: Session = Depends(database.get_db)):
    db_team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not db_team:
        raise HTTPException(status_code=404, detail="Team not found")
        
    db.delete(db_team)
    db.commit()
    return None
