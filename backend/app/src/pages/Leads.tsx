import { useState } from 'react';
import { leads } from '@/data/mock';
import type { Lead } from '@/data/mock';
import { GripVertical, Mail, Phone, DollarSign, Calendar } from 'lucide-react';

const columns: { key: Lead['status']; label: string }[] = [
  { key: 'New Lead', label: 'New Lead' },
  { key: 'Contacted', label: 'Contacted' },
  { key: 'Demo Scheduled', label: 'Demo Scheduled' },
  { key: 'Proposal Sent', label: 'Proposal Sent' },
  { key: 'Negotiation', label: 'Negotiation' },
  { key: 'Won', label: 'Won' },
  { key: 'Lost', label: 'Lost' },
];

export default function Leads() {
  const [leadList, setLeadList] = useState<Lead[]>(leads);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDrop = (status: Lead['status']) => {
    if (!draggedId) return;
    setLeadList(prev => prev.map(l => l.id === draggedId ? { ...l, status } : l));
    setDraggedId(null);
  };

  const columnColors: Record<string, string> = {
    'New Lead': '#6B8AFF',
    'Contacted': '#8A8A93',
    'Demo Scheduled': '#6B8AFF',
    'Proposal Sent': '#FF8A5C',
    'Negotiation': '#FF8A5C',
    'Won': '#4ADE80',
    'Lost': '#FF5A5A',
  };

  return (
    <div className="p-8 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Leads Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Drag and drop to move leads through your pipeline</p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-4 h-full" style={{ minWidth: columns.length * 296 }}>
          {columns.map((col) => {
            const colLeads = leadList.filter(l => l.status === col.key);
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
                {/* Column Header */}
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

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {colLeads.map((lead) => (
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
                        <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{lead.companyName}</span>
                        <GripVertical size={14} style={{ color: '#55555C' }} />
                      </div>
                      <p className="text-xs mb-3" style={{ color: '#8A8A93' }}>{lead.contactPerson}</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Mail size={11} style={{ color: '#55555C' }} />
                          <span className="text-xs truncate" style={{ color: '#55555C' }}>{lead.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone size={11} style={{ color: '#55555C' }} />
                          <span className="text-xs" style={{ color: '#55555C' }}>{lead.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign size={11} style={{ color: '#4ADE80' }} />
                          <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>{lead.expectedRevenue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={11} style={{ color: '#FF8A5C' }} />
                          <span className="text-xs" style={{ color: '#FF8A5C' }}>{lead.nextFollowUp}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
