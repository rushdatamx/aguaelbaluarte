"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

  const { error } = await supabase
    .from("productos")
    .update(update)
    .eq("id", input.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/productos");
  revalidatePath("/ventas");
  revalidatePath("/ventas-domicilio");
  return { success: true };
}
