const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

const FOUNDER_ACCESS_TOKEN_KEY = "founder_access_token";
const FOUNDER_REFRESH_TOKEN_KEY = "founder_refresh_token";

export function getFounderToken(): string | null {
  return localStorage.getItem(FOUNDER_ACCESS_TOKEN_KEY);
}

export function isFounderLoggedIn(): boolean {
  return Boolean(getFounderToken());
}

export function clearFounderSession() {
  localStorage.removeItem(FOUNDER_ACCESS_TOKEN_KEY);
  localStorage.removeItem(FOUNDER_REFRESH_TOKEN_KEY);
}

export function saveFounderSession(accessToken: string, refreshToken?: string) {
  localStorage.setItem(FOUNDER_ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(FOUNDER_REFRESH_TOKEN_KEY, refreshToken);
  }
}

function redirectToFounderLogin() {
  clearFounderSession();

  if (!window.location.pathname.includes("/admin/login")) {
    window.location.href = "/admin/login";
  }
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getFounderToken();

  if (!token) {
    redirectToFounderLogin();
    throw new Error("Founder session missing. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 || response.status === 403) {
    redirectToFounderLogin();
    throw new Error("Founder session expired. Please login again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json();
}

export type FounderLoginResponse = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
};

export async function loginFounder(email: string, password: string): Promise<FounderLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Invalid email or password");
  }

  const data = await response.json();

  saveFounderSession(data.access_token, data.refresh_token);

  return data;
}

export function logoutFounder() {
  clearFounderSession();
  window.location.href = "/admin/login";
}

export type MessageResponse = {
  message: string;
};

export async function requestFounderPasswordReset(email: string): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to request password reset");
  }

  return response.json();
}

export async function resetFounderPassword(token: string, password: string): Promise<MessageResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to reset password");
  }

  return response.json();
}

export type AdminDashboardStats = {
  total_tenants: number;
  total_users: number;
  total_properties: number;
  total_leads: number;
};

export type AdminTenant = {
  id: string;
  name: string;
  business_type: string;
  plan: string;
  is_active: boolean;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  return adminFetch<AdminDashboardStats>("/admin/dashboard");
}

export async function getAdminTenants(): Promise<AdminTenant[]> {
  return adminFetch<AdminTenant[]>("/admin/tenants");
}

export async function toggleAdminTenant(tenantId: string): Promise<{ message: string }> {
  return adminFetch<{ message: string }>(`/admin/tenants/${tenantId}/toggle`, {
    method: "PATCH",
  });
}

export type AdminUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string | null;
  company: string | null;
  is_active: boolean;
};

export type AdminLead = {
  id: string;
  tenant_id: string;
  company: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  source: string;
  status: string;
  score: number;
  property_interest_id: string | null;
  notes: string | null;
  assigned_to: string | null;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  return adminFetch<AdminUser[]>("/admin/users");
}

export async function getAdminLeads(): Promise<AdminLead[]> {
  return adminFetch<AdminLead[]>("/admin/leads");
}

export type AdminSupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type AdminSupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type AdminSupportMessage = {
  id: string;
  author_type: "client" | "admin" | "system" | string;
  author_user_id?: string | null;
  author_name?: string | null;
  message: string;
  created_at?: string | null;
};

export type AdminSupportTicket = {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  subject: string;
  category: string;
  priority: AdminSupportTicketPriority | string;
  status: AdminSupportTicketStatus | string;
  message: string;
  admin_reply?: string | null;
  assigned_admin_id?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  business_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  messages: AdminSupportMessage[];
};

export type UpdateSupportTicketPayload = {
  status?: AdminSupportTicketStatus;
  priority?: AdminSupportTicketPriority;
  admin_reply?: string | null;
  assigned_admin_id?: string | null;
};

export async function getSupportTickets(params?: {
  status?: AdminSupportTicketStatus | "all";
  priority?: AdminSupportTicketPriority | "all";
}): Promise<AdminSupportTicket[]> {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status_filter", params.status);
  }

  if (params?.priority && params.priority !== "all") {
    searchParams.set("priority_filter", params.priority);
  }

  const query = searchParams.toString();

  return adminFetch<AdminSupportTicket[]>(
    `/support/admin/tickets${query ? `?${query}` : ""}`,
  );
}

