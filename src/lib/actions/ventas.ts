"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { VentaInput } from "@/lib/types";

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

  revalidatePath("/");
  revalidatePath("/todas-ventas");
  revalidatePath("/clientes");

  return { success: true, numero_venta: venta.numero_venta };
}
