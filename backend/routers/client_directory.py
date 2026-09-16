from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timezone
from sqlalchemy import func, or_
import re

import models, schemas, auth, database

router = APIRouter(
    prefix="/api/customers",
    tags=["clients"],
    dependencies=[Depends(auth.get_current_user)]
)

def generate_client_id(db: Session) -> str:
    """
    Auto-generates sequential Client ID in format: CLI-0001, CLI-0002, etc.
    """
    last_client = db.query(models.Client).filter(
        or_(
            models.Client.customer_code.like("CLI-%"),
            models.Client.customer_code.like("CUST-%")
        )
    ).order_by(models.Client.id.desc()).first()
    
    if last_client and last_client.customer_code:
        try:
            cleaned = last_client.customer_code.replace("CLI-", "").replace("CUST-", "").strip()
            num = int(cleaned)
            return f"CLI-{num + 1:04d}"
        except (ValueError, IndexError):
            pass

    total = db.query(func.count(models.Client.id)).scalar() or 0
    return f"CLI-{total + 1:04d}"

# Backwards compatibility alias
generate_customer_id = generate_client_id


def populate_client_response(cust: models.Client, db: Session) -> schemas.CustomerResponse:
    res = schemas.CustomerResponse.model_validate(cust)
    
    # Calculate orders count
    orders_q = db.query(models.ClientOrder).filter(
        or_(
            models.ClientOrder.customer_id == cust.id,
            models.ClientOrder.company_id.in_([c.id for c in cust.companies]) if cust.companies else False
        )
    )
    res.orders_count = orders_q.count()
    res.active_orders_count = orders_q.filter(models.ClientOrder.status.in_(["CONFIRMED", "IN_PROGRESS", "UNDER_REVIEW"])).count()
    
    if cust.company:
        res.company = schemas.ClientCompanyResponse.model_validate(cust.company)
    
    if cust.companies:
        res.companies = [schemas.ClientCompanyResponse.model_validate(c) for c in cust.companies]
    elif cust.company:
        res.companies = [schemas.ClientCompanyResponse.model_validate(cust.company)]
    else:
        res.companies = []

    return res

populate_customer_response = populate_client_response


@router.get("", response_model=List[schemas.CustomerResponse])
def get_clients(
    search: Optional[str] = Query(None, description="Search by name, email, phone, client code, or company name"),
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, DISABLED"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Client).options(
        joinedload(models.Client.company),
        joinedload(models.Client.companies),
        joinedload(models.Client.user)
    )

    if status:
        query = query.filter(models.Client.status == status.upper())

    if search:
        search_term = f"%{search.strip()}%"
        query = query.outerjoin(models.Client.company).filter(
            or_(
                models.Client.full_name.ilike(search_term),
                models.Client.email.ilike(search_term),
                models.Client.phone.ilike(search_term),
                models.Client.customer_code.ilike(search_term),
                models.ClientCompany.company_name.ilike(search_term),
                models.ClientCompany.company_code.ilike(search_term)
            )
        )

    clients = query.order_by(models.Client.id.desc()).offset(skip).limit(limit).all()
    return [populate_client_response(c, db) for c in clients]


