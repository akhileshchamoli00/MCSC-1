import os
import random
import string
from cryptography.fernet import Fernet
from dotenv import load_dotenv

load_dotenv()

# We need a stable key for fernet encryption. If not provided, we create a deterministic one based on a secret
# or just generate one and tell the user they must keep it in .env
FERNET_KEY = os.getenv("FERNET_KEY")
if not FERNET_KEY:
    # This is a fallback purely for the sake of the demo, in production it MUST be in .env
    # We generate a stable key using a known secret to avoid losing access on restart if not in env
    import base64
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"hrms_salt_for_fernet",
        iterations=390000,
    )
    secret = os.getenv("SECRET_KEY", "supersecret").encode()
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
