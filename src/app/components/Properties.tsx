import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Edit3,
  Home,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Ruler,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import {
  createClientProperty,
  getClientProperties,
  updateClientProperty,
  type ClientProperty,
  type CreateClientPropertyPayload,
} from "../lib/clientApi";

interface PropertiesProps {
  darkMode: boolean;
}

type PropertyForm = CreateClientPropertyPayload;

const emptyForm: PropertyForm = {
  title: "",
  description: "",
  price: 0,
  location: "",
  property_type: "apartment",
  status: "available",
  bedrooms: 0,
  bathrooms: 0,
  area_sqft: 0,
  images: [],
};

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
}

function statusColor(status: string) {
  if (status === "available") return "#10b981";
  if (status === "sold") return "#ef4444";
  if (status === "rented") return "#1D4ED8";
  return "#94a3b8";
}

function typeLabel(type: string) {
  return type.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizePropertyForm(form: PropertyForm): CreateClientPropertyPayload {
  return {
    title: form.title.trim(),
    description: form.description?.trim() || "",
    price: Number(form.price) || 0,
    location: form.location.trim(),
    property_type: form.property_type,
    status: form.status,
    bedrooms: Number(form.bedrooms) || 0,
    bathrooms: Number(form.bathrooms) || 0,
    area_sqft: Number(form.area_sqft) || 0,
    images: form.images || [],
  };
}

export function Properties({ darkMode }: PropertiesProps) {
  const [properties, setProperties] = useState<ClientProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<ClientProperty | null>(null);
  const [searchQ, setSearchQ] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyForm>(emptyForm);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  async function loadProperties() {
    try {
      setLoading(true);
      setApiMessage(null);

      const data = await getClientProperties();

      setProperties(data);
      setSelectedProperty((current) => {
        if (!data.length) return null;
        if (!current) return data[0];
        return data.find((property) => property.id === current.id) || data[0];
      });
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Failed to load properties");
      setProperties([]);
      setSelectedProperty(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  function openCreateForm() {
    setEditingPropertyId(null);
    setForm(emptyForm);
    setApiMessage(null);
    setShowForm(true);
  }

  function openEditForm(property: ClientProperty) {
    setEditingPropertyId(property.id);
    setForm({
      title: property.title || "",
      description: property.description || "",
      price: property.price || 0,
      location: property.location || "",
      property_type: property.property_type || "apartment",
      status: property.status || "available",
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      area_sqft: property.area_sqft || 0,
      images: property.images || [],
    });
    setApiMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;
    setShowForm(false);
    setEditingPropertyId(null);
    setForm(emptyForm);
  }

  async function handleSaveProperty() {
    const payload = normalizePropertyForm(form);

    if (!payload.title || !payload.location || payload.price <= 0) {
      setApiMessage("Title, location and valid price are required.");
      return;
    }

    try {
      setSaving(true);
      setApiMessage(null);

      if (editingPropertyId) {
        const updated = await updateClientProperty(editingPropertyId, payload);

        setProperties((prev) =>
          prev.map((property) => (property.id === editingPropertyId ? updated : property))
        );

        setSelectedProperty(updated);
        setApiMessage("Property updated successfully.");
      } else {
        const created = await createClientProperty(payload);

        setProperties((prev) => [created, ...prev]);
        setSelectedProperty(created);
        setApiMessage("Property created successfully.");
      }

      setShowForm(false);
      setEditingPropertyId(null);
      setForm(emptyForm);
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Failed to save property");
    } finally {
      setSaving(false);
    }
  }

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const query = searchQ.toLowerCase();

      const matchesSearch =
        property.title.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        property.property_type.toLowerCase().includes(query);

      const matchesStatus = activeStatus === "All" || property.status === activeStatus;

      return matchesSearch && matchesStatus;
    });
  }, [activeStatus, properties, searchQ]);

  const stats = useMemo(() => {
    return {
      total: properties.length,
      available: properties.filter((property) => property.status === "available").length,
      sold: properties.filter((property) => property.status === "sold").length,
      rented: properties.filter((property) => property.status === "rented").length,
      totalValue: properties.reduce((sum, property) => sum + Number(property.price || 0), 0),
    };
  }, [properties]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            >
              Properties
            </h1>

            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              {loading
                ? "Loading backend properties..."
                : `${stats.total} properties · ${formatPrice(stats.totalValue)} portfolio value`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProperties}
              className="p-2 rounded-xl border transition-all hover:bg-primary/5"
              style={{
                borderColor: cardBase.borderColor,
                color: darkMode ? "#94a3b8" : "#475569",
              }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>

            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(29,78,216,0.3)",
              }}
            >
              <Plus size={14} /> Add Property
            </button>
          </div>
        </div>

        {apiMessage && (
          <div
            className="mb-4 rounded-xl border px-4 py-3 text-sm"
            style={{
              background: apiMessage.toLowerCase().includes("success")
                ? darkMode
                  ? "rgba(16,185,129,0.08)"
                  : "rgba(16,185,129,0.06)"
                : darkMode
                  ? "rgba(245,158,11,0.08)"
                  : "rgba(245,158,11,0.06)",
              borderColor: apiMessage.toLowerCase().includes("success")
                ? "rgba(16,185,129,0.25)"
                : "rgba(245,158,11,0.25)",
              color: apiMessage.toLowerCase().includes("success") ? "#10b981" : "#f59e0b",
            }}
          >
            {apiMessage}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Properties", value: stats.total, color: "#1D4ED8", icon: Building2 },
            { label: "Available", value: stats.available, color: "#10b981", icon: Home },
            { label: "Sold", value: stats.sold, color: "#ef4444", icon: IndianRupee },
            { label: "Portfolio Value", value: formatPrice(stats.totalValue), color: "#f59e0b", icon: IndianRupee },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border p-4" style={cardBase}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs mb-2" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                    {item.label}
                  </p>

                  <p
                    className="font-semibold"
                    style={{
                      fontSize: "1.25rem",
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                  >
                    {item.value}
                  </p>
                </div>

                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${item.color}18` }}
                >
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex gap-4 px-6 pb-6 min-h-0">
        <div className="flex flex-col w-96 flex-shrink-0 min-h-0">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
              />

              <input
                value={searchQ}
                onChange={(event) => setSearchQ(event.target.value)}
                placeholder="Search properties..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />
            </div>

            <select
              value={activeStatus}
              onChange={(event) => setActiveStatus(event.target.value)}
              className="rounded-xl border px-3 text-sm"
              style={{
                background: darkMode ? "#0F172A" : "#ffffff",
                borderColor: cardBase.borderColor,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            >
              <option value="All">All</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="rented">Rented</option>
            </select>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredProperties.length === 0 && (
              <div
                className="rounded-2xl border p-5 text-sm"
                style={{
                  background: cardBase.background,
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#94a3b8" : "#64748b",
                }}
              >
                No properties found. Add your first property.
              </div>
            )}

            {filteredProperties.map((property) => (
              <motion.button
                key={property.id}
                onClick={() => setSelectedProperty(property)}
                className="w-full text-left rounded-2xl border p-4 transition-all"
                style={{
                  background:
                    selectedProperty?.id === property.id
                      ? darkMode
                        ? "rgba(29,78,216,0.12)"
                        : "rgba(29,78,216,0.06)"
                      : cardBase.background,
                  borderColor:
                    selectedProperty?.id === property.id
                      ? "rgba(29,78,216,0.35)"
                      : cardBase.borderColor,
                }}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(29,78,216,0.18), rgba(37,99,235,0.12))",
                    }}
                  >
                    <Building2 size={20} style={{ color: "#60A5FA" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className="text-sm font-semibold truncate"
                        style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                      >
                        {property.title}
                      </h3>

                      <span
                        className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: `${statusColor(property.status)}15`,
                          color: statusColor(property.status),
                        }}
                      >
                        {property.status}
                      </span>
                    </div>

                    <p
                      className="text-xs mt-1 flex items-center gap-1"
                      style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                    >
                      <MapPin size={11} /> {property.location}
                    </p>

                    <div
                      className="flex items-center gap-3 mt-2 text-xs"
                      style={{ color: darkMode ? "#64748b" : "#64748b" }}
                    >
                      <span className="flex items-center gap-1">
                        <BedDouble size={12} /> {property.bedrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bath size={12} /> {property.bathrooms}
                      </span>
                      <span className="flex items-center gap-1">
                        <Ruler size={12} /> {property.area_sqft || 0} sqft
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold" style={{ color: "#10b981" }}>
                      {formatPrice(property.price)}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto rounded-2xl border p-5" style={cardBase}>
          {selectedProperty ? (
            <>
              <div
                className="h-56 rounded-2xl mb-5 flex items-center justify-center overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(29,78,216,0.24), rgba(37,99,235,0.16), rgba(6,182,212,0.12))",
                }}
              >
                <Building2 size={64} style={{ color: darkMode ? "#60A5FA" : "#1D4ED8" }} />
              </div>

              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <h2
                    className="text-xl font-semibold"
                    style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                  >
                    {selectedProperty.title}
                  </h2>

                  <p
                    className="text-sm mt-1 flex items-center gap-1"
                    style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}
                  >
                    <MapPin size={13} /> {selectedProperty.location}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold" style={{ color: "#10b981" }}>
                    {formatPrice(selectedProperty.price)}
                  </p>

                  <p className="text-xs capitalize" style={{ color: statusColor(selectedProperty.status) }}>
                    {selectedProperty.status}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  { label: "Type", value: typeLabel(selectedProperty.property_type), icon: Home },
                  { label: "Bedrooms", value: selectedProperty.bedrooms, icon: BedDouble },
                  { label: "Bathrooms", value: selectedProperty.bathrooms, icon: Bath },
                  { label: "Area", value: `${selectedProperty.area_sqft || 0} sqft`, icon: Ruler },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl border p-3"
                    style={{
                      borderColor: cardBase.borderColor,
                      background: darkMode ? "rgba(29,78,216,0.04)" : "rgba(29,78,216,0.03)",
                    }}
                  >
                    <item.icon size={15} style={{ color: "#60A5FA" }} />

                    <p className="text-xs mt-2" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                      {item.label}
                    </p>

                    <p
                      className="text-sm font-semibold mt-0.5"
                      style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl border p-4 mb-5"
                style={{
                  borderColor: cardBase.borderColor,
                  background: darkMode ? "rgba(29,78,216,0.04)" : "rgba(29,78,216,0.03)",
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                >
                  Description
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#64748b" }}>
                  {selectedProperty.description || "No description added yet."}
                </p>
              </div>

              <button
                onClick={() => openEditForm(selectedProperty)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  color: "#ffffff",
                }}
              >
                <Edit3 size={14} /> Edit Property
              </button>
            </>
          ) : (
            <div
              className="h-full flex items-center justify-center text-sm"
              style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
            >
              No property selected.
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.45)" }}
            onClick={closeForm}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-3xl rounded-2xl border p-5"
            style={{
              background: darkMode ? "#0F172A" : "#ffffff",
              borderColor: cardBase.borderColor,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}
                >
                  {editingPropertyId ? "Edit Property" : "Add Property"}
                </h2>

                <p className="text-xs mt-1" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
                  {editingPropertyId
                    ? "Update this property directly in backend."
                    : "Create a new property in backend inventory."}
                </p>
              </div>

              <button
                onClick={closeForm}
                className="p-2 rounded-xl"
                style={{ color: darkMode ? "#94a3b8" : "#64748b" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Property title"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <input
                value={form.location}
                onChange={(event) => setForm({ ...form, location: event.target.value })}
                placeholder="Location"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <input
                type="number"
                value={form.price || ""}
                onChange={(event) => setForm({ ...form, price: Number(event.target.value) })}
                placeholder="Price"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <select
                value={form.property_type}
                onChange={(event) => setForm({ ...form, property_type: event.target.value })}
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "#0F172A" : "#ffffff",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              >
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="villa">Villa</option>
                <option value="plot">Plot</option>
                <option value="commercial">Commercial</option>
              </select>

              <input
                type="number"
                value={form.bedrooms || ""}
                onChange={(event) => setForm({ ...form, bedrooms: Number(event.target.value) })}
                placeholder="Bedrooms"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <input
                type="number"
                value={form.bathrooms || ""}
                onChange={(event) => setForm({ ...form, bathrooms: Number(event.target.value) })}
                placeholder="Bathrooms"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <input
                type="number"
                value={form.area_sqft || ""}
                onChange={(event) => setForm({ ...form, area_sqft: Number(event.target.value) })}
                placeholder="Area sqft"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "#0F172A" : "#ffffff",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              >
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>

            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Description"
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
              rows={4}
              style={{
                background: darkMode ? "rgba(29,78,216,0.06)" : "#f8fafc",
                borderColor: cardBase.borderColor,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            />

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={closeForm}
                disabled={saving}
                className="px-4 py-2 rounded-xl border text-sm"
                style={{
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#94a3b8" : "#475569",
                }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveProperty}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  color: "#ffffff",
                }}
              >
                {saving ? "Saving..." : editingPropertyId ? "Update Property" : "Save Property"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}