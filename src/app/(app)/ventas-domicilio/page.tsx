import { createClient } from "@/lib/supabase/server";
import { FormDomicilio } from "@/components/purificadora/form-domicilio";
import { requireRole } from "@/lib/auth";
import type { Producto } from "@/lib/types";

export default async function VentasDomicilioPage() {
  await requireRole(["admin", "vendedor_domicilio", "vendedor_fisico"]);
  const supabase = await createClient();

  const [productosRes, asignacionesRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, canal, precio, unidad, litros_por_unidad, orden, activo")
      .eq("canal", "domicilio")
      .eq("activo", true)
      .order("orden"),
    supabase.from("cliente_productos").select("cliente_id, producto_id"),
  ]);

  return (
    <FormDomicilio
      productos={(productosRes.data as Producto[]) || []}
      asignaciones={
        (asignacionesRes.data as { cliente_id: string; producto_id: string }[]) || []
      }
    />
  );
}
