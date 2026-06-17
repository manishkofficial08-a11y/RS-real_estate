import logging

logger = logging.getLogger(__name__)


async def send_password_reset_email(email: str, reset_link: str) -> None:
    """Development email sender.

    In production, replace this with SMTP/Brevo/SendGrid.
    For now, the reset link is printed in backend logs.
    """
    logger.warning("PASSWORD RESET LINK for %s: %s", email, reset_link)
    print(f"PASSWORD RESET LINK for {email}: {reset_link}")
