import { useState, useRef, useEffect } from "react";
import {
  Bot, Send, Mic, Sparkles, TrendingUp, Users, BarChart3,
  Lightbulb, ArrowRight, RefreshCw, Copy, ThumbsUp, ThumbsDown,
  Brain, Zap, Target, Globe
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const suggested = [
  "What's my best performing content this month?",
  "How do I improve my LinkedIn engagement rate?",
  "Analyze my lead pipeline and suggest next steps",
  "What posting schedule should I follow this week?",
  "Give me a growth strategy for the next 30 days",
  "Which audience segment converts best?",
];

const initialMessages = [
  {
    role: "ai",
    content: "Hello there! I'm your AI Business Manager. I've analyzed all your data â€” content performance, lead pipeline, analytics, and market trends.\n\nYour business is performing at **92/100** health score this week. Here's what I see:\n\nâ€¢ ðŸ“ˆ Engagement up 28% â€” LinkedIn posts are crushing it\nâ€¢ ðŸŽ¯ 12 warm leads haven't been contacted in 7+ days\nâ€¢ âš¡ Thursday 7PM is your peak engagement window\nâ€¢ ðŸ”¥ Video content generates 3.2x more reach than images\n\nWhat would you like to work on today?",
    time: "Just now",
  }
];

type Message = { role: "ai" | "user"; content: string; time: string };

const aiResponses: Record<string, string> = {
  default: "Based on your current data, I recommend focusing on **LinkedIn thought leadership content** this week. Your audience of marketing directors responds best to data-driven insights. I'll generate 3 post ideas for you.\n\n**Action items:**\n1. Schedule 2 posts on Thursday between 6-8 PM\n2. Follow up with Sarah Chen â€” she's your hottest lead\n3. Repurpose your top video into 5 short clips for Instagram Reels\n\nWant me to execute any of these automatically?",
  "best performing": "Your **top performing content** this month:\n\n1. ðŸ¥‡ 'AI trends reshaping B2B marketing' â€” 42.1K reach, 8.4% engagement\n2. ðŸ¥ˆ 'How we 10x'd lead gen' â€” 38.7K reach, 12.1% engagement\n3. ðŸ¥‰ 'The future of work thread' â€” 29.3K reach, 6.8% engagement\n\n**Pattern I notice:** Long-form educational content with data points performs 3x better than promotional posts. Want me to generate more content in this style?",
  "growth strategy": "**30-Day AI-Powered Growth Strategy:**\n\n**Week 1â€“2: Content Authority**\nâ€¢ Publish 3 thought leadership pieces on LinkedIn\nâ€¢ Launch 1 YouTube tutorial per week\nâ€¢ Engage with 50 warm prospects daily\n\n**Week 3â€“4: Lead Acceleration**\nâ€¢ Retarget website visitors with LinkedIn ads\nâ€¢ Launch automated email sequence for 12 cold leads\nâ€¢ Host a live Q&A to capture 200+ new leads\n\n**Expected results:** +18% follower growth, +40% lead conversion, $95K additional pipeline\n\nShall I auto-schedule all content for the next 30 days?",
};

interface AIManagerProps {
  darkMode: boolean;
}

export function AIManager({ darkMode }: AIManagerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  const sendMessage = (text: string = input) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text, time: "Just now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const key = Object.keys(aiResponses).find(k => text.toLowerCase().includes(k)) || "default";
      const aiMsg: Message = { role: "ai", content: aiResponses[key] || aiResponses.default, time: "Just now" };
      setMessages(prev => [...prev, aiMsg]);
    }, 1800);
  };

  const cardBase = {
    background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
    borderColor: darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)",
  };

  const renderContent = (content: string) => {
    const parts = content.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: darkMode ? "#e2e8f0" : "#0f172a", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Side panel */}
      <div className="w-64 flex-shrink-0 border-r flex flex-col" style={{ borderColor: cardBase.borderColor, background: darkMode ? "rgba(5,5,20,0.6)" : "rgba(248,250,252,0.8)" }}>
        <div className="p-4 border-b" style={{ borderColor: cardBase.borderColor }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}>
              <Bot size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>AI Manager</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-xs" style={{ color: "#10b981" }}>Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Business insights */}
        <div className="p-3 space-y-2 flex-shrink-0">
          <p className="text-xs font-semibold px-1" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>LIVE INSIGHTS</p>
          {[
            { icon: TrendingUp, label: "Engagement", value: "+28%", color: "#10b981" },
            { icon: Users, label: "New Leads", value: "12 hot", color: "#f59e0b" },
            { icon: BarChart3, label: "Reach", value: "31K today", color: "#6366f1" },
            { icon: Target, label: "Pipeline", value: "$1.2M", color: "#8b5cf6" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 px-2 py-2 rounded-xl"
              style={{ background: darkMode ? `${item.color}08` : `${item.color}05` }}
            >
              <item.icon size={13} style={{ color: item.color }} />
              <span className="text-xs flex-1" style={{ color: darkMode ? "#94a3b8" : "#475569" }}>{item.label}</span>
              <span className="text-xs font-semibold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Suggested questions */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold px-1 mb-2" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>SUGGESTIONS</p>
          <div className="space-y-1.5">
            {suggested.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="w-full text-left p-2.5 rounded-xl border text-xs transition-all hover:border-primary/20 group"
                style={{
                  borderColor: darkMode ? "rgba(99,102,241,0.08)" : "rgba(15,23,42,0.04)",
                  color: darkMode ? "#64748b" : "#64748b",
                }}
              >
                <span className="group-hover:text-primary transition-colors">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: cardBase.borderColor, background: darkMode ? "rgba(13,13,40,0.6)" : "rgba(255,255,255,0.8)" }}
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            <Brain size={16} className="text-white" />
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2" style={{ borderColor: darkMode ? "#020210" : "#ffffff" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: darkMode ? "#e2e8f0" : "#0f172a" }}>AI Business Manager</p>
            <p className="text-xs" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>Powered by RS Real Estate Â· Full business context loaded</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 rounded-xl hover:bg-primary/5 transition-all" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  <Bot size={14} className="text-white" />
                </div>
              )}
              <div className={`max-w-lg ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                  style={{
                    background: msg.role === "ai"
                      ? darkMode ? "rgba(13,13,40,0.9)" : "#ffffff"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: msg.role === "ai"
                      ? darkMode ? "#94a3b8" : "#475569"
                      : "#ffffff",
                    border: msg.role === "ai"
                      ? `1px solid ${darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)"}`
                      : "none",
                    boxShadow: msg.role === "user"
                      ? "0 4px 14px rgba(99,102,241,0.3)"
                      : darkMode ? "0 2px 16px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                    borderRadius: msg.role === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                  }}
                >
                  {renderContent(msg.content)}
                </div>
                {msg.role === "ai" && (
                  <div className="flex items-center gap-2 mt-2 ml-1">
                    <span className="text-xs" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>{msg.time}</span>
                    <button className="p-1 rounded hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#2d3748" : "#94a3b8" }}>
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

          {/* Typing indicator */}
          <AnimatePresence>
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                  <Bot size={14} className="text-white" />
                </div>
                <div
                  className="px-4 py-3 rounded-2xl flex items-center gap-1"
                  style={{
                    background: darkMode ? "rgba(13,13,40,0.9)" : "#ffffff",
                    border: `1px solid ${darkMode ? "rgba(99,102,241,0.12)" : "rgba(15,23,42,0.06)"}`,
                    borderRadius: "4px 16px 16px 16px",
                  }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: "#6366f1" }}
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t flex-shrink-0" style={{ borderColor: cardBase.borderColor, background: darkMode ? "rgba(5,5,20,0.8)" : "rgba(248,250,252,0.8)" }}>
          <div
            className="flex items-end gap-2 p-2 rounded-2xl border"
            style={{
              background: darkMode ? "rgba(13,13,40,0.8)" : "#ffffff",
              borderColor: darkMode ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.1)",
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Ask your AI business manager anything..."
              rows={1}
              className="flex-1 resize-none px-3 py-2 text-sm bg-transparent outline-none"
              style={{ color: darkMode ? "#e2e8f0" : "#0f172a", fontFamily: "inherit" }}
            />
            <div className="flex items-center gap-2 pb-2 pr-1">
              <button className="p-2 rounded-xl hover:bg-primary/10 transition-all" style={{ color: darkMode ? "#4a5568" : "#94a3b8" }}>
                <Mic size={15} />
              </button>
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || typing}
                className="p-2 rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: input.trim() ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : darkMode ? "rgba(99,102,241,0.1)" : "rgba(99,102,241,0.06)",
                  color: input.trim() ? "#ffffff" : darkMode ? "#4a5568" : "#94a3b8",
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: darkMode ? "#1e293b" : "#cbd5e1" }}>
            AI Manager has full access to your business data Â· <span style={{ color: darkMode ? "#818cf8" : "#6366f1" }}>Enterprise plan</span>
          </p>
        </div>
      </div>
    </div>
  );
}
