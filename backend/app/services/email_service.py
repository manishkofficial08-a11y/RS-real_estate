import logging
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path

from app.services.gmail_api import gmail_api_configured, send_gmail_message

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

    if gmail_api_configured():
        result = await send_gmail_message([email], subject, body)
        if not result.get("sent"):
            logger.warning("Gmail API password reset delivery failed for %s: %s", email, result.get("message"))
        return

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


async def send_email_message(
    to_emails: list[str],
    subject: str,
    body: str,
    html_body: str | None = None,
) -> dict:
    clean_recipients = []
    seen = set()

    for email in to_emails:
        clean_email = str(email).strip().lower()

        if clean_email and clean_email not in seen:
            clean_recipients.append(clean_email)
            seen.add(clean_email)

    if not clean_recipients:
        return {
            "sent": False,
            "recipients": [],
            "message": "No valid email recipients provided.",
        }

    if gmail_api_configured():
        return await send_gmail_message(clean_recipients, subject, body, html_body)

    if not _smtp_configured():
        logger.warning(
            "EMAIL NOT SENT because SMTP is not configured. Subject=%s Recipients=%s",
            subject,
            clean_recipients,
        )
        print(f"EMAIL PREVIEW - To: {', '.join(clean_recipients)}")
        print(f"EMAIL PREVIEW - Subject: {subject}")
        print(body)

        return {
            "sent": False,
            "recipients": clean_recipients,
            "message": "SMTP is not configured. Email preview was printed in backend logs.",
        }

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = _get_config_value("SMTP_FROM_EMAIL") or ""
    message["To"] = ", ".join(clean_recipients)
    message.set_content(body)

    if html_body:
        message.add_alternative(html_body, subtype="html")

    host = _get_config_value("SMTP_HOST") or ""
    port = int(_get_config_value("SMTP_PORT") or "587")
    username = _get_config_value("SMTP_USERNAME") or ""
    password = _get_config_value("SMTP_PASSWORD") or ""

    try:
        with smtplib.SMTP(host, port, timeout=20) as smtp:
            smtp.starttls()
            smtp.login(username, password)
            smtp.send_message(message)

        return {
            "sent": True,
            "recipients": clean_recipients,
            "message": f"Email sent to {len(clean_recipients)} recipient(s).",
        }
    except Exception:
        logger.exception(
            "Failed to send email. Subject=%s Recipients=%s",
            subject,
            clean_recipients,
        )

        return {
            "sent": False,
            "recipients": clean_recipients,
            "message": "Failed to send email. Check backend SMTP logs.",
        }
