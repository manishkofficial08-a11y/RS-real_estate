import { useState, type ReactNode } from 'react';
import { aiJobs } from '@/data/mock';
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileText,
  Gauge,
  Hash,
  Loader2,
  MessageSquareText,
  MoreHorizontal,
  Play,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Timer,
  TrendingUp,
  XCircle,
} from 'lucide-react';

const filters = ['All', 'Running', 'Completed', 'Failed', 'Pending'];

const agentCatalog = [
  { name: 'Caption Agent', icon: MessageSquareText, usage: '1.8k runs', color: '#6B8AFF' },
  { name: 'Hashtag Agent', icon: Hash, usage: '1.4k runs', color: '#4ADE80' },
  { name: 'Lead Scoring Agent', icon: TrendingUp, usage: '912 runs', color: '#FF8A5C' },
  { name: 'Report Agent', icon: FileText, usage: '620 runs', color: '#6B8AFF' },
  { name: 'Scheduler Agent', icon: Send, usage: '486 runs', color: '#4ADE80' },
  { name: 'Recommendation Agent', icon: Sparkles, usage: '344 runs', color: '#FF8A5C' },
  { name: 'AI Chat Agent', icon: Bot, usage: '2.2k runs', color: '#6B8AFF' },
];

const queueHealth = [
  { label: 'Queue Load', value: '68%', color: '#6B8AFF' },
  { label: 'Failure Risk', value: '12%', color: '#FF8A5C' },
  { label: 'Success Rate', value: '94.2%', color: '#4ADE80' },
];

const getStatusConfig = (status: string): { icon: ReactNode; className: string; color: string } => {
  if (status === 'Running') {
    return { icon: <Loader2 size={14} className="animate-spin" />, className: 'badge-blue', color: '#6B8AFF' };
  }

  if (status === 'Completed') {
    return { icon: <CheckCircle2 size={14} />, className: 'badge-green', color: '#4ADE80' };
  }

  if (status === 'Failed') {
    return { icon: <XCircle size={14} />, className: 'badge-red', color: '#FF5A5A' };
  }

  return { icon: <Clock size={14} />, className: 'badge-neutral', color: '#8A8A93' };
};

const getJobTypeLabel = (jobName: string) => {
  const lowerName = jobName.toLowerCase();

  if (lowerName.includes('caption')) return 'Caption Agent';
  if (lowerName.includes('hashtag')) return 'Hashtag Agent';
  if (lowerName.includes('lead')) return 'Lead Scoring Agent';
  if (lowerName.includes('report')) return 'Report Agent';
  if (lowerName.includes('schedule')) return 'Scheduler Agent';
  if (lowerName.includes('recommend')) return 'Recommendation Agent';
  if (lowerName.includes('chat')) return 'AI Chat Agent';

  return 'Automation Agent';
};

