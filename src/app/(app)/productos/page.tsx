import { createClient } from "@/lib/supabase/server";
import { ProductosList } from "@/components/purificadora/productos-list";
import { requireRole } from "@/lib/auth";
import type { Producto, ProductoConClientes } from "@/lib/types";

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

interface ClienteLite {
  id: string;
  nombre: string;
  colonia: string | null;
}

export default async function ProductosPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const [productosRes, clientesRes, asignacionesRes] = await Promise.all([
    supabase
      .from("productos")
      .select("id, nombre, canal, precio, unidad, litros_por_unidad, tipo_inventario, orden, activo")
      .order("canal")
      .order("orden"),
    supabase
      .from("clientes")
      .select("id, nombre, colonia")
      .eq("activo", true)
      .neq("id", PUBLICO_EN_GENERAL_ID)
      .order("nombre"),
    supabase.from("cliente_productos").select("cliente_id, producto_id"),
  ]);

  // cliente_ids[] por producto
  const porProducto: Record<string, string[]> = {};
  for (const a of (asignacionesRes.data as { cliente_id: string; producto_id: string }[]) || []) {
    (porProducto[a.producto_id] ??= []).push(a.cliente_id);
  }

  const productos: ProductoConClientes[] = ((productosRes.data as Producto[]) || []).map((p) => ({
    ...p,
    cliente_ids: porProducto[p.id] || [],
  }));

  return (
    <ProductosList
      productos={productos}
      clientes={(clientesRes.data as ClienteLite[]) || []}
    />
  );
}
