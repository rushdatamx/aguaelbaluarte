"use client";

import { useState, useEffect, useCallback, useMemo, useTransition } from "react";
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
  Receipt,
  CheckCircle2,
  Search,
  ListFilter,
  DollarSign,
  Banknote,
  ArrowRightLeft,
  Image as ImageIcon,
  Loader2,
  MessageSquareText,
  Pencil,
  X,
} from "lucide-react";
import { EvidenciaUpload } from "@/components/purificadora/evidencia-upload";
import {
  registrarGasto,
  actualizarGasto,
  cancelarGasto,
} from "@/lib/actions/gastos";
import { createClient } from "@/lib/supabase/client";
import { getHoy, getInicioSemana, getInicioMes } from "@/lib/fechas";
import type { GastoRow } from "@/lib/types";

interface GastosClientProps {
  isAdmin: boolean;
}

// Formatea created_at (UTC) a fecha + hora en zona México.
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
              <h3 className="text-sm font-semibold">Nota del gasto #{numero}</h3>
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

export function GastosClient({ isAdmin }: GastosClientProps) {
  // ── Formulario (todos) ──
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [fecha, setFecha] = useState(getHoy());
  const [evidencia, setEvidencia] = useState<string | null>(null);
  const [notas, setNotas] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Edición (admin)
  const [editId, setEditId] = useState<string | null>(null);

  const montoNum = parseFloat(monto) || 0;
  const puedeRegistrar = concepto.trim() !== "" && montoNum > 0;

  const resetForm = () => {
    setConcepto("");
    setMonto("");
    setMetodoPago("efectivo");
    setFecha(getHoy());
    setEvidencia(null);
    setNotas("");
    setEditId(null);
  };

  const handleRegistrar = () => {
    startTransition(async () => {
      const payload = {
        concepto: concepto.trim(),
        monto: montoNum,
        metodo_pago: metodoPago as "efectivo" | "transferencia",
        evidencia_url: evidencia,
        notas: notas.trim() || null,
        fecha: fecha || null,
      };

      const result = editId
        ? await actualizarGasto({ id: editId, ...payload })
        : await registrarGasto(payload);

      if (result.error) {
        alert("Error: " + result.error);
        return;
      }

      if (editId) {
        resetForm();
        fetchGastos();
      } else {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          fetchGastos();
        }, 2000);
      }
    });
  };

  // ── Historial (admin) ──
  const [gastos, setGastos] = useState<GastoRow[]>([]);
  const [loading, setLoading] = useState(isAdmin);
  const [search, setSearch] = useState("");
  const [periodo, setPeriodo] = useState<"hoy" | "semana" | "mes" | "todo">("mes");
  const [filtroPago, setFiltroPago] = useState("todos");

  const fetchGastos = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("gastos")
      .select(
        "id, numero_gasto, concepto, monto, metodo_pago, evidencia_url, notas, estado, fecha, created_at"
      )
      .neq("estado", "cancelado")
      .order("created_at", { ascending: false })
      .limit(100);

    if (periodo === "hoy") query = query.eq("fecha", getHoy());
    else if (periodo === "semana") query = query.gte("fecha", getInicioSemana());
    else if (periodo === "mes") query = query.gte("fecha", getInicioMes());

    if (filtroPago !== "todos") query = query.eq("metodo_pago", filtroPago);

    const { data } = await query;
    setGastos((data as GastoRow[]) || []);
    setLoading(false);
  }, [isAdmin, periodo, filtroPago]);

  useEffect(() => {
    fetchGastos();
  }, [fetchGastos]);

  const filtrados = useMemo(() => {
    if (!search) return gastos;
    const q = search.toLowerCase();
    return gastos.filter(
      (g) =>
        g.concepto.toLowerCase().includes(q) ||
        String(g.numero_gasto).includes(q)
    );
  }, [search, gastos]);

  const totalMonto = filtrados.reduce((s, g) => s + g.monto, 0);
  const totalEfectivo = filtrados
    .filter((g) => g.metodo_pago === "efectivo")
    .reduce((s, g) => s + g.monto, 0);
  const totalTransferencia = filtrados
    .filter((g) => g.metodo_pago === "transferencia")
    .reduce((s, g) => s + g.monto, 0);

  const openEdit = (g: GastoRow) => {
    setEditId(g.id);
    setConcepto(g.concepto);
    setMonto(String(g.monto));
    setMetodoPago(g.metodo_pago);
    setFecha(g.fecha);
    setEvidencia(g.evidencia_url);
    setNotas(g.notas || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelar = (g: GastoRow) => {
    if (!confirm(`¿Cancelar el gasto #${g.numero_gasto} (${g.concepto})?`)) return;
    startTransition(async () => {
      const result = await cancelarGasto(g.id);
      if (result.error) {
        alert("Error: " + result.error);
        return;
      }
      fetchGastos();
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Gastos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de gastos del negocio
        </p>
      </div>

      {/* ── Formulario ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Receipt className="h-4 w-4 text-sky-500" />
            {editId ? "Editar Gasto" : "Nuevo Gasto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-700">Gasto registrado</p>
            </div>
          ) : (
            <>
              {/* Concepto */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Concepto
                </label>
                <Input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej. Gasolina, garrafones, mantenimiento..."
                  maxLength={200}
                  className="h-11"
                />
              </div>

              {/* Monto */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    $
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="h-11 pl-7"
                  />
                </div>
              </div>

              {/* Método de pago */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Método de Pago
                </label>
                <div className="flex gap-2">
                  {[
                    { id: "efectivo", label: "Efectivo" },
                    { id: "transferencia", label: "Transferencia" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodoPago(m.id)}
                      className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors border ${
                        metodoPago === m.id
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-background text-muted-foreground border-border hover:border-sky-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fecha */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Evidencia */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Evidencia <span className="text-xs text-muted-foreground font-normal">(factura/ticket)</span>
                </label>
                <EvidenciaUpload value={evidencia} onChange={setEvidencia} />
              </div>

              {/* Notas */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Notas <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Ej. Proveedor, detalle del gasto..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-2">
                {editId && (
                  <button
                    onClick={resetForm}
                    disabled={isPending}
                    className="px-4 py-3 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={handleRegistrar}
                  disabled={!puedeRegistrar || isPending}
                  className="flex-1 py-3 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending
                    ? "Guardando..."
                    : editId
                      ? "Guardar Cambios"
                      : "Registrar Gasto"}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Historial (solo admin) ── */}
      {isAdmin && (
        <div className="mt-6 md:mt-8 -mx-4 md:mx-0 px-4 md:px-0 max-w-none md:max-w-none">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Card className="bg-sky-50 border-sky-100">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-3.5 w-3.5 text-sky-500" />
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
                <p className="text-lg font-bold text-sky-600">
                  ${totalMonto.toLocaleString("es-MX")}
                </p>
                <p className="text-[11px] text-muted-foreground">{filtrados.length} gastos</p>
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
                  <span className="text-xs text-muted-foreground">Transfer.</span>
                </div>
                <p className="text-lg font-bold">${totalTransferencia.toLocaleString("es-MX")}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="space-y-3">
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
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por concepto, #gasto..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-11 md:h-9"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ListFilter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={filtroPago}
                    onChange={(e) => setFiltroPago(e.target.value)}
                    className="h-11 md:h-8 px-3 md:px-2 rounded-md border border-border bg-background text-sm md:text-xs focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  >
                    <option value="todos">Método: Todos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-12">
                  <p className="text-sm text-muted-foreground">Cargando gastos...</p>
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden md:block overflow-auto max-h-[480px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[70px]">#</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Concepto</TableHead>
                          <TableHead className="text-right">Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead className="w-[80px] text-center">Adj.</TableHead>
                          <TableHead className="w-[90px] text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtrados.map((g) => (
                          <TableRow key={g.id}>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {g.numero_gasto}
                            </TableCell>
                            <TableCell className="text-sm whitespace-nowrap">
                              {formatFechaHora(g.created_at)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">{g.concepto}</TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              ${g.monto.toLocaleString("es-MX")}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px]">
                                {g.metodo_pago === "efectivo" ? "Efectivo" : "Transfer."}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {g.evidencia_url && <VerEvidenciaButton path={g.evidencia_url} />}
                                {g.notas && <NotaButton nota={g.notas} numero={g.numero_gasto} />}
                                {!g.evidencia_url && !g.notas && (
                                  <span className="text-xs text-muted-foreground/40">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(g)}
                                  className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors"
                                  aria-label="Editar gasto"
                                  title="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCancelar(g)}
                                  className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                                  aria-label="Cancelar gasto"
                                  title="Cancelar"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile */}
                  <div className="md:hidden space-y-2 max-h-[480px] overflow-auto">
                    {filtrados.map((g) => (
                      <div key={g.id} className="rounded-lg border border-border/50 p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{g.concepto}</p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-mono">#{g.numero_gasto}</span> &middot;{" "}
                              {formatFechaHora(g.created_at)}
                            </p>
                          </div>
                          <p className="text-sm font-bold ml-2 shrink-0">
                            ${g.monto.toLocaleString("es-MX")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Badge variant="outline" className="text-[11px]">
                            {g.metodo_pago === "efectivo" ? "Efectivo" : "Transfer."}
                          </Badge>
                          {g.evidencia_url && <VerEvidenciaButton path={g.evidencia_url} />}
                          {g.notas && <NotaButton nota={g.notas} numero={g.numero_gasto} />}
                          <button
                            type="button"
                            onClick={() => openEdit(g)}
                            className="ml-auto h-8 px-2.5 flex items-center gap-1 rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors text-[11px] font-medium"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelar(g)}
                            className="h-8 px-2.5 flex items-center gap-1 rounded-md border border-border bg-background text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-[11px] font-medium"
                          >
                            <X className="h-3 w-3" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filtrados.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        No se encontraron gastos con estos filtros
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
