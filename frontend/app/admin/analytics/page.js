"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, TrendingUp, Award, Building2, AlertTriangle, 
  CheckCircle, BarChart3, ArrowLeft, RefreshCw, AlertCircle,
  BrainCircuit, History, Sparkles, BookOpen, Layers, ShieldCheck
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, delay = 0, sublabel = null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50 relative overflow-hidden group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${color}/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-4xl font-black text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      {sublabel && <p className="text-xs text-[#8b9a6e] font-semibold mt-1">{sublabel}</p>}
    </motion.div>
  );
}

function RiskBadge({ level }) {
  const styles = {
    High: "bg-red-50 text-red-700 border-red-200",
    Medium: "bg-amber-50 text-amber-700 border-amber-200",
    Low: "bg-emerald-50 text-emerald-700 border-emerald-200"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${styles[level] || styles.Medium}`}>
      {level === "High" && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
      {level === "Medium" && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
      {level === "Low" && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
      {level} Risk
    </span>
  );
}

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [pastTrends, setPastTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("All");
  const [rankingMode, setRankingMode] = useState("top"); // 'top' (Highest Chances / Best Resume) | 'risk' (At-Risk First)
  const [activeTab, setActiveTab] = useState("predictive"); // 'predictive' | 'historical'

  const branchComparison = useMemo(() => {
    if (!Array.isArray(predictiveData)) return [];
    const map = {};
    predictiveData.forEach(p => {
      const code = p.branch || 'General';
      if (!map[code]) map[code] = { branch: code, count: 0, highRisk: 0, sumProb: 0 };
      map[code].count += 1;
      map[code].sumProb += p.placementProbability;
      if (p.riskLevel === 'High') map[code].highRisk += 1;
    });
    return Object.values(map).map(b => ({
      ...b,
      avgProb: Math.round(b.sumProb / (b.count || 1))
    })).sort((a, b) => b.count - a.count);
  }, [predictiveData]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      const [analyticsRes, predictiveRes, pastTrendsRes] = await Promise.all([
        fetch("http://localhost:5001/api/analytics", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5001/api/analytics/predictive", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5001/api/analytics/past-trends", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (analyticsRes.ok) setData(await analyticsRes.json());
      if (predictiveRes.ok) setPredictiveData(await predictiveRes.json());
      if (pastTrendsRes.ok) setPastTrends(await pastTrendsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPredictions = useMemo(() => {
    if (!Array.isArray(predictiveData)) return [];
    let list = predictiveData.filter(s => 
      riskFilter === "All" || s.riskLevel === riskFilter
    );
    if (rankingMode === "top") {
      // Best resume & highest placement probability first
      return [...list].sort((a, b) => b.placementProbability - a.placementProbability || b.avgMatchScore - a.avgMatchScore);
    } else {
      // Lowest placement probability first (early warning / at-risk)
      return [...list].sort((a, b) => a.placementProbability - b.placementProbability || a.avgMatchScore - b.avgMatchScore);
    }
  }, [predictiveData, riskFilter, rankingMode]);

  const maxCompanyCount = data?.topCompanies?.length > 0 
    ? Math.max(...data.topCompanies.map(c => c.count)) 
    : 1;

  if (loading) return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#8b9a6e] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading placement analytics & ML models...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
      <p className="text-gray-500">Failed to load analytics. <button onClick={fetchData} className="text-[#8b9a6e] underline">Retry</button></p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f2eb] relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-[#8b9a6e]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-[#eae2d6]/50 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/60 backdrop-blur-xl bg-white/40 relative z-10"
      >
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/admin")}
              className="p-2.5 rounded-xl bg-white/60 border border-white/50 shadow-sm hover:bg-white/80 transition-all text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-[#8b9a6e]" />
                Placement Analytics & ML Intelligence
              </h1>
              <p className="text-gray-500 text-sm">
                The National Institute of Engineering (NIE), Mysore
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/companies")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 border border-white/50 text-gray-700 text-sm font-semibold hover:bg-white/90 transition-all shadow-sm"
            >
              <Building2 className="w-4 h-4 text-[#8b9a6e]" />
              Company Intelligence
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 border border-white/50 text-gray-600 text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-8 py-10 relative z-10 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200/60 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("predictive")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === "predictive"
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-white/50"
              }`}
            >
              <BrainCircuit className="w-4 h-4 text-[#8b9a6e]" />
              Predictive Risk & Live Cohort
            </button>
            <button
              onClick={() => setActiveTab("historical")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                activeTab === "historical"
                  ? "bg-gray-900 text-white shadow-lg"
                  : "bg-white/60 text-gray-600 hover:bg-white/80 border border-white/50"
              }`}
            >
              <History className="w-4 h-4 text-[#8b9a6e]" />
              NIE Past Year Trends (2021-2025) & ML Model
            </button>
          </div>
          
          {pastTrends?.mlModel && (
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#8b9a6e]/10 border border-[#8b9a6e]/30 text-[#4c5737] text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#8b9a6e]" />
              ML Engine: {pastTrends.mlModel.model_type?.split(' ')[0]} ({pastTrends.mlModel.metrics?.accuracy}% Accuracy)
            </div>
          )}
        </div>

        {/* Tab 1: Predictive & Live Cohort */}
        {activeTab === "predictive" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard 
                icon={Users} label="Total Students" 
                value={data.totalStudents} 
                color="from-blue-500 to-indigo-600" delay={0} 
              />
              <StatCard 
                icon={Award} label="Placed Students" 
                value={data.placedStudents} 
                color="from-emerald-500 to-teal-600" delay={0.1} 
              />
              <StatCard 
                icon={TrendingUp} label="Placement Rate" 
                value={`${data.placementRate.toFixed(1)}%`} 
                color="from-[#8b9a6e] to-[#5b6a3e]" delay={0.2} 
              />
              <StatCard 
                icon={Building2} label="Active Recruiters" 
                value={data.topCompanies?.length || 0} 
                color="from-purple-500 to-violet-600" delay={0.3} 
              />
            </div>

            {/* Batch Stats + Top Companies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Batch Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#8b9a6e]" />
                  Batch-wise Placement Breakdown
                </h2>
                {data.batchStats?.length > 0 ? (
                  <div className="space-y-4">
                    {data.batchStats.map((batch, idx) => (
                      <div key={idx} className="group">
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="font-bold text-gray-800">Batch {batch.batchYear || 'Unassigned'}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">{batch.placedStudents}/{batch.totalStudents}</span>
                            <span className="font-black text-[#8b9a6e] min-w-[40px] text-right">{batch.placementRate.toFixed(0)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${batch.placementRate}%` }}
                            transition={{ delay: 0.5 + idx * 0.1, duration: 0.8, ease: "easeOut" }}
                            className="h-2.5 rounded-full bg-gradient-to-r from-[#8b9a6e] to-[#5b6a3e]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 italic py-8">No batch data available yet.</p>
                )}
              </motion.div>

              {/* Top Companies */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
              >
                <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#8b9a6e]" />
                  Core Campus Recruiters
                </h2>
                {data.topCompanies?.length > 0 ? (
                  <div className="space-y-4">
                    {data.topCompanies.map((tc, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <span className="w-36 text-sm font-semibold text-gray-800 truncate shrink-0">{tc.company}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(tc.count / maxCompanyCount) * 100}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                            className="h-2.5 rounded-full bg-gradient-to-r from-[#8b9a6e] to-emerald-600"
                          />
                        </div>
                        <span className="text-sm font-black text-gray-900 min-w-[24px] text-right">{tc.count}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 italic py-8">No job postings yet.</p>
                )}
              </motion.div>
            </div>

            {/* Predictive Early Warning Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#8b9a6e]" />
                    Internal Student Talent & Placement Readiness Ranking
                    <span className="ml-2 px-2.5 py-0.5 bg-[#8b9a6e]/15 text-[#4b5834] text-xs font-bold rounded-full border border-[#8b9a6e]/30">
                      {rankingMode === "top" ? "🌟 Top Talent First" : "⚠️ At-Risk First"}
                    </span>
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Internal ranking based on AI resume match score, coding assessment, and ML probability
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Ranking Mode Toggle */}
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setRankingMode("top")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        rankingMode === "top"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Top Talent
                    </button>
                    <button
                      onClick={() => setRankingMode("risk")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        rankingMode === "risk"
                          ? "bg-white text-gray-900 shadow-xs"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      At-Risk
                    </button>
                  </div>

                  {/* Risk Filter */}
                  <div className="flex gap-1.5">
                    {["All", "High", "Medium", "Low"].map(level => (
                      <button
                        key={level}
                        onClick={() => setRiskFilter(level)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          riskFilter === level 
                            ? "bg-gray-900 text-white shadow-md" 
                            : "bg-white/60 text-gray-600 hover:bg-white/80 border border-white/50"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Branch-wise Risk Breakdown */}
              {branchComparison.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {branchComparison.map(b => (
                    <div key={b.branch} className="bg-white/80 p-4 rounded-2xl border border-gray-100 shadow-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{b.branch} Branch</span>
                        <span className="text-[11px] font-semibold text-gray-400">{b.count} Students</span>
                      </div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-xl font-extrabold text-gray-900">{b.avgProb}% Prob.</span>
                        <span className={`text-xs font-bold ${b.highRisk > 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {b.highRisk} at High Risk
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-orange-400 to-[#8b9a6e]"
                          style={{ width: `${Math.min(100, b.avgProb)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 w-12">Rank</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 pl-2">Student</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Cohort</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">CGPA</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">AI Resume Match</th>
                      <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">ML Placement Chance</th>
                      <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Risk Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredPredictions.slice(0, 15).map((student, idx) => (
                      <tr key={student._id || idx} className="hover:bg-white/50 transition-colors group">
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${
                            idx === 0 && rankingMode === "top" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                            idx === 1 && rankingMode === "top" ? "bg-slate-200 text-slate-700" :
                            idx === 2 && rankingMode === "top" ? "bg-orange-100 text-orange-800" :
                            "text-gray-400 font-semibold"
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8b9a6e]/20 to-[#8b9a6e]/5 flex items-center justify-center text-[#8b9a6e] font-bold text-sm shrink-0">
                              {(student.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{student.name}</p>
                              {student.usn && <p className="text-xs text-gray-400">{student.usn}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-sm text-gray-600 font-medium">
                            {student.batch !== 'N/A' ? `Batch ${student.batch}` : '—'}
                            {student.branch && student.branch !== 'N/A' ? ` · ${student.branch}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`font-bold text-sm ${
                            student.cgpa >= 8 ? 'text-emerald-600' : 
                            student.cgpa >= 7 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {student.cgpa || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="text-sm font-semibold text-gray-700">{student.avgMatchScore}%</span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-24 bg-gray-100 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  student.placementProbability >= 70 ? 'bg-emerald-500' :
                                  student.placementProbability >= 40 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${student.placementProbability}%` }}
                              />
                            </div>
                            <span className={`font-black text-sm min-w-[36px] ${
                              student.placementProbability >= 70 ? 'text-emerald-600' :
                              student.placementProbability >= 40 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {student.placementProbability}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 text-center">
                          <RiskBadge level={student.riskLevel} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPredictions.length === 0 && (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">
                      {riskFilter === "All" ? "No unplaced students found." : `No ${riskFilter} risk students.`}
                    </p>
                  </div>
                )}
              </div>

              {filteredPredictions.length > 15 && (
                <p className="text-center text-xs text-gray-400 mt-4 italic">
                  Showing top 15 of {filteredPredictions.length} students ranked by priority need
                </p>
              )}
            </motion.div>
          </div>
        )}

        {/* Tab 2: NIE Historical Placement Trends (2021-2025) & ML Insights */}
        {activeTab === "historical" && pastTrends && (
          <div className="space-y-8">
            {/* College & ML Header Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-gray-900 via-gray-800 to-[#3b442b] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#c8d8a7] text-xs font-bold mb-4">
                  <Sparkles className="w-3.5 h-3.5" />
                  Synthetic Tier-3 Engineering Benchmark Dataset
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  NIE Mysore: 5-Year Longitudinal Placement Dynamics
                </h2>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Synthesized using historical recruitment trends from The National Institute of Engineering (NIE), Mysore. Analyzed across 1,500 candidate profiles to train an ensemble Gradient Boosting Classifier for proactive placement interventions.
                </p>

                {pastTrends.mlModel && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Model Type</p>
                      <p className="text-sm font-bold text-white mt-0.5">Gradient Boosting</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Model Accuracy</p>
                      <p className="text-sm font-bold text-[#c8d8a7] mt-0.5">{pastTrends.mlModel.metrics?.accuracy}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">ROC-AUC Score</p>
                      <p className="text-sm font-bold text-white mt-0.5">{pastTrends.mlModel.metrics?.roc_auc}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Training Cohorts</p>
                      <p className="text-sm font-bold text-white mt-0.5">1,500 Students</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Historical Batches Table & Yearly Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <History className="w-5 h-5 text-[#8b9a6e]" />
                Year-Over-Year Placement Trends (Batches 2021 – 2025)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                {pastTrends.historicalBatches?.map(b => (
                  <div key={b.year} className="bg-white/80 p-5 rounded-2xl border border-gray-100 shadow-xs">
                    <p className="text-xs font-bold text-gray-400 uppercase">Batch {b.year}</p>
                    <p className="text-2xl font-black text-gray-900 mt-1">{b.placementRate}%</p>
                    <p className="text-xs text-gray-500 mt-0.5">{b.placed}/{b.eligible} Placed</p>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Avg Package:</span>
                        <span className="font-bold text-[#8b9a6e]">{b.avgCtc} LPA</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Highest:</span>
                        <span className="font-bold text-gray-700">{b.highestCtc} LPA</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Branch Trends & Feature Importances */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Branch Trends */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#8b9a6e]" />
                  Branch-wise Placement Performance (NIE Mysore)
                </h3>

                <div className="space-y-5">
                  {pastTrends.branchTrends?.map(bt => (
                    <div key={bt.code} className="bg-white/80 p-5 rounded-2xl border border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900 text-sm">{bt.branch} Branch</span>
                        <span className="text-sm font-black text-[#8b9a6e]">{bt.avgPlacementRate}% Placed</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
                        <div 
                          className="h-2.5 rounded-full bg-gradient-to-r from-[#8b9a6e] to-emerald-600"
                          style={{ width: `${bt.avgPlacementRate}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Average Package: <strong className="text-gray-800">{bt.avgCtc} LPA</strong></span>
                        <span>Key Roles: <strong className="text-gray-800">{bt.topRole}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* ML Feature Importance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-[#8b9a6e]" />
                  What Drives Placement Success? (ML Feature Importance)
                </h3>

                {pastTrends.mlModel?.feature_importances ? (
                  <div className="space-y-3.5">
                    {Object.entries(pastTrends.mlModel.feature_importances).map(([feat, imp], i) => {
                      const labels = {
                        dsa_score: "Coding Assessment & DSA Score",
                        skill_match: "Resume AI Skill Match against JD",
                        cgpa: "Academic CGPA",
                        soft_skills: "Interview Communication & Soft Skills",
                        twelfth_pct: "12th Standard Marks",
                        tenth_pct: "10th Standard Marks",
                        active_backlogs: "Active Backlogs Penalty",
                        internships: "Verified Industry Internships",
                        projects: "Production Projects Count",
                        history_backlogs: "History of Backlogs Penalty"
                      };
                      return (
                        <div key={feat} className="flex items-center gap-3 text-xs">
                          <span className="w-48 font-semibold text-gray-700 truncate">{labels[feat] || feat}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-[#8b9a6e] to-[#5b6a3e]"
                              style={{ width: `${Math.min(100, imp * 2.5)}%` }}
                            />
                          </div>
                          <span className="font-bold text-gray-900 min-w-[35px] text-right">{imp}%</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">Feature importances loading...</p>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
