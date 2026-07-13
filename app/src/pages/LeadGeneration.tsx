import { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  Check,
  Download,
  ExternalLink,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  getAdminTenants,
  importFreeBusinessLeads,
  searchFreeBusinessLeads,
  type AdminTenant,
  type FreeLeadCandidate,
  type FreeLeadSearchResponse,
} from '@/lib/adminApi';


const industrySuggestions = [
  { label: 'Real Estate — agents, builders & property firms', value: 'Real Estate Agents' },
  { label: 'Healthcare — clinics, doctors & pharmacies', value: 'Healthcare' },
  { label: 'Education — schools, colleges & training', value: 'Education' },
  { label: 'Retail — stores & local shops', value: 'Retail Shops' },
  { label: 'Local Businesses — broad discovery', value: 'Local Businesses' },
  { label: 'Restaurants & Cafes', value: 'Restaurants' },
  { label: 'Fitness Centres & Gyms', value: 'Gyms' },
  { label: 'Hotels & Guest Houses', value: 'Hotels' },
  { label: 'Salons & Beauty', value: 'Salons' },
  { label: 'Automotive', value: 'Automotive' },
  { label: 'Professional Services', value: 'Professional Services' },
];


function readError(error: unknown): string {
  if (!(error instanceof Error)) return 'Something went wrong. Please retry.';
  try {
    const parsed = JSON.parse(error.message) as { detail?: string };
    return parsed.detail || error.message;
  } catch {
    return error.message;
  }
}


function csvCell(value: unknown): string {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}


