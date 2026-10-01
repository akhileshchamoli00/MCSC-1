import os
import sys
import shutil
import tempfile
import logging
import subprocess
import threading
from typing import Optional

logger = logging.getLogger("api.doc_converter")
conversion_lock = threading.Lock()

CACHE_DIR = os.path.abspath(os.path.join("uploads", "cache", "doc_previews"))

def get_cached_pdf_path(cache_key: str) -> str:
    os.makedirs(CACHE_DIR, exist_ok=True)
    safe_key = "".join(c for c in str(cache_key) if c.isalnum() or c in ("-", "_"))
    return os.path.join(CACHE_DIR, f"{safe_key}.pdf")

def convert_doc_to_pdf(doc_bytes: bytes, cache_key: str) -> Optional[bytes]:
    """
    Converts legacy binary Word (.doc) bytes into standard PDF bytes for inline browser preview.
    Uses cached result if available.
    Executes conversion in an isolated worker process with strict timeout to prevent hangs.
    Supports MS Word COM automation (Windows) and LibreOffice soffice (Linux/Windows).
    """
    if not doc_bytes:
        return None

    cached_pdf = get_cached_pdf_path(cache_key)
    if os.path.exists(cached_pdf) and os.path.getsize(cached_pdf) > 0:
        try:
            with open(cached_pdf, "rb") as f:
                return f.read()
        except Exception as e:
            logger.warning(f"Failed to read cached PDF {cached_pdf}: {e}")

    with conversion_lock:
        # Re-check cache inside lock
        if os.path.exists(cached_pdf) and os.path.getsize(cached_pdf) > 0:
            with open(cached_pdf, "rb") as f:
                return f.read()

        temp_doc = None
        temp_pdf = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".doc", delete=False) as f_in:
                f_in.write(doc_bytes)
                temp_doc = os.path.abspath(f_in.name)

            temp_pdf = os.path.abspath(temp_doc.replace(".doc", ".pdf"))
            converted = False

            # Method 1: Isolated MS Word COM automation via subprocess (Windows)
            if sys.platform == "win32":
                worker_script = f'''
import sys
import pythoncom
import win32com.client

pythoncom.CoInitialize()
word = None
try:
    word = win32com.client.Dispatch("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    doc = word.Documents.Open(
        FileName={repr(temp_doc)},
        ConfirmConversions=False,
        ReadOnly=True,
        AddToRecentFiles=False,
        Visible=False,
        OpenAndRepair=True,
        NoEncodingDialog=True
    )
    doc.SaveAs2({repr(temp_pdf)}, FileFormat=17)
    doc.Close(SaveChanges=False)
    print("SUCCESS")
finally:
    if word:
        try:
            word.Quit(SaveChanges=False)
        except Exception:
            pass
    pythoncom.CoUninitialize()
'''
                try:
                    res = subprocess.run(
                        [sys.executable, "-c", worker_script],
                        capture_output=True,
                        text=True,
                        timeout=25
                    )
                    if "SUCCESS" in res.stdout and os.path.exists(temp_pdf) and os.path.getsize(temp_pdf) > 0:
                        converted = True
                    else:
                        logger.warning(f"Word subprocess conversion failed: {res.stderr}")
                except subprocess.TimeoutExpired:
                    logger.warning("Word subprocess conversion timed out after 25s")
                    # Force kill any hung WINWORD process if needed
                    try:
                        subprocess.run(["taskkill", "/F", "/IM", "WINWORD.EXE"], capture_output=True)
                    except Exception:
                        pass
                except Exception as ex:
                    logger.warning(f"Error running Word conversion subprocess: {ex}")

            # Method 2: LibreOffice / soffice fallback (Linux or Windows without Word)
            if not converted:
                soffice_bin = shutil.which("soffice") or shutil.which("libreoffice")
                if soffice_bin:
                    out_dir = os.path.dirname(temp_pdf)
                    cmd = [soffice_bin, "--headless", "--convert-to", "pdf", "--outdir", out_dir, temp_doc]
                    try:
                        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=30)
                        if res.returncode == 0 and os.path.exists(temp_pdf):
                            converted = True
                        else:
                            logger.warning(f"soffice conversion failed: {res.stderr.decode('utf-8', errors='ignore')}")
                    except Exception as err:
                        logger.warning(f"soffice execution error: {err}")

            if converted and os.path.exists(temp_pdf) and os.path.getsize(temp_pdf) > 0:
                # Save to cache
                shutil.copyfile(temp_pdf, cached_pdf)
                with open(cached_pdf, "rb") as f:
                    return f.read()

        except Exception as e:
            logger.error(f"Error during .doc to .pdf conversion for key {cache_key}: {e}", exc_info=True)
            return None
        finally:
            if temp_doc and os.path.exists(temp_doc):
                try:
                    os.remove(temp_doc)
                except Exception:
                    pass
            if temp_pdf and os.path.exists(temp_pdf):
                try:
                    os.remove(temp_pdf)
                except Exception:
                    pass

    return None