@router.get("/{id}", response_model=schemas.CustomerResponse)
def get_client(
    id: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    query = db.query(models.Client).options(
        joinedload(models.Client.company),
        joinedload(models.Client.companies),
        joinedload(models.Client.user)
    )

    if id.isdigit():
        client = query.filter(models.Client.id == int(id)).first()
    else:
        client = query.filter(models.Client.customer_code == id.strip().upper()).first()

    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return populate_client_response(client, db)


@router.post("", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_client(
    customer_in: schemas.CustomerCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    clean_email = customer_in.email.strip().lower()
    
    # Check if client already exists with this email
    existing_cust = db.query(models.Client).filter(func.lower(models.Client.email) == clean_email).first()
    if existing_cust:
        raise HTTPException(status_code=400, detail="A client with this email address already exists.")

    customer_code = customer_in.customer_code or generate_client_id(db)

    # Optional user account creation
    user_id = None
    if customer_in.create_portal_account or customer_in.password:
        existing_user = db.query(models.User).filter(func.lower(models.User.email) == clean_email).first()
        if existing_user:
            user_id = existing_user.id
        else:
            customer_role = db.query(models.Role).filter(models.Role.name == "CLIENT").first()
            if not customer_role:
                customer_role = db.query(models.Role).filter(models.Role.name == "CUSTOMER").first()
            
            raw_pwd = customer_in.password or "Client123!"
            hashed_pwd = auth.get_password_hash(raw_pwd)
            new_user = models.User(
                email=clean_email,
                hashed_password=hashed_pwd,
                role_id=customer_role.id if customer_role else None,
                is_active=True
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user_id = new_user.id

    # Create new company if company_name is provided and company_id is not set
    matched_company_id = customer_in.company_id
    if customer_in.company_name and not matched_company_id:
        from routers.clients import generate_company_code
        comp_code = customer_in.company_code or generate_company_code(db, customer_in.company_name)
        new_comp = models.ClientCompany(
            company_name=customer_in.company_name.strip(),
            company_code=comp_code,
            address=customer_in.company_address.strip() if customer_in.company_address else None,
            tax_number=customer_in.tax_number.strip() if customer_in.tax_number else None,
            industry=customer_in.industry.strip() if customer_in.industry else None,
            director_name=customer_in.director_name.strip() if customer_in.director_name else None,
            director_email=customer_in.director_email.strip() if customer_in.director_email else None,
            director_contact=customer_in.director_contact.strip() if customer_in.director_contact else None,
            notes=customer_in.company_notes.strip() if customer_in.company_notes else None,
            created_by_user_id=current_user.id
        )
        db.add(new_comp)
        db.commit()
        db.refresh(new_comp)
        matched_company_id = new_comp.id

    new_client = models.Client(
        customer_code=customer_code,
        full_name=customer_in.full_name.strip(),
        email=clean_email,
        phone=customer_in.phone.strip() if customer_in.phone else None,
        date_of_birth=customer_in.date_of_birth,
        nationality=customer_in.nationality,
        gender=customer_in.gender,
        identification_number=customer_in.identification_number,
        address=customer_in.address,
        status=customer_in.status or "ACTIVE",
        notes=customer_in.notes,
        user_id=user_id,
        company_id=matched_company_id
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)

    # Link company if specified or created
    if matched_company_id:
        comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == matched_company_id).first()
        if comp:
            comp.customer_id = new_client.id
            db.query(models.ClientOrder).filter(models.ClientOrder.company_id == comp.id).update(
                {"customer_id": new_client.id}, synchronize_session=False
            )
            db.commit()

    # Link order if specified
    if customer_in.order_number:
        clean_ord = customer_in.order_number.strip().upper()
        order = db.query(models.ClientOrder).filter(func.upper(models.ClientOrder.order_number) == clean_ord).first()
        if order:
            order.customer_id = new_client.id
            if order.company_id and not new_client.company_id:
                new_client.company_id = order.company_id
                comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == order.company_id).first()
                if comp:
                    comp.customer_id = new_client.id
            db.commit()

    db.refresh(new_client)
    return populate_client_response(new_client, db)


@router.put("/{id}/status")
def toggle_client_status(
    id: int,
    status_str: str = Query("ACTIVE", description="Target status: ACTIVE or DISABLED"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    new_status = status_str.strip().upper()
    if new_status not in ["ACTIVE", "DISABLED"]:
        raise HTTPException(status_code=400, detail="Status must be either ACTIVE or DISABLED")

    client.status = new_status
    client.updated_at = datetime.now(timezone.utc)
    
    # Also update user account status if linked
    if client.user:
        client.user.is_active = (new_status == "ACTIVE")

    db.commit()
    db.refresh(client)
    return {"message": f"Client status updated to {new_status}", "status": new_status}


@router.put("/{id}/password")
def reset_client_password(
    id: int,
    pwd_in: schemas.CustomerPasswordReset,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    auth.validate_password_strength(pwd_in.new_password)
    hashed = auth.get_password_hash(pwd_in.new_password)

    if client.user:
        client.user.hashed_password = hashed
        db.commit()
        auth.clear_user_cache(client.user.email)
    else:
        # Create user account for this client if none exists
        client_role = db.query(models.Role).filter(models.Role.name == "CLIENT").first()
        if not client_role:
            client_role = db.query(models.Role).filter(models.Role.name == "CUSTOMER").first()
            
        new_user = models.User(
            email=client.email,
            hashed_password=hashed,
            role_id=client_role.id if client_role else None,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        client.user_id = new_user.id
        db.commit()

    return {"message": "Client portal password updated successfully"}


@router.put("/{id}", response_model=schemas.CustomerResponse)
def update_client(
    id: int,
    customer_in: schemas.CustomerUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    update_data = customer_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    # If company_id was updated, ensure the company is linked
    if customer_in.company_id is not None:
        if customer_in.company_id:
            comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == customer_in.company_id).first()
            if comp:
                comp.customer_id = client.id
                db.query(models.ClientOrder).filter(models.ClientOrder.company_id == comp.id).update(
                    {"customer_id": client.id}, synchronize_session=False
                )
        else:
            # Unlink previous company
            db.query(models.ClientCompany).filter(models.ClientCompany.customer_id == client.id).update(
                {"customer_id": None}, synchronize_session=False
            )

    client.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(client)
    return populate_client_response(client, db)


@router.delete("/{id}")
def delete_client(
    id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Unlink companies and orders
    db.query(models.ClientCompany).filter(models.ClientCompany.customer_id == client.id).update(
        {"customer_id": None}, synchronize_session=False
    )
    db.query(models.ClientOrder).filter(models.ClientOrder.customer_id == client.id).update(
        {"customer_id": None}, synchronize_session=False
    )

    db.delete(client)
    db.commit()
    return {"message": "Client deleted successfully"}


@router.post("/{id}/link-company")
def link_client_company(
    id: int,
    company_id: int = Query(..., description="Company ID to link to this client"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    comp = db.query(models.ClientCompany).filter(models.ClientCompany.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")

    comp.customer_id = client.id
    if not client.company_id:
        client.company_id = comp.id

    # Update company's orders to link to this client
    db.query(models.ClientOrder).filter(models.ClientOrder.company_id == comp.id).update(
        {"customer_id": client.id}, synchronize_session=False
    )

    db.commit()
    db.refresh(client)
    return populate_client_response(client, db)


@router.post("/{id}/unlink-company")
def unlink_client_company(
    id: int,
    company_id: int = Query(..., description="Company ID to unlink"),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    client = db.query(models.Client).filter(models.Client.id == id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    comp = db.query(models.ClientCompany).filter(
        models.ClientCompany.id == company_id,
        models.ClientCompany.customer_id == client.id
    ).first()
    if comp:
        comp.customer_id = None
        if client.company_id == comp.id:
            other_comp = db.query(models.ClientCompany).filter(
                models.ClientCompany.customer_id == client.id,
                models.ClientCompany.id != comp.id
            ).first()
            client.company_id = other_comp.id if other_comp else None

        db.commit()

    db.refresh(client)
    return populate_client_response(client, db)
