"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function StudentRoster() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId;
  const branchId = params.branchId;

  const [branch, setBranch] = useState(null);
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentData, setStudentData] = useState({
    name: "", email: "", password: "", usn: "", cgpa: "",
    tenthMarks: "", twelfthMarks: "", activeBacklogs: 0, historyOfBacklogs: 0, skills: ""
  });
  const [editingStudentId, setEditingStudentId] = useState(null);

  const resetForm = () => {
    setStudentData({ name: "", email: "", password: "", usn: "", cgpa: "", tenthMarks: "", twelfthMarks: "", activeBacklogs: 0, historyOfBacklogs: 0, skills: "" });
    setEditingStudentId(null);
  };

  const handleEditClick = (student) => {
    setStudentData({
      name: student.name || "",
      email: student.email || "",
      password: "", // Keep blank, backend will ignore if we don't pass it in the PUT request (actually PUT handles name/email/cgpa/usn/marks)
      usn: student.usn || "",
      cgpa: student.cgpa || "",
      tenthMarks: student.tenthMarks || "",
      twelfthMarks: student.twelfthMarks || "",
      activeBacklogs: student.activeBacklogs || 0,
      historyOfBacklogs: student.historyOfBacklogs || 0,
      skills: Array.isArray(student.skills) ? student.skills.join(", ") : (student.skills || "")
    });
    setEditingStudentId(student._id);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBatchDetails();
    fetchBranchDetails();
    fetchStudents();
  }, [batchId, branchId]);

  const fetchBatchDetails = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/batches/${batchId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBatch(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchBranchDetails = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/branches/${branchId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBranch(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/branches/${branchId}/batch/${batchId}/students`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setStudents(await res.json());
      }
      setLoading(false);
    } catch (err) { 
      console.error(err); 
      setLoading(false);
    }
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const isEdit = !!editingStudentId;
    const url = isEdit 
      ? `http://localhost:5001/api/auth/admin/users/${editingStudentId}`
      : "http://localhost:5001/api/auth/admin/users";

    // Only send password if it's not empty, or if we are creating
    const payload = {
      ...studentData,
      role: "student",
      branch: branchId,
      batch: batchId,
      cgpa: parseFloat(studentData.cgpa) || 0,
      tenthMarks: parseFloat(studentData.tenthMarks) || 0,
      twelfthMarks: parseFloat(studentData.twelfthMarks) || 0,
      activeBacklogs: parseInt(studentData.activeBacklogs) || 0,
      historyOfBacklogs: parseInt(studentData.historyOfBacklogs) || 0,
      skills: studentData.skills ? studentData.skills.split(",").map(s => s.trim()).filter(Boolean) : []
    };
    if (isEdit && !payload.password) delete payload.password;

    try {
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetForm();
        alert(isEdit ? "Student updated successfully!" : "Student added successfully!");
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.message || `Failed to ${isEdit ? 'update' : 'add'} student`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error ${isEdit ? 'updating' : 'adding'} student`);
    }
  };

  const handleToggleBlacklist = async (studentId) => {
    if (!confirm("Are you sure you want to change the blacklist status of this student?")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/auth/admin/users/${studentId}/blacklist`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        fetchStudents();
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!branch || !batch) return <div className="min-h-screen flex items-center justify-center">Resource not found</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <button onClick={() => router.push(`/admin/batch/${batchId}`)} className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Batch {batch.year}</span>
          </button>
          <h1 className="text-2xl font-poppins font-bold text-gray-900">{branch.name} ({branch.code})</h1>
          <p className="text-gray-600 text-sm">Students of Batch {batch.year}</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Student Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-poppins font-semibold text-gray-800">
              {editingStudentId ? "Edit Student" : "Add Student"}
            </h2>
            {editingStudentId && (
              <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-800">Cancel</button>
            )}
          </div>
          <form onSubmit={handleSaveStudent} className="flex flex-col gap-3">
            <input type="text" placeholder="USN" required className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.usn} onChange={e => setStudentData({...studentData, usn: e.target.value})} />
            <input type="text" placeholder="Full Name" required className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} />
            <input type="email" placeholder="Email" required className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.email} onChange={e => setStudentData({...studentData, email: e.target.value})} />
            <input type="password" placeholder={editingStudentId ? "Leave blank to keep current" : "Password"} required={!editingStudentId} className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.password} onChange={e => setStudentData({...studentData, password: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" placeholder="CGPA" required className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.cgpa} onChange={e => setStudentData({...studentData, cgpa: e.target.value})} />
              <input type="number" step="0.1" placeholder="10th %" className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.tenthMarks} onChange={e => setStudentData({...studentData, tenthMarks: e.target.value})} />
              <input type="number" step="0.1" placeholder="12th %" className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.twelfthMarks} onChange={e => setStudentData({...studentData, twelfthMarks: e.target.value})} />
              <input type="number" placeholder="Active Backlogs" className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.activeBacklogs} onChange={e => setStudentData({...studentData, activeBacklogs: e.target.value})} />
            </div>

            <input type="text" placeholder="Skills (comma separated, e.g. React, Python)" className="border p-2 rounded text-sm focus:ring-2 focus:ring-[#8b9a6e] outline-none" value={studentData.skills} onChange={e => setStudentData({...studentData, skills: e.target.value})} />

            <button type="submit" className="mt-2 w-full py-2.5 rounded-lg bg-[#8b9a6e] hover:bg-[#7b8a5e] text-white font-medium transition-colors cursor-pointer">
              {editingStudentId ? "Save Changes" : `Add Student to ${branch.code}`}
            </button>
          </form>
        </div>

        {/* Students List */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-poppins font-semibold text-gray-800 mb-4">Students Roster ({students.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-4 py-2">USN / Name</th>
                    <th className="px-4 py-2">CGPA</th>
                    <th className="px-4 py-2">Backlogs</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student._id} className="border-b">
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs">{student.usn || student.email}</div>
                      </td>
                      <td className="px-4 py-2 font-semibold">{student.cgpa}</td>
                      <td className="px-4 py-2">{student.activeBacklogs || 0}</td>
                      <td className="px-4 py-2">
                        {student.isBlacklisted ? (
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Blacklisted</span>
                        ) : student.isPlaced ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Placed</span>
                        ) : (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-2 flex gap-2">
                        <button 
                          onClick={() => handleEditClick(student)}
                          className="text-xs px-3 py-1 rounded font-medium bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleToggleBlacklist(student._id)}
                          className={`text-xs px-3 py-1 rounded font-medium ${student.isBlacklisted ? 'bg-gray-200 text-gray-800 hover:bg-gray-300' : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'}`}
                        >
                          {student.isBlacklisted ? 'Whitelist' : 'Blacklist'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-4 py-4 text-center text-gray-500 italic">No students in this branch yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
