import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

logger = logging.getLogger(__name__)


def _read_dotenv_value(key: str) -> str | None:
    env_path = Path(__file__).resolve().parents[2] / ".env"

    if not env_path.exists():
        return None

    for line in env_path.read_text(encoding="utf-8").splitlines():
        clean_line = line.strip()

        if not clean_line or clean_line.startswith("#") or "=" not in clean_line:
            continue

        current_key, current_value = clean_line.split("=", 1)

        if current_key.strip() == key:
            return current_value.strip().strip('"').strip("'")

    return None


def _get_config_value(key: str) -> str | None:
    return os.getenv(key) or _read_dotenv_value(key)


def _smtp_configured() -> bool:
    required_keys = [
        "SMTP_HOST",
        "SMTP_PORT",
        "SMTP_USERNAME",
        "SMTP_PASSWORD",
        "SMTP_FROM_EMAIL",
    ]
    return all(_get_config_value(key) for key in required_keys)


async def send_password_reset_email(email: str, reset_link: str) -> None:
    subject = "Reset your RS Real Estate password"
    body = f"""Hi,

We received a request to reset your RS Real Estate account password.

Reset your password using this link:
{reset_link}

This link will expire in 30 minutes.

If you did not request this, you can ignore this email.
"""

    if not _smtp_configured():
        logger.warning("PASSWORD RESET LINK for %s: %s", email, reset_link)
        print(f"PASSWORD RESET LINK for {email}: {reset_link}")
        return

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _get_config_value("SMTP_FROM_EMAIL") or ""
    message["To"] = email
    message.set_content(body)

    host = _get_config_value("SMTP_HOST") or ""
    port = int(_get_config_value("SMTP_PORT") or "587")
    username = _get_config_value("SMTP_USERNAME") or ""
    password = _get_config_value("SMTP_PASSWORD") or ""

    try:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)
    except Exception:
        logger.exception("Failed to send password reset email to %s", email)
        print(f"PASSWORD RESET LINK for {email}: {reset_link}")
