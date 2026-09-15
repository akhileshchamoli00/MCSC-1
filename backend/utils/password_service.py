import os
import random
import string
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We need a stable key for fernet encryption.
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    secret_str = os.getenv("SECRET_KEY")
    if not secret_str:
        is_prod = os.getenv("ENV", "development").lower() == "production"
        if is_prod:
            raise RuntimeError(
                "FATAL SECURITY ERROR: Neither 'FERNET_KEY' nor 'SECRET_KEY' environment variables are set. "
                "Production deployments cannot start without an encryption key."
            )
        import secrets
        secret_str = secrets.token_hex(32)
        print("WARNING: 'FERNET_KEY' and 'SECRET_KEY' missing; generated temporary runtime encryption key.")

    import base64
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"hrms_salt_for_fernet",
        iterations=390000,
    )
    secret = secret_str.encode()
    FERNET_KEY = base64.urlsafe_b64encode(kdf.derive(secret))

fernet = Fernet(FERNET_KEY)

def generate_payslip_password(length=9):
    """
    Generate a random password like PX7M-K29Q
    """
    chars = string.ascii_uppercase + string.digits
    p1 = ''.join(random.choice(chars) for _ in range(4))
    p2 = ''.join(random.choice(chars) for _ in range(4))
    return f"{p1}-{p2}"

def encrypt_password(password: str) -> str:
    """
    Encrypt a plaintext password so it can be stored in the DB.
    """
    return fernet.encrypt(password.encode()).decode()

def decrypt_password(encrypted_password: str) -> str:
    """
    Decrypt a stored password string back to plaintext.
    """
    return fernet.decrypt(encrypted_password.encode()).decode()
