from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field

from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.email_service import send_email_message


router = APIRouter(prefix="/reports", tags=["Reports"])


class EmailReportRequest(BaseModel):
    recipients: list[EmailStr] = Field(default_factory=list)
    subject: str = Field(min_length=3, max_length=180)
    body: str = Field(min_length=10)
    send_copy_to_me: bool = True


class EmailReportResponse(BaseModel):
    sent: bool
    recipients: list[str]
    message: str


@router.post("/email", response_model=EmailReportResponse)
async def email_report(
    data: EmailReportRequest,
    current_user: User = Depends(get_current_user),
):
    recipients = [str(email) for email in data.recipients]

    if data.send_copy_to_me and current_user.email:
        recipients.append(current_user.email)

    result = await send_email_message(
        to_emails=recipients,
        subject=data.subject,
        body=data.body,
    )

    return EmailReportResponse(**result)
