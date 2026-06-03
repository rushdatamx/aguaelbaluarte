import { requireRole } from "@/lib/auth";
import { DashboardClient } from "@/components/purificadora/dashboard/dashboard-client";

export default async function DashboardPage() {
  await requireRole(["admin"]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <DashboardClient />
    </div>
  );
}
