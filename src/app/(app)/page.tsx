import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  Droplets,
  Truck,
  Clock,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  CircleDot,
  Cylinder,
} from "lucide-react";
import { IngresosChart } from "@/components/purificadora/ingresos-chart";
import type {
  DashboardKpis,
  DesgloseProducto,
  Ingreso7Dias,
  UserProfile,
} from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check role — vendedores can't access dashboard
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "vendedor") {
      redirect("/ventas-domicilio");
    }
  }

  // Fetch KPIs
  const { data: kpisData } = await supabase
    .from("v_dashboard_kpis")
    .select("*")
    .single();

  const kpis: DashboardKpis = kpisData || {
    ingresos_hoy: 0,
    ingresos_semana: 0,
    ingresos_mes: 0,
    ingresos_mes_anterior: 0,
    entregas_hoy: 0,
    pendientes_hoy: 0,
    total_ventas_hoy: 0,
  };

  // Variación mes
  const variacionMes =
    kpis.ingresos_mes_anterior > 0
      ? Math.round(
          ((kpis.ingresos_mes - kpis.ingresos_mes_anterior) /
            kpis.ingresos_mes_anterior) *
            100
        )
      : 0;

  // Fetch ingresos 7 días
  const { data: ingresos7Dias } = await supabase
    .from("v_ingresos_7_dias")
    .select("*");

  const ingresosChart: Ingreso7Dias[] = (ingresos7Dias || []).map(
    (d: Record<string, unknown>) => ({
      fecha: d.fecha as string,
      dia: d.dia as string,
      monto: Number(d.monto) || 0,
    })
  );

  // Fetch desglose hoy
  const { data: desgloseData } = await supabase
    .from("v_desglose_hoy")
    .select("*");

  const desglose: DesgloseProducto[] = (desgloseData || []).map(
    (d: Record<string, unknown>) => ({
      producto_id: d.producto_id as string,
      nombre: d.nombre as string,
      unidad: d.unidad as string,
      cantidad: Number(d.cantidad) || 0,
      monto: Number(d.monto) || 0,
      num_ventas: Number(d.num_ventas) || 0,
    })
  );

  // Clientes activos
  const { count: clientesActivos } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true })
    .eq("activo", true);

  const { count: totalClientes } = await supabase
    .from("clientes")
    .select("id", { count: "exact", head: true });

  // Últimas 5 ventas
  const { data: ultimasVentas } = await supabase
    .from("ventas")
    .select(`
      id,
      numero_venta,
      fuente,
      estado,
      monto_total,
      clientes(nombre),
      venta_items(cantidad, productos(nombre, unidad))
    `)
    .neq("estado", "cancelado")
    .order("created_at", { ascending: false })
    .limit(5);

  // Entregas pendientes hoy (simplified "ruta activa")
  const today = new Date().toISOString().split("T")[0];
  const { count: pendientesHoy } = await supabase
    .from("ventas")
    .select("id", { count: "exact", head: true })
    .eq("fuente", "domicilio")
    .eq("fecha_venta", today)
    .in("estado", ["pendiente", "en_camino"]);

  const { count: entregasHoy } = await supabase
    .from("ventas")
    .select("id", { count: "exact", head: true })
    .eq("fuente", "domicilio")
    .eq("fecha_venta", today)
    .eq("estado", "entregado");

  const totalEntregas = (entregasHoy || 0) + (pendientesHoy || 0);
  const progreso = totalEntregas > 0 ? Math.round(((entregasHoy || 0) / totalEntregas) * 100) : 0;

  const iconMap: Record<string, React.ReactNode> = {
    "dom-llenado-20l": <Droplets className="h-4 w-4 text-sky-500" />,
    "dom-garrafon-20l": <Droplets className="h-4 w-4 text-sky-500" />,
    "dom-botella-1l": <Cylinder className="h-4 w-4 text-emerald-500" />,
    "dom-botella-500ml": <Cylinder className="h-4 w-4 text-violet-500" />,
    "fis-llenado-20l": <Droplets className="h-4 w-4 text-sky-500" />,
    "fis-llenado-4-10l": <Droplets className="h-4 w-4 text-amber-500" />,
    "fis-garrafon-20l": <Droplets className="h-4 w-4 text-sky-500" />,
    "fis-botella-1l": <Cylinder className="h-4 w-4 text-emerald-500" />,
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Purificadora El Baluarte
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">${Number(kpis.ingresos_hoy).toLocaleString("es-MX")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semana: ${Number(kpis.ingresos_semana).toLocaleString("es-MX")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">${Number(kpis.ingresos_mes).toLocaleString("es-MX")}</div>
            <div className="flex items-center gap-1 mt-1">
              {variacionMes >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${variacionMes >= 0 ? "text-green-600" : "text-red-600"}`}>
                {variacionMes >= 0 ? "+" : ""}{variacionMes}%
              </span>
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregas Hoy</CardTitle>
            <Truck className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-bold text-green-600">{entregasHoy || 0}</span>
              <span className="text-sm text-muted-foreground">/ {totalEntregas}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">{pendientesHoy || 0} pendientes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <Droplets className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{clientesActivos || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {totalClientes || 0} registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por producto */}
      {desglose.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 md:mb-8">
          {desglose.map((p) => (
            <Card key={p.producto_id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {iconMap[p.producto_id] || <Droplets className="h-4 w-4 text-sky-500" />}
                  <span className="text-xs font-medium text-muted-foreground">{p.nombre}</span>
                </div>
                <div className="text-xl font-bold">
                  {p.cantidad} <span className="text-xs font-normal text-muted-foreground">{p.unidad}</span>
                </div>
                <p className="text-xs text-muted-foreground">${Number(p.monto).toLocaleString("es-MX")} &middot; {p.num_ventas} ventas</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Grafica de ingresos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Ingresos Ultimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <IngresosChart data={ingresosChart} />
          </CardContent>
        </Card>

        {/* Entregas del día (simplified ruta activa) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Entregas del Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {totalEntregas > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Domicilio</span>
                  <Badge variant={pendientesHoy && pendientesHoy > 0 ? "default" : "secondary"}>
                    {pendientesHoy && pendientesHoy > 0 ? "En progreso" : "Completada"}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{entregasHoy || 0} de {totalEntregas} entregas</span>
                    <span>{progreso}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay entregas programadas hoy</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ultimas ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Ultimas Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(ultimasVentas || []).map((venta: Record<string, unknown>) => {
              const cliente = venta.clientes as { nombre: string } | null;
              const items = venta.venta_items as { cantidad: number; productos: { nombre: string; unidad: string } | null }[];
              const firstItem = items?.[0];
              const totalCant = items?.reduce((s, i) => s + i.cantidad, 0) || 0;
              const estado = venta.estado as string;
              const fuente = venta.fuente as string;

              return (
                <div
                  key={venta.id as string}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-50">
                      {estado === "entregado" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : estado === "en_camino" ? (
                        <Truck className="h-4 w-4 text-sky-500" />
                      ) : (
                        <CircleDot className="h-4 w-4 text-neutral-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {cliente?.nombre || (fuente === "fisico" ? "Venta Mostrador" : "Sin cliente")}
                        </p>
                        <Badge variant="outline" className="text-[11px]">
                          {fuente === "domicilio" ? "Domicilio" : "Fisico"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {totalCant} {firstItem?.productos?.unidad || "pza"} {firstItem?.productos?.nombre || ""} &middot; #{venta.numero_venta as number}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${Number(venta.monto_total).toLocaleString("es-MX")}</p>
                    <Badge
                      variant={
                        estado === "entregado"
                          ? "secondary"
                          : estado === "en_camino"
                            ? "default"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {estado === "entregado"
                        ? "Entregado"
                        : estado === "en_camino"
                          ? "En camino"
                          : "Pendiente"}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {(!ultimasVentas || ultimasVentas.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay ventas registradas
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
