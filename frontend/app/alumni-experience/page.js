"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Send, X, Plus, Building2, Briefcase, 
  MessageSquare, Lightbulb, Trophy, Search, Filter, ArrowLeft, Sparkles,
  Phone, Mail, ExternalLink, CheckCircle2, ChevronRight, Layers, Award
} from "lucide-react";

function LinkedInIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.54a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/>
    </svg>
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange && onChange(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition-all ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star 
            className={`w-4 h-4 transition-colors ${
              (hovered || value) >= n 
                ? "text-amber-400 fill-amber-400" 
                : "text-gray-300"
            }`} 
          />
        </button>
      ))}
    </div>
  );
}

export default function AlumniExperience() {
  const router = useRouter();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedRoundsModal, setSelectedRoundsModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  
  // Form state
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("2025");
  const [ctc, setCtc] = useState("");
  const [questions, setQuestions] = useState("");
  const [advice, setAdvice] = useState("");
  const [rating, setRating] = useState(4);

  useEffect(() => {
    let token = null;
    try {
      token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Local storage error:", e);
    }
    
    fetchFeedbacks(token);
  }, []);

  const fetchFeedbacks = async (tok) => {
    setLoading(true);
    try {
      const headers = tok ? { "Authorization": `Bearer ${tok}` } : {};
      const res = await fetch("http://localhost:5001/api/feedback", { headers });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!user.isPlaced && user.role !== 'admin') {
      alert("Alumni Mentorship sharing is reserved for placed students and verified alumni. Keep preparing—your offer is on the way!");
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!linkedinUrl.trim()) {
      alert("LinkedIn profile URL is mandatory for authentic alumni mentorship.");
      return;
    }
    if (!linkedinUrl.toLowerCase().includes("linkedin.com/")) {
      alert("Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem("token");
    const interviewQuestions = questions.split('\n').map(q => q.trim()).filter(Boolean);

    try {
      const res = await fetch("http://localhost:5001/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          company, 
          jobTitle, 
          linkedinUrl: linkedinUrl.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          batch: batch.trim() || undefined,
          ctc: ctc ? Number(ctc) : undefined,
          interviewQuestions, 
          advice, 
          rating: Number(rating) 
        })
      });

      if (res.ok) {
        setShowForm(false);
        resetForm();
        fetchFeedbacks(token);
      } else {
        const errorData = await res.json();
        alert(`Failed: ${errorData.message}`);
      }
    } catch (err) {
      alert("Error submitting feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setCompany(""); 
    setJobTitle(""); 
    setLinkedinUrl("");
    setPhone("");
    setEmail("");
    setBatch("2025");
    setCtc("");
    setQuestions(""); 
    setAdvice(""); 
    setRating(4);
  };

  // Distinct company list for filter pills
  const companies = ["ALL", ...Array.from(new Set(feedbacks.map(f => f.company).filter(Boolean)))];

  const filtered = feedbacks.filter(fb => {
    const matchesCompany = selectedCompany === "ALL" || fb.company?.toLowerCase() === selectedCompany.toLowerCase();
    if (!matchesCompany) return false;
    if (!searchQuery.trim()) return true;
    
    const q = searchQuery.toLowerCase();
    return (
      fb.company?.toLowerCase().includes(q) ||
      fb.jobTitle?.toLowerCase().includes(q) ||
      fb.authorName?.toLowerCase().includes(q) ||
      fb.user?.name?.toLowerCase().includes(q) ||
      fb.advice?.toLowerCase().includes(q) ||
      (Array.isArray(fb.interviewQuestions) && fb.interviewQuestions.some(iq => iq?.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen bg-[#f7f2eb] relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-10%] right-[-5%] w-[45vw] h-[45vw] bg-[#8b9a6e]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#eae2d6]/60 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-white/60 backdrop-blur-xl bg-white/40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(user?.role === 'admin' ? '/admin' : '/dashboard')}
              className="p-2.5 rounded-xl bg-white/70 border border-white/60 shadow-sm hover:bg-white transition-all text-gray-500 hover:text-gray-800"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Alumni Experience Hub</h1>
                <span className="bg-[#8b9a6e]/15 text-[#5c6943] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#8b9a6e]/30">
                  Verified Seniors
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-0.5">
                Authentic interview questions, round-by-round strategies, and career guidance from alumni
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search company, senior, or topic..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-white/70 backdrop-blur border border-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b9a6e] focus:bg-white transition-all w-64 text-gray-800 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleShareClick}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-semibold text-sm shadow-lg shadow-[#8b9a6e]/20 hover:shadow-[#8b9a6e]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Share Experience</span>
            </button>
          </div>
        </div>

        {/* Company Filter Pills */}
        <div className="max-w-7xl mx-auto px-6 pb-4 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {companies.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCompany(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedCompany === c 
                  ? "bg-[#8b9a6e] text-white shadow-md shadow-[#8b9a6e]/20 scale-105" 
                  : "bg-white/60 text-gray-600 hover:bg-white/90 border border-white/50"
              }`}
            >
              {c === "ALL" ? `All Companies (${feedbacks.length})` : c}
            </button>
          ))}
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 relative z-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white/50 backdrop-blur-md p-7 rounded-3xl border border-white/40 h-80 animate-pulse flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-gray-200 rounded" />
                      <div className="w-24 h-3 bg-gray-200 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-12 bg-gray-200/70 rounded-xl mb-4" />
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-gray-200/50 rounded" />
                    <div className="w-4/5 h-3 bg-gray-200/50 rounded" />
                  </div>
                </div>
                <div className="w-full h-8 bg-gray-200/60 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/50">
              {searchQuery ? <Search className="w-9 h-9 text-gray-400" /> : <Sparkles className="w-9 h-9 text-[#8b9a6e]" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery ? `No results for "${searchQuery}"` : "No experiences in this category yet"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed mb-6">
              {searchQuery 
                ? "Try searching for a different company, topic, or clear your filters to view all entries." 
                : "Be the first senior to share interview rounds and questions for this company!"}
            </p>
            {(searchQuery || selectedCompany !== "ALL") && (
              <button 
                onClick={() => { setSearchQuery(""); setSelectedCompany("ALL"); }}
                className="px-6 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all shadow-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(fb => (
              <div 
                key={fb._id}
                className="group bg-white/70 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/60 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {/* Header: Company + Rating + CTC */}
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b9a6e]/20 to-[#8b9a6e]/5 flex items-center justify-center text-[#5c6943] shadow-inner border border-[#8b9a6e]/30 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#5c6943] transition-colors leading-tight truncate">
                          {fb.company}
                        </h3>
                        {fb.ctc && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                            {fb.ctc} LPA
                          </span>
                        )}
                      </div>
                      <p className="text-[#6b7a4e] font-semibold text-xs truncate mt-0.5">{fb.jobTitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <StarRating value={fb.rating || 4} readonly />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      fb.rating >= 4 ? "bg-red-50 text-red-700 border border-red-100" :
                      fb.rating === 3 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                      "bg-emerald-50 text-emerald-700 border border-emerald-100"
                    }`}>
                      {["", "Very Easy", "Easy", "Moderate", "Hard", "Very Hard"][fb.rating || 4]}
                    </span>
                  </div>
                </div>

                {/* Interview Questions Preview */}
                <div className="flex-grow mb-4 relative z-10">
                  <h4 className="font-bold text-gray-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#8b9a6e]" />
                    Interview Questions
                  </h4>
                  <ul className="space-y-1.5">
                    {(fb.interviewQuestions || []).slice(0, 3).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed bg-white/50 p-2 rounded-xl border border-white/60">
                        <span className="w-4 h-4 rounded-full bg-[#8b9a6e]/15 text-[#5c6943] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="line-clamp-2">{q}</span>
                      </li>
                    ))}
                    {(fb.interviewQuestions?.length || 0) > 3 && (
                      <li className="text-[11px] text-[#6b7a4e] font-semibold pl-1">
                        +{(fb.interviewQuestions?.length || 0) - 3} more questions...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Advice Quote */}
                {fb.advice && (
                  <div className="border-t border-gray-100/90 pt-3 mb-4 relative z-10">
                    <h4 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                      Advice for Juniors
                    </h4>
                    <p className="text-xs text-gray-600 italic leading-relaxed line-clamp-3 bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/50">
                      &ldquo;{fb.advice}&rdquo;
                    </p>
                  </div>
                )}

                {/* View Rounds Button (If Rounds present) */}
                {fb.rounds && fb.rounds.length > 0 && (
                  <button
                    onClick={() => setSelectedRoundsModal(fb)}
                    className="w-full mb-3 py-2 px-3 rounded-xl bg-[#8b9a6e]/10 hover:bg-[#8b9a6e]/20 text-[#5c6943] font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-[#8b9a6e]/25"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>View {fb.rounds.length} Detailed Rounds (OA & Tech)</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  </button>
                )}

                {/* Footer: Author Info & Contact */}
                <div className="mt-auto pt-3 border-t border-gray-100/80 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b9a6e] to-[#5c6943] flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                      {(fb.authorName || fb.user?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-900 font-bold block truncate leading-tight">
                          {fb.authorName || fb.user?.name || "Alumni Senior"}
                        </span>
                        <CheckCircle2 className="w-3 h-3 text-[#5c6943] shrink-0" title="Verified Alumni" />
                      </div>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {fb.batch ? `Batch ${fb.batch}` : "Placed Senior"} • {fb.user?.branch || "CSE/ISE"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {fb.linkedinUrl && (
                      <a
                        href={fb.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold transition-all border border-blue-200"
                        title="View Verified LinkedIn Profile"
                      >
                        <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden sm:inline">Connect</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    )}
                    {fb.email && (
                      <a
                        href={`mailto:${fb.email}`}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all border border-gray-200"
                        title={`Email: ${fb.email}`}
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {fb.phone && (
                      <a
                        href={`tel:${fb.phone}`}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all border border-gray-200"
                        title={`Phone: ${fb.phone}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Rounds Breakdown Modal */}
      {selectedRoundsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 md:p-8 relative">
            <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{selectedRoundsModal.company} Interview Breakdown</h3>
                  {selectedRoundsModal.ctc && (
                    <span className="bg-emerald-50 text-emerald-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {selectedRoundsModal.ctc} LPA
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Shared by {selectedRoundsModal.authorName || selectedRoundsModal.user?.name} ({selectedRoundsModal.jobTitle})
                </p>
              </div>
              <button 
                onClick={() => setSelectedRoundsModal(null)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedRoundsModal.rounds?.map((round, idx) => (
                <div key={idx} className="bg-gray-50/80 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[#5c6943] bg-[#8b9a6e]/15 px-2.5 py-0.5 rounded-md">
                      Round {round.roundNumber || idx + 1}: {round.roundName}
                    </span>
                  </div>
                  {round.details && (
                    <p className="text-xs text-gray-700 leading-relaxed mb-3">
                      {round.details}
                    </p>
                  )}
                  {round.questions && round.questions.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                        Specific Questions Asked:
                      </span>
                      <ul className="space-y-1">
                        {round.questions.map((rq, rqIdx) => (
                          <li key={rqIdx} className="text-xs text-gray-800 flex items-start gap-2">
                            <span className="text-[#8b9a6e] font-bold">•</span>
                            <span>{rq}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedRoundsModal(null)}
                className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold text-xs hover:bg-gray-800 transition-all"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Experience Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
                <p className="text-gray-500 text-xs mt-1">Help your juniors ace their interviews with authentic round insights</p>
              </div>
              <button onClick={resetForm} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <Building2 className="w-3.5 h-3.5 inline mr-1 text-[#8b9a6e]" /> Company Name
                  </label>
                  <input 
                    required type="text" value={company} 
                    onChange={e => setCompany(e.target.value)}
                    placeholder="e.g. Google, FitTech, BMW..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <Briefcase className="w-3.5 h-3.5 inline mr-1 text-[#8b9a6e]" /> Job Role
                  </label>
                  <input 
                    required type="text" value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)}
                    placeholder="e.g. Software Engineer..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile URL
                  </label>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">
                    * Mandatory for Mentorship
                  </span>
                </div>
                <input 
                  required 
                  type="url" 
                  value={linkedinUrl} 
                  onChange={e => setLinkedinUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/username"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-gray-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-gray-400" /> Phone (Optional)
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98450 12345"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-gray-400" /> Email (Optional)
                  </label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)}
                    placeholder="senior@nie.ac.in"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Package / CTC (LPA)
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={ctc} 
                    onChange={e => setCtc(e.target.value)}
                    placeholder="e.g. 24.5"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  <MessageSquare className="w-3.5 h-3.5 inline mr-1 text-[#8b9a6e]" /> Interview Questions (One per line)
                </label>
                <textarea 
                  required value={questions} 
                  onChange={e => setQuestions(e.target.value)}
                  rows={4}
                  placeholder={"Explain LRU Cache implementation\nFind median of running integer stream\nDesign database indexing strategy"}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-gray-50 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  <Lightbulb className="w-3.5 h-3.5 inline mr-1 text-amber-500" /> Advice & Strategy for Juniors
                </label>
                <textarea 
                  required value={advice} 
                  onChange={e => setAdvice(e.target.value)}
                  rows={3}
                  placeholder="Focus on DSA graphs and trees. Clarify edge cases before writing code..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-gray-50 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Interview Difficulty Rating
                </label>
                <div className="flex items-center gap-3">
                  <StarRating value={rating} onChange={setRating} />
                  <span className="text-xs font-bold text-gray-600">
                    {["", "Very Easy", "Easy", "Moderate", "Hard", "Very Hard"][rating]}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button 
                  type="button" onClick={resetForm}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-xs hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-bold text-xs flex items-center justify-center gap-2 hover:opacity-95 transition-opacity disabled:opacity-60 shadow-lg shadow-[#8b9a6e]/20"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  {isSubmitting ? "Submitting..." : "Submit Experience"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
