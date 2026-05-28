import { createClient } from "@/lib/supabase/server";
import { FormFisico } from "@/components/purificadora/form-fisico";
import { requireRole } from "@/lib/auth";
import type { Producto } from "@/lib/types";

export default async function VentasFisicoPage() {
  await requireRole(["admin", "vendedor_fisico", "vendedor_domicilio"]);
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, canal, precio, unidad, litros_por_unidad, orden, activo")
    .eq("canal", "fisico")
    .eq("activo", true)
    .order("orden");

  return <FormFisico productos={(productos as Producto[]) || []} />;
}
