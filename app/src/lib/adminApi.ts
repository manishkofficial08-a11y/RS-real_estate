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

