"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  ListFilter,
  DollarSign,
  CreditCard,
  ArrowRightLeft,
  Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface VentaDisplay {
  id: string;
  numero_venta: number;
  cliente_nombre: string;
  cliente_colonia: string;
  producto_nombre: string;
  cantidad: number;
  unidad: string;
  monto_total: number;
  estado_pago: string;
  metodo_pago: string;
  fuente: string;
  fecha_venta: string;
}

function getHoy() {
  return new Date().toISOString().split("T")[0];
}

function getInicioSemana() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

function getInicioMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function VentasList() {
  const [ventas, setVentas] = useState<VentaDisplay[]>([]);
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "todo">("hoy");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("todos");
  const [filtroFuente, setFiltroFuente] = useState("todos");
  const [loading, setLoading] = useState(true);

  const fetchVentas = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("ventas")
      .select(`
        id,
        numero_venta,
        fuente,
        estado_pago,
        metodo_pago,
        monto_total,
        fecha_venta,
        clientes(nombre, colonia),
        venta_items(cantidad, productos(nombre, unidad))
      `)
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false })
      .limit(100);

    // Period filter
    if (periodo === "hoy") {
      query = query.eq("fecha_venta", getHoy());
    } else if (periodo === "semana") {
      query = query.gte("fecha_venta", getInicioSemana());
    } else if (periodo === "mes") {
      query = query.gte("fecha_venta", getInicioMes());
    }

    // Payment method filter
    if (filtroPago !== "todos") {
      query = query.eq("metodo_pago", filtroPago);
    }

    // Payment status filter
    if (filtroEstadoPago !== "todos") {
      query = query.eq("estado_pago", filtroEstadoPago);
    }

    // Source filter
    if (filtroFuente !== "todos") {
      query = query.eq("fuente", filtroFuente);
    }

    const { data } = await query;

    if (data) {
      const mapped: VentaDisplay[] = data.map((v: Record<string, unknown>) => {
        const cliente = v.clientes as { nombre: string; colonia: string } | null;
        const items = v.venta_items as { cantidad: number; productos: { nombre: string; unidad: string } | null }[];
        const firstItem = items?.[0];
        const totalCant = items?.reduce((s, i) => s + i.cantidad, 0) || 0;
        return {
          id: v.id as string,
          numero_venta: v.numero_venta as number,
          cliente_nombre: cliente?.nombre || (v.fuente === "fisico" ? "Venta Mostrador" : "Sin cliente"),
          cliente_colonia: cliente?.colonia || "",
          producto_nombre: items?.length > 1
            ? `${firstItem?.productos?.nombre || ""} +${items.length - 1}`
            : firstItem?.productos?.nombre || "",
          cantidad: totalCant,
          unidad: firstItem?.productos?.unidad || "pza",
          monto_total: v.monto_total as number,
          estado_pago: v.estado_pago as string,
          metodo_pago: v.metodo_pago as string,
          fuente: v.fuente as string,
          fecha_venta: v.fecha_venta as string,
        };
      });

      // Client-side search filter
      if (search) {
        const q = search.toLowerCase();
        setVentas(
          mapped.filter(
            (v) =>
              v.cliente_nombre.toLowerCase().includes(q) ||
              v.producto_nombre.toLowerCase().includes(q) ||
              v.cliente_colonia.toLowerCase().includes(q) ||
              String(v.numero_venta).includes(q)
          )
        );
      } else {
        setVentas(mapped);
      }
    } else {
      setVentas([]);
    }
    setLoading(false);
  }, [periodo, filtroPago, filtroEstadoPago, filtroFuente, search]);

  useEffect(() => {
    fetchVentas();
  }, [fetchVentas]);

  // Summary
  const totalMonto = ventas.reduce((s, v) => s + v.monto_total, 0);
  const totalEfectivo = ventas.filter((v) => v.metodo_pago === "efectivo").reduce((s, v) => s + v.monto_total, 0);
  const totalTransferencia = ventas.filter((v) => v.metodo_pago === "transferencia").reduce((s, v) => s + v.monto_total, 0);
  const totalCredito = ventas.filter((v) => v.metodo_pago === "credito").reduce((s, v) => s + v.monto_total, 0);
  const totalNoPagado = ventas.filter((v) => v.estado_pago === "no_pagado").reduce((s, v) => s + v.monto_total, 0);

  const hasActiveFilters = filtroPago !== "todos" || filtroEstadoPago !== "todos" || filtroFuente !== "todos";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Ventas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta y filtra todas las ventas registradas
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 md:mb-6">
        <Card className="col-span-2 md:col-span-1 bg-sky-50 border-sky-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold text-sky-600">${totalMonto.toLocaleString("es-MX")}</p>
            <p className="text-xs text-muted-foreground">{ventas.length} ventas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Banknote className="h-3.5 w-3.5 text-green-500" />
              <span className="text-xs text-muted-foreground">Efectivo</span>
            </div>
            <p className="text-lg font-bold">${totalEfectivo.toLocaleString("es-MX")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <ArrowRightLeft className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-xs text-muted-foreground">Transferencia</span>
            </div>
            <p className="text-lg font-bold">${totalTransferencia.toLocaleString("es-MX")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs text-muted-foreground">Credito</span>
            </div>
            <p className="text-lg font-bold">${totalCredito.toLocaleString("es-MX")}</p>
          </CardContent>
        </Card>
        <Card className={totalNoPagado > 0 ? "bg-red-50 border-red-100" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs text-muted-foreground">No Pagado</span>
            </div>
            <p className={`text-lg font-bold ${totalNoPagado > 0 ? "text-red-600" : ""}`}>
              ${totalNoPagado.toLocaleString("es-MX")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="space-y-3 md:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex overflow-x-auto scrollbar-hide snap-x w-full sm:w-auto rounded-lg border border-border">
                {(
                  [
                    { id: "hoy", label: "Hoy" },
                    { id: "semana", label: "Semana" },
                    { id: "mes", label: "Mes" },
                    { id: "todo", label: "Todo" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriodo(p.id)}
                    className={`min-w-fit snap-start px-4 py-2.5 md:py-2 text-sm font-medium transition-colors ${
                      periodo === p.id
                        ? "bg-sky-500 text-white"
                        : "bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por cliente, producto, #venta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 md:h-9"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filtroPago}
                onChange={(e) => setFiltroPago(e.target.value)}
                className="h-11 md:h-8 px-3 md:px-2 rounded-md border border-border bg-background text-sm md:text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Metodo: Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="credito">Credito</option>
              </select>
              <select
                value={filtroEstadoPago}
                onChange={(e) => setFiltroEstadoPago(e.target.value)}
                className="h-11 md:h-8 px-3 md:px-2 rounded-md border border-border bg-background text-sm md:text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Estado: Todos</option>
                <option value="pagado">Pagado</option>
                <option value="no_pagado">No Pagado</option>
              </select>
              <select
                value={filtroFuente}
                onChange={(e) => setFiltroFuente(e.target.value)}
                className="h-11 md:h-8 px-3 md:px-2 rounded-md border border-border bg-background text-sm md:text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Fuente: Todos</option>
                <option value="fisico">Fisico</option>
                <option value="domicilio">Domicilio</option>
              </select>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setFiltroPago("todos");
                    setFiltroEstadoPago("todos");
                    setFiltroFuente("todos");
                  }}
                  className="text-xs text-sky-600 hover:text-sky-700 ml-1"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Cargando ventas...</p>
            </div>
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-auto max-h-[560px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[70px]">#</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Cant.</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Pago</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fuente</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {venta.numero_venta}
                        </TableCell>
                        <TableCell className="text-sm">{venta.fecha_venta}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{venta.cliente_nombre}</p>
                            <p className="text-[11px] text-muted-foreground">{venta.cliente_colonia}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {venta.producto_nombre}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {venta.cantidad} {venta.unidad}
                        </TableCell>
                        <TableCell className="text-right text-sm font-medium">
                          ${venta.monto_total.toLocaleString("es-MX")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {venta.metodo_pago === "efectivo"
                              ? "Efectivo"
                              : venta.metodo_pago === "transferencia"
                                ? "Transfer."
                                : "Credito"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {venta.estado_pago === "pagado" ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[11px]">
                              Pagado
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[11px]">
                              No Pagado
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">
                            {venta.fuente === "domicilio" ? "Domicilio" : "Fisico"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile: card list */}
              <div className="md:hidden space-y-2 max-h-[560px] overflow-auto">
                {ventas.map((venta) => (
                  <div
                    key={venta.id}
                    className="rounded-lg border border-border/50 p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{venta.cliente_nombre}</p>
                        <p className="text-xs text-muted-foreground">{venta.producto_nombre}</p>
                      </div>
                      <p className="text-sm font-bold ml-2 shrink-0">
                        ${venta.monto_total.toLocaleString("es-MX")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">#{venta.numero_venta}</span>
                      <span>&middot;</span>
                      <span>{venta.fecha_venta}</span>
                      <span>&middot;</span>
                      <span>{venta.cantidad} {venta.unidad}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[11px]">
                        {venta.metodo_pago === "efectivo"
                          ? "Efectivo"
                          : venta.metodo_pago === "transferencia"
                            ? "Transfer."
                            : "Credito"}
                      </Badge>
                      {venta.estado_pago === "pagado" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[11px]">
                          Pagado
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[11px]">
                          No Pagado
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[11px]">
                        {venta.fuente === "domicilio" ? "Domicilio" : "Fisico"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {ventas.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">No se encontraron ventas con estos filtros</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
