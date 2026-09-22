"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Mail, GraduationCap, Upload, FileText, CheckCircle, Search, Briefcase, FileCheck, MessageSquare, Plus, Loader2 } from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [myApplications, setMyApplications] = useState([]);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const fetchData = async (token) => {
    try {
      // Fetch available jobs (Smart Feed)
      const jobsRes = await fetch("http://localhost:5001/api/jobs/smart-feed", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const jobsData = await jobsRes.json();
      if (jobsRes.ok) setJobs(jobsData);

      // Fetch my applications
      const appsRes = await fetch("http://localhost:5001/api/applications/my", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const appsData = await appsRes.json();
      if (appsRes.ok) setMyApplications(appsData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const checkAndUploadPendingResume = async (token, currentUser) => {
    const pendingData = sessionStorage.getItem("pendingResumeData");
    const pendingName = sessionStorage.getItem("pendingResumeName");
    
    if (pendingData && pendingName) {
      setUploadStatus("Processing uploaded resume...");
      setIsUploading(true);
      // Remove from session storage immediately to prevent duplicate uploads
      sessionStorage.removeItem("pendingResumeData");
      sessionStorage.removeItem("pendingResumeName");
      
      try {
        // Convert Data URL back to a File object
        const res = await fetch(pendingData);
        const blob = await res.blob();
        const file = new File([blob], pendingName, { type: blob.type });
        
        const formData = new FormData();
        formData.append("resume", file);
        
        const uploadRes = await fetch("http://localhost:5001/api/upload/resume", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          },
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
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setUser(parsedUser);
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
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadStatus("Resume uploaded successfully!");
        // Update user state to reflect uploaded resume
        const updatedUser = { ...user, resumeUrl: data.filePath };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setTimeout(() => setUploadStatus(""), 3000); // Clear success message after 3s
      } else {
        setUploadStatus(data.message || "Failed to upload");
      }
    } catch (error) {
      setUploadStatus("Error uploading resume");
    } finally {
      setIsUploading(false);
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
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        // Refresh applications list
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
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

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
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b9a6e] to-[#6b7a4e] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 leading-tight">{user.name}</h2>
                <span className="inline-block mt-1 px-3 py-1 bg-[#8b9a6e]/10 text-[#8b9a6e] rounded-full text-xs font-semibold uppercase tracking-wider">
                  Student
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/50">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Email</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-600 bg-white/50 p-3 rounded-2xl border border-white/50">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">CGPA</p>
                  <p className="font-medium text-gray-900">{user.cgpa || 'N/A'}</p>
                </div>
              </div>
            </div>
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
                {myApplications.map(app => (
                  <li key={app._id} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-bold text-gray-900 mb-1 truncate">{app.job?.title || 'Unknown Job'}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-500 text-xs font-medium bg-gray-50 px-2 py-1 rounded-md">{app.job?.company}</span>
                      {app.matchScore !== null && (
                        <span className="px-2.5 py-1 bg-[#8b9a6e]/10 text-[#5b6a3e] rounded-lg text-xs font-bold">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                  </li>
                ))}
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
              <p className="text-gray-600 mt-1">Smart matches based on your profile</p>
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

                return (
                  <motion.div 
                    variants={itemVariants}
                    key={job._id} 
                    className="group bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-white/50 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 flex flex-col relative overflow-hidden"
                  >
                    {/* Decorative gradient blob inside card */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#8b9a6e]/10 to-transparent rounded-full -mr-10 -mt-10 blur-xl"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight group-hover:text-[#8b9a6e] transition-colors">{job.title}</h3>
                        <p className="text-gray-600 font-medium text-sm flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          {job.company}
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
                    
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 leading-relaxed flex-grow relative z-10">{job.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-8 relative z-10">
                      {job.requiredSkills.map(skill => (
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
