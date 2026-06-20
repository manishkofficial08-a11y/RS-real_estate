import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Bot,
  Brain,
  CheckCircle2,
  Copy,
  Lightbulb,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  ThumbsDown,
  ThumbsUp,
  TrendingUp,
  Users,
  Video,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  getClientLeads,
  getClientProperties,
  getClientProfile,
  getMyClientAIJobs,
  getMyContentAssets,
  getMyGeneratedPosts,
  getMyScheduledPosts,
  type ClientAIJob,
  type ClientContentAsset,
  type ClientGeneratedPost,
  type ClientLead,
  type ClientProfile,
  type ClientProperty,
  type ClientScheduledPost,
} from "../lib/clientApi";

type Message = {
  role: "ai" | "user";
  content: string;
  time: string;
};

type AIManagerProps = {
  darkMode: boolean;
};

type BusinessData = {
  profile: ClientProfile | null;
  leads: ClientLead[];
  properties: ClientProperty[];
  assets: ClientContentAsset[];
  generatedPosts: ClientGeneratedPost[];
  scheduledPosts: ClientScheduledPost[];
  aiJobs: ClientAIJob[];
};

type InsightItem = {
  label: string;
  value: string;
  color: string;
  icon: typeof TrendingUp;
};

const emptyBusinessData: BusinessData = {
  profile: null,
  leads: [],
  properties: [],
  assets: [],
  generatedPosts: [],
  scheduledPosts: [],
  aiJobs: [],
};

const suggestedQuestions = [
  "Give me my business health score",
  "Which leads should I follow up first?",
  "What should I post this week?",
  "Which campaign drafts are ready to publish?",
  "How can I improve my real estate growth?",
  "What is pending before live publishing?",
];

const formatNumber = (value: number) => new Intl.NumberFormat("en-IN").format(value);

const getStatusCount = <T extends { status?: string | null }>(
  items: T[],
  matcher: (status: string) => boolean,
) => items.filter((item) => matcher(String(item.status || "").toLowerCase())).length;

const getHotLeads = (leads: ClientLead[]) =>
  leads.filter((lead) => {
    const status = String(lead.status || "").toLowerCase();
    return lead.score >= 75 || status.includes("hot") || status.includes("warm") || status.includes("new");
  });

const getTopLeads = (leads: ClientLead[]) =>
  [...leads]
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5);

const getHighValueProperties = (properties: ClientProperty[]) =>
  [...properties]
    .sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0))
    .slice(0, 3);

function buildSnapshot(data: BusinessData) {
  const totalLeads = data.leads.length;
  const hotLeads = getHotLeads(data.leads).length;
  const totalProperties = data.properties.length;
  const activeProperties = getStatusCount(data.properties, (status) =>
    ["active", "available", "listed", "published"].some((word) => status.includes(word)),
  );
  const videoAssets = data.assets.filter((asset) =>
    String(asset.asset_type || "").toLowerCase().includes("video"),
  ).length;
  const totalCampaignDrafts = data.generatedPosts.length;
  const draftPosts = getStatusCount(data.generatedPosts, (status) => status.includes("draft"));
  const scheduledPosts = getStatusCount(data.scheduledPosts, (status) => status.includes("scheduled"));
  const publishedPosts =
    getStatusCount(data.generatedPosts, (status) => status.includes("published")) +
    getStatusCount(data.scheduledPosts, (status) => status.includes("published"));
  const failedJobs = getStatusCount(data.aiJobs, (status) => status.includes("failed"));
  const completedJobs = getStatusCount(data.aiJobs, (status) => status.includes("completed"));

  let healthScore = 45;
  if (totalLeads > 0) healthScore += 12;
  if (hotLeads > 0) healthScore += 8;
  if (totalProperties > 0) healthScore += 10;
  if (videoAssets > 0) healthScore += 8;
  if (totalCampaignDrafts > 0) healthScore += 8;
  if (scheduledPosts > 0) healthScore += 4;
  if (publishedPosts > 0) healthScore += 5;
  if (failedJobs > 0) healthScore -= Math.min(10, failedJobs * 2);

  healthScore = Math.max(0, Math.min(100, healthScore));

  const readinessItems = [
    totalProperties > 0,
    videoAssets > 0,
    totalCampaignDrafts > 0,
    scheduledPosts > 0 || publishedPosts > 0,
  ];
  const readiness = Math.round(
    (readinessItems.filter(Boolean).length / readinessItems.length) * 100,
  );

  return {
    businessName: data.profile?.business_name || "RS Real Estate workspace",
    totalLeads,
    hotLeads,
    totalProperties,
    activeProperties,
    videoAssets,
    totalCampaignDrafts,
    draftPosts,
    scheduledPosts,
    publishedPosts,
    failedJobs,
    completedJobs,
    healthScore,
    readiness,
  };
}

function buildWelcome(data: BusinessData, loadError: string | null) {
  const s = buildSnapshot(data);

  if (loadError) {
    return `I am online, but I could not load live backend data right now.

Issue:
**${loadError}**

You can still ask me about leads, properties, campaigns, scheduling, and publishing. Once backend data loads, I will ground answers in your real workspace numbers.`;
  }

  return `Hello. I am your AI Business Manager.

I loaded your current RS Real Estate workspace context.

Business health score: **${s.healthScore}/100**
Launch readiness: **${s.readiness}%**

Live snapshot:
- **${formatNumber(s.totalLeads)}** total leads, **${formatNumber(s.hotLeads)}** priority leads
- **${formatNumber(s.totalProperties)}** properties, **${formatNumber(s.activeProperties)}** active/listed
- **${formatNumber(s.videoAssets)}** video assets available for campaigns
- **${formatNumber(s.totalCampaignDrafts)}** campaign drafts
- **${formatNumber(s.scheduledPosts)}** scheduled posts
- **${formatNumber(s.publishedPosts)}** published posts

Ask me what to improve, what to post next, which leads to follow up, or what is blocking live publishing.`;
}

function buildAnswer(question: string, data: BusinessData, loadError: string | null) {
  const q = question.toLowerCase();
  const s = buildSnapshot(data);
  const topLeads = getTopLeads(data.leads);
  const topProperties = getHighValueProperties(data.properties);
  const draftPosts = data.generatedPosts.filter((post) =>
    String(post.status || "").toLowerCase().includes("draft"),
  );
  const scheduled = data.scheduledPosts.filter((post) =>
    String(post.status || "").toLowerCase().includes("scheduled"),
  );

  if (loadError) {
    return `I cannot fully ground this answer because backend data did not load.

Current issue:
**${loadError}**

Safe recommendation:
1. Make sure backend is running on port 8000.
2. Refresh this page.
3. Ask again after the data snapshot loads.

For now, I can still guide the workflow: upload property media, create campaign drafts, review content, connect social accounts, then publish or schedule.`;
  }

  if (q.includes("health") || q.includes("score") || q.includes("business")) {
    return `Your current business health score is **${s.healthScore}/100**.

Why:
- Leads present: **${formatNumber(s.totalLeads)}**
- Priority leads: **${formatNumber(s.hotLeads)}**
- Properties listed: **${formatNumber(s.totalProperties)}**
- Video campaign assets: **${formatNumber(s.videoAssets)}**
- Campaign drafts: **${formatNumber(s.totalCampaignDrafts)}**
- Scheduled posts: **${formatNumber(s.scheduledPosts)}**
- Published posts: **${formatNumber(s.publishedPosts)}**
- Failed AI jobs: **${formatNumber(s.failedJobs)}**

Next best action:
**Convert campaign drafts into scheduled or published posts**, then follow up with the highest-score leads.`;
  }

  if (q.includes("lead") || q.includes("follow")) {
    if (!topLeads.length) {
      return `I do not see any leads in the current workspace.

Next action:
1. Add leads in CRM.
2. Give every lead a score and source.
3. Then I can rank follow-ups by urgency and conversion potential.`;
    }

    const leadLines = topLeads
      .map((lead, index) => {
        const contact = lead.phone || lead.email || "No contact saved";
        return `${index + 1}. **${lead.name}** — score ${lead.score}, status ${lead.status}, contact: ${contact}`;
      })
      .join("\n");

    return `These are the leads I would follow up first:

${leadLines}

Recommended follow-up script:
**Hi, just checking if you are still exploring property options. I can share updated pricing, availability, and a short video walkthrough.**

Priority:
- Call high-score leads first.
- WhatsApp warm leads with property video.
- Move unresponsive leads to nurture after 2 attempts.`;
  }

  if (q.includes("post") || q.includes("content") || q.includes("campaign") || q.includes("draft")) {
    if (!draftPosts.length && !scheduled.length) {
      return `I do not see ready campaign drafts or scheduled posts yet.

Best next step:
1. Upload a property video in Media Library.
2. Create a multi-platform campaign.
3. Review drafts in Campaign Studio.
4. Schedule or publish to selected platforms.`;
    }

    const draftSummary = draftPosts
      .slice(0, 4)
      .map((post, index) => `${index + 1}. **${post.platform}** — ${post.title}`)
      .join("\n");

    return `Campaign readiness summary:

- Draft posts ready: **${formatNumber(draftPosts.length)}**
- Scheduled posts: **${formatNumber(scheduled.length)}**
- Published posts: **${formatNumber(s.publishedPosts)}**

Best drafts to review now:
${draftSummary || "No draft titles available."}

Recommendation:
Use one property video campaign across **Instagram, Facebook, LinkedIn, and YouTube Shorts**, but keep the caption style platform-specific.`;
  }

  if (q.includes("schedule") || q.includes("week") || q.includes("calendar")) {
    return `This week's recommended posting schedule:

1. **Monday** — property awareness post
2. **Wednesday** — short video/reel with clear CTA
3. **Friday** — investment or pricing update
4. **Sunday** — family/homebuyer friendly post

Based on your workspace:
- Video assets available: **${formatNumber(s.videoAssets)}**
- Campaign drafts ready: **${formatNumber(s.totalCampaignDrafts)}**
- Already scheduled: **${formatNumber(s.scheduledPosts)}**

Next action:
Schedule at least **3 posts** this week from Campaign Studio.`;
  }

  if (q.includes("growth") || q.includes("strategy") || q.includes("improve")) {
    const propertyLine = topProperties.length
      ? topProperties
          .map((property) => `- **${property.title}** in ${property.location}`)
          .join("\n")
      : "- Add high-value properties first";

    return `30-day growth plan for your real estate business:

Week 1:
- Publish 3 short video campaigns
- Follow up priority leads
- Highlight top property inventory

Week 2:
- Run platform-specific captions for Instagram/Facebook/LinkedIn
- Reuse same property video with different hooks
- Push site visit CTAs

Week 3:
- Compare lead quality by source
- Focus on high-score leads
- Create testimonial or trust-building post

Week 4:
- Review published campaign performance
- Double down on best platform
- Build next campaign calendar

Top inventory to promote:
${propertyLine}`;
  }

  if (q.includes("publish") || q.includes("connect") || q.includes("account") || q.includes("pending")) {
    return `Publishing readiness:

Ready:
- Campaign drafts: **${formatNumber(s.totalCampaignDrafts)}**
- Scheduled posts foundation: **${formatNumber(s.scheduledPosts)}**
- Video assets: **${formatNumber(s.videoAssets)}**

Still pending before true live publishing:
1. Connect YouTube account
2. Connect Instagram/Facebook account
3. Connect LinkedIn account
4. Store platform tokens securely
5. Replace mock fallback with real posting mode

Current recommendation:
Keep demo mode active, but show clients that live publishing requires account connection.`;
  }

  if (q.includes("property") || q.includes("inventory")) {
    if (!data.properties.length) {
      return `I do not see properties in the current workspace.

Add properties with price, location, type, bedrooms, bathrooms, and media. Then I can recommend which property should be promoted first.`;
    }

    const propertyLines = topProperties
      .map((property, index) => {
        const price = Number(property.price || 0);
        return `${index + 1}. **${property.title}** — ${property.location}, ₹${formatNumber(price)}`;
      })
      .join("\n");

    return `Top properties to promote first:

${propertyLines}

Recommended campaign angle:
- Show the video first
- Mention pricing and location clearly
- Add a direct CTA: **Book a site visit / request current availability**
- Publish across Instagram, Facebook, LinkedIn, and YouTube Shorts.`;
  }

  return `Here is what I can confidently say from your live workspace:

- Health score: **${s.healthScore}/100**
- Leads: **${formatNumber(s.totalLeads)}**
- Priority leads: **${formatNumber(s.hotLeads)}**
- Properties: **${formatNumber(s.totalProperties)}**
- Video assets: **${formatNumber(s.videoAssets)}**
- Campaign drafts: **${formatNumber(s.totalCampaignDrafts)}**
- Scheduled posts: **${formatNumber(s.scheduledPosts)}**

Best next action:
**Review campaign drafts, publish or schedule the best ones, then follow up priority leads with the property video.**`;
}

export function AIManager({ darkMode }: AIManagerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [data, setData] = useState<BusinessData>(emptyBusinessData);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const snapshot = useMemo(() => buildSnapshot(data), [data]);

  const cardBase = {
    background: darkMode ? "rgba(15,23,42,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)",
  };

  const textPrimary = darkMode ? "#e2e8f0" : "#0f172a";
  const textMuted = darkMode ? "#94a3b8" : "#475569";
  const textSoft = darkMode ? "#64748b" : "#64748b";

  const loadBusinessData = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [
        profile,
        leads,
        properties,
        assets,
        generatedPosts,
        scheduledPosts,
        aiJobs,
      ] = await Promise.all([
        getClientProfile().catch(() => null),
        getClientLeads().catch(() => []),
        getClientProperties().catch(() => []),
        getMyContentAssets({ asset_type: "all" }).catch(() => []),
        getMyGeneratedPosts({ status: "all", limit: 50 }).catch(() => []),
        getMyScheduledPosts({ status: "all", limit: 50 }).catch(() => []),
        getMyClientAIJobs().catch(() => []),
      ]);

      setData({
        profile,
        leads,
        properties,
        assets,
        generatedPosts,
        scheduledPosts,
        aiJobs,
      });
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load AI Manager data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBusinessData();
  }, []);

  useEffect(() => {
    if (loading || initializedRef.current) return;

    initializedRef.current = true;
    setMessages([
      {
        role: "ai",
        content: buildWelcome(data, loadError),
        time: "Just now",
      },
    ]);
  }, [loading, data, loadError]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const liveInsights: InsightItem[] = [
    {
      icon: TrendingUp,
      label: "Health score",
      value: `${snapshot.healthScore}/100`,
      color: snapshot.healthScore >= 75 ? "#10b981" : snapshot.healthScore >= 55 ? "#f59e0b" : "#ef4444",
    },
    {
      icon: Users,
      label: "Priority leads",
      value: `${formatNumber(snapshot.hotLeads)} hot`,
      color: "#f59e0b",
    },
    {
      icon: Video,
      label: "Video assets",
      value: formatNumber(snapshot.videoAssets),
      color: "#1D4ED8",
    },
    {
      icon: Target,
      label: "Drafts ready",
      value: formatNumber(snapshot.totalCampaignDrafts),
      color: "#2563EB",
    },
  ];

  const sendMessage = (text: string = input) => {
    if (!text.trim()) return;

    const userMsg: Message = { role: "user", content: text.trim(), time: "Just now" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    window.setTimeout(() => {
      setTyping(false);
      const aiMsg: Message = {
        role: "ai",
        content: buildAnswer(text, data, loadError),
        time: "Just now",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 700);
  };

  const refreshManager = async () => {
    initializedRef.current = false;
    await loadBusinessData();
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Ignore clipboard errors in demo mode.
    }
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong
            key={i}
            style={{ color: textPrimary, fontWeight: 600 }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }

      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      <div
        className="w-72 flex-shrink-0 border-r flex flex-col"
        style={{
          borderColor: cardBase.borderColor,
          background: darkMode ? "rgba(5,5,20,0.6)" : "rgba(248,250,252,0.8)",
        }}
      >
        <div className="p-4 border-b" style={{ borderColor: cardBase.borderColor }}>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1D4ED8, #2563EB)",
                boxShadow: "0 0 20px rgba(29,78,216,0.3)",
              }}
            >
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: textPrimary }}>
                AI Manager
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${loadError ? "bg-yellow-500" : "bg-green-500"}`} />
                <span className="text-xs" style={{ color: loadError ? "#f59e0b" : "#10b981" }}>
                  {loading ? "Loading data" : loadError ? "Fallback mode" : "Data loaded"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-2 flex-shrink-0">
          <p className="text-xs font-semibold px-1" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
            LIVE BUSINESS SNAPSHOT
          </p>

          {loading ? (
            <div className="flex items-center gap-2 px-2 py-3 text-xs" style={{ color: textSoft }}>
              <Loader2 size={13} className="animate-spin" />
              Loading workspace data...
            </div>
          ) : (
            liveInsights.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 px-2 py-2 rounded-xl"
                style={{ background: darkMode ? `${item.color}08` : `${item.color}05` }}
              >
                <item.icon size={13} style={{ color: item.color }} />
                <span className="text-xs flex-1" style={{ color: textMuted }}>
                  {item.label}
                </span>
                <span className="text-xs font-semibold" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="px-3 pb-3">
          <div
            className="rounded-xl border p-3"
            style={{ background: cardBase.background, borderColor: cardBase.borderColor }}
          >
            <div className="flex items-center gap-2 mb-2">
              {loadError ? (
                <AlertCircle size={14} style={{ color: "#f59e0b" }} />
              ) : (
                <CheckCircle2 size={14} style={{ color: "#10b981" }} />
              )}
              <p className="text-xs font-semibold" style={{ color: textPrimary }}>
                Context status
              </p>
            </div>
            <p className="text-xs leading-5" style={{ color: textSoft }}>
              {loadError
                ? "Some live data could not load. Answers will use safe fallback guidance."
                : "Answers are grounded in leads, properties, media, campaign drafts, scheduled posts, and AI jobs."}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold px-1 mb-2" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
            ASK ABOUT
          </p>
          <div className="space-y-1.5">
            {suggestedQuestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left p-2.5 rounded-xl border text-xs transition-all hover:border-primary/20 group"
                style={{
                  borderColor: darkMode ? "rgba(29,78,216,0.08)" : "rgba(15,23,42,0.04)",
                  color: textSoft,
                }}
              >
                <span className="group-hover:text-primary transition-colors">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div
          className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{
            borderColor: cardBase.borderColor,
            background: darkMode ? "rgba(15,23,42,0.6)" : "rgba(255,255,255,0.8)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
          >
            <Brain size={16} className="text-white" />
            <div
              className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                loadError ? "bg-yellow-500" : "bg-green-500"
              }`}
              style={{ borderColor: darkMode ? "#020210" : "#ffffff" }}
            />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: textPrimary }}>
              AI Business Manager
            </p>
            <p className="text-xs" style={{ color: darkMode ? "#94A3B8" : "#94a3b8" }}>
              {snapshot.businessName} - live business context
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => void refreshManager()}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-primary/5 transition-all disabled:opacity-50"
              style={{ color: darkMode ? "#64748b" : "#94a3b8" }}
              aria-label="Refresh AI Manager data"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            </button>
          </div>
        </div>

        <div className="border-b px-5 py-3" style={{ borderColor: cardBase.borderColor }}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            {[
              { label: "Leads", value: snapshot.totalLeads, icon: Users },
              { label: "Properties", value: snapshot.totalProperties, icon: Target },
              { label: "Videos", value: snapshot.videoAssets, icon: Video },
              { label: "Drafts", value: snapshot.totalCampaignDrafts, icon: Sparkles },
              { label: "Scheduled", value: snapshot.scheduledPosts, icon: Zap },
              { label: "Published", value: snapshot.publishedPosts, icon: BarChart3 },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border p-3"
                style={{
                  background: cardBase.background,
                  borderColor: cardBase.borderColor,
                }}
              >
                <div className="flex items-center gap-2">
                  <item.icon size={13} style={{ color: "#1D4ED8" }} />
                  <span className="text-[11px]" style={{ color: textSoft }}>{item.label}</span>
                </div>
                <p className="mt-1 text-lg font-semibold" style={{ color: textPrimary }}>
                  {formatNumber(Number(item.value || 0))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={`${msg.role}-${i}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "ai" && (
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                >
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-3xl ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background:
                      msg.role === "ai"
                        ? darkMode
                          ? "rgba(15,23,42,0.9)"
                          : "#ffffff"
                        : "linear-gradient(135deg, #1D4ED8, #2563EB)",
                    color:
                      msg.role === "ai"
                        ? darkMode
                          ? "#94a3b8"
                          : "#475569"
                        : "#ffffff",
                    border:
                      msg.role === "ai"
                        ? `1px solid ${
                            darkMode ? "rgba(29,78,216,0.12)" : "rgba(15,23,42,0.06)"
                          }`
                        : "none",
                    boxShadow:
                      msg.role === "user"
                        ? "0 4px 14px rgba(29,78,216,0.3)"
                        : darkMode
                          ? "0 2px 16px rgba(0,0,0,0.3)"
                          : "0 1px 4px rgba(0,0,0,0.06)",
                    borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  }}
                >
                  {renderContent(msg.content)}
                </div>
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <span className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                      {msg.time}
                    </span>
                    <button
                      onClick={() => void copyMessage(msg.content)}
                      className="p-1 rounded hover:bg-primary/10 transition-all"
                      style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}
                    >
                      <Copy size={11} />
                    </button>
                    <button className="p-1 rounded hover:bg-green-500/10 transition-all" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                      <ThumbsUp size={11} />
                    </button>
                    <button className="p-1 rounded hover:bg-red-500/10 transition-all" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
                      <ThumbsDown size={11} />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #1D4ED8, #2563EB)" }}
                >
                  <Bot size={14} className="text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl"
                  style={{
                    background: darkMode ? "rgba(15,23,42,0.9)" : "#ffffff",
                    border: `1px solid ${cardBase.borderColor}`,
                  }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        <div
          className="p-4 border-t flex-shrink-0"
          style={{
            borderColor: cardBase.borderColor,
            background: darkMode ? "rgba(5,5,20,0.8)" : "rgba(255,255,255,0.8)",
          }}
        >
          <div
            className="flex items-center gap-2 rounded-2xl border px-4 py-2"
            style={{
              borderColor: darkMode ? "rgba(29,78,216,0.2)" : "rgba(29,78,216,0.12)",
              background: darkMode ? "rgba(29,78,216,0.05)" : "rgba(248,250,252,0.8)",
            }}
          >
            <Lightbulb size={16} style={{ color: "#2563EB" }} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about leads, campaigns, properties, publishing, or growth..."
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: textPrimary }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              style={{
                background: input.trim()
                  ? "linear-gradient(135deg, #1D4ED8, #2563EB)"
                  : darkMode
                    ? "rgba(29,78,216,0.08)"
                    : "rgba(29,78,216,0.08)",
                color: input.trim() ? "#ffffff" : textSoft,
              }}
            >
              {typing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
            AI Manager uses your CRM, properties, media, campaign drafts, scheduled posts, and AI jobs.
          </p>
        </div>
      </div>
    </div>
  );
}
