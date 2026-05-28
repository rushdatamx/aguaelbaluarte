"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function buscarClientes(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, colonia")
    .ilike("nombre", `%${query}%`)
    .eq("activo", true)
    .limit(8);

  if (error) return [];
  return data;
}

export async function crearCliente(input: {
  nombre: string;
  telefono?: string;
  direccion?: string;
  colonia?: string;
  referencia?: string;
  notas?: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nombre: input.nombre,
      telefono: input.telefono || null,
      direccion: input.direccion || null,
      colonia: input.colonia || null,
      referencia: input.referencia || null,
      notas: input.notas || null,
    })
    .select("id, nombre, telefono, direccion, colonia")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/clientes");
  return { success: true, cliente: data };
}