export default function AIJobs() {
  const [filter, setFilter] = useState('All');

  const filteredJobs = filter === 'All' ? aiJobs : aiJobs.filter((job) => job.status === filter);
  const runningJobs = aiJobs.filter((job) => job.status === 'Running').length;
  const completedJobs = aiJobs.filter((job) => job.status === 'Completed').length;
  const failedJobs = aiJobs.filter((job) => job.status === 'Failed').length;
  const pendingJobs = aiJobs.filter((job) => job.status === 'Pending').length;

  const summaryCards = [
    {
      label: 'Queued Jobs',
      value: pendingJobs,
      sub: 'Waiting for execution',
      icon: Clock,
      color: '#FF8A5C',
    },
    {
      label: 'Running Jobs',
      value: runningJobs,
      sub: 'Currently processing',
      icon: Play,
      color: '#6B8AFF',
    },
    {
      label: 'Completed Jobs',
      value: completedJobs,
      sub: 'Finished successfully',
      icon: CheckCircle2,
      color: '#4ADE80',
    },
    {
      label: 'Failed Jobs',
      value: failedJobs,
      sub: 'Needs retry or review',
      icon: XCircle,
      color: '#FF5A5A',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1" style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}>
            <BrainCircuit size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>AI Operations Console</span>
          </div>

          <h1 className="font-display text-hero font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            AI Jobs
          </h1>
          <p className="mt-1 max-w-2xl text-sm" style={{ color: '#8A8A93' }}>
            Monitor mock AI automation jobs, agent queues, runtime health, retries, and processing status across client companies.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#F0EDE6', border: '1px solid rgba(255, 255, 255, 0.08)' }}
          >
            <RefreshCcw size={15} />
            Refresh Queue
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors"
            style={{ background: '#6B8AFF', color: '#FFFFFF' }}
          >
            <RotateCcw size={15} />
            Retry Failed Jobs
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div key={card.label} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-mono mb-2" style={{ color: '#8A8A93' }}>{card.label}</p>
                  <p className="font-mono text-data font-medium" style={{ color: '#F0EDE6' }}>{card.value}</p>
                  <p className="mt-2 text-xs" style={{ color: '#55555C' }}>{card.sub}</p>
                </div>
                <div className="rounded-xl p-2.5" style={{ background: `${card.color}14`, color: card.color, border: `1px solid ${card.color}26` }}>
                  <Icon size={18} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="surface-card overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div>
              <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Job Queue</h2>
              <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Frontend-only mock queue for future AI agents</p>
            </div>

            <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <Search size={14} style={{ color: '#8A8A93' }} />
              <span className="text-xs" style={{ color: '#55555C' }}>Search jobs</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            {filters.map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className="rounded-full px-3 py-1.5 text-xs transition-all"
                style={{
                  background: filter === filterOption ? 'rgba(107, 138, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                  color: filter === filterOption ? '#6B8AFF' : '#8A8A93',
                  border: filter === filterOption ? '1px solid rgba(107, 138, 255, 0.2)' : '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {filterOption}
              </button>
            ))}
          </div>

          {filteredJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px]">
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Job</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Company</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Type</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Status</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Runtime</th>
                    <th className="text-left px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Last Run</th>
                    <th className="text-right px-5 py-3 text-xs font-mono font-normal" style={{ color: '#8A8A93' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, index) => {
                    const statusConfig = getStatusConfig(job.status);
                    const jobType = getJobTypeLabel(job.jobName);

                    return (
                      <tr
                        key={job.id}
                        className="transition-colors duration-200"
                        style={{ borderBottom: index < filteredJobs.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none' }}
                        onMouseEnter={(event) => { event.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
                        onMouseLeave={(event) => { event.currentTarget.style.background = 'transparent'; }}
                      >
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{job.jobName}</p>
                            <p className="mt-1 text-xs font-mono" style={{ color: '#55555C' }}>JOB-{job.id.padStart(4, '0')}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm" style={{ color: '#8A8A93' }}>{job.company}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full px-2.5 py-1 text-xs" style={{ background: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF', border: '1px solid rgba(107, 138, 255, 0.18)' }}>
                            {jobType}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${statusConfig.className}`}>
                            {statusConfig.icon}
                            {job.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2">
                            <Timer size={13} style={{ color: '#55555C' }} />
                            <span className="text-sm font-mono" style={{ color: '#8A8A93' }}>{job.executionTime}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm" style={{ color: '#8A8A93' }}>{job.createdTime}</span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {job.status === 'Failed' && (
                              <button
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors"
                                style={{ background: 'rgba(107, 138, 255, 0.1)', color: '#6B8AFF' }}
                              >
                                <RotateCcw size={12} />
                                Retry
                              </button>
                            )}
                            <button
                              className="inline-flex items-center gap-1.5 text-xs transition-colors"
                              style={{ color: '#55555C' }}
                            >
                              <FileText size={12} />
                              Logs
                            </button>
                            <button className="rounded-md p-1.5 transition-colors" style={{ color: '#8A8A93' }} title="More actions">
                              <MoreHorizontal size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 rounded-2xl p-4" style={{ background: 'rgba(255, 255, 255, 0.04)' }}>
                <Bot size={28} style={{ color: '#8A8A93' }} />
              </div>
              <h3 className="text-base font-medium" style={{ color: '#F0EDE6' }}>No AI jobs found</h3>
              <p className="mt-2 max-w-md text-sm" style={{ color: '#8A8A93' }}>
                AI automation jobs will appear here when agents such as caption, report, scheduler, and recommendation workers are connected.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Queue Health</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Mock operational metrics</p>
              </div>
              <Gauge size={18} style={{ color: '#6B8AFF' }} />
            </div>

            <div className="space-y-4">
              {queueHealth.map((metric) => (
                <div key={metric.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{metric.label}</span>
                    <span className="text-xs font-mono" style={{ color: '#F0EDE6' }}>{metric.value}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <div className="h-2 rounded-full" style={{ width: metric.value, background: metric.color }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl p-4" style={{ background: 'rgba(255, 138, 92, 0.06)', border: '1px solid rgba(255, 138, 92, 0.14)' }}>
              <div className="mb-2 flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: '#FF8A5C' }} />
                <span className="text-xs font-mono" style={{ color: '#FF8A5C' }}>System note</span>
              </div>
              <p className="text-sm leading-6" style={{ color: '#F0EDE6' }}>
                This is a frontend-only monitoring view. Actual worker orchestration and agent execution will be added later.
              </p>
            </div>
          </div>

          <div className="surface-card p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-medium" style={{ color: '#F0EDE6' }}>Agent Categories</h2>
                <p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>Planned AI Business OS workers</p>
              </div>
              <Activity size={18} style={{ color: '#4ADE80' }} />
            </div>

            <div className="space-y-3">
              {agentCatalog.map((agent) => {
                const Icon = agent.icon;

                return (
                  <div key={agent.name} className="flex items-center justify-between gap-4 rounded-xl p-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-2" style={{ background: `${agent.color}14`, color: agent.color, border: `1px solid ${agent.color}24` }}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{agent.name}</p>
                        <p className="mt-1 text-xs" style={{ color: '#55555C' }}>Mock category</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono" style={{ color: '#8A8A93' }}>{agent.usage}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2 pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <span className="text-xs" style={{ color: '#55555C' }}>MMe-AI v2.0</span>
        <span className="text-xs font-mono" style={{ color: '#55555C' }}>Last synced: 2 min ago</span>
      </div>
    </div>
  );
}
