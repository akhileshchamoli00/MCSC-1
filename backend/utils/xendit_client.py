import base64
import requests
import os
import logging
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Explicitly ensure environment variables are loaded
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(backend_dir)

def get_live_xendit_secret_key() -> str:
    # Read directly from backend/.env first to ensure real-time accuracy across long-running processes
    env_path = os.path.join(backend_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    clean = line.strip()
                    if clean.startswith("XENDIT_SECRET_KEY="):
                        val = clean.split("=", 1)[1].strip().strip('"').strip("'")
                        if val:
                            return val
        except Exception:
            pass
    load_dotenv(os.path.join(backend_dir, ".env"), override=True)
    load_dotenv(os.path.join(root_dir, ".env.local"), override=True)
    return os.getenv("XENDIT_SECRET_KEY", "").strip()

class XenditClient:
    def __init__(self):
        self.secret_key = get_live_xendit_secret_key()
        # Encode key for Basic Auth (username: secret_key, password: empty)
        auth_bytes = f"{self.secret_key}:".encode("utf-8")
        self.auth_header = f"Basic {base64.b64encode(auth_bytes).decode('utf-8')}"
        self.base_url = "https://api.xendit.co"

    def create_invoice(self, external_id: str, amount: float, payer_email: str, description: str) -> dict:
        url = f"{self.base_url}/v2/invoices"
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        # Restrict payment methods strictly to Virtual Accounts (Bank Transfer)
        payload = {
            "external_id": external_id,
            "amount": float(amount),
            "payer_email": payer_email,
            "description": description
        }
        response = requests.post(url, json=payload, headers=headers)
        if not response.ok:
            try:
                err_data = response.json()
                detail = err_data.get("message", response.text)
            except Exception:
                detail = response.text
            raise Exception(f"Xendit Error: {detail}")
        return response.json()

    def get_invoice(self, invoice_id: str) -> dict:
        url = f"{self.base_url}/v2/invoices/{invoice_id}"
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        response = requests.get(url, headers=headers)
        if not response.ok:
            try:
                err_data = response.json()
                detail = err_data.get("message", response.text)
            except Exception:
                detail = response.text
            raise Exception(f"Xendit Error: {detail}")
        return response.json()

    def expire_invoice(self, invoice_id: str) -> dict:
        url = f"{self.base_url}/invoices/{invoice_id}/expire!"
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        response = requests.post(url, headers=headers)
        if not response.ok:
            try:
                err_data = response.json()
                detail = err_data.get("message", response.text)
            except Exception:
                detail = response.text
            raise Exception(f"Xendit Expire Error: {detail}")
        return response.json()

    def normalize_bank_code(self, raw_bank: str) -> str:
        """
        Normalize user-entered bank names into official Xendit bank codes.
        """
        if not raw_bank:
            return "BCA"
        s = raw_bank.strip().upper()
        if "BCA" in s:
            return "BCA"
        if "MANDIRI" in s:
            return "MANDIRI"
        if "BNI" in s:
            return "BNI"
        if "BRI" in s:
            return "BRI"
        if "CIMB" in s:
            return "CIMB"
        if "PERMATA" in s:
            return "PERMATA"
        if "DANAMON" in s:
            return "DANAMON"
        if "BSI" in s or "SYARIAH INDONESIA" in s:
            return "BSI"
        if "BTPN" in s or "JENIUS" in s:
            return "BTPN"
        if "OCBC" in s:
            return "OCBC"
        if "MAYBANK" in s:
            return "MAYBANK"
        if "PANIN" in s:
            return "PANIN"
        if "DBS" in s:
            return "DBS"
        return s.replace(" ", "_")

    def create_disbursement(
        self,
        external_id: str,
        bank_code: str,
        account_holder_name: str,
        account_number: str,
        amount: float,
        description: str
    ) -> dict:
        """
        Create a disbursement / payout to a destination bank account.
        Tries both Modern Payouts API (/v2/payouts, mapped by Money Out permission)
        and Classic Disbursements API (/disbursements).
        """
        clean_bank_code = self.normalize_bank_code(bank_code)
        clean_account_number = str(account_number).strip().replace(" ", "").replace("-", "")
        clean_amount = int(round(float(amount))) if amount else 0
        
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json",
            "Idempotency-Key": str(external_id),
            "X-IDEMPOTENCY-KEY": str(external_id)
        }

        # 1. Try Modern Payouts API (/v2/payouts) - corresponds to modern "Money Out" permission
        channel_codes_to_try = [
            clean_bank_code if clean_bank_code.startswith("ID_") else f"ID_{clean_bank_code}",
            clean_bank_code.replace("ID_", "")
        ]

        payout_errors = []
        for ch_code in channel_codes_to_try:
            payout_url = f"{self.base_url}/v2/payouts"
            payout_payload = {
                "reference_id": str(external_id),
                "channel_code": ch_code,
                "channel_properties": {
                    "account_holder_name": account_holder_name.strip(),
                    "account_number": clean_account_number
                },
                "amount": clean_amount,
                "currency": "IDR",
                "description": description[:50]
            }
            try:
                res = requests.post(payout_url, json=payout_payload, headers=headers)
                if res.ok:
                    data = res.json()
                    return {
                        "id": data.get("id"),
                        "status": data.get("status", "PENDING"),
                        "amount": data.get("amount", clean_amount),
                        "bank_code": ch_code,
                        "account_number": clean_account_number,
                        "raw": data
                    }
                else:
                    err_json = res.json() if "application/json" in res.headers.get("content-type", "") else {}
                    msg = err_json.get("message") or err_json.get("error_code") or res.text
                    payout_errors.append(f"v2/payouts ({ch_code}): [{res.status_code}] {msg}")
            except Exception as e:
                payout_errors.append(f"v2/payouts ({ch_code}): {str(e)}")

        # 2. Try Classic Disbursements API (/disbursements)
        disb_url = f"{self.base_url}/disbursements"
        disb_payload = {
            "external_id": str(external_id),
            "bank_code": clean_bank_code.replace("ID_", ""),
            "account_holder_name": account_holder_name.strip(),
            "account_number": clean_account_number,
            "amount": clean_amount,
            "description": description[:50]
        }
        res_disb = requests.post(disb_url, json=disb_payload, headers=headers)
        if res_disb.ok:
            data = res_disb.json()
            return {
                "id": data.get("id"),
                "status": data.get("status", "PENDING"),
                "amount": data.get("amount", clean_amount),
                "bank_code": data.get("bank_code"),
                "account_number": data.get("account_number"),
                "raw": data
            }

        try:
            err_data = res_disb.json()
            disb_msg = err_data.get("message") or err_data.get("error_code") or res_disb.text
        except Exception:
            disb_msg = res_disb.text
        
        all_errs = " | ".join(payout_errors + [f"disbursements: [{res_disb.status_code}] {disb_msg}"])
        raise Exception(f"Xendit Error: {all_errs}")

    def get_disbursement(self, disbursement_id: str) -> dict:
        """
        Get disbursement details by ID.
        """
        url = f"{self.base_url}/disbursements/{disbursement_id}"
        headers = {
            "Authorization": self.auth_header,
            "Content-Type": "application/json"
        }
        response = requests.get(url, headers=headers)
        if not response.ok:
            try:
                err_data = response.json()
                detail = err_data.get("message", response.text)
            except Exception:
                detail = response.text
            raise Exception(f"Xendit Disbursement Error: {detail}")
        return response.json()


