import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  CheckCheck,
  CircleAlert,
  Clock3,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';
import {
  getRekhaOverview,
  getRekhaProspects,
  sendRekhaWhatsAppMessage,
  updateRekhaCampaign,
  type RekhaMessage,
  type RekhaOverview,
  type RekhaProspect,
} from '@/lib/adminApi';

function readError(error: unknown) {
  if (!(error instanceof Error)) return 'Something went wrong.';
  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    return parsed.detail || error.message;
  } catch {
    return error.message;
  }
}

function messageTime(message?: RekhaMessage) {
  const value = message?.read_at || message?.delivered_at || message?.sent_at || message?.created_at;
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function latestMessage(prospect: RekhaProspect) {
  return [...prospect.messages]
    .filter((message) => message.channel === 'whatsapp' && message.status !== 'draft')
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
}

function StatusIcon({ message }: { message: RekhaMessage }) {
  if (message.direction === 'inbound') return null;
  if (message.status === 'read') return <CheckCheck size={14} style={{ color: '#75D8FF' }} />;
  if (message.status === 'delivered') return <CheckCheck size={14} style={{ color: '#A5A5AE' }} />;
  if (message.status === 'sent') return <Check size={14} style={{ color: '#A5A5AE' }} />;
  if (message.status === 'failed') return <CircleAlert size={13} style={{ color: '#FF8A8A' }} />;
  return <Clock3 size={13} style={{ color: '#777780' }} />;
}

export default function WhatsAppAutomation() {
  const [overview, setOverview] = useState<RekhaOverview | null>(null);
  const [prospects, setProspects] = useState<RekhaProspect[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [search, setSearch] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true);
    try {
      const [overviewData, prospectData] = await Promise.all([
        getRekhaOverview(),
        getRekhaProspects(),
      ]);
      setOverview(overviewData);
      setProspects(prospectData.filter((prospect) => Boolean(prospect.phone)));
      setSelectedId((current) => current || prospectData.find((prospect) => prospect.phone)?.id || '');
      setError('');
    } catch (loadError) {
      setError(readError(loadError));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(true), 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const conversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...prospects]
      .filter((prospect) => !query || [prospect.business_name, prospect.phone, prospect.category, prospect.location]
        .some((value) => value?.toLowerCase().includes(query)))
      .sort((a, b) => {
        const aTime = new Date(latestMessage(a)?.created_at || a.created_at || 0).getTime();
        const bTime = new Date(latestMessage(b)?.created_at || b.created_at || 0).getTime();
        return bTime - aTime;
      });
  }, [prospects, search]);

  const selected = prospects.find((prospect) => prospect.id === selectedId) || conversations[0];
  const messages = useMemo(
    () => (selected?.messages || [])
      .filter((message) => message.channel === 'whatsapp' && message.status !== 'draft')
      .sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()),
    [selected],
  );
  const allWhatsAppMessages = prospects.flatMap((prospect) => prospect.messages)
    .filter((message) => message.channel === 'whatsapp');
  const sent = allWhatsAppMessages.filter((message) => ['sent', 'delivered', 'read'].includes(message.status)).length;
  const delivered = allWhatsAppMessages.filter((message) => ['delivered', 'read'].includes(message.status)).length;
  const read = allWhatsAppMessages.filter((message) => message.status === 'read').length;
  const replies = allWhatsAppMessages.filter((message) => message.direction === 'inbound').length;
  const lastInbound = [...messages].reverse().find((message) => message.direction === 'inbound');
  const customerWindowOpen = Boolean(
    lastInbound?.created_at
    && Date.now() - new Date(lastInbound.created_at).getTime() < 24 * 60 * 60 * 1000,
  );
  const canSend = Boolean(selected?.phone && selected.whatsapp_opt_in && !selected.opted_out && body.trim());

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !canSend) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const result = await sendRekhaWhatsAppMessage(selected.id, body.trim());
      setBody('');
      setNotice(typeof result.delivery.message === 'string' ? result.delivery.message : 'WhatsApp message sent.');
      await load(true);
    } catch (sendError) {
      setError(readError(sendError));
    } finally {
      setSending(false);
    }
  }

  async function toggleAutoReply() {
    if (!overview) return;
    setSavingAutomation(true);
    setError('');
    try {
      await updateRekhaCampaign({
        ...overview.campaign,
        auto_reply_safe: !overview.campaign.auto_reply_safe,
      });
      setNotice(overview.campaign.auto_reply_safe ? 'Safe auto-replies paused.' : 'Safe auto-replies enabled.');
      await load(true);
    } catch (saveError) {
      setError(readError(saveError));
    } finally {
      setSavingAutomation(false);
    }
  }

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center"><LoaderCircle className="animate-spin" style={{ color: '#61E2B4' }} /></div>;
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-[.18em]" style={{ color: '#61E2B4' }}><Smartphone size={15} /> Rekha live channel</div>
          <h1 className="text-3xl font-semibold tracking-[-.04em]" style={{ color: '#F4F1EA' }}>WhatsApp command inbox</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6" style={{ color: '#92929B' }}>Generated leads, sent messages, incoming replies aur Rekha ke automated responses ek real-time workspace mein.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs" style={{ background: overview?.agent.whatsapp_ready ? 'rgba(74,222,128,.08)' : 'rgba(255,184,77,.08)', color: overview?.agent.whatsapp_ready ? '#63E494' : '#FFCB70', border: `1px solid ${overview?.agent.whatsapp_ready ? 'rgba(74,222,128,.18)' : 'rgba(255,184,77,.18)'}` }}><span className="h-2 w-2 rounded-full" style={{ background: 'currentColor' }} />{overview?.agent.whatsapp_ready ? 'Cloud API connected' : 'Cloud API setup pending'}</div>
          <button type="button" onClick={() => void load()} disabled={refreshing} className="rounded-xl p-2.5 disabled:opacity-50" style={{ color: '#A5A5AE', background: 'rgba(255,255,255,.04)' }} aria-label="Refresh WhatsApp inbox"><RefreshCw className={refreshing ? 'animate-spin' : ''} size={16} /></button>
        </div>
      </header>

      {(error || notice) && <div className="rounded-2xl px-4 py-3 text-sm" style={{ color: error ? '#FFB0B0' : '#A8EBCF', background: error ? 'rgba(255,90,90,.07)' : 'rgba(74,222,128,.07)', border: `1px solid ${error ? 'rgba(255,90,90,.16)' : 'rgba(74,222,128,.16)'}` }}>{error || notice}</div>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Sent', sent, Send, '#9BAEFF'],
          ['Delivered', delivered, CheckCheck, '#C4B5FD'],
          ['Read', read, ShieldCheck, '#75D8FF'],
          ['Replies', replies, MessageCircle, '#63E494'],
        ].map(([label, value, Icon, color]) => {
          const MetricIcon = Icon as typeof Send;
          return <div key={String(label)} className="surface-card p-5"><div className="flex items-center justify-between"><p className="text-xs uppercase tracking-[.12em]" style={{ color: '#707079' }}>{String(label)}</p><MetricIcon size={16} style={{ color: String(color) }} /></div><p className="mt-4 text-3xl font-semibold" style={{ color: '#F4F1EA' }}>{Number(value)}</p><p className="mt-1 text-xs" style={{ color: '#5F5F68' }}>Live provider data</p></div>;
        })}
      </section>

      <section className="grid min-h-[650px] overflow-hidden rounded-3xl xl:grid-cols-[360px_minmax(0,1fr)_300px]" style={{ background: 'rgba(18,18,23,.78)', border: '1px solid rgba(255,255,255,.07)' }}>
        <aside className="border-b xl:border-b-0 xl:border-r" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
          <div className="border-b p-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Lead conversations</p><p className="mt-1 text-xs" style={{ color: '#6F6F78' }}>{prospects.length} WhatsApp-ready numbers</p></div><Bot size={18} style={{ color: '#61E2B4' }} /></div>
            <label className="mt-4 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.06)' }}><Search size={14} style={{ color: '#666670' }} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search lead or number" className="min-w-0 flex-1 bg-transparent text-xs outline-none" style={{ color: '#E8E5DE' }} /></label>
          </div>
          <div className="max-h-[555px] overflow-y-auto">
            {conversations.map((prospect) => {
              const last = latestMessage(prospect);
              const active = prospect.id === selected?.id;
              return <button type="button" key={prospect.id} onClick={() => { setSelectedId(prospect.id); setNotice(''); }} className="w-full border-b p-4 text-left transition-colors" style={{ borderColor: 'rgba(255,255,255,.045)', background: active ? 'rgba(74,222,128,.065)' : 'transparent' }}><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold" style={{ color: '#B8F4D9', background: 'rgba(74,222,128,.1)' }}>{prospect.business_name.slice(0, 1).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium" style={{ color: '#ECE9E2' }}>{prospect.business_name}</p><span className="shrink-0 text-[10px]" style={{ color: '#5F5F68' }}>{messageTime(last)}</span></div><p className="mt-1 truncate text-xs" style={{ color: last?.direction === 'inbound' ? '#A8EBCF' : '#777780' }}>{last?.body || prospect.phone}</p><div className="mt-2 flex items-center gap-2"><span className="rounded-full px-2 py-0.5 text-[10px]" style={{ color: prospect.whatsapp_opt_in ? '#63E494' : '#FFCB70', background: prospect.whatsapp_opt_in ? 'rgba(74,222,128,.07)' : 'rgba(255,184,77,.07)' }}>{prospect.whatsapp_opt_in ? 'Opted in' : 'Consent needed'}</span>{prospect.requires_founder && <span className="text-[10px]" style={{ color: '#FFCB70' }}>Needs you</span>}</div></div></div></button>;
            })}
            {!conversations.length && <div className="px-6 py-16 text-center text-xs" style={{ color: '#666670' }}>No WhatsApp leads found.</div>}
          </div>
        </aside>

        <main className="flex min-w-0 flex-col border-b xl:border-b-0 xl:border-r" style={{ borderColor: 'rgba(255,255,255,.06)' }}>
          {!selected ? <div className="flex flex-1 items-center justify-center text-sm" style={{ color: '#666670' }}>Select a lead to open the conversation.</div> : <>
            <div className="flex items-center justify-between gap-4 border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(74,222,128,.1)', color: '#63E494' }}><UserRound size={18} /></div><div className="min-w-0"><p className="truncate text-sm font-medium" style={{ color: '#F4F1EA' }}>{selected.business_name}</p><p className="mt-1 truncate text-xs" style={{ color: '#777780' }}>{selected.phone} · {selected.location || 'Location unavailable'}</p></div></div><span className="rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[.1em]" style={{ color: customerWindowOpen ? '#63E494' : '#A5A5AE', background: customerWindowOpen ? 'rgba(74,222,128,.08)' : 'rgba(255,255,255,.04)' }}>{customerWindowOpen ? '24h reply window open' : 'Template mode'}</span></div>
            <div className="flex-1 space-y-3 overflow-y-auto p-5" style={{ minHeight: 430, background: 'radial-gradient(circle at 80% 10%,rgba(74,222,128,.035),transparent 32%)' }}>
              {messages.map((message) => <div key={message.id} className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}><div className="max-w-[82%] rounded-2xl px-4 py-3" style={{ color: '#E9E6DF', background: message.direction === 'outbound' ? 'rgba(41,112,82,.42)' : 'rgba(255,255,255,.055)', border: '1px solid rgba(255,255,255,.06)', borderBottomRightRadius: message.direction === 'outbound' ? 4 : undefined, borderBottomLeftRadius: message.direction === 'inbound' ? 4 : undefined }}><p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p><div className="mt-1.5 flex items-center justify-end gap-1.5 text-[10px]" style={{ color: '#7F8581' }}><span>{messageTime(message)}</span><StatusIcon message={message} /></div>{message.error_message && <p className="mt-2 text-[10px]" style={{ color: '#FF9B9B' }}>{message.error_message}</p>}</div></div>)}
              {!messages.length && <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center"><MessageCircle size={26} style={{ color: '#4F5D56' }} /><p className="mt-3 text-sm" style={{ color: '#7C827F' }}>Conversation abhi start nahi hui.</p><p className="mt-1 max-w-xs text-xs leading-5" style={{ color: '#575D5A' }}>Recorded consent hone par Rekha approved template se first message bhej sakti hai.</p></div>}
            </div>
            <form onSubmit={handleSend} className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,.06)' }}><div className="flex items-end gap-3 rounded-2xl p-2" style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.07)' }}><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} maxLength={4096} placeholder={selected.opted_out ? 'This lead opted out' : selected.whatsapp_opt_in ? 'Message as Rekha…' : 'Recorded WhatsApp consent is required'} disabled={!selected.whatsapp_opt_in || selected.opted_out} className="min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 outline-none disabled:cursor-not-allowed" style={{ color: '#F0EDE6' }} /><button type="submit" disabled={!canSend || sending || !overview?.agent.whatsapp_ready} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-30" style={{ color: '#07150F', background: '#63E494' }}>{sending ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}</button></div><div className="mt-2 flex items-center justify-between gap-3 px-1 text-[10px]" style={{ color: '#5F5F68' }}><span>{customerWindowOpen ? 'Free-form reply inside Meta customer-service window' : 'Approved template is used outside the 24-hour window'}</span><span>{body.length}/4096</span></div></form>
          </>}
        </main>

        <aside className="p-5">
          <div className="flex items-center justify-between"><div><p className="text-sm font-medium" style={{ color: '#F4F1EA' }}>Rekha control</p><p className="mt-1 text-xs" style={{ color: '#6F6F78' }}>Live conversation automation</p></div><Bot size={18} style={{ color: '#61E2B4' }} /></div>
          <div className="mt-5 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,.025)', border: '1px solid rgba(255,255,255,.06)' }}><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium" style={{ color: '#D8D5CE' }}>Safe auto-replies</p><p className="mt-1 text-[10px] leading-4" style={{ color: '#666670' }}>Known answers only; uncertain questions founder ko escalate hongi.</p></div><button type="button" onClick={() => void toggleAutoReply()} disabled={!overview || savingAutomation} className="relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50" style={{ background: overview?.campaign.auto_reply_safe ? '#3ECF8E' : '#34343B' }} aria-label="Toggle safe WhatsApp auto replies"><span className="absolute top-1 h-4 w-4 rounded-full bg-white transition-all" style={{ left: overview?.campaign.auto_reply_safe ? 24 : 4 }} /></button></div></div>
          <div className="mt-4 space-y-3">
            {[
              ['Cloud API', overview?.agent.whatsapp_ready, 'Meta sender + token'],
              ['Rekha active', overview?.campaign.is_active, 'Master campaign switch'],
              ['Auto reply', overview?.campaign.auto_reply_safe, 'Safe intents only'],
              ['Auto sending', overview?.agent.auto_send_enabled, 'Production kill switch'],
            ].map(([label, ready, note]) => <div key={String(label)} className="flex items-center gap-3 rounded-xl p-3" style={{ background: 'rgba(255,255,255,.02)', border: '1px solid rgba(255,255,255,.05)' }}><span className="h-2 w-2 rounded-full" style={{ background: ready ? '#63E494' : '#55555E' }} /><div><p className="text-xs" style={{ color: ready ? '#D8D5CE' : '#888891' }}>{String(label)}</p><p className="mt-0.5 text-[10px]" style={{ color: '#55555E' }}>{String(note)}</p></div></div>)}
          </div>
          {selected && <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,.06)' }}><p className="text-[10px] uppercase tracking-[.14em]" style={{ color: '#5F5F68' }}>Selected lead</p><dl className="mt-3 space-y-3 text-xs"><div><dt style={{ color: '#666670' }}>Fit score</dt><dd className="mt-1" style={{ color: selected.fit_score >= 80 ? '#63E494' : '#FFCB70' }}>{selected.fit_score}/100</dd></div><div><dt style={{ color: '#666670' }}>Language</dt><dd className="mt-1 capitalize" style={{ color: '#C8C4BC' }}>{selected.language_preference}</dd></div><div><dt style={{ color: '#666670' }}>Intent</dt><dd className="mt-1 capitalize" style={{ color: '#C8C4BC' }}>{(selected.last_intent || selected.status).replaceAll('_', ' ')}</dd></div></dl></div>}
          <div className="mt-5 rounded-2xl p-4" style={{ color: '#8B8270', background: 'rgba(255,184,77,.055)', border: '1px solid rgba(255,184,77,.12)' }}><div className="flex gap-2"><ShieldCheck className="mt-0.5 shrink-0" size={15} /><p className="text-[10px] leading-5">Publicly found number opt-in nahi hota. First automated WhatsApp outreach sirf recorded consent/approved source par send hoga; inbound reply ke baad Rekha live conversation continue karegi.</p></div></div>
        </aside>
      </section>
    </div>
  );
}
