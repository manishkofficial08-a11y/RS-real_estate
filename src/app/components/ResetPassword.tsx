import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, Building2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { resetClientPassword } from "../lib/clientApi";

type ResetPasswordProps = {
  darkMode: boolean;
  token: string;
  onBackToLogin: () => void;
};

export function ResetPassword({ darkMode, token, onBackToLogin }: ResetPasswordProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Reset link is missing or invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await resetClientPassword({ token, password });

      setMessage(response.message || "Password reset successfully. You can now login.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center px-6"
      style={{
        background: darkMode
          ? "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 35%), #02020f"
          : "linear-gradient(135deg, #eef2ff, #ffffff)",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md rounded-3xl p-8"
        style={{
          background: darkMode ? "rgba(10,10,30,0.86)" : "rgba(255,255,255,0.92)",
          border: darkMode ? "1px solid rgba(99,102,241,0.18)" : "1px solid rgba(15,23,42,0.08)",
          boxShadow: darkMode ? "0 24px 80px rgba(0,0,0,0.5)" : "0 24px 80px rgba(15,23,42,0.14)",
          backdropFilter: "blur(24px)",
        }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
            }}
          >
            <Building2 size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em]" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
              RS Real Estate Portal
            </h1>
            <p className="text-sm" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              Secure password reset
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]" style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>
            Set new password
          </h2>
          <p className="mt-2 text-sm" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
            Create a new password for your account.
          </p>
        </div>

        {error && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#fb7185",
              background: "rgba(244, 63, 94, 0.08)",
              border: "1px solid rgba(244, 63, 94, 0.18)",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#10b981",
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.18)",
            }}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em]" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              New password
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border py-3 pl-10 pr-12 text-sm outline-none"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.75)" : "#ffffff",
                  borderColor: darkMode ? "rgba(99,102,241,0.18)" : "rgba(15,23,42,0.1)",
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 transition-all hover:opacity-80"
                style={{ color: "#64748b" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em]" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              Confirm password
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border py-3 pl-10 pr-4 text-sm outline-none"
                style={{
                  background: darkMode ? "rgba(15,23,42,0.75)" : "#ffffff",
                  borderColor: darkMode ? "rgba(99,102,241,0.18)" : "rgba(15,23,42,0.1)",
                  color: darkMode ? "#e2e8f0" : "#0f172a",
                }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || Boolean(message)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
              boxShadow: "0 12px 32px rgba(99,102,241,0.28)",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Resetting password..." : "Reset password"}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: darkMode ? "rgba(15,23,42,0.45)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.18)" : "rgba(15,23,42,0.1)",
              color: darkMode ? "#e2e8f0" : "#0f172a",
            }}
          >
            <ArrowLeft size={15} />
            Back to login
          </button>
        </form>
      </motion.div>
    </div>
  );
}
