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
  Search,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  createContentAsset,
  deleteContentAsset,
  getClientProperties,
  getMyContentAssets,
  updateContentAsset,
  uploadClientAssetFile,
  type ClientContentAsset,
  type ClientContentAssetType,
  type ClientProperty,
} from "../lib/clientApi";

interface MediaLibraryProps {
  darkMode: boolean;
  defaultFilter?: ClientContentAssetType | "all";
  title?: string;
  subtitle?: string;
}

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
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function resolveAssetUrl(url?: string | null) {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${apiOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function getTags(asset: ClientContentAsset) {
  const tags = asset.metadata_json?.tags;
  return Array.isArray(tags) ? tags.filter((tag) => typeof tag === "string") : [];
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function MediaLibrary({
  darkMode,
  defaultFilter = "all",
  title = "Media Library",
  subtitle = "Store listing media, content drafts, PDFs, and campaign links.",
}: MediaLibraryProps) {
  const [assets, setAssets] = useState<ClientContentAsset[]>([]);
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
  const [form, setForm] = useState<AssetFormState>(emptyForm);

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const subtlePanel = {
    background: darkMode ? "rgba(99,102,241,0.05)" : "#f8fafc",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  async function loadAssets() {
    try {
      setLoading(true);
      setMessage(null);
      const data = await getMyContentAssets({
        asset_type: typeFilter,
        search: searchTerm,
      });
      setAssets(data);
      setSelectedAssetId((current) => current || data[0]?.id || null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load assets");
      setAssets([]);
      setSelectedAssetId(null);
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
  }, []);

  useEffect(() => {
    loadAssets();
  }, [typeFilter]);

  const selectedAsset = useMemo(
    () => assets.find((asset) => asset.id === selectedAssetId) || assets[0],
    [assets, selectedAssetId],
  );

  const counts = useMemo(() => {
    const initial: Record<ClientContentAssetType | "all", number> = {
      all: assets.length,
      image: 0,
      video: 0,
      pdf: 0,
      text: 0,
      link: 0,
    };

    for (const asset of assets) {
      const type = assetTypeOptions.some((option) => option.value === asset.asset_type)
        ? (asset.asset_type as ClientContentAssetType)
        : "text";
      initial[type] += 1;
    }

    return initial;
  }, [assets]);

  function resetForm() {
    setForm(emptyForm);
    setSelectedFile(null);
    setEditingAssetId(null);
  }

  function startCreate() {
    resetForm();
    setShowForm(true);
  }

  function startEdit(asset: ClientContentAsset) {
    setEditingAssetId(asset.id);
    setForm({
      title: asset.title,
      description: asset.description || "",
      asset_type: getAssetMeta(asset.asset_type).value,
      file_url: asset.file_url || "",
      file_name: asset.file_name || "",
      mime_type: asset.mime_type || "",
      file_size: asset.file_size || undefined,
      property_id: asset.property_id || "",
      tags: getTags(asset).join(", "),
    });
    setSelectedFile(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    resetForm();
  }

  function handleFileSelect(file: File | null) {
    setSelectedFile(file);

    if (!file) return;

    const inferredType: ClientContentAssetType = file.type.includes("pdf")
      ? "pdf"
      : "image";

    setForm((prev) => ({
      ...prev,
      asset_type: inferredType,
      file_name: file.name,
      mime_type: file.type,
      file_size: file.size,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage("Title is required.");
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      let uploaded:
        | {
            url: string;
            filename: string;
            size: number;
          }
        | null = null;

      if (selectedFile) {
        uploaded = await uploadClientAssetFile(selectedFile);
      }

      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        asset_type: form.asset_type,
        file_url: uploaded?.url || form.file_url.trim() || undefined,
        file_name: selectedFile?.name || form.file_name.trim() || uploaded?.filename,
        mime_type: selectedFile?.type || form.mime_type.trim() || undefined,
        file_size: uploaded?.size || form.file_size,
        property_id: form.property_id || null,
        metadata_json: {
          tags: parseTags(form.tags),
          source: "client_library",
        },
      };

      if (editingAssetId) {
        const updated = await updateContentAsset(editingAssetId, payload);
        setAssets((prev) =>
          prev.map((asset) => (asset.id === updated.id ? updated : asset)),
        );
        setSelectedAssetId(updated.id);
        setMessage("Asset updated successfully.");
      } else {
        const created = await createContentAsset(payload);
        setAssets((prev) => [created, ...prev]);
        setSelectedAssetId(created.id);
        setMessage("Asset added successfully.");
      }

      closeForm();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save asset");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(asset: ClientContentAsset) {
    const confirmed = window.confirm(`Archive "${asset.title}"?`);
    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteContentAsset(asset.id);
      setAssets((prev) => prev.filter((item) => item.id !== asset.id));
      setSelectedAssetId((current) => (current === asset.id ? null : current));
      setMessage("Asset archived.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to archive asset");
    } finally {
      setSaving(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadAssets();
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
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
                style={{
                  fontSize: "1.5rem",
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              >
                {title}
              </h1>
              <p
                className="text-sm mt-0.5"
                style={{ color: darkMode ? "#64748b" : "#64748b" }}
              >
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAssets}
              className="p-2 rounded-xl border transition-all hover:bg-primary/5"
              style={{
                borderColor: cardBase.borderColor,
                color: darkMode ? "#94a3b8" : "#475569",
              }}
              title="Refresh assets"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={startCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { label: "Total Assets", value: counts.all, icon: FileText, color: "#6366f1" },
            {
              label: "Media Files",
              value: counts.image + counts.video,
              icon: Image,
              color: "#06b6d4",
            },
            {
              label: "Docs and Links",
              value: counts.pdf + counts.text + counts.link,
              icon: Link2,
              color: "#10b981",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border p-4" style={cardBase}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
                    {item.label}
                  </p>
                  <p
                    className="text-2xl font-semibold mt-1"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    {item.value}
                  </p>
                </div>
                <item.icon size={18} style={{ color: item.color }} />
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border p-4" style={cardBase}>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
              />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-full rounded-xl border pl-9 pr-3 py-2 text-sm outline-none"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
                placeholder="Search by title, description, or file name"
              />
            </form>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter("all")}
                className="px-3 py-2 rounded-xl text-xs border transition-all"
                style={{
                  background:
                    typeFilter === "all" ? "rgba(99,102,241,0.14)" : "transparent",
                  borderColor:
                    typeFilter === "all" ? "rgba(99,102,241,0.35)" : cardBase.borderColor,
                  color: typeFilter === "all" ? "#818cf8" : darkMode ? "#94a3b8" : "#475569",
                }}
              >
                All
              </button>
              {assetTypeOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setTypeFilter(option.value)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs border transition-all"
                  style={{
                    background:
                      typeFilter === option.value ? `${option.color}18` : "transparent",
                    borderColor:
                      typeFilter === option.value ? `${option.color}55` : cardBase.borderColor,
                    color: typeFilter === option.value ? option.color : darkMode ? "#94a3b8" : "#475569",
                  }}
                >
                  <option.icon size={12} />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-4">
          <div className="rounded-2xl border p-4 min-h-[520px]" style={cardBase}>
            {loading ? (
              <div className="h-80 flex items-center justify-center gap-2 text-sm" style={{ color: "#64748b" }}>
                <Loader2 size={16} className="animate-spin" />
                Loading assets...
              </div>
            ) : assets.length === 0 ? (
              <div className="h-80 flex flex-col items-center justify-center text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
                >
                  <Upload size={20} />
                </div>
                <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  No assets found
                </p>
                <p className="text-xs mt-1 max-w-sm" style={{ color: "#64748b" }}>
                  Add property images, PDFs, content drafts, or useful campaign links.
                </p>
                <button
                  type="button"
                  onClick={startCreate}
                  className="mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                  style={{ background: "#6366f1", color: "#ffffff" }}
                >
                  Add first asset
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-3">
                {assets.map((asset) => {
                  const meta = getAssetMeta(asset.asset_type);
                  const Icon = meta.icon;
                  const previewUrl =
                    meta.value === "image" ? resolveAssetUrl(asset.file_url) : null;
                  const isSelected = selectedAsset?.id === asset.id;

                  return (
                    <motion.button
                      type="button"
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className="rounded-2xl border overflow-hidden text-left transition-all"
                      style={{
                        background: isSelected
                          ? darkMode
                            ? "rgba(99,102,241,0.14)"
                            : "rgba(99,102,241,0.07)"
                          : darkMode
                            ? "rgba(2,2,15,0.35)"
                            : "#ffffff",
                        borderColor: isSelected ? "rgba(99,102,241,0.45)" : cardBase.borderColor,
                      }}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div
                        className="h-36 flex items-center justify-center overflow-hidden"
                        style={{
                          background: previewUrl
                            ? "rgba(2,2,15,0.35)"
                            : darkMode
                              ? "rgba(99,102,241,0.06)"
                              : "rgba(99,102,241,0.04)",
                        }}
                      >
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Icon size={30} style={{ color: meta.color }} />
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="text-sm font-medium line-clamp-2"
                            style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                          >
                            {asset.title}
                          </p>
                          <span
                            className="text-[11px] px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                            style={{ background: `${meta.color}18`, color: meta.color }}
                          >
                            {meta.value}
                          </span>
                        </div>
                        <p className="text-xs line-clamp-2 min-h-8" style={{ color: "#64748b" }}>
                          {asset.description || asset.file_name || "No description added"}
                        </p>
                        <div className="flex items-center justify-between text-xs" style={{ color: "#64748b" }}>
                          <span>{formatFileSize(asset.file_size)}</span>
                          <span>{asset.property_title || "General"}</span>
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border p-4 min-h-[520px]" style={cardBase}>
            {showForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                      {editingAssetId ? "Edit Asset" : "Add Asset"}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                      Upload a file or save a reusable content link.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="p-2 rounded-xl border"
                    style={{ borderColor: cardBase.borderColor, color: "#64748b" }}
                    title="Close form"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div>
                  <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Title
                  </label>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, title: event.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                    placeholder="Luxury villa walkthrough"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                      Type
                    </label>
                    <select
                      value={form.asset_type}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          asset_type: event.target.value as ClientContentAssetType,
                        }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{
                        background: darkMode ? "#0d0d28" : "#ffffff",
                        borderColor: cardBase.borderColor,
                        color: darkMode ? "#e2e8f0" : "#0f172a",
                      }}
                    >
                      {assetTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                      Property
                    </label>
                    <select
                      value={form.property_id}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, property_id: event.target.value }))
                      }
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                      style={{
                        background: darkMode ? "#0d0d28" : "#ffffff",
                        borderColor: cardBase.borderColor,
                        color: darkMode ? "#e2e8f0" : "#0f172a",
                      }}
                    >
                      <option value="">General library</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Upload
                  </label>
                  <label
                    className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-4 text-sm cursor-pointer"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.05)" : "#f8fafc",
                      borderColor: darkMode ? "rgba(99,102,241,0.22)" : "rgba(99,102,241,0.16)",
                      color: darkMode ? "#94a3b8" : "#64748b",
                    }}
                  >
                    <Upload size={15} />
                    {selectedFile ? selectedFile.name : "Choose image or PDF"}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf"
                      className="hidden"
                      onChange={(event) => handleFileSelect(event.target.files?.[0] || null)}
                    />
                  </label>
                  <p className="text-[11px] mt-1" style={{ color: "#64748b" }}>
                    Video assets can be saved with an external URL.
                  </p>
                </div>

                <div>
                  <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    File or Link URL
                  </label>
                  <input
                    value={form.file_url}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, file_url: event.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm min-h-24 resize-none outline-none"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                    placeholder="Short usage notes, campaign angle, or asset context"
                  />
                </div>

                <div>
                  <label className="text-xs" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                    Tags
                  </label>
                  <input
                    value={form.tags}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, tags: event.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                    placeholder="luxury, instagram, brochure"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                    color: "#ffffff",
                  }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {saving ? "Saving..." : editingAssetId ? "Save Changes" : "Add Asset"}
                </button>
              </form>
            ) : selectedAsset ? (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                      {selectedAsset.title}
                    </h2>
                    <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                      Added {formatDate(selectedAsset.created_at)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: `${getAssetMeta(selectedAsset.asset_type).color}18`,
                      color: getAssetMeta(selectedAsset.asset_type).color,
                    }}
                  >
                    {getAssetMeta(selectedAsset.asset_type).value}
                  </span>
                </div>

                <div className="rounded-xl border p-4" style={subtlePanel}>
                  <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>
                    Description
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                    {selectedAsset.description || "No description added."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "File", value: selectedAsset.file_name || "Not attached" },
                    { label: "Size", value: formatFileSize(selectedAsset.file_size) },
                    { label: "Property", value: selectedAsset.property_title || "General library" },
                    { label: "Uploaded By", value: selectedAsset.uploaded_by_name || "Client user" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border p-3" style={subtlePanel}>
                      <p className="text-[11px]" style={{ color: "#64748b" }}>
                        {item.label}
                      </p>
                      <p className="text-sm font-medium mt-1 line-clamp-2" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                {getTags(selectedAsset).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getTags(selectedAsset).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{
                          background: darkMode ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                          color: darkMode ? "#a5b4fc" : "#4f46e5",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {selectedAsset.file_url && (
                  <a
                    href={resolveAssetUrl(selectedAsset.file_url) || selectedAsset.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium"
                    style={{
                      borderColor: cardBase.borderColor,
                      color: darkMode ? "#a5b4fc" : "#4f46e5",
                    }}
                  >
                    <ExternalLink size={14} />
                    Open Asset
                  </a>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startEdit(selectedAsset)}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium"
                    style={{ background: "#6366f1", color: "#ffffff" }}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(selectedAsset)}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium disabled:opacity-60"
                    style={{
                      borderColor: "rgba(239,68,68,0.25)",
                      color: "#ef4444",
                    }}
                  >
                    <Archive size={14} />
                    Archive
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[420px] flex items-center justify-center text-center">
                <div>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
                  >
                    <FileText size={20} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    Select an asset
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#64748b" }}>
                    Details, links, and actions will appear here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
