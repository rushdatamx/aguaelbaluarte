"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GastoInput } from "@/lib/types";

function revalidarGastos() {
  revalidatePath("/gastos");
  revalidatePath("/"); // por si el dashboard usa gastos más adelante
}

export async function registrarGasto(input: GastoInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  if (!input.concepto.trim()) {
    return { error: "El concepto es obligatorio" };
  }
  if (!(input.monto > 0)) {
    return { error: "El monto debe ser mayor a 0" };
  }

  const { data, error } = await supabase
    .from("gastos")
    .insert({
      concepto: input.concepto.trim(),
      monto: input.monto,
      metodo_pago: input.metodo_pago,
      evidencia_url: input.evidencia_url || null,
      notas: input.notas?.trim() || null,
      fecha: input.fecha || undefined, // undefined => usa default hoy_mexico()
      created_by: user.id,
    })
    .select("numero_gasto")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidarGastos();
  return { success: true, numero_gasto: data.numero_gasto };
}

export async function actualizarGasto(input: GastoInput & { id: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  if (!input.concepto.trim()) {
    return { error: "El concepto es obligatorio" };
  }
  if (!(input.monto > 0)) {
    return { error: "El monto debe ser mayor a 0" };
  }

  const { data, error } = await supabase
    .from("gastos")
    .update({
      concepto: input.concepto.trim(),
      monto: input.monto,
      metodo_pago: input.metodo_pago,
      evidencia_url: input.evidencia_url || null,
      notas: input.notas?.trim() || null,
      fecha: input.fecha || undefined,
    })
    .eq("id", input.id)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "No tienes permisos para editar este gasto" };
  }

  revalidarGastos();
  return { success: true };
}

export async function cancelarGasto(gastoId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data, error } = await supabase
    .from("gastos")
    .update({ estado: "cancelado" })
    .eq("id", gastoId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "No tienes permisos para cancelar este gasto" };
  }

  revalidarGastos();
  return { success: true };
}
