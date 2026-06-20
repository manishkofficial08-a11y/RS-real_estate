import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MailPlus,
  RefreshCw,
  ShieldCheck,
  UserMinus,
  Users2,
  X,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  cancelClientTeamInvitation,
  deactivateClientTeamMember,
  getClientProfile,
  getClientTeamInvitations,
  getClientTeamMembers,
  inviteClientTeamMember,
  updateClientTeamMember,
  type ClientProfile,
  type ClientTeamInvitation,
  type ClientTeamMember,
  type ClientTeamRole,
} from "../lib/clientApi";

interface TeamManagementProps {
  darkMode: boolean;
}

const roles: Array<{ value: ClientTeamRole; label: string }> = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "marketer", label: "Marketer" },
  { value: "sales", label: "Sales" },
  { value: "viewer", label: "Viewer" },
];

const roleColors: Record<ClientTeamRole, string> = {
  owner: "#2563EB",
  admin: "#1D4ED8",
  marketer: "#ec4899",
  sales: "#06b6d4",
  viewer: "#94a3b8",
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeRole(role?: string | null): ClientTeamRole {
  if (role === "client") return "owner";
  if (role === "staff") return "sales";
  return roles.some((item) => item.value === role)
    ? (role as ClientTeamRole)
    : "viewer";
}

export function TeamManagement({ darkMode }: TeamManagementProps) {
  const [members, setMembers] = useState<ClientTeamMember[]>([]);
  const [invitations, setInvitations] = useState<ClientTeamInvitation[]>([]);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ClientTeamRole>("viewer");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#64748b";
  const textSoft = darkMode ? "#94A3B8" : "#94a3b8";
  const cardStyle = {
    background: darkMode ? "rgba(15,23,42,0.82)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.13)" : "rgba(15,23,42,0.07)",
  };
  const currentRole = normalizeRole(profile?.role);
  const canManage = currentRole === "owner" || currentRole === "admin";

  async function loadTeam(clearMessage = false) {
    try {
      setLoading(true);
      if (clearMessage) setMessage(null);
      const [memberData, invitationData, profileData] = await Promise.all([
        getClientTeamMembers(),
        getClientTeamInvitations(),
        getClientProfile(),
      ]);
      setMembers(memberData);
      setInvitations(invitationData);
      setProfile(profileData);
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTeam(true);
  }, []);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((member) => member.is_active).length,
      pending: invitations.filter((invite) => invite.status === "pending").length,
      admins: members.filter(
        (member) =>
          member.is_active &&
          (member.role === "owner" || member.role === "admin"),
      ).length,
    }),
    [invitations, members],
  );

  async function submitInvitation() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setMessageTone("error");
      setMessage("Enter an email address.");
      return;
    }

    try {
      setActionKey("invite");
      const result = await inviteClientTeamMember({
        email,
        role: inviteRole,
      });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      setMessageTone("success");
      setMessage(
        result.email_sent
          ? "Invitation sent successfully."
          : `${result.message} The invitation is active and can be shared from backend logs.`,
      );
      await loadTeam();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to send invitation",
      );
    } finally {
      setActionKey(null);
    }
  }

  async function changeRole(member: ClientTeamMember, role: ClientTeamRole) {
    try {
      setActionKey(`${member.id}:role`);
      await updateClientTeamMember(member.id, { role });
      setMessageTone("success");
      setMessage(`${member.full_name}'s role was updated.`);
      await loadTeam();
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Failed to update role");
    } finally {
      setActionKey(null);
    }
  }

  async function toggleMember(member: ClientTeamMember) {
    try {
      setActionKey(`${member.id}:status`);
      if (member.is_active) {
        await deactivateClientTeamMember(member.id);
      } else {
        await updateClientTeamMember(member.id, { is_active: true });
      }
      setMessageTone("success");
      setMessage(
        member.is_active
          ? `${member.full_name} was deactivated.`
          : `${member.full_name} was reactivated.`,
      );
      await loadTeam();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to update member",
      );
    } finally {
      setActionKey(null);
    }
  }

  async function cancelInvitation(invitation: ClientTeamInvitation) {
    try {
      setActionKey(`${invitation.id}:cancel`);
      await cancelClientTeamInvitation(invitation.id);
      setMessageTone("success");
      setMessage(`Invitation for ${invitation.email} was cancelled.`);
      await loadTeam();
    } catch (error) {
      setMessageTone("error");
      setMessage(
        error instanceof Error ? error.message : "Failed to cancel invitation",
      );
    } finally {
      setActionKey(null);
    }
  }

  const statCards = [
    { label: "Total members", value: stats.total, icon: Users2, color: "#1D4ED8" },
    {
      label: "Active members",
      value: stats.active,
      icon: CheckCircle2,
      color: "#10b981",
    },
    {
      label: "Pending invitations",
      value: stats.pending,
      icon: Clock3,
      color: "#f59e0b",
    },
    {
      label: "Owners & admins",
      value: stats.admins,
      icon: ShieldCheck,
      color: "#2563EB",
    },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Users2 size={20} style={{ color: "#1D4ED8" }} />
              <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>
                Team Management
              </h1>
            </div>
            <p className="max-w-2xl text-sm" style={{ color: textMuted }}>
              Invite teammates, assign workspace roles, and keep access under control.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadTeam(true)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm disabled:opacity-60"
              style={{ ...cardStyle, color: textMuted }}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            {canManage && (
              <button
                type="button"
                onClick={() => setInviteOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white"
                style={{
                  background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                  boxShadow: "0 6px 20px rgba(29,78,216,0.28)",
                }}
              >
                <MailPlus size={14} />
                Invite member
              </button>
            )}
          </div>
        </div>

        {message && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              background:
                messageTone === "error"
                  ? "rgba(239,68,68,0.08)"
                  : "rgba(16,185,129,0.08)",
              borderColor:
                messageTone === "error"
                  ? "rgba(239,68,68,0.24)"
                  : "rgba(16,185,129,0.22)",
              color: messageTone === "error" ? "#ef4444" : "#10b981",
            }}
          >
            {message}
          </div>
        )}

        {!canManage && profile && (
          <div
            className="rounded-2xl border px-4 py-3 text-sm"
            style={{
              background: darkMode
                ? "rgba(29,78,216,0.08)"
                : "rgba(29,78,216,0.05)",
              borderColor: "rgba(29,78,216,0.20)",
              color: textMuted,
            }}
          >
            Your {currentRole} role can view the team. Owners and admins manage access.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border p-4"
              style={cardStyle}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs" style={{ color: textSoft }}>
                    {card.label}
                  </p>
                  <p
                    className="mt-2 text-2xl font-semibold"
                    style={{ color: textPrimary }}
                  >
                    {loading ? "—" : card.value}
                  </p>
                </div>
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: `${card.color}18`, color: card.color }}
                >
                  <card.icon size={17} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border" style={cardStyle}>
          <div className="border-b p-5" style={{ borderColor: cardStyle.borderColor }}>
            <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>
              Workspace members
            </h2>
            <p className="mt-1 text-xs" style={{ color: textSoft }}>
              Active and inactive accounts assigned to this company.
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-12 text-sm" style={{ color: textMuted }}>
              <RefreshCw size={16} className="animate-spin" /> Loading team...
            </div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <Users2 className="mx-auto" size={26} style={{ color: textSoft }} />
              <p className="mt-3 text-sm font-medium" style={{ color: textPrimary }}>
                No team members yet
              </p>
              <p className="mt-1 text-xs" style={{ color: textMuted }}>
                Invite the first teammate to start collaborating.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr style={{ background: darkMode ? "rgba(255,255,255,0.025)" : "#f8fafc" }}>
                    {["Member", "Role", "Status", "Joined", "Actions"].map((label) => (
                      <th key={label} className="px-5 py-3 text-left text-xs font-medium" style={{ color: textSoft }}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const isSelf = member.id === profile?.id;
                    const canManageMember =
                      canManage &&
                      !isSelf &&
                      !(member.role === "owner" && currentRole !== "owner");
                    return (
                      <tr key={member.id} className="border-t" style={{ borderColor: cardStyle.borderColor }}>
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium" style={{ color: textPrimary }}>
                            {member.full_name} {isSelf && <span style={{ color: "#1D4ED8" }}>(you)</span>}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: textSoft }}>{member.email}</p>
                        </td>
                        <td className="px-5 py-4">
                          {canManageMember ? (
                            <select
                              value={member.role}
                              disabled={Boolean(actionKey)}
                              onChange={(event) => void changeRole(member, event.target.value as ClientTeamRole)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs"
                              style={{
                                background: darkMode ? "#10102d" : "#ffffff",
                                borderColor: cardStyle.borderColor,
                                color: roleColors[member.role],
                              }}
                            >
                              {roles
                                .filter(
                                  (role) =>
                                    role.value !== "owner" ||
                                    currentRole === "owner",
                                )
                                .map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                            </select>
                          ) : (
                            <span
                              className="rounded-full border px-2.5 py-1 text-xs font-medium capitalize"
                              style={{
                                color: roleColors[member.role],
                                background: `${roleColors[member.role]}12`,
                                borderColor: `${roleColors[member.role]}30`,
                              }}
                            >
                              {member.role}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              color: member.is_active ? "#10b981" : "#ef4444",
                              background: member.is_active ? "rgba(16,185,129,0.10)" : "rgba(239,68,68,0.10)",
                            }}
                          >
                            {member.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs" style={{ color: textMuted }}>
                          {formatDate(member.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          {canManageMember ? (
                            <button
                              type="button"
                              disabled={Boolean(actionKey)}
                              onClick={() => void toggleMember(member)}
                              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs disabled:opacity-50"
                              style={{
                                borderColor: member.is_active ? "rgba(239,68,68,0.22)" : "rgba(16,185,129,0.22)",
                                color: member.is_active ? "#ef4444" : "#10b981",
                              }}
                            >
                              {member.is_active ? <UserMinus size={12} /> : <CheckCircle2 size={12} />}
                              {member.is_active ? "Deactivate" : "Reactivate"}
                            </button>
                          ) : (
                            <span className="text-xs" style={{ color: textSoft }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border" style={cardStyle}>
          <div className="border-b p-5" style={{ borderColor: cardStyle.borderColor }}>
            <h2 className="text-sm font-semibold" style={{ color: textPrimary }}>Invitations</h2>
            <p className="mt-1 text-xs" style={{ color: textSoft }}>Track pending, expired, accepted, and cancelled invitations.</p>
          </div>
          {invitations.length === 0 ? (
            <div className="p-10 text-center">
              <MailPlus className="mx-auto" size={24} style={{ color: textSoft }} />
              <p className="mt-3 text-sm" style={{ color: textMuted }}>No invitations have been created.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-2">
              {invitations.map((invitation) => {
                const pending = invitation.status === "pending";
                return (
                  <div key={invitation.id} className="rounded-2xl border p-4" style={{ borderColor: cardStyle.borderColor, background: darkMode ? "rgba(255,255,255,0.02)" : "#f8fafc" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium" style={{ color: textPrimary }}>{invitation.email}</p>
                        <p className="mt-1 text-xs capitalize" style={{ color: roleColors[invitation.role] }}>{invitation.role}</p>
                      </div>
                      <span className="rounded-full px-2.5 py-1 text-xs capitalize" style={{ color: pending ? "#f59e0b" : textMuted, background: pending ? "rgba(245,158,11,0.10)" : "rgba(148,163,184,0.10)" }}>
                        {invitation.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <p className="text-xs" style={{ color: textSoft }}>Expires {formatDate(invitation.expires_at)}</p>
                      {canManage && pending && (
                        <button
                          type="button"
                          disabled={Boolean(actionKey)}
                          onClick={() => void cancelInvitation(invitation)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs disabled:opacity-50"
                          style={{ color: "#ef4444", background: "rgba(239,68,68,0.08)" }}
                        >
                          <XCircle size={12} /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {inviteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(2,6,23,0.72)" }}
            onClick={() => setInviteOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-3xl border p-5"
              style={cardStyle}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Invite teammate</h2>
                  <p className="mt-1 text-xs" style={{ color: textMuted }}>They will receive a 7-day workspace invitation.</p>
                </div>
                <button type="button" onClick={() => setInviteOpen(false)} style={{ color: textSoft }}><X size={18} /></button>
              </div>
              <label className="mt-5 block text-xs" style={{ color: textSoft }}>Email address</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="teammate@company.com"
                className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                style={{ background: darkMode ? "rgba(255,255,255,0.04)" : "#f8fafc", borderColor: cardStyle.borderColor, color: textPrimary }}
              />
              <label className="mt-4 block text-xs" style={{ color: textSoft }}>Role</label>
              <select
                value={inviteRole}
                onChange={(event) => setInviteRole(event.target.value as ClientTeamRole)}
                className="mt-2 w-full rounded-xl border px-3 py-2.5 text-sm"
                style={{ background: darkMode ? "#10102d" : "#f8fafc", borderColor: cardStyle.borderColor, color: textPrimary }}
              >
                {roles
                  .filter(
                    (role) =>
                      role.value !== "owner" || currentRole === "owner",
                  )
                  .map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <div className="mt-5 flex justify-end gap-2">
                <button type="button" onClick={() => setInviteOpen(false)} className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: cardStyle.borderColor, color: textMuted }}>Cancel</button>
                <button
                  type="button"
                  onClick={() => void submitInvitation()}
                  disabled={actionKey === "invite"}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                >
                  {actionKey === "invite" && <RefreshCw size={13} className="animate-spin" />}
                  Send invite
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
