import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react';
import FounderLogo from '@/components/FounderLogo';
import { FOUNDER_BRANDING } from '@/lib/founderBranding';
import { resetFounderPassword } from '@/lib/adminApi';

function getErrorMessage(err: unknown, fallback: string) {
  if (!(err instanceof Error)) return fallback;

  try {
    const parsed = JSON.parse(err.message);
    return parsed.detail || fallback;
  } catch {
    return err.message || fallback;
  }
}

export default function FounderResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : 'Reset token is missing or invalid.');
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (!token) {
        setError('Reset token is missing or invalid.');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const response = await resetFounderPassword(token, password);

      setSuccess(response.message || 'Password reset successfully.');
      setPassword('');
      setConfirmPassword('');

      window.setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 1800);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reset password.'));
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
              Founder password reset
            </p>
          </div>
        </div>

        <div className="mb-6">
          <div
            className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1"
            style={{ background: 'rgba(107, 138, 255, 0.08)', border: '1px solid rgba(107, 138, 255, 0.16)' }}
          >
            <ShieldCheck size={14} style={{ color: '#6B8AFF' }} />
            <span className="text-xs font-mono" style={{ color: '#6B8AFF' }}>Secure reset link</span>
          </div>

          <h2 className="font-display text-3xl font-medium tracking-[-0.03em]" style={{ color: '#F0EDE6' }}>
            Set new password
          </h2>
          <p className="mt-2 text-sm" style={{ color: '#8A8A93' }}>
            Reset links expire after 30 minutes. Use a strong password for founder access.
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

        {success && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: '#4ADE80',
              background: 'rgba(74, 222, 128, 0.08)',
              border: '1px solid rgba(74, 222, 128, 0.18)',
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
              NEW PASSWORD
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-dark w-full py-3 pl-10 pr-12 text-sm"
                placeholder="Enter new founder password"
                required
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
                style={{ color: '#8A8A93' }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-mono" style={{ color: '#8A8A93' }}>
              CONFIRM PASSWORD
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#55555C' }} />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-dark w-full py-3 pl-10 pr-12 text-sm"
                placeholder="Confirm new password"
                required
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 transition-colors"
                style={{ color: '#8A8A93' }}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: 'linear-gradient(135deg, #6B8AFF, #4A6BFF)',
              color: '#FFFFFF',
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Resetting password...' : 'Reset Founder Password'}
          </button>
        </form>

        <Link
          to="/admin/login"
          className="mt-5 block text-center text-sm transition-colors"
          style={{ color: '#8A8A93' }}
        >
          Back to founder login
        </Link>
      </div>
    </div>
  );
}
