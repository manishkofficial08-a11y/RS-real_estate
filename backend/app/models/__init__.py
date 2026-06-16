from app.models.tenant import Tenant, BusinessType, PlanType
from app.models.user import User, UserRole
from app.models.property import Property, PropertyType, PropertyStatus
from app.models.lead import Lead, LeadActivity, LeadStatus, LeadSource
from app.models.support_ticket import SupportTicket, SupportTicketStatus, SupportTicketPriority, SupportTicketCategory
from app.models.notification import Notification, NotificationAudience, NotificationType
from app.models.ai_job import AIJob, AIJobStatus, AIJobType, AIJobPriority