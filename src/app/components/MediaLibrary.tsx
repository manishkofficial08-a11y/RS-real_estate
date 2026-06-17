import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ExternalLink,
  FileText,
  Image,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  createContentAsset,
  createGeneratedPost,
  deleteContentAsset,
  getClientProperties,
  getMyContentAssets,
  updateContentAsset,
  uploadClientAssetFile,
  type ClientContentAsset,
  type ClientContentAssetType,
  type ClientGeneratedPostPlatform,
  type ClientProperty,
} from "../lib/clientApi";

interface MediaLibraryProps {
  darkMode: boolean;
  defaultFilter?: ClientContentAssetType | "all";
  title?: string;
  subtitle?: string;
}

type AssetMode = "upload" | "text" | "link";

type AssetFormState = {
  title: string;
  description: string;
  asset_type: ClientContentAssetType;
  file_url: string;
  file_name: string;
  mime_type: string;
  property_id: string;
  tags: string;
  file_size?: number;
};

const apiOrigin = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1"
).replace(/\/api\/v1\/?$/, "");

const emptyForm: AssetFormState = {
  title: "",
  description: "",
  asset_type: "image",
  file_url: "",
  file_name: "",
  mime_type: "",
  property_id: "",
  tags: "",
};

const assetTypeOptions: Array<{
  value: ClientContentAssetType;
  label: string;
  icon: LucideIcon;
  color: string;
}> = [
  { value: "image", label: "Images", icon: Image, color: "#6366f1" },
  { value: "video", label: "Videos", icon: Video, color: "#ef4444" },
  { value: "pdf", label: "PDFs", icon: FileText, color: "#f59e0b" },
  { value: "text", label: "Text", icon: FileText, color: "#10b981" },
  { value: "link", label: "Links", icon: Link2, color: "#06b6d4" },
];

const socialPlatformOptions: Array<{
  value: ClientGeneratedPostPlatform;
  label: string;
}> = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter/X" },
  { value: "website", label: "Website" },
  { value: "other", label: "Other" },
];

const creationModes: Array<{
  value: AssetMode;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "upload",
    label: "Upload File",
    description: "Images, PDFs, videos, text files",
    icon: Upload,
  },
  {
    value: "text",
    label: "Text Note",
    description: "Reusable captions or notes",
    icon: FileText,
  },
  {
    value: "link",
    label: "External Link",
    description: "Drive, website, social link",
    icon: Link2,
  },
];

function getAssetMeta(assetType?: string | null) {
  return (
    assetTypeOptions.find((option) => option.value === assetType) ||
    assetTypeOptions.find((option) => option.value === "text")!
  );
}

function formatFileSize(value?: number | null) {
  if (!value) return "No file";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value?: string | null) {
  if (!value) return "Just now";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getTags(asset: ClientContentAsset) {
  const tags = asset.metadata_json?.tags;
  return Array.isArray(tags)
    ? tags.filter((tag) => typeof tag === "string")
    : [];
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function isValidUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function inferAssetTypeFromFile(file: File): ClientContentAssetType {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";

  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf" || extension === "pdf") return "pdf";
  if (
    file.type.startsWith("text/") ||
    extension === "txt" ||
    extension === "md"
  ) {
    return "text";
  }

  return "text";
}

function assetHasLocalPreview(asset: ClientContentAsset) {
  return Boolean(asset.file_url && asset.asset_type !== "link");
}

let cachedContentAssets: ClientContentAsset[] = [];

export function MediaLibrary({
  darkMode,
  defaultFilter = "all",
  title = "Media Library",
  subtitle = "Store listing media, content drafts, PDFs, videos, and campaign links.",
}: MediaLibraryProps) {
  const [allAssets, setAllAssets] = useState<ClientContentAsset[]>(cachedContentAssets);
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [typeFilter, setTypeFilter] = useState<ClientContentAssetType | "all">(
    defaultFilter,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetMode, setAssetMode] = useState<AssetMode>("upload");
  const [postPlatform, setPostPlatform] =
    useState<ClientGeneratedPostPlatform>("instagram");
  const [form, setForm] = useState<AssetFormState>(emptyForm);

  function syncAssets(
    nextAssets:
      | ClientContentAsset[]
      | ((previousAssets: ClientContentAsset[]) => ClientContentAsset[]),
  ) {
    setAllAssets((previousAssets) => {
      const resolvedAssets =
        typeof nextAssets === "function"
          ? nextAssets(previousAssets)
          : nextAssets;

      cachedContentAssets = resolvedAssets;
      return resolvedAssets;
    });
  }

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const subtlePanel = {
    background: darkMode ? "rgba(99,102,241,0.05)" : "#f8fafc",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const textSoft = darkMode ? "#64748b" : "#94a3b8";

  async function loadAssets(searchOverride?: string) {
    try {
      setLoading(true);
      setMessage(null);

      const searchValue =
        typeof searchOverride === "string" ? searchOverride : searchTerm;

      const data = await getMyContentAssets({
        search: searchValue,
      });

      const safeData = Array.isArray(data) ? data : [];
      const normalizedSearch = searchValue.trim();

      if (
        safeData.length === 0 &&
        cachedContentAssets.length > 0 &&
        normalizedSearch.length === 0
      ) {
        return;
      }

      syncAssets(safeData);

      const nextVisible = safeData.filter((asset) => {
        if (typeFilter === "all") return true;
        return getAssetMeta(asset.asset_type).value === typeFilter;
      });

      setSelectedAssetId((current) => {
        if (!nextVisible.length) return null;
        if (current && nextVisible.some((asset) => asset.id === current)) {
          return current;
        }
        return nextVisible[0].id;
      });
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to load assets",
      );
      // Preserve existing assets on transient reload failures.
    } finally {
      setLoading(false);
    }
  }

  async function loadProperties() {
    try {
      const data = await getClientProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to load properties for content assets", error);
    }
  }

  useEffect(() => {
    loadProperties();
    loadAssets();
  }, []);


  const visibleAssets = useMemo(() => {
    return allAssets.filter((asset) => {
      if (typeFilter === "all") return true;
      return getAssetMeta(asset.asset_type).value === typeFilter;
    });
  }, [allAssets, typeFilter]);

  useEffect(() => {
    if (!selectedAssetId && visibleAssets.length > 0) {
      setSelectedAssetId(visibleAssets[0].id);
      return;
    }

    if (
      selectedAssetId &&
      visibleAssets.length > 0 &&
      !visibleAssets.some((asset) => asset.id === selectedAssetId)
    ) {
      setSelectedAssetId(visibleAssets[0].id);
      return;
    }

    if (selectedAssetId && visibleAssets.length === 0) {
      setSelectedAssetId(null);
    }
  }, [visibleAssets, selectedAssetId]);

  const selectedAsset = useMemo(
    () =>
      visibleAssets.find((asset) => asset.id === selectedAssetId) ||
      visibleAssets[0],
    [visibleAssets, selectedAssetId],
  );
  const counts = useMemo(() => {
    const initial: Record<ClientContentAssetType | "all", number> = {
      all: allAssets.length,
      image: 0,
      video: 0,
      pdf: 0,
      text: 0,
      link: 0,
    };

    for (const asset of allAssets) {
      const type = getAssetMeta(asset.asset_type).value;
      initial[type] += 1;
    }

    return initial;
  }, [allAssets]);

  function resetForm() {
    setForm(emptyForm);
    setSelectedFile(null);
    setEditingAssetId(null);
    setAssetMode("upload");
  }

  function startCreate(mode: AssetMode = "upload") {
    resetForm();
    setAssetMode(mode);

    if (mode === "text") {
      setForm((prev) => ({ ...prev, asset_type: "text" }));
    }

    if (mode === "link") {
      setForm((prev) => ({ ...prev, asset_type: "link" }));
    }

    setShowForm(true);
  }

  function startEdit(asset: ClientContentAsset) {
    const assetType = getAssetMeta(asset.asset_type).value;
    const tags = getTags(asset);

    setEditingAssetId(asset.id);
    setAssetMode(
      assetType === "link"
        ? "link"
        : assetType === "text" && !asset.file_url
          ? "text"
          : "upload",
    );
    setForm({
      title: asset.title,
      description:
        asset.description ||
        (typeof asset.metadata_json?.body === "string"
          ? asset.metadata_json.body
          : ""),
      asset_type: assetType,
      file_url: asset.file_url || "",
      file_name: asset.file_name || "",
      mime_type: asset.mime_type || "",
      file_size: asset.file_size || undefined,
      property_id: asset.property_id || "",
      tags: tags.join(", "),
    });
    setSelectedFile(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    resetForm();
  }

  function handleFileSelect(file: File | null) {
    setSelectedFile(file);

    if (!file) return;

    const inferredType = inferAssetTypeFromFile(file);

    setForm((prev) => ({
      ...prev,
      asset_type: inferredType,
      file_name: file.name,
      mime_type: file.type || prev.mime_type,
      file_size: file.size,
    }));
  }

  function validateForm() {
    if (!form.title.trim()) {
      return "Title is required.";
    }

    if (assetMode === "upload" && !editingAssetId && !selectedFile) {
      return "Please choose a file before saving.";
    }

    if (assetMode === "text" && !form.description.trim()) {
      return "Text note body is required.";
    }

    if (assetMode === "link") {
      if (!form.file_url.trim()) return "URL is required.";
      if (!isValidUrl(form.file_url.trim())) {
        return "Please enter a valid http/https URL.";
      }
    }

    if (form.file_size !== undefined && form.file_size < 0) {
      return "File size cannot be negative.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      let uploaded: Awaited<ReturnType<typeof uploadClientAssetFile>> | null =
        null;
      let payloadAssetType = form.asset_type;

      if (assetMode === "upload" && selectedFile) {
        uploaded = await uploadClientAssetFile(selectedFile);
        payloadAssetType =
          uploaded.asset_type || inferAssetTypeFromFile(selectedFile);
      }

      if (assetMode === "text") {
        payloadAssetType = "text";
      }

      if (assetMode === "link") {
        payloadAssetType = "link";
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        asset_type: payloadAssetType,
        file_url:
          assetMode === "link"
            ? form.file_url.trim()
            : uploaded?.url || form.file_url.trim() || undefined,
        file_name:
          selectedFile?.name ||
          uploaded?.original_filename ||
          form.file_name.trim() ||
          uploaded?.filename,
        mime_type:
          selectedFile?.type ||
          uploaded?.mime_type ||
          form.mime_type.trim() ||
          undefined,
        file_size: uploaded?.size || form.file_size,
        property_id: form.property_id || null,
        metadata_json: {
          tags: parseTags(form.tags),
          source: "client_library",
          mode: assetMode,
          ...(assetMode === "text" ? { body: form.description.trim() } : {}),
        },
      };

      if (editingAssetId) {
        const updated = await updateContentAsset(editingAssetId, payload);
        syncAssets((prev) =>
          prev.map((asset) => (asset.id === updated.id ? updated : asset)),
        );
        setSelectedAssetId(updated.id);
        setMessage("Asset updated successfully.");
      } else {
        const created = await createContentAsset(payload);
        syncAssets((prev) => [created, ...prev]);
        setSelectedAssetId(created.id);
        setMessage("Asset added successfully.");
      }

      closeForm();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to save asset",
      );
    } finally {
      setSaving(false);
    }
  }

  function buildGeneratedPostContent(asset: ClientContentAsset) {
    const textBody =
      asset.description ||
      (typeof asset.metadata_json?.body === "string"
        ? asset.metadata_json.body
        : "");

    const fallbackCaption =
      asset.asset_type === "video"
        ? `Take a closer look at ${asset.title}. Message us for details, pricing, and site visit availability.`
        : asset.asset_type === "image"
          ? `Showcasing ${asset.title}. Message us for details, pricing, and site visit availability.`
          : `Sharing ${asset.title}. Message us for more details.`;

    const hashtags = getTags(asset)
      .map((tag) => tag.trim().replace(/^#/, ""))
      .filter(Boolean)
      .map((tag) => `#${tag}`);

    return [textBody || fallbackCaption, hashtags.join(" ")]
      .filter((part) => part.trim().length > 0)
      .join("\n\n");
  }

  function getMediaAssetIdsForGeneratedPost(asset: ClientContentAsset) {
    if (asset.asset_type === "image" || asset.asset_type === "video") {
      return [asset.id];
    }

    return [];
  }

  async function handleCreateGeneratedPost(asset: ClientContentAsset) {
    try {
      setSaving(true);
      setMessage(null);

      const createdPost = await createGeneratedPost({
        title: `Post: ${asset.title}`,
        content: buildGeneratedPostContent(asset),
        platform: postPlatform,
        status: "draft",
        property_id: asset.property_id || null,
        hashtags: getTags(asset)
          .map((tag) => tag.trim().replace(/^#/, ""))
          .filter(Boolean),
        media_asset_ids: getMediaAssetIdsForGeneratedPost(asset),
        metadata_json: {
          source: "media_library",
          source_asset_id: asset.id,
          source_asset_type: asset.asset_type,
          source_file_url: asset.file_url || null,
          source_file_name: asset.file_name || null,
        },
      });

      setMessage(
        `Draft post created: "${createdPost.title}". Open AI Studio > Generated Posts to schedule or publish.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to create draft post",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(asset: ClientContentAsset) {
    const confirmed = window.confirm(`Archive "${asset.title}"?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      setMessage(null);

      await deleteContentAsset(asset.id);

      syncAssets((prev) => {
        const next = prev.filter((item) => item.id !== asset.id);
        setSelectedAssetId(next[0]?.id || null);
        return next;
      });

      setMessage("Asset archived.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Failed to archive asset",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadAssets();
  }

  function resetSearch() {
    setSearchTerm("");
    loadAssets("");
  }

  function renderPreview(asset: ClientContentAsset, compact = false) {
    const meta = getAssetMeta(asset.asset_type);
    const Icon = meta.icon;
    const assetUrl = resolveAssetUrl(asset.file_url);
    const textBody =
      asset.description ||
      (typeof asset.metadata_json?.body === "string"
        ? asset.metadata_json.body
        : "");

    if (asset.asset_type === "image" && assetUrl) {
      return (
        <img
          src={assetUrl}
          alt={asset.title}
          className="h-full w-full object-cover"
        />
      );
    }

    if (asset.asset_type === "video" && assetUrl) {
      return compact ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: `${meta.color}12`, color: meta.color }}
        >
          <Video size={24} />
        </div>
      ) : (
        <video
          src={assetUrl}
          controls
          className="h-full w-full rounded-xl object-cover"
        />
      );
    }

    if (asset.asset_type === "text" && textBody && !compact) {
      return (
        <div
          className="h-full w-full overflow-hidden p-4 text-sm leading-relaxed"
          style={{ color: textMuted }}
        >
          {textBody}
        </div>
      );
    }

    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center"
        style={{ background: `${meta.color}12`, color: meta.color }}
      >
        <Icon size={compact ? 22 : 32} />
        <span className="text-xs font-medium">{meta.label}</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl space-y-5 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                color: "#ffffff",
              }}
            >
              <Image size={18} />
            </div>
            <div>
              <h1
                className="font-semibold"
                style={{ fontSize: "1.5rem", color: textPrimary }}
              >
                {title}
              </h1>
              <p className="mt-0.5 text-sm" style={{ color: textMuted }}>
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadAssets()}
              className="rounded-xl border p-2 transition-all hover:bg-primary/5"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
              title="Refresh assets"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={() => startCreate("upload")}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(99,102,241,0.28)",
              }}
            >
              <Plus size={14} />
              Add Asset
            </button>
          </div>
        </div>

        {message && (
          <div
            className="rounded-xl border px-4 py-3 text-sm"
            style={{
              background:
                message.includes("success") || message.includes("archived")
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(245,158,11,0.08)",
              borderColor:
                message.includes("success") || message.includes("archived")
                  ? "rgba(16,185,129,0.22)"
                  : "rgba(245,158,11,0.22)",
              color:
                message.includes("success") || message.includes("archived")
                  ? "#10b981"
                  : "#f59e0b",
            }}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className="rounded-2xl border p-4 text-left transition-all hover:border-primary/30"
            style={{
              background:
                typeFilter === "all"
                  ? "rgba(99,102,241,0.08)"
                  : cardBase.background,
              borderColor:
                typeFilter === "all"
                  ? "rgba(99,102,241,0.32)"
                  : cardBase.borderColor,
            }}
          >
            <p className="text-xs" style={{ color: textSoft }}>
              All Assets
            </p>
            <p
              className="mt-2 text-xl font-semibold"
              style={{ color: textPrimary }}
            >
              {counts.all}
            </p>
          </button>

          {assetTypeOptions.map((option) => {
            const Icon = option.icon;
            const active = typeFilter === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTypeFilter(option.value)}
                className="rounded-2xl border p-4 text-left transition-all hover:border-primary/30"
                style={{
                  background: active
                    ? `${option.color}12`
                    : cardBase.background,
                  borderColor: active
                    ? `${option.color}45`
                    : cardBase.borderColor,
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: textSoft }}>
                    {option.label}
                  </p>
                  <Icon size={14} style={{ color: option.color }} />
                </div>
                <p
                  className="mt-2 text-xl font-semibold"
                  style={{ color: option.color }}
                >
                  {counts[option.value]}
                </p>
              </button>
            );
          })}
        </div>

        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-2 rounded-2xl border p-3 sm:flex-row sm:items-center"
          style={cardBase}
        >
          <div className="flex flex-1 items-center gap-2">
            <Search size={15} style={{ color: textSoft }} />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by title, description, or file name..."
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: textPrimary }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={resetSearch}
              className="flex items-center gap-1 rounded-xl border px-4 py-2 text-sm"
              style={{ borderColor: cardBase.borderColor, color: textMuted }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
          <div className="space-y-4">
            {loading && (
              <div
                className="rounded-2xl border p-8 text-center text-sm"
                style={{ ...cardBase, color: textMuted }}
              >
                <Loader2 className="mx-auto mb-2 animate-spin" size={20} />
                Loading assets...
              </div>
            )}

            {!loading && visibleAssets.length === 0 && (
              <div
                className="rounded-2xl border p-8 text-center"
                style={cardBase}
              >
                <div
                  className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{
                    background: "rgba(99,102,241,0.10)",
                    color: "#6366f1",
                  }}
                >
                  <Image size={22} />
                </div>
                <h2
                  className="text-base font-semibold"
                  style={{ color: textPrimary }}
                >
                  No assets found
                </h2>
                <p
                  className="mx-auto mt-2 max-w-md text-sm"
                  style={{ color: textMuted }}
                >
                  Add images, PDFs, videos, notes, or links to build your
                  reusable real estate content library.
                </p>
                <button
                  type="button"
                  onClick={() => startCreate("upload")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                    color: "#ffffff",
                  }}
                >
                  <Plus size={14} />
                  Add first asset
                </button>
              </div>
            )}

            {!loading && visibleAssets.length > 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {visibleAssets.map((asset, index) => {
                  const meta = getAssetMeta(asset.asset_type);
                  const Icon = meta.icon;
                  const active = selectedAsset?.id === asset.id;

                  return (
                    <motion.button
                      key={asset.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className="overflow-hidden rounded-2xl border text-left transition-all hover:border-primary/30"
                      style={{
                        background: active
                          ? darkMode
                            ? "rgba(99,102,241,0.14)"
                            : "rgba(99,102,241,0.07)"
                          : cardBase.background,
                        borderColor: active
                          ? "rgba(99,102,241,0.35)"
                          : cardBase.borderColor,
                      }}
                    >
                      <div className="h-40 overflow-hidden" style={subtlePanel}>
                        {renderPreview(asset, true)}
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3
                              className="truncate text-sm font-semibold"
                              style={{ color: textPrimary }}
                            >
                              {asset.title}
                            </h3>
                            <p
                              className="mt-1 text-xs"
                              style={{ color: textSoft }}
                            >
                              {formatDate(asset.created_at)}
                            </p>
                          </div>

                          <span
                            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
                            style={{
                              background: `${meta.color}12`,
                              color: meta.color,
                            }}
                          >
                            <Icon size={12} />
                            {meta.value}
                          </span>
                        </div>

                        {asset.description && (
                          <p
                            className="line-clamp-2 text-xs leading-relaxed"
                            style={{ color: textMuted }}
                          >
                            {asset.description}
                          </p>
                        )}

                        <div
                          className="flex flex-wrap items-center gap-2 text-xs"
                          style={{ color: textSoft }}
                        >
                          <span>
                            {asset.file_name ||
                              (asset.asset_type === "link"
                                ? "External link"
                                : "No file")}
                          </span>
                          <span>•</span>
                          <span>{formatFileSize(asset.file_size)}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border p-5" style={cardBase}>
            {selectedAsset ? (
              <div className="space-y-5">
                <div
                  className="overflow-hidden rounded-2xl border"
                  style={subtlePanel}
                >
                  <div className="h-64">{renderPreview(selectedAsset)}</div>
                </div>

                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2
                        className="text-lg font-semibold"
                        style={{ color: textPrimary }}
                      >
                        {selectedAsset.title}
                      </h2>
                      <p className="mt-1 text-xs" style={{ color: textSoft }}>
                        {formatDate(selectedAsset.created_at)}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2 py-1 text-xs"
                      style={{
                        background: `${getAssetMeta(selectedAsset.asset_type).color}12`,
                        color: getAssetMeta(selectedAsset.asset_type).color,
                      }}
                    >
                      {selectedAsset.asset_type}
                    </span>
                  </div>

                  {selectedAsset.description && (
                    <p
                      className="mt-4 text-sm leading-relaxed"
                      style={{ color: textMuted }}
                    >
                      {selectedAsset.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border p-3" style={subtlePanel}>
                    <p style={{ color: textSoft }}>File</p>
                    <p
                      className="mt-1 truncate font-medium"
                      style={{ color: textPrimary }}
                    >
                      {selectedAsset.file_name || "No file"}
                    </p>
                  </div>
                  <div className="rounded-xl border p-3" style={subtlePanel}>
                    <p style={{ color: textSoft }}>Size</p>
                    <p
                      className="mt-1 font-medium"
                      style={{ color: textPrimary }}
                    >
                      {formatFileSize(selectedAsset.file_size)}
                    </p>
                  </div>
                </div>

                {selectedAsset.property_title && (
                  <div
                    className="rounded-xl border p-3 text-sm"
                    style={subtlePanel}
                  >
                    <p className="text-xs" style={{ color: textSoft }}>
                      Linked property
                    </p>
                    <p
                      className="mt-1 font-medium"
                      style={{ color: textPrimary }}
                    >
                      {selectedAsset.property_title}
                    </p>
                  </div>
                )}

                {getTags(selectedAsset).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTags(selectedAsset).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full px-2 py-1 text-xs"
                        style={{
                          background: darkMode
                            ? "rgba(99,102,241,0.10)"
                            : "rgba(99,102,241,0.08)",
                          color: "#6366f1",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border p-3" style={subtlePanel}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex-1">
                      <label className="text-xs" style={{ color: textSoft }}>
                        Create social draft
                      </label>
                      <select
                        value={postPlatform}
                        onChange={(event) =>
                          setPostPlatform(event.target.value as ClientGeneratedPostPlatform)
                        }
                        className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                        style={{
                          background: cardBase.background,
                          borderColor: cardBase.borderColor,
                          color: textPrimary,
                        }}
                      >
                        {socialPlatformOptions.map((platform) => (
                          <option key={platform.value} value={platform.value}>
                            {platform.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreateGeneratedPost(selectedAsset)}
                      disabled={saving}
                      className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                      style={{
                        background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                        color: "#ffffff",
                      }}
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Send size={14} />
                      )}
                      Create Draft Post
                    </button>
                  </div>
                  <p className="mt-2 text-xs" style={{ color: textMuted }}>
                    Saves this media as a draft in AI Studio &gt; Generated Posts.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedAsset.file_url && (
                    <a
                      href={
                        resolveAssetUrl(selectedAsset.file_url) ||
                        selectedAsset.file_url
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                      style={{
                        background: "rgba(6,182,212,0.12)",
                        color: "#06b6d4",
                      }}
                    >
                      <ExternalLink size={14} />
                      {selectedAsset.asset_type === "link"
                        ? "Open Link"
                        : "Open Asset"}
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => startEdit(selectedAsset)}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium"
                    style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#6366f1",
                    }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleArchive(selectedAsset)}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                    style={{
                      background: "rgba(239,68,68,0.10)",
                      color: "#ef4444",
                    }}
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <Image size={28} style={{ color: textSoft }} />
                <p className="mt-3 text-sm" style={{ color: textMuted }}>
                  Select an asset to view details.
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.52)" }}
            onClick={closeForm}
          />

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5"
            style={{
              background: darkMode ? "#0d0d28" : "#ffffff",
              borderColor: cardBase.borderColor,
            }}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: textPrimary }}
                >
                  {editingAssetId ? "Edit Asset" : "Add Asset"}
                </h2>
                <p className="mt-1 text-sm" style={{ color: textMuted }}>
                  Upload local files, save text notes, or attach external links.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl p-2"
                style={{ color: textMuted }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {creationModes.map((mode) => {
                const Icon = mode.icon;
                const active = assetMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setAssetMode(mode.value);
                      setSelectedFile(null);
                      setForm((prev) => ({
                        ...prev,
                        asset_type:
                          mode.value === "text"
                            ? "text"
                            : mode.value === "link"
                              ? "link"
                              : prev.asset_type === "link"
                                ? "image"
                                : prev.asset_type,
                        file_url: mode.value === "link" ? prev.file_url : "",
                      }));
                    }}
                    className="rounded-2xl border p-4 text-left transition-all"
                    style={{
                      background: active
                        ? "rgba(99,102,241,0.10)"
                        : subtlePanel.background,
                      borderColor: active
                        ? "rgba(99,102,241,0.36)"
                        : subtlePanel.borderColor,
                    }}
                  >
                    <Icon
                      size={18}
                      style={{ color: active ? "#6366f1" : textSoft }}
                    />
                    <p
                      className="mt-2 text-sm font-semibold"
                      style={{ color: textPrimary }}
                    >
                      {mode.label}
                    </p>
                    <p className="mt-1 text-xs" style={{ color: textMuted }}>
                      {mode.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs" style={{ color: textMuted }}>
                  Title *
                </label>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: subtlePanel.background,
                    borderColor: subtlePanel.borderColor,
                    color: textPrimary,
                  }}
                  placeholder="Luxury apartment launch creative"
                />
              </div>

              <div>
                <label className="text-xs" style={{ color: textMuted }}>
                  Linked Property
                </label>
                <select
                  value={form.property_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      property_id: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: subtlePanel.background,
                    borderColor: subtlePanel.borderColor,
                    color: textPrimary,
                  }}
                >
                  <option value="">No property link</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {assetMode === "upload" && (
              <div className="mt-4 rounded-2xl border p-4" style={subtlePanel}>
                <label className="text-xs" style={{ color: textMuted }}>
                  Upload file{" "}
                  {editingAssetId ? "(optional while editing)" : "*"}
                </label>
                <label
                  className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center transition-all hover:border-primary/40"
                  style={{
                    background: darkMode ? "rgba(99,102,241,0.06)" : "#ffffff",
                    borderColor: darkMode
                      ? "rgba(99,102,241,0.24)"
                      : "rgba(99,102,241,0.22)",
                    color: textMuted,
                  }}
                >
                  <Upload size={24} style={{ color: "#6366f1" }} />
                  <span
                    className="mt-2 text-sm font-medium"
                    style={{ color: textPrimary }}
                  >
                    Choose file
                  </span>
                  <span className="mt-1 text-xs" style={{ color: textSoft }}>
                    JPG, PNG, WEBP, PDF, MP4, MOV, WEBM, TXT, MD
                  </span>

                  <input
                    type="file"
                    accept="image/*,application/pdf,video/mp4,video/webm,video/quicktime,text/plain,.md,.txt"
                    onChange={(event) =>
                      handleFileSelect(event.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>

                <div
                  className="mt-3 rounded-xl border p-3 text-xs"
                  style={cardBase}
                >
                  {selectedFile ? (
                    <div className="space-y-1" style={{ color: textMuted }}>
                      <p>
                        <strong style={{ color: textPrimary }}>
                          Selected:
                        </strong>{" "}
                        {selectedFile.name}
                      </p>
                      <p>Size: {formatFileSize(selectedFile.size)}</p>
                      <p>
                        Type:{" "}
                        {selectedFile.type ||
                          inferAssetTypeFromFile(selectedFile)}
                      </p>
                    </div>
                  ) : form.file_name ? (
                    <p style={{ color: textMuted }}>
                      Current file:{" "}
                      <strong style={{ color: textPrimary }}>
                        {form.file_name}
                      </strong>
                    </p>
                  ) : (
                    <p style={{ color: textSoft }}>
                      Supported: JPG, PNG, WEBP, PDF, MP4, MOV, WEBM, TXT, MD.
                    </p>
                  )}
                </div>
              </div>
            )}

            {assetMode === "text" && (
              <div className="mt-4">
                <label className="text-xs" style={{ color: textMuted }}>
                  Text body *
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={7}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: subtlePanel.background,
                    borderColor: subtlePanel.borderColor,
                    color: textPrimary,
                  }}
                  placeholder="Write reusable caption, property note, campaign idea, or script..."
                />
              </div>
            )}

            {assetMode === "link" && (
              <div className="mt-4">
                <label className="text-xs" style={{ color: textMuted }}>
                  External URL *
                </label>
                <input
                  value={form.file_url}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      file_url: event.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: subtlePanel.background,
                    borderColor: subtlePanel.borderColor,
                    color: textPrimary,
                  }}
                  placeholder="https://..."
                />
              </div>
            )}

            {assetMode !== "text" && (
              <div className="mt-4">
                <label className="text-xs" style={{ color: textMuted }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                  style={{
                    background: subtlePanel.background,
                    borderColor: subtlePanel.borderColor,
                    color: textPrimary,
                  }}
                  placeholder="Optional notes about this asset..."
                />
              </div>
            )}

            <div className="mt-4">
              <label className="text-xs" style={{ color: textMuted }}>
                Tags
              </label>
              <input
                value={form.tags}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, tags: event.target.value }))
                }
                className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                style={{
                  background: subtlePanel.background,
                  borderColor: subtlePanel.borderColor,
                  color: textPrimary,
                }}
                placeholder="launch, instagram, luxury"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
                style={{ borderColor: cardBase.borderColor, color: textMuted }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-2 text-sm font-medium disabled:opacity-70"
                style={{
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  color: "#ffffff",
                }}
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving
                  ? "Saving..."
                  : editingAssetId
                    ? "Update Asset"
                    : "Save Asset"}
              </button>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
