"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { 
  Briefcase, GraduationCap, Building2, BarChart3, Banknote, 
  ExternalLink, ArrowRight, Lock, Upload, FileSpreadsheet, 
  X, CheckCircle2, Download, AlertCircle, Loader2 
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [viewingJobId, setViewingJobId] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs"); // 'jobs', 'branches', 'batches'
  const [branches, setBranches] = useState([]);
  const [newBranch, setNewBranch] = useState({ name: "", code: "" });
  const [batches, setBatches] = useState([]);
  const [newBatch, setNewBatch] = useState({ year: new Date().getFullYear() + 1, isActive: true });
  
  // Bulk Student Import states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMessage, setBulkMessage] = useState(null);
  
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    requiredCgpa: 7.0,
    requiredSkills: "",
    ctc: 6.0,
    maxBacklogs: 0,
    allowedBranches: [],
    allowedBatches: [],
    driveLink: ""
  });


  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (!token || !storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    
    setUser(parsedUser);
    fetchJobs();
    fetchBranches();
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/batches", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBatches(await res.json());
    } catch(err) { console.error(err); }
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/batches", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newBatch),
      });
      if (res.ok) {
        setNewBatch({ year: new Date().getFullYear() + 1, isActive: true });
        fetchBatches();
        alert("Batch created successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to create batch");
      }
    } catch(err) { 
      console.error(err); 
      alert("Error creating batch");
    }
  };

  const fetchBranches = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/branches", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBranches(await res.json());
    } catch(err) { console.error(err); }
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/branches", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(newBranch),
      });
      if (res.ok) {
        setNewBranch({ name: "", code: "" });
        fetchBranches();
        alert("Branch created successfully!");
      } else {
        let errorMsg = "Failed to create branch";
        try {
          const data = await res.json();
          errorMsg = data.message || errorMsg;
        } catch(e) {
          errorMsg = "Backend route not found. Did you restart the backend server?";
        }
        alert(errorMsg);
      }
    } catch(err) { 
      console.error(err); 
      alert("Error creating branch: Could not connect to backend.");
    }
  };

  const fetchJobs = () => {
    fetch("http://localhost:5001/api/jobs?all=true")
      .then(async res => {
        if (!res.ok) throw new Error("Failed to fetch");
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        } else {
          throw new Error("Received non-JSON response from backend");
        }
      })
      .then(data => setJobs(data))
      .catch(err => console.error(err));
  };

  const handleToggleJobStatus = async (jobId, currentStatus) => {
    const nextStatus = currentStatus === "closed" ? "open" : "closed";
    const promptMsg = currentStatus === "closed"
      ? "Reopen applications for this job posting?"
      : "STOP taking applications for this job posting? Students will no longer be able to apply.";
    if (!confirm(promptMsg)) return;

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/jobs/${jobId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const data = await res.json();
      if (res.ok) {
        setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: nextStatus } : j));
        alert(data.message);
      } else {
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/jobs", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          requiredSkills: formData.requiredSkills.split(",").map(s => s.trim()),
          ctc: parseFloat(formData.ctc) || 0,
          maxBacklogs: parseInt(formData.maxBacklogs) || 0,
          requiredCgpa: parseFloat(formData.requiredCgpa) || 0
        }),
      });

      if (res.ok) {
        setFormData({ 
          title: "", company: "", description: "", requiredCgpa: 7.0, 
          requiredSkills: "", ctc: 6.0, maxBacklogs: 0, allowedBranches: [], allowedBatches: [], driveLink: "" 
        });
        fetchJobs();
        alert("Job posted successfully!");
      } else {
        const data = await res.json();
        alert(data.message || "Failed to post job");
      }
    } catch (err) {
      console.error(err);
      alert("Error posting job");
    }
  };

  const handleUpdateApplicationStatus = async (appId, jobId, newStatus) => {
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
        fetchApplications(jobId);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating status");
    }
  };


  const fetchApplications = async (jobId) => {
    if (viewingJobId === jobId) {
      setViewingJobId(null);
      return;
    }

    setViewingJobId(jobId);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/applications/job/${jobId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setApplications(prev => ({ ...prev, [jobId]: data }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSchedule = async (jobId, date, time) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/interviews/schedule/${jobId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ startDate: date, startTime: time })
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        // Refresh applications to see status change
        fetchApplications(jobId);
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error scheduling interviews");
    }
  };

  const downloadSampleTemplate = () => {
    const templateData = [
      {
        USN: "4NI23IS001",
        Name: "Aarav Sharma",
        Email: "aarav.sharma.4ni23is001@college.edu",
        CGPA: 8.75,
        Branch: "ISE",
        Batch: 2027,
        TenthMarks: 91.5,
        TwelfthMarks: 89.0,
        ActiveBacklogs: 0,
        HistoryOfBacklogs: 0,
        Skills: "React, Node.js, Python, MongoDB"
      },
      {
        USN: "4NI23CS002",
        Name: "Ananya Patel",
        Email: "ananya.patel.4ni23cs002@college.edu",
        CGPA: 9.12,
        Branch: "CSE",
        Batch: 2027,
        TenthMarks: 94.0,
        TwelfthMarks: 92.5,
        ActiveBacklogs: 0,
        HistoryOfBacklogs: 0,
        Skills: "Java, Spring Boot, Docker, SQL"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "StudentRoster");
    XLSX.writeFile(wb, "Student_Roster_Template.xlsx");
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkFile) {
      alert("Please select an Excel or CSV file first");
      return;
    }
    setBulkLoading(true);
    setBulkMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const rawData = XLSX.utils.sheet_to_json(ws);

          if (!rawData || rawData.length === 0) {
            setBulkMessage({ type: "error", text: "Spreadsheet contains no data rows." });
            setBulkLoading(false);
            return;
          }

          const students = rawData.map(row => {
            const getVal = (...keys) => {
              for (const k of keys) {
                if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") return row[k];
                const matched = Object.keys(row).find(orig => orig.toLowerCase().replace(/[^a-z0-9]/g, "") === k.toLowerCase().replace(/[^a-z0-9]/g, ""));
                if (matched && row[matched] !== undefined) return row[matched];
              }
              return undefined;
            };

            return {
              usn: getVal("usn", "rollno", "roll_no"),
              name: getVal("name", "studentname", "fullname") || "Student",
              email: getVal("email", "studentemail"),
              cgpa: parseFloat(getVal("cgpa", "gpa")) || 7.5,
              branch: getVal("branch", "department", "dept") || "CSE",
              batch: getVal("batch", "year", "graduationyear") || 2027,
              tenthMarks: parseFloat(getVal("tenthmarks", "10th", "tenth")) || 85,
              twelfthMarks: parseFloat(getVal("twelfthmarks", "12th", "twelfth", "puc")) || 82,
              activeBacklogs: parseInt(getVal("activebacklogs", "backlogs", "active_backlogs")) || 0,
              historyOfBacklogs: parseInt(getVal("historyofbacklogs", "history_backlogs")) || 0,
              skills: getVal("skills", "technicalskills") || "Problem Solving, Data Structures"
            };
          });

          const token = localStorage.getItem("token");
          const res = await fetch("http://localhost:5001/api/auth/admin/users/bulk", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ students })
          });

          const resData = await res.json();
          if (res.ok) {
            setBulkMessage({ type: "success", text: resData.message || `Processed ${students.length} students successfully!` });
            setBulkFile(null);
            fetchBatches();
          } else {
            setBulkMessage({ type: "error", text: resData.message || "Bulk import failed." });
          }
        } catch (parseErr) {
          console.error(parseErr);
          setBulkMessage({ type: "error", text: "Failed to parse spreadsheet file: " + parseErr.message });
        } finally {
          setBulkLoading(false);
        }
      };
      reader.readAsBinaryString(bulkFile);
    } catch (err) {
      console.error(err);
      setBulkMessage({ type: "error", text: "Error reading file: " + err.message });
      setBulkLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-[#8b9a6e] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b9a6e] to-[#5b6a3e] flex items-center justify-center text-white font-bold text-lg shadow-md">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Console</h1>
              <p className="text-gray-500 text-xs">Logged in as {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-all shadow-xs flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-[#8b9a6e]" />
              <span>Bulk Student Import</span>
            </button>
            <button 
              onClick={() => router.push("/admin/analytics")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#5b6a3e] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-md flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6 sm:px-8 flex gap-1">
          {[
            { key: 'jobs', label: 'Jobs & Applications', icon: Briefcase },
            { key: 'batches', label: 'Batches & Students', icon: GraduationCap },
            { key: 'branches', label: 'Global Branches', icon: Building2 }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === tab.key 
                    ? 'border-[#8b9a6e] text-[#8b9a6e]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <div className="p-6 sm:p-8">

      {activeTab === 'jobs' && (
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Post a Job Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-poppins font-semibold text-gray-800 mb-4">Add Company / Job</h2>
          <form onSubmit={handlePostJob} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive Link (Google Drive, Notion, etc.)</label>
              <input 
                type="url" placeholder="https://..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={formData.driveLink || ""} onChange={e => setFormData({...formData, driveLink: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                required rows="3"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary outline-none"
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Min CGPA</label>
                <input 
                  type="number" step="0.1" required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8b9a6e] outline-none"
                  value={formData.requiredCgpa} onChange={e => setFormData({...formData, requiredCgpa: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">CTC (LPA)</label>
                <input 
                  type="number" step="0.1" required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8b9a6e] outline-none"
                  value={formData.ctc} onChange={e => setFormData({...formData, ctc: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Max Backlogs</label>
                <input 
                  type="number" step="1" min="0" required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8b9a6e] outline-none"
                  value={formData.maxBacklogs} onChange={e => setFormData({...formData, maxBacklogs: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Eligible Branches (Leave empty for all)</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-28 overflow-y-auto">
                {branches.map(b => {
                  const isSelected = formData.allowedBranches.includes(b._id);
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => {
                        const updated = isSelected 
                          ? formData.allowedBranches.filter(id => id !== b._id)
                          : [...formData.allowedBranches, b._id];
                        setFormData({...formData, allowedBranches: updated});
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                        isSelected 
                          ? 'bg-[#8b9a6e] text-white shadow-sm' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {b.code || b.name}
                    </button>
                  );
                })}
                {branches.length === 0 && <span className="text-xs text-gray-400 italic">No branches found</span>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Eligible Batches (Leave empty for all)</label>
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200 max-h-24 overflow-y-auto">
                {batches.map(b => {
                  const isSelected = formData.allowedBatches.includes(b._id);
                  return (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => {
                        const updated = isSelected 
                          ? formData.allowedBatches.filter(id => id !== b._id)
                          : [...formData.allowedBatches, b._id];
                        setFormData({...formData, allowedBatches: updated});
                      }}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium transition-all ${
                        isSelected 
                          ? 'bg-gray-900 text-white shadow-sm' 
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Batch {b.year}
                    </button>
                  );
                })}
                {batches.length === 0 && <span className="text-xs text-gray-400 italic">No batches found</span>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Skills (comma separated)</label>
              <input 
                type="text" required placeholder="e.g. React, Node.js, MongoDB"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#8b9a6e] outline-none"
                value={formData.requiredSkills} onChange={e => setFormData({...formData, requiredSkills: e.target.value})}
              />
            </div>
            <button type="submit" className="mt-2 w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-medium transition-colors shadow-md">
              Post Job
            </button>
          </form>
        </div>
        

        {/* Existing Jobs & Applications */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-poppins font-semibold text-gray-800 mb-4">Posted Jobs & Applicants</h2>
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <div key={job._id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-primary font-medium mb-2">{job.company?.name || job.company}</p>
                    
                    {/* Eligibility & Details Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {job.ctc > 0 && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold flex items-center gap-1">
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{job.ctc} LPA</span>
                        </span>
                      )}
                      <span className="px-2.5 py-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-xs font-semibold">
                        Min CGPA: {job.minCgpa ?? job.requiredCgpa}
                      </span>
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-xs font-semibold">
                        Max Backlogs: {job.maxBacklogs ?? 0}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {(job.requirements || job.requiredSkills || []).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {job.allowedBranches && job.allowedBranches.length > 0 && (
                      <div className="text-xs text-gray-500 mb-2">
                        <span className="font-semibold text-gray-700">Eligible Branches: </span>
                        {job.allowedBranches.map(b => b.code || b.name).join(", ")}
                      </div>
                    )}

                    {job.driveLink && (
                      <a href={job.driveLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline mb-3 inline-flex items-center gap-1.5 font-medium">
                        <ExternalLink className="w-4 h-4" />
                        <span>View Drive Link / Job Details</span>
                      </a>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                    <button
                      onClick={() => handleToggleJobStatus(job._id, job.status)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 shadow-2xs ${
                        job.status === "closed"
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                          : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                      }`}
                      title={job.status === "closed" ? "Click to reopen applications" : "Click to stop taking applications"}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>{job.status === "closed" ? "Reopen Applications" : "Stop Taking Applications"}</span>
                    </button>
                    <button
                      onClick={() => router.push(`/admin/jobs/${job._id}`)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#8b9a6e]/15 hover:bg-[#8b9a6e]/25 text-[#5b6a3e] border border-[#8b9a6e]/30 transition-all flex items-center gap-1.5 shadow-2xs"
                      title="Open dedicated company drive page to search, sort students & export Excel"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Company Drive Page</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => fetchApplications(job._id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                    >
                      {viewingJobId === job._id ? "Hide Quick View" : "Quick View"}
                    </button>
                  </div>
                </div>

                {/* Applications Section */}
                {viewingJobId === job._id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-gray-700">Applications</h4>
                        <button
                          onClick={() => router.push(`/admin/jobs/${job._id}`)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-0.5"
                        >
                          Open Dedicated Page & Export Excel →
                        </button>
                      </div>
                      <div className="flex gap-2 text-sm items-center">
                        <input type="date" id={`date-${job._id}`} className="border px-2 py-1 rounded text-xs" defaultValue={new Date().toISOString().split('T')[0]}/>
                        <input type="time" id={`time-${job._id}`} className="border px-2 py-1 rounded text-xs" defaultValue="09:00"/>
                        <button 
                          onClick={() => {
                            const date = document.getElementById(`date-${job._id}`).value;
                            const time = document.getElementById(`time-${job._id}`).value;
                            handleSchedule(job._id, date, time);
                          }}
                          className="px-3 py-1 bg-primary text-white text-xs rounded font-medium hover:bg-primary/90"
                        >
                          Auto-Schedule
                        </button>
                      </div>
                    </div>
                    {applications[job._id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                              <th className="px-4 py-2">Candidate</th>
                              <th className="px-4 py-2">Email</th>
                              <th className="px-4 py-2">CGPA</th>
                              <th className="px-4 py-2 text-center">AI Match Score</th>
                              <th className="px-4 py-2">Status</th>
                              <th className="px-4 py-2">Resume</th>
                            </tr>
                          </thead>
                          <tbody>
                            {applications[job._id].map(app => (
                              <tr key={app._id} className="border-b">
                                <td className="px-4 py-2 font-medium text-gray-900">{app.user?.name}</td>
                                <td className="px-4 py-2">{app.user?.email}</td>
                                <td className="px-4 py-2">{app.user?.cgpa}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    app.matchScore >= 80 ? 'bg-green-100 text-green-700' :
                                    app.matchScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {app.matchScore ? `${app.matchScore}%` : 'N/A'}
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={app.status?.toLowerCase() || 'applied'}
                                    onChange={(e) => handleUpdateApplicationStatus(app._id, job._id, e.target.value)}
                                    className={`text-xs font-semibold px-2 py-1 rounded-md border outline-none cursor-pointer transition-colors ${
                                      app.status?.toLowerCase() === 'placed' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                      app.status?.toLowerCase() === 'shortlisted' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                      app.status?.toLowerCase() === 'interviewing' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                                      app.status?.toLowerCase() === 'rejected' ? 'bg-red-100 text-red-800 border-red-300' :
                                      'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                                  >
                                    <option value="applied">Applied</option>
                                    <option value="shortlisted">Shortlisted</option>
                                    <option value="interviewing">Interviewing</option>
                                    <option value="placed">Placed</option>
                                    <option value="rejected">Rejected</option>
                                  </select>
                                </td>
                                <td className="px-4 py-2">
                                  {app.user?.resumeUrl ? (
                                    <a href={`http://localhost:5001${app.user.resumeUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                      View PDF
                                    </a>
                                  ) : (
                                    'No resume'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No applications received yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
            {jobs.length === 0 && <p className="text-gray-500 italic">No jobs posted yet.</p>}
          </div>
        </div>

      </main>
      )}

      {activeTab === 'branches' && (
        <main className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Add Global Branch</h2>
              <form onSubmit={handleCreateBranch} className="flex flex-col gap-3">
                <input type="text" placeholder="Branch Name (e.g. Computer Science)" required className="border p-2 rounded focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                <input type="text" placeholder="Branch Code (e.g. CSE)" required className="border p-2 rounded focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={newBranch.code} onChange={e => setNewBranch({...newBranch, code: e.target.value})} />
                <button type="submit" className="mt-2 w-full py-2.5 rounded-lg bg-[#8b9a6e] hover:bg-[#7b8a5e] text-white font-medium transition-colors cursor-pointer">
                  Create Branch
                </button>
              </form>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">All Global Branches</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {branches.map(b => (
              <div key={b._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">{b.name}</h3>
                <p className="text-gray-500 font-medium">{b.code}</p>
              </div>
            ))}
          </div>
        </main>
      )}

      {activeTab === 'batches' && (
        <main className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4">Create Batch</h2>
              <form onSubmit={handleCreateBatch} className="flex flex-col gap-3">
                <input type="number" placeholder="Graduation Year (e.g. 2026)" required className="border p-2 rounded focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={newBatch.year} onChange={e => setNewBatch({...newBatch, year: e.target.value})} />
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={newBatch.isActive} onChange={e => setNewBatch({...newBatch, isActive: e.target.checked})} />
                  Active Batch
                </label>
                <button type="submit" className="mt-2 w-full py-2.5 rounded-lg bg-[#8b9a6e] hover:bg-[#7b8a5e] text-white font-medium transition-colors cursor-pointer">
                  Create Batch
                </button>
              </form>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold mb-4">Manage Students By Batch</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {batches.map(b => (
              <div key={b._id} onClick={() => router.push(`/admin/batch/${b._id}`)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition">
                <h3 className="text-2xl font-bold text-gray-800">Batch {b.year}</h3>
                <p className={`font-medium ${b.isActive ? 'text-green-600' : 'text-gray-500'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </p>
                <div className="mt-4 text-sm text-[#8b9a6e] font-medium flex items-center gap-1.5">
                  <span>Manage Branches</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* Bulk Student Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => { setShowBulkModal(false); setBulkMessage(null); setBulkFile(null); }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#8b9a6e]/15 flex items-center justify-center text-[#8b9a6e]">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Bulk Student Roster Import</h3>
                <p className="text-xs text-gray-500">Upload batch spreadsheets directly into database</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 flex items-start justify-between gap-3">
              <div>
                <p className="font-bold mb-1">Standard Spreadsheet Format:</p>
                <p className="text-amber-800">
                  Columns: <code className="bg-amber-100/80 px-1 py-0.5 rounded">USN</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded">Name</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded">CGPA</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded">Branch</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded">Batch</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded">Backlogs</code>. Default password is <span className="font-semibold">student123</span>.
                </p>
              </div>
              <button
                type="button"
                onClick={downloadSampleTemplate}
                className="shrink-0 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold hover:bg-amber-100/50 shadow-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-amber-700" />
                Template
              </button>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-[#8b9a6e] transition-colors cursor-pointer relative bg-gray-50/50">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={e => {
                    if (e.target.files?.[0]) {
                      setBulkFile(e.target.files[0]);
                      setBulkMessage(null);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700">
                  {bulkFile ? bulkFile.name : "Drag & drop Excel (.xlsx, .csv) file here"}
                </p>
                <p className="text-xs text-gray-400 mt-1">Supports multi-branch cohort sheets up to 10MB</p>
              </div>

              {bulkMessage && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                  bulkMessage.type === "success" 
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}>
                  {bulkMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{bulkMessage.text}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!bulkFile || bulkLoading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#8b9a6e] to-[#5b6a3e] text-white font-bold text-sm shadow-md hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ingesting Roster...</span>
                    </>
                  ) : (
                    <span>Import Students</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

