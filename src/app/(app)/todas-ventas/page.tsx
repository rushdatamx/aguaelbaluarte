import { VentasList } from "@/components/purificadora/ventas-list";
import { requireRole } from "@/lib/auth";

export default async function TodasVentasPage() {
  const role = await requireRole(["admin"]);
  return <VentasList isAdmin={role === "admin"} />;
}
