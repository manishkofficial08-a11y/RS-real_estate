import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  LoaderCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import {
  getRekhaAssistantHistory,
  getRekhaAssistantSnapshot,
  sendRekhaAssistantCommand,
  type RekhaAssistantMessage,
  type RekhaOperationsSnapshot,
} from '@/lib/adminApi';

const quickActions = [
  'Aaj ka founder brief do',
  'Sales pipeline batao',
  'Urgent support dikhao',
  'Due follow-ups process karo',
  'New leads khojo',
];

function readError(error: unknown) {
  if (!(error instanceof Error)) return 'Rekha abhi respond nahi kar pa rahi.';
  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    return parsed.detail || error.message;
  } catch {
    return error.message;
  }
}

export default function RekhaCommandCenter() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<RekhaAssistantMessage[]>([]);
  const [snapshot, setSnapshot] = useState<RekhaOperationsSnapshot | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || loaded) return;
    let alive = true;
    setInitializing(true);
    Promise.all([getRekhaAssistantHistory(), getRekhaAssistantSnapshot()])
      .then(([history, current]) => {
        if (!alive) return;
        setMessages(history);
        setSnapshot(current);
        setLoaded(true);
      })
      .catch((loadError) => alive && setError(readError(loadError)))
      .finally(() => alive && setInitializing(false));
    return () => { alive = false; };
  }, [loaded, open]);

  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function submit(command?: string) {
    const text = (command || input).trim();
    if (!text || loading) return;
    setInput('');
    setError('');
    setLoading(true);
    const optimistic: RekhaAssistantMessage = {
      id: `pending-${Date.now()}`,
      role: 'user',
      content: text,
      metadata: {},
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, optimistic]);
    try {
      const response = await sendRekhaAssistantCommand(text);
      setMessages((current) => [
        ...current.filter((message) => message.id !== optimistic.id),
        ...response.messages,
      ]);
      setSnapshot(response.snapshot);
    } catch (sendError) {
      setMessages((current) => current.filter((message) => message.id !== optimistic.id));
      setError(readError(sendError));
    } finally {
      setLoading(false);
    }
  }

  const criticalCount = (snapshot?.support.urgent || 0)
    + (snapshot?.sales.needs_founder || 0)
    + (snapshot?.subscriptions.past_due || 0)
    + (snapshot?.ai_jobs.failed || 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[75] flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:-translate-y-0.5"
        style={{
          color: '#F7F4ED',
          background: 'linear-gradient(135deg,rgba(98,72,170,.98),rgba(45,116,91,.98))',
          border: '1px solid rgba(255,255,255,.16)',
          boxShadow: '0 20px 55px rgba(0,0,0,.42)',
        }}
        aria-label="Open Rekha digital assistant"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,.12)' }}>
          <Sparkles size={18} />
          {criticalCount > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#FF8A8A] px-1 text-[10px] font-bold text-[#210909]">{criticalCount > 9 ? '9+' : criticalCount}</span>}
        </span>
        <span className="hidden text-left sm:block"><span className="block text-sm font-semibold">Ask Rekha</span><span className="block text-[10px] text-white/65">Digital operations assistant</span></span>
      </button>

      {open && <>
        <button type="button" onClick={() => setOpen(false)} className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-[2px]" aria-label="Close Rekha assistant overlay" />
        <section className="fixed inset-x-3 bottom-3 top-3 z-[85] flex flex-col overflow-hidden rounded-[28px] sm:left-auto sm:w-[480px]" style={{ background: 'rgba(12,12,18,.985)', border: '1px solid rgba(255,255,255,.1)', boxShadow: '0 30px 100px rgba(0,0,0,.58)' }} aria-label="Rekha digital operations assistant">
          <header className="border-b px-5 py-4" style={{ borderColor: 'rgba(255,255,255,.07)', background: 'linear-gradient(135deg,rgba(108,78,185,.16),rgba(54,152,113,.08))' }}>
            <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ color: '#DCCEFF', background: 'rgba(167,139,250,.14)', border: '1px solid rgba(167,139,250,.2)' }}><Bot size={21} /></div><div><div className="flex items-center gap-2"><h2 className="text-base font-semibold text-[#F5F2EB]">Rekha</h2><span className="rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[.12em]" style={{ color: '#76E6B6', background: 'rgba(74,222,128,.08)' }}>online</span></div><p className="mt-1 text-[11px] text-[#777780]">MMe-AI digital operations assistant</p></div></div><button type="button" onClick={() => setOpen(false)} className="rounded-xl p-2 text-[#777780] hover:bg-white/5" aria-label="Close Rekha"><X size={18} /></button></div>
            {snapshot && <div className="mt-4 grid grid-cols-4 gap-2">{[
              ['Leads', snapshot.sales.total_prospects],
              ['Replies', snapshot.sales.replies_today],
              ['Support', snapshot.support.open],
              ['Active', snapshot.subscriptions.active],
            ].map(([label, value]) => <div key={String(label)} className="rounded-xl px-2 py-2 text-center" style={{ background: 'rgba(255,255,255,.035)', border: '1px solid rgba(255,255,255,.045)' }}><p className="text-sm font-semibold text-[#ECE9E2]">{Number(value)}</p><p className="mt-0.5 text-[9px] uppercase tracking-[.1em] text-[#62626B]">{String(label)}</p></div>)}</div>}
          </header>

          <div ref={timelineRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {initializing && <div className="flex h-full items-center justify-center"><LoaderCircle className="animate-spin text-[#A78BFA]" size={22} /></div>}
            {!initializing && !messages.length && <div className="rounded-2xl p-4" style={{ color: '#CBC7BF', background: 'rgba(167,139,250,.055)', border: '1px solid rgba(167,139,250,.1)' }}><div className="flex gap-3"><Sparkles className="mt-0.5 shrink-0 text-[#A78BFA]" size={17} /><div><p className="text-sm font-medium text-[#EEEAE2]">Haan Manish, bolo.</p><p className="mt-1 text-xs leading-5 text-[#8D8991]">Main sales, WhatsApp, demos, support, subscriptions aur AI jobs ka live dashboard context dekh sakti hoon. Safe operational commands yahin se chala sakte ho.</p></div></div></div>}
            {messages.map((message) => <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className="max-w-[88%] rounded-2xl px-4 py-3" style={{ color: '#EDE9E1', background: message.role === 'user' ? 'linear-gradient(135deg,rgba(107,82,175,.72),rgba(77,64,122,.72))' : 'rgba(255,255,255,.045)', border: '1px solid rgba(255,255,255,.06)', borderBottomRightRadius: message.role === 'user' ? 5 : undefined, borderBottomLeftRadius: message.role === 'assistant' ? 5 : undefined }}><p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>{message.role === 'assistant' && message.action_name && <div className="mt-3 flex items-center gap-1.5 border-t pt-2 text-[10px]" style={{ color: message.action_status === 'completed' ? '#76E6B6' : '#FFCB70', borderColor: 'rgba(255,255,255,.08)' }}>{message.action_status === 'completed' ? <CheckCircle2 size={12} /> : <CircleAlert size={12} />}{message.action_name.replaceAll('_', ' ')}</div>}</div></div>)}
            {loading && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl px-4 py-3 text-xs text-[#8D8991]" style={{ background: 'rgba(255,255,255,.04)' }}><LoaderCircle className="animate-spin" size={14} /> Rekha soch rahi hai…</div></div>}
            {error && <div className="rounded-xl px-3 py-2 text-xs" style={{ color: '#FFAAAA', background: 'rgba(255,90,90,.07)', border: '1px solid rgba(255,90,90,.12)' }}>{error}</div>}
          </div>

          <div className="border-t p-4" style={{ borderColor: 'rgba(255,255,255,.07)' }}>
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">{quickActions.map((action) => <button key={action} type="button" disabled={loading} onClick={() => void submit(action)} className="shrink-0 rounded-full px-3 py-1.5 text-[10px] disabled:opacity-40" style={{ color: '#BFB4DE', background: 'rgba(167,139,250,.07)', border: '1px solid rgba(167,139,250,.12)' }}>{action}</button>)}</div>
            <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="flex items-end gap-2 rounded-2xl p-2" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit(); } }} rows={2} maxLength={4000} placeholder="Rekha, aaj mujhe kya handle karna hai?" className="min-h-[46px] flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-5 text-[#F0EDE6] outline-none placeholder:text-[#55555E]" /><button type="submit" disabled={!input.trim() || loading} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl disabled:opacity-30" style={{ color: '#100B1B', background: 'linear-gradient(135deg,#C4B5FD,#76E6B6)' }}>{loading ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}</button></form>
            <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-[#4F4F58]"><ChevronDown size={10} /> Rekha reports facts; commitments and sensitive decisions remain founder-controlled.</p>
          </div>
        </section>
      </>}
    </>
  );
}
