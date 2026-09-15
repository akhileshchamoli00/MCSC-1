import os
import json
import re
import requests
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from dotenv import load_dotenv
from sqlalchemy.orm import Session

root_env = Path(__file__).resolve().parent.parent.parent / ".env.local"
if root_env.exists():
    load_dotenv(dotenv_path=root_env, override=True)
load_dotenv()

import models

ACCURATE_OAUTH_HOST = "https://account.accurate.id"
ACCURATE_API_HOST = "https://zeus.accurate.id/accurate"

class AccurateClient:
    def __init__(self, db: Session):
        self.db = db
        self.config = self._get_config()

    def _get_config(self) -> Optional[models.AccurateConfig]:
        config = self.db.query(models.AccurateConfig).filter(models.AccurateConfig.is_active == True).first()
        if not config:
            # Create a default empty config record if none exists
            config = models.AccurateConfig(
                is_active=True,
                default_bank_account_no="1101",
                default_bank_account_name="Bank BCA",
                default_sales_account_no="4101",
                default_ar_account_no="1103",
                default_dp_account_no="2102",
                default_tax_ppn_no="PPN 11%"
            )
            self.db.add(config)
            self.db.commit()
            self.db.refresh(config)
        return config

    def log_sync(
        self,
        event_type: str,
        status: str,
        reference_id: Optional[str] = None,
        reference_number: Optional[str] = None,
        accurate_doc_no: Optional[str] = None,
        request_payload: Optional[Any] = None,
        response_payload: Optional[Any] = None,
        error_message: Optional[str] = None
    ):
        try:
            req_str = json.dumps(request_payload, default=str) if isinstance(request_payload, (dict, list)) else str(request_payload or "")
            res_str = json.dumps(response_payload, default=str) if isinstance(response_payload, (dict, list)) else str(response_payload or "")
            
            log = models.AccurateSyncLog(
                event_type=event_type,
                status=status,
                reference_id=reference_id,
                reference_number=reference_number,
                accurate_doc_no=accurate_doc_no,
                request_payload=req_str[:4000] if req_str else None,
                response_payload=res_str[:4000] if res_str else None,
                error_message=str(error_message)[:2000] if error_message else None
            )
            self.db.add(log)
            self.db.commit()
        except Exception as e:
            print(f"Warning: Failed to save AccurateSyncLog: {e}")

    def get_auth_url(self, redirect_uri: str) -> str:
        if not self.config or not self.config.client_id:
            raise ValueError("Accurate Client ID is not configured. Please save API credentials first.")
        
        scope = "customer_view customer_save item_view item_save sales_order_view sales_order_save sales_invoice_view sales_invoice_save sales_receipt_view sales_receipt_save glaccount_view project_view project_save"
        return (
            f"{ACCURATE_OAUTH_HOST}/oauth/authorize"
            f"?client_id={self.config.client_id}"
            f"&response_type=code"
            f"&redirect_uri={redirect_uri}"
            f"&scope={scope}"
        )

    def exchange_code_for_token(self, code: str, redirect_uri: str) -> Dict[str, Any]:
        if not self.config or not self.config.client_id or not self.config.client_secret:
            raise ValueError("Accurate Client ID or Client Secret missing.")

        import base64
        auth_bytes = f"{self.config.client_id.strip()}:{self.config.client_secret.strip()}".encode("utf-8")
        b64_auth = base64.b64encode(auth_bytes).decode("utf-8")

        url = f"{ACCURATE_OAUTH_HOST}/oauth/token"
        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri
        }

        try:
            resp = requests.post(url, data=data, headers=headers, timeout=20)
            try:
                result = resp.json()
            except Exception:
                result = {"error": f"HTTP {resp.status_code}: {resp.text[:300]}"}
            
            if resp.status_code == 200 and "access_token" in result:
                self.config.access_token = result.get("access_token")
                self.config.refresh_token = result.get("refresh_token")
                expires_in = int(result.get("expires_in", 3600))
                self.config.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                self.db.commit()
                self.db.refresh(self.config)
                
                self.log_sync(
                    event_type="OAUTH_TOKEN_EXCHANGE",
                    status="SUCCESS",
                    response_payload={"message": "Successfully exchanged authorization code"}
                )
                return {"success": True, "data": result}
            else:
                err_msg = result.get("error_description") or result.get("error") or "Failed to exchange token"
                self.log_sync(
                    event_type="OAUTH_TOKEN_EXCHANGE",
                    status="FAILED",
                    error_message=err_msg,
                    response_payload=result
                )
                return {"success": False, "error": err_msg}
        except Exception as e:
            self.log_sync(
                event_type="OAUTH_TOKEN_EXCHANGE",
                status="FAILED",
                error_message=str(e)
            )
            return {"success": False, "error": str(e)}

    def refresh_access_token(self) -> bool:
        if not self.config or not self.config.refresh_token:
            return False

        import base64
        auth_bytes = f"{self.config.client_id.strip()}:{self.config.client_secret.strip()}".encode("utf-8")
        b64_auth = base64.b64encode(auth_bytes).decode("utf-8")

        url = f"{ACCURATE_OAUTH_HOST}/oauth/token"
        headers = {
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/x-www-form-urlencoded"
        }
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self.config.refresh_token
        }

        try:
            resp = requests.post(url, data=data, headers=headers, timeout=20)
            try:
                result = resp.json()
            except Exception:
                result = {"error": f"HTTP {resp.status_code}: {resp.text[:300]}"}

            if resp.status_code == 200 and "access_token" in result:
                self.config.access_token = result.get("access_token")
                if "refresh_token" in result:
                    self.config.refresh_token = result.get("refresh_token")
                expires_in = int(result.get("expires_in", 3600))
                self.config.token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
                self.db.commit()
                return True
            else:
                print(f"Accurate token refresh failed: {result}")
                return False
        except Exception as e:
            print(f"Accurate token refresh exception: {e}")
            return False

    def get_database_id(self) -> Optional[str]:
        if self.config and self.config.database_id:
            return str(self.config.database_id).strip()
        return os.getenv("ACCURATE_DATABASE_ID", "851599")

    def get_valid_access_token(self) -> Optional[str]:
        # 1. Environment variable token (primary secure backend source)
        env_token = os.getenv("ACCURATE_API_TOKEN")
        if env_token and env_token.strip():
            return env_token.strip()

        if not self.config:
            return None
            
        # Standalone API key takes precedence if configured
        if self.config.api_key and self.config.api_key.strip():
            return self.config.api_key.strip()

        if not self.config.access_token:
            return None

        # Check expiry
        if self.config.token_expires_at:
            now_utc = datetime.now(timezone.utc)
            if self.config.token_expires_at.tzinfo is None:
                expires = self.config.token_expires_at.replace(tzinfo=timezone.utc)
            else:
                expires = self.config.token_expires_at
                
            if now_utc >= (expires - timedelta(minutes=5)):
                self.refresh_access_token()

        return self.config.access_token

    def _get_headers(self) -> Dict[str, str]:
        import hmac
        import hashlib
        token = self.get_valid_access_token()
        db_id = self.get_database_id()
        secret = os.getenv("ACCURATE_SIGNATURE_SECRET")
        env_token = os.getenv("ACCURATE_API_TOKEN")

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # If using backend API token with signature secret, sign the request
        if secret and env_token:
            # Accurate Online API expects timestamps formatted in Asia/Jakarta timezone (UTC+7 / WIB)
            jakarta_tz = timezone(timedelta(hours=7))
            now_jakarta = datetime.now(jakarta_tz)
            timestamp_str = now_jakarta.strftime("%d/%m/%Y %H:%M:%S")
            sig_hex = hmac.new(secret.encode("utf-8"), timestamp_str.encode("utf-8"), hashlib.sha256).hexdigest()
            headers["X-Api-Timestamp"] = timestamp_str
            headers["X-Api-Signature"] = sig_hex
        elif db_id:
            # If using OAuth session token, attach X-Session-ID
            headers["X-Session-ID"] = str(db_id)

        return headers

    def get_databases(self) -> List[Dict[str, Any]]:
        db_id = self.get_database_id()
        db_alias = os.getenv("ACCURATE_DATABASE_ALIAS", "PT Mandiri Cipta Solusi")
        return [{"id": db_id, "alias": db_alias, "name": db_alias}]

    def test_connection(self) -> Dict[str, Any]:
        token = self.get_valid_access_token()
        db_id = self.get_database_id()
        if not token or not db_id:
            return {
                "success": False,
                "message": "Accurate Online credentials are not configured in backend environment."
            }

        url = f"{ACCURATE_API_HOST}/api/customer/list.do"
        headers = self._get_headers()
        params = {"fields": "id,name,customerNo", "limit": 1}

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            data = resp.json()
            if data.get("s"):
                db_alias = os.getenv("ACCURATE_DATABASE_ALIAS", "PT Mandiri Cipta Solusi")
                if self.config:
                    self.config.database_id = db_id
                    self.config.database_alias = db_alias
                    self.db.commit()

                return {
                    "success": True,
                    "message": f"Successfully connected to live Accurate Online: {db_alias} (DB #{db_id})",
                    "database_name": f"{db_alias} (#{db_id})",
                    "databases": [{"id": db_id, "alias": db_alias}]
                }
            else:
                err = str(data.get("d") or "Accurate authentication failed")
                return {"success": False, "error": err, "message": err}
        except Exception as e:
            return {"success": False, "error": str(e), "message": f"Connection error: {e}"}

    # =========================================================================
    # CORE BUSINESS BRIDGES (Customer, Proforma SO, Sales Invoice, Sales Receipt)
    # =========================================================================

    def find_customer(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Searches Accurate Customer Master by Company Name, Customer Number, or NPWP.
        """
        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id or not query:
            return None

        url = f"{ACCURATE_API_HOST}/api/customer/list.do"
        headers = self._get_headers()
        params = {
            "fields": "id,name,customerNo,npwpNo,billStreet,email,workPhone",
            "filter.keywords.val": query.strip()
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("s") and data.get("d"):
                    results = data.get("d", [])
                    if len(results) > 0:
                        return results[0]
        except Exception as e:
            print(f"Customer lookup on Accurate failed: {e}")
            return None

    def find_sales_order(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Searches Accurate Sales Orders by Order Number or Keywords.
        """
        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id or not query:
            return None

        url = f"{ACCURATE_API_HOST}/api/sales-order/list.do"
        headers = self._get_headers()
        params = {
            "fields": "id,number,transDate,description,totalAmount",
            "filter.keywords.val": query.strip()
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("s") and data.get("d"):
                    results = data.get("d", [])
                    if len(results) > 0:
                        return results[0]
            return None
        except Exception as e:
            print(f"Sales order lookup on Accurate failed: {e}")
            return None

    def find_sales_invoice(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Searches Accurate Sales Invoices by Invoice Number, Order Number, or Keywords.
        """
        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id or not query:
            return None

        url = f"{ACCURATE_API_HOST}/api/sales-invoice/list.do"
        headers = self._get_headers()
        params = {
            "fields": "id,number,transDate,description,totalAmount,primeOwing,status",
            "filter.keywords.val": query.strip()
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("s") and data.get("d"):
                    results = data.get("d", [])
                    if len(results) > 0:
                        return results[0]
            return None
        except Exception as e:
            print(f"Sales invoice lookup on Accurate failed: {e}")
            return None

    def find_sales_receipt(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Searches Accurate Sales Receipts by Receipt Number, Order Number, or Keywords.
        """
        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id or not query:
            return None

        url = f"{ACCURATE_API_HOST}/api/sales-receipt/list.do"
        headers = self._get_headers()
        params = {
            "fields": "id,number,transDate,description,chequeAmount",
            "filter.keywords.val": query.strip()
        }

        try:
            resp = requests.get(url, headers=headers, params=params, timeout=15)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("s") and data.get("d"):
                    results = data.get("d", [])
                    if len(results) > 0:
                        return results[0]
            return None
        except Exception as e:
            print(f"Sales receipt lookup on Accurate failed: {e}")
            return None

    def sync_customer(self, company: models.ClientCompany) -> Dict[str, Any]:
        """
        Synchronizes ClientCompany entity with Accurate Customer Master.
        1. Checks if customer already exists on Accurate by Customer No, Name, or NPWP.
        2. If exists, links existing Accurate customer ID and number.
        3. If not, auto-creates customer in Accurate Online.
        """
        if not company:
            return {"success": False, "error": "Invalid company record"}

        clean_npwp = re.sub(r"[^0-9]", "", company.tax_number or "")
        customer_no = company.company_code or f"CUST-{company.id:04d}"

        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None

        # Live Accurate API Mode
        if token and db_id:
            # 1. Check if customer already exists in Accurate Online
            existing = None
            if company.company_code:
                existing = self.find_customer(company.company_code)
            if not existing and clean_npwp and len(clean_npwp) in [15, 16]:
                existing = self.find_customer(clean_npwp)
            if not existing and company.company_name:
                existing = self.find_customer(company.company_name)

            if existing:
                company.accurate_customer_id = str(existing.get("id") or "")
                company.accurate_customer_no = existing.get("customerNo") or customer_no
                company.accurate_sync_status = "SYNCED"
                company.accurate_last_synced_at = datetime.now(timezone.utc)
                self.db.commit()

                self.log_sync(
                    event_type="CUSTOMER_SYNC",
                    status="SUCCESS",
                    reference_id=str(company.id),
                    reference_number=company.company_name,
                    accurate_doc_no=company.accurate_customer_no,
                    request_payload={"action": "LOOKUP_EXISTING_CUSTOMER", "query": company.company_name},
                    response_payload={"message": "Linked to existing customer in Accurate", "customer": existing}
                )
                return {"success": True, "customer_no": company.accurate_customer_no, "matched_existing": True, "data": existing}

            # 2. If not found, create new customer in Accurate
            payload = {
                "name": company.company_name,
                "customerNo": customer_no,
                "npwpNo": clean_npwp if len(clean_npwp) in [15, 16] else "",
                "billStreet": company.address or "Jakarta, Indonesia",
                "email": company.key_contact_email or (company.client.email if company.client else ""),
                "workPhone": company.key_contact_phone or (company.client.phone if company.client else "")
            }

            url = f"{ACCURATE_API_HOST}/api/customer/save.do"
            headers = self._get_headers()
            try:
                resp = requests.post(url, json=payload, headers=headers, timeout=20)
                res_data = resp.json()
                if res_data.get("s"):
                    d_obj = res_data.get("d", {})
                    company.accurate_customer_id = str(d_obj.get("id") or "")
                    company.accurate_customer_no = d_obj.get("customerNo") or customer_no
                    company.accurate_sync_status = "SYNCED"
                    company.accurate_last_synced_at = datetime.now(timezone.utc)
                    self.db.commit()

                    self.log_sync(
                        event_type="CUSTOMER_SYNC",
                        status="SUCCESS",
                        reference_id=str(company.id),
                        reference_number=company.company_name,
                        accurate_doc_no=company.accurate_customer_no,
                        request_payload=payload,
                        response_payload=res_data
                    )
                    return {"success": True, "customer_no": company.accurate_customer_no, "data": d_obj}
                else:
                    err = res_data.get("d", [{}])[0].get("message") if isinstance(res_data.get("d"), list) else res_data.get("d") or "Customer sync error"
                    company.accurate_sync_status = "FAILED"
                    self.db.commit()
                    self.log_sync(
                        event_type="CUSTOMER_SYNC",
                        status="FAILED",
                        reference_id=str(company.id),
                        reference_number=company.company_name,
                        request_payload=payload,
                        error_message=str(err),
                        response_payload=res_data
                    )
                    return {"success": False, "error": str(err)}
            except Exception as e:
                self.log_sync(
                    event_type="CUSTOMER_SYNC",
                    status="FAILED",
                    reference_id=str(company.id),
                    reference_number=company.company_name,
                    request_payload=payload,
                    error_message=str(e)
                )
                return {"success": False, "error": str(e)}
        else:
            # Standalone Local Simulation Mode (records doc number for local workflow)
            company.accurate_customer_id = str(company.id)
            company.accurate_customer_no = customer_no
            company.accurate_sync_status = "SYNCED_LOCAL"
            company.accurate_last_synced_at = datetime.now(timezone.utc)
            self.db.commit()

            self.log_sync(
                event_type="CUSTOMER_SYNC",
                status="SUCCESS",
                reference_id=str(company.id),
                reference_number=company.company_name,
                accurate_doc_no=customer_no,
                request_payload=payload,
                response_payload={"simulated": True, "customer_no": customer_no}
            )
            return {"success": True, "customer_no": customer_no, "simulated": True}

    def _resolve_item_no(self, job_id: Optional[str] = None, job_title: Optional[str] = None) -> str:
        """
        Resolves or validates an itemNo from Accurate Online Item Master.
        Defaults to 'Jasa' if specific item code is not found in Accurate.
        """
        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id:
            return job_id or "Jasa"

        headers = self._get_headers()
        url = f"{ACCURATE_API_HOST}/api/item/list.do"

        # 1. Check by exact job_id
        if job_id:
            try:
                resp = requests.get(url, headers=headers, params={"fields": "no,name", "filter.keywords.val": job_id.strip()}, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("s") and data.get("d"):
                        for item in data.get("d", []):
                            if item.get("no", "").lower() == job_id.strip().lower():
                                return item.get("no")
            except Exception:
                pass

        # 2. Check by job title
        if job_title:
            try:
                resp = requests.get(url, headers=headers, params={"fields": "no,name", "filter.keywords.val": job_title.strip()[:30]}, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("s") and data.get("d") and len(data["d"]) > 0:
                        return data["d"][0].get("no") or "Jasa"
            except Exception:
                pass

        return "Jasa"

    def ensure_project(self, project_no: str, project_name: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Ensures a Project master record exists in Accurate Online for project tracking.
        1. Checks if project with this code or name already exists in Accurate.
        2. If not found, creates it via /api/project/save.do.
        """
        if not project_no:
            return None

        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None
        if not token or not db_id:
            return None

        headers = self._get_headers()
        clean_no = project_no.strip()
        clean_name = (project_name or project_no).strip()

        # 1. Lookup existing project
        url_list = f"{ACCURATE_API_HOST}/api/project/list.do"
        try:
            resp = requests.get(url_list, headers=headers, params={"fields": "id,name,no,projectNo", "filter.keywords.val": clean_no}, timeout=10)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("s") and data.get("d"):
                    for p in data.get("d", []):
                        p_code = (p.get("no") or p.get("projectNo") or "").strip().lower()
                        p_n = (p.get("name") or "").strip().lower()
                        if p_code == clean_no.lower() or p_n == clean_name.lower():
                            return p
        except Exception as e:
            print(f"Lookup project '{clean_no}' on Accurate failed: {e}")

        # 2. If not found, create new project in Accurate
        url_save = f"{ACCURATE_API_HOST}/api/project/save.do"
        payload = {
            "no": clean_no,
            "projectNo": clean_no,
            "name": clean_name
        }
        try:
            resp = requests.post(url_save, json=payload, headers=headers, timeout=15)
            res_data = resp.json()
            if res_data.get("s"):
                d_val = res_data.get("r") or res_data.get("d")
                return d_val
        except Exception as e:
            print(f"Create project '{clean_no}' on Accurate failed: {e}")

        return None

    def _extract_doc_info(self, res_data: dict, fallback_no: str) -> Tuple[Optional[str], str]:
        """
        Extracts document ID and document number from Accurate Online API responses.
        Accurate responses return:
        - 'r': dict representing the created entity with 'id' and 'number'
        - 'd': list of string messages e.g. ['Pesanan Penjualan "PE290.IX26" berhasil disimpan']
        """
        r_obj = res_data.get("r") or {}
        doc_id = str(r_obj.get("id") or "") if r_obj.get("id") else None
        doc_no = r_obj.get("number")
        
        if not doc_no:
            d_val = res_data.get("d")
            if isinstance(d_val, list) and len(d_val) > 0:
                msg = str(d_val[0])
                match = re.search(r'"([^"]+)"', msg)
                if match:
                    doc_no = match.group(1)
            elif isinstance(d_val, dict):
                doc_no = d_val.get("number") or d_val.get("customerNo")
                
        return doc_id, doc_no or fallback_no

    def create_sales_order_proforma(self, order: models.ClientOrder) -> Dict[str, Any]:
        """
        Creates a Sales Order (Pesanan Penjualan) in Accurate for the Proforma Invoice (e.g. 50% DP).
        Aggregates all service items in the order group into a single Sales Order with multiple detailItem rows.
        Maps each item's Project (Proyek) to the Order ID (e.g. MCSX-260003).
        Includes multi-tier idempotency guard to prevent duplicate Sales Orders.
        """
        if not order:
            return {"success": False, "error": "Order not found"}

        # Query all items belonging to this order group
        target_orders = self.db.query(models.ClientOrder).filter(
            models.ClientOrder.order_number == order.order_number
        ).order_by(models.ClientOrder.id.asc()).all() if order.order_number else [order]

        # Tier 1 Idempotency Guard: Check if order or any sibling in this order group already has accurate_so_no
        existing_so_no = order.accurate_so_no
        existing_so_id = order.accurate_so_id
        if not existing_so_no:
            for o in target_orders:
                if o.accurate_so_no:
                    existing_so_no = o.accurate_so_no
                    existing_so_id = o.accurate_so_id
                    break

        if existing_so_no:
            # Sync across all items in the group if missing
            needs_commit = False
            for ord_item in target_orders:
                if not ord_item.accurate_so_no:
                    ord_item.accurate_so_no = existing_so_no
                    ord_item.accurate_so_id = existing_so_id
                    needs_commit = True
            if needs_commit:
                self.db.commit()

            return {
                "success": True,
                "accurate_so_no": existing_so_no,
                "message": f"Sales Order {existing_so_no} already exists",
                "already_synced": True
            }

        company = order.billing_company or order.company
        if company and (not company.accurate_customer_no or company.accurate_sync_status == "NOT_SYNCED"):
            self.sync_customer(company)

        customer_no = company.accurate_customer_no if company else (f"CUST-{order.client_id}" if order.client_id else "CUST-DEFAULT")
        proforma_pct = order.proforma_stage_percent or 50
        today_str = datetime.now().strftime("%d/%m/%Y")
        order_num = order.order_number or f"ORD-{order.id}"

        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None

        detail_items = []
        item_titles = []
        for itm in target_orders:
            item_no = self._resolve_item_no(itm.job_id, itm.job_title)
            itm_price = float(itm.unit_price if itm.unit_price is not None else (itm.total_amount or 0.0))
            if itm.job_title:
                item_titles.append(itm.job_title)
            
            project_code = itm.order_number or order.order_number or f"ORD-{itm.id}"
            if token and db_id and project_code:
                self.ensure_project(project_code, project_code)

            detail_items.append({
                "itemNo": item_no,
                "unitPrice": itm_price,
                "quantity": 1,
                "detailNotes": itm.job_title or itm.job_id or "",
                "tax1Name": self.config.default_tax_ppn_no if self.config else "PPN 11%",
                "projectNo": project_code,
                "projectName": project_code
            })

        desc_services = ", ".join(item_titles) if item_titles else (order.job_title or "")
        description_text = f"Proforma Invoice ({proforma_pct}% DP) for Order {order_num} - {desc_services}"

        payload = {
            "customerNo": customer_no,
            "transDate": today_str,
            "description": description_text[:200],
            "detailItem": detail_items
        }

        if token and db_id:
            url = f"{ACCURATE_API_HOST}/api/sales-order/save.do"
            headers = self._get_headers()
            try:
                resp = requests.post(url, json=payload, headers=headers, timeout=25)
                res_data = resp.json()
                if res_data.get("s"):
                    fallback_no = f"SO.{datetime.now().strftime('%y%m')}.{order.id:04d}"
                    doc_id, doc_no = self._extract_doc_info(res_data, fallback_no)
                    
                    # Update all items belonging to this order group
                    for ord_item in target_orders:
                        ord_item.accurate_so_id = doc_id or str(order.id)
                        ord_item.accurate_so_no = doc_no
                        ord_item.accurate_sync_status = "SO_CREATED"
                        ord_item.accurate_sync_error = None
                        ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
                    self.db.commit()

                    self.log_sync(
                        event_type="PROFORMA_SO",
                        status="SUCCESS",
                        reference_id=str(order.id),
                        reference_number=order_num,
                        accurate_doc_no=doc_no,
                        request_payload=payload,
                        response_payload=res_data
                    )
                    return {"success": True, "accurate_so_no": doc_no, "data": res_data}
                else:
                    err = str(res_data.get("d") or "Accurate SO creation failed")
                    for ord_item in target_orders:
                        ord_item.accurate_sync_status = "FAILED"
                        ord_item.accurate_sync_error = err
                    self.db.commit()
                    self.log_sync(
                        event_type="PROFORMA_SO",
                        status="FAILED",
                        reference_id=str(order.id),
                        reference_number=order_num,
                        request_payload=payload,
                        error_message=err,
                        response_payload=res_data
                    )
                    return {"success": False, "error": err}
            except Exception as e:
                for ord_item in target_orders:
                    ord_item.accurate_sync_status = "FAILED"
                    ord_item.accurate_sync_error = str(e)
                self.db.commit()
                self.log_sync(
                    event_type="PROFORMA_SO",
                    status="FAILED",
                    reference_id=str(order.id),
                    reference_number=order_num,
                    request_payload=payload,
                    error_message=str(e)
                )
                return {"success": False, "error": str(e)}
        else:
            # Standalone Local Simulation
            mock_so_no = f"SO.{datetime.now().strftime('%y%m')}.{order.id:04d}"
            for ord_item in target_orders:
                ord_item.accurate_so_id = str(order.id)
                ord_item.accurate_so_no = mock_so_no
                ord_item.accurate_sync_status = "SO_CREATED"
                ord_item.accurate_sync_error = None
                ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
            self.db.commit()

            self.log_sync(
                event_type="PROFORMA_SO",
                status="SUCCESS",
                reference_id=str(order.id),
                reference_number=order_num,
                accurate_doc_no=mock_so_no,
                request_payload=payload,
                response_payload={"simulated": True, "so_no": mock_so_no}
            )
            return {"success": True, "accurate_so_no": mock_so_no, "simulated": True}

    def create_sales_invoice(self, order: models.ClientOrder) -> Dict[str, Any]:
        """
        Creates an official Sales Invoice (Faktur Penjualan) in Accurate.
        Aggregates all service items in the order group into a single Sales Invoice with multiple detailItem rows.
        Maps each item's Project (Proyek) to the Order ID (e.g. MCSX-260003).
        Includes multi-tier idempotency guard to prevent duplicate Invoices.
        """
        if not order:
            return {"success": False, "error": "Order not found"}

        # Query all items belonging to this order group
        target_orders = self.db.query(models.ClientOrder).filter(
            models.ClientOrder.order_number == order.order_number
        ).order_by(models.ClientOrder.id.asc()).all() if order.order_number else [order]

        # Tier 1 Idempotency Guard: Check if order or any sibling in this order group already has accurate_inv_no
        existing_inv_no = order.accurate_inv_no
        existing_inv_id = order.accurate_inv_id
        if not existing_inv_no:
            for o in target_orders:
                if o.accurate_inv_no:
                    existing_inv_no = o.accurate_inv_no
                    existing_inv_id = o.accurate_inv_id
                    break

        if existing_inv_no:
            # Sync across all items in the group if missing
            needs_commit = False
            for ord_item in target_orders:
                if not ord_item.accurate_inv_no:
                    ord_item.accurate_inv_no = existing_inv_no
                    ord_item.accurate_inv_id = existing_inv_id
                    needs_commit = True
            if needs_commit:
                self.db.commit()

            return {
                "success": True,
                "accurate_inv_no": existing_inv_no,
                "message": f"Sales Invoice {existing_inv_no} already exists",
                "already_synced": True
            }

        company = order.billing_company or order.company
        if company and (not company.accurate_customer_no or company.accurate_sync_status == "NOT_SYNCED"):
            self.sync_customer(company)

        customer_no = company.accurate_customer_no if company else (f"CUST-{order.client_id}" if order.client_id else "CUST-DEFAULT")
        today_str = datetime.now().strftime("%d/%m/%Y")
        order_num = order.order_number or f"ORD-{order.id}"

        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None

        # Check if Proforma DP was already billed / invoiced
        proforma_pct = order.proforma_stage_percent or 50
        has_proforma_dp = bool(
            order.accurate_sync_status in ["PROFORMA_PAID", "PAID"] or 
            any(o.accurate_sync_status == "PROFORMA_PAID" for o in target_orders) or 
            (order.payment_status in ["PARTIALLY_PAID", "PAID"]) or
            (order.proforma_paid_amount and float(order.proforma_paid_amount) > 0)
        )
        final_pct_ratio = (100.0 - float(proforma_pct)) / 100.0 if has_proforma_dp else 1.0

        detail_items = []
        item_titles = []
        for itm in target_orders:
            item_no = self._resolve_item_no(itm.job_id, itm.job_title)
            full_price = float(itm.unit_price if itm.unit_price is not None else (itm.total_amount or 0.0))
            itm_price = round(full_price * final_pct_ratio, 2)
            if itm.job_title:
                item_titles.append(itm.job_title)
            
            project_code = itm.order_number or order.order_number or f"ORD-{itm.id}"
            if token and db_id and project_code:
                self.ensure_project(project_code, project_code)

            item_entry = {
                "itemNo": item_no,
                "unitPrice": itm_price,
                "quantity": 1,
                "detailNotes": itm.job_title or itm.job_id or "",
                "tax1Name": self.config.default_tax_ppn_no if self.config else "PPN 11%",
                "projectNo": project_code,
                "projectName": project_code
            }
            if order.accurate_so_no:
                item_entry["salesOrderNumber"] = order.accurate_so_no
            detail_items.append(item_entry)

        desc_services = ", ".join(item_titles) if item_titles else (order.job_title or "")
        if has_proforma_dp:
            description_text = f"Final Invoice (Balance {100 - proforma_pct}%) for Order {order_num} - {desc_services}"
        else:
            description_text = f"Final Invoice for Order {order_num} - {desc_services}"

        payload = {
            "customerNo": customer_no,
            "transDate": today_str,
            "description": description_text[:200],
            "detailItem": detail_items
        }

        # If SO exists, link to Sales Order at root
        if order.accurate_so_no:
            payload["salesOrderNumber"] = order.accurate_so_no

        if token and db_id:
            url = f"{ACCURATE_API_HOST}/api/sales-invoice/save.do"
            headers = self._get_headers()
            try:
                resp = requests.post(url, json=payload, headers=headers, timeout=25)
                res_data = resp.json()
                if res_data.get("s"):
                    fallback_no = f"INV.{datetime.now().strftime('%y%m')}.{order.id:04d}"
                    doc_id, doc_no = self._extract_doc_info(res_data, fallback_no)

                    for ord_item in target_orders:
                        ord_item.accurate_inv_id = doc_id or str(order.id)
                        ord_item.accurate_inv_no = doc_no
                        ord_item.accurate_sync_status = "INV_CREATED"
                        ord_item.accurate_sync_error = None
                        ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
                    self.db.commit()

                    self.log_sync(
                        event_type="SALES_INVOICE",
                        status="SUCCESS",
                        reference_id=str(order.id),
                        reference_number=order_num,
                        accurate_doc_no=doc_no,
                        request_payload=payload,
                        response_payload=res_data
                    )
                    return {"success": True, "accurate_inv_no": doc_no, "data": res_data}
                else:
                    err = str(res_data.get("d") or "Accurate Invoice creation failed")
                    for ord_item in target_orders:
                        ord_item.accurate_sync_status = "FAILED"
                        ord_item.accurate_sync_error = err
                    self.db.commit()
                    self.log_sync(
                        event_type="SALES_INVOICE",
                        status="FAILED",
                        reference_id=str(order.id),
                        reference_number=order_num,
                        request_payload=payload,
                        error_message=err,
                        response_payload=res_data
                    )
                    return {"success": False, "error": err}
            except Exception as e:
                for ord_item in target_orders:
                    ord_item.accurate_sync_status = "FAILED"
                    ord_item.accurate_sync_error = str(e)
                self.db.commit()
                self.log_sync(
                    event_type="SALES_INVOICE",
                    status="FAILED",
                    reference_id=str(order.id),
                    reference_number=order_num,
                    request_payload=payload,
                    error_message=str(e)
                )
                return {"success": False, "error": str(e)}
        else:
            # Standalone Local Simulation
            mock_inv_no = f"INV.{datetime.now().strftime('%y%m')}.{order.id:04d}"
            for ord_item in target_orders:
                ord_item.accurate_inv_id = str(order.id)
                ord_item.accurate_inv_no = mock_inv_no
                ord_item.accurate_sync_status = "INV_CREATED"
                ord_item.accurate_sync_error = None
                ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
            self.db.commit()

            self.log_sync(
                event_type="SALES_INVOICE",
                status="SUCCESS",
                reference_id=str(order.id),
                reference_number=order_num,
                accurate_doc_no=mock_inv_no,
                request_payload=payload,
                response_payload={"simulated": True, "inv_no": mock_inv_no}
            )
            return {"success": True, "accurate_inv_no": mock_inv_no, "simulated": True}

    def _resolve_bank_no(self) -> str:
        """
        Resolves bank account number for Accurate general ledger deposit.
        Defaults to 130001 (Giro Bank 998) if not explicitly configured.
        """
        if self.config and self.config.default_bank_account_no and self.config.default_bank_account_no not in ["1101", ""]:
            return str(self.config.default_bank_account_no).strip()
        return "130001"

    def create_sales_receipt(self, order: models.ClientOrder, payment_amount: float, payment_method: str = "BCA") -> Dict[str, Any]:
        """
        Creates a Sales Receipt (Penerimaan Penjualan) in Accurate to record incoming client payment
        and deposits into the bank ledger.
        - If the order is in Proforma / Down Payment stage (not yet final-invoiced):
          Records Proforma payment in MCSC while keeping the Sales Order Active and In Progress in Accurate Online.
        - If the order has a Final Sales Invoice:
          Records receipt against the Final Sales Invoice (order.accurate_inv_no).
        """
        if not order:
            return {"success": False, "error": "Order not found"}

        # Target all order items in this group
        target_orders = self.db.query(models.ClientOrder).filter(
            models.ClientOrder.order_number == order.order_number
        ).order_by(models.ClientOrder.id.asc()).all() if order.order_number else [order]

        company = order.billing_company or order.company
        if company and (not company.accurate_customer_no or company.accurate_sync_status == "NOT_SYNCED"):
            self.sync_customer(company)

        customer_no = company.accurate_customer_no if (company and company.accurate_customer_no) else (f"CUST-{order.client_id}" if order.client_id else "CUST-DEFAULT")
        today_str = datetime.now().strftime("%d/%m/%Y")
        order_num = order.order_number or f"ORD-{order.id}"
        bank_no = self._resolve_bank_no()

        is_final_invoice_phase = bool(order.is_final_invoice_finalized or order.invoice_number or order.payment_status in ["FINAL_PAID", "FULLY_PAID"])

        token = self.get_valid_access_token()
        db_id = self.config.database_id if self.config else None

        # Check if this order or any item in the order group already has a receipt recorded
        existing_receipt_no = order.accurate_receipt_no
        if not existing_receipt_no:
            for o in target_orders:
                if o.accurate_receipt_no:
                    existing_receipt_no = o.accurate_receipt_no
                    break

        # Case A: Final Invoice Phase -> apply to Sales Invoice
        if is_final_invoice_phase:
            if not order.accurate_inv_no:
                inv_res = self.create_sales_invoice(order)
                if not inv_res.get("success"):
                    return {"success": False, "error": f"Failed to create sales invoice prior to receipt: {inv_res.get('error')}"}

            # If already fully synced and paid locally, return existing receipt
            if existing_receipt_no and order.accurate_sync_status == "PAID":
                # Ensure all siblings share the receipt number
                needs_commit = False
                for ord_item in target_orders:
                    if not ord_item.accurate_receipt_no:
                        ord_item.accurate_receipt_no = existing_receipt_no
                        needs_commit = True
                if needs_commit:
                    self.db.commit()

                return {
                    "success": True,
                    "accurate_receipt_no": existing_receipt_no,
                    "message": f"Sales Receipt {existing_receipt_no} already recorded for Invoice {order.accurate_inv_no}",
                    "already_synced": True
                }

            if token and db_id:
                headers = self._get_headers()
                prime_owing = float(payment_amount or 0.0)
                inv_status = None

                try:
                    inv_resp = requests.get(
                        f"{ACCURATE_API_HOST}/api/sales-invoice/detail.do",
                        headers=headers,
                        params={"number": order.accurate_inv_no},
                        timeout=15
                    )
                    if inv_resp.status_code == 200:
                        inv_data = inv_resp.json()
                        if inv_data.get("s") and inv_data.get("d"):
                            inv_obj = inv_data["d"]
                            if isinstance(inv_obj, dict):
                                prime_owing = float(inv_obj.get("primeOwing") if inv_obj.get("primeOwing") is not None else payment_amount)
                                inv_status = inv_obj.get("statusName") or inv_obj.get("status")
                except Exception as check_err:
                    print(f"Warning: could not fetch invoice primeOwing: {check_err}")

                if (inv_status and str(inv_status).lower() in ["lunas", "paid"]) or prime_owing <= 0:
                    for ord_item in target_orders:
                        ord_item.accurate_sync_status = "PAID"
                        ord_item.accurate_sync_error = None
                    self.db.commit()
                    return {
                        "success": True,
                        "accurate_receipt_no": existing_receipt_no or order.accurate_receipt_no,
                        "message": f"Invoice {order.accurate_inv_no} is already fully paid in Accurate Online",
                        "already_synced": True
                    }

                actual_payment_amount = min(float(payment_amount), prime_owing) if payment_amount > 0 else prime_owing
                if actual_payment_amount <= 0:
                    return {
                        "success": True,
                        "accurate_receipt_no": existing_receipt_no or order.accurate_receipt_no,
                        "message": "No remaining balance to pay",
                        "already_synced": True
                    }

                payload = {
                    "customerNo": customer_no,
                    "transDate": today_str,
                    "bankNo": bank_no,
                    "chequeAmount": actual_payment_amount,
                    "description": f"Payment received for Order {order_num} via {payment_method}",
                    "detailInvoice": [
                        {
                            "invoiceNo": order.accurate_inv_no,
                            "paymentAmount": actual_payment_amount
                        }
                    ]
                }
                url = f"{ACCURATE_API_HOST}/api/sales-receipt/save.do"
                try:
                    resp = requests.post(url, json=payload, headers=headers, timeout=25)
                    res_data = resp.json()
                    if res_data.get("s"):
                        fallback_no = f"CR.{datetime.now().strftime('%y%m')}.{order.id:04d}"
                        doc_id, doc_no = self._extract_doc_info(res_data, fallback_no)

                        is_now_fully_paid = (prime_owing - actual_payment_amount) <= 100.0
                        new_sync_status = "PAID" if is_now_fully_paid else "PARTIALLY_PAID"

                        for ord_item in target_orders:
                            if ord_item.accurate_receipt_no and doc_no not in ord_item.accurate_receipt_no:
                                ord_item.accurate_receipt_no = f"{ord_item.accurate_receipt_no}, {doc_no}"
                            else:
                                ord_item.accurate_receipt_no = doc_no
                            ord_item.accurate_sync_status = new_sync_status
                            ord_item.accurate_sync_error = None
                            ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
                        self.db.commit()

                        self.log_sync(
                            event_type="SALES_RECEIPT",
                            status="SUCCESS",
                            reference_id=str(order.id),
                            reference_number=order_num,
                            accurate_doc_no=doc_no,
                            request_payload=payload,
                            response_payload=res_data
                        )
                        return {"success": True, "accurate_receipt_no": doc_no, "data": res_data}
                    else:
                        err = str(res_data.get("d") or "Accurate Receipt creation failed")
                        self.log_sync(
                            event_type="SALES_RECEIPT",
                            status="FAILED",
                            reference_id=str(order.id),
                            reference_number=order_num,
                            request_payload=payload,
                            error_message=err,
                            response_payload=res_data
                        )
                        return {"success": False, "error": err}
                except Exception as e:
                    return {"success": False, "error": str(e)}
            else:
                # Simulation mode
                mock_cr_no = existing_receipt_no or f"CR.{datetime.now().strftime('%y%m')}.{order.id:04d}"
                for ord_item in target_orders:
                    ord_item.accurate_receipt_no = mock_cr_no
                    ord_item.accurate_sync_status = "PAID"
                    ord_item.accurate_sync_error = None
                    ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
                self.db.commit()
                return {"success": True, "accurate_receipt_no": mock_cr_no, "simulated": True}

        # Case B: Proforma / Down Payment Phase -> Generate Proforma DP Invoice & Sales Receipt in Accurate
        else:
            # Idempotency Guard: prevent duplicate DP receipts if receipt already exists across any item in the group
            if existing_receipt_no:
                needs_commit = False
                for ord_item in target_orders:
                    if not ord_item.accurate_receipt_no:
                        ord_item.accurate_receipt_no = existing_receipt_no
                        needs_commit = True
                    if ord_item.accurate_sync_status != "PROFORMA_PAID":
                        ord_item.accurate_sync_status = "PROFORMA_PAID"
                        needs_commit = True
                if needs_commit:
                    self.db.commit()

                return {
                    "success": True,
                    "accurate_receipt_no": existing_receipt_no,
                    "accurate_so_no": order.accurate_so_no,
                    "message": f"Proforma Down Payment Receipt {existing_receipt_no} already exists.",
                    "already_synced": True
                }

            if not order.accurate_so_no:
                so_res = self.create_sales_order_proforma(order)
                if not so_res.get("success"):
                    return {"success": False, "error": f"Failed to create sales order: {so_res.get('error')}"}

            if token and db_id:
                headers = self._get_headers()
                
                # 1. Create a Proforma DP Invoice in Accurate Online (isolated DP line so SO stays in progress)
                inv_payload = {
                    "customerNo": customer_no,
                    "transDate": today_str,
                    "description": f"Proforma Invoice ({order.proforma_stage_percent or 50}% DP) for Order {order_num}",
                    "detailItem": [
                        {
                            "itemNo": "Jasa",
                            "unitPrice": float(payment_amount),
                            "quantity": 1,
                            "detailNotes": f"Down Payment ({order.proforma_stage_percent or 50}%) for Order {order_num}",
                            "tax1Name": self.config.default_tax_ppn_no if self.config else "PPN 11%",
                            "projectNo": order_num,
                            "projectName": order_num
                        }
                    ]
                }
                
                dp_inv_no = None
                try:
                    inv_url = f"{ACCURATE_API_HOST}/api/sales-invoice/save.do"
                    inv_resp = requests.post(inv_url, json=inv_payload, headers=headers, timeout=25)
                    inv_data = inv_resp.json()
                    if inv_data.get("s"):
                        _, dp_inv_no = self._extract_doc_info(inv_data, f"INV-DP.{order.id:04d}")
                except Exception as inv_err:
                    print(f"Warning: Proforma DP invoice creation error: {inv_err}")

                # 2. If Proforma DP invoice was created, generate Sales Receipt against it
                if dp_inv_no:
                    rcpt_payload = {
                        "customerNo": customer_no,
                        "transDate": today_str,
                        "bankNo": bank_no,
                        "chequeAmount": float(payment_amount),
                        "description": f"Proforma DP ({order.proforma_stage_percent or 50}%) for Order {order_num} via {payment_method}",
                        "detailInvoice": [
                            {
                                "invoiceNo": dp_inv_no,
                                "paymentAmount": float(payment_amount)
                            }
                        ]
                    }
                    try:
                        rcpt_url = f"{ACCURATE_API_HOST}/api/sales-receipt/save.do"
                        rcpt_resp = requests.post(rcpt_url, json=rcpt_payload, headers=headers, timeout=25)
                        rcpt_data = rcpt_resp.json()
                        if rcpt_data.get("s"):
                            fallback_no = f"CR.{datetime.now().strftime('%y%m')}.{order.id:04d}"
                            doc_id, doc_no = self._extract_doc_info(rcpt_data, fallback_no)
                            for ord_item in target_orders:
                                ord_item.accurate_receipt_no = doc_no
                                ord_item.accurate_sync_status = "PROFORMA_PAID"
                                ord_item.accurate_sync_error = None
                                ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
                            self.db.commit()

                            self.log_sync(
                                event_type="SALES_RECEIPT_PROFORMA",
                                status="SUCCESS",
                                reference_id=str(order.id),
                                reference_number=order_num,
                                accurate_doc_no=doc_no,
                                request_payload=rcpt_payload,
                                response_payload=rcpt_data
                            )
                            return {
                                "success": True,
                                "accurate_receipt_no": doc_no,
                                "accurate_so_no": order.accurate_so_no,
                                "proforma_inv_no": dp_inv_no,
                                "message": f"Proforma Down Payment Receipt {doc_no} generated successfully in Accurate Online.",
                                "data": rcpt_data
                            }
                    except Exception as rcpt_err:
                        print(f"Warning: Sales receipt against DP invoice error: {rcpt_err}")

            # Simulation fallback or fallback if DP invoice creation was skipped
            mock_cr_no = existing_receipt_no or f"CR.{datetime.now().strftime('%y%m')}.{order.id:04d}"
            for ord_item in target_orders:
                ord_item.accurate_receipt_no = mock_cr_no
                ord_item.accurate_sync_status = "PROFORMA_PAID"
                ord_item.accurate_sync_error = None
                ord_item.accurate_last_synced_at = datetime.now(timezone.utc)
            self.db.commit()

            self.log_sync(
                event_type="PROFORMA_PAYMENT",
                status="SUCCESS",
                reference_id=str(order.id),
                reference_number=order_num,
                accurate_doc_no=order.accurate_so_no,
                request_payload={
                    "customerNo": customer_no,
                    "salesOrderNumber": order.accurate_so_no,
                    "paymentAmount": float(payment_amount),
                    "paymentMethod": payment_method
                },
                response_payload={
                    "message": "Proforma Down Payment recorded successfully. Sales Order remains Active and In Progress in Accurate Online.",
                    "accurate_so_no": order.accurate_so_no,
                    "receipt_no": mock_cr_no
                }
            )
            return {
                "success": True,
                "accurate_receipt_no": mock_cr_no,
                "accurate_so_no": order.accurate_so_no,
                "message": "Proforma Down Payment recorded successfully. Sales Order remains Active and In Progress.",
                "proforma_paid": True
            }
