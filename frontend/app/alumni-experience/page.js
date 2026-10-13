"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Star, Send, X, Plus, ChevronLeft, Building2, Briefcase, 
  MessageSquare, Lightbulb, Trophy, Search, Filter, ArrowLeft, Sparkles,
  Phone, Mail, ExternalLink
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
            className={`w-5 h-5 transition-colors ${
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
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form state
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [batch, setBatch] = useState("2025");
  const [questions, setQuestions] = useState("");
  const [advice, setAdvice] = useState("");
  const [rating, setRating] = useState(4);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    
    setUser(JSON.parse(storedUser));
    fetchFeedbacks(token);
  }, []);

  const fetchFeedbacks = async (token) => {
    try {
      const res = await fetch("http://localhost:5001/api/feedback", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Failed to fetch feedbacks", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mandatory LinkedIn URL check
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
    
    const interviewQuestions = questions.split('\n').filter(q => q.trim() !== "");

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
    setQuestions(""); 
    setAdvice(""); 
    setRating(4);
  };

  const filtered = feedbacks.filter(fb =>
    !searchQuery || 
    fb.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fb.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const canShare = user?.isPlaced || user?.role === 'admin';

  if (!user) return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#8b9a6e] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f2eb] relative overflow-hidden">
      {/* Decorative BG */}
      <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-[#8b9a6e]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#eae2d6]/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 border-b border-white/60 backdrop-blur-xl bg-white/40"
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="p-2.5 rounded-xl bg-white/60 border border-white/50 shadow-sm hover:bg-white/80 transition-all text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Alumni Experience Hub</h1>
              <p className="text-gray-500 text-sm">Real insights from seniors who cracked top companies</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by company..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2.5 rounded-xl bg-white/60 backdrop-blur border border-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b9a6e] focus:bg-white/80 transition-all w-56"
              />
            </div>
            {canShare && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-semibold text-sm shadow-lg shadow-[#8b9a6e]/20 hover:shadow-[#8b9a6e]/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                Share Experience
              </motion.button>
            )}
          </div>
        </div>
      </motion.header>

      {/* Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-6 relative z-10"
      >
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MessageSquare className="w-4 h-4 text-[#8b9a6e]" />
          <span><strong className="text-gray-900">{feedbacks.length}</strong> experiences shared</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 className="w-4 h-4 text-[#8b9a6e]" />
          <span><strong className="text-gray-900">{new Set(feedbacks.map(f => f.company)).size}</strong> companies covered</span>
        </div>
        {searchQuery && (
          <div className="flex items-center gap-2 text-sm text-[#8b9a6e] font-medium ml-auto">
            <Filter className="w-4 h-4" />
            {filtered.length} results for "{searchQuery}"
            <button onClick={() => setSearchQuery("")} className="ml-1 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>

      {/* Share Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
              onClick={resetForm}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
                      <p className="text-gray-500 text-sm mt-1">Help your juniors prepare for their interviews</p>
                    </div>
                    <button onClick={resetForm} className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Building2 className="w-4 h-4 inline mr-1.5 text-[#8b9a6e]" />
                          Company
                        </label>
                        <input 
                          required type="text" value={company} 
                          onChange={e => setCompany(e.target.value)}
                          placeholder="e.g. Google, Microsoft..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Briefcase className="w-4 h-4 inline mr-1.5 text-[#8b9a6e]" />
                          Role / Job Title
                        </label>
                        <input 
                          required type="text" value={jobTitle} 
                          onChange={e => setJobTitle(e.target.value)}
                          placeholder="e.g. Software Engineer..."
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Mandatory LinkedIn Profile URL */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                          <LinkedInIcon className="w-4 h-4 text-blue-600" />
                          LinkedIn Profile URL
                        </label>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          * Mandatory
                        </span>
                      </div>
                      <input 
                        required 
                        type="url" 
                        value={linkedinUrl} 
                        onChange={e => setLinkedinUrl(e.target.value)}
                        placeholder="https://www.linkedin.com/in/username"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white"
                      />
                    </div>

                    {/* Optional Contact Details & Batch */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone (Optional)
                        </label>
                        <input 
                          type="tel" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400" /> Email (Optional)
                        </label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)}
                          placeholder="senior@college.edu"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                          Graduation Batch
                        </label>
                        <input 
                          type="text" 
                          value={batch} 
                          onChange={e => setBatch(e.target.value)}
                          placeholder="e.g. 2025"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:ring-2 focus:ring-[#8b9a6e] bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-1.5 text-[#8b9a6e]" />
                        Interview Questions <span className="text-gray-400 font-normal">(one per line)</span>
                      </label>
                      <textarea 
                        required value={questions} 
                        onChange={e => setQuestions(e.target.value)}
                        rows={5}
                        placeholder={"What is the difference between var, let, and const?\nExplain the virtual DOM.\nHow does garbage collection work in JavaScript?"}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <Lightbulb className="w-4 h-4 inline mr-1.5 text-amber-500" />
                        Advice for Juniors
                      </label>
                      <textarea 
                        required value={advice} 
                        onChange={e => setAdvice(e.target.value)}
                        rows={3}
                        placeholder="Focus heavily on DSA strings and arrays, system design basics..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none text-sm transition-all bg-gray-50 focus:bg-white resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Difficulty Rating
                      </label>
                      <div className="flex items-center gap-4">
                        <StarRating value={rating} onChange={setRating} />
                        <span className="text-sm text-gray-500">
                          {["", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"][rating]}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button" onClick={resetForm}
                        className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" disabled={isSubmitting}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-[#8b9a6e]/20"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Experience"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pb-16 relative z-10">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 text-center"
          >
            <div className="w-20 h-20 bg-white/80 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/50">
              {searchQuery ? <Search className="w-9 h-9 text-gray-400" /> : <Sparkles className="w-9 h-9 text-[#8b9a6e]" />}
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchQuery ? `No results for "${searchQuery}"` : "Be the First to Share!"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto text-sm leading-relaxed">
              {searchQuery 
                ? "Try a different company name or clear your search." 
                : "No interview experiences shared yet. If you've been placed, share your journey to help your juniors!"
              }
            </p>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-6 px-6 py-2.5 rounded-xl bg-white/60 border border-white/50 text-gray-700 font-medium text-sm hover:bg-white/80 transition-all shadow-sm"
              >
                Clear Search
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filtered.map(fb => (
              <motion.div 
                key={fb._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="group bg-white/60 backdrop-blur-xl p-7 rounded-3xl shadow-xl border border-white/50 flex flex-col h-full hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                {/* Background gradient */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#8b9a6e]/8 to-transparent rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                
                {/* Company Header */}
                <div className="flex items-start justify-between mb-5 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b9a6e]/15 to-[#8b9a6e]/5 flex items-center justify-center text-[#8b9a6e] shadow-inner border border-[#8b9a6e]/20 shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#8b9a6e] transition-colors leading-tight">{fb.company}</h3>
                      <p className="text-[#8b9a6e] font-semibold text-sm">{fb.jobTitle}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StarRating value={fb.rating} readonly />
                  </div>
                </div>

                {/* Difficulty Badge */}
                <div className="mb-4 relative z-10">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                    fb.rating >= 4 ? "bg-red-50 text-red-700 border border-red-100" :
                    fb.rating === 3 ? "bg-amber-50 text-amber-700 border border-amber-100" :
                    "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  }`}>
                    <Trophy className="w-3 h-3" />
                    {["", "Very Easy", "Easy", "Moderate", "Hard", "Very Hard"][fb.rating]} Interview
                  </span>
                </div>

                {/* Questions Section */}
                <div className="flex-grow mb-5 relative z-10">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#8b9a6e]" />
                    Questions Asked
                  </h4>
                  <ul className="space-y-2">
                    {fb.interviewQuestions.slice(0, 4).map((q, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#8b9a6e]/10 text-[#8b9a6e] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="line-clamp-2">{q}</span>
                      </li>
                    ))}
                    {fb.interviewQuestions.length > 4 && (
                      <li className="text-xs text-gray-400 italic pl-7">+{fb.interviewQuestions.length - 4} more questions...</li>
                    )}
                  </ul>
                </div>

                {/* Advice Section */}
                <div className="border-t border-gray-100/80 pt-4 relative z-10">
                  <h4 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Advice
                  </h4>
                  <p className="text-sm text-gray-600 italic leading-relaxed line-clamp-3">&ldquo;{fb.advice}&rdquo;</p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-100/60 flex items-center justify-between gap-2 relative z-10">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8b9a6e] to-[#6b7a4e] flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {(fb.authorName || fb.user?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs text-gray-800 font-bold block truncate leading-tight">
                        {fb.authorName || fb.user?.name || "Senior Alumni"}
                      </span>
                      <span className="text-[10px] text-gray-400 block truncate">
                        {fb.batch ? `Batch ${fb.batch}` : "Placed Senior"}
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
                        <span>LinkedIn</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </a>
                    )}
                    {fb.email && (
                      <a
                        href={`mailto:${fb.email}`}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all border border-gray-200"
                        title={`Email: ${fb.email}`}
                      >
                        <Mail className="w-3 h-3" />
                      </a>
                    )}
                    {fb.phone && (
                      <a
                        href={`tel:${fb.phone}`}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-all border border-gray-200"
                        title={`Phone: ${fb.phone}`}
                      >
                        <Phone className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}
