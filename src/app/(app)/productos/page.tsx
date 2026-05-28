import { createClient } from "@/lib/supabase/server";
import { ProductosList } from "@/components/purificadora/productos-list";
import { requireRole } from "@/lib/auth";
import type { Producto } from "@/lib/types";

export default async function ProductosPage() {
  await requireRole(["admin"]);
  const supabase = await createClient();

  const { data: productos } = await supabase
    .from("productos")
    .select("id, nombre, canal, precio, unidad, litros_por_unidad, orden, activo")
    .order("canal")
    .order("orden");

  return <ProductosList productos={(productos as Producto[]) || []} />;
}
