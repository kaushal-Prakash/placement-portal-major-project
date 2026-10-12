"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function BatchManagement() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId;

  const [batch, setBatch] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchBatchDetails();
    fetchBranches();
  }, [batchId]);

  const fetchBatchDetails = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/batches/${batchId}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBatch(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchBranches = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5001/api/branches`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setBranches(await res.json());
      setLoading(false);
    } catch (err) { 
      console.error(err); 
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!batch) return <div className="min-h-screen flex items-center justify-center">Batch not found</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <button onClick={() => router.push('/admin')} className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center gap-1.5 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin</span>
          </button>
          <h1 className="text-2xl font-poppins font-bold text-gray-900">Batch {batch.year}</h1>
          <p className="text-gray-600 text-sm">Select a branch to manage students for this batch</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold mb-4">Branches in Batch {batch.year}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {branches.map(b => (
            <div 
              key={b._id} 
              onClick={() => router.push(`/admin/batch/${batchId}/branch/${b._id}`)} 
              className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition"
            >
              <h3 className="text-xl font-bold text-gray-800">{b.name}</h3>
              <p className="text-gray-500 font-medium">{b.code}</p>
              <div className="mt-4 text-sm text-[#8b9a6e] font-medium flex items-center gap-1.5">
                <span>Manage Students</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
