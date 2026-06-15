const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

function getFounderToken(): string {
  const token = localStorage.getItem("founder_access_token");

  if (!token) {
    throw new Error("Founder access token missing. Please login again.");
  }

  return token;
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getFounderToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
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