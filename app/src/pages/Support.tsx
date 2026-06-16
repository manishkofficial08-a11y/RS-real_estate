import { useState } from 'react';
import { supportTickets } from '@/data/mock';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  Inbox,
  LifeBuoy,
  MessageCircle,
  MoreHorizontal,
  Search,
  ShieldAlert,
  UserPlus,
  Users,
} from 'lucide-react';

const teamMembers = ['Alex Kim', 'Sam Lee', 'Jordan Patel', 'Morgan Chen'];

const getPriorityColor = (priority: string) => {
  if (priority === 'High') return '#FF5A5A';
  if (priority === 'Medium') return '#FF8A5C';
  return '#6B8AFF';
};

const getStatusBadge = (status: string) => {
  if (status === 'Open') return 'badge-blue';
  if (status === 'Resolved') return 'badge-green';
  return 'badge-neutral';
};

export default function Support() {
  const [tickets, setTickets] = useState(supportTickets);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const openTickets = tickets.filter((ticket) => ticket.status === 'Open').length;
  const pendingTickets = tickets.filter((ticket) => ticket.status === 'Pending').length;
  const highPriorityTickets = tickets.filter((ticket) => ticket.priority === 'High').length;
  const resolvedTickets = tickets.filter((ticket) => ticket.status === 'Resolved').length;

  const summaryCards = [
    {
      label: 'Open Tickets',
      value: openTickets,
      sub: 'Needs first response',
      icon: Inbox,
      color: '#FF8A5C',
    },
    {
      label: 'Pending',
      value: pendingTickets,
      sub: 'Waiting on follow-up',
      icon: Clock3,
      color: '#6B8AFF',
    },
    {
      label: 'High Priority',
      value: highPriorityTickets,
      sub: 'Founder attention needed',
      icon: ShieldAlert,
      color: '#FF5A5A',
    },
    {
      label: 'Resolved',
      value: resolvedTickets,
      sub: 'Closed in current queue',
      icon: CheckCircle2,
      color: '#4ADE80',
    },
  ];

  const handleResolve = (id: string) => {
    setTickets((prev) => prev.map((ticket) => ticket.id === id ? { ...ticket, status: 'Resolved' as const } : ticket));
  };

  const handleAssign = (ticketId: string, member: string) => {
    setTickets((prev) => prev.map((ticket) => ticket.id === ticketId ? { ...ticket, assignedTo: member } : ticket));
    setAssigningId(null);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.16)' }}>
            <LifeBuoy size={14} style={{ color: '#4ADE80' }} />
            <span className="text-xs font-mono" style={{ color: '#4ADE80' }}>Customer Operations</span>
          </div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Support
          </h1>
          <p className="text-sm mt-1 max-w-2xl" style={{ color: '#8A8A93' }}>
            Track client issues, assign owners, prioritize escalations, and resolve customer support tickets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#F0EDE6', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <Users size={15} />
            Team Queue
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: '#6B8AFF', color: '#FFFFFF' }}
          >
            <MessageCircle size={15} />
            New Ticket
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>{card.label}</p>
                  <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
                  <p className="text-xs mt-2" style={{ color: '#55555C' }}>{card.sub}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: `${card.color}14`, color: card.color, border: `1px solid ${card.color}26` }}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Ticket Queue</h2>
              <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>Mock data for founder dashboard review</p>
            </div>

            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Search size={14} style={{ color: '#8A8A93' }} />
              <span className="text-xs" style={{ color: '#55555C' }}>Search tickets</span>
            </div>
          </div>

          {tickets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Ticket</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Issue</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Priority</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Owner</th>
                    <th className="text-right px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
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
                        <div>
                          <span className="text-sm font-mono" style={{ color: '#6B8AFF' }}>{ticket.ticketId}</span>
                          <p className="text-xs mt-1" style={{ color: '#55555C' }}>Created recently</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{ticket.company}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="max-w-xs truncate text-sm" style={{ color: '#8A8A93' }}>{ticket.issue}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ background: getPriorityColor(ticket.priority) }}
                          />
                          <span className="text-xs" style={{ color: '#8A8A93' }}>{ticket.priority}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 relative">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-mono" style={{ background: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: '1px solid rgba(107, 138, 255, 0.18)' }}>
                            {ticket.assignedTo.split(' ').map((part) => part[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-sm" style={{ color: '#8A8A93' }}>{ticket.assignedTo}</span>
                          <button
                            className="p-1 rounded transition-colors"
                            style={{ color: assigningId === ticket.id ? '#6B8AFF' : '#55555C' }}
                            onClick={() => setAssigningId(assigningId === ticket.id ? null : ticket.id)}
                            title="Assign ticket"
                          >
                            <UserPlus size={13} />
                          </button>
                        </div>

                        {assigningId === ticket.id && (
                          <div
                            className="absolute top-full left-4 z-10 mt-2 min-w-[170px] overflow-hidden rounded-xl py-1"
                            style={{ background: '#0F0F14', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 16px 48px rgba(0,0,0,0.45)' }}
                          >
                            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wide" style={{ color: '#55555C', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                              Assign owner
                            </div>
                            {teamMembers.map((member) => (
                              <button
                                key={member}
                                className="w-full text-left px-3 py-2 text-xs transition-colors"
                                style={{ color: '#F0EDE6' }}
                                onClick={() => handleAssign(ticket.id, member)}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                              >
                                {member}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="View ticket">
                            <Eye size={15} />
                          </button>
                          {ticket.status !== 'Resolved' && (
                            <button
                              className="p-1.5 rounded-md transition-colors"
                              style={{ color: '#8A8A93' }}
                              title="Resolve ticket"
                              onClick={() => handleResolve(ticket.id)}
                            >
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          <button className="p-1.5 rounded-md transition-colors" style={{ color: '#8A8A93' }} title="More actions">
                            <MoreHorizontal size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                <LifeBuoy size={28} style={{ color: '#8A8A93' }} />
              </div>
              <h3 className="text-base font-medium" style={{ color: '#F0EDE6' }}>No support tickets</h3>
              <p className="mt-2 max-w-md text-sm" style={{ color: '#8A8A93' }}>
                Support requests from client companies will appear here when the backend ticketing system is connected.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Support Health</h2>
                <p className="text-xs mt-1" style={{ color: '#8A8A93' }}>Operational snapshot</p>
              </div>
              <AlertTriangle size={18} style={{ color: '#FF8A5C' }} />
            </div>

            <div className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>Resolution Load</span>
                  <span className="text-xs font-mono" style={{ color: '#F0EDE6' }}>64%</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="h-2 rounded-full" style={{ width: '64%', background: '#6B8AFF' }} />
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>Escalation Risk</span>
                  <span className="text-xs font-mono" style={{ color: '#F0EDE6' }}>Low</span>
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                  <div className="h-2 rounded-full" style={{ width: '32%', background: '#4ADE80' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="surface-card p-5">
            <p className="text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>Founder note</p>
            <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
              Ticket actions are UI-only for now. Keep this page mock/static until support APIs are assigned.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-8 pt-4" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
