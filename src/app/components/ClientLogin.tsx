import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import { Building2, Loader2, Lock, Mail } from "lucide-react";
import { loginClient } from "../lib/clientApi";

type ClientLoginProps = {
  darkMode: boolean;
  onLoginSuccess: () => void;
};

export function ClientLogin({ darkMode, onLoginSuccess }: ClientLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("test123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await loginClient(email, password);

      onLoginSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
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
              RS Real Estate Workspace
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-semibold tracking-[-0.04em]" style={{ color: darkMode ? "#f8fafc" : "#0f172a" }}>
            Welcome back
          </h2>
          <p className="mt-2 text-sm" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
            Login to manage leads, properties, content and automation.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em]" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              Email
            </label>

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.18em]" style={{ color: darkMode ? "#64748b" : "#64748b" }}>
              Password
            </label>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#64748b" }} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
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
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#ffffff",
              boxShadow: "0 12px 32px rgba(99,102,241,0.28)",
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Signing in..." : "Login to Workspace"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
