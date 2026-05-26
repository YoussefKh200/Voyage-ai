import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSessionFromCookies } from "@/lib/auth/session";
import PlannerClient from "@/components/planner/PlannerClient";

export default async function PlannerPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect("/login");
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#d4a853]/30 border-t-[#d4a853] animate-spin" />
      </div>
    }>
      <PlannerClient />
    </Suspense>
  );
}
