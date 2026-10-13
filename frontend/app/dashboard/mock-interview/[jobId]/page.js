"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Bot, Send, Loader2, Sparkles, CheckCircle2, 
  AlertCircle, Briefcase, Building2, Lightbulb, RefreshCw, Trophy
} from "lucide-react";

export default function MockInterview({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const jobId = unwrappedParams.jobId;

  const [job, setJob] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSkillGap, setLoadingSkillGap] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // 1. Fetch Job & Skill-Gap Analysis
    fetchJobAndSkillGap(token);

    // 2. Start Interview Session
    startInterview(token);
  }, [jobId]);

  const fetchJobAndSkillGap = async (token) => {
    setLoadingSkillGap(true);
    try {
      const jobRes = await fetch(`http://localhost:5001/api/jobs/${jobId}`);
      if (jobRes.ok) {
        const jobData = await jobRes.json();
        setJob(jobData);
      }

      const gapRes = await fetch("http://localhost:5001/api/copilot/skill-gap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ jobId })
      });
      if (gapRes.ok) {
        const gapData = await gapRes.json();
        setSkillGap(gapData);
      }
    } catch (err) {
      console.error("Error fetching skill gap:", err);
    } finally {
      setLoadingSkillGap(false);
    }
  };

  const startInterview = async (token) => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/copilot/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, chatHistory: [] })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([{ role: "assistant", content: data.reply }]);
      } else {
        setMessages([{ role: "assistant", content: `Error: ${data.message || 'Failed to start interview'}` }]);
      }
    } catch {
      setMessages([{ role: "assistant", content: "Error connecting to the Copilot. Please check your network." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { role: "user", content: input.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5001/api/copilot/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ jobId, chatHistory: updatedMessages })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${data.message}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error receiving response from Copilot." }]);
    } finally {
      setLoading(false);
    }
  };

  const companyName = job?.company?.name || job?.company || "Company";

  return (
    <div className="flex flex-col h-screen bg-[#f7f2eb] text-[#333333]">
      
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3.5 flex justify-between items-center shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#8b9a6e]" />
                AI Mock Interview • {companyName}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#8b9a6e]/15 text-[#5b6a3e]">
                RAG Simulator
              </span>
            </div>
            <p className="text-[11px] text-gray-500">{job?.title || "Target Role"} • Skill-Gap Oriented Grilling</p>
          </div>
        </div>

        <button 
          onClick={() => router.push("/dashboard")}
          className="text-xs px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
        >
          End Session
        </button>
      </header>

      {/* Main Content Area: Skill Gap Sidebar + Chat */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-6xl w-full mx-auto p-4 gap-4">
        
        {/* Left Drawer / Panel: Skill Gap Analysis */}
        <div className="md:w-80 shrink-0 bg-white/70 backdrop-blur-md rounded-2xl border border-white p-4 shadow-sm flex flex-col overflow-y-auto max-h-56 md:max-h-full">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 text-[#8b9a6e]" />
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Skill Gap Analysis</h2>
          </div>

          {loadingSkillGap ? (
            <div className="py-6 text-center text-xs text-gray-400">Analyzing resume vs JD...</div>
          ) : skillGap ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-gray-500">Requirements Match</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-[#8b9a6e] to-[#5b6a3e] h-full rounded-full transition-all"
                      style={{ width: `${skillGap.skill_match_percentage || 0}%` }}
                    />
                  </div>
                  <span className="font-bold text-xs text-gray-800">{skillGap.skill_match_percentage}%</span>
                </div>
              </div>

              {/* Matched Skills */}
              <div>
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Matched Skills ({skillGap.matched_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1">
                  {skillGap.matched_skills?.length > 0 ? (
                    skillGap.matched_skills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">No direct matches</span>
                  )}
                </div>
              </div>

              {/* Missing Skills (The Gap) */}
              <div>
                <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Skill Gaps To Prepare ({skillGap.missing_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1">
                  {skillGap.missing_skills?.length > 0 ? (
                    skillGap.missing_skills.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-medium">Profile covers all core skills!</span>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {skillGap.recommendations?.length > 0 && (
                <div className="bg-[#f7f2eb] p-2.5 rounded-xl border border-gray-200 text-[11px] text-gray-700 space-y-1">
                  <span className="font-bold flex items-center gap-1 text-gray-900">
                    <Lightbulb className="w-3.5 h-3.5 text-[#8b9a6e]" /> Copilot Tip:
                  </span>
                  <p className="leading-relaxed">{skillGap.recommendations[0]}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No job details available</div>
          )}
        </div>

        {/* Right Area: Interactive Mock Chat */}
        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-gray-900 text-white rounded-br-none shadow-xs font-medium" 
                    : "bg-[#f7f2eb]/90 border border-gray-200 text-gray-800 rounded-bl-none shadow-xs"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f7f2eb] border border-gray-200 text-gray-600 rounded-2xl rounded-bl-none px-4 py-2.5 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8b9a6e]" />
                  <span>Evaluating answer & formulating question...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <footer className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer (explain approach, architecture, or solution)..."
                disabled={loading}
                className="flex-1 px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b9a6e]/50 disabled:bg-gray-100 text-gray-900"
              />
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit</span>
              </button>
            </form>
          </footer>
        </div>

      </div>

    </div>
  );
}