function downloadCsv(candidates: FreeLeadCandidate[]) {
  const headers = ['Business', 'Category', 'Score', 'Phone', 'Email', 'Website', 'Address', 'Source URL'];
  const rows = candidates.map((lead) => [
    lead.name,
    lead.category,
    lead.score,
    lead.phone,
    lead.email,
    lead.website,
    lead.address,
    lead.source_url,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `mme-ai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}


export default function LeadGeneration() {
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [tenantId, setTenantId] = useState('');
  const [industry, setIndustry] = useState('Real Estate Agents');
  const [location, setLocation] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [limit, setLimit] = useState(25);
  const [minimumScore, setMinimumScore] = useState(0);
  const [contactOnly, setContactOnly] = useState(false);
  const [result, setResult] = useState<FreeLeadSearchResponse | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loadingTenants, setLoadingTenants] = useState(true);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getAdminTenants()
      .then((data) => {
        const active = data.filter((tenant) => tenant.is_active);
        setTenants(active);
        if (active.length === 1) setTenantId(active[0].id);
      })
      .catch((loadError) => setError(readError(loadError)))
      .finally(() => setLoadingTenants(false));
  }, []);

  const selectedCandidates = useMemo(
    () => (result?.candidates || []).filter((candidate) => selectedIds.has(candidate.id)),
    [result, selectedIds],
  );

  const visibleCandidates = useMemo(
    () => (result?.candidates || []).filter((candidate) =>
      candidate.score >= minimumScore
      && (!contactOnly || Boolean(candidate.phone || candidate.email)),
    ),
    [contactOnly, minimumScore, result],
  );

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSearching(true);
    try {
      const data = await searchFreeBusinessLeads({
        industry: industry.trim(),
        location: location.trim(),
        radius_km: radiusKm,
        limit,
      });
      setResult(data);
      setSelectedIds(new Set(data.candidates.filter((candidate) => candidate.score >= 60).map((candidate) => candidate.id)));
    } catch (searchError) {
      setResult(null);
      setSelectedIds(new Set());
      setError(readError(searchError));
    } finally {
      setSearching(false);
    }
  }

  function toggleCandidate(candidateId: string) {
    setSelectedIds((current) => {
      const updated = new Set(current);
      if (updated.has(candidateId)) updated.delete(candidateId);
      else updated.add(candidateId);
      return updated;
    });
  }

  function toggleAll() {
    if (!result) return;
    setSelectedIds((current) =>
      visibleCandidates.every((candidate) => current.has(candidate.id))
        ? new Set()
        : new Set(visibleCandidates.map((candidate) => candidate.id)),
    );
  }

  async function handleImport() {
    if (!tenantId) {
      setError('Pehle client company select karo.');
      return;
    }
    if (!selectedCandidates.length) {
      setError('Import ke liye kam se kam ek lead select karo.');
      return;
    }

    setError('');
    setSuccess('');
    setImporting(true);
    try {
      const imported = await importFreeBusinessLeads(tenantId, selectedCandidates);
      setSuccess(imported.message);
      setSelectedIds((current) => {
        const updated = new Set(current);
        selectedCandidates.forEach((candidate) => updated.delete(candidate.id));
        return updated;
      });
    } catch (importError) {
      setError(readError(importError));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-[0.18em]" style={{ color: '#6B8AFF' }}>
            <Bot size={15} /> Free Agent · No paid API key
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#F0EDE6' }}>Lead Generation Agent</h1>
          <p className="mt-2 max-w-3xl text-sm" style={{ color: '#8A8A93' }}>
            Public business listings discover karo, contact completeness ke basis par score karo, review karo aur selected client ke CRM mein import karo.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-xs" style={{ background: 'rgba(74, 222, 128, 0.08)', border: '1px solid rgba(74, 222, 128, 0.18)', color: '#4ADE80' }}>
          <ShieldCheck size={16} /> Review-first workflow · No auto outreach
        </div>
      </div>

      <form onSubmit={handleSearch} className="surface-card grid gap-4 p-5 lg:grid-cols-12">
        <label className="space-y-2 lg:col-span-3">
          <span className="text-xs font-medium" style={{ color: '#8A8A93' }}>Industry / niche</span>
          <select
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6' }}
          >
            {industrySuggestions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>

        <label className="space-y-2 lg:col-span-3">
          <span className="text-xs font-medium" style={{ color: '#8A8A93' }}>Location</span>
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            minLength={2}
            maxLength={160}
            required
            className="w-full rounded-xl px-4 py-3 text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6' }}
            placeholder="e.g. Raipur, Chhattisgarh"
          />
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-xs font-medium" style={{ color: '#8A8A93' }}>Radius</span>
          <select value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6' }}>
            {[2, 5, 10, 15, 25].map((value) => <option value={value} key={value}>{value} km</option>)}
          </select>
        </label>

        <label className="space-y-2 lg:col-span-2">
          <span className="text-xs font-medium" style={{ color: '#8A8A93' }}>Max results</span>
          <select value={limit} onChange={(event) => setLimit(Number(event.target.value))} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6' }}>
            {[10, 25, 50].map((value) => <option value={value} key={value}>{value} leads</option>)}
          </select>
        </label>

        <div className="flex items-end lg:col-span-2">
          <button type="submit" disabled={searching} className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-60" style={{ background: '#6B8AFF', color: '#F0EDE6' }}>
            {searching ? <LoaderCircle className="animate-spin" size={17} /> : <Search size={17} />}
            {searching ? 'Agent running...' : 'Generate leads'}
          </button>
        </div>
      </form>

      {(error || success) && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ background: error ? 'rgba(255,90,90,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${error ? 'rgba(255,90,90,0.2)' : 'rgba(74,222,128,0.2)'}`, color: error ? '#FF8A8A' : '#4ADE80' }}>
          {error || success}
        </div>
      )}

      {result && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="surface-card p-5"><p className="text-xs" style={{ color: '#8A8A93' }}>Discovered</p><p className="mt-2 text-3xl font-bold" style={{ color: '#F0EDE6' }}>{result.result_count}</p></div>
            <div className="surface-card p-5"><p className="text-xs" style={{ color: '#8A8A93' }}>Selected for CRM</p><p className="mt-2 text-3xl font-bold" style={{ color: '#6B8AFF' }}>{selectedCandidates.length}</p></div>
            <div className="surface-card p-5"><p className="text-xs" style={{ color: '#8A8A93' }}>High-quality (70+)</p><p className="mt-2 text-3xl font-bold" style={{ color: '#4ADE80' }}>{result.candidates.filter((lead) => lead.score >= 70).length}</p></div>
          </div>

          <div className="surface-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b px-5 py-4 lg:flex-row lg:items-center lg:justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div>
                <div className="flex items-center gap-2 text-sm font-medium" style={{ color: '#F0EDE6' }}><Sparkles size={16} style={{ color: '#6B8AFF' }} /> Agent results</div>
                <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: '#8A8A93' }}><MapPin size={12} /> {result.resolved_location} · {result.radius_km} km</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <select value={tenantId} onChange={(event) => setTenantId(event.target.value)} disabled={loadingTenants} className="rounded-xl px-3 py-2 text-sm outline-none" style={{ background: '#121218', border: '1px solid rgba(255,255,255,0.08)', color: '#F0EDE6' }}>
                  <option value="">Select client CRM</option>
                  {tenants.map((tenant) => <option value={tenant.id} key={tenant.id}>{tenant.name}</option>)}
                </select>
                <button type="button" onClick={() => downloadCsv(selectedCandidates.length ? selectedCandidates : visibleCandidates)} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#F0EDE6', border: '1px solid rgba(255,255,255,0.08)' }}><Download size={15} /> CSV</button>
                <button type="button" onClick={handleImport} disabled={importing || !selectedCandidates.length} className="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-50" style={{ background: '#4ADE80', color: '#0A0A0F' }}>
                  {importing ? <LoaderCircle className="animate-spin" size={15} /> : <Upload size={15} />}
                  Import {selectedCandidates.length || ''} to CRM
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3" style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
              <span className="text-xs" style={{ color: '#6C6C75' }}>Quality filter</span>
              {[0, 60, 70, 85].map((score) => (
                <button key={score} type="button" onClick={() => setMinimumScore(score)} className="rounded-full px-3 py-1.5 text-xs" style={{ background: minimumScore === score ? 'rgba(107,138,255,.16)' : 'rgba(255,255,255,.04)', color: minimumScore === score ? '#9BAEFF' : '#8A8A93', border: `1px solid ${minimumScore === score ? 'rgba(107,138,255,.28)' : 'rgba(255,255,255,.06)'}` }}>
                  {score ? `${score}+ score` : 'All'}
                </button>
              ))}
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs" style={{ color: '#8A8A93' }}>
                <input type="checkbox" checked={contactOnly} onChange={(event) => setContactOnly(event.target.checked)} /> Contactable only
              </label>
              <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>{visibleCandidates.length} visible</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead><tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <th className="px-5 py-3 text-left"><button type="button" onClick={toggleAll} className="flex h-5 w-5 items-center justify-center rounded" style={{ background: visibleCandidates.length && visibleCandidates.every((candidate) => selectedIds.has(candidate.id)) ? '#6B8AFF' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}>{visibleCandidates.length && visibleCandidates.every((candidate) => selectedIds.has(candidate.id)) ? <Check size={13} color="white" /> : null}</button></th>
                  {['Business', 'Score', 'Contact', 'Website', 'Address', 'Source'].map((heading) => <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#8A8A93' }} key={heading}>{heading}</th>)}
                </tr></thead>
                <tbody>
                  {visibleCandidates.map((lead) => (
                    <tr key={lead.id} className="border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                      <td className="px-5 py-4"><button type="button" onClick={() => toggleCandidate(lead.id)} className="flex h-5 w-5 items-center justify-center rounded" style={{ background: selectedIds.has(lead.id) ? '#6B8AFF' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}>{selectedIds.has(lead.id) ? <Check size={13} color="white" /> : null}</button></td>
                      <td className="px-4 py-4"><p className="text-sm font-medium" style={{ color: '#F0EDE6' }}>{lead.name}</p><p className="mt-1 text-xs" style={{ color: '#8A8A93' }}>{lead.category}</p></td>
                      <td className="px-4 py-4"><span className="rounded-full px-2.5 py-1 text-xs font-mono" style={{ background: lead.score >= 70 ? 'rgba(74,222,128,0.12)' : 'rgba(255,184,77,0.12)', color: lead.score >= 70 ? '#4ADE80' : '#FFB84D' }}>{lead.score}/100</span></td>
                      <td className="px-4 py-4 text-xs" style={{ color: '#C8C5BE' }}>
                        <div className="space-y-1">{lead.phone ? <div className="flex items-center gap-1.5"><Phone size={12} /> {lead.phone}</div> : null}{lead.email ? <div className="flex items-center gap-1.5"><Mail size={12} /> {lead.email}</div> : null}{!lead.phone && !lead.email ? <span style={{ color: '#55555C' }}>Not listed</span> : null}</div>
                      </td>
                      <td className="px-4 py-4 text-xs">{lead.website ? <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: '#6B8AFF' }}>Visit <ExternalLink size={11} /></a> : <span style={{ color: '#55555C' }}>Not listed</span>}</td>
                      <td className="max-w-[260px] px-4 py-4 text-xs" style={{ color: '#8A8A93' }}>{lead.address || 'Not listed'}</td>
                      <td className="px-4 py-4 text-xs"><a href={lead.source_url} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: '#8A8A93' }}>OSM <ExternalLink size={11} /></a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!visibleCandidates.length && <div className="px-5 py-14 text-center text-sm" style={{ color: '#8A8A93' }}>Current quality filters ke andar leads nahi mili. Filters relax karo, radius badhao ya location change karo.</div>}
            <div className="border-t px-5 py-3 text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)', color: '#55555C' }}>
              Data: {result.provider}. Usage must follow local outreach laws and platform attribution requirements. <a href={result.attribution_url} target="_blank" rel="noreferrer" style={{ color: '#6B8AFF' }}>© OpenStreetMap contributors</a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
