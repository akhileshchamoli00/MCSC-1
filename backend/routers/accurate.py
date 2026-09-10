import os
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc

import models
import schemas
import auth
from database import get_db
from utils.accurate_client import AccurateClient

router = APIRouter(
    prefix="/api/accurate",
    tags=["accurate"],
    responses={404: {"description": "Not found"}},
)

@router.get("/config", response_model=schemas.AccurateConfigResponse)
def get_accurate_config(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Retrieve current Accurate Online integration configuration and connectivity status.
    """
    client = AccurateClient(db)
    config = client.config

    if not config:
        raise HTTPException(status_code=404, detail="Accurate configuration not found")

    is_connected = bool(client.get_valid_access_token() and (config.database_id or config.api_key))
    has_credentials = bool((config.client_id and config.client_secret) or config.api_key)

    # Return response without exposing any client secret, token, or api key
    return schemas.AccurateConfigResponse(
        id=config.id,
        client_id=None,
        client_secret=None,
        api_key=None,
        database_id=config.database_id,
        database_alias=config.database_alias,
        default_bank_account_no=config.default_bank_account_no or "1101",
        default_bank_account_name=config.default_bank_account_name or "Bank BCA",
        default_sales_account_no=config.default_sales_account_no or "4101",
        default_ar_account_no=config.default_ar_account_no or "1103",
        default_dp_account_no=config.default_dp_account_no or "2102",
        default_tax_ppn_no=config.default_tax_ppn_no or "PPN 11%",
        auto_sync_on_proforma=config.auto_sync_on_proforma if config.auto_sync_on_proforma is not None else True,
        auto_sync_on_payment=config.auto_sync_on_payment if config.auto_sync_on_payment is not None else True,
        auto_sync_on_final_invoice=config.auto_sync_on_final_invoice if config.auto_sync_on_final_invoice is not None else True,
        is_active=config.is_active if config.is_active is not None else True,
        is_connected=is_connected,
        has_credentials=has_credentials,
        token_expires_at=config.token_expires_at,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.post("/config", response_model=schemas.AccurateConfigResponse)
def update_accurate_config(
    payload: schemas.AccurateConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Save or update Accurate Online OAuth credentials and default Chart of Accounts mapping.
    """
    client = AccurateClient(db)
    config = client.config

    if not config:
        config = models.AccurateConfig()
        db.add(config)

    if payload.client_id is not None:
        config.client_id = payload.client_id.strip() if payload.client_id else None
        
    if payload.client_secret is not None and payload.client_secret != "••••••••":
        config.client_secret = payload.client_secret.strip() if payload.client_secret else None
        
    if payload.api_key is not None:
        config.api_key = payload.api_key.strip() if payload.api_key else None

    if payload.database_id is not None:
        config.database_id = payload.database_id.strip() if payload.database_id else None

    if payload.database_alias is not None:
        config.database_alias = payload.database_alias.strip() if payload.database_alias else None

    if payload.default_bank_account_no is not None:
        config.default_bank_account_no = payload.default_bank_account_no

    if payload.default_bank_account_name is not None:
        config.default_bank_account_name = payload.default_bank_account_name

    if payload.default_sales_account_no is not None:
        config.default_sales_account_no = payload.default_sales_account_no

    if payload.default_ar_account_no is not None:
        config.default_ar_account_no = payload.default_ar_account_no

    if payload.default_dp_account_no is not None:
        config.default_dp_account_no = payload.default_dp_account_no

    if payload.default_tax_ppn_no is not None:
        config.default_tax_ppn_no = payload.default_tax_ppn_no

    if payload.auto_sync_on_proforma is not None:
        config.auto_sync_on_proforma = payload.auto_sync_on_proforma

    if payload.auto_sync_on_payment is not None:
        config.auto_sync_on_payment = payload.auto_sync_on_payment

    if payload.auto_sync_on_final_invoice is not None:
        config.auto_sync_on_final_invoice = payload.auto_sync_on_final_invoice

    if payload.is_active is not None:
        config.is_active = payload.is_active

    db.commit()
    db.refresh(config)

    is_connected = bool(client.get_valid_access_token() and (config.database_id or config.api_key))
    has_credentials = bool((config.client_id and config.client_secret) or config.api_key)

    return schemas.AccurateConfigResponse(
        id=config.id,
        client_id=None,
        client_secret=None,
        api_key=None,
        database_id=config.database_id,
        database_alias=config.database_alias,
        default_bank_account_no=config.default_bank_account_no,
        default_bank_account_name=config.default_bank_account_name,
        default_sales_account_no=config.default_sales_account_no,
        default_ar_account_no=config.default_ar_account_no,
        default_dp_account_no=config.default_dp_account_no,
        default_tax_ppn_no=config.default_tax_ppn_no,
        auto_sync_on_proforma=config.auto_sync_on_proforma,
        auto_sync_on_payment=config.auto_sync_on_payment,
        auto_sync_on_final_invoice=config.auto_sync_on_final_invoice,
        is_active=config.is_active,
        is_connected=is_connected,
        has_credentials=has_credentials,
        token_expires_at=config.token_expires_at,
        created_at=config.created_at,
        updated_at=config.updated_at
    )


@router.get("/auth-url")
def get_auth_url(
    redirect_uri: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Generates the Accurate OAuth 2.0 authorization URL for connecting company account.
    """
    client = AccurateClient(db)
    if not redirect_uri:
        # Default to backend callback or frontend callback url
        redirect_uri = os.getenv("ACCURATE_REDIRECT_URI", "http://localhost:8000/api/accurate/callback")

    try:
        url = client.get_auth_url(redirect_uri=redirect_uri)
        return {"success": True, "auth_url": url, "redirect_uri": redirect_uri}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/callback")
def accurate_oauth_callback(
    request: Request,
    code: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    OAuth2 callback endpoint from Accurate Online authorization redirect.
    """
    frontend_base = os.getenv("FRONTEND_URL", "http://localhost:3000")

    if error:
        err_text = error_description or error
        return RedirectResponse(url=f"{frontend_base}/business/settings/accurate?status=error&error={err_text}")

    if not code:
        return RedirectResponse(url=f"{frontend_base}/business/settings/accurate?status=info&message=Callback+received+without+auth+code")

    client = AccurateClient(db)
    # Reconstruct the exact redirect_uri used
    host = request.headers.get("host", "localhost:8000")
    protocol = "https" if "https" in request.headers.get("x-forwarded-proto", "") or "mcsc.co.id" in host else "http"
    redirect_uri = f"{protocol}://{host}/api/accurate/callback"

    res = client.exchange_code_for_token(code=code, redirect_uri=redirect_uri)

    if res.get("success"):
        # Fetch databases automatically
        databases = client.get_databases()
        if databases and client.config:
            client.config.database_id = str(databases[0].get("id"))
            client.config.database_alias = databases[0].get("alias") or databases[0].get("name")
            db.commit()

        return RedirectResponse(url=f"{frontend_base}/business/settings/accurate?status=connected")
    else:
        err = res.get("error", "Failed to connect Accurate Online")
        return RedirectResponse(url=f"{frontend_base}/business/settings/accurate?status=error&error={err}")


@router.post("/test-connection", response_model=schemas.AccurateTestConnectionResponse)
def test_connection(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Tests live connection to Accurate Online API and discovers company databases.
    """
    client = AccurateClient(db)
    res = client.test_connection()
    return schemas.AccurateTestConnectionResponse(
        success=res.get("success", False),
        message=res.get("message", ""),
        database_name=res.get("database_name"),
        databases=res.get("databases"),
        error=res.get("error")
    )


@router.get("/databases")
def get_databases(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Lists available Accurate Online databases for the authenticated account.
    """
    client = AccurateClient(db)
    databases = client.get_databases()
    return {"success": True, "databases": databases}


@router.post("/select-database")
def select_database(
    database_id: str = Query(...),
    database_alias: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Sets the active Accurate Online company database.
    """
    client = AccurateClient(db)
    config = client.config
    if not config:
        raise HTTPException(status_code=404, detail="Accurate configuration not found")

    config.database_id = database_id
    if database_alias:
        config.database_alias = database_alias
    db.commit()
    db.refresh(config)

    return {
        "success": True,
        "message": f"Active Accurate database updated to #{database_id} ({config.database_alias or 'Live'})",
        "database_id": config.database_id,
        "database_alias": config.database_alias
    }


@router.get("/logs", response_model=List[schemas.AccurateSyncLogResponse])
def get_sync_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Returns audit logs of all Accurate synchronization requests, responses, and errors.
    """
    query = db.query(models.AccurateSyncLog)
    if status:
        query = query.filter(models.AccurateSyncLog.status == status.upper())
    if event_type:
        query = query.filter(models.AccurateSyncLog.event_type == event_type.upper())

    logs = query.order_by(desc(models.AccurateSyncLog.created_at)).offset(offset).limit(limit).all()
    return logs


@router.post("/sync-order/{order_id_or_number}", response_model=schemas.AccurateManualSyncResponse)
def sync_order_manually(
    order_id_or_number: str,
    payload: Optional[schemas.AccurateManualSyncRequest] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Manually triggers on-demand sync for an order (e.g. retry after downtime or backfill).
    Automatically determines whether to sync Customer, Proforma SO, Sales Invoice, or Sales Receipt.
    Accepts either integer ID or order number string (e.g. MCSX-260002).
    """
    if not order_id_or_number or order_id_or_number.strip().lower() in ["undefined", "null", "none"]:
        raise HTTPException(status_code=400, detail="Invalid order identifier provided")

    cleaned_param = order_id_or_number.strip()
    if cleaned_param.isdigit():
        order = db.query(models.ClientOrder).filter(models.ClientOrder.id == int(cleaned_param)).first()
    else:
        order = db.query(models.ClientOrder).filter(models.ClientOrder.order_number == cleaned_param).first()

    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id_or_number}' not found")

    client = AccurateClient(db)
    sync_type = payload.sync_type if payload else "AUTO"
    order_num = order.order_number or f"ORD-{order.id}"

    # 1. Sync Customer First if not synced
    company = order.billing_company or order.company
    if company:
        cust_res = client.sync_customer(company)
        if not cust_res.get("success"):
            return schemas.AccurateManualSyncResponse(
                success=False,
                message=f"Customer sync failed: {cust_res.get('error')}",
                order_id=order.id,
                order_number=order_num,
                sync_status="FAILED",
                details=cust_res
            )

    # 2. Determine action
    if sync_type == "CUSTOMER":
        return schemas.AccurateManualSyncResponse(
            success=True,
            message="Customer profile successfully synced with Accurate Online",
            order_id=order.id,
            order_number=order_num,
            accurate_doc_no=company.accurate_customer_no if company else None,
            sync_status="SYNCED",
            details=cust_res if company else None
        )

    # Calculate group total across all items in this order
    target_orders = db.query(models.ClientOrder).filter(
        models.ClientOrder.order_number == order.order_number
    ).all() if order.order_number else [order]
    group_total = sum((float(o.total_amount) if o.total_amount is not None else 0.0) for o in target_orders)
    proforma_pct = order.proforma_stage_percent or 50

    # If Final Invoice exists / required
    if sync_type == "SALES_INVOICE" or (sync_type == "AUTO" and (order.invoice_number or order.is_final_invoice_finalized)):
        inv_res = client.create_sales_invoice(order)
        if inv_res.get("success"):
            # If already paid, also sync receipt
            if order.payment_status in ["PAID", "FINAL_PAID", "FULLY_PAID"]:
                client.create_sales_receipt(order, payment_amount=group_total)

            return schemas.AccurateManualSyncResponse(
                success=True,
                message="Sales Invoice successfully synced to Accurate Online",
                order_id=order.id,
                order_number=order_num,
                accurate_doc_no=order.accurate_inv_no,
                sync_status=order.accurate_sync_status or "INV_CREATED",
                details=inv_res
            )
        else:
            return schemas.AccurateManualSyncResponse(
                success=False,
                message=f"Sales Invoice sync failed: {inv_res.get('error')}",
                order_id=order.id,
                order_number=order_num,
                accurate_doc_no=order.accurate_inv_no,
                sync_status="FAILED",
                details=inv_res
            )

    # If Proforma exists or default AUTO
    so_res = client.create_sales_order_proforma(order)
    if so_res.get("success"):
        # If proforma is paid, sync receipt
        if order.payment_status in ["PROFORMA_PAID", "PAID", "PARTIALLY_PAID"]:
            dp_amount = round((group_total * proforma_pct) / 100.0) if group_total else 0.0
            client.create_sales_receipt(order, payment_amount=dp_amount)

        return schemas.AccurateManualSyncResponse(
            success=True,
            message="Sales Order (Proforma) successfully synced to Accurate Online",
            order_id=order.id,
            order_number=order_num,
            accurate_doc_no=order.accurate_so_no,
            sync_status=order.accurate_sync_status or "SO_CREATED",
            details=so_res
        )
    else:
        return schemas.AccurateManualSyncResponse(
            success=False,
            message=f"Sales Order sync failed: {so_res.get('error')}",
            order_id=order.id,
            order_number=order_num,
            accurate_doc_no=order.accurate_so_no,
            sync_status="FAILED",
            details=so_res
        )
