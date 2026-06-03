"use client";

import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, BarChart3, Truck, Users } from "lucide-react";
import type { ResumenDia } from "@/lib/types";

interface Props {
  resumen: ResumenDia;
  clientesActivos: number;
  totalClientes: number;
  titulo?: string;
}

export function ResumenDiaSection({ resumen, clientesActivos, totalClientes, titulo = "Resumen del periodo" }: Props) {
  const ventasLabel = () => {
    const partes: string[] = [];
    if (resumen.ventas_pza > 0) partes.push(`${Number(resumen.ventas_pza).toLocaleString("es-MX")} pza`);
    if (resumen.ventas_litros > 0)
      partes.push(`${Number(resumen.ventas_litros).toLocaleString("es-MX")} litro`);
    return partes.length ? partes.join(" / ") : "0";
  };

  const items = [
    {
      icono: <DollarSign className="h-4 w-4 text-sky-600" />,
      bg: "bg-sky-50",
      label: "Ingresos totales",
      valor: `$${Number(resumen.ingresos_totales).toLocaleString("es-MX")}`,
      sub: null as string | null,
    },
    {
      icono: <BarChart3 className="h-4 w-4 text-emerald-600" />,
      bg: "bg-emerald-50",
      label: "Ventas totales",
      valor: ventasLabel(),
      sub: `${resumen.num_ventas} ${resumen.num_ventas === 1 ? "venta" : "ventas"}`,
    },
    {
      icono: <Truck className="h-4 w-4 text-orange-600" />,
      bg: "bg-orange-50",
      label: "Entregas completadas",
      valor: `${resumen.entregas_completadas} / ${resumen.entregas_total}`,
      sub: `${resumen.entregas_total - resumen.entregas_completadas} pendientes`,
    },
    {
      icono: <Users className="h-4 w-4 text-violet-600" />,
      bg: "bg-violet-50",
      label: "Clientes activos",
      valor: String(clientesActivos),
      sub: `de ${totalClientes} registrados`,
    },
  ];

  return (
    <div>
      <h2 className="text-base md:text-lg font-semibold mb-3">{titulo}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((it) => (
          <Card key={it.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${it.bg} shrink-0`}>
                {it.icono}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground truncate">{it.label}</p>
                <p className="text-lg md:text-xl font-bold truncate">{it.valor}</p>
                {it.sub && <p className="text-[11px] text-muted-foreground truncate">{it.sub}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