export async function updateSupportTicket(
  ticketId: string,
  payload: UpdateSupportTicketPayload,
): Promise<AdminSupportTicket> {
  return adminFetch<AdminSupportTicket>(`/support/admin/tickets/${ticketId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function addAdminSupportMessage(
  ticketId: string,
  payload: { message: string; status?: AdminSupportTicketStatus },
): Promise<AdminSupportTicket> {
  return adminFetch<AdminSupportTicket>(
    `/support/admin/tickets/${ticketId}/messages`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export type AdminBillingPlan = "free" | "pro" | "enterprise";
export type AdminBillingStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "cancelled"
  | "inactive";
export type AdminBillingCycle = "monthly" | "yearly";

export type AdminSubscriptionRow = {
  tenant_id: string;
  company: string;
  business_type: string;
  is_active: boolean;
  subscription: {
    id: string;
    tenant_id: string;
    plan: AdminBillingPlan;
    status: AdminBillingStatus;
    billing_cycle: AdminBillingCycle;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    provider: string;
  };
  plan: {
    id: string;
    name: string;
    currency: string;
    monthly_price?: number | null;
    yearly_price?: number | null;
    features: string[];
  };
  monthly_value: number;
  invoice_count: number;
  outstanding_amount: number;
};

export async function getAdminSubscriptions(): Promise<AdminSubscriptionRow[]> {
  return adminFetch<AdminSubscriptionRow[]>("/billing/admin/subscriptions");
}

export async function updateAdminSubscription(
  tenantId: string,
  payload: {
    plan?: AdminBillingPlan;
    status?: AdminBillingStatus;
    billing_cycle?: AdminBillingCycle;
    cancel_at_period_end?: boolean;
  },
): Promise<AdminSubscriptionRow> {
  return adminFetch<AdminSubscriptionRow>(
    `/billing/admin/subscriptions/${tenantId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}
export type AdminNotification = {
  id: string;
  tenant_id?: string | null;
  recipient_user_id?: string | null;
  audience: string;
  type: string;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  link?: string | null;
  is_read: boolean;
};

export type AdminNotificationUnreadCount = {
  unread_count: number;
};

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  return adminFetch<AdminNotification[]>("/notifications/admin");
}

export async function getAdminNotificationUnreadCount(): Promise<AdminNotificationUnreadCount> {
  return adminFetch<AdminNotificationUnreadCount>("/notifications/admin/unread-count");
}

export async function markAdminNotificationRead(
  notificationId: string
): Promise<AdminNotification> {
  return adminFetch<AdminNotification>(`/notifications/admin/${notificationId}/read`, {
    method: "PUT",
  });
}
export type AdminAIJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type AdminAIJobType =
  | "caption"
  | "hashtag"
  | "scheduler"
  | "publisher"
  | "analytics"
  | "recommendation"
  | "report"
  | "chat"
  | "voice"
  | "orchestrator"
  | "other";

export type AdminAIJobPriority = "low" | "normal" | "high" | "urgent";

export type AdminAIJob = {
  id: string;
  tenant_id: string;
  created_by_user_id?: string | null;
  job_type: AdminAIJobType | string;
  title: string;
  description?: string | null;
  status: AdminAIJobStatus | string;
  priority: AdminAIJobPriority | string;
  input_payload?: Record<string, unknown> | null;
  output_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  progress: number;
  attempts: number;
  max_attempts: number;
  business_name?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type UpdateAIJobPayload = {
  status?: AdminAIJobStatus;
  priority?: AdminAIJobPriority;
  progress?: number;
  output_payload?: Record<string, unknown> | null;
  error_message?: string | null;
};

export async function getAIJobs(params?: {
  status?: AdminAIJobStatus | "all";
  job_type?: AdminAIJobType | "all";
  tenant_id?: string;
}): Promise<AdminAIJob[]> {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status_filter", params.status);
  }

  if (params?.job_type && params.job_type !== "all") {
    searchParams.set("job_type_filter", params.job_type);
  }

  if (params?.tenant_id) {
    searchParams.set("tenant_id_filter", params.tenant_id);
  }

  const query = searchParams.toString();

  return adminFetch<AdminAIJob[]>(
    `/ai-jobs/admin/jobs${query ? `?${query}` : ""}`,
  );
}

export async function updateAIJob(
  jobId: string,
  payload: UpdateAIJobPayload,
): Promise<AdminAIJob> {
  return adminFetch<AdminAIJob>(`/ai-jobs/admin/jobs/${jobId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export type AdminPublisherOperationsSummary = {
  total: number;
  scheduled: number;
  publishing: number;
  published: number;
  failed: number;
  cancelled: number;
  due_now: number;
  retry_ready: number;
  success_rate: number;
};

export type AdminPublisherPlatformMetric = {
  platform: string;
  total: number;
  scheduled: number;
  publishing: number;
  published: number;
  failed: number;
  success_rate: number;
};

export type AdminPublisherEvent = {
  id: string;
  tenant_id: string;
  business_name?: string | null;
  generated_post_title?: string | null;
  platform: string;
  status: string;
  scheduled_at?: string | null;
  published_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  external_post_url?: string | null;
  retry_count: number;
  max_retries: number;
};

export type AdminPublisherOperations = {
  checked_at: string;
  summary: AdminPublisherOperationsSummary;
  platforms: AdminPublisherPlatformMetric[];
  recent_events: AdminPublisherEvent[];
  failed_events: AdminPublisherEvent[];
};

export type AdminPublisherProcessDuePayload = {
  tenant_id?: string;
  limit?: number;
  allow_mock_fallback?: boolean;
};

export type AdminPublisherProcessDueResponse = {
  checked_at: string;
  tenant_count: number;
  due_count: number;
  processed_count: number;
  results: Array<Record<string, unknown>>;
};

export async function getAdminPublisherOperations(): Promise<AdminPublisherOperations> {
  return adminFetch<AdminPublisherOperations>("/admin/publisher-operations");
}

export async function processAdminDuePublisherPosts(
  payload: AdminPublisherProcessDuePayload = {},
): Promise<AdminPublisherProcessDueResponse> {
  return adminFetch<AdminPublisherProcessDueResponse>("/admin/publisher-operations/process-due", {
    method: "POST",
    body: JSON.stringify({
      limit: payload.limit ?? 25,
      allow_mock_fallback: payload.allow_mock_fallback ?? true,
      ...(payload.tenant_id ? { tenant_id: payload.tenant_id } : {}),
    }),
  });
}

export type AdminClientOnboardingPayload = {
  business_name: string;
  owner_name: string;
  owner_email: string;
  business_type: "real_estate" | "retail" | "healthcare" | "other";
  plan: "free" | "pro" | "enterprise";
  notes?: string | null;
};

export type AdminClientOnboardingResponse = {
  tenant_id: string;
  business_name: string;
  business_type: string;
  plan: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  role: string;
  temporary_password: string;
  message: string;
};

export async function createAdminClientOnboardingWorkspace(
  payload: AdminClientOnboardingPayload,
): Promise<AdminClientOnboardingResponse> {
  return adminFetch<AdminClientOnboardingResponse>("/admin/client-onboarding", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type FreeLeadCandidate = {
  id: string;
  name: string;
  category: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  score: number;
  source: string;
  source_url: string;
};

export type FreeLeadSearchPayload = {
  industry: string;
  location: string;
  radius_km: number;
  limit: number;
};

export type FreeLeadSearchResponse = {
  industry: string;
  location: string;
  resolved_location: string;
  radius_km: number;
  provider: string;
  attribution_url: string;
  result_count: number;
  candidates: FreeLeadCandidate[];
};

export type FreeLeadImportResponse = {
  imported_count: number;
  skipped_count: number;
  imported_lead_ids: string[];
  skipped_candidate_ids: string[];
  message: string;
};

export async function searchFreeBusinessLeads(
  payload: FreeLeadSearchPayload,
): Promise<FreeLeadSearchResponse> {
  return adminFetch<FreeLeadSearchResponse>("/admin/lead-generation/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function importFreeBusinessLeads(
  tenantId: string,
  candidates: FreeLeadCandidate[],
): Promise<FreeLeadImportResponse> {
  return adminFetch<FreeLeadImportResponse>("/admin/lead-generation/import", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId, candidates }),
  });
}

export type RekhaMessage = {
  id: string;
  prospect_id: string;
  channel: 'email' | 'whatsapp' | 'call';
  direction: 'inbound' | 'outbound';
  status: 'draft' | 'approved' | 'sent' | 'failed' | 'received';
  subject?: string | null;
  body: string;
  provider?: string | null;
  provider_message_id?: string | null;
  error_message?: string | null;
  sent_at?: string | null;
  created_at?: string | null;
};

export type RekhaProspect = {
  id: string;
  external_id?: string | null;
  business_name: string;
  category?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  source: string;
  source_url?: string | null;
  lead_score: number;
  fit_score: number;
  fit_reason?: string | null;
  status: string;
  preferred_channel?: string | null;
  opted_out: boolean;
  last_contacted_at?: string | null;
  next_follow_up_at?: string | null;
  replied_at?: string | null;
  demo_booked_at?: string | null;
  created_at?: string | null;
  messages: RekhaMessage[];
};

export type RekhaOverview = {
  agent: {
    agent_name: string;
    ai_ready: boolean;
    email_ready: boolean;
    whatsapp_ready: boolean;
    booking_ready: boolean;
    founder_handoff_ready: boolean;
    auto_send_enabled: boolean;
    daily_send_limit: number;
    call_enabled: boolean;
    call_note: string;
  };
  pipeline: Record<string, number>;
  total_prospects: number;
  sent_today: number;
};

export type RekhaRunPayload = {
  industry: string;
  location: string;
  radius_km: number;
  limit: number;
  minimum_score: number;
  channel: 'email' | 'whatsapp';
  auto_send: boolean;
};

export type RekhaRunResponse = {
  agent: string;
  discovered_count: number;
  qualified_count: number;
  imported_count: number;
  duplicates_skipped: number;
  drafted_count: number;
  sent_count: number;
  auto_send_requested: boolean;
  auto_send_enabled: boolean;
  send_errors: string[];
  message: string;
};

export async function getRekhaOverview(): Promise<RekhaOverview> {
  return adminFetch<RekhaOverview>('/admin/rekha/overview');
}

export async function getRekhaProspects(): Promise<RekhaProspect[]> {
  return adminFetch<RekhaProspect[]>('/admin/rekha/prospects');
}

export async function importRekhaProspects(
  candidates: FreeLeadCandidate[],
  resolvedLocation?: string,
): Promise<{ imported_count: number; skipped_count: number; prospect_ids: string[]; message: string }> {
  return adminFetch('/admin/rekha/prospects/import', {
    method: 'POST',
    body: JSON.stringify({
      resolved_location: resolvedLocation,
      candidates: candidates.map((candidate) => ({
        ...candidate,
        location: resolvedLocation,
      })),
    }),
  });
}

export async function runRekha(payload: RekhaRunPayload): Promise<RekhaRunResponse> {
  return adminFetch<RekhaRunResponse>('/admin/rekha/run', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createRekhaDraft(
  prospectId: string,
  channel: 'email' | 'whatsapp',
): Promise<RekhaMessage> {
  return adminFetch<RekhaMessage>(`/admin/rekha/prospects/${prospectId}/draft`, {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });
}

export async function sendRekhaMessage(
  messageId: string,
  payload: { subject?: string; body?: string },
): Promise<{ message: RekhaMessage; delivery: Record<string, unknown> }> {
  return adminFetch<{ message: RekhaMessage; delivery: Record<string, unknown> }>(`/admin/rekha/messages/${messageId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function recordRekhaReply(
  prospectId: string,
  payload: { channel: 'email' | 'whatsapp' | 'call'; body: string; demo_booked: boolean },
): Promise<{ intent: string; suggested_reply: RekhaMessage; founder_handoff: boolean }> {
  return adminFetch<{ intent: string; suggested_reply: RekhaMessage; founder_handoff: boolean }>(`/admin/rekha/prospects/${prospectId}/reply`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

