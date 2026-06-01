"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Plus, Minus, Trash2, AlertTriangle } from "lucide-react";
import { ClienteCombobox } from "@/components/purificadora/cliente-combobox";
import { createClient } from "@/lib/supabase/client";
import { actualizarVenta, cancelarVenta } from "@/lib/actions/ventas";
import type { Producto, VentaInput } from "@/lib/types";

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

interface VentaEditable {
  id: string;
  numero_venta: number;
  cliente_id: string | null;
  cliente_nombre: string;
  cliente_direccion: string;
  cliente_colonia: string;
  fuente: "domicilio" | "fisico";
  turno: "matutino" | "vespertino" | null;
  estado_pago: "pagado" | "no_pagado";
  metodo_pago: "efectivo" | "transferencia" | "credito";
  lectura_inicial: number | null;
  lectura_final: number | null;
  notas: string | null;
  evidencia_url: string | null;
  items: { producto_id: string; cantidad: number; precio_unitario: number }[];
}

interface EditarVentaSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ventaId: string | null;
  onSaved: () => void;
}

export function EditarVentaSheet({
  open,
  onOpenChange,
  ventaId,
  onSaved,
}: EditarVentaSheetProps) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [formError, setFormError] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [venta, setVenta] = useState<VentaEditable | null>(null);

  useEffect(() => {
    if (!open || !ventaId) {
      setVenta(null);
      setConfirmCancel(false);
      setFormError("");
      return;
    }

    const cargar = async () => {
      setLoading(true);
      setFormError("");
      const supabase = createClient();

      const { data, error } = await supabase
        .from("ventas")
        .select(`
          id, numero_venta, cliente_id, fuente, turno, estado_pago, metodo_pago,
          lectura_inicial, lectura_final, notas, evidencia_url,
          clientes(nombre, direccion, colonia),
          venta_items(producto_id, cantidad, precio_unitario)
        `)
        .eq("id", ventaId)
        .single();

      if (error || !data) {
        setFormError(error?.message || "No se pudo cargar la venta");
        setLoading(false);
        return;
      }

      const v = data as unknown as {
        id: string;
        numero_venta: number;
        cliente_id: string | null;
        fuente: "domicilio" | "fisico";
        turno: "matutino" | "vespertino" | null;
        estado_pago: "pagado" | "no_pagado";
        metodo_pago: "efectivo" | "transferencia" | "credito";
        lectura_inicial: number | null;
        lectura_final: number | null;
        notas: string | null;
        evidencia_url: string | null;
        clientes: { nombre: string; direccion: string | null; colonia: string | null } | null;
        venta_items: { producto_id: string; cantidad: number; precio_unitario: number }[];
      };

      const { data: prods } = await supabase
        .from("productos")
        .select("*")
        .eq("canal", v.fuente)
        .eq("activo", true)
        .order("orden");

      setProductos((prods as Producto[]) || []);
      setVenta({
        id: v.id,
        numero_venta: v.numero_venta,
        cliente_id: v.cliente_id,
        cliente_nombre: v.clientes?.nombre || "Público en general",
        cliente_direccion: v.clientes?.direccion || "",
        cliente_colonia: v.clientes?.colonia || "",
        fuente: v.fuente,
        turno: v.turno,
        estado_pago: v.estado_pago,
        metodo_pago: v.metodo_pago,
        lectura_inicial: v.lectura_inicial,
        lectura_final: v.lectura_final,
        notas: v.notas,
        evidencia_url: v.evidencia_url,
        items: v.venta_items || [],
      });
      setLoading(false);
    };

    cargar();
  }, [open, ventaId]);

  const setCantidad = (productoId: string, cantidad: number) => {
    if (!venta) return;
    const safe = Math.max(0, Math.floor(cantidad));
    const existing = venta.items.find((i) => i.producto_id === productoId);
    let newItems = venta.items;
    if (existing) {
      newItems = venta.items.map((i) =>
        i.producto_id === productoId ? { ...i, cantidad: safe } : i
      );
    } else if (safe > 0) {
      const prod = productos.find((p) => p.id === productoId);
      if (!prod) return;
      newItems = [
        ...venta.items,
        { producto_id: productoId, cantidad: safe, precio_unitario: prod.precio },
      ];
    }
    setVenta({ ...venta, items: newItems });
  };

  const getCantidad = (productoId: string) =>
    venta?.items.find((i) => i.producto_id === productoId)?.cantidad || 0;

  const total = venta
    ? venta.items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
    : 0;

  const litrosUsados = venta
    ? venta.items.reduce((s, i) => {
        const prod = productos.find((p) => p.id === i.producto_id);
        return s + (prod?.litros_por_unidad || 0) * i.cantidad;
      }, 0)
    : 0;

  const litrosDisponibles = venta
    ? (venta.lectura_final || 0) - (venta.lectura_inicial || 0)
    : 0;

  const handleGuardar = () => {
    if (!venta) return;
    setFormError("");

    const itemsActivos = venta.items.filter((i) => i.cantidad > 0);
    if (itemsActivos.length === 0) {
      setFormError("Agrega al menos un producto con cantidad > 0");
      return;
    }

    if (venta.fuente === "fisico") {
      if (!venta.turno) {
        setFormError("Selecciona un turno");
        return;
      }
      if (venta.lectura_inicial === null || venta.lectura_final === null) {
        setFormError("Captura las lecturas del cuentalitros");
        return;
      }
      if (venta.lectura_final < venta.lectura_inicial) {
        setFormError("La lectura final no puede ser menor a la inicial");
        return;
      }
    }

    const input: VentaInput = {
      cliente_id: venta.cliente_id,
      fuente: venta.fuente,
      turno: venta.turno,
      estado: venta.fuente === "domicilio" ? "entregado" : "entregado",
      estado_pago: venta.estado_pago,
      metodo_pago: venta.metodo_pago,
      lectura_inicial: venta.lectura_inicial,
      lectura_final: venta.lectura_final,
      evidencia_url: venta.evidencia_url,
      notas: venta.notas,
      items: itemsActivos,
    };

    startTransition(async () => {
      const result = await actualizarVenta(venta.id, input);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      onSaved();
      onOpenChange(false);
    });
  };

  const handleCancelar = () => {
    if (!venta) return;
    startTransition(async () => {
      const result = await cancelarVenta(venta.id);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      onSaved();
      onOpenChange(false);
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Pencil className="h-4 w-4 text-sky-500" />
            Editar venta {venta ? `#${venta.numero_venta}` : ""}
          </SheetTitle>
          <SheetDescription className="text-xs">
            Modifica los detalles o cancela la venta. Los cambios se reflejan en el dashboard.
          </SheetDescription>
        </SheetHeader>

        {loading || !venta ? (
          <div className="flex-1 flex items-center justify-center">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-sm text-muted-foreground">Sin datos</p>
            )}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-6 space-y-5">
              {/* Cliente (solo domicilio) */}
              {venta.fuente === "domicilio" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Cliente
                  </label>
                  <ClienteCombobox
                    value={venta.cliente_id || PUBLICO_EN_GENERAL_ID}
                    nombre={venta.cliente_nombre}
                    onSelect={(c) =>
                      setVenta({
                        ...venta,
                        cliente_id: c.id,
                        cliente_nombre: c.nombre,
                        cliente_direccion: c.direccion,
                        cliente_colonia: c.colonia,
                      })
                    }
                  />
                </div>
              )}

              {/* Turno (solo físico) */}
              {venta.fuente === "fisico" && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">
                    Turno
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["matutino", "vespertino"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setVenta({ ...venta, turno: t })}
                        className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                          venta.turno === t
                            ? "bg-sky-500 text-white border-sky-500"
                            : "bg-background border-border hover:border-sky-300"
                        }`}
                      >
                        {t === "matutino" ? "Matutino" : "Vespertino"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Cuentalitros (solo físico) */}
              {venta.fuente === "fisico" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground block">
                    Cuentalitros
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Inicial</p>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={venta.lectura_inicial ?? ""}
                        onChange={(e) =>
                          setVenta({
                            ...venta,
                            lectura_inicial: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-11"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Final</p>
                      <Input
                        type="number"
                        inputMode="decimal"
                        value={venta.lectura_final ?? ""}
                        onChange={(e) =>
                          setVenta({
                            ...venta,
                            lectura_final: e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                  <p
                    className={`text-xs ${
                      litrosUsados > litrosDisponibles
                        ? "text-red-600"
                        : litrosUsados === litrosDisponibles
                          ? "text-amber-600"
                          : "text-green-600"
                    }`}
                  >
                    Disponibles: {litrosDisponibles}L · Usados: {litrosUsados}L
                  </p>
                </div>
              )}

              {/* Productos */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Productos
                </label>
                <div className="space-y-2">
                  {productos.map((prod) => {
                    const cant = getCantidad(prod.id);
                    return (
                      <div
                        key={prod.id}
                        className="flex items-center justify-between gap-2 p-3 rounded-lg border border-border bg-background"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{prod.nombre}</p>
                          <p className="text-xs text-muted-foreground">
                            ${prod.precio} / {prod.unidad}
                            {prod.litros_por_unidad ? ` · ${prod.litros_por_unidad}L` : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setCantidad(prod.id, cant - 1)}
                            disabled={cant === 0}
                            className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted disabled:opacity-30"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={cant}
                            onChange={(e) => setCantidad(prod.id, Number(e.target.value || 0))}
                            className="w-12 h-9 text-center rounded-md border border-border text-sm font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setCantidad(prod.id, cant + 1)}
                            className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Método de pago
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(venta.fuente === "fisico"
                    ? (["efectivo", "transferencia", "credito"] as const)
                    : (["efectivo", "transferencia"] as const)
                  ).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setVenta({ ...venta, metodo_pago: m })}
                      className={`h-11 rounded-lg border text-sm font-medium transition-colors capitalize ${
                        venta.metodo_pago === m
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-background border-border hover:border-sky-300"
                      }`}
                    >
                      {m === "credito" ? "Crédito" : m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado de pago */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Estado de pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pagado", "no_pagado"] as const).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setVenta({ ...venta, estado_pago: e })}
                      className={`h-11 rounded-lg border text-sm font-medium transition-colors ${
                        venta.estado_pago === e
                          ? e === "pagado"
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-background border-border hover:border-sky-300"
                      }`}
                    >
                      {e === "pagado" ? "Pagado" : "No Pagado"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Notas
                </label>
                <textarea
                  value={venta.notas || ""}
                  onChange={(e) => setVenta({ ...venta, notas: e.target.value })}
                  rows={3}
                  placeholder="Información adicional..."
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-sky-50 border border-sky-200">
                <span className="text-sm font-medium text-sky-900">Total</span>
                <span className="text-lg font-bold text-sky-700">
                  ${total.toLocaleString("es-MX")}
                </span>
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {formError}
                </p>
              )}

              {/* Zona de peligro */}
              <div className="border-t border-border pt-4">
                {!confirmCancel ? (
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    className="w-full h-11 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Cancelar / borrar esta venta
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                    <div className="flex items-start gap-2 text-sm text-red-700">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>
                        ¿Seguro que quieres cancelar la venta #{venta.numero_venta}? Quedará marcada como cancelada y no aparecerá en el historial ni en los KPIs.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(false)}
                        disabled={isPending}
                        className="flex-1 h-10 rounded-md border border-border bg-white text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
                      >
                        No, regresar
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelar}
                        disabled={isPending}
                        className="flex-1 h-10 rounded-md bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                      >
                        {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                        Sí, cancelar venta
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-border p-4 flex gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleGuardar}
                disabled={isPending}
                className="flex-1 h-11 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
