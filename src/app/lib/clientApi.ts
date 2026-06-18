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

export async function requestClientPasswordReset(email: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to request password reset");
  }

  return response.json();
}

export async function resetClientPassword(payload: {
  token: string;
  password: string;
}): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to reset password");
  }

  return response.json();
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
  let friendlyMessage = "";
  try {
    const parsed = JSON.parse(errorText);
    if (parsed && parsed.detail) {
      if (typeof parsed.detail === "string") {
        friendlyMessage = parsed.detail;
      } else if (Array.isArray(parsed.detail)) {
        friendlyMessage = parsed.detail.map((err: any) => err.msg || JSON.stringify(err)).join(", ");
      } else {
        friendlyMessage = JSON.stringify(parsed.detail);
      }
    }
  } catch (e) {
    friendlyMessage = errorText;
  }
  throw new Error(friendlyMessage || `Request failed: ${response.status}`);
}

if (response.status === 204) {
  return undefined as T;
}

const text = await response.text();

if (!text) {
  return undefined as T;
}

return JSON.parse(text) as T;
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
export type CreateClientLeadPayload = {
  name: string;
  email?: string;
  phone?: string;
  source: string;
  status: string;
  score: number;
  notes?: string;
};

export async function createClientLead(
  payload: CreateClientLeadPayload
): Promise<ClientLead> {
  return clientFetch<ClientLead>("/leads/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export type UpdateClientPropertyPayload = Partial<CreateClientPropertyPayload>;

export async function updateClientProperty(
  propertyId: string,
  payload: UpdateClientPropertyPayload
): Promise<ClientProperty> {
  return clientFetch<ClientProperty>(`/properties/${propertyId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export type UpdateClientLeadPayload = Partial<CreateClientLeadPayload>;

export async function updateClientLead(
  leadId: string,
  payload: UpdateClientLeadPayload
): Promise<ClientLead> {
  return clientFetch<ClientLead>(`/leads/${leadId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteClientLead(leadId: string): Promise<void> {
  await clientFetch<void>(`/leads/${leadId}`, {
    method: "DELETE",
  });
}

export async function getArchivedClientLeads(): Promise<ClientLead[]> {
  return clientFetch<ClientLead[]>("/leads/archived");
}

export async function restoreClientLead(leadId: string): Promise<ClientLead> {
  return clientFetch<ClientLead>(`/leads/${leadId}/restore`, {
    method: "PUT",
  });
}
export type ClientProfile = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  tenant_id?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  plan?: string | null;
};

export async function getClientProfile(): Promise<ClientProfile> {
  return clientFetch<ClientProfile>("/auth/me");
}

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export type SupportTicketCategory =
  | "general"
  | "billing"
  | "technical"
  | "crm"
  | "properties"
  | "ai_agents"
  | "other";

export type SupportTicket = {
  id: string;
  tenant_id: string;
  created_by_user_id: string;
  subject: string;
  category: SupportTicketCategory | string;
  priority: SupportTicketPriority | string;
  status: SupportTicketStatus | string;
  message: string;
  admin_reply?: string | null;
  assigned_admin_id?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  business_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateSupportTicketPayload = {
  subject: string;
  category: SupportTicketCategory;
  priority: SupportTicketPriority;
  message: string;
};

export async function createSupportTicket(
  payload: CreateSupportTicketPayload,
): Promise<SupportTicket> {
  return clientFetch<SupportTicket>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMySupportTickets(): Promise<SupportTicket[]> {
  return clientFetch<SupportTicket[]>("/support/tickets/my");
}
export type ClientNotification = {
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

export type ClientNotificationUnreadCount = {
  unread_count: number;
};

export async function getClientNotifications(): Promise<ClientNotification[]> {
  return clientFetch<ClientNotification[]>("/notifications/my");
}

export async function getClientNotificationUnreadCount(): Promise<ClientNotificationUnreadCount> {
  return clientFetch<ClientNotificationUnreadCount>("/notifications/my/unread-count");
}

export async function markClientNotificationRead(
  notificationId: string
): Promise<ClientNotification> {
  return clientFetch<ClientNotification>(`/notifications/my/${notificationId}/read`, {
    method: "PUT",
  });
}

export type ClientAIJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type ClientAIJobType =
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

export type ClientAIJobPriority = "low" | "normal" | "high" | "urgent";

export type ClientAIJob = {
  id: string;
  tenant_id: string;
  created_by_user_id?: string | null;
  job_type: ClientAIJobType | string;
  title: string;
  description?: string | null;
  status: ClientAIJobStatus | string;
  priority: ClientAIJobPriority | string;
  input_payload?: Record<string, unknown> | null;
  output_payload?: Record<string, unknown> | null;
  error_message?: string | null;
  progress: number;
  attempts: number;
  max_attempts: number;
  started_at?: string | null;
  completed_at?: string | null;
  failed_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientAIJobPayload = {
  job_type: ClientAIJobType;
  title: string;
  description?: string;
  priority?: ClientAIJobPriority;
  input_payload?: Record<string, unknown>;
};

export async function createClientAIJob(
  payload: CreateClientAIJobPayload,
): Promise<ClientAIJob> {
  return clientFetch<ClientAIJob>("/ai-jobs/jobs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyClientAIJobs(): Promise<ClientAIJob[]> {
  return clientFetch<ClientAIJob[]>("/ai-jobs/jobs/my");
}

export type ClientContentAssetType =
  | "image"
  | "video"
  | "pdf"
  | "text"
  | "link";

export type ClientContentAsset = {
  id: string;
  tenant_id: string;
  uploaded_by_user_id: string;
  title: string;
  description?: string | null;
  asset_type: ClientContentAssetType | string;
  file_url?: string | null;
  file_name?: string | null;
  mime_type?: string | null;
  file_size?: number | null;
  property_id?: string | null;
  property_title?: string | null;
  uploaded_by_name?: string | null;
  uploaded_by_email?: string | null;
  metadata_json?: Record<string, unknown> | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientContentAssetPayload = {
  title: string;
  description?: string;
  asset_type: ClientContentAssetType;
  file_url?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
  property_id?: string | null;
  metadata_json?: Record<string, unknown>;
};

export type UpdateClientContentAssetPayload =
  Partial<CreateClientContentAssetPayload>;

export type ClientUploadResponse = {
  filename: string;
  url: string;
  size: number;
  mime_type?: string;
  original_filename?: string;
  asset_type?: ClientContentAssetType;
};

export async function uploadClientAssetFile(
  file: File,
): Promise<ClientUploadResponse> {
  const token = getClientToken();

  if (!token) {
    clearClientSession();
    throw new Error("Client session missing. Please login again.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/upload/asset`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (response.status === 401 || response.status === 403) {
    clearClientSession();
    throw new Error("Client session expired. Please login again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Upload failed: ${response.status}`);
  }

  return response.json();
}

export async function getMyContentAssets(params?: {
  asset_type?: ClientContentAssetType | "all";
  search?: string;
}): Promise<ClientContentAsset[]> {
  const searchParams = new URLSearchParams();

  if (params?.asset_type && params.asset_type !== "all") {
    searchParams.set("asset_type", params.asset_type);
  }

  const search = typeof params?.search === "string" ? params.search.trim() : "";

  if (search) {
    searchParams.set("search", search);
  }

  const query = searchParams.toString();
  return clientFetch<ClientContentAsset[]>(
    `/content/assets/my${query ? `?${query}` : ""}`,
  );
}

export async function createContentAsset(
  payload: CreateClientContentAssetPayload,
): Promise<ClientContentAsset> {
  return clientFetch<ClientContentAsset>("/content/assets/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateContentAsset(
  assetId: string,
  payload: UpdateClientContentAssetPayload,
): Promise<ClientContentAsset> {
  return clientFetch<ClientContentAsset>(`/content/assets/${assetId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteContentAsset(assetId: string): Promise<void> {
  await clientFetch<void>(`/content/assets/${assetId}`, {
    method: "DELETE",
  });
}

export type ClientGeneratedPostStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "failed"
  | "archived";

export type ClientGeneratedPostPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "website"
  | "other";

export type ClientGeneratedPost = {
  id: string;
  tenant_id: string;
  created_by_user_id?: string | null;
  property_id?: string | null;
  source_ai_job_id?: string | null;
  title: string;
  content: string;
  platform: ClientGeneratedPostPlatform | string;
  status: ClientGeneratedPostStatus | string;
  hashtags: string[];
  media_asset_ids: string[];
  metadata_json?: Record<string, unknown> | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  is_active: boolean;
  property_title?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  source_ai_job_title?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientGeneratedPostPayload = {
  title: string;
  content: string;
  platform?: ClientGeneratedPostPlatform;
  status?: ClientGeneratedPostStatus;
  property_id?: string | null;
  source_ai_job_id?: string | null;
  hashtags?: string[];
  media_asset_ids?: string[];
  scheduled_at?: string | null;
  published_at?: string | null;
  metadata_json?: Record<string, unknown>;
};

export type UpdateClientGeneratedPostPayload =
  Partial<CreateClientGeneratedPostPayload>;

export type PublishClientGeneratedPostPayload = {
  platform?: ClientGeneratedPostPlatform;
  allow_mock_fallback?: boolean;
};

export type ClientCampaignPublishPlatform =
  | "youtube"
  | "instagram"
  | "facebook"
  | "linkedin";

export type CampaignPublishGeneratedPostPayload = {
  platforms: ClientCampaignPublishPlatform[];
  allow_mock_fallback?: boolean;
  campaign_metadata?: Record<string, unknown>;
};

export type ClientCampaignPublishResult = {
  platform: ClientCampaignPublishPlatform | string;
  status: "success" | "failed" | "mock_fallback" | string;
  mode: "real" | "mock" | "failed" | string;
  external_post_id?: string | null;
  external_post_url?: string | null;
  warning?: string | null;
  error?: string | null;
};

export type ClientCampaignPublishResponse = {
  generated_post_id: string;
  campaign_id: string;
  results: ClientCampaignPublishResult[];
};

export type GetClientGeneratedPostsParams = {
  status?: ClientGeneratedPostStatus | "all";
  platform?: ClientGeneratedPostPlatform | "all";
  property_id?: string;
  search?: string;
  limit?: number;
};

export async function getMyGeneratedPosts(
  params?: GetClientGeneratedPostsParams,
): Promise<ClientGeneratedPost[]> {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params?.platform && params.platform !== "all") {
    searchParams.set("platform", params.platform);
  }

  if (params?.property_id) {
    searchParams.set("property_id", params.property_id);
  }

  const search = typeof params?.search === "string" ? params.search.trim() : "";

  if (search) {
    searchParams.set("search", search);
  }

  if (typeof params?.limit === "number" && params.limit > 0) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  return clientFetch<ClientGeneratedPost[]>(
    `/generated-posts/my${query ? `?${query}` : ""}`,
  );
}

export async function getGeneratedPost(
  postId: string,
): Promise<ClientGeneratedPost> {
  return clientFetch<ClientGeneratedPost>(`/generated-posts/${postId}`);
}

export async function createGeneratedPost(
  payload: CreateClientGeneratedPostPayload,
): Promise<ClientGeneratedPost> {
  return clientFetch<ClientGeneratedPost>("/generated-posts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGeneratedPost(
  postId: string,
  payload: UpdateClientGeneratedPostPayload,
): Promise<ClientGeneratedPost> {
  return clientFetch<ClientGeneratedPost>(`/generated-posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function publishGeneratedPost(
  postId: string,
  payload: PublishClientGeneratedPostPayload = {},
): Promise<ClientGeneratedPost> {
  return clientFetch<ClientGeneratedPost>(`/generated-posts/${postId}/publish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function campaignPublishGeneratedPost(
  postId: string,
  payload: CampaignPublishGeneratedPostPayload,
): Promise<ClientCampaignPublishResponse> {
  return clientFetch<ClientCampaignPublishResponse>(
    `/generated-posts/${postId}/campaign-publish`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}


export async function deleteGeneratedPost(postId: string): Promise<void> {
  await clientFetch<void>(`/generated-posts/${postId}`, {
    method: "DELETE",
  });
}

export type ClientScheduledPostStatus =
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled";

export type ClientScheduledPostPlatform =
  | "instagram"
  | "facebook"
  | "linkedin"
  | "twitter"
  | "website"
  | "other";

export type ClientScheduledPost = {
  id: string;
  tenant_id: string;
  generated_post_id: string;
  created_by_user_id?: string | null;
  platform: ClientScheduledPostPlatform | string;
  status: ClientScheduledPostStatus | string;
  scheduled_at: string;
  published_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  external_post_id?: string | null;
  external_post_url?: string | null;
  retry_count: number;
  max_retries: number;
  metadata_json?: Record<string, unknown> | null;
  is_active: boolean;
  generated_post_title?: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type CreateClientScheduledPostPayload = {
  generated_post_id: string;
  platform?: ClientScheduledPostPlatform;
  status?: ClientScheduledPostStatus;
  scheduled_at: string;
  published_at?: string | null;
  failed_at?: string | null;
  failure_reason?: string | null;
  external_post_id?: string | null;
  external_post_url?: string | null;
  retry_count?: number;
  max_retries?: number;
  metadata_json?: Record<string, unknown>;
};

export type UpdateClientScheduledPostPayload =
  Partial<CreateClientScheduledPostPayload>;

export type GetClientScheduledPostsParams = {
  status?: ClientScheduledPostStatus | "all";
  platform?: ClientScheduledPostPlatform | "all";
  generated_post_id?: string;
  from_date?: string | Date;
  to_date?: string | Date;
  limit?: number;
};

function formatClientDateQueryValue(value?: string | Date): string {
  if (!value) return "";

  if (value instanceof Date) {
    return value.toISOString();
  }

  return value.trim();
}

export async function getMyScheduledPosts(
  params?: GetClientScheduledPostsParams,
): Promise<ClientScheduledPost[]> {
  const searchParams = new URLSearchParams();

  if (params?.status && params.status !== "all") {
    searchParams.set("status", params.status);
  }

  if (params?.platform && params.platform !== "all") {
    searchParams.set("platform", params.platform);
  }

  if (params?.generated_post_id) {
    searchParams.set("generated_post_id", params.generated_post_id);
  }

  const fromDate = formatClientDateQueryValue(params?.from_date);
  if (fromDate) {
    searchParams.set("from_date", fromDate);
  }

  const toDate = formatClientDateQueryValue(params?.to_date);
  if (toDate) {
    searchParams.set("to_date", toDate);
  }

  if (typeof params?.limit === "number" && params.limit > 0) {
    searchParams.set("limit", String(params.limit));
  }

  const query = searchParams.toString();
  return clientFetch<ClientScheduledPost[]>(
    `/scheduled-posts/my${query ? `?${query}` : ""}`,
  );
}

export async function getScheduledPost(
  scheduleId: string,
): Promise<ClientScheduledPost> {
  return clientFetch<ClientScheduledPost>(`/scheduled-posts/${scheduleId}`);
}

export async function createScheduledPost(
  payload: CreateClientScheduledPostPayload,
): Promise<ClientScheduledPost> {
  return clientFetch<ClientScheduledPost>("/scheduled-posts/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateScheduledPost(
  scheduleId: string,
  payload: UpdateClientScheduledPostPayload,
): Promise<ClientScheduledPost> {
  return clientFetch<ClientScheduledPost>(`/scheduled-posts/${scheduleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteScheduledPost(scheduleId: string): Promise<void> {
  await clientFetch<void>(`/scheduled-posts/${scheduleId}`, {
    method: "DELETE",
  });
}


export type EmailReportPayload = {
  recipients?: string[];
  subject: string;
  body: string;
  send_copy_to_me?: boolean;
};

export type EmailReportResponse = {
  sent: boolean;
  recipients: string[];
  message: string;
};

export async function emailReport(
  payload: EmailReportPayload,
): Promise<EmailReportResponse> {
  return clientFetch<EmailReportResponse>("/reports/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
