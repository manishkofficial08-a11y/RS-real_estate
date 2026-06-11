import { useState } from 'react';
import { supportTickets } from '@/data/mock';
import { Eye, CheckCircle2, UserPlus } from 'lucide-react';

const summaryCards = [
  { label: 'Open Tickets', value: supportTickets.filter(t => t.status === 'Open').length, color: '#FF8A5C' },
  { label: 'Resolved Today', value: 1, color: '#4ADE80' },
  { label: 'Pending', value: supportTickets.filter(t => t.status === 'Pending').length, color: '#6B8AFF' },
  { label: 'High Priority', value: supportTickets.filter(t => t.priority === 'High').length, color: '#FF5A5A' },
];

export default function Support() {
  const [tickets, setTickets] = useState(supportTickets);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const teamMembers = ['Alex Kim', 'Sam Lee', 'Jordan Patel', 'Morgan Chen'];

  const handleResolve = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'Resolved' as const } : t));
  };

  const handleAssign = (ticketId: string, member: string) => {
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, assignedTo: member } : t));
    setAssigningId(null);
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
          Support
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Manage support tickets and customer issues</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="surface-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: card.color }} />
              <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{card.label}</span>
            </div>
            <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Ticket ID</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Issue</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Priority</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Assigned To</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket, idx) => (
              <tr
                key={ticket.id}
                className="transition-colors duration-200"
                style={{ borderBottom: idx < tickets.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="px-5 py-4">
                  <span className="text-sm font-mono" style={{ color: '#6B8AFF' }}>{ticket.ticketId}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#F0EDE6' }}>{ticket.company}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{ticket.issue}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: ticket.priority === 'High' ? '#FF5A5A' : ticket.priority === 'Medium' ? '#FF8A5C' : '#6B8AFF',
                      }}
                    />
                    <span className="text-xs" style={{ color: '#8A8A93' }}>{ticket.priority}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    ticket.status === 'Open' ? 'badge-blue' :
                    ticket.status === 'Resolved' ? 'badge-green' : 'badge-neutral'
                  }`}>
                    {ticket.status}
                  </span>
                </td>
                <td className="px-5 py-4 relative">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: '#8A8A93' }}>{ticket.assignedTo}</span>
                    <button
                      className="p-1 rounded transition-colors"
                      style={{ color: '#55555C' }}
                      onClick={() => setAssigningId(assigningId === ticket.id ? null : ticket.id)}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#55555C'; }}
                    >
                      <UserPlus size={13} />
                    </button>
                  </div>
                  {assigningId === ticket.id && (
                    <div
                      className="absolute top-full left-4 z-10 mt-1 py-1 rounded-lg min-w-[140px]"
                      style={{ background: '#0F0F14', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    >
                      {teamMembers.map(m => (
                        <button
                          key={m}
                          className="w-full text-left px-3 py-2 text-xs transition-colors"
                          style={{ color: '#F0EDE6' }}
                          onClick={() => handleAssign(ticket.id, m)}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="View"
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}>
                      <Eye size={14} />
                    </button>
                    {ticket.status !== 'Resolved' && (
                      <button
                        className="p-1.5 rounded-md transition-colors"
                        style={{ color: '#8A8A93' }}
                        title="Resolve"
                        onClick={() => handleResolve(ticket.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#4ADE80'; e.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8A93'; e.currentTarget.style.background = 'transparent'; }}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>AI Growth OS v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
