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
  MessageCircle,
  Monitor,
  Cylinder,
} from "lucide-react";
import data from "../../../../public/data/purificadora.json";
import { IngresosChart } from "@/components/purificadora/ingresos-chart";

export default function PurificadoraDashboard() {
  const { kpis, ingresos_7_dias, ruta_activa, ultimas_ventas, empresa } = data;

  const progreso = ruta_activa
    ? Math.round((ruta_activa.ventas_entregadas / ruta_activa.total_ventas) * 100)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {empresa.nombre} · Actualizado: {empresa.fecha_actualizacion}
        </p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.ingresos_hoy.toLocaleString("es-MX")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Semana: ${kpis.ingresos_semana.toLocaleString("es-MX")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ingresos del Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.ingresos_mes.toLocaleString("es-MX")}</div>
            <div className="flex items-center gap-1 mt-1">
              {kpis.variacion_mes >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${kpis.variacion_mes >= 0 ? "text-green-600" : "text-red-600"}`}>
                {kpis.variacion_mes >= 0 ? "+" : ""}{kpis.variacion_mes}%
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
              <span className="text-2xl font-bold text-green-600">{kpis.entregas_hoy}</span>
              <span className="text-sm text-muted-foreground">/ {kpis.total_ventas_hoy}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-600">{kpis.pendientes_hoy} pendientes</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Clientes Activos</CardTitle>
            <Droplets className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.clientes_activos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              de {kpis.total_clientes} registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Desglose por producto */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {Object.entries(kpis.desglose_hoy).map(([id, prod]) => {
          const p = prod as { nombre: string; cantidad: number; unidad: string; monto: number; ventas: number };
          const iconMap: Record<string, React.ReactNode> = {
            garrafon_20l: <Droplets className="h-4 w-4 text-sky-500" />,
            botella_1l: <Cylinder className="h-4 w-4 text-emerald-500" />,
            botella_500ml: <Cylinder className="h-4 w-4 text-violet-500" />,
            cuentalitros: <Droplets className="h-4 w-4 text-amber-500" />,
          };
          return (
            <Card key={id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-2">
                  {iconMap[id]}
                  <span className="text-xs font-medium text-muted-foreground">{p.nombre}</span>
                </div>
                <div className="text-xl font-bold">
                  {p.cantidad} <span className="text-xs font-normal text-muted-foreground">{p.unidad}</span>
                </div>
                <p className="text-xs text-muted-foreground">${p.monto.toLocaleString("es-MX")} · {p.ventas} ventas</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Grafica de ingresos */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Ingresos Ultimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <IngresosChart data={ingresos_7_dias} />
          </CardContent>
        </Card>

        {/* Ruta activa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Ruta Activa</CardTitle>
          </CardHeader>
          <CardContent>
            {ruta_activa ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Ruta {ruta_activa.tipo === "manana" ? "10:00 AM" : "3:00 PM"}
                  </span>
                  <Badge variant={ruta_activa.estado === "en_progreso" ? "default" : "secondary"}>
                    {ruta_activa.estado === "en_progreso" ? "En progreso" : ruta_activa.estado === "completada" ? "Completada" : "Pendiente"}
                  </Badge>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{ruta_activa.ventas_entregadas} de {ruta_activa.total_ventas} entregas</span>
                    <span>{progreso}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-500 rounded-full transition-all"
                      style={{ width: `${progreso}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold">${ruta_activa.total_monto.toLocaleString("es-MX")}</div>
                  <div className="text-xs text-muted-foreground">Monto total de la ruta</div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Repartidor: {empresa.repartidor}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No hay ruta activa</p>
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
            {ultimas_ventas.map((venta) => (
              <div
                key={venta.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-sky-50">
                    {venta.estado === "entregado" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : venta.estado === "en_camino" ? (
                      <Truck className="h-4 w-4 text-sky-500" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-neutral-400" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{venta.cliente_nombre}</p>
                      <Badge variant="outline" className="text-[9px]">
                        {venta.fuente === "tiburcio" ? "WhatsApp" : "Admin"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {venta.cantidad} {venta.unidad} {venta.producto_nombre} · #{venta.numero_venta}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">${venta.monto_total.toLocaleString("es-MX")}</p>
                  <Badge
                    variant={
                      venta.estado === "entregado"
                        ? "secondary"
                        : venta.estado === "en_camino"
                          ? "default"
                          : "outline"
                    }
                    className="text-[10px]"
                  >
                    {venta.estado === "entregado"
                      ? "Entregado"
                      : venta.estado === "en_camino"
                        ? "En camino"
                        : venta.estado === "asignado"
                          ? "Asignado"
                          : "Pendiente"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
