"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { VentaInput } from "@/lib/types";

function revalidarVentas() {
  revalidatePath("/");
  revalidatePath("/todas-ventas");
  revalidatePath("/clientes");
}

export async function registrarVenta(input: VentaInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  // Calculate total
  const montoTotal = input.items.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );

  // Insert venta header
  const { data: venta, error: ventaError } = await supabase
    .from("ventas")
    .insert({
      cliente_id: input.cliente_id || null,
      fuente: input.fuente,
      turno: input.turno || null,
      estado: input.estado,
      estado_pago: input.estado_pago,
      metodo_pago: input.metodo_pago,
      lectura_inicial: input.lectura_inicial ?? null,
      lectura_final: input.lectura_final ?? null,
      evidencia_url: input.evidencia_url || null,
      notas: input.notas?.trim() || null,
      monto_total: montoTotal,
      created_by: user.id,
    })
    .select("id, numero_venta")
    .single();

  if (ventaError) {
    return { error: ventaError.message };
  }

  // Insert line items
  const items = input.items.map((item) => ({
    venta_id: venta.id,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    monto_total: item.cantidad * item.precio_unitario,
  }));

  const { error: itemsError } = await supabase
    .from("venta_items")
    .insert(items);

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidarVentas();

  return { success: true, numero_venta: venta.numero_venta };
}

export async function actualizarVenta(ventaId: string, input: VentaInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  if (input.items.length === 0) {
    return { error: "La venta debe tener al menos un producto" };
  }

  const montoTotal = input.items.reduce(
    (sum, item) => sum + item.cantidad * item.precio_unitario,
    0
  );

  const { data: updated, error: updateError } = await supabase
    .from("ventas")
    .update({
      cliente_id: input.cliente_id || null,
      fuente: input.fuente,
      turno: input.turno || null,
      estado: input.estado,
      estado_pago: input.estado_pago,
      metodo_pago: input.metodo_pago,
      lectura_inicial: input.lectura_inicial ?? null,
      lectura_final: input.lectura_final ?? null,
      evidencia_url: input.evidencia_url || null,
      notas: input.notas?.trim() || null,
      monto_total: montoTotal,
    })
    .eq("id", ventaId)
    .select("id, numero_venta");

  if (updateError) {
    return { error: updateError.message };
  }
  if (!updated || updated.length === 0) {
    return { error: "No tienes permisos para editar esta venta" };
  }

  const { error: delError } = await supabase
    .from("venta_items")
    .delete()
    .eq("venta_id", ventaId);

  if (delError) {
    return { error: delError.message };
  }

  const items = input.items.map((item) => ({
    venta_id: ventaId,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
    precio_unitario: item.precio_unitario,
    monto_total: item.cantidad * item.precio_unitario,
  }));

  const { error: itemsError } = await supabase
    .from("venta_items")
    .insert(items);

  if (itemsError) {
    return { error: itemsError.message };
  }

  revalidarVentas();
  return { success: true, numero_venta: updated[0].numero_venta };
}

export async function cancelarVenta(ventaId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "No autenticado" };
  }

  const { data, error } = await supabase
    .from("ventas")
    .update({ estado: "cancelado" })
    .eq("id", ventaId)
    .select("id");

  if (error) {
    return { error: error.message };
  }
  if (!data || data.length === 0) {
    return { error: "No tienes permisos para cancelar esta venta" };
  }

  revalidarVentas();
  return { success: true };
}
