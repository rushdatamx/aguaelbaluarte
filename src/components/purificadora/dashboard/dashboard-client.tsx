"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DollarSign,
  TrendingUp,
  Truck,
  Users,
  Loader2,
} from "lucide-react";
import { KpiCard } from "./kpi-card";
import { TendenciaChart } from "./tendencia-chart";
import { VentasPorProducto } from "./ventas-por-producto";
import { ResumenDiaSection } from "./resumen-dia";
import { DateRangePicker } from "./date-range-picker";
import { FiltrosSheet, type DashboardFiltros } from "./filtros-sheet";
import { getInicioMes, getHoy, formatRangoLabel } from "@/lib/fechas";
import type {
  RangoFechas,
  KpisRango,
  DesgloseProductoCanal,
  TendenciaMes,
  SparklinePunto,
  ResumenDia,
} from "@/lib/types";

const money = (n: number) => `$${Number(n).toLocaleString("es-MX")}`;

export function DashboardClient() {
  const supabase = createClient();

  const [rango, setRango] = useState<RangoFechas>({
    desde: getInicioMes(),
    hasta: getHoy(),
  });
  const [filtros, setFiltros] = useState<DashboardFiltros>({
    canal: "todos",
    estadoPago: "todos",
  });

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KpisRango | null>(null);
  const [resumen, setResumen] = useState<ResumenDia | null>(null);
  const [desglose, setDesglose] = useState<DesgloseProductoCanal[]>([]);
  const [tendencia, setTendencia] = useState<TendenciaMes[]>([]);
  const [sparks, setSparks] = useState<SparklinePunto[]>([]);
  const [ingresoMesAnterior, setIngresoMesAnterior] = useState(0);
  const [clientesActivos, setClientesActivos] = useState(0);
  const [totalClientes, setTotalClientes] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [
      kpisRes,
      resumenRes,
      desgloseRes,
      tendenciaRes,
      sparksRes,
      clientesActivosRes,
      totalClientesRes,
    ] = await Promise.all([
      supabase.rpc("fn_kpis_rango", {
        p_desde: rango.desde,
        p_hasta: rango.hasta,
        p_canal: filtros.canal,
        p_estado_pago: filtros.estadoPago,
      }),
      supabase.rpc("fn_resumen_dia", {
        p_desde: rango.desde,
        p_hasta: rango.hasta,
        p_canal: filtros.canal,
        p_estado_pago: filtros.estadoPago,
      }),
      supabase.rpc("fn_desglose_producto_canal", {
        p_desde: rango.desde,
        p_hasta: rango.hasta,
        p_estado_pago: filtros.estadoPago,
      }),
      supabase.from("v_tendencia_12_meses").select("*"),
      supabase.from("v_sparklines_kpi").select("*"),
      supabase.from("clientes").select("id", { count: "exact", head: true }).eq("activo", true),
      supabase.from("clientes").select("id", { count: "exact", head: true }),
    ]);

    const kpisRow = (kpisRes.data?.[0] as KpisRango) || null;
    const resumenRow = (resumenRes.data?.[0] as ResumenDia) || null;

    setKpis(kpisRow);
    setResumen(resumenRow);
    setDesglose((desgloseRes.data as DesgloseProductoCanal[]) || []);

    const tend = (tendenciaRes.data as TendenciaMes[]) || [];
    setTendencia(tend);
    // Mes anterior = penúltimo punto de la tendencia (índice length-2)
    setIngresoMesAnterior(tend.length >= 2 ? Number(tend[tend.length - 2].monto) : 0);

    setSparks((sparksRes.data as SparklinePunto[]) || []);
    setClientesActivos(clientesActivosRes.count || 0);
    setTotalClientes(totalClientesRes.count || 0);

    setLoading(false);
  }, [supabase, rango.desde, rango.hasta, filtros.canal, filtros.estadoPago]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sparkline series
  const sparkIngresos = sparks.map((s) => Number(s.ingresos));
  const sparkEntregas = sparks.map((s) => Number(s.entregas));
  const sparkClientes = sparks.map((s) => Number(s.clientes));
  const sparkMes = tendencia.map((t) => Number(t.monto));

  const ingresos = kpis ? Number(kpis.ingresos) : 0;
  const entregasComp = kpis ? Number(kpis.entregas_completadas) : 0;
  const entregasTotal = kpis ? Number(kpis.entregas_total) : 0;
  const ingresoMesActual = tendencia.length ? Number(tendencia[tendencia.length - 1].monto) : 0;

  const variacionMes =
    ingresoMesAnterior > 0
      ? Math.round(((ingresoMesActual - ingresoMesAnterior) / ingresoMesAnterior) * 100)
      : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header con controles */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {formatRangoLabel(rango.desde, rango.hasta)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker value={rango} onChange={setRango} />
          <FiltrosSheet filtros={filtros} onChange={setFiltros} />
        </div>
      </div>

      {loading && !kpis ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <KpiCard
              titulo="Ingresos del periodo"
              valor={money(ingresos)}
              icono={<DollarSign className="h-4 w-4 text-sky-600" />}
              subtexto={`${kpis?.num_ventas || 0} ventas`}
              sparklineData={sparkIngresos}
            />
            <KpiCard
              titulo="Ingresos del Mes"
              valor={money(ingresoMesActual)}
              icono={<TrendingUp className="h-4 w-4 text-sky-600" />}
              delta={variacionMes}
              sparklineData={sparkMes}
            />
            <KpiCard
              titulo="Entregas"
              valor={`${entregasComp} / ${entregasTotal}`}
              icono={<Truck className="h-4 w-4 text-sky-600" />}
              subtexto={`${entregasTotal - entregasComp} pendientes`}
              sparklineData={sparkEntregas}
              sparklineColor="#f97316"
            />
            <KpiCard
              titulo="Clientes Activos"
              valor={String(clientesActivos)}
              icono={<Users className="h-4 w-4 text-sky-600" />}
              subtexto={`de ${totalClientes} registrados`}
              sparklineData={sparkClientes}
              sparklineColor="#8b5cf6"
            />
          </div>

          {/* Ventas por producto */}
          <VentasPorProducto data={desglose} />

          {/* Tendencia 12 meses */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3">
              Tendencia de ingresos (12 meses)
            </h2>
            <div className="rounded-xl border border-border bg-card p-3 md:p-4">
              <TendenciaChart data={tendencia} />
            </div>
          </div>

          {/* Resumen del periodo */}
          {resumen && (
            <ResumenDiaSection
              resumen={resumen}
              clientesActivos={clientesActivos}
              totalClientes={totalClientes}
            />
          )}
        </>
      )}
    </div>
  );
}
