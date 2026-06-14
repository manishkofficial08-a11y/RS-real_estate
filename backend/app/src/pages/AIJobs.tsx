import { useState } from 'react';
import { aiJobs } from '@/data/mock';
import { RotateCcw, FileText, Loader2, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

const summaryCards = [
  { label: 'Running Jobs', value: aiJobs.filter(j => j.status === 'Running').length, icon: Play, color: '#6B8AFF', bg: 'rgba(107, 138, 255, 0.12)' },
  { label: 'Completed Jobs', value: aiJobs.filter(j => j.status === 'Completed').length, icon: CheckCircle2, color: '#4ADE80', bg: 'rgba(74, 222, 128, 0.12)' },
  { label: 'Failed Jobs', value: aiJobs.filter(j => j.status === 'Failed').length, icon: XCircle, color: '#FF5A5A', bg: 'rgba(255, 90, 90, 0.12)' },
  { label: 'Pending Jobs', value: aiJobs.filter(j => j.status === 'Pending').length, icon: Clock, color: '#FF8A5C', bg: 'rgba(255, 138, 92, 0.12)' },
];

const statusConfig: Record<string, { icon: React.ReactNode; class: string }> = {
  'Running': { icon: <Loader2 size={14} className="animate-spin" />, class: 'badge-blue' },
  'Completed': { icon: <CheckCircle2 size={14} />, class: 'badge-green' },
  'Failed': { icon: <XCircle size={14} />, class: 'badge-red' },
  'Pending': { icon: <Clock size={14} />, class: 'badge-neutral' },
};

export default function AIJobs() {
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? aiJobs : aiJobs.filter(j => j.status === filter);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            AI Jobs
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8A8A93' }}>Monitor AI processing jobs across the platform</p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: '#6B8AFF', color: '#0A0A0F' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#7B9AFF'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = '#6B8AFF'; }}
        >
          <RotateCcw size={14} />
          Retry Failed Jobs
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="surface-card p-5 flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: card.bg, color: card.color }}
              >
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-mono" style={{ color: '#8A8A93' }}>{card.label}</p>
                <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 mb-4">
        {['All', 'Running', 'Completed', 'Failed', 'Pending'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="text-xs px-3 py-1.5 rounded-full transition-all"
            style={{
              background: filter === f ? 'rgba(107, 138, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              color: filter === f ? '#6B8AFF' : '#8A8A93',
              border: filter === f ? '1px solid rgba(107, 138, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="surface-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Job Name</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Execution Time</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Created</th>
              <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((job, idx) => (
              <tr
                key={job.id}
                className="transition-colors duration-200"
                style={{ borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="px-5 py-4">
                  <span className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{job.jobName}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{job.company}</span>
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${statusConfig[job.status].class}`}>
                    {statusConfig[job.status].icon}
                    {job.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{job.executionTime}</span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-sm" style={{ color: '#8A8A93' }}>{job.createdTime}</span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {job.status === 'Failed' && (
                      <button
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                        style={{ background: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(107, 138, 255, 0.2)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(107, 138, 255, 0.1)'; }}
                      >
                        <RotateCcw size={12} />
                        Retry
                      </button>
                    )}
                    <button
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      style={{ color: '#55555C' }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#6B8AFF'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = '#55555C'; }}
                    >
                      <FileText size={12} />
                      View Logs
                    </button>
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
