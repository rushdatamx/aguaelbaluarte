import { createClient } from "@/lib/supabase/server";
import { FormDomicilio } from "@/components/purificadora/form-domicilio";
import type { Producto } from "@/lib/types";

export default async function VentasDomicilioPage() {
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, canal, precio, unidad, litros_por_unidad, orden, activo")
    .eq("canal", "domicilio")
    .eq("activo", true)
    .order("orden");

  return <FormDomicilio productos={(productos as Producto[]) || []} />;
}
