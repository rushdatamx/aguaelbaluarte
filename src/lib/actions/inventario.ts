"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TipoInventario } from "@/lib/types";

// Registrar una COMPRA (entrada de inventario con costo fechado).
// Suma stock y fija el último costo del tipo.
export async function registrarCompra(input: {
  tipo: TipoInventario;
  cantidad: number;
  costo_unitario: number;
  fecha?: string | null; // YYYY-MM-DD; null => hoy México (default en SQL)
}) {
  const supabase = await createClient();

  if (!(input.cantidad > 0)) {
    return { error: "La cantidad debe ser mayor a 0" };
  }
  if (!(input.costo_unitario >= 0)) {
    return { error: "El costo unitario no es válido" };
  }

  const { error } = await supabase.rpc("fn_inventario_compra", {
    p_tipo: input.tipo,
    p_cantidad: input.cantidad,
    p_costo_unitario: input.costo_unitario,
    p_fecha: input.fecha || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
  return { success: true };
}

// Registrar un AJUSTE manual (merma, recuento). cantidad puede ser + o -.
export async function registrarAjuste(input: {
  tipo: TipoInventario;
  cantidad: number;
  motivo?: string;
}) {
  const supabase = await createClient();

  if (!input.cantidad || input.cantidad === 0) {
    return { error: "El ajuste no puede ser 0" };
  }

  const { error } = await supabase.rpc("fn_inventario_ajuste", {
    p_tipo: input.tipo,
    p_cantidad: input.cantidad,
    p_motivo: input.motivo?.trim() || null,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/inventario");
  return { success: true };
}

// Configurar a qué tipo de inventario pertenece un producto (o ninguno).
export async function setTipoInventarioProducto(input: {
  producto_id: string;
  tipo: TipoInventario | null;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("productos")
    .update({ tipo_inventario: input.tipo })
    .eq("id", input.producto_id)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "No tienes permisos para editar este producto" };
  }

  revalidatePath("/inventario");
  return { success: true };
}
