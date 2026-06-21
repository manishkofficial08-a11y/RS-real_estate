import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, Eye, EyeOff, HelpCircle } from 'lucide-react';
import FounderLogo from '@/components/FounderLogo';
import { FOUNDER_BRANDING } from '@/lib/founderBranding';
import { isFounderLoggedIn, loginFounder } from '@/lib/adminApi';

export default function FounderLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(FOUNDER_BRANDING.supportEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  if (isFounderLoggedIn()) {
    return <Navigate to="/admin/overview" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setNotice(null);

      await loginFounder(email, password);

      navigate('/admin/overview', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      try {
        const parsed = JSON.parse(message);
        setError(parsed.detail || message);
      } catch {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background:
          'radial-gradient(circle at top left, rgba(107, 138, 255, 0.18), transparent 35%), #0A0A0F',
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(24px)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)',
        }}
      >
        <div className="mb-8 flex items-center gap-3">
          <FounderLogo size={42} />

          <div>
            <h1 className="font-display text-2xl font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
              {FOUNDER_BRANDING.companyName}
            </h1>
            <p className="text-sm" style={{ color: '#8A8A93' }}>
              {FOUNDER_BRANDING.appLabel}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="font-display text-3xl font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Welcome back
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#8A8A93' }}>
            Login to manage companies, users, leads and platform analytics.
          </p>
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

        {notice && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: '#6B8AFF',
              background: 'rgba(107, 138, 255, 0.08)',
              border: '1px solid rgba(107, 138, 255, 0.18)',
            }}
          >
            {notice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
              EMAIL
            </label>

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="input-dark w-full py-3 pl-10 pr-4 text-sm"
                placeholder={FOUNDER_BRANDING.supportEmail}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
              PASSWORD
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-dark w-full py-3 pl-10 pr-12 text-sm"
                placeholder="Enter founder password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
                style={{ color: '#8A8A93' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setNotice('Founder password reset is intentionally restricted. Use the secure admin reset utility for now; SMTP-backed founder reset can be enabled as a separate backend task.');
            }}
            className="inline-flex items-center gap-2 text-xs transition-colors"
            style={{ color: '#8A8A93' }}
          >
            <HelpCircle size={14} />
            Forgot password?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
              color: '#FFFFFF',
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Signing in...' : 'Login to Founder Dashboard'}
          </button>
        </form>

        <div
          className="mt-6 rounded-xl px-4 py-3 text-xs leading-relaxed"
          style={{
            color: '#55555C',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          Founder access is restricted to authorized MMe-AI operators only.
        </div>
      </div>
    </div>
  );
}
