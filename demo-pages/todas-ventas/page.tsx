"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import data from "../../../../../public/data/purificadora.json";

type Venta = {
  id: string;
  numero_venta: number;
  cliente_nombre: string;
  cliente_colonia: string;
  producto_id: string;
  producto_nombre: string;
  cantidad: number;
  unidad: string;
  monto_total: number;
  estado: string;
  estado_pago: string;
  metodo_pago: string;
  fuente: string;
  fecha_ruta: string;
  created_at: string;
};

const HOY = data.empresa.fecha_actualizacion.split(" ")[0];

function getInicioSemana(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

const INICIO_SEMANA = getInicioSemana(HOY);
const INICIO_MES = HOY.slice(0, 8) + "01";

export default function TodasVentasPage() {
  const todas: Venta[] = data.todas_ventas as Venta[];

  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "todo">("hoy");
  const [filtroPago, setFiltroPago] = useState<string>("todos");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState<string>("todos");
  const [filtroFuente, setFiltroFuente] = useState<string>("todos");

  const filtered = useMemo(() => {
    let result = todas;

    // Filtro por periodo
    if (periodo === "hoy") {
      result = result.filter((v) => v.fecha_ruta === HOY);
    } else if (periodo === "semana") {
      result = result.filter((v) => v.fecha_ruta >= INICIO_SEMANA);
    } else if (periodo === "mes") {
      result = result.filter((v) => v.fecha_ruta >= INICIO_MES);
    }

    // Filtro por método de pago
    if (filtroPago !== "todos") {
      result = result.filter((v) => v.metodo_pago === filtroPago);
    }

    // Filtro por estado de pago
    if (filtroEstadoPago !== "todos") {
      result = result.filter((v) => v.estado_pago === filtroEstadoPago);
    }

    // Filtro por fuente
    if (filtroFuente !== "todos") {
      result = result.filter((v) => v.fuente === filtroFuente);
    }

    // Búsqueda
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (v) =>
          v.cliente_nombre.toLowerCase().includes(q) ||
          v.producto_nombre.toLowerCase().includes(q) ||
          v.cliente_colonia.toLowerCase().includes(q) ||
          String(v.numero_venta).includes(q)
      );
    }

    return result;
  }, [todas, periodo, filtroPago, filtroEstadoPago, filtroFuente, search]);

  // Resumen
  const totalMonto = filtered.reduce((s, v) => s + v.monto_total, 0);
  const totalEfectivo = filtered.filter((v) => v.metodo_pago === "efectivo").reduce((s, v) => s + v.monto_total, 0);
  const totalTransferencia = filtered.filter((v) => v.metodo_pago === "transferencia").reduce((s, v) => s + v.monto_total, 0);
  const totalCredito = filtered.filter((v) => v.metodo_pago === "credito").reduce((s, v) => s + v.monto_total, 0);
  const totalNoPagado = filtered.filter((v) => v.estado_pago === "no_pagado").reduce((s, v) => s + v.monto_total, 0);

  const hasActiveFilters = filtroPago !== "todos" || filtroEstadoPago !== "todos" || filtroFuente !== "todos";

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Ventas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta y filtra todas las ventas registradas
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card className="bg-sky-50 border-sky-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-sky-500" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-xl font-bold text-sky-600">${totalMonto.toLocaleString("es-MX")}</p>
            <p className="text-xs text-muted-foreground">{filtered.length} ventas</p>
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
          <div className="space-y-4">
            {/* Periodo tabs + search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex rounded-lg border border-border overflow-hidden">
                {(
                  [
                    { id: "hoy", label: "Hoy" },
                    { id: "semana", label: "Esta Semana" },
                    { id: "mes", label: "Este Mes" },
                    { id: "todo", label: "Todo" },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPeriodo(p.id)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
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
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              <ListFilter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filtroPago}
                onChange={(e) => setFiltroPago(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Metodo: Todos</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="credito">Credito</option>
              </select>
              <select
                value={filtroEstadoPago}
                onChange={(e) => setFiltroEstadoPago(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Estado Pago: Todos</option>
                <option value="pagado">Pagado</option>
                <option value="no_pagado">No Pagado</option>
              </select>
              <select
                value={filtroFuente}
                onChange={(e) => setFiltroFuente(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              >
                <option value="todos">Fuente: Todos</option>
                <option value="admin">Admin</option>
                <option value="tiburcio">WhatsApp</option>
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
          <div className="overflow-auto max-h-[560px]">
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
                {filtered.slice(0, 100).map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {venta.numero_venta}
                    </TableCell>
                    <TableCell className="text-sm">{venta.fecha_ruta}</TableCell>
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
                      <Badge variant="outline" className="text-[10px]">
                        {venta.metodo_pago === "efectivo"
                          ? "Efectivo"
                          : venta.metodo_pago === "transferencia"
                            ? "Transfer."
                            : "Credito"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {venta.estado_pago === "pagado" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-[10px]">
                          Pagado
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">
                          No Pagado
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px]">
                        {venta.fuente === "tiburcio" ? "WhatsApp" : "Admin"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 100 && (
            <p className="text-xs text-muted-foreground text-center mt-4">
              Mostrando 100 de {filtered.length} resultados. Usa los filtros para refinar.
            </p>
          )}
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No se encontraron ventas con estos filtros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
