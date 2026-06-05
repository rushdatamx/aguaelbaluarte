import { createClient } from "@/lib/supabase/server";
import { InventarioClient } from "@/components/purificadora/inventario/inventario-client";
import { requireRole } from "@/lib/auth";
import type {
  InventarioRow,
  InventarioMovimiento,
  Producto,
} from "@/lib/types";

export default async function InventarioPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [inventarioRes, movimientosRes, productosRes] = await Promise.all([
    supabase.from("inventario").select("*").order("tipo"),
    supabase
      .from("inventario_movimientos")
      .select(
        "id, tipo, clase, cantidad, costo_unitario, costo_total, venta_id, motivo, fecha, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("productos")
      .select(
        "id, nombre, canal, precio, unidad, litros_por_unidad, tipo_inventario, orden, activo"
      )
      .eq("activo", true)
      .order("canal")
      .order("orden"),
  ]);

  return (
    <InventarioClient
      inventario={(inventarioRes.data as InventarioRow[]) || []}
      movimientos={(movimientosRes.data as InventarioMovimiento[]) || []}
      productos={(productosRes.data as Producto[]) || []}
    />
  );
}
