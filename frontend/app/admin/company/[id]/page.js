"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CompanyAliasPage() {
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (params?.id) {
      router.replace(`/admin/jobs/${params.id}`);
    }
  }, [params, router]);

  return (
    <div className="min-h-screen bg-[#f7f2eb] flex items-center justify-center p-6 text-gray-500 text-xs">
      Loading company drive...
    </div>
  );
}
