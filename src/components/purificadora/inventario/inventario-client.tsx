"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  Boxes,
  Package,
  Droplet,
  Plus,
  SlidersHorizontal,
  Loader2,
  TrendingUp,
  Settings2,
  ShoppingCart,
  ArrowDownUp,
} from "lucide-react";
import { registrarCompra, registrarAjuste } from "@/lib/actions/inventario";
import { ConfigProductos } from "@/components/purificadora/inventario/config-productos";
import { useRouter } from "next/navigation";
import { getHoy, ymdToDate } from "@/lib/fechas";
import type {
  InventarioRow,
  InventarioMovimiento,
  Producto,
  TipoInventario,
  ClaseMovimiento,
} from "@/lib/types";

interface InventarioClientProps {
  inventario: InventarioRow[];
  movimientos: InventarioMovimiento[];
  productos: Producto[];
}

const TIPO_LABEL: Record<TipoInventario, string> = {
  garrafon: "Garrafones",
  litro: "Botellas de litro",
};

const fmt = (n: number) =>
  n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const money = (n: number) =>
  "$" + n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fmtFecha(ymd: string): string {
  return ymdToDate(ymd).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type Tab = "resumen" | "movimientos" | "config";

export function InventarioClient({
  inventario,
  movimientos,
  productos,
}: InventarioClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("resumen");
  const [isPending, startTransition] = useTransition();

  // Sheet de registro (compra / ajuste)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modo, setModo] = useState<"compra" | "ajuste">("compra");
  const [formError, setFormError] = useState("");
  const [tipo, setTipo] = useState<TipoInventario>("garrafon");
  const [cantidad, setCantidad] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [fecha, setFecha] = useState(getHoy());
  const [motivo, setMotivo] = useState("");

  // Filtros de movimientos
  const [filtroTipo, setFiltroTipo] = useState<"todos" | TipoInventario>("todos");
  const [filtroClase, setFiltroClase] = useState<"todos" | ClaseMovimiento>("todos");

  const inventarioCostoTotal = useMemo(
    () => inventario.reduce((s, i) => s + i.stock_actual * i.ultimo_costo, 0),
    [inventario]
  );

  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(
      (m) =>
        (filtroTipo === "todos" || m.tipo === filtroTipo) &&
        (filtroClase === "todos" || m.clase === filtroClase)
    );
  }, [movimientos, filtroTipo, filtroClase]);

  const resetForm = () => {
    setCantidad("");
    setCostoUnitario("");
    setMotivo("");
    setFecha(getHoy());
    setFormError("");
  };

  const openRegistro = (m: "compra" | "ajuste", t?: TipoInventario) => {
    setModo(m);
    if (t) setTipo(t);
    resetForm();
    setSheetOpen(true);
  };

  const cantidadNum = parseFloat(cantidad) || 0;
  const costoNum = parseFloat(costoUnitario) || 0;
  const costoTotalPreview = cantidadNum * costoNum;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (modo === "compra") {
      if (!(cantidadNum > 0)) {
        setFormError("La cantidad debe ser mayor a 0");
        return;
      }
      if (!(costoNum >= 0) || costoUnitario.trim() === "") {
        setFormError("Ingresa el costo unitario");
        return;
      }
    } else {
      if (cantidadNum === 0 || cantidad.trim() === "") {
        setFormError("El ajuste no puede ser 0 (usa - para restar)");
        return;
      }
    }

    startTransition(async () => {
      const result =
        modo === "compra"
          ? await registrarCompra({
              tipo,
              cantidad: cantidadNum,
              costo_unitario: costoNum,
              fecha: fecha || null,
            })
          : await registrarAjuste({
              tipo,
              cantidad: cantidadNum,
              motivo: motivo.trim() || undefined,
            });

      if (result.error) {
        setFormError(result.error);
        return;
      }

      resetForm();
      setSheetOpen(false);
      router.refresh();
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 md:mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground flex items-center gap-2">
            <Boxes className="h-6 w-6 text-sky-500" />
            Inventario
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Stock actual, costo y movimientos
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => openRegistro("ajuste")}
            className="h-11 md:h-10 px-3 md:px-4 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden md:inline">Ajuste</span>
          </button>
          <button
            onClick={() => openRegistro("compra")}
            className="h-11 md:h-10 px-3 md:px-4 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Registrar compra</span>
            <span className="md:hidden">Compra</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide rounded-lg border border-border mb-4 md:mb-6 w-full sm:w-fit">
        {(
          [
            { id: "resumen", label: "Resumen", icon: TrendingUp },
            { id: "movimientos", label: "Movimientos", icon: ArrowDownUp },
            { id: "config", label: "Configuración", icon: Settings2 },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`min-w-fit px-4 py-2.5 md:py-2 text-sm font-medium transition-colors flex items-center gap-1.5 ${
              tab === t.id
                ? "bg-sky-500 text-white"
                : "bg-background text-muted-foreground hover:bg-muted/50"
            }`}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Resumen ── */}
      {tab === "resumen" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {inventario.map((inv) => {
              const enRojo = inv.stock_actual < 0 || inv.stock_actual < inv.cantidad_minima;
              const costo = inv.stock_actual * inv.ultimo_costo;
              const Icon = inv.tipo === "garrafon" ? Package : Droplet;
              return (
                <Card
                  key={inv.tipo}
                  className={enRojo ? "bg-red-50 border-red-200" : ""}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                          inv.tipo === "garrafon"
                            ? "bg-sky-100 text-sky-600"
                            : "bg-cyan-100 text-cyan-600"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{TIPO_LABEL[inv.tipo]}</p>
                        <p className="text-[11px] text-muted-foreground">
                          Último costo {money(inv.ultimo_costo)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Stock actual</p>
                        <p
                          className={`text-3xl font-bold ${
                            enRojo ? "text-red-600" : "text-foreground"
                          }`}
                        >
                          {fmt(inv.stock_actual)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-muted-foreground">Inv. a costo</p>
                        <p className="text-lg font-bold text-sky-600">{money(costo)}</p>
                      </div>
                    </div>
                    {enRojo && (
                      <p className="text-[11px] text-red-600 mt-2 font-medium">
                        {inv.stock_actual < 0
                          ? "Stock negativo — reabastecer"
                          : "Por debajo del mínimo"}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => openRegistro("compra", inv.tipo)}
                        className="flex-1 h-9 text-xs font-medium rounded-md bg-sky-500 text-white hover:bg-sky-600 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="h-3 w-3" /> Compra
                      </button>
                      <button
                        onClick={() => openRegistro("ajuste", inv.tipo)}
                        className="flex-1 h-9 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted transition-colors flex items-center justify-center gap-1"
                      >
                        <SlidersHorizontal className="h-3 w-3" /> Ajuste
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Total a costo */}
            <Card className="bg-sky-50 border-sky-100 md:col-span-1">
              <CardContent className="p-5 flex flex-col justify-center h-full">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-sky-500" />
                  <span className="text-sm text-muted-foreground">
                    Inventario a costo (total)
                  </span>
                </div>
                <p className="text-3xl font-bold text-sky-600">
                  {money(inventarioCostoTotal)}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Suma de stock × último costo
                </p>
              </CardContent>
            </Card>
          </div>

          {inventario.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-12">
              No hay inventario configurado.
            </p>
          )}
        </div>
      )}

      {/* ── Movimientos ── */}
      {tab === "movimientos" && (
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <select
                value={filtroTipo}
                onChange={(e) =>
                  setFiltroTipo(e.target.value as "todos" | TipoInventario)
                }
                className="h-10 md:h-9 px-3 rounded-md border border-border bg-background text-sm"
              >
                <option value="todos">Tipo: Todos</option>
                <option value="garrafon">Garrafones</option>
                <option value="litro">Botellas de litro</option>
              </select>
              <select
                value={filtroClase}
                onChange={(e) =>
                  setFiltroClase(e.target.value as "todos" | ClaseMovimiento)
                }
                className="h-10 md:h-9 px-3 rounded-md border border-border bg-background text-sm"
              >
                <option value="todos">Movimiento: Todos</option>
                <option value="compra">Compras</option>
                <option value="venta">Ventas</option>
                <option value="ajuste">Ajustes</option>
              </select>
              <span className="text-xs text-muted-foreground ml-auto">
                {movimientosFiltrados.length} movimientos
              </span>
            </div>

            {/* Desktop */}
            <div className="hidden md:block overflow-auto max-h-[560px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Movimiento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Cantidad</TableHead>
                    <TableHead className="text-right">Costo unit.</TableHead>
                    <TableHead className="text-right">Costo total</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientosFiltrados.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {fmtFecha(m.fecha)}
                      </TableCell>
                      <TableCell>
                        <MovimientoBadge clase={m.clase} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {TIPO_LABEL[m.tipo]}
                      </TableCell>
                      <TableCell
                        className={`text-right text-sm font-medium ${
                          m.cantidad < 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {m.cantidad > 0 ? "+" : ""}
                        {fmt(m.cantidad)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.costo_unitario != null ? money(m.costo_unitario) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {m.costo_total != null ? money(m.costo_total) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.motivo || (m.clase === "venta" ? "Venta" : "—")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-2 max-h-[560px] overflow-auto">
              {movimientosFiltrados.map((m) => (
                <div key={m.id} className="rounded-lg border border-border/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <MovimientoBadge clase={m.clase} />
                    <span
                      className={`text-sm font-bold ${
                        m.cantidad < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {m.cantidad > 0 ? "+" : ""}
                      {fmt(m.cantidad)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {TIPO_LABEL[m.tipo]} &middot; {fmtFecha(m.fecha)}
                    </span>
                    {m.costo_total != null && <span>{money(m.costo_total)}</span>}
                  </div>
                  {(m.motivo || m.clase === "venta") && (
                    <p className="text-xs text-muted-foreground">
                      {m.motivo || "Venta"}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {movimientosFiltrados.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-12">
                No hay movimientos con estos filtros.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Configuración ── */}
      {tab === "config" && <ConfigProductos productos={productos} />}

      {/* Sheet: Registrar compra / ajuste */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-base">
              {modo === "compra" ? (
                <ShoppingCart className="h-4 w-4 text-sky-500" />
              ) : (
                <SlidersHorizontal className="h-4 w-4 text-sky-500" />
              )}
              {modo === "compra" ? "Registrar compra" : "Ajuste de inventario"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {modo === "compra"
                ? "Entrada de inventario con su costo. Suma stock y actualiza el último costo."
                : "Corrección manual del stock (merma, recuento). Usa números negativos para restar."}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
            {/* Tipo */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">Tipo de inventario</label>
              <div className="grid grid-cols-2 gap-2">
                {(["garrafon", "litro"] as TipoInventario[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={`h-11 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      tipo === t
                        ? "border-sky-500 bg-sky-50 text-sky-700"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                  >
                    {t === "garrafon" ? (
                      <Package className="h-4 w-4" />
                    ) : (
                      <Droplet className="h-4 w-4" />
                    )}
                    {TIPO_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Cantidad */}
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Cantidad {modo === "ajuste" && <span className="text-muted-foreground font-normal">(usa - para restar)</span>}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder={modo === "compra" ? "Ej. 50" : "Ej. -3"}
                className="h-11"
              />
            </div>

            {/* Compra: costo + fecha */}
            {modo === "compra" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Costo unitario
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      $
                    </span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      placeholder="Ej. 35.00"
                      className="h-11 pl-7"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Fecha de compra</label>
                  <Input
                    type="date"
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="rounded-lg bg-muted/50 border border-border p-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Costo total</span>
                  <span className="text-lg font-bold text-sky-600">
                    {money(costoTotalPreview)}
                  </span>
                </div>
              </>
            )}

            {/* Ajuste: motivo */}
            {modo === "ajuste" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">Motivo</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. Merma, recuento físico, garrafón roto..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </div>
            )}

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {formError}
              </p>
            )}
          </form>

          <div className="border-t border-border p-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setSheetOpen(false);
              }}
              disabled={isPending}
              className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="flex-1 h-11 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending
                ? "Guardando..."
                : modo === "compra"
                  ? "Registrar compra"
                  : "Guardar ajuste"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function MovimientoBadge({ clase }: { clase: ClaseMovimiento }) {
  if (clase === "compra") {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[11px]">
        Compra
      </Badge>
    );
  }
  if (clase === "venta") {
    return (
      <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-100 text-[11px]">
        Venta
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[11px]">
      Ajuste
    </Badge>
  );
}
