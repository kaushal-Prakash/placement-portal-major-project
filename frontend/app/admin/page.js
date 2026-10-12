"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    fetch("http://localhost:5001/api/jobs")
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

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-poppins font-bold text-gray-900">Admin Console</h1>
          <p className="text-gray-600 text-sm">Manage jobs, applications, and scheduling for {user.name}</p>
        </div>
        <button 
          onClick={() => router.push("/admin/analytics")}
          className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span>📊</span> View Analytics
        </button>
      </div>

      <div className="max-w-6xl mx-auto mb-6 flex gap-4 border-b">
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2 font-medium ${activeTab === 'jobs' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
        >Jobs & Applications</button>
        <button 
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 font-medium ${activeTab === 'batches' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
        >Batches (Students)</button>
        <button 
          onClick={() => setActiveTab('branches')}
          className={`px-4 py-2 font-medium ${activeTab === 'branches' ? 'border-b-2 border-primary text-primary' : 'text-gray-500'}`}
        >Global Branches</button>
      </div>

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
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold">
                          💰 {job.ctc} LPA
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
                      <a href={job.driveLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 hover:underline mb-3 block flex items-center gap-1">
                        🔗 View Drive Link / Job Details
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <button 
                      onClick={() => fetchApplications(job._id)}
                      className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                    >
                      {viewingJobId === job._id ? "Hide Applications" : "View Applications"}
                    </button>
                  </div>
                </div>

                {/* Applications Section */}
                {viewingJobId === job._id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold text-gray-700">Ranked Applications</h4>
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
                <div className="mt-4 text-sm text-primary font-medium flex items-center gap-1">Manage Branches &rarr;</div>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
