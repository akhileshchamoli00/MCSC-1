import base64
import requests
import os

class XenditClient:
    def __init__(self):
        self.secret_key = os.getenv("XENDIT_SECRET_KEY", "")
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
