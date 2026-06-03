"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { mesLabel } from "@/lib/fechas";
import type { TendenciaMes } from "@/lib/types";

interface TendenciaChartProps {
  data: TendenciaMes[];
}

// Gráfica de tendencia de ingresos de los últimos 12 meses.
export function TendenciaChart({ data }: TendenciaChartProps) {
  const chartData = data.map((d) => ({
    mes: mesLabel(d.periodo),
    monto: d.monto,
  }));

  return (
    <div className="w-full h-[220px] md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="tendenciaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 88%)" vertical={false} />
          <XAxis
            dataKey="mes"
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value}`
            }
            width={48}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.97)",
              border: "1px solid hsl(220, 20%, 85%)",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 2 }}
            formatter={(value) => [`$${Number(value).toLocaleString("es-MX")}`, "Ingresos"]}
          />
          <Area
            type="monotone"
            dataKey="monto"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            fill="url(#tendenciaFill)"
            dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
