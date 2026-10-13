"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, GraduationCap, Upload, FileText, CheckCircle, Search, 
  Briefcase, FileCheck, MessageSquare, Plus, Loader2, Bot, Calendar, 
  AlertCircle, Edit3, Save, X, Star, BookOpen, TrendingUp, Award, Banknote, Lock,
  ExternalLink, Clock, Users, Sparkles, Building2
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState("");
  const [jobSearch, setJobSearch] = useState("");
  const [user, setUser] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);
  const [activityTab, setActivityTab] = useState("applications"); // 'applications' | 'interviews'
  const [showResumeUpload, setShowResumeUpload] = useState(false);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState("");
  const [editForm, setEditForm] = useState({
    cgpa: "", skills: "", activeBacklogs: "", historyOfBacklogs: "", tenthMarks: "", twelfthMarks: ""
  });

  const fetchData = async (token) => {
    setJobsLoading(true);
    setJobsError("");
    try {
      let jobsRes = await fetch("http://localhost:5001/api/jobs/smart-feed", {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (jobsRes.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      let jobsData;
      if (jobsRes.ok) {
        jobsData = await jobsRes.json();
      } else {
        const fallbackRes = await fetch("http://localhost:5001/api/jobs", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (fallbackRes.ok) {
          jobsData = await fallbackRes.json();
        }
      }

      if (Array.isArray(jobsData)) {
        setJobs(jobsData);
      } else {
        setJobs([]);
      }

      const appsRes = await fetch("http://localhost:5001/api/applications/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (appsRes.ok) {
        const appsData = await appsRes.json();
        if (Array.isArray(appsData)) setMyApplications(appsData);
      }

      const slotsRes = await fetch("http://localhost:5001/api/interviews/student/my-slots", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        if (Array.isArray(slotsData)) setMySlots(slotsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      try {
        const fallback = await fetch("http://localhost:5001/api/jobs");
        if (fallback.ok) {
          const fallbackData = await fallback.json();
          if (Array.isArray(fallbackData)) {
            setJobs(fallbackData);
            return;
          }
        }
      } catch {
        // ignore
      }
      setJobsError("Unable to connect to the server. Please check your network and refresh.");
    } finally {
      setJobsLoading(false);
    }
  };

  const checkEligibility = (job) => {
    if (!user) return { eligible: true };
    if (user.isBlacklisted) {
      return { eligible: false, reason: "Blacklisted from placements" };
    }
    if (user.isPlaced) {
      const minPackage = (user.currentCTC || 0) * 1.5;
      if ((job.ctc || 0) < minPackage) {
        return { 
          eligible: false, 
          reason: `Placed: Requires Dream CTC ≥ ${minPackage.toFixed(1)} LPA` 
        };
      }
    }
    const minCgpa = job.minCgpa ?? job.requiredCgpa ?? 0;
    if (minCgpa > 0 && (user.cgpa === null || user.cgpa === undefined || user.cgpa < minCgpa)) {
      return { eligible: false, reason: `Min CGPA ${minCgpa} required` };
    }
    if (job.maxBacklogs !== undefined && job.maxBacklogs !== null && (user.activeBacklogs || 0) > job.maxBacklogs) {
      return { eligible: false, reason: `Max ${job.maxBacklogs} active backlog(s) allowed` };
    }
    if (job.allowedBranches && job.allowedBranches.length > 0 && user.branch) {
      const userBranchId = (user.branch._id || user.branch).toString();
      const isAllowed = job.allowedBranches.some(b => (b._id || b).toString() === userBranchId);
      if (!isAllowed) {
        return { eligible: false, reason: "Academic branch not eligible" };
      }
    }
    if (job.allowedBatches && job.allowedBatches.length > 0 && user.batch) {
      const userBatchId = (user.batch._id || user.batch).toString();
      const isAllowed = job.allowedBatches.some(b => (b._id || b).toString() === userBatchId);
      if (!isAllowed) {
        return { eligible: false, reason: "Batch year not eligible" };
      }
    }
    return { eligible: true };
  };

  const checkAndUploadPendingResume = async (token, currentUser) => {
    const pendingData = sessionStorage.getItem("pendingResumeData");
    const pendingName = sessionStorage.getItem("pendingResumeName");
    
    if (pendingData && pendingName) {
      setUploadStatus("Processing uploaded resume...");
      setIsUploading(true);
      sessionStorage.removeItem("pendingResumeData");
      sessionStorage.removeItem("pendingResumeName");
      
      try {
        const res = await fetch(pendingData);
        const blob = await res.blob();
        const file = new File([blob], pendingName, { type: blob.type });
        
        const formData = new FormData();
        formData.append("resume", file);
        
        const uploadRes = await fetch("http://localhost:5001/api/upload/resume", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        
        const data = await uploadRes.json();
        if (uploadRes.ok) {
          setUploadStatus("Resume auto-uploaded successfully!");
          const updatedUser = { ...currentUser, resumeUrl: data.filePath };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          setUploadStatus(data.message || "Failed to auto-upload resume");
        }
      } catch (err) {
        console.error("Error auto-uploading:", err);
        setUploadStatus("Error auto-uploading resume.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "student") {
      router.push("/admin");
      return;
    }

    // Fetch fresh profile from server
    fetch("http://localhost:5001/api/auth/me", {
      headers: { "Authorization": `Bearer ${token}` }
    }).then(async r => {
      if (r.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return null;
      }
      return r.json();
    }).then(freshUser => {
      if (!freshUser) return;
      if (freshUser._id) {
        const merged = { ...parsedUser, ...freshUser, id: freshUser._id };
        setUser(merged);
        localStorage.setItem("user", JSON.stringify(merged));
        setEditForm({
          cgpa: freshUser.cgpa ?? "",
          skills: Array.isArray(freshUser.skills) ? freshUser.skills.join(", ") : (freshUser.skills || ""),
          activeBacklogs: freshUser.activeBacklogs ?? "",
          historyOfBacklogs: freshUser.historyOfBacklogs ?? "",
          tenthMarks: freshUser.tenthMarks ?? "",
          twelfthMarks: freshUser.twelfthMarks ?? "",
        });
      } else {
        setUser(parsedUser);
      }
    }).catch(() => {
      setUser(parsedUser);
    });

    fetchData(token);
    checkAndUploadPendingResume(token, parsedUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUploadResume = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = resumeFile.name.substring(resumeFile.name.lastIndexOf('.')).toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadStatus("Only PDF, DOC, or DOCX files are allowed");
      return;
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      setUploadStatus("File exceeds 5MB size limit");
      return;
    }

    setUploadStatus("Uploading...");
    setIsUploading(true);
    const formData = new FormData();
    formData.append("resume", resumeFile);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/upload/resume", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus("Resume uploaded successfully!");
        const updatedUser = { ...user, resumeUrl: data.filePath };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setShowResumeUpload(false);
        setResumeFile(null);
        // Refresh smart feed matches with newly uploaded resume
        fetchData(token);
        setTimeout(() => setUploadStatus(""), 3500);
      } else {
        setUploadStatus(data.message || "Failed to upload");
      }
    } catch {
      setUploadStatus("Error uploading resume");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileSaveMsg("");
    const token = localStorage.getItem("token");
    try {
      const skillsArray = editForm.skills
        ? editForm.skills.split(",").map(s => s.trim()).filter(Boolean)
        : [];
      const res = await fetch("http://localhost:5001/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          skills: skillsArray
        })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileSaveMsg("✓ Skills saved successfully!");
        setIsEditingProfile(false);
        // Refresh job feed with new eligibility
        fetchData(token);
        setTimeout(() => setProfileSaveMsg(""), 4000);
      } else {
        setProfileSaveMsg(data.message || "Failed to save skills.");
      }
    } catch {
      setProfileSaveMsg("Error saving skills.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleApply = async (jobId) => {
    if (!user.resumeUrl) {
      alert("Please upload your resume first!");
      return;
    }

    setApplyingJobId(jobId);
    const token = localStorage.getItem("token");
    
    try {
      const res = await fetch(`http://localhost:5001/api/applications/${jobId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        fetchData(token); 
      } else {
        alert(data.message || "Failed to apply");
      }
    } catch (err) {
      console.error(err);
      alert("Error applying for job");
    } finally {
      setApplyingJobId(null);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-[#8b9a6e]" />
    </div>
  );

  const appliedJobIds = new Set(myApplications.map(app => app.job?._id));

  const filteredJobs = jobs.filter(job => {
    if (!jobSearch.trim()) return true;
    const query = jobSearch.toLowerCase();
    const title = (job.title || "").toLowerCase();
    const company = (typeof job.company === "object" ? job.company?.name || "" : job.company || "").toLowerCase();
    const skills = (job.requirements || job.requiredSkills || []).map(s => String(s).toLowerCase()).join(" ");
    return title.includes(query) || company.includes(query) || skills.includes(query);
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const cgpaVal = parseFloat(user.cgpa);
  const cgpaColor = cgpaVal >= 8.5 ? "text-emerald-600" : cgpaVal >= 7.0 ? "text-amber-600" : "text-red-500";

  return (
    <div className="min-h-screen bg-[#f7f2eb] p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-[#8b9a6e]/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#eae2d6]/40 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Header & Navigation Bar */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Student Career Portal</h1>
          <p className="text-xs text-gray-500">AI-ranked job drives, personalized mock prep, and recruiter analytics</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => router.push("/companies")}
            className="px-4 py-2 rounded-xl bg-white/75 hover:bg-white border border-white/60 text-xs font-bold text-gray-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5 text-[#8b9a6e]" /> Company Intelligence
          </button>
          <button
            onClick={() => router.push("/alumni-experience")}
            className="px-4 py-2 rounded-xl bg-white/75 hover:bg-white border border-white/60 text-xs font-bold text-gray-700 shadow-sm transition-all flex items-center gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#8b9a6e]" /> Alumni Hub
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              router.push("/login");
            }}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-xs font-bold text-red-600 transition-all flex items-center gap-1"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Placed Student Congratulations Banner */}
      {user.isPlaced && (
        <div className="max-w-7xl mx-auto mb-5 relative z-10">
          <div className="bg-gradient-to-r from-emerald-600 via-[#8b9a6e] to-[#6b7a4e] p-[1px] rounded-2xl shadow-lg">
            <div className="bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-[15px] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                    Congratulations on your Placement!
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                      <Sparkles className="w-3 h-3" /> Placed
                    </span>
                  </h3>
                  <p className="text-xs text-gray-600">
                    Pay it forward! Share your interview rounds, questions, and preparation advice to guide junior batches.
                  </p>
                </div>
              </div>
              <button
                onClick={() => router.push("/alumni-experience")}
                className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white text-xs font-bold hover:opacity-95 shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Share Interview Experience
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Sidebar (Unified Profile & Resume, then Tabbed Activity Hub) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Card 1: Unified Profile, Stats, Skills & Resume */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/60"
          >
            {/* Header: Avatar, Name, Badges, Edit Button */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b9a6e] to-[#6b7a4e] flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-gray-900 truncate leading-tight">{user.name}</h2>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Student
                    </span>
                    {user.isPlaced && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold">
                        ✓ Placed
                      </span>
                    )}
                    {user.usn && (
                      <span className="text-[11px] text-gray-400 font-medium truncate">
                        · {user.usn}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (isEditingProfile) {
                    setIsEditingProfile(false);
                  } else {
                    setEditForm({
                      skills: Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || ""),
                    });
                    setIsEditingProfile(true);
                  }
                }}
                className={`p-2 rounded-xl transition-all shrink-0 ${isEditingProfile ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100/80 text-gray-500 hover:bg-[#8b9a6e]/10 hover:text-[#8b9a6e]"}`}
                title={isEditingProfile ? "Cancel editing" : "Edit skills"}
              >
                {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            {/* Academic Branch / Batch Info */}
            {(user.branch || user.batch) && (
              <p className="text-xs text-gray-500 bg-gray-50/70 px-3 py-1.5 rounded-lg border border-gray-100 mb-3 truncate">
                <span className="font-semibold text-gray-700">{user.branch?.name || user.branch?.code || "Branch"}</span>
                {user.batch?.year ? ` · Batch of ${user.batch.year}` : ""}
              </p>
            )}

            {/* Academic Metrics Grid (4 compact stat cards) */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-amber-50/60 border border-amber-100/80 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-500 font-medium">CGPA</p>
                <p className={`text-sm font-bold ${cgpaColor}`}>{user.cgpa ?? '—'}</p>
              </div>
              <div className="bg-blue-50/60 border border-blue-100/80 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-500 font-medium">Backlogs</p>
                <p className="text-sm font-bold text-gray-800">{user.activeBacklogs ?? '0'}</p>
              </div>
              <div className="bg-purple-50/60 border border-purple-100/80 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-500 font-medium">10th</p>
                <p className="text-sm font-bold text-gray-800">{user.tenthMarks ? `${user.tenthMarks}%` : '—'}</p>
              </div>
              <div className="bg-emerald-50/60 border border-emerald-100/80 rounded-xl p-2 text-center">
                <p className="text-[10px] text-gray-500 font-medium">12th</p>
                <p className="text-sm font-bold text-gray-800">{user.twelfthMarks ? `${user.twelfthMarks}%` : '—'}</p>
              </div>
            </div>

            {/* Skills View / Inline Edit */}
            <AnimatePresence mode="wait">
              {isEditingProfile ? (
                <motion.div
                  key="edit-skills"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2 pt-2 border-t border-gray-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700">Update Skills</span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      <Lock className="w-2.5 h-2.5 text-amber-500" />
                      Academics locked
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={editForm.skills}
                    onChange={e => setEditForm({ ...editForm, skills: e.target.value })}
                    placeholder="React, Node.js, Python, SQL..."
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] outline-none bg-white resize-none"
                  />
                  {editForm.skills && (
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                      {editForm.skills.split(",").map(s => s.trim()).filter(Boolean).map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-md text-[10px] font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-semibold text-xs flex items-center justify-center gap-1.5 hover:opacity-90 disabled:opacity-60 transition shadow-sm"
                  >
                    {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {isSavingProfile ? "Saving..." : "Save Skills"}
                  </button>
                </motion.div>
              ) : (
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Skills</span>
                    <button
                      onClick={() => {
                        setEditForm({ skills: Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || "") });
                        setIsEditingProfile(true);
                      }}
                      className="text-[11px] text-[#8b9a6e] hover:underline font-medium flex items-center gap-0.5"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                    {user.skills && user.skills.length > 0 ? (
                      (Array.isArray(user.skills) ? user.skills : [user.skills]).map((skill, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100/80 hover:bg-[#8b9a6e]/10 text-gray-700 hover:text-[#5b6a3e] rounded-md text-xs font-medium transition-colors">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400 italic">No skills listed yet</span>
                    )}
                  </div>
                </div>
              )}
            </AnimatePresence>

            {profileSaveMsg && (
              <p className={`text-xs text-center font-medium mt-2 px-2.5 py-1 rounded-lg ${profileSaveMsg.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {profileSaveMsg}
              </p>
            )}

            {/* Resume Bar (Compact & Integrated) */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between bg-gray-50/80 p-2.5 rounded-xl border border-gray-100">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 ${user.resumeUrl ? "text-emerald-600" : "text-amber-500"}`} />
                  {user.resumeUrl ? (
                    <a 
                      href={`http://localhost:5001${user.resumeUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-xs font-semibold text-gray-800 hover:text-[#8b9a6e] flex items-center gap-1 truncate"
                    >
                      Resume Document <ExternalLink className="w-3 h-3 text-gray-400 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-amber-700 font-medium">No resume attached</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !showResumeUpload;
                    setShowResumeUpload(next);
                    if (!next) {
                      setResumeFile(null);
                      setUploadStatus("");
                    }
                  }}
                  className="text-xs px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition shrink-0"
                >
                  {showResumeUpload ? "Cancel" : user.resumeUrl ? "Replace" : "Upload"}
                </button>
              </div>

              {/* Inline Upload Dropdown */}
              {(showResumeUpload || !user.resumeUrl) && (
                <form onSubmit={handleUploadResume} className="mt-2.5 space-y-2 bg-white/80 p-3 rounded-xl border border-dashed border-[#8b9a6e]/40">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    id="resume-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const allowed = ['.pdf', '.doc', '.docx'];
                      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                      if (!allowed.includes(ext)) {
                        setUploadStatus("Only PDF, DOC, or DOCX files are allowed");
                        setResumeFile(null);
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setUploadStatus("File exceeds 5MB limit");
                        setResumeFile(null);
                        return;
                      }
                      setUploadStatus("");
                      setResumeFile(file);
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 cursor-pointer text-xs font-medium transition truncate"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#8b9a6e] shrink-0" />
                    <span className="truncate">{resumeFile ? resumeFile.name : "Select PDF / Word..."}</span>
                  </label>
                  {resumeFile && (
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      {isUploading ? "Uploading..." : "Save Resume"}
                    </button>
                  )}
                  {uploadStatus && (
                    <p className={`text-[11px] text-center font-medium ${uploadStatus.includes('success') ? 'text-green-600' : 'text-gray-600'}`}>
                      {uploadStatus}
                    </p>
                  )}
                </form>
              )}
            </div>

            {/* Quick Links Row */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => router.push("/alumni-experience")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gray-50 hover:bg-[#8b9a6e]/10 text-gray-700 text-xs font-semibold border border-gray-100 hover:border-[#8b9a6e]/20 transition"
              >
                <Users className="w-3.5 h-3.5 text-[#8b9a6e]" />
                Alumni Hub
              </button>
              <button
                onClick={() => router.push("/dashboard/copilot")}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-gray-50 hover:bg-[#8b9a6e]/10 text-gray-700 text-xs font-semibold border border-gray-100 hover:border-[#8b9a6e]/20 transition"
              >
                <Bot className="w-3.5 h-3.5 text-[#8b9a6e]" />
                Career Copilot
              </button>
            </div>
          </motion.div>

          {/* Card 2: Activity Hub (Tabbed: Applications & Interviews) */}
          <motion.div 
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-lg border border-white/60"
          >
            {/* Tabs Bar */}
            <div className="flex items-center bg-gray-100/80 p-1 rounded-xl mb-3">
              <button
                onClick={() => setActivityTab("applications")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activityTab === "applications"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-[#8b9a6e]" />
                Applications
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activityTab === "applications" ? "bg-[#8b9a6e] text-white" : "bg-gray-200 text-gray-600"}`}>
                  {myApplications.length}
                </span>
              </button>
              <button
                onClick={() => setActivityTab("interviews")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  activityTab === "interviews"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Interviews
                {mySlots.length > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activityTab === "interviews" ? "bg-indigo-600 text-white" : "bg-indigo-100 text-indigo-700"}`}>
                    {mySlots.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Contents with compact scroll */}
            <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar space-y-2">
              {activityTab === "applications" ? (
                myApplications.length > 0 ? (
                  myApplications.map(app => {
                    const statusColor = {
                      placed: "bg-emerald-100 text-emerald-700 border-emerald-200",
                      shortlisted: "bg-blue-100 text-blue-700 border-blue-200",
                      interviewing: "bg-purple-100 text-purple-700 border-purple-200",
                      rejected: "bg-red-100 text-red-700 border-red-200",
                      applied: "bg-gray-100 text-gray-600 border-gray-200"
                    }[app.status?.toLowerCase()] || "bg-gray-100 text-gray-600 border-gray-200";

                    return (
                      <div key={app._id} className="p-3 bg-white rounded-xl border border-gray-100 shadow-xs hover:border-gray-200 transition">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-gray-900 text-xs truncate leading-tight">
                            {app.job?.title || 'Unknown Job'}
                          </p>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold capitalize border shrink-0 ${statusColor}`}>
                            {app.status || 'Applied'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-xs text-gray-500">
                          <span className="truncate">{app.job?.company?.name || app.job?.company || 'Company'}</span>
                          {app.matchScore !== null && (
                            <span className="text-[11px] font-bold text-[#5b6a3e] bg-[#8b9a6e]/10 px-1.5 py-0.5 rounded shrink-0">
                              {app.matchScore}% Match
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 px-4 text-gray-400">
                    <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold text-gray-700">No applications yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Apply to jobs to track your progress</p>
                  </div>
                )
              ) : (
                mySlots.length > 0 ? (
                  mySlots.map(slot => (
                    <div key={slot._id} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 shadow-xs">
                      <p className="font-bold text-gray-900 text-xs truncate leading-tight">
                        {slot.job?.title || 'Scheduled Interview'}
                      </p>
                      <p className="text-[11px] text-indigo-600 font-medium truncate mt-0.5">
                        {slot.job?.company?.name || slot.job?.company || 'Company'}
                      </p>
                      <div className="text-[11px] text-gray-600 flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          {new Date(slot.startTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 px-4 text-gray-400">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-xs font-semibold text-gray-700">No interviews scheduled</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Invitations will appear here</p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Content: Recommended Jobs (Compact & Dense Cards) */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-1"
          >
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Recommended Jobs</h2>
              <p className="text-xs text-gray-500 mt-0.5">AI matches matching your skills & academic eligibility</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search jobs, skills..."
                  value={jobSearch}
                  onChange={(e) => setJobSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white/80 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8b9a6e]/50 text-gray-800 placeholder-gray-400 w-44 sm:w-56"
                />
              </div>
              <span className="text-xs px-3 py-1.5 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-xl font-bold shrink-0">
                {filteredJobs.length} Jobs
              </span>
            </div>
          </motion.div>
          
          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2].map(n => (
                <div key={n} className="bg-white/60 p-5 rounded-2xl border border-white/60 shadow-xs animate-pulse space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1.5 flex-1">
                      <div className="h-5 bg-gray-200 rounded-md w-3/4"></div>
                      <div className="h-3.5 bg-gray-100 rounded-md w-1/2"></div>
                    </div>
                    <div className="h-6 w-12 bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-20 bg-gray-100 rounded"></div>
                  </div>
                  <div className="h-10 bg-gray-100 rounded-md"></div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div className="h-8 bg-gray-200 rounded-xl"></div>
                    <div className="h-8 bg-gray-100 rounded-xl"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobsError ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-10 text-center bg-white/70 backdrop-blur-xl rounded-2xl border border-red-200 shadow-md p-6"
            >
              <AlertCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
              <h3 className="text-base font-bold text-gray-900 mb-1">Failed to load jobs</h3>
              <p className="text-xs text-gray-500 mb-4">{jobsError}</p>
              <button
                type="button"
                onClick={() => fetchData(localStorage.getItem("token"))}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold shadow transition inline-flex items-center gap-1.5"
              >
                Retry Loading
              </button>
            </motion.div>
          ) : filteredJobs.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {filteredJobs.map(job => {
                const hasApplied = appliedJobIds.has(job._id);
                const isApplying = applyingJobId === job._id;
                const eligibility = checkEligibility(job);

                return (
                  <motion.div 
                    variants={itemVariants}
                    key={job._id} 
                    className="group bg-white/70 backdrop-blur-xl p-5 rounded-2xl shadow-md border border-white/60 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 flex flex-col relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start gap-2 mb-2 relative z-10">
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-[#8b9a6e] transition-colors truncate">
                          {job.title}
                        </h3>
                        <p className="text-gray-500 font-medium text-xs flex items-center gap-1 mt-0.5 truncate">
                          <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {job.company?.name || job.company}
                        </p>
                      </div>
                      {job.matchScore !== undefined && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white rounded-lg text-xs font-bold shadow-xs shrink-0 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          {job.matchScore}%
                        </span>
                      )}
                    </div>

                    {/* Eligibility & Package Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5 relative z-10">
                      {job.ctc > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                          <Banknote className="w-3 h-3" />
                          <span>{job.ctc} LPA</span>
                        </span>
                      )}
                      {(job.minCgpa > 0 || job.requiredCgpa > 0) && (
                        <span className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[11px] font-semibold">
                          Min CGPA: {job.minCgpa ?? job.requiredCgpa}
                        </span>
                      )}
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-semibold">
                        Backlogs ≤ {job.maxBacklogs ?? 0}
                      </span>
                      {job.isDreamJob && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                          <span>Dream Upgrade (≥1.5x)</span>
                        </span>
                      )}
                    </div>

                    {/* Eligibility Status Notice */}
                    <div className="mb-2.5 relative z-10">
                      {!eligibility.eligible ? (
                        <div className="px-2.5 py-1 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">Ineligible: {eligibility.reason}</span>
                        </div>
                      ) : (
                        <div className="px-2.5 py-0.5 bg-emerald-50/80 border border-emerald-200 text-emerald-700 rounded-lg text-[11px] font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          <span>Eligible to Apply</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-xs mb-3 line-clamp-2 leading-relaxed flex-grow relative z-10">
                      {job.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-4 relative z-10">
                      {(job.requirements || job.requiredSkills || []).slice(0, 5).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-white text-gray-700 rounded-md text-[10px] font-semibold shadow-2xs border border-gray-100">
                          {skill}
                        </span>
                      ))}
                      {(job.requirements || job.requiredSkills || []).length > 5 && (
                        <span className="text-[10px] text-gray-400 font-medium self-center">
                          +{(job.requirements || job.requiredSkills || []).length - 5}
                        </span>
                      )}
                    </div>

                    {/* Compact Side-by-Side Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-auto relative z-10 pt-2 border-t border-gray-100">
                      {job.status === "closed" ? (
                        <button disabled className="col-span-1 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-xs cursor-not-allowed border border-red-200 flex items-center justify-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Drive Closed
                        </button>
                      ) : hasApplied ? (
                        <button disabled className="col-span-1 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed border border-gray-200 flex items-center justify-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Applied
                        </button>
                      ) : !eligibility.eligible ? (
                        <button disabled className="col-span-1 py-2 rounded-xl bg-gray-100 text-gray-400 font-bold text-xs cursor-not-allowed border border-gray-200 flex items-center justify-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          Locked
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApply(job._id)}
                          disabled={isApplying}
                          className="col-span-1 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition shadow-md disabled:opacity-70 flex items-center justify-center gap-1"
                        >
                          {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          {isApplying ? "Applying..." : "Apply Now"}
                        </button>
                      )}

                      <button 
                        onClick={() => router.push(`/dashboard/mock-interview/${job._id}`)}
                        className="col-span-1 py-2 rounded-xl bg-white hover:bg-[#f7f2eb] border border-[#eae2d6] text-gray-700 hover:text-gray-900 font-bold text-xs transition flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#8b9a6e]" />
                        Mock Interview
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="py-12 text-center bg-white/60 backdrop-blur-xl rounded-2xl border border-white/50 shadow-md"
            >
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {jobSearch ? "No matching jobs found" : "No jobs available right now"}
              </h3>
              <p className="text-gray-500 text-xs max-w-sm mx-auto">
                {jobSearch ? `Try adjusting your search terms for "${jobSearch}".` : "We're constantly adding new opportunities. Check back later for roles matching your profile."}
              </p>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating AI Copilot Button */}
      <motion.button
        onClick={() => router.push("/dashboard/copilot")}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#8b9a6e] to-[#6b7a4e] rounded-full shadow-2xl flex items-center justify-center text-white cursor-pointer z-50 hover:shadow-green-900/20 group"
      >
        <Bot className="w-8 h-8 group-hover:animate-pulse" />
        {/* Tooltip */}
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
          Chat with Copilot
          <div className="absolute top-1/2 -translate-y-1/2 -right-2 border-8 border-transparent border-l-gray-900"></div>
        </div>
      </motion.button>

      {/* Global styles for custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 154, 110, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 154, 110, 0.5);
        }
      `}</style>
    </div>
  );
}
