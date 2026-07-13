import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ExternalLink,
  LoaderCircle,
  Mail,
  MessageCircle,
  Phone,
  Play,
  Pause,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  XCircle,
} from 'lucide-react';
import {
  createRekhaDraft,
  getRekhaOverview,
  getRekhaProspects,
  recordRekhaReply,
  processDueRekhaFollowUps,
  processRekhaAutonomousCycle,
  resolveRekhaFounderQuestion,
  runRekha,
  sendRekhaMessage,
  updateRekhaCampaign,
  updateRekhaProspectAutomation,
  type RekhaMessage,
  type RekhaOverview,
  type RekhaProspect,
} from '@/lib/adminApi';


const industries = [
  'Local Businesses',
  'Real Estate Agents',
  'Healthcare',
  'Education',
  'Professional Services',
  'Restaurants',
  'Gyms',
  'Hotels',
  'Salons',
  'Automotive',
  'Retail Shops',
];


const statusStyle: Record<string, { label: string; color: string; background: string }> = {
  new: { label: 'New', color: '#9BAEFF', background: 'rgba(107,138,255,.12)' },
  researched: { label: 'Researched', color: '#75D8FF', background: 'rgba(76,194,255,.12)' },
  drafted: { label: 'Draft ready', color: '#D7A7FF', background: 'rgba(177,106,255,.12)' },
  contacted: { label: 'Contacted', color: '#FFCB70', background: 'rgba(255,184,77,.12)' },
  replied: { label: 'Replied', color: '#61E2B4', background: 'rgba(61,226,180,.12)' },
  interested: { label: 'Interested', color: '#4ADE80', background: 'rgba(74,222,128,.12)' },
  demo_booked: { label: 'Demo booked', color: '#4ADE80', background: 'rgba(74,222,128,.16)' },
  not_now: { label: 'Not now', color: '#A2A2AA', background: 'rgba(255,255,255,.06)' },
  not_interested: { label: 'Not interested', color: '#FF8A8A', background: 'rgba(255,90,90,.10)' },
  opted_out: { label: 'Opted out', color: '#FF8A8A', background: 'rgba(255,90,90,.10)' },
  needs_founder: { label: 'Needs you', color: '#FFCB70', background: 'rgba(255,184,77,.12)' },
};


function readError(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong.';
  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    return parsed.detail || error.message;
  } catch {
    return error.message;
  }
}


function latestDraft(prospect: RekhaProspect): RekhaMessage | undefined {
  return [...prospect.messages].reverse().find(
    (message) => message.direction === 'outbound' && ['draft', 'failed'].includes(message.status),
  );
}


function formatDate(value?: string | null) {
  if (!value) return 'Not run yet';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}


