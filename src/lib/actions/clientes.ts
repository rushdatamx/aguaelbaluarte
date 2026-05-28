"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

export async function buscarClientes(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, colonia")
    .ilike("nombre", `%${query}%`)
    .eq("activo", true)
    .neq("id", PUBLICO_EN_GENERAL_ID)
    .limit(8);

  if (error) return [];
  return data;
}

export async function listarClientes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clientes")
    .select("id, nombre, telefono, direccion, colonia")
    .eq("activo", true)
    .neq("id", PUBLICO_EN_GENERAL_ID)
    .order("nombre");

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
