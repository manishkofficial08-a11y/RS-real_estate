import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Filter,
  MessageSquare,
  RefreshCw,
  Send,
} from 'lucide-react';
import {
  getSupportTickets,
  updateSupportTicket,
  type AdminSupportTicket,
  type AdminSupportTicketPriority,
  type AdminSupportTicketStatus,
} from '@/lib/adminApi';

const statusOptions: Array<{ label: string; value: AdminSupportTicketStatus | 'all' }> = [
  { label: 'All Status', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Closed', value: 'closed' },
];

const priorityOptions: Array<{ label: string; value: AdminSupportTicketPriority | 'all' }> = [
  { label: 'All Priority', value: 'all' },
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

function formatLabel(value?: string | null) {
  if (!value) return 'General';
  return value
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusColor(status: string) {
  if (status === 'open') return '#6B8AFF';
  if (status === 'in_progress') return '#FF8A5C';
  if (status === 'resolved') return '#4ADE80';
  if (status === 'closed') return '#8A8A93';
  return '#8A8A93';
}

function priorityColor(priority: string) {
  if (priority === 'urgent') return '#FF5A5A';
  if (priority === 'high') return '#FF8A5C';
  if (priority === 'medium') return '#6B8AFF';
  return '#4ADE80';
}

export default function Support() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AdminSupportTicketStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AdminSupportTicketPriority | 'all'>('all');
  const [reply, setReply] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AdminSupportTicketStatus>('in_progress');
  const [selectedPriority, setSelectedPriority] = useState<AdminSupportTicketPriority>('medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupportTickets({
        status: statusFilter,
        priority: priorityFilter,
      });

      setTickets(data);
      setSelectedTicketId((current) => current || data[0]?.id || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support tickets');
      setTickets([]);
      setSelectedTicketId(null);
    } finally {
      setLoading(false);
    }
  }, [priorityFilter, statusFilter]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === selectedTicketId) || tickets[0],
    [selectedTicketId, tickets],
  );

  useEffect(() => {
    if (!selectedTicket) {
      setReply('');
      setSelectedStatus('in_progress');
      setSelectedPriority('medium');
      return;
    }

    setReply(selectedTicket.admin_reply || '');
    setSelectedStatus((selectedTicket.status as AdminSupportTicketStatus) || 'in_progress');
    setSelectedPriority((selectedTicket.priority as AdminSupportTicketPriority) || 'medium');
  }, [selectedTicket]);

  const summaryCards = useMemo(
    () => [
      {
        label: 'Open Tickets',
        value: tickets.filter((ticket) => ticket.status === 'open').length,
        color: '#6B8AFF',
      },
      {
        label: 'In Progress',
        value: tickets.filter((ticket) => ticket.status === 'in_progress').length,
        color: '#FF8A5C',
      },
      {
        label: 'Resolved',
        value: tickets.filter((ticket) => ticket.status === 'resolved').length,
        color: '#4ADE80',
      },
      {
        label: 'Urgent/High',
        value: tickets.filter((ticket) => ['urgent', 'high'].includes(ticket.priority)).length,
        color: '#FF5A5A',
      },
    ],
    [tickets],
  );

  async function handleSaveReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTicket) return;

    try {
      setSaving(true);
      setError(null);
      const updated = await updateSupportTicket(selectedTicket.id, {
        status: selectedStatus,
        priority: selectedPriority,
        admin_reply: reply.trim() || null,
      });

      setTickets((prev) =>
        prev.map((ticket) => (ticket.id === updated.id ? updated : ticket)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update ticket');
    } finally {
      setSaving(false);
    }
  }

  async function handleQuickResolve(ticket: AdminSupportTicket) {
    try {
      setSaving(true);
      setError(null);
      const updated = await updateSupportTicket(ticket.id, {
        status: 'resolved',
        priority: ticket.priority as AdminSupportTicketPriority,
        admin_reply: ticket.admin_reply || 'Resolved by founder support.',
      });

      setTickets((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSelectedTicketId(updated.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve ticket');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1
            className="font-display text-hero font-medium tracking-[-0.03em]"
            style={{ color: '#F0EDE6' }}
          >
            Support
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>
            Manage client support tickets, replies and status updates
          </p>
        </div>

        <button
          onClick={loadTickets}
          className="p-2.5 rounded-lg transition-colors"
          style={{
            color: '#8A8A93',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
          title="Refresh tickets"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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

      <div className="grid grid-cols-4 gap-5 mb-6">
        {summaryCards.map((card) => (
          <div key={card.label} className="surface-card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: card.color }} />
              <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>
                {card.label}
              </span>
            </div>
            <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>
              {loading ? '...' : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs" style={{ color: '#8A8A93' }}>
          <Filter size={14} />
          Filters
        </div>
        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as AdminSupportTicketStatus | 'all')
          }
          className="input-dark px-3 py-2 text-sm"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(event.target.value as AdminSupportTicketPriority | 'all')
          }
          className="input-dark px-3 py-2 text-sm"
        >
          {priorityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        <div className="surface-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Ticket</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Client</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Priority</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Created</th>
                <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                    Loading support tickets from backend...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: '#8A8A93' }}>
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket, idx) => {
                  const isActive = selectedTicket?.id === ticket.id;

                  return (
                    <tr
                      key={ticket.id}
                      className="transition-colors duration-200"
                      style={{
                        borderBottom: idx < tickets.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                        background: isActive ? 'rgba(107, 138, 255, 0.06)' : 'transparent',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = isActive
                          ? 'rgba(107, 138, 255, 0.08)'
                          : 'rgba(255, 255, 255, 0.03)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = isActive
                          ? 'rgba(107, 138, 255, 0.06)'
                          : 'transparent';
                      }}
                    >
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                            {ticket.subject}
                          </span>
                          <p className="text-xs mt-1" style={{ color: '#55555C' }}>
                            #{ticket.id.slice(0, 8)} · {formatLabel(ticket.category)}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm" style={{ color: '#F0EDE6' }}>
                          {ticket.business_name || 'Unknown Company'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div>
                          <span className="text-sm" style={{ color: '#8A8A93' }}>
                            {ticket.created_by_name || 'Unknown User'}
                          </span>
                          <p className="text-xs mt-1" style={{ color: '#55555C' }}>
                            {ticket.created_by_email || 'No email'}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full capitalize"
                          style={{
                            background: `${priorityColor(ticket.priority)}18`,
                            color: priorityColor(ticket.priority),
                          }}
                        >
                          {formatLabel(ticket.priority)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className="text-xs px-2.5 py-1 rounded-full capitalize"
                          style={{
                            background: `${statusColor(ticket.status)}18`,
                            color: statusColor(ticket.status),
                          }}
                        >
                          {formatLabel(ticket.status)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs" style={{ color: '#8A8A93' }}>
                          {formatDate(ticket.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            className="p-1.5 rounded-md transition-colors"
                            style={{ color: '#8A8A93' }}
                            title="View"
                            onClick={() => setSelectedTicketId(ticket.id)}
                            onMouseEnter={(event) => {
                              event.currentTarget.style.color = '#6B8AFF';
                              event.currentTarget.style.background = 'rgba(107, 138, 255, 0.08)';
                            }}
                            onMouseLeave={(event) => {
                              event.currentTarget.style.color = '#8A8A93';
                              event.currentTarget.style.background = 'transparent';
                            }}
                          >
                            <Eye size={14} />
                          </button>
                          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                            <button
                              className="p-1.5 rounded-md transition-colors disabled:opacity-60"
                              style={{ color: '#8A8A93' }}
                              title="Resolve"
                              disabled={saving}
                              onClick={() => handleQuickResolve(ticket)}
                              onMouseEnter={(event) => {
                                event.currentTarget.style.color = '#4ADE80';
                                event.currentTarget.style.background = 'rgba(74, 222, 128, 0.08)';
                              }}
                              onMouseLeave={(event) => {
                                event.currentTarget.style.color = '#8A8A93';
                                event.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <CheckCircle2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSaveReply} className="surface-card p-5 h-fit">
          {selectedTicket ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: '#F0EDE6' }}>
                  {selectedTicket.subject}
                </h2>
                <p className="text-xs mt-1" style={{ color: '#55555C' }}>
                  {selectedTicket.business_name || 'Unknown Company'} · {formatDate(selectedTicket.created_at)}
                </p>
              </div>

              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={14} style={{ color: '#FF8A5C' }} />
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>
                    Client Message
                  </span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#8A8A93' }}>
                  {selectedTicket.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
                    STATUS
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(event) =>
                      setSelectedStatus(event.target.value as AdminSupportTicketStatus)
                    }
                    className="input-dark w-full px-3 py-2 text-sm"
                  >
                    {statusOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
                    PRIORITY
                  </label>
                  <select
                    value={selectedPriority}
                    onChange={(event) =>
                      setSelectedPriority(event.target.value as AdminSupportTicketPriority)
                    }
                    className="input-dark w-full px-3 py-2 text-sm"
                  >
                    {priorityOptions
                      .filter((option) => option.value !== 'all')
                      .map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-mono" style={{ color: '#8A8A93' }}>
                  <MessageSquare size={13} />
                  FOUNDER REPLY
                </label>
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  className="input-dark min-h-36 w-full px-3 py-3 text-sm resize-none"
                  placeholder="Write a clear update for the client..."
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
                  color: '#FFFFFF',
                }}
              >
                <Send size={14} />
                {saving ? 'Saving...' : 'Save Reply and Status'}
              </button>
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: '#8A8A93' }}>
                Select a support ticket to reply.
              </p>
            </div>
          )}
        </form>
      </div>

      <div
        className="flex items-center justify-between mt-8 pt-4"
        style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}
      >
        <span className="text-xs" style={{ color: '#55555C' }}>
          AI Growth OS v2.0
        </span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>
          {loading ? 'Syncing...' : `Showing ${tickets.length} tickets from backend`}
        </span>
      </div>
    </div>
  );
}