export default function Rekha() {
  const [overview, setOverview] = useState<RekhaOverview | null>(null);
  const [prospects, setProspects] = useState<RekhaProspect[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [industry, setIndustry] = useState('Local Businesses');
  const [location, setLocation] = useState('');
  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [minimumScore, setMinimumScore] = useState(70);
  const [radiusKm, setRadiusKm] = useState(5);
  const [limit, setLimit] = useState(20);
  const [autoSend, setAutoSend] = useState(false);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [replyChannel, setReplyChannel] = useState<'email' | 'whatsapp' | 'call'>('email');
  const [demoBooked, setDemoBooked] = useState(false);
  const [founderAnswer, setFounderAnswer] = useState('');

  const selected = useMemo(
    () => prospects.find((prospect) => prospect.id === selectedId) || prospects[0],
    [prospects, selectedId],
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [overviewData, prospectData] = await Promise.all([
        getRekhaOverview(),
        getRekhaProspects(),
      ]);
      setOverview(overviewData);
      setProspects(prospectData);
      if (prospectData.length) setSelectedId((current) => current || prospectData[0].id);
    } catch (loadError) {
      setError(readError(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => void load(), 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const draft = selected ? latestDraft(selected) : undefined;
    setDraftSubject(draft?.subject || '');
    setDraftBody(draft?.body || '');
    setReplyChannel((selected?.preferred_channel as 'email' | 'whatsapp') || 'email');
    setReplyBody('');
    setDemoBooked(false);
    setFounderAnswer('');
  }, [selected]);

  async function handleRun(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setNotice('');
    setRunning(true);
    try {
      const result = await runRekha({
        industry,
        location,
        radius_km: radiusKm,
        limit,
        minimum_score: minimumScore,
        channel,
        auto_send: autoSend,
      });
      setNotice(result.message);
      await load();
    } catch (runError) {
      setError(readError(runError));
    } finally {
      setRunning(false);
    }
  }

  async function handleDraft(prospect: RekhaProspect, preferred?: 'email' | 'whatsapp') {
    const targetChannel = preferred || (prospect.email ? 'email' : 'whatsapp');
    setActionId(`draft-${prospect.id}`);
    setError('');
    setNotice('');
    try {
      await createRekhaDraft(prospect.id, targetChannel);
      setNotice(`Rekha prepared a ${targetChannel} draft for ${prospect.business_name}.`);
      await load();
      setSelectedId(prospect.id);
    } catch (draftError) {
      setError(readError(draftError));
    } finally {
      setActionId('');
    }
  }

  async function handleSend() {
    if (!selected) return;
    const message = latestDraft(selected);
    if (!message) return;
    setActionId(`send-${message.id}`);
    setError('');
    setNotice('');
    try {
      const result = await sendRekhaMessage(message.id, {
        subject: draftSubject,
        body: draftBody,
      });
      const deliveryText = typeof result.delivery.message === 'string'
        ? result.delivery.message
        : result.message.status === 'sent'
          ? 'Message sent.'
          : 'Delivery needs configuration.';
      setNotice(deliveryText);
      await load();
    } catch (sendError) {
      setError(readError(sendError));
    } finally {
      setActionId('');
    }
  }

  async function handleReply() {
    if (!selected || !replyBody.trim()) return;
    setActionId(`reply-${selected.id}`);
    setError('');
    setNotice('');
    try {
      const result = await recordRekhaReply(selected.id, {
        channel: replyChannel,
        body: replyBody.trim(),
        demo_booked: demoBooked,
      });
      setNotice(
        result.requires_founder
          ? 'Rekha paused automation and escalated this question to you.'
          : result.founder_handoff
          ? 'Interested lead detected. Rekha prepared the founder handoff.'
          : `Reply classified as ${result.intent.replaceAll('_', ' ')}.`,
      );
      await load();
    } catch (replyError) {
      setError(readError(replyError));
    } finally {
      setActionId('');
    }
  }

  async function handleCampaignChange(changes: Partial<NonNullable<RekhaOverview['campaign']>>) {
    if (!overview) return;
    setActionId('campaign');
    setError('');
    try {
      await updateRekhaCampaign({ ...overview.campaign, ...changes });
      setNotice(changes.is_active === false ? 'Rekha campaign paused safely.' : 'Rekha automation settings updated.');
      await load();
    } catch (campaignError) {
      setError(readError(campaignError));
    } finally {
      setActionId('');
    }
  }

  async function handleProcessDue() {
    setActionId('process-due');
    setError('');
    try {
      const result = await processDueRekhaFollowUps();
      setNotice(result.processed_count ? `Rekha prepared ${result.processed_count} due follow-up(s).` : `No follow-ups processed${result.reason ? `: ${result.reason.replaceAll('_', ' ')}` : '.'}`);
      await load();
    } catch (processError) {
      setError(readError(processError));
    } finally {
      setActionId('');
    }
  }

  async function handleAutonomousCycle() {
    setActionId('autonomous-cycle');
    setError('');
    try {
      const result = await processRekhaAutonomousCycle();
      setNotice(result.processed
        ? `Cycle complete: ${result.imported_count || 0} new, ${result.drafted_count || 0} drafted, ${result.sent_count || 0} sent.`
        : `Cycle not started: ${(result.reason || 'not ready').replaceAll('_', ' ')}.`);
      await load();
    } catch (cycleError) {
      setError(readError(cycleError));
    } finally {
      setActionId('');
    }
  }

  async function handlePauseProspect() {
    if (!selected) return;
    setActionId('pause-prospect');
    try {
      await updateRekhaProspectAutomation(selected.id, !selected.automation_paused);
      setNotice(selected.automation_paused ? 'Prospect automation resumed.' : 'Prospect automation paused.');
      await load();
    } catch (pauseError) {
      setError(readError(pauseError));
    } finally {
      setActionId('');
    }
  }

  async function handleFounderResolve() {
    if (!selected || !founderAnswer.trim()) return;
    setActionId('founder-resolve');
    try {
      await resolveRekhaFounderQuestion(selected.id, founderAnswer.trim());
      setNotice('Verified founder answer saved as a reviewable draft.');
      await load();
    } catch (resolveError) {
      setError(readError(resolveError));
    } finally {
      setActionId('');
    }
  }

  const interested = (overview?.pipeline.interested || 0) + (overview?.pipeline.demo_booked || 0);
  const drafts = overview?.pipeline.drafted || 0;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em]" style={{ color: '#A78BFA' }}>
            <Sparkles size={15} /> Founder sales assistant
          </div>
          <h1 className="text-3xl font-semibold tracking-[-.04em]" style={{ color: '#F4F1EA' }}>Rekha</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: '#92929B' }}>
            Qualified businesses discover karo, grounded personalized outreach prepare karo, replies triage karo aur interested prospects ko founder demo tak hand off karo.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: 'rgba(167,139,250,.08)', border: '1px solid rgba(167,139,250,.18)' }}>
          <div className="relative">
            <div className="flex h-10 w-10 items-center justify-center rounded-full" style={{ background: 'linear-gradient(145deg,#A78BFA,#6B8AFF)', color: '#fff' }}><Bot size={20} /></div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0B0B10] bg-emerald-400" />
          </div>
          <div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Rekha is ready</p><p className="text-xs" style={{ color: '#777780' }}>Calls remain safety-gated</p></div>
        </div>
      </header>

      {(error || notice) && (
        <div className="flex items-start gap-3 rounded-2xl px-4 py-3 text-sm" style={{ background: error ? 'rgba(255,90,90,.08)' : 'rgba(74,222,128,.08)', border: `1px solid ${error ? 'rgba(255,90,90,.2)' : 'rgba(74,222,128,.18)'}`, color: error ? '#FF9898' : '#63E494' }}>
          {error ? <CircleAlert className="mt-0.5 shrink-0" size={16} /> : <CheckCircle2 className="mt-0.5 shrink-0" size={16} />}
          <span>{error || notice}</span>
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Prospects', value: overview?.total_prospects || 0, icon: UserRoundCheck, color: '#9BAEFF' },
          { label: 'Draft queue', value: drafts, icon: Mail, color: '#D7A7FF' },
          { label: 'Sent today', value: overview?.sent_today || 0, icon: Send, color: '#FFCB70' },
          { label: 'Interested / demos', value: interested, icon: CalendarCheck, color: '#63E494' },
          { label: 'Daily safety cap', value: overview?.agent.daily_send_limit || 20, icon: ShieldCheck, color: '#75D8FF' },
        ].map((item) => (
          <div key={item.label} className="surface-card p-4">
            <div className="flex items-center justify-between"><span className="text-xs" style={{ color: '#777780' }}>{item.label}</span><item.icon size={16} style={{ color: item.color }} /></div>
            <p className="mt-3 text-2xl font-semibold" style={{ color: '#F4F1EA' }}>{loading ? '—' : item.value}</p>
          </div>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
          <div>
            <div className="flex items-center gap-2"><Bot size={17} style={{ color: '#63E494' }} /><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Autonomous operator</p></div>
            <p className="mt-1 text-xs" style={{ color: '#777780' }}>Rekha rotates markets, finds new businesses, qualifies them, prepares outreach, sends only through compliant ready channels and keeps the conversation moving.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full px-3 py-1.5 text-xs" style={{ color: overview?.campaign.is_active && overview?.campaign.autonomous_discovery ? '#63E494' : '#FFCB70', background: overview?.campaign.is_active && overview?.campaign.autonomous_discovery ? 'rgba(74,222,128,.09)' : 'rgba(255,184,77,.09)' }}>{overview?.campaign.is_active && overview?.campaign.autonomous_discovery ? 'Autopilot running' : 'Autopilot paused'}</span>
            <button type="button" disabled={actionId === 'autonomous-cycle' || !overview?.campaign.is_active || !overview?.campaign.autonomous_discovery} onClick={() => void handleAutonomousCycle()} className="rounded-lg px-3 py-2 text-xs disabled:opacity-40" style={{ color: '#C4B5FD', background: 'rgba(167,139,250,.1)' }}>{actionId === 'autonomous-cycle' ? 'Running…' : 'Run cycle now'}</button>
          </div>
        </div>
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-xl p-3 text-xs" style={{ background: 'rgba(255,255,255,.025)', color: '#BDB9B1' }}><span>Discover new leads continuously</span><input type="checkbox" checked={overview?.campaign.autonomous_discovery || false} onChange={(event) => void handleCampaignChange({ autonomous_discovery: event.target.checked })} /></label>
            <label className="flex items-center justify-between rounded-xl p-3 text-xs" style={{ background: 'rgba(255,255,255,.025)', color: '#BDB9B1' }}><span>Send initial outreach automatically</span><input type="checkbox" checked={overview?.campaign.auto_initial_outreach || false} onChange={(event) => void handleCampaignChange({ auto_initial_outreach: event.target.checked })} /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Markets to rotate (comma-separated)</span><input key={`locations-${overview?.campaign.discovery_locations}`} defaultValue={overview?.campaign.discovery_locations || 'Gurgaon, Haryana'} onBlur={(event) => void handleCampaignChange({ discovery_locations: event.target.value })} className="field-dark w-full" /></label>
            <label className="space-y-2 md:col-span-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Industries to rotate (comma-separated)</span><input key={`industries-${overview?.campaign.discovery_industries}`} defaultValue={overview?.campaign.discovery_industries || 'Local Businesses'} onBlur={(event) => void handleCampaignChange({ discovery_industries: event.target.value })} className="field-dark w-full" /></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Best available channel</span><select value={overview?.campaign.discovery_channel || 'auto'} onChange={(event) => void handleCampaignChange({ discovery_channel: event.target.value as 'auto' | 'email' | 'whatsapp' })} className="field-dark w-full"><option value="auto">Auto (email first)</option><option value="email">Email only</option><option value="whatsapp">WhatsApp opted-in only</option></select></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Cycle cadence</span><select value={overview?.campaign.discovery_interval_minutes || 180} onChange={(event) => void handleCampaignChange({ discovery_interval_minutes: Number(event.target.value) })} className="field-dark w-full"><option value={60}>Every hour</option><option value={180}>Every 3 hours</option><option value={360}>Every 6 hours</option><option value={720}>Every 12 hours</option></select></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Minimum score</span><select value={overview?.campaign.minimum_score || 60} onChange={(event) => void handleCampaignChange({ minimum_score: Number(event.target.value) })} className="field-dark w-full">{[60, 70, 80, 90].map((value) => <option key={value} value={value}>{value}+</option>)}</select></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Leads per cycle</span><select value={overview?.campaign.discovery_batch_size || 10} onChange={(event) => void handleCampaignChange({ discovery_batch_size: Number(event.target.value) })} className="field-dark w-full">{[5, 10, 20, 30, 50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
          </div>
          <div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)' }}><p className="text-[11px]" style={{ color: '#66666F' }}>Last cycle</p><p className="mt-1 text-xs" style={{ color: '#D6D2CA' }}>{formatDate(overview?.campaign.last_discovery_at)}</p></div>
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)' }}><p className="text-[11px]" style={{ color: '#66666F' }}>Next cycle</p><p className="mt-1 text-xs" style={{ color: '#D6D2CA' }}>{formatDate(overview?.campaign.next_discovery_at)}</p></div>
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[.14em]" style={{ color: '#64646D' }}>Recent autonomous activity</p>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
              {(overview?.automation_runs || []).map((run) => <div key={run.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)' }}><div className="flex items-center justify-between gap-3"><p className="truncate text-xs" style={{ color: '#D6D2CA' }}>{run.industry} · {run.location}</p><span className="text-[10px] uppercase" style={{ color: run.status === 'failed' ? '#FF8A8A' : run.status === 'running' ? '#FFCB70' : '#63E494' }}>{run.status}</span></div><p className="mt-2 text-[11px]" style={{ color: '#6F6F78' }}>{run.discovered_count} found · {run.qualified_count} qualified · {run.sent_count} sent · {run.failed_count} failed</p>{run.error_message && <p className="mt-1 line-clamp-2 text-[11px]" style={{ color: '#FF8A8A' }}>{run.error_message}</p>}</div>)}
              {!overview?.automation_runs?.length && <div className="rounded-xl px-4 py-8 text-center text-xs" style={{ color: '#55555E', background: 'rgba(255,255,255,.02)' }}>Autopilot activate karne ke baad every cycle yahan visible hoga.</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(340px,.8fr)]">
        <form onSubmit={handleRun} className="surface-card overflow-hidden">
          <div className="border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#F4F1EA' }}><Play size={16} style={{ color: '#A78BFA' }} /> Start a Rekha run</div>
            <p className="mt-1 text-xs" style={{ color: '#777780' }}>One run discovers, qualifies and prepares outreach. Sending is review-first unless the production kill switch is enabled.</p>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Business category</span><select value={industry} onChange={(event) => setIndustry(event.target.value)} className="field-dark w-full">{industries.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="space-y-2 xl:col-span-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Location</span><input className="field-dark w-full" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Gurgaon, Haryana" required minLength={2} /></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>First channel</span><select className="field-dark w-full" value={channel} onChange={(event) => setChannel(event.target.value as 'email' | 'whatsapp')}><option value="email">Email</option><option value="whatsapp">WhatsApp template</option></select></label>
            <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Minimum public-data score</span><select className="field-dark w-full" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))}>{[60, 70, 80, 90].map((value) => <option key={value} value={value}>{value}+</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Radius</span><select className="field-dark w-full" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>{[2, 5, 10, 15, 25].map((value) => <option key={value} value={value}>{value} km</option>)}</select></label>
              <label className="space-y-2"><span className="text-xs" style={{ color: '#8A8A93' }}>Max</span><select className="field-dark w-full" value={limit} onChange={(event) => setLimit(Number(event.target.value))}>{[10, 20, 30, 50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
            </div>
          </div>
          <div className="flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'rgba(255,255,255,.06)', background: 'rgba(255,255,255,.012)' }}>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs" style={{ color: '#7D7D86' }}><ShieldCheck size={15} style={{ color: '#63E494' }} /> No fabricated observations · opt-out enforced · max {overview?.agent.daily_send_limit || 20}/day</div>
              <label className="flex items-center gap-2 text-xs" style={{ color: overview?.agent.auto_send_enabled ? '#BDB9B1' : '#5F5F68' }}>
                <input type="checkbox" checked={autoSend} disabled={!overview?.agent.auto_send_enabled} onChange={(event) => setAutoSend(event.target.checked)} />
                Auto-send qualified drafts {overview?.agent.auto_send_enabled ? '(this run only)' : '(enable REKHA_AUTO_SEND_ENABLED first)'}
              </label>
            </div>
            <button disabled={running} className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium disabled:opacity-60" style={{ background: 'linear-gradient(135deg,#A78BFA,#6B8AFF)', color: '#fff' }}>
              {running ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />}{running ? 'Rekha is researching…' : 'Generate + prepare outreach'}
            </button>
          </div>
        </form>

        <div className="surface-card p-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Automation control</p><p className="mt-1 text-xs" style={{ color: '#777780' }}>{overview?.escalation_count || 0} question(s) need founder input</p></div><button type="button" disabled={actionId === 'campaign'} onClick={() => void handleCampaignChange({ is_active: !overview?.campaign.is_active })} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color: overview?.campaign.is_active ? '#FFCB70' : '#63E494', background: overview?.campaign.is_active ? 'rgba(255,184,77,.08)' : 'rgba(74,222,128,.08)' }}>{overview?.campaign.is_active ? <Pause size={13} /> : <Play size={13} />}{overview?.campaign.is_active ? 'Pause' : 'Activate'}</button></div>
          <div className="mt-4 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)' }}>
            <label className="flex items-center justify-between gap-3 text-xs" style={{ color: '#BDB9B1' }}><span>Automatic follow-ups</span><input type="checkbox" checked={overview?.campaign.auto_follow_ups || false} onChange={(event) => void handleCampaignChange({ auto_follow_ups: event.target.checked })} /></label>
            <label className="mt-3 flex items-center justify-between gap-3 text-xs" style={{ color: '#BDB9B1' }}><span>Safe replies auto-send</span><input type="checkbox" checked={overview?.campaign.auto_reply_safe || false} onChange={(event) => void handleCampaignChange({ auto_reply_safe: event.target.checked })} /></label>
            <div className="mt-3 flex items-center justify-between text-[11px]" style={{ color: '#676770' }}><span>Working window</span><span>{overview?.campaign.working_hours_start || 9}:00–{overview?.campaign.working_hours_end || 18}:00 · IST</span></div>
            <button type="button" disabled={actionId === 'process-due'} onClick={() => void handleProcessDue()} className="mt-3 w-full rounded-lg px-3 py-2 text-xs disabled:opacity-50" style={{ color: '#C4B5FD', background: 'rgba(167,139,250,.09)' }}>{actionId === 'process-due' ? 'Checking…' : 'Process due follow-ups now'}</button>
          </div>
          <div className="mt-5 flex items-center justify-between"><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Integrations</p><p className="mt-1 text-xs" style={{ color: '#777780' }}>Production readiness</p></div><button type="button" onClick={() => void load()} className="rounded-lg p-2" style={{ color: '#8A8A93', background: 'rgba(255,255,255,.04)' }}><RefreshCw size={15} /></button></div>
          <div className="mt-5 space-y-3">
            {[
              ['AI personalization', overview?.agent.ai_ready, 'Template fallback works without key'],
              ['Email sender', overview?.agent.email_ready, 'SMTP credentials required'],
              ['Email reply listener', overview?.agent.email_inbound_ready, 'Enable secure IMAP polling'],
              ['WhatsApp Business', overview?.agent.whatsapp_ready, 'Approved template required'],
              ['Demo booking', overview?.agent.booking_ready, 'Calendar/booking URL required'],
              ['Outreach compliance', overview?.agent.compliance_ready, 'Postal address required for automated email'],
              ['Founder handoff', overview?.agent.founder_handoff_ready, 'Phone, WhatsApp or email required'],
            ].map(([label, ready, note]) => (
              <div key={String(label)} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)' }}>
                {ready ? <CheckCircle2 size={17} style={{ color: '#63E494' }} /> : <XCircle size={17} style={{ color: '#5D5D66' }} />}
                <div className="min-w-0"><p className="text-xs font-medium" style={{ color: ready ? '#EAE7E0' : '#8A8A93' }}>{String(label)}</p><p className="mt-0.5 truncate text-[11px]" style={{ color: '#5F5F68' }}>{String(note)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid min-h-[620px] gap-5 xl:grid-cols-[380px_minmax(0,1fr)]">
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Outreach pipeline</p><p className="mt-1 text-xs" style={{ color: '#6F6F78' }}>{prospects.length} recent prospects</p></div><MessageCircle size={17} style={{ color: '#A78BFA' }} /></div>
          <div className="max-h-[570px] overflow-y-auto">
            {!prospects.length && !loading && <div className="px-6 py-20 text-center"><Bot className="mx-auto" size={26} style={{ color: '#4F4F58' }} /><p className="mt-3 text-sm" style={{ color: '#777780' }}>Rekha ka first run start karo.</p></div>}
            {prospects.map((prospect) => {
              const state = statusStyle[prospect.status] || statusStyle.new;
              const isSelected = selected?.id === prospect.id;
              return (
                <button type="button" key={prospect.id} onClick={() => setSelectedId(prospect.id)} className="w-full border-b px-5 py-4 text-left transition-colors" style={{ borderColor: 'rgba(255,255,255,.045)', background: isSelected ? 'rgba(167,139,250,.08)' : 'transparent' }}>
                  <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium" style={{ color: '#F1EEE7' }}>{prospect.business_name}</p><p className="mt-1 truncate text-xs" style={{ color: '#73737C' }}>{prospect.category || 'Business'} · {prospect.location || 'Location unavailable'}</p></div><ChevronRight className="mt-1 shrink-0" size={15} style={{ color: isSelected ? '#A78BFA' : '#4D4D55' }} /></div>
                  <div className="mt-3 flex items-center justify-between"><span className="rounded-full px-2.5 py-1 text-[11px]" style={{ color: state.color, background: state.background }}>{state.label}</span><span className="text-xs font-mono" style={{ color: prospect.fit_score >= 80 ? '#63E494' : '#FFCB70' }}>{prospect.fit_score}/100</span></div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="surface-card overflow-hidden">
          {!selected ? <div className="flex h-full min-h-[620px] items-center justify-center text-sm" style={{ color: '#777780' }}>Select a prospect to review Rekha’s work.</div> : (
            <div>
              <div className="flex flex-col gap-4 border-b px-5 py-5 lg:flex-row lg:items-start lg:justify-between" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                <div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-semibold" style={{ color: '#F4F1EA' }}>{selected.business_name}</h2><span className="rounded-full px-2.5 py-1 text-xs" style={{ color: (statusStyle[selected.status] || statusStyle.new).color, background: (statusStyle[selected.status] || statusStyle.new).background }}>{(statusStyle[selected.status] || statusStyle.new).label}</span></div><p className="mt-2 text-xs leading-5" style={{ color: '#777780' }}>{selected.fit_reason}</p></div>
                <div className="flex flex-wrap gap-2">{selected.website && <a href={selected.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color: '#9BAEFF', background: 'rgba(107,138,255,.08)' }}>Website <ExternalLink size={12} /></a>}{selected.email && <span className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color: '#BDB9B1', background: 'rgba(255,255,255,.04)' }}><Mail size={12} /> {selected.email}</span>}{selected.phone && <span className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color: '#BDB9B1', background: 'rgba(255,255,255,.04)' }}><Phone size={12} /> {selected.phone}</span>}<span className="rounded-lg px-3 py-2 text-xs capitalize" style={{ color: '#75D8FF', background: 'rgba(76,194,255,.07)' }}>{selected.market_region} · {selected.language_preference}</span><button type="button" disabled={actionId === 'pause-prospect'} onClick={() => void handlePauseProspect()} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs" style={{ color: selected.automation_paused ? '#63E494' : '#A2A2AA', background: 'rgba(255,255,255,.04)' }}>{selected.automation_paused ? <Play size={12} /> : <Pause size={12} />}{selected.automation_paused ? 'Resume' : 'Pause'}</button></div>
              </div>

              {selected.requires_founder && <div className="m-5 rounded-2xl p-4" style={{ background: 'rgba(255,184,77,.07)', border: '1px solid rgba(255,184,77,.18)' }}>
                <div className="flex items-start gap-3"><CircleAlert className="mt-0.5 shrink-0" size={18} style={{ color: '#FFCB70' }} /><div className="min-w-0 flex-1"><p className="text-sm font-medium" style={{ color: '#FFE0A6' }}>Rekha needs your verified answer</p><p className="mt-1 text-xs leading-5" style={{ color: '#9B8C72' }}>{selected.founder_note || 'The reply is uncertain or needs a commercial/technical commitment.'} Automation is paused for this prospect.</p><div className="mt-3 rounded-xl p-3 text-xs leading-5" style={{ color: '#D6D2CA', background: 'rgba(0,0,0,.16)' }}>{[...selected.messages].reverse().find((message) => message.direction === 'inbound')?.body || 'Open the conversation history to review the question.'}</div><textarea value={founderAnswer} onChange={(event) => setFounderAnswer(event.target.value)} rows={4} placeholder="Type the accurate answer. Rekha will save it as a reviewable reply draft…" className="field-dark mt-3 w-full resize-none" /><button type="button" disabled={!founderAnswer.trim() || actionId === 'founder-resolve'} onClick={() => void handleFounderResolve()} className="mt-3 rounded-xl px-4 py-2.5 text-xs font-medium disabled:opacity-40" style={{ background: '#FFE0A6', color: '#21180A' }}>{actionId === 'founder-resolve' ? 'Saving…' : 'Create verified Rekha reply'}</button></div></div>
              </div>}

              <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)]">
                <div className="border-b p-5 lg:border-b-0 lg:border-r" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
                  <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Rekha’s outreach</p><p className="mt-1 text-xs" style={{ color: '#707079' }}>Edit before sending. Rekha never invents a business observation.</p></div><div className="flex gap-2"><button type="button" disabled={!selected.email || actionId === `draft-${selected.id}`} onClick={() => void handleDraft(selected, 'email')} className="rounded-lg px-3 py-2 text-xs disabled:opacity-35" style={{ background: 'rgba(255,255,255,.05)', color: '#D6D2CA' }}><Mail className="mr-1.5 inline" size={12} />New email</button><button type="button" disabled={!selected.phone || actionId === `draft-${selected.id}`} onClick={() => void handleDraft(selected, 'whatsapp')} className="rounded-lg px-3 py-2 text-xs disabled:opacity-35" style={{ background: 'rgba(74,222,128,.08)', color: '#63E494' }}><MessageCircle className="mr-1.5 inline" size={12} />New WhatsApp</button></div></div>
                  {latestDraft(selected) ? <div className="mt-5 space-y-3"><input value={draftSubject} onChange={(event) => setDraftSubject(event.target.value)} placeholder="Subject" className="field-dark w-full" /><textarea value={draftBody} onChange={(event) => setDraftBody(event.target.value)} rows={13} className="field-dark w-full resize-none leading-6" /><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[11px]" style={{ color: '#5F5F68' }}>{latestDraft(selected)?.provider || 'Rekha'} · {latestDraft(selected)?.channel} · {draftBody.length} chars</p><button type="button" disabled={actionId === `send-${latestDraft(selected)?.id}` || selected.opted_out} onClick={() => void handleSend()} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-45" style={{ background: '#F4F1EA', color: '#111116' }}>{actionId === `send-${latestDraft(selected)?.id}` ? <LoaderCircle className="animate-spin" size={15} /> : <Send size={15} />}Approve & send</button></div></div> : <div className="mt-5 rounded-2xl px-5 py-12 text-center" style={{ background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.08)' }}><Sparkles className="mx-auto" size={22} style={{ color: '#A78BFA' }} /><p className="mt-3 text-sm" style={{ color: '#B8B4AC' }}>No outreach draft yet</p><button type="button" onClick={() => void handleDraft(selected)} className="mt-4 rounded-lg px-4 py-2 text-xs" style={{ background: 'rgba(167,139,250,.12)', color: '#C4B5FD' }}>Ask Rekha to draft</button></div>}
                </div>

                <div className="p-5">
                  <p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Record a reply</p><p className="mt-1 text-xs leading-5" style={{ color: '#707079' }}>Webhook sync can use this same endpoint later. For now paste a reply to test intent and handoff.</p>
                  <select value={replyChannel} onChange={(event) => setReplyChannel(event.target.value as 'email' | 'whatsapp' | 'call')} className="field-dark mt-4 w-full"><option value="email">Email reply</option><option value="whatsapp">WhatsApp reply</option><option value="call">Call note</option></select>
                  <textarea value={replyBody} onChange={(event) => setReplyBody(event.target.value)} rows={7} className="field-dark mt-3 w-full resize-none" placeholder="Paste what the prospect replied…" />
                  <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs" style={{ color: '#8A8A93' }}><input type="checkbox" checked={demoBooked} onChange={(event) => setDemoBooked(event.target.checked)} /> Demo already booked</label>
                  <button type="button" onClick={() => void handleReply()} disabled={!replyBody.trim() || actionId === `reply-${selected.id}`} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:opacity-40" style={{ background: 'rgba(107,138,255,.12)', color: '#9BAEFF', border: '1px solid rgba(107,138,255,.18)' }}>{actionId === `reply-${selected.id}` ? <LoaderCircle className="animate-spin" size={15} /> : <UserRoundCheck size={15} />}Classify & prepare handoff</button>

                  <div className="mt-6 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,.06)' }}><p className="text-xs font-medium uppercase tracking-[.14em]" style={{ color: '#64646D' }}>Conversation timeline</p><div className="mt-3 max-h-48 space-y-3 overflow-y-auto">{[...selected.messages].reverse().slice(0, 8).map((message) => <div key={message.id} className="rounded-xl p-3" style={{ background: message.direction === 'inbound' ? 'rgba(74,222,128,.06)' : 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.05)' }}><div className="flex items-center justify-between text-[10px] uppercase tracking-[.1em]" style={{ color: message.direction === 'inbound' ? '#63E494' : '#707079' }}><span>{message.direction} · {message.channel}</span><span>{message.status}</span></div><p className="mt-2 line-clamp-3 text-xs leading-5" style={{ color: '#B6B2AA' }}>{message.body}</p></div>)}{!selected.messages.length && <p className="text-xs" style={{ color: '#55555E' }}>No conversation yet.</p>}</div></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
