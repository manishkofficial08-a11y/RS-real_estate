import { useEffect, useMemo, useState } from "react";
import {
  Bath,
  BedDouble,
  Building2,
  Home,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Ruler,
  Search,
} from "lucide-react";
import { motion } from "motion/react";
import {
  createClientProperty,
  getClientProperties,
  type ClientProperty,
  type CreateClientPropertyPayload,
} from "../lib/clientApi";

interface PropertiesProps {
  darkMode: boolean;
}

const demoProperties: ClientProperty[] = [
  {
    id: "demo-1",
    tenant_id: "demo",
    title: "Luxury 3BHK Apartment",
    description: "Premium apartment with balcony, parking and modern amenities.",
    price: 12500000,
    location: "Gurgaon Sector 57",
    property_type: "apartment",
    status: "available",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 1850,
    images: [],
    created_by: "demo",
  },
  {
    id: "demo-2",
    tenant_id: "demo",
    title: "Commercial Office Space",
    description: "Ready-to-move office space near metro and business hub.",
    price: 8500000,
    location: "Noida Sector 62",
    property_type: "commercial",
    status: "available",
    bedrooms: 0,
    bathrooms: 2,
    area_sqft: 1200,
    images: [],
    created_by: "demo",
  },
];

function formatPrice(price: number) {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${new Intl.NumberFormat("en-IN").format(price)}`;
}

function statusColor(status: string) {
  if (status === "available") return "#10b981";
  if (status === "sold") return "#ef4444";
  if (status === "rented") return "#6366f1";
  return "#94a3b8";
}

function typeLabel(type: string) {
  return type.replace(/[_-]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function Properties({ darkMode }: PropertiesProps) {
  const [properties, setProperties] = useState<ClientProperty[]>(demoProperties);
  const [selectedProperty, setSelectedProperty] = useState<ClientProperty>(demoProperties[0]);
  const [searchQ, setSearchQ] = useState("");
  const [activeStatus, setActiveStatus] = useState("All");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiMessage, setApiMessage] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [form, setForm] = useState<CreateClientPropertyPayload>({
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
  });

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  async function loadProperties() {
    try {
      setLoading(true);
      setApiMessage(null);

      const data = await getClientProperties();

      if (data.length > 0) {
        setProperties(data);
        setSelectedProperty(data[0]);
      } else {
        setProperties(demoProperties);
        setSelectedProperty(demoProperties[0]);
        setApiMessage("No backend properties yet. Showing demo properties.");
      }
    } catch (err) {
      setProperties(demoProperties);
      setSelectedProperty(demoProperties[0]);
      setApiMessage(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleCreateProperty() {
    if (!form.title.trim() || !form.location.trim() || form.price <= 0) {
      setApiMessage("Title, location and valid price are required.");
      return;
    }

    try {
      setSaving(true);
      setApiMessage(null);

      const created = await createClientProperty({
        ...form,
        price: Number(form.price) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqft: Number(form.area_sqft) || 0,
        images: [],
      });

      const realExisting = properties.filter((property) => !property.id.startsWith("demo-"));
      const updated = [created, ...realExisting];

      setProperties(updated);
      setSelectedProperty(created);
      setShowCreateForm(false);
      setForm({
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
      });
    } catch (err) {
      setApiMessage(err instanceof Error ? err.message : "Failed to create property");
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
    const realProperties = properties.filter((property) => !property.id.startsWith("demo-"));
    const source = realProperties.length > 0 ? realProperties : properties;

    return {
      total: source.length,
      available: source.filter((property) => property.status === "available").length,
      sold: source.filter((property) => property.status === "sold").length,
      totalValue: source.reduce((sum, property) => sum + property.price, 0),
    };
  }, [properties]);

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="p-6 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Properties
            </h1>
            <p className="text-sm mt-0.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              {loading
                ? "Loading backend properties..."
                : `${stats.total} properties · ${formatPrice(stats.totalValue)} portfolio value`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadProperties}
              className="p-2 rounded-xl border transition-all hover:bg-primary/5"
              style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>

            <button
              onClick={() => setShowCreateForm((value) => !value)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
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
              background: darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
              borderColor: "rgba(245,158,11,0.25)",
              color: "#f59e0b",
            }}
          >
            {apiMessage}
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Properties", value: stats.total, color: "#6366f1", icon: Building2 },
            { label: "Available", value: stats.available, color: "#10b981", icon: Home },
            { label: "Sold", value: stats.sold, color: "#ef4444", icon: IndianRupee },
            { label: "Portfolio Value", value: formatPrice(stats.totalValue), color: "#f59e0b", icon: IndianRupee },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border p-4" style={cardBase}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs mb-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                    {item.label}
                  </p>
                  <p className="font-semibold" style={{ fontSize: "1.25rem", color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                    {item.value}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}18` }}>
                  <item.icon size={18} style={{ color: item.color }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {showCreateForm && (
          <div className="rounded-2xl border p-4 mb-5" style={cardBase}>
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="Property title"
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
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
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
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
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <select
                value={form.property_type}
                onChange={(event) => setForm({ ...form, property_type: event.target.value })}
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "#0d0d28" : "#ffffff",
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
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
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
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
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
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                  borderColor: cardBase.borderColor,
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
              />

              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="rounded-xl border px-3 py-2 text-sm"
                style={{
                  background: darkMode ? "#0d0d28" : "#ffffff",
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
              rows={3}
              style={{
                background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                borderColor: cardBase.borderColor,
                color: darkMode ? "#e2e8f0" : "#0f172a",
              }}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded-xl border text-sm"
                style={{ borderColor: cardBase.borderColor, color: darkMode ? "#94a3b8" : "#475569" }}
              >
                Cancel
              </button>

              <button
                onClick={handleCreateProperty}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                style={{ background: "#6366f1", color: "#ffffff" }}
              >
                {saving ? "Saving..." : "Save Property"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex gap-4 px-6 pb-6 min-h-0">
        <div className="flex flex-col w-96 flex-shrink-0 min-h-0">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}
              />

              <input
                value={searchQ}
                onChange={(event) => setSearchQ(event.target.value)}
                placeholder="Search properties..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm"
                style={{
                  background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
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
                background: darkMode ? "#0d0d28" : "#ffffff",
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
            {filteredProperties.map((property) => (
              <motion.button
                key={property.id}
                onClick={() => setSelectedProperty(property)}
                className="w-full text-left rounded-2xl border p-4 transition-all"
                style={{
                  background:
                    selectedProperty.id === property.id
                      ? darkMode
                        ? "rgba(99,102,241,0.12)"
                        : "rgba(99,102,241,0.06)"
                      : cardBase.background,
                  borderColor:
                    selectedProperty.id === property.id
                      ? "rgba(99,102,241,0.35)"
                      : cardBase.borderColor,
                }}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.18), rgba(139,92,246,0.12))" }}
                  >
                    <Building2 size={20} style={{ color: "#818cf8" }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                        {property.title}
                      </h3>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full capitalize"
                        style={{ background: `${statusColor(property.status)}15`, color: statusColor(property.status) }}
                      >
                        {property.status}
                      </span>
                    </div>

                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                      <MapPin size={11} /> {property.location}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
                      <span className="flex items-center gap-1"><BedDouble size={12} /> {property.bedrooms}</span>
                      <span className="flex items-center gap-1"><Bath size={12} /> {property.bathrooms}</span>
                      <span className="flex items-center gap-1"><Ruler size={12} /> {property.area_sqft || 0} sqft</span>
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
          <div
            className="h-56 rounded-2xl mb-5 flex items-center justify-center overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.24), rgba(139,92,246,0.16), rgba(6,182,212,0.12))",
            }}
          >
            <Building2 size={64} style={{ color: darkMode ? "#818cf8" : "#6366f1" }} />
          </div>

          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                {selectedProperty.title}
              </h2>

              <p className="text-sm mt-1 flex items-center gap-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
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
              <div key={item.label} className="rounded-xl border p-3" style={cardBase}>
                <item.icon size={15} style={{ color: "#818cf8" }} />
                <p className="text-xs mt-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                  {item.label}
                </p>
                <p className="text-sm font-semibold mt-1" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div
            className="rounded-2xl border p-4"
            style={{
              background: darkMode ? "rgba(99,102,241,0.04)" : "rgba(99,102,241,0.03)",
              borderColor: cardBase.borderColor,
            }}
          >
            <h3 className="text-sm font-semibold mb-2" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              Description
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
              {selectedProperty.description || "No description added yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}