"use client";
import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Bot, Send, Loader2, Sparkles, CheckCircle2, 
  AlertCircle, Briefcase, Building2, Lightbulb, RefreshCw, Trophy,
  Mic, MicOff, Volume2, VolumeX
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

  // Voice speech-to-text & text-to-speech states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [voiceInterviewerEnabled, setVoiceInterviewerEnabled] = useState(true);
  const recognitionRef = useRef(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Web Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setInput(prev => {
              const base = prev.trim();
              // Prevent rapid duplicate repeats
              if (base.endsWith(currentTranscript.trim())) return base;
              return base ? `${base} ${currentTranscript.trim()}` : currentTranscript.trim();
            });
          }
        };

        recognition.onerror = (event) => {
          console.warn("Speech recognition notice:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not available in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error("Speech start error:", err);
      }
    }
  };

  const speakText = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[\*#_`]/g, "").replace(/🎯/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

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
        if (voiceInterviewerEnabled) {
          speakText(data.reply);
        }
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

    // If currently recording voice, stop listening
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

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
        if (voiceInterviewerEnabled) {
          speakText(data.reply);
        }
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
    <div className="flex flex-col h-screen bg-[#f7f2eb] text-[#333333] font-sans">
      
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-3.5 flex justify-between items-center shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              router.push("/dashboard");
            }}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-[#8b9a6e]" />
                AI Voice Mock Interview • {companyName}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#8b9a6e]/15 text-[#5b6a3e]">
                RAG Simulator
              </span>
            </div>
            <p className="text-[11px] text-gray-500">{job?.title || "Target Role"} • Spoken Technical Grilling</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice Interviewer Read-Aloud Toggle */}
          <button
            onClick={() => {
              const nextState = !voiceInterviewerEnabled;
              setVoiceInterviewerEnabled(nextState);
              if (!nextState && typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              voiceInterviewerEnabled 
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs" 
                : "bg-gray-100 text-gray-500 border-gray-200"
            }`}
            title="Toggle whether AI Interviewer reads questions aloud"
          >
            {voiceInterviewerEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Voice Audio: {voiceInterviewerEnabled ? "ON" : "OFF"}</span>
          </button>

          <button 
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
              }
              router.push("/dashboard");
            }}
            className="text-xs px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition"
          >
            End Session
          </button>
        </div>
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
                  {(skillGap.matched_skills || []).map((skill, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!skillGap.matched_skills || skillGap.matched_skills.length === 0) && (
                    <span className="text-[11px] text-gray-400 italic">None identified</span>
                  )}
                </div>
              </div>

              {/* Missing Skills (Grilling Targets) */}
              <div>
                <span className="text-[11px] font-bold text-red-600 flex items-center gap-1 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Missing Skills ({skillGap.missing_skills?.length || 0})
                </span>
                <div className="flex flex-wrap gap-1">
                  {(skillGap.missing_skills || []).map((skill, sIdx) => (
                    <span 
                      key={sIdx} 
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-red-50 text-red-600 border border-red-100"
                    >
                      {skill}
                    </span>
                  ))}
                  {(!skillGap.missing_skills || skillGap.missing_skills.length === 0) && (
                    <span className="text-[11px] text-emerald-600 font-medium">All core skills covered!</span>
                  )}
                </div>
              </div>

              {/* Study Recommendations */}
              {skillGap.recommendations?.length > 0 && (
                <div className="pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1 mb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Focus Topics
                  </span>
                  <ul className="space-y-1 text-[11px] text-gray-600">
                    {skillGap.recommendations.map((rec, rIdx) => (
                      <li key={rIdx} className="leading-snug flex items-start gap-1.5">
                        <span className="text-[#8b9a6e] font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No job details available</div>
          )}
        </div>

        {/* Right Area: Interactive Voice & Text Mock Chat */}
        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed relative group ${
                  msg.role === "user" 
                    ? "bg-gray-900 text-white rounded-br-none shadow-xs font-medium" 
                    : "bg-[#f7f2eb]/90 border border-gray-200 text-gray-800 rounded-bl-none shadow-xs"
                }`}>
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {msg.role === "assistant" && (
                    <button
                      type="button"
                      onClick={() => speakText(msg.content)}
                      className="mt-2 text-[10px] font-bold text-[#5b6a3e] hover:text-[#3b4a1e] flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Replay Audio"
                    >
                      <Volume2 className="w-3 h-3" /> Read aloud
                    </button>
                  )}
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

          {/* Voice Status Pill when actively listening */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-red-500/10 border-t border-red-200 px-4 py-2 flex items-center justify-between text-xs text-red-700 font-bold"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0" />
                  <span>Listening to your spoken answer... Speak clearly into your mic</span>
                </div>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="text-[11px] underline font-extrabold text-red-800"
                >
                  Done Speaking
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chat Input & Voice Bar */}
          <footer className="p-3 bg-white border-t border-gray-100">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? "Listening... (your words appear here)" : "Speak or type your answer..."}
                disabled={loading}
                className="flex-1 px-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b9a6e]/50 disabled:bg-gray-100 text-gray-900"
              />

              {/* Voice Microphone Button */}
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={loading}
                  className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center shrink-0 border ${
                    isListening
                      ? "bg-red-600 text-white border-red-700 shadow-md animate-pulse"
                      : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200 shadow-2xs"
                  }`}
                  title={isListening ? "Stop voice listening" : "Click to speak your response"}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-[#8b9a6e]" />}
                </button>
              )}

              {/* Send / Submit Button */}
              <button 
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs shrink-0"
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
