"use client";
import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Building2, Briefcase, Banknote, GraduationCap, Users, 
  FileCheck, Calendar, Award, Search, ArrowUpDown, Download, Share2, 
  ExternalLink, FileText, CheckCircle, AlertCircle, Clock, Copy, 
  Check, Mail, BookOpen, Layers, RefreshCw, ChevronDown, Filter, Lock
} from "lucide-react";

export default function CompanyDrivePage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id;

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("matchScore"); // 'matchScore', 'cgpa', 'name', 'date', 'backlogs'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'
  
  // Selection for bulk actions
  const [selectedAppIds, setSelectedAppIds] = useState(new Set());
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Share modal state
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [copiedRosterText, setCopiedRosterText] = useState(false);

  // Interview scheduling state
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMsg, setScheduleMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(storedUser);
    if (user.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    if (jobId) {
      fetchJobDetailsAndApplications(token);
    }
  }, [jobId]);

  const fetchJobDetailsAndApplications = async (token) => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Job
      const jobRes = await fetch(`http://localhost:5001/api/jobs/${jobId}`);
      if (!jobRes.ok) throw new Error("Failed to load job details");
      const jobData = await jobRes.json();
      setJob(jobData);

      // 2. Fetch Applications
      const appsRes = await fetch(`http://localhost:5001/api/applications/job/${jobId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!appsRes.ok) throw new Error("Failed to load applications");
      const appsData = await appsRes.json();
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Error loading company drive details");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/applications/${appId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setApplications(prev => prev.map(app => 
          app._id === appId ? { ...app, status: newStatus } : app
        ));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating candidate status");
    }
  };

  const handleBulkUpdateStatus = async (newStatus) => {
    if (selectedAppIds.size === 0) return;
    setIsUpdatingStatus(true);
    const token = localStorage.getItem("token");
    try {
      await Promise.all(
        Array.from(selectedAppIds).map(appId =>
          fetch(`http://localhost:5001/api/applications/${appId}/status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          })
        )
      );
      setApplications(prev => prev.map(app => 
        selectedAppIds.has(app._id) ? { ...app, status: newStatus } : app
      ));
      setSelectedAppIds(new Set());
    } catch (err) {
      console.error(err);
      alert("Error performing bulk status update");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleScheduleInterviews = async () => {
    const token = localStorage.getItem("token");
    setIsScheduling(true);
    setScheduleMsg("");
    try {
      const res = await fetch(`http://localhost:5001/api/interviews/schedule/${jobId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ startDate: scheduleDate, startTime: scheduleTime })
      });
      const data = await res.json();
      if (res.ok) {
        setScheduleMsg(data.message || "Interviews scheduled successfully!");
        fetchJobDetailsAndApplications(token);
      } else {
        setScheduleMsg(data.message || "Failed to schedule interviews");
      }
    } catch (err) {
      console.error(err);
      setScheduleMsg("Error connecting to interview scheduling service");
    } finally {
      setIsScheduling(false);
    }
  };

  // KPI Computations
  const stats = useMemo(() => {
    const total = applications.length;
    const shortlisted = applications.filter(a => a.status === "shortlisted").length;
    const interviewing = applications.filter(a => a.status === "interviewing").length;
    const placed = applications.filter(a => a.status === "placed").length;
    const rejected = applications.filter(a => a.status === "rejected").length;
    const applied = applications.filter(a => a.status === "applied" || !a.status).length;
    
    const cgpas = applications.map(a => a.user?.cgpa).filter(c => typeof c === "number");
    const avgCgpa = cgpas.length > 0 ? (cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2) : "N/A";

    return { total, shortlisted, interviewing, placed, rejected, applied, avgCgpa };
  }, [applications]);

  // Filtering & Sorting
  const processedApplications = useMemo(() => {
    let result = [...applications];

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(app => (app.status?.toLowerCase() || "applied") === statusFilter.toLowerCase());
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(app => {
        const name = (app.user?.name || "").toLowerCase();
        const email = (app.user?.email || "").toLowerCase();
        const usn = (app.user?.usn || "").toLowerCase();
        const branchName = (app.user?.branch?.name || "").toLowerCase();
        const branchCode = (app.user?.branch?.code || "").toLowerCase();
        const skills = (app.user?.skills || []).map(s => String(s).toLowerCase()).join(" ");

        return name.includes(q) || email.includes(q) || usn.includes(q) || branchName.includes(q) || branchCode.includes(q) || skills.includes(q);
      });
    }

    // Sorting
    result.sort((a, b) => {
      let valA, valB;

      switch (sortField) {
        case "cgpa":
          valA = a.user?.cgpa ?? 0;
          valB = b.user?.cgpa ?? 0;
          break;
        case "name":
          valA = (a.user?.name || "").toLowerCase();
          valB = (b.user?.name || "").toLowerCase();
          return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
        case "date":
          valA = new Date(a.createdAt || 0).getTime();
          valB = new Date(b.createdAt || 0).getTime();
          break;
        case "backlogs":
          valA = a.user?.activeBacklogs ?? 0;
          valB = b.user?.activeBacklogs ?? 0;
          break;
        case "matchScore":
        default:
          valA = a.matchScore ?? -1;
          valB = b.matchScore ?? -1;
          break;
      }

      if (sortOrder === "asc") return valA > valB ? 1 : valA < valB ? -1 : 0;
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    return result;
  }, [applications, statusFilter, searchQuery, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(new Set(processedApplications.map(a => a._id)));
    } else {
      setSelectedAppIds(new Set());
    }
  };

  const toggleSelectApp = (id) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (processedApplications.length === 0) {
      alert("No applicant records to export.");
      return;
    }

    const companyName = job?.company?.name || job?.company || "Company";
    const jobTitle = job?.title || "Job";

    const headers = [
      "Sl No",
      "Candidate Name",
      "USN",
      "Email",
      "Branch",
      "Batch Year",
      "CGPA",
      "10th Marks (%)",
      "12th Marks (%)",
      "Active Backlogs",
      "History of Backlogs",
      "Skills",
      "AI Match Score (%)",
      "Application Status",
      "Applied Date",
      "Resume Link"
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = processedApplications.map((app, index) => {
      const u = app.user || {};
      const branchStr = u.branch ? `${u.branch.code || ""} - ${u.branch.name || ""}`.trim() : "N/A";
      const batchStr = u.batch?.year || "N/A";
      const skillsStr = Array.isArray(u.skills) ? u.skills.join(", ") : (u.skills || "N/A");
      const resumeLink = u.resumeUrl ? `http://localhost:5001${u.resumeUrl}` : "N/A";
      const appliedDate = app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "N/A";

      return [
        index + 1,
        escapeCsv(u.name || "N/A"),
        escapeCsv(u.usn || "N/A"),
        escapeCsv(u.email || "N/A"),
        escapeCsv(branchStr),
        escapeCsv(batchStr),
        u.cgpa ?? "N/A",
        u.tenthMarks ?? "N/A",
        u.twelfthMarks ?? "N/A",
        u.activeBacklogs ?? 0,
        u.historyOfBacklogs ?? 0,
        escapeCsv(skillsStr),
        app.matchScore !== null && app.matchScore !== undefined ? `${app.matchScore}%` : "N/A",
        escapeCsv(app.status || "Applied"),
        escapeCsv(appliedDate),
        escapeCsv(resumeLink)
      ].join(",");
    });

    // Add UTF-8 BOM so Excel opens Hindi/special characters correctly
    const csvContent = "\uFEFF" + [headers.map(escapeCsv).join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeCompany = companyName.replace(/[^a-zA-Z0-9]/g, "_");
    const safeTitle = jobTitle.replace(/[^a-zA-Z0-9]/g, "_");
    link.href = url;
    link.setAttribute("download", `${safeCompany}_${safeTitle}_Applicants_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Generate formatted text roster to share with recruiters
  const generateRosterText = () => {
    const companyName = job?.company?.name || job?.company || "Company";
    const jobTitle = job?.title || "Job";
    let text = `📋 APPLICANT ROSTER: ${companyName} - ${jobTitle}\n`;
    text += `Total Applicants: ${processedApplications.length} | Package: ${job?.ctc || "N/A"} LPA\n`;
    text += `Generated on: ${new Date().toLocaleDateString()}\n`;
    text += "--------------------------------------------------------\n";

    processedApplications.forEach((app, idx) => {
      const u = app.user || {};
      const branchCode = u.branch?.code || u.branch?.name || "N/A";
      const resumeLink = u.resumeUrl ? `http://localhost:5001${u.resumeUrl}` : "No resume";
      text += `${idx + 1}. ${u.name || "N/A"} | USN: ${u.usn || "N/A"} | Branch: ${branchCode} | CGPA: ${u.cgpa ?? "N/A"} | Status: ${(app.status || "applied").toUpperCase()} | Score: ${app.matchScore ? `${app.matchScore}%` : "N/A"}\n   Resume: ${resumeLink}\n\n`;
    });

    return text;
  };

  const handleCopyRoster = async () => {
    const text = generateRosterText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRosterText(true);
      setTimeout(() => setCopiedRosterText(false), 2500);
    } catch {
      alert("Failed to copy roster to clipboard.");
    }
  };

  const handleShareRoster = async () => {
    const text = generateRosterText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${job?.company?.name || "Company"} - Applied Candidates`,
          text: text
        });
      } catch (err) {
        if (err.name !== "AbortError") {
          setShowShareModal(true);
        }
      }
    } else {
      setShowShareModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] flex flex-col items-center justify-center p-6">
        <RefreshCw className="w-8 h-8 animate-spin text-[#8b9a6e] mb-3" />
        <p className="text-gray-700 font-semibold text-sm">Loading company drive page...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#f7f2eb] flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-md border border-red-200 max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-1">Company Drive Not Found</h2>
          <p className="text-gray-600 text-xs mb-4">{error || "Could not retrieve the company drive details."}</p>
          <button
            onClick={() => router.push("/admin")}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition"
          >
            Back to Admin Dashboard
          </button>
        </div>
      </div>
    );
  }

  const companyName = job.company?.name || job.company || "Company";

  return (
    <div className="min-h-screen bg-[#f7f2eb] p-4 sm:p-6 lg:p-8 text-[#333333] relative">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Navigation & Back Button */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/admin")}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-gray-900 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-gray-200 shadow-2xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#8b9a6e]" />
            Back to Admin Dashboard
          </button>

          {/* Action Buttons: Export Excel & Share */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
              title="Download Excel spreadsheet with full applicant details"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleShareRoster}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold shadow-sm transition"
              title="Share or copy applicant list to share with company recruiter"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Roster</span>
            </button>
          </div>
        </div>

        {/* Company Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-white shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-[#8b9a6e]/15 border border-[#8b9a6e]/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-[#5b6a3e]" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                      {companyName}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#8b9a6e]/15 text-[#5b6a3e] border border-[#8b9a6e]/30">
                      Company Drive
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${job.status === "closed" ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"}`}>
                      {job.status === "closed" ? "Drive Closed" : "Active Drive"}
                    </span>
                  </div>
                  <p className="text-base font-semibold text-gray-700 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-4 h-4 text-gray-400" />
                    {job.title}
                  </p>
                </div>
              </div>

              {/* Badges Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {job.ctc > 0 && (
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                    {job.ctc} LPA Package
                  </span>
                )}
                <span className="px-2.5 py-1 bg-orange-50 text-orange-800 border border-orange-200 rounded-lg text-xs font-semibold">
                  Min CGPA: {job.minCgpa ?? job.requiredCgpa ?? "None"}
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold">
                  Max Backlogs: {job.maxBacklogs ?? 0}
                </span>
                {job.driveLink && (
                  <a
                    href={job.driveLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Drive Link / JD
                  </a>
                )}
              </div>

              {/* Allowed Branches and Batches */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-600">
                {job.allowedBranches && job.allowedBranches.length > 0 ? (
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                    <strong className="text-gray-900">Eligible Branches: </strong>
                    {job.allowedBranches.map(b => b.code || b.name).join(", ")}
                  </span>
                ) : (
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                    Open to All Academic Branches
                  </span>
                )}

                {job.allowedBatches && job.allowedBatches.length > 0 && (
                  <span className="bg-gray-100 px-2.5 py-1 rounded-md font-medium text-gray-700">
                    <strong className="text-gray-900">Batches: </strong>
                    {job.allowedBatches.map(b => b.year).join(", ")}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Auto-Schedule Card */}
            <div className="bg-[#f7f2eb]/80 p-4 rounded-2xl border border-gray-200 lg:w-80 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-gray-900">Auto-Schedule Shortlisted</h3>
              </div>
              <p className="text-[11px] text-gray-600 mb-3">Distribute 30-min interview slots to shortlisted candidates.</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleScheduleInterviews}
                disabled={isScheduling}
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition shadow-xs flex items-center justify-center gap-1.5"
              >
                {isScheduling ? "Generating Slots..." : "Run Auto-Schedule"}
              </button>
              {scheduleMsg && (
                <p className={`text-[11px] font-semibold text-center mt-2 ${scheduleMsg.includes("success") || scheduleMsg.includes("Scheduled") ? "text-emerald-700" : "text-gray-700"}`}>
                  {scheduleMsg}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* KPI Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-600" /> Applied
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1">{stats.total}</span>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" /> Shortlisted
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1">{stats.shortlisted}</span>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-purple-600" /> Interviewing
            </span>
            <span className="text-2xl font-black text-purple-700 mt-1">{stats.interviewing}</span>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-600" /> Placed
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1">{stats.placed}</span>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Rejected
            </span>
            <span className="text-2xl font-black text-red-700 mt-1">{stats.rejected}</span>
          </div>

          <div className="bg-white/80 p-4 rounded-2xl border border-white shadow-sm flex flex-col">
            <span className="text-[11px] font-bold text-[#5b6a3e] uppercase tracking-wider flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#5b6a3e]" /> Avg CGPA
            </span>
            <span className="text-2xl font-black text-gray-900 mt-1">{stats.avgCgpa}</span>
          </div>
        </div>

        {/* Search, Filter, Sort & Bulk Actions Bar */}
        <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white shadow-md space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates by name, USN, email, branch, skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b9a6e]/50 text-gray-900 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-500">Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="bg-transparent text-xs font-bold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="matchScore">AI Match Score</option>
                  <option value="cgpa">CGPA</option>
                  <option value="name">Candidate Name</option>
                  <option value="date">Applied Date</option>
                  <option value="backlogs">Active Backlogs</option>
                </select>
                <button
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  className="text-xs font-extrabold text-gray-700 hover:text-gray-900 px-1"
                  title="Toggle Ascending / Descending"
                >
                  {sortOrder === "asc" ? "↑ Asc" : "↓ Desc"}
                </button>
              </div>

              {/* Results Count Badge */}
              <span className="text-xs font-bold px-3 py-2 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-xl">
                Showing {processedApplications.length} of {applications.length}
              </span>
            </div>
          </div>

          {/* Status Filter Tabs & Bulk Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
            {/* Status Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "all", label: "All Applicants", count: stats.total },
                { id: "applied", label: "Applied", count: stats.applied },
                { id: "shortlisted", label: "Shortlisted", count: stats.shortlisted },
                { id: "interviewing", label: "Interviewing", count: stats.interviewing },
                { id: "placed", label: "Placed", count: stats.placed },
                { id: "rejected", label: "Rejected", count: stats.rejected }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                    statusFilter === tab.id
                      ? "bg-gray-900 text-white shadow-xs"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${statusFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Bulk Action Controls */}
            {selectedAppIds.size > 0 && (
              <div className="flex items-center gap-2 bg-[#8b9a6e]/10 p-1.5 rounded-xl border border-[#8b9a6e]/30">
                <span className="text-xs font-bold text-[#5b6a3e] px-1">
                  {selectedAppIds.size} selected:
                </span>
                <select
                  disabled={isUpdatingStatus}
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkUpdateStatus(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="text-xs bg-white border border-gray-300 rounded-lg px-2 py-1 font-semibold text-gray-800 outline-none cursor-pointer"
                >
                  <option value="">Bulk Set Status...</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="placed">Placed</option>
                  <option value="rejected">Rejected</option>
                  <option value="applied">Applied</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Applicants Table */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white shadow-lg overflow-hidden">
          {processedApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-700 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedAppIds.size > 0 && selectedAppIds.size === processedApplications.length}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-[#8b9a6e] focus:ring-[#8b9a6e]"
                      />
                    </th>
                    <th className="p-3 cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("name")}>
                      <span className="flex items-center gap-1">
                        Candidate & USN {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </th>
                    <th className="p-3">Academic Branch</th>
                    <th className="p-3 cursor-pointer hover:bg-gray-100 transition text-center" onClick={() => toggleSort("cgpa")}>
                      <span className="flex items-center justify-center gap-1">
                        CGPA {sortField === "cgpa" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </th>
                    <th className="p-3 text-center">Marks (10th / 12th)</th>
                    <th className="p-3 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("backlogs")}>
                      <span className="flex items-center justify-center gap-1">
                        Backlogs {sortField === "backlogs" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </th>
                    <th className="p-3 text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => toggleSort("matchScore")}>
                      <span className="flex items-center justify-center gap-1">
                        AI Match {sortField === "matchScore" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-center">Resume</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {processedApplications.map((app) => {
                    const u = app.user || {};
                    const isSelected = selectedAppIds.has(app._id);
                    const cgpa = u.cgpa;
                    const cgpaColor = cgpa >= 8.5 ? "text-emerald-700 font-extrabold" : cgpa >= 7.0 ? "text-amber-700 font-bold" : "text-gray-800 font-semibold";

                    const statusStyles = {
                      placed: "bg-emerald-100 text-emerald-800 border-emerald-300",
                      shortlisted: "bg-blue-100 text-blue-800 border-blue-300",
                      interviewing: "bg-purple-100 text-purple-800 border-purple-300",
                      rejected: "bg-red-100 text-red-800 border-red-300",
                      applied: "bg-gray-100 text-gray-800 border-gray-300"
                    }[app.status?.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-300";

                    return (
                      <tr 
                        key={app._id} 
                        className={`hover:bg-gray-50/70 transition-colors ${isSelected ? "bg-[#8b9a6e]/5" : ""}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectApp(app._id)}
                            className="rounded border-gray-300 text-[#8b9a6e] focus:ring-[#8b9a6e]"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-xs">{u.name || "Unknown"}</span>
                            <span className="font-mono text-[11px] text-gray-500 uppercase">{u.usn || "No USN"}</span>
                            <span className="text-[11px] text-gray-400">{u.email}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-800 text-[11px]">
                              {u.branch?.code || u.branch?.name || "General"}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              Batch {u.batch?.year || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`text-xs ${cgpaColor}`}>
                            {cgpa !== null && cgpa !== undefined ? Number(cgpa).toFixed(2) : "N/A"}
                          </span>
                        </td>
                        <td className="p-3 text-center text-gray-600 text-[11px]">
                          {u.tenthMarks ? `${u.tenthMarks}%` : "-"} / {u.twelfthMarks ? `${u.twelfthMarks}%` : "-"}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${u.activeBacklogs > 0 ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700"}`}>
                            {u.activeBacklogs ?? 0} active
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {app.matchScore !== null && app.matchScore !== undefined ? (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                              app.matchScore >= 80 ? "bg-emerald-100 text-emerald-800" :
                              app.matchScore >= 50 ? "bg-amber-100 text-amber-800" :
                              "bg-red-100 text-red-800"
                            }`}>
                              {app.matchScore}%
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] italic">Not scored</span>
                          )}
                        </td>
                        <td className="p-3">
                          <select
                            value={app.status?.toLowerCase() || "applied"}
                            onChange={(e) => handleUpdateStatus(app._id, e.target.value)}
                            className={`text-xs font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer transition ${statusStyles}`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="placed">Placed</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          {u.resumeUrl ? (
                            <a
                              href={`http://localhost:5001${u.resumeUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50 px-2 py-1 rounded-md transition"
                            >
                              <FileText className="w-3 h-3" />
                              PDF
                            </a>
                          ) : (
                            <span className="text-gray-400 text-[11px]">No file</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-16 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto text-gray-300 mb-2" />
              <p className="font-bold text-sm text-gray-700">No matching applications found</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {searchQuery || statusFilter !== "all" 
                  ? "Try clearing filters or search query to see all applicants." 
                  : "No students have applied for this position yet."}
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Share / Recruiter Export Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Share Applicant Roster</h3>
                  <p className="text-xs text-gray-500">Formatted summary for HR recruiters or placement partners</p>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-sm font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Preview Box */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded-2xl border border-gray-200 font-mono text-xs text-gray-700 whitespace-pre-wrap max-h-72 custom-scrollbar">
                {generateRosterText()}
              </div>

              <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Excel (.csv)
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyRoster}
                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedRosterText ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedRosterText ? "Copied Roster!" : "Copy Text Summary"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
