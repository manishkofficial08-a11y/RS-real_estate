const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

export type AdminDashboardStats = {
  total_tenants: number;
  total_users: number;
  total_properties: number;
  total_leads: number;
};

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const token = localStorage.getItem("founder_access_token");

  if (!token) {
    throw new Error("Founder access token missing. Please login again.");
  }

  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to fetch admin dashboard stats");
  }

  return response.json();
}
