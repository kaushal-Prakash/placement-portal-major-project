"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:5001/api/analytics", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setData)
      .catch(console.error);
      
    fetch("http://localhost:5001/api/analytics/predictive", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(setPredictiveData)
      .catch(console.error);
  }, []);

  if (!data) return <div className="min-h-screen flex items-center justify-center">Loading Analytics...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-poppins font-bold text-gray-800">Placement Analytics</h1>
          <p className="text-gray-600">Overview of placement performance</p>
        </div>
        <button 
          onClick={() => router.push("/admin")}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
        >
          Back to Admin
        </button>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Total Students</h3>
          <p className="text-4xl font-bold text-gray-900">{data.totalStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Placed Students</h3>
          <p className="text-4xl font-bold text-green-600">{data.placedStudents}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-gray-500 text-sm font-semibold mb-2">Placement Rate</h3>
          <p className="text-4xl font-bold text-indigo-600">{data.placementRate.toFixed(1)}%</p>
        </div>
        
        {/* Batch-wise Stats */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-4">
          <h3 className="text-gray-800 text-lg font-semibold mb-4">Batch-wise Placement Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Batch Year</th>
                  <th className="px-4 py-2 text-center">Total Students</th>
                  <th className="px-4 py-2 text-center">Placed</th>
                  <th className="px-4 py-2 text-right">Placement Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.batchStats?.map((batch, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-3 font-bold text-gray-900">{batch.batchYear || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-center font-medium">{batch.totalStudents}</td>
                    <td className="px-4 py-3 text-center font-bold text-green-600">{batch.placedStudents}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${batch.placementRate}%` }}
                          ></div>
                        </div>
                        <span className="font-bold text-indigo-600">{batch.placementRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data.batchStats || data.batchStats.length === 0) && (
                  <tr>
                    <td colSpan="4" className="px-4 py-4 text-center text-gray-500 italic">No batch data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Companies Chart Placeholder */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-4">
          <h3 className="text-gray-800 text-lg font-semibold mb-4">Top Hiring Companies</h3>
          <div className="flex flex-col gap-4">
            {data.topCompanies.map((tc, i) => (
              <div key={i} className="flex items-center">
                <div className="w-32 text-sm font-medium text-gray-700 truncate">{tc.company}</div>
                <div className="flex-1 ml-4 bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-primary h-4 rounded-full" 
                    style={{ width: `${(tc.count / Math.max(...data.topCompanies.map(c => c.count))) * 100}%` }}
                  ></div>
                </div>
                <div className="ml-4 text-sm font-bold text-gray-900 w-8">{tc.count}</div>
              </div>
            ))}
            {data.topCompanies.length === 0 && <p className="text-sm text-gray-500 italic">No job postings yet.</p>}
          </div>
        </div>

        {/* Predictive Insights Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-800 text-lg font-semibold">Predictive Placement Analytics (AI Powered)</h3>
            <span className="bg-orange-100 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">Early Warning System</span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Predicts likelihood of placement based on academic performance and AI match scores.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Batch</th>
                  <th className="px-4 py-2 text-center">CGPA</th>
                  <th className="px-4 py-2 text-center">Avg Match Score</th>
                  <th className="px-4 py-2 text-center">Probability</th>
                  <th className="px-4 py-2 text-center">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {predictiveData && predictiveData.slice(0, 10).map((student, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="px-4 py-3 font-bold text-gray-900">
                      {student.name} <br/>
                      <span className="font-normal text-xs text-gray-500">{student.usn || student.branch}</span>
                    </td>
                    <td className="px-4 py-3 font-medium">{student.batch}</td>
                    <td className="px-4 py-3 text-center">{student.cgpa || 'N/A'}</td>
                    <td className="px-4 py-3 text-center">{student.avgMatchScore}%</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`font-bold ${
                          student.placementProbability >= 70 ? 'text-green-600' :
                          student.placementProbability >= 40 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.placementProbability}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        student.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        student.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {student.riskLevel}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!predictiveData || predictiveData.length === 0) && (
                  <tr>
                    <td colSpan="6" className="px-4 py-4 text-center text-gray-500 italic">No active students found for prediction.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
