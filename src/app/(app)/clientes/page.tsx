import { createClient } from "@/lib/supabase/server";
import { ClientesList } from "@/components/purificadora/clientes-list";
import { requireRole } from "@/lib/auth";
import type { ClienteStats } from "@/lib/types";

export default async function ClientesPage() {
  await requireRole(["admin", "vendedor_fisico", "vendedor_domicilio"]);
  const supabase = await createClient();

  const { data: clientes } = await supabase
    .from("v_cliente_stats")
    .select("*")
    .eq("activo", true)
    .order("nombre");

  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true });

  return (
    <ClientesList
      clientes={(clientes as ClienteStats[]) || []}
      totalClientes={totalClientes || 0}
    />
  );
}
