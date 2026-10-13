"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, TrendingUp, Award, Banknote, Search, 
  ExternalLink, MessageSquare, Star, ArrowLeft, RefreshCw, 
  Sparkles, CheckCircle2, ChevronRight, X, Briefcase, BookOpen, Layers
} from "lucide-react";

export default function CompanyIntelligencePage() {
  const router = useRouter();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [sortBy, setSortBy] = useState("package"); // 'package' | 'conversion' | 'drives' | 'name'
  const [activeModalCompany, setActiveModalCompany] = useState(null);

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const fetchIntelligence = async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/companies/intelligence", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load company intelligence");
      const data = await res.json();
      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load company analytics");
    } finally {
      setLoading(false);
    }
  };

  // Industries list
  const industries = useMemo(() => {
    const set = new Set(["All"]);
    companies.forEach(c => {
      if (c.industry) set.add(c.industry);
    });
    return Array.from(set);
  }, [companies]);

  // Filtered and sorted companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter(c => {
        const matchesSearch = (c.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.topSkills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesIndustry = selectedIndustry === "All" || c.industry === selectedIndustry;
        return matchesSearch && matchesIndustry;
      })
      .sort((a, b) => {
        if (sortBy === "package") return (b.avgCTC || 0) - (a.avgCTC || 0);
        if (sortBy === "conversion") return (b.conversionRate || 0) - (a.conversionRate || 0);
        if (sortBy === "drives") return (b.totalDrives || 0) - (a.totalDrives || 0);
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [companies, searchQuery, selectedIndustry, sortBy]);

  // Overall KPIs
  const kpis = useMemo(() => {
    const totalRecruiters = companies.length;
    const maxPackage = Math.max(0, ...companies.map(c => c.maxCTC || c.avgCTC || 0));
    const totalPlaced = companies.reduce((acc, c) => acc + (c.totalPlaced || 0), 0);
    const avgConversion = totalRecruiters 
      ? Math.round(companies.reduce((acc, c) => acc + (c.conversionRate || 0), 0) / totalRecruiters) 
      : 0;
    return { totalRecruiters, maxPackage, totalPlaced, avgConversion };
  }, [companies]);

  return (
    <div className="min-h-screen bg-[#f7f2eb] p-6 sm:p-8 relative overflow-hidden font-sans">
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#8b9a6e]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#eae2d6]/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Bar */}
      <header className="max-w-7xl mx-auto mb-8 relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-2xl bg-white/70 border border-white/60 shadow-sm hover:bg-white text-gray-600 transition-all"
            title="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#8b9a6e]/15 text-[#5b6a3e] text-[11px] font-bold uppercase tracking-wider">
                Recruiter Intelligence
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              Company Intelligence & Historical Analytics
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Explore visiting recruiters, past package trends, conversion rates, and tested technical skills.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchIntelligence}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white/70 border border-white/60 text-gray-700 text-xs font-bold hover:bg-white transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#8b9a6e]" : ""}`} />
            Refresh
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="max-w-7xl mx-auto mb-8 grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Active Recruiters</span>
            <Building2 className="w-4 h-4 text-[#8b9a6e]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.totalRecruiters}</p>
          <p className="text-[11px] text-gray-400 mt-1">Visiting campus companies</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Highest Package</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">{kpis.maxPackage} <span className="text-sm font-bold text-gray-500">LPA</span></p>
          <p className="text-[11px] text-gray-400 mt-1">Top CTC offered on campus</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Hired</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-gray-900">{kpis.totalPlaced}</p>
          <p className="text-[11px] text-gray-400 mt-1">Students placed across drives</p>
        </div>

        <div className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl border border-white/60 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Avg Conversion</span>
            <TrendingUp className="w-4 h-4 text-[#8b9a6e]" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[#5b6a3e]">{kpis.avgConversion}%</p>
          <p className="text-[11px] text-gray-400 mt-1">Overall applied-to-placed ratio</p>
        </div>
      </section>

      {/* Search & Filter Controls */}
      <section className="max-w-7xl mx-auto mb-6 relative z-10 flex flex-col md:flex-row gap-4 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/60 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or skill (e.g., Google, React, Python)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white/80 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#8b9a6e] transition-all text-gray-800 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap justify-between md:justify-end">
          {/* Industry Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {industries.slice(0, 4).map(ind => (
              <button
                key={ind}
                onClick={() => setSelectedIndustry(ind)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                  selectedIndustry === ind
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white/80 text-gray-600 hover:bg-white"
                }`}
              >
                {ind}
              </button>
            ))}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold shrink-0">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/80 border border-gray-200 rounded-lg px-2.5 py-1 text-xs font-bold text-gray-700 focus:outline-none"
            >
              <option value="package">Highest CTC</option>
              <option value="conversion">Conversion Rate</option>
              <option value="drives">Most Drives</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Company Grid */}
      <main className="max-w-7xl mx-auto relative z-10">
        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#8b9a6e] mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-600">Loading recruiter intelligence...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="py-20 text-center bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/60 shadow-sm max-w-lg mx-auto">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-800">No recruiters found</h3>
            <p className="text-xs text-gray-500 mt-1">Try modifying your search or clearing the industry filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.map(c => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/70 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                <div>
                  {/* Top card bar: Logo, Title, Industry */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8b9a6e]/20 to-[#6b7a4e]/10 border border-[#8b9a6e]/20 flex items-center justify-center text-[#5b6a3e] font-black text-lg shadow-inner shrink-0">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#5b6a3e] transition-colors leading-tight">
                          {c.name}
                        </h3>
                        <span className="text-[11px] font-semibold text-gray-500">
                          {c.industry || "Technology"}
                        </span>
                      </div>
                    </div>

                    {c.avgDifficulty && (
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-[11px] font-bold text-amber-800">{c.avgDifficulty}</span>
                      </div>
                    )}
                  </div>

                  {/* CTC & Conversion Highlights */}
                  <div className="grid grid-cols-2 gap-2 mb-4 bg-gray-50/70 p-3 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg Package</span>
                      <span className="text-base font-black text-gray-900">
                        {c.avgCTC ? `${c.avgCTC} LPA` : "Confidential"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Conversion Rate</span>
                      <span className="text-base font-black text-[#5b6a3e]">
                        {c.conversionRate}%
                      </span>
                    </div>
                  </div>

                  {/* Tested Technical Skills */}
                  <div className="mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#8b9a6e]" /> Most Tested Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(c.topSkills || []).map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#8b9a6e]/10 text-[#5b6a3e] border border-[#8b9a6e]/15"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-2 mt-2">
                  <button
                    onClick={() => setActiveModalCompany(c)}
                    className="text-xs font-bold text-[#5b6a3e] hover:text-[#3b4a1e] flex items-center gap-1"
                  >
                    View Historical Questions <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {c.latestJobId && (
                    <button
                      onClick={() => router.push(`/dashboard/mock-interview/${c.latestJobId}`)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white text-[11px] font-bold shadow-sm hover:opacity-95 flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3 h-3" /> AI Mock
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Historical Questions Modal */}
      <AnimatePresence>
        {activeModalCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalCompany(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full relative z-10 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#8b9a6e]/15 text-[#5b6a3e] flex items-center justify-center font-bold">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{activeModalCompany.name}</h3>
                    <p className="text-xs text-gray-500">Historical Interview Intelligence</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalCompany(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 my-4">
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#8b9a6e]" /> Questions Asked to Seniors
                  </h4>
                  {activeModalCompany.sampleQuestions?.length > 0 ? (
                    <ul className="space-y-2">
                      {activeModalCompany.sampleQuestions.map((q, idx) => (
                        <li key={idx} className="text-xs text-gray-700 leading-relaxed flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-[#8b9a6e]/20 text-[#5b6a3e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      No direct questions logged yet. Students are invited to submit feedback once placed!
                    </p>
                  )}
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Preparation Takeaway
                  </h4>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Focus on {activeModalCompany.topSkills?.join(", ")}. Use the AI Mock Interview feature to practice these topics under realistic pressure.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveModalCompany(null);
                    router.push("/alumni-experience");
                  }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-50 transition-all text-center"
                >
                  View All Alumni Reviews
                </button>

                {activeModalCompany.latestJobId && (
                  <button
                    onClick={() => {
                      const jId = activeModalCompany.latestJobId;
                      setActiveModalCompany(null);
                      router.push(`/dashboard/mock-interview/${jId}`);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-bold text-xs hover:opacity-95 shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" /> Start AI Mock
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
