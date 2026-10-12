"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Mail, GraduationCap, Upload, FileText, CheckCircle, Search, 
  Briefcase, FileCheck, MessageSquare, Plus, Loader2, Bot, Calendar, 
  AlertCircle, Edit3, Save, X, Star, BookOpen, TrendingUp, Award, Banknote
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [mySlots, setMySlots] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);

  // Profile edit state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState("");
  const [editForm, setEditForm] = useState({
    cgpa: "", skills: "", activeBacklogs: "", historyOfBacklogs: "", tenthMarks: "", twelfthMarks: ""
  });

  const fetchData = async (token) => {
    try {
      const jobsRes = await fetch("http://localhost:5001/api/jobs/smart-feed", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      const appsRes = await fetch("http://localhost:5001/api/applications/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      if (appsRes.ok) setMyApplications(appsData);

      const slotsRes = await fetch("http://localhost:5001/api/interviews/student/my-slots", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (slotsRes.ok) {
        const slotsData = await slotsRes.json();
        setMySlots(slotsData);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
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
    }).then(r => r.json()).then(freshUser => {
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
        setTimeout(() => setUploadStatus(""), 3000);
      } else {
        setUploadStatus(data.message || "Failed to upload");
      }
    } catch (error) {
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
          cgpa: editForm.cgpa !== "" ? Number(editForm.cgpa) : undefined,
          skills: skillsArray,
          activeBacklogs: editForm.activeBacklogs !== "" ? Number(editForm.activeBacklogs) : undefined,
          historyOfBacklogs: editForm.historyOfBacklogs !== "" ? Number(editForm.historyOfBacklogs) : undefined,
          tenthMarks: editForm.tenthMarks !== "" ? Number(editForm.tenthMarks) : undefined,
          twelfthMarks: editForm.twelfthMarks !== "" ? Number(editForm.twelfthMarks) : undefined,
        })
      });
      const data = await res.json();
      if (res.ok) {
        const updatedUser = { ...user, ...data.user };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setProfileSaveMsg("✓ Profile saved successfully!");
        setIsEditingProfile(false);
        // Refresh job feed with new eligibility
        fetchData(token);
        setTimeout(() => setProfileSaveMsg(""), 4000);
      } else {
        setProfileSaveMsg(data.message || "Failed to save profile.");
      }
    } catch {
      setProfileSaveMsg("Error saving profile.");
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

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b9a6e] to-[#6b7a4e] flex items-center justify-center text-white text-2xl font-bold shadow-lg shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">{user.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-block px-3 py-0.5 bg-[#8b9a6e]/10 text-[#8b9a6e] rounded-full text-xs font-semibold uppercase tracking-wider">
                      Student
                    </span>
                    {user.isPlaced && (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                        ✓ Placed
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
                      cgpa: user.cgpa ?? "",
                      skills: Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || ""),
                      activeBacklogs: user.activeBacklogs ?? "",
                      historyOfBacklogs: user.historyOfBacklogs ?? "",
                      tenthMarks: user.tenthMarks ?? "",
                      twelfthMarks: user.twelfthMarks ?? "",
                    });
                    setIsEditingProfile(true);
                  }
                }}
                className={`p-2.5 rounded-xl transition-all ${isEditingProfile ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-gray-100 text-gray-500 hover:bg-[#8b9a6e]/10 hover:text-[#8b9a6e]"}`}
                title={isEditingProfile ? "Cancel editing" : "Edit profile"}
              >
                {isEditingProfile ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
              </button>
            </div>

            {/* Static Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/50">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900 text-sm truncate">{user.email}</p>
                </div>
              </div>

              {user.usn && (
                <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/50">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">USN</p>
                    <p className="font-medium text-gray-900 text-sm">{user.usn}</p>
                  </div>
                </div>
              )}

              {(user.branch || user.batch) && (
                <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/50">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Academic</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {user.branch?.code || user.branch?.name || ""}{user.branch && user.batch ? " · " : ""}
                      {user.batch?.year ? `Batch ${user.batch.year}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Editable Profile Section */}
            <AnimatePresence mode="wait">
              {isEditingProfile ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 pt-4 border-t border-gray-100"
                >
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Edit Academic Details</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">CGPA</label>
                      <input type="number" min="0" max="10" step="0.01" value={editForm.cgpa}
                        onChange={e => setEditForm({...editForm, cgpa: e.target.value})}
                        placeholder="e.g. 8.5"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">Active Backlogs</label>
                      <input type="number" min="0" value={editForm.activeBacklogs}
                        onChange={e => setEditForm({...editForm, activeBacklogs: e.target.value})}
                        placeholder="0"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">10th %</label>
                      <input type="number" min="0" max="100" step="0.01" value={editForm.tenthMarks}
                        onChange={e => setEditForm({...editForm, tenthMarks: e.target.value})}
                        placeholder="e.g. 90.5"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 font-medium block mb-1">12th %</label>
                      <input type="number" min="0" max="100" step="0.01" value={editForm.twelfthMarks}
                        onChange={e => setEditForm({...editForm, twelfthMarks: e.target.value})}
                        placeholder="e.g. 87.0"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-medium block mb-1">Skills (comma separated)</label>
                    <input type="text" value={editForm.skills}
                      onChange={e => setEditForm({...editForm, skills: e.target.value})}
                      placeholder="React, Node.js, Python..."
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#8b9a6e] focus:border-transparent outline-none bg-white"
                    />
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg shadow-[#8b9a6e]/20"
                  >
                    {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSavingProfile ? "Saving..." : "Save Changes"}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 pt-4 border-t border-gray-100"
                >
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 text-center border border-amber-100">
                      <GraduationCap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                      <p className={`text-lg font-bold ${cgpaColor}`}>{user.cgpa ?? '—'}</p>
                      <p className="text-xs text-gray-500">CGPA</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 text-center border border-blue-100">
                      <TrendingUp className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{user.activeBacklogs ?? '0'}</p>
                      <p className="text-xs text-gray-500">Backlogs</p>
                    </div>
                    <div className="bg-gradient-to-br from-[#8b9a6e]/10 to-[#8b9a6e]/5 rounded-2xl p-3 text-center border border-[#8b9a6e]/20">
                      <Star className="w-4 h-4 text-[#8b9a6e] mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{myApplications.length}</p>
                      <p className="text-xs text-gray-500">Applied</p>
                    </div>
                  </div>

                  {/* Skills */}
                  {user.skills && user.skills.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(Array.isArray(user.skills) ? user.skills : [user.skills]).slice(0, 8).map((skill, i) => (
                          <span key={i} className="px-2.5 py-1 bg-white text-gray-700 rounded-lg text-xs font-semibold border border-gray-100 shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marks */}
                  {(user.tenthMarks || user.twelfthMarks) && (
                    <div className="grid grid-cols-2 gap-2">
                      {user.tenthMarks && (
                        <div className="bg-white/50 rounded-xl p-2.5 border border-white/50">
                          <p className="text-xs text-gray-400">10th %</p>
                          <p className="font-bold text-gray-800">{user.tenthMarks}%</p>
                        </div>
                      )}
                      {user.twelfthMarks && (
                        <div className="bg-white/50 rounded-xl p-2.5 border border-white/50">
                          <p className="text-xs text-gray-400">12th %</p>
                          <p className="font-bold text-gray-800">{user.twelfthMarks}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setEditForm({
                        cgpa: user.cgpa ?? "",
                        skills: Array.isArray(user.skills) ? user.skills.join(", ") : (user.skills || ""),
                        activeBacklogs: user.activeBacklogs ?? "",
                        historyOfBacklogs: user.historyOfBacklogs ?? "",
                        tenthMarks: user.tenthMarks ?? "",
                        twelfthMarks: user.twelfthMarks ?? "",
                      });
                      setIsEditingProfile(true);
                    }}
                    className="w-full py-2 rounded-xl border-2 border-dashed border-[#8b9a6e]/30 text-[#8b9a6e] text-sm font-medium hover:bg-[#8b9a6e]/5 hover:border-[#8b9a6e]/60 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Update Academic Info
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {profileSaveMsg && (
              <motion.p 
                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center font-medium mt-3 px-3 py-2 rounded-xl ${profileSaveMsg.startsWith("✓") ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
              >
                {profileSaveMsg}
              </motion.p>
            )}
          </motion.div>

          {/* Resume Upload Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-[#8b9a6e]" />
              Resume Document
            </h3>
            
            {user.resumeUrl ? (
              <div className="mb-6 bg-gradient-to-r from-green-50 to-[#8b9a6e]/10 border border-[#8b9a6e]/20 p-4 rounded-2xl">
                <div className="flex items-center gap-3 text-[#5b6a3e] font-semibold mb-2">
                  <CheckCircle className="w-5 h-5 text-[#8b9a6e]" />
                  Resume Uploaded
                </div>
                <a href={`http://localhost:5001${user.resumeUrl}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#8b9a6e] hover:text-[#6b7a4e] transition-colors font-medium">
                  <Search className="w-4 h-4" />
                  View Current Document
                </a>
              </div>
            ) : (
              <div className="mb-6 bg-orange-50/80 border border-orange-100 p-4 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-500 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-sm text-orange-800 font-medium">No resume uploaded. You need a resume to apply for jobs.</p>
              </div>
            )}
            
            <form onSubmit={handleUploadResume} className="flex flex-col gap-4">
              <div className="relative">
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  id="resume-upload"
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="hidden"
                />
                <label 
                  htmlFor="resume-upload"
                  className="flex items-center justify-center gap-2 w-full py-4 px-4 rounded-2xl border-2 border-dashed border-[#8b9a6e]/30 bg-white/50 hover:bg-[#8b9a6e]/5 hover:border-[#8b9a6e] text-gray-600 cursor-pointer transition-all text-sm font-medium"
                >
                  <Upload className="w-5 h-5 text-[#8b9a6e]" />
                  {resumeFile ? resumeFile.name : (user.resumeUrl ? "Select a file to update..." : "Select a new file...")}
                </label>
              </div>

              <button 
                type="submit" 
                disabled={!resumeFile || isUploading}
                className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                {isUploading ? "Uploading..." : (user.resumeUrl ? "Update Resume" : "Upload Resume")}
              </button>
              
              {uploadStatus && (
                <p className={`text-sm text-center font-medium ${uploadStatus.includes('success') ? 'text-green-600' : 'text-gray-600'}`}>
                  {uploadStatus}
                </p>
              )}
            </form>
          </motion.div>

          {/* My Applications */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50"
          >
            <h2 className="text-xl font-bold mb-6 text-gray-900 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#8b9a6e]" />
                My Applications
              </span>
              <span className="text-xs px-3 py-1 bg-gray-900 text-white rounded-full font-bold">{myApplications.length}</span>
            </h2>
            
            {myApplications.length > 0 ? (
              <ul className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {myApplications.map(app => {
                  const statusColor = {
                    placed: "bg-emerald-100 text-emerald-700",
                    shortlisted: "bg-blue-100 text-blue-700",
                    interviewing: "bg-purple-100 text-purple-700",
                    rejected: "bg-red-100 text-red-700",
                    applied: "bg-gray-100 text-gray-600"
                  }[app.status?.toLowerCase()] || "bg-gray-100 text-gray-600";
                  
                  return (
                    <li key={app._id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-bold text-gray-900 mb-1 truncate">{app.job?.title || 'Unknown Job'}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-500 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md">{app.job?.company?.name || app.job?.company || 'Company'}</span>
                        <div className="flex items-center gap-2">
                          {app.matchScore !== null && (
                            <span className="px-2.5 py-1 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-lg text-xs font-bold">
                              {app.matchScore}% Match
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${statusColor}`}>
                            {app.status || 'Applied'}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8 px-4 border-2 border-dashed border-gray-200 rounded-2xl">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">No applications yet</p>
                <p className="text-xs text-gray-500">Apply to jobs on the right to see them here.</p>
              </div>
            )}
          </motion.div>

          {/* Upcoming Interviews Card */}
          {mySlots.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50"
            >
              <h2 className="text-xl font-bold mb-4 text-gray-900 flex items-center justify-between">
                <span className="flex items-center gap-2 text-indigo-700">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Upcoming Interviews
                </span>
                <span className="text-xs px-2.5 py-1 bg-indigo-600 text-white rounded-full font-bold">{mySlots.length}</span>
              </h2>
              <div className="space-y-3">
                {mySlots.map(slot => (
                  <div key={slot._id} className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                    <p className="font-bold text-gray-900 text-sm">{slot.job?.title || 'Scheduled Interview'}</p>
                    <p className="text-xs text-indigo-600 font-medium mb-1.5">{slot.job?.company?.name || slot.job?.company || 'Company'}</p>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span>📅 {new Date(slot.startTime).toLocaleDateString()}</span>
                      <span>⏰ {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl border border-white/50"
          >
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Links</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push("/alumni-experience")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 hover:bg-[#8b9a6e]/5 border border-white/50 hover:border-[#8b9a6e]/20 text-gray-700 text-sm font-medium transition-all"
              >
                <User className="w-4 h-4 text-[#8b9a6e]" />
                Alumni Experiences
              </button>
              <button
                onClick={() => router.push("/dashboard/copilot")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/50 hover:bg-[#8b9a6e]/5 border border-white/50 hover:border-[#8b9a6e]/20 text-gray-700 text-sm font-medium transition-all"
              >
                <Bot className="w-4 h-4 text-[#8b9a6e]" />
                AI Career Copilot
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Content: Recommended Jobs */}
        <div className="lg:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between mb-8 px-2"
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Recommended Jobs</h2>
              <p className="text-gray-600 mt-1">Smart matches based on your profile & academic eligibility</p>
            </div>
          </motion.div>
          
          {jobs.length > 0 ? (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {jobs.map(job => {
                const hasApplied = appliedJobIds.has(job._id);
                const isApplying = applyingJobId === job._id;
                const eligibility = checkEligibility(job);

                return (
                  <motion.div 
                    variants={itemVariants}
                    key={job._id} 
                    className="group bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col relative overflow-hidden"
                  >
                    {/* Decorative gradient blob inside card */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8b9a6e]/10 to-transparent rounded-full -mr-10 -mt-10 blur-xl"></div>
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight group-hover:text-[#8b9a6e] transition-colors">{job.title}</h3>
                        <p className="text-gray-600 font-medium text-sm flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          {job.company?.name || job.company}
                        </p>
                      </div>
                      {job.matchScore !== undefined && (
                        <div className="flex flex-col items-end shrink-0 ml-4">
                          <span className="px-3 py-1.5 bg-gradient-to-r from-[#8b9a6e] to-[#6b7a4e] text-white rounded-xl text-xs font-bold shadow-md shadow-[#8b9a6e]/20 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {job.matchScore}% Match
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Eligibility & Package Badges */}
                    <div className="flex flex-wrap gap-2 mb-3 relative z-10">
                      {job.ctc > 0 && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{job.ctc} LPA</span>
                        </span>
                      )}
                      {(job.minCgpa > 0 || job.requiredCgpa > 0) && (
                        <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-xs font-semibold">
                          Min CGPA: {job.minCgpa ?? job.requiredCgpa}
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                        Backlogs ≤ {job.maxBacklogs ?? 0}
                      </span>
                    </div>

                    {/* Eligibility Status Notice */}
                    <div className="mb-4 relative z-10">
                      {!eligibility.eligible ? (
                        <div className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>Ineligible: {eligibility.reason}</span>
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-emerald-50/80 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Eligible to Apply</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow relative z-10">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                      {(job.requirements || job.requiredSkills || []).map(skill => (
                         <span key={skill} className="px-3 py-1.5 bg-white text-gray-700 rounded-lg text-xs font-semibold shadow-sm border border-gray-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                    
                    <div className="space-y-3 mt-auto relative z-10">
                      {hasApplied ? (
                        <button disabled className="w-full py-3.5 rounded-xl bg-gray-100/80 text-gray-400 font-bold cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Applied
                        </button>
                      ) : !eligibility.eligible ? (
                        <button disabled className="w-full py-3.5 rounded-xl bg-gray-100 text-gray-400 font-bold cursor-not-allowed border border-gray-200 flex items-center justify-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Ineligible to Apply
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApply(job._id)}
                          disabled={isApplying}
                          className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                          {isApplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                          {isApplying ? "Submitting..." : "Apply Now"}
                        </button>
                      )}
                      
                      <button 
                        onClick={() => router.push(`/dashboard/mock-interview/${job._id}`)}
                        className="w-full py-3.5 rounded-xl bg-white hover:bg-[#f7f2eb] border-2 border-[#eae2d6] text-gray-700 hover:text-gray-900 font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <MessageSquare className="w-5 h-5 text-[#8b9a6e]" />
                        Practice Mock Interview
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
              className="py-16 text-center bg-white/60 backdrop-blur-xl rounded-3xl border border-white/50 shadow-xl"
            >
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <Search className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No jobs available right now</h3>
              <p className="text-gray-500 max-w-sm mx-auto">We're constantly adding new opportunities. Check back later for roles matching your profile.</p>
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
