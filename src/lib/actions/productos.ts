"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function generarSlug(nombre: string, canal: "domicilio" | "fisico"): string {
  const base = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const prefix = canal === "domicilio" ? "dom" : "fis";
  return `${prefix}-${base}`;
}

export interface CrearProductoInput {
  nombre: string;
  canal: "domicilio" | "fisico" | "ambos";
  precio: number;
  unidad: string;
  litros_por_unidad: number | null;
}

export async function crearProducto(input: CrearProductoInput) {
  const supabase = await createClient();

  const nombre = input.nombre.trim();
  if (!nombre) return { error: "Nombre requerido" };
  if (!Number.isFinite(input.precio) || input.precio < 0) {
    return { error: "Precio inválido" };
  }
  const unidad = (input.unidad || "pza").trim();

  const canales: ("domicilio" | "fisico")[] =
    input.canal === "ambos" ? ["domicilio", "fisico"] : [input.canal];

  // Get max orden per canal so the new product appears at the bottom
  const { data: ordenData } = await supabase
    .from("productos")
    .select("canal, orden");

  const maxOrden: Record<string, number> = {};
  for (const row of ordenData || []) {
    const r = row as { canal: string; orden: number };
    if ((maxOrden[r.canal] ?? -1) < r.orden) maxOrden[r.canal] = r.orden;
  }

  const rows = canales.map((canal) => ({
    id: generarSlug(nombre, canal),
    nombre,
    canal,
    precio: input.precio,
    unidad,
    litros_por_unidad: input.litros_por_unidad,
    orden: (maxOrden[canal] ?? 0) + 1,
    activo: true,
  }));

  const { data, error } = await supabase
    .from("productos")
    .insert(rows)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "No tienes permisos para crear productos" };
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  revalidatePath("/ventas-domicilio");
  return { success: true };
}

export async function actualizarProducto(input: {
  id: string;
  precio?: number;
  activo?: boolean;
}) {
  const supabase = await createClient();

  const update: Record<string, unknown> = {};
  if (typeof input.precio === "number") update.precio = input.precio;
  if (typeof input.activo === "boolean") update.activo = input.activo;

  if (Object.keys(update).length === 0) {
    return { error: "Nada que actualizar" };
  }

  const { data, error } = await supabase
    .from("productos")
    .update(update)
    .eq("id", input.id)
    .select("id");

  if (error) {
    return { error: error.message };
  }

  if (!data || data.length === 0) {
    return { error: "No tienes permisos para modificar productos" };
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  revalidatePath("/ventas-domicilio");
  return { success: true };
}
