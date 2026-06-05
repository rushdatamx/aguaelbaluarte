import { GastosClient } from "@/components/purificadora/gastos-client";
import { requireRole } from "@/lib/auth";

export default async function GastosPage() {
  const role = await requireRole([
    "admin",
    "vendedor_fisico",
    "vendedor_domicilio",
  ]);
  return <GastosClient isAdmin={role === "admin"} />;
}
