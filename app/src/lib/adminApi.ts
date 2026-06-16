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