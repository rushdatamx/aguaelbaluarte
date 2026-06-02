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
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Download,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { EditarVentaSheet } from "@/components/purificadora/editar-venta-sheet";

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
  created_at: string;
  evidencia_url: string | null;
  notas: string | null;
}

// Formatea un timestamp (created_at, UTC) a fecha + hora en zona México.
// Ej: "02 jun, 7:30 p.m."
function formatFechaHora(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    timeZone: "America/Monterrey",
    day: "2-digit",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function NotaButton({ nota, numero }: { nota: string; numero: number }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-8 w-8 flex items-center justify-center rounded-md border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        aria-label="Ver nota"
        title="Ver nota"
      >
        <MessageSquareText className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-background rounded-lg border border-border shadow-xl max-w-sm w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareText className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-semibold">Nota de venta #{numero}</h3>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap break-words">{nota}</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full h-10 rounded-md bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function VerEvidenciaButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);

  const abrir = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("evidencias")
      .createSignedUrl(path, 60 * 10);
    setLoading(false);
    if (error || !data) {
      alert("No se pudo cargar la foto: " + (error?.message || "error desconocido"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={loading}
      className="h-8 w-8 flex items-center justify-center rounded-md border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors disabled:opacity-40"
      aria-label="Ver evidencia"
      title="Ver evidencia"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
    </button>
  );
}

// "Hoy" en hora de México (YYYY-MM-DD), independiente del timezone del navegador.
function getHoy() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Monterrey" });
}

// Fecha base en componentes de hora de México (año, mes, día).
function partesHoyMexico() {
  const s = getHoy(); // "YYYY-MM-DD"
  const [year, month, day] = s.split("-").map(Number);
  return { year, month, day };
}

function getInicioSemana() {
  const { year, month, day } = partesHoyMexico();
  // Usamos UTC para aritmética de fechas sin que el timezone local interfiera.
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1; // lunes como inicio de semana
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split("T")[0];
}

function getInicioMes() {
  const { year, month } = partesHoyMexico();
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

interface VentasListProps {
  isAdmin?: boolean;
}

export function VentasList({ isAdmin = false }: VentasListProps) {
  const [ventas, setVentas] = useState<VentaDisplay[]>([]);
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "todo">("hoy");
  const [filtroPago, setFiltroPago] = useState("todos");
  const [filtroEstadoPago, setFiltroEstadoPago] = useState("todos");
  const [filtroFuente, setFiltroFuente] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [editVentaId, setEditVentaId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const openEdit = (id: string) => {
    setEditVentaId(id);
    setEditOpen(true);
  };

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
        created_at,
        evidencia_url,
        notas,
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
          created_at: v.created_at as string,
          evidencia_url: (v.evidencia_url as string | null) ?? null,
          notas: (v.notas as string | null) ?? null,
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

  const exportarCSV = async () => {
    setExportLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("ventas")
      .select(`
        numero_venta,
        fecha_venta,
        created_at,
        fuente,
        turno,
        estado_pago,
        metodo_pago,
        monto_total,
        notas,
        clientes(nombre, colonia, direccion, telefono),
        venta_items(cantidad, precio_unitario, monto_total, productos(nombre, unidad))
      `)
      .neq("estado", "cancelado")
      .order("numero_venta", { ascending: true })
      .limit(2000);

    if (periodo === "hoy") query = query.eq("fecha_venta", getHoy());
    else if (periodo === "semana") query = query.gte("fecha_venta", getInicioSemana());
    else if (periodo === "mes") query = query.gte("fecha_venta", getInicioMes());

    if (filtroPago !== "todos") query = query.eq("metodo_pago", filtroPago);
    if (filtroEstadoPago !== "todos") query = query.eq("estado_pago", filtroEstadoPago);
    if (filtroFuente !== "todos") query = query.eq("fuente", filtroFuente);

    const { data, error } = await query;
    if (error || !data) {
      alert("No se pudo exportar: " + (error?.message || "sin datos"));
      setExportLoading(false);
      return;
    }

    const escape = (val: unknown): string => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const headers = [
      "# Venta",
      "Fecha",
      "Hora",
      "Fuente",
      "Turno",
      "Cliente",
      "Colonia",
      "Direccion",
      "Telefono",
      "Producto",
      "Cantidad",
      "Unidad",
      "Precio unitario",
      "Subtotal item",
      "Monto total venta",
      "Metodo pago",
      "Estado pago",
      "Notas",
    ];

    const rows: string[] = [headers.map(escape).join(",")];

    // Filtro client-side por search (para consistencia con la vista)
    const q = search.trim().toLowerCase();

    for (const v of data as unknown as Array<{
      numero_venta: number;
      fecha_venta: string;
      created_at: string;
      fuente: string;
      turno: string | null;
      estado_pago: string;
      metodo_pago: string;
      monto_total: number;
      notas: string | null;
      clientes: { nombre: string; colonia: string | null; direccion: string | null; telefono: string | null } | null;
      venta_items: { cantidad: number; precio_unitario: number; monto_total: number; productos: { nombre: string; unidad: string } | null }[];
    }>) {
      const cliente = v.clientes;
      const items = v.venta_items || [];

      const matchesSearch = !q || (
        (cliente?.nombre || "").toLowerCase().includes(q) ||
        (cliente?.colonia || "").toLowerCase().includes(q) ||
        String(v.numero_venta).includes(q) ||
        items.some((it) => (it.productos?.nombre || "").toLowerCase().includes(q))
      );
      if (!matchesSearch) continue;

      for (const it of items) {
        rows.push([
          v.numero_venta,
          v.fecha_venta,
          new Date(v.created_at).toLocaleTimeString("es-MX", {
            timeZone: "America/Monterrey",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          v.fuente === "domicilio" ? "Domicilio" : "Físico",
          v.turno || "",
          cliente?.nombre || "",
          cliente?.colonia || "",
          cliente?.direccion || "",
          cliente?.telefono || "",
          it.productos?.nombre || "",
          it.cantidad,
          it.productos?.unidad || "",
          Number(it.precio_unitario).toFixed(2),
          Number(it.monto_total).toFixed(2),
          Number(v.monto_total).toFixed(2),
          v.metodo_pago === "efectivo" ? "Efectivo" : v.metodo_pago === "transferencia" ? "Transferencia" : "Crédito",
          v.estado_pago === "pagado" ? "Pagado" : "No Pagado",
          v.notas || "",
        ].map(escape).join(","));
      }
    }

    // BOM UTF-8 para que Excel detecte acentos correctamente
    const csv = "﻿" + rows.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fecha = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `ventas-baluarte-${periodo}-${fecha}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportLoading(false);
  };

  // Summary
  const totalMonto = ventas.reduce((s, v) => s + v.monto_total, 0);
  const totalEfectivo = ventas.filter((v) => v.metodo_pago === "efectivo").reduce((s, v) => s + v.monto_total, 0);
  const totalTransferencia = ventas.filter((v) => v.metodo_pago === "transferencia").reduce((s, v) => s + v.monto_total, 0);
  const totalCredito = ventas.filter((v) => v.metodo_pago === "credito").reduce((s, v) => s + v.monto_total, 0);
  const totalNoPagado = ventas.filter((v) => v.estado_pago === "no_pagado").reduce((s, v) => s + v.monto_total, 0);

  const hasActiveFilters = filtroPago !== "todos" || filtroEstadoPago !== "todos" || filtroFuente !== "todos";

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4 md:mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Ventas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Consulta y filtra todas las ventas registradas
          </p>
        </div>
        <button
          onClick={exportarCSV}
          disabled={exportLoading || ventas.length === 0}
          className="h-11 md:h-10 px-4 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exportLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span className="hidden md:inline">Exportar CSV</span>
          <span className="md:hidden">CSV</span>
        </button>
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
                      <TableHead className="w-[80px] text-center">Adj.</TableHead>
                      {isAdmin && <TableHead className="w-[60px] text-center"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {venta.numero_venta}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{formatFechaHora(venta.created_at)}</TableCell>
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
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {venta.evidencia_url && (
                              <VerEvidenciaButton path={venta.evidencia_url} />
                            )}
                            {venta.notas && (
                              <NotaButton nota={venta.notas} numero={venta.numero_venta} />
                            )}
                            {!venta.evidencia_url && !venta.notas && (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-center">
                            <button
                              type="button"
                              onClick={() => openEdit(venta.id)}
                              className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors mx-auto"
                              aria-label="Editar venta"
                              title="Editar venta"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          </TableCell>
                        )}
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
                      <span>{formatFechaHora(venta.created_at)}</span>
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
                      {venta.evidencia_url && (
                        <VerEvidenciaButton path={venta.evidencia_url} />
                      )}
                      {venta.notas && (
                        <NotaButton nota={venta.notas} numero={venta.numero_venta} />
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => openEdit(venta.id)}
                          className="ml-auto h-8 px-2.5 flex items-center gap-1 rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors text-[11px] font-medium"
                          aria-label="Editar venta"
                        >
                          <Pencil className="h-3 w-3" />
                          Editar
                        </button>
                      )}
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

      {isAdmin && (
        <EditarVentaSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          ventaId={editVentaId}
          onSaved={fetchVentas}
        />
      )}
    </div>
  );
}
