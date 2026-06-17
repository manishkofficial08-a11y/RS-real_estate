from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import uuid
import json

from app.database.session import get_db
from app.core.dependencies import get_current_user, get_current_admin, get_tenant_id
from app.models.user import User
from app.models.tenant import Tenant
from app.models.ai_job import AIJob, AIJobStatus, AIJobType, AIJobPriority
from app.services.ai_agents.orchestrator import execute_ai_job


router = APIRouter(prefix="/ai-jobs", tags=["AI Jobs"])


class AIJobCreate(BaseModel):
    job_type: str = AIJobType.other.value
    title: str
    description: Optional[str] = None
    priority: str = AIJobPriority.normal.value
    input_payload: Optional[dict] = None


class AIJobUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    output_payload: Optional[dict] = None
    error_message: Optional[str] = None
    progress: Optional[int] = None


class AIJobResponse(BaseModel):
    id: str
    tenant_id: str
    created_by_user_id: Optional[str] = None

    job_type: str
    title: str
    description: Optional[str] = None

    status: str
    priority: str

    input_payload: Optional[dict] = None
    output_payload: Optional[dict] = None
    error_message: Optional[str] = None

    progress: int = 0
    attempts: int = 0
    max_attempts: int = 3

    business_name: Optional[str] = None
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None

    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


def _json_to_dict(value: Optional[str]) -> Optional[dict]:
    if not value:
        return None

    try:
        return json.loads(value)
    except json.JSONDecodeError:
        return {"raw": value}


def _dict_to_json(value: Optional[dict]) -> Optional[str]:
    if value is None:
        return None

    return json.dumps(value)


def _field_was_provided(data: BaseModel, field_name: str) -> bool:
    fields_set = getattr(data, "model_fields_set", None)

    if fields_set is None:
        fields_set = getattr(data, "__fields_set__", set())

    return field_name in fields_set


def validate_ai_job_create(data: AIJobCreate):
    if not data.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required",
        )

    allowed_job_types = [item.value for item in AIJobType]
    allowed_priorities = [item.value for item in AIJobPriority]

    if data.job_type not in allowed_job_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid job_type. Allowed: {allowed_job_types}",
        )

    if data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Allowed: {allowed_priorities}",
        )


def validate_ai_job_update(data: AIJobUpdate):
    allowed_statuses = [item.value for item in AIJobStatus]
    allowed_priorities = [item.value for item in AIJobPriority]

    if data.status and data.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Allowed: {allowed_statuses}",
        )

    if data.priority and data.priority not in allowed_priorities:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Allowed: {allowed_priorities}",
        )

    if data.progress is not None and (data.progress < 0 or data.progress > 100):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress must be between 0 and 100",
        )


async def enrich_ai_job(job: AIJob, db: AsyncSession) -> AIJobResponse:
    user_result = await db.execute(select(User).where(User.id == job.created_by_user_id))
    user = user_result.scalar_one_or_none()

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == job.tenant_id))
    tenant = tenant_result.scalar_one_or_none()

    return AIJobResponse(
        id=job.id,
        tenant_id=job.tenant_id,
        created_by_user_id=job.created_by_user_id,
        job_type=job.job_type,
        title=job.title,
        description=job.description,
        status=job.status,
        priority=job.priority,
        input_payload=_json_to_dict(job.input_payload),
        output_payload=_json_to_dict(job.output_payload),
        error_message=job.error_message,
        progress=job.progress or 0,
        attempts=job.attempts or 0,
        max_attempts=job.max_attempts or 3,
        business_name=tenant.name if tenant else None,
        created_by_name=user.full_name if user else None,
        created_by_email=user.email if user else None,
        started_at=job.started_at,
        completed_at=job.completed_at,
        failed_at=job.failed_at,
        created_at=job.created_at,
        updated_at=job.updated_at,
    )


@router.post("/jobs", response_model=AIJobResponse, status_code=status.HTTP_201_CREATED)
async def create_ai_job(
    data: AIJobCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    validate_ai_job_create(data)

    job = AIJob(
        id=str(uuid.uuid4()),
        tenant_id=tenant_id,
        created_by_user_id=current_user.id,
        job_type=data.job_type,
        title=data.title.strip(),
        description=data.description.strip() if data.description else None,
        status=AIJobStatus.queued.value,
        priority=data.priority,
        input_payload=_dict_to_json(data.input_payload),
        progress=0,
        attempts=0,
        max_attempts=3,
    )

    db.add(job)
    await db.commit()
    await db.refresh(job)

    job = await execute_ai_job(job, db)

    return await enrich_ai_job(job, db)


@router.get("/jobs/my", response_model=List[AIJobResponse])
async def get_my_ai_jobs(
    status_filter: Optional[str] = None,
    job_type_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    tenant_id: str = Depends(get_tenant_id),
):
    query = (
        select(AIJob)
        .where(AIJob.tenant_id == tenant_id)
        .order_by(desc(AIJob.created_at))
    )

    if status_filter:
        query = query.where(AIJob.status == status_filter)

    if job_type_filter:
        query = query.where(AIJob.job_type == job_type_filter)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return [await enrich_ai_job(job, db) for job in jobs]


@router.get("/admin/jobs", response_model=List[AIJobResponse])
async def get_all_ai_jobs(
    status_filter: Optional[str] = None,
    job_type_filter: Optional[str] = None,
    tenant_id_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    query = select(AIJob).order_by(desc(AIJob.created_at))

    if status_filter:
        query = query.where(AIJob.status == status_filter)

    if job_type_filter:
        query = query.where(AIJob.job_type == job_type_filter)

    if tenant_id_filter:
        query = query.where(AIJob.tenant_id == tenant_id_filter)

    result = await db.execute(query)
    jobs = result.scalars().all()

    return [await enrich_ai_job(job, db) for job in jobs]


@router.put("/admin/jobs/{job_id}", response_model=AIJobResponse)
async def update_ai_job(
    job_id: str,
    data: AIJobUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(get_current_admin),
):
    validate_ai_job_update(data)

    result = await db.execute(select(AIJob).where(AIJob.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="AI job not found",
        )

    if data.status:
        job.status = data.status

        if data.status == AIJobStatus.running.value and not job.started_at:
            job.started_at = datetime.utcnow()

        if data.status == AIJobStatus.completed.value:
            job.progress = 100
            job.completed_at = datetime.utcnow()
            job.error_message = None

        if data.status == AIJobStatus.failed.value:
            job.failed_at = datetime.utcnow()

    if data.priority:
        job.priority = data.priority

    if data.output_payload is not None:
        job.output_payload = _dict_to_json(data.output_payload)

    if _field_was_provided(data, "error_message"):
        job.error_message = data.error_message.strip() if data.error_message else None

    if data.progress is not None:
        job.progress = data.progress

    await db.commit()
    await db.refresh(job)

    return await enrich_ai_job(job, db)