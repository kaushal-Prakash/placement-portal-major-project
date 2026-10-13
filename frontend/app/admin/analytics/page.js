"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, TrendingUp, Award, Building2, AlertTriangle, 
  CheckCircle, BarChart3, ArrowLeft, RefreshCw, AlertCircle
} from "lucide-react";

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
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
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState("All");

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    try {
      const [analyticsRes, predictiveRes] = await Promise.all([
        fetch("http://localhost:5001/api/analytics", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:5001/api/analytics/predictive", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (analyticsRes.ok) setData(await analyticsRes.json());
      if (predictiveRes.ok) setPredictiveData(await predictiveRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filteredPredictions = predictiveData?.filter(s => 
    riskFilter === "All" || s.riskLevel === riskFilter
  ) || [];

  const maxCompanyCount = data?.topCompanies?.length > 0 
    ? Math.max(...data.topCompanies.map(c => c.count)) 
    : 1;

  if (loading) return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#8b9a6e] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading analytics...</p>
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
      {/* Background */}
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
                Placement Analytics
              </h1>
              <p className="text-gray-500 text-sm">Real-time overview of placement performance</p>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/60 border border-white/50 text-gray-600 text-sm font-medium hover:bg-white/80 transition-all shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-8 py-10 relative z-10 space-y-8">
        
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
            icon={Building2} label="Companies Hiring" 
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
              Top Hiring Companies
            </h2>
            {data.topCompanies?.length > 0 ? (
              <div className="space-y-4">
                {data.topCompanies.map((tc, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="w-32 text-sm font-semibold text-gray-800 truncate shrink-0">{tc.company}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(tc.count / maxCompanyCount) * 100}%` }}
                        transition={{ delay: 0.6 + i * 0.1, duration: 0.8, ease: "easeOut" }}
                        className="h-2.5 rounded-full bg-gradient-to-r from-purple-400 to-violet-500"
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

        {/* Predictive Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/70 backdrop-blur-xl rounded-3xl p-7 shadow-xl border border-white/50"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                AI Predictive Analytics
                <span className="ml-2 px-2.5 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full border border-orange-200">
                  Early Warning
                </span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">Students ranked by placement probability (lowest first — needs attention)</p>
            </div>
            
            {/* Risk Filter */}
            <div className="flex gap-2">
              {["All", "High", "Medium", "Low"].map(level => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3 pl-2">Student</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Batch · Branch</th>
                  <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">CGPA</th>
                  <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Avg Match</th>
                  <th className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Probability</th>
                  <th className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider pb-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPredictions.slice(0, 15).map((student, idx) => (
                  <tr key={student._id || idx} className="hover:bg-white/50 transition-colors group">
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
                      <span className="text-sm text-gray-600">
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
              Showing top 15 of {filteredPredictions.length} students
            </p>
          )}
        </motion.div>
      </main>
    </div>
  );
}
