"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function BranchManagement() {
  const router = useRouter();
  const params = useParams();
  const branchId = params.id;

  const [branch, setBranch] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentData, setStudentData] = useState({
    name: "", email: "", password: "", usn: "", cgpa: "",
    tenthMarks: "", twelfthMarks: "", activeBacklogs: 0, historyOfBacklogs: 0
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBranchDetails();
    fetchStudents();
  }, [branchId]);

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
      const res = await fetch(`http://localhost:5001/api/branches/${branchId}/students`, {
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

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5001/api/auth/admin/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...studentData,
          role: "student",
          branch: branchId,
          cgpa: parseFloat(studentData.cgpa) || 0,
          tenthMarks: parseFloat(studentData.tenthMarks) || 0,
          twelfthMarks: parseFloat(studentData.twelfthMarks) || 0,
          activeBacklogs: parseInt(studentData.activeBacklogs) || 0,
          historyOfBacklogs: parseInt(studentData.historyOfBacklogs) || 0,
        }),
      });

      if (res.ok) {
        setStudentData({ name: "", email: "", password: "", usn: "", cgpa: "", tenthMarks: "", twelfthMarks: "", activeBacklogs: 0, historyOfBacklogs: 0 });
        alert("Student added successfully!");
        fetchStudents();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to add student");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding student");
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
  if (!branch) return <div className="min-h-screen flex items-center justify-center">Branch not found</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <button onClick={() => router.push('/admin')} className="text-sm text-gray-500 hover:text-gray-900 mb-2">&larr; Back to Admin</button>
          <h1 className="text-2xl font-poppins font-bold text-gray-900">{branch.name} ({branch.code})</h1>
          <p className="text-gray-600 text-sm">Manage students for this branch</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Add Student Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
          <h2 className="text-xl font-poppins font-semibold text-gray-800 mb-4">Add Student</h2>
          <form onSubmit={handleAddStudent} className="flex flex-col gap-3">
            <input type="text" placeholder="USN" required className="border p-2 rounded text-sm" value={studentData.usn} onChange={e => setStudentData({...studentData, usn: e.target.value})} />
            <input type="text" placeholder="Full Name" required className="border p-2 rounded text-sm" value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} />
            <input type="email" placeholder="Email" required className="border p-2 rounded text-sm" value={studentData.email} onChange={e => setStudentData({...studentData, email: e.target.value})} />
            <input type="password" placeholder="Password" required className="border p-2 rounded text-sm" value={studentData.password} onChange={e => setStudentData({...studentData, password: e.target.value})} />
            
            <div className="grid grid-cols-2 gap-2">
              <input type="number" step="0.01" placeholder="CGPA" required className="border p-2 rounded text-sm" value={studentData.cgpa} onChange={e => setStudentData({...studentData, cgpa: e.target.value})} />
              <input type="number" step="0.1" placeholder="10th %" className="border p-2 rounded text-sm" value={studentData.tenthMarks} onChange={e => setStudentData({...studentData, tenthMarks: e.target.value})} />
              <input type="number" step="0.1" placeholder="12th %" className="border p-2 rounded text-sm" value={studentData.twelfthMarks} onChange={e => setStudentData({...studentData, twelfthMarks: e.target.value})} />
              <input type="number" placeholder="Active Backlogs" className="border p-2 rounded text-sm" value={studentData.activeBacklogs} onChange={e => setStudentData({...studentData, activeBacklogs: e.target.value})} />
            </div>

            <button type="submit" className="mt-2 w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors">
              Add Student
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
                      <td className="px-4 py-2">
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
