import { useEffect, useMemo, useState } from 'react';
import { getAdminLeads, type AdminLead } from '@/lib/adminApi';
import { GripVertical, Mail, Phone, Target, FileText, RefreshCw } from 'lucide-react';

const columns = [
  { key: 'new', label: 'New Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

const columnColors: Record<string, string> = {
  new: '#6B8AFF',
  contacted: '#8A8A93',
  qualified: '#FF8A5C',
  won: '#4ADE80',
  lost: '#FF5A5A',
};

function formatSource(source: string) {
  return source
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ');
}

export default function Leads() {
  const [leads, setLeads] = useState<AdminLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadLeads() {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminLeads();
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  const groupedLeads = useMemo(() => {
    return columns.reduce<Record<string, AdminLead[]>>((acc, column) => {
      acc[column.key] = leads.filter((lead) => lead.status === column.key);
      return acc;
    }, {});
  }, [leads]);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDrop = (status: string) => {
    if (!draggedId) return;

    setLeads((prev) =>
      prev.map((lead) => lead.id === draggedId ? { ...lead, status } : lead)
    );

    setDraggedId(null);
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Leads Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>
            Real leads from backend. Drag/drop is local preview for now.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="p-2.5 rounded-lg transition-colors"
          style={{
            color: '#8A8A93',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{
            color: '#FF8A5C',
            background: 'rgba(255, 138, 92, 0.08)',
            border: '1px solid rgba(255, 138, 92, 0.18)',
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="surface-card flex flex-1 items-center justify-center text-sm" style={{ color: '#8A8A93' }}>
          Loading leads from backend...
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 h-full" style={{ minWidth: columns.length * 296 }}>
            {columns.map((col) => {
              const colLeads = groupedLeads[col.key] || [];

              return (
                <div
                  key={col.key}
                  className="flex flex-col h-full"
                  style={{
                    width: 280,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 12,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(col.key)}
                >
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: columnColors[col.key] }} />
                      <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{col.label}</span>
                    </div>

                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255, 255, 255, 0.06)', color: '#8A8A93' }}
                    >
                      {colLeads.length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colLeads.length === 0 ? (
                      <div className="rounded-xl p-4 text-xs" style={{ color: '#55555C', background: 'rgba(255,255,255,0.03)' }}>
                        No leads
                      </div>
                    ) : (
                      colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={() => handleDragStart(lead.id)}
                          className="p-4 rounded-xl cursor-move transition-all duration-200"
                          style={{
                            background: 'rgba(255, 255, 255, 0.04)',
                            borderLeft: `3px solid ${columnColors[col.key]}`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
                            e.currentTarget.style.transform = 'rotate(0.5deg)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'rotate(0deg)';
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{lead.name}</span>
                            <GripVertical size={14} style={{ color: '#55555C' }} />
                          </div>

                          <p className="text-xs mb-3" style={{ color: '#8A8A93' }}>
                            {lead.company || 'Unknown Company'}
                          </p>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <Mail size={11} style={{ color: '#55555C' }} />
                              <span className="text-xs truncate" style={{ color: '#55555C' }}>{lead.email || 'No email'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Phone size={11} style={{ color: '#55555C' }} />
                              <span className="text-xs" style={{ color: '#55555C' }}>{lead.phone || 'No phone'}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <Target size={11} style={{ color: '#4ADE80' }} />
                              <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>
                                Score: {lead.score}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <FileText size={11} style={{ color: '#FF8A5C' }} />
                              <span className="text-xs truncate" style={{ color: '#FF8A5C' }}>
                                {formatSource(lead.source)}
                              </span>
                            </div>

                            {lead.notes && (
                              <p className="pt-2 text-xs leading-relaxed" style={{ color: '#8A8A93' }}>
                                {lead.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${leads.length} real leads`}
        </span>
      </div>
    </div>
  );
}