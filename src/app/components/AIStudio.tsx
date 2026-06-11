import { useState } from "react";
import {
  Sparkles, Hash, Search, Languages, Subtitles, Wand2,
  History, Bookmark, Settings2, Copy, RefreshCw, ArrowRight,
  ChevronDown, Zap, Star, Download, Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const tools = [
  { id: "caption", icon: Sparkles, label: "Caption Generator", desc: "AI-powered captions for any platform", color: "#6366f1" },
  { id: "hashtag", icon: Hash, label: "Hashtag Generator", desc: "Trending & niche hashtags that convert", color: "#8b5cf6" },
  { id: "seo", icon: Search, label: "SEO Content", desc: "Search-optimized titles & meta descriptions", color: "#06b6d4" },
  { id: "translate", icon: Languages, label: "AI Translator", desc: "Translate to 50+ languages in brand voice", color: "#10b981" },
  { id: "subtitle", icon: Subtitles, label: "Subtitle Generator", desc: "Auto-generate subtitles from video/audio", color: "#f59e0b" },
  { id: "optimizer", icon: Wand2, label: "Content Optimizer", desc: "Improve engagement & clarity score", color: "#ef4444" },
];

const tones = ["Professional", "Casual", "Witty", "Inspiring", "Educational", "Promotional"];
const platforms = ["Instagram", "LinkedIn", "Twitter/X", "Facebook", "TikTok", "YouTube"];

const templates = [
  { title: "Product Launch", uses: 284, rating: 4.9 },
  { title: "Behind the Scenes", uses: 193, rating: 4.7 },
  { title: "Case Study Hook", uses: 421, rating: 4.8 },
  { title: "How-To Thread", uses: 156, rating: 4.6 },
];

const promptHistory = [
  { prompt: "Write an engaging caption for our Q4 product launch", tool: "Caption", time: "2 min ago" },
  { prompt: "Generate hashtags for B2B SaaS marketing content", tool: "Hashtag", time: "18 min ago" },
  { prompt: "Optimize this LinkedIn post for better engagement", tool: "Optimizer", time: "1 hr ago" },
  { prompt: "Translate product description to Spanish & French", tool: "Translate", time: "3 hr ago" },
];

const generatedCaptions = [
  {
    text: "We didn't just build a tool — we built a new way to think about growth. AI Growth OS is your unfair advantage. 🚀\n\nWhat took 10 people and 3 weeks now happens in minutes.\n\n#AIGrowth #SaaS #FutureOfWork",
    score: 94,
  },
  {
    text: "Stop guessing. Start knowing.\n\nAI Growth OS analyzes every post, every lead, every trend — and tells you exactly what to do next.\n\nYour competitors are flying blind. You don't have to. 💡",
    score: 88,
  },
];

interface AIStudioProps {
  darkMode: boolean;
}

export function AIStudio({ darkMode }: AIStudioProps) {
  const [activeTool, setActiveTool] = useState("caption");
  const [selectedTone, setSelectedTone] = useState("Professional");
  const [selectedPlatform, setSelectedPlatform] = useState("LinkedIn");
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"generate" | "history" | "templates">("generate");

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 2000);
  };

  const cardStyle = {
    background: darkMode ? "rgba(13, 13, 40, 0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
    backdropFilter: "blur(16px)",
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: darkMode ? "#e2e8f0" : "#0f172a" }}>AI Studio</h1>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}>6 tools</span>
          </div>
          <p className="text-sm ml-11" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
            Generate, optimize, and transform content with enterprise AI
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {tools.map((tool, i) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setActiveTool(tool.id)}
              className="relative flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all group overflow-hidden"
              style={{
                background: activeTool === tool.id
                  ? darkMode ? `${tool.color}15` : `${tool.color}08`
                  : cardStyle.background,
                borderColor: activeTool === tool.id
                  ? `${tool.color}40`
                  : darkMode ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.06)",
                boxShadow: activeTool === tool.id
                  ? `0 0 20px ${tool.color}20`
                  : "none",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: `${tool.color}15` }}
              >
                <tool.icon size={18} style={{ color: tool.color }} />
              </div>
              <span className="text-xs font-medium text-center leading-tight" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>
                {tool.label}
              </span>
              {activeTool === tool.id && (
                <motion.div
                  layoutId="toolIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t"
                  style={{ background: tool.color }}
                />
              )}
            </motion.button>
          ))}
        </div>

        {/* Main Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Generator Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: darkMode ? "rgba(99,102,241,0.06)" : "rgba(99,102,241,0.04)" }}>
              {(["generate", "history", "templates"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="flex-1 py-2 rounded-lg text-xs capitalize transition-all"
                  style={{
                    background: activeTab === tab
                      ? darkMode ? "rgba(99,102,241,0.2)" : "#ffffff"
                      : "transparent",
                    color: activeTab === tab
                      ? darkMode ? "#818cf8" : "#6366f1"
                      : darkMode ? "#4a5568" : "#94a3b8",
                    boxShadow: activeTab === tab
                      ? darkMode ? "none" : "0 1px 4px rgba(0,0,0,0.06)"
                      : "none",
                  }}
                >
                  {tab === "history" && <History size={11} className="inline mr-1" />}
                  {tab === "templates" && <Bookmark size={11} className="inline mr-1" />}
                  {tab}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "generate" && (
                <motion.div
                  key="generate"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {/* Config */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Platform</label>
                      <div className="relative">
                        <select
                          value={selectedPlatform}
                          onChange={(e) => setSelectedPlatform(e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-xl border text-sm pr-8"
                          style={{
                            background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                            borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                            color: darkMode ? "#e2e8f0" : "#0f172a",
                          }}
                        >
                          {platforms.map(p => <option key={p}>{p}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs mb-1.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Brand Tone</label>
                      <div className="relative">
                        <select
                          value={selectedTone}
                          onChange={(e) => setSelectedTone(e.target.value)}
                          className="w-full appearance-none px-3 py-2.5 rounded-xl border text-sm pr-8"
                          style={{
                            background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                            borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                            color: darkMode ? "#e2e8f0" : "#0f172a",
                          }}
                        >
                          {tones.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }} />
                      </div>
                    </div>
                  </div>

                  {/* Prompt Input */}
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Describe your content</label>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to create... e.g. 'Write a compelling caption about our new AI feature that helps marketing teams save 10 hours per week'"
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border resize-none text-sm outline-none focus:ring-2 transition-all"
                      style={{
                        background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                        borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                        color: darkMode ? "#e2e8f0" : "#0f172a",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                    }}
                  >
                    {generating ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <RefreshCw size={14} />
                        </motion.div>
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Generate Content
                        <Zap size={12} className="opacity-70" />
                      </>
                    )}
                  </button>

                  {/* Generated Output */}
                  <AnimatePresence>
                    {generated && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <p className="text-xs font-medium" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Generated variants</p>
                        {generatedCaptions.map((cap, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-xl border group"
                            style={{
                              background: darkMode ? "rgba(99,102,241,0.05)" : "#f8fafc",
                              borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Star size={11} style={{ color: "#f59e0b" }} />
                                <span className="text-xs font-semibold" style={{ color: "#f59e0b" }}>Score {cap.score}/100</span>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>
                                  <Copy size={12} />
                                </button>
                                <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>
                                  <Download size={12} />
                                </button>
                                <button className="p-1.5 rounded-lg hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>
                                  <Share2 size={12} />
                                </button>
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>
                              {cap.text}
                            </p>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  {promptHistory.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-primary/20"
                      style={{
                        background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                        borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.05)",
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "rgba(99,102,241,0.1)" }}>
                        <History size={11} style={{ color: "#6366f1" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8" }}>{item.tool}</span>
                          <span className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>{item.time}</span>
                        </div>
                      </div>
                      <ArrowRight size={13} style={{ color: darkMode ? "#2d3748" : "#cbd5e1" }} />
                    </div>
                  ))}
                </motion.div>
              )}

              {activeTab === "templates" && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 gap-3"
                >
                  {templates.map((tmpl, i) => (
                    <button
                      key={i}
                      className="p-4 rounded-xl border text-left transition-all hover:border-primary/20 group"
                      style={{
                        background: darkMode ? "rgba(99,102,241,0.04)" : "#f8fafc",
                        borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.05)",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Bookmark size={14} style={{ color: "#6366f1" }} />
                        <span className="text-xs" style={{ color: "#f59e0b" }}>★ {tmpl.rating}</span>
                      </div>
                      <p className="text-sm font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{tmpl.title}</p>
                      <p className="text-xs mt-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{tmpl.uses} uses</p>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Brand Settings */}
            <div
              className="rounded-2xl p-4 border"
              style={{ background: cardStyle.background, borderColor: cardStyle.borderColor, backdropFilter: cardStyle.backdropFilter }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Settings2 size={14} style={{ color: "#6366f1" }} />
                <span className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Brand Settings</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Company Name</label>
                  <input
                    defaultValue="Acme Corp"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Industry</label>
                  <input
                    defaultValue="B2B SaaS / Technology"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Target Audience</label>
                  <input
                    defaultValue="Marketing Directors, CMOs"
                    className="w-full px-3 py-2 rounded-xl border text-sm"
                    style={{
                      background: darkMode ? "rgba(99,102,241,0.06)" : "#f8fafc",
                      borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.08)",
                      color: darkMode ? "#e2e8f0" : "#0f172a",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div
              className="rounded-2xl p-4 border"
              style={{ background: cardStyle.background, borderColor: cardStyle.borderColor }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>Usage this month</p>
              <div className="space-y-3">
                {[
                  { label: "Captions generated", used: 284, max: 500, color: "#6366f1" },
                  { label: "Translations", used: 38, max: 100, color: "#06b6d4" },
                  { label: "SEO articles", used: 12, max: 20, color: "#10b981" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>{item.label}</span>
                      <span className="text-xs font-medium" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>{item.used}/{item.max}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(item.used / item.max) * 100}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-3 w-full py-2 rounded-xl text-xs transition-all hover:opacity-90" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#ffffff" }}>
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
