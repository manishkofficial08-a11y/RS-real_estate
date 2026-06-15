const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1";

const CLIENT_ACCESS_TOKEN_KEY = "client_access_token";
const CLIENT_REFRESH_TOKEN_KEY = "client_refresh_token";

export function getClientToken(): string | null {
  return localStorage.getItem(CLIENT_ACCESS_TOKEN_KEY);
}

export function isClientLoggedIn(): boolean {
  return Boolean(getClientToken());
}

export function saveClientSession(accessToken: string, refreshToken?: string) {
  localStorage.setItem(CLIENT_ACCESS_TOKEN_KEY, accessToken);

  if (refreshToken) {
    localStorage.setItem(CLIENT_REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearClientSession() {
  localStorage.removeItem(CLIENT_ACCESS_TOKEN_KEY);
  localStorage.removeItem(CLIENT_REFRESH_TOKEN_KEY);
}

export async function loginClient(email: string, password: string) {
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

  saveClientSession(data.access_token, data.refresh_token);

  return data;
}

export async function clientFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getClientToken();

  if (!token) {
    clearClientSession();
    throw new Error("Client session missing. Please login again.");
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
    clearClientSession();
    throw new Error("Client session expired. Please login again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed: ${response.status}`);
  }

  return response.json();
}
export type ClientLead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  source: string;
  status: string;
  score: number;
  notes?: string | null;
};

export async function getClientLeads(): Promise<ClientLead[]> {
  return clientFetch<ClientLead[]>("/leads");
}

export type ClientProperty = {
  id: string;
  tenant_id: string;
  title: string;
  description?: string | null;
  price: number;
  location: string;
  property_type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft?: number | null;
  images: string[];
  created_by: string;
};

export type CreateClientPropertyPayload = {
  title: string;
  description?: string;
  price: number;
  location: string;
  property_type: string;
  status: string;
  bedrooms: number;
  bathrooms: number;
  area_sqft?: number;
  images?: string[];
};

export async function getClientProperties(): Promise<ClientProperty[]> {
  return clientFetch<ClientProperty[]>("/properties/");
}

export async function createClientProperty(
  payload: CreateClientPropertyPayload
): Promise<ClientProperty> {
  return clientFetch<ClientProperty>("/properties/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}