"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface IngresosChartProps {
  data: Array<{
    dia: string;
    monto: number;
  }>;
}

export function IngresosChart({ data }: IngresosChartProps) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 85%)" vertical={false} />
          <XAxis
            dataKey="dia"
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
            width={50}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid hsl(220, 20%, 85%)",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [
              `$${Number(value).toLocaleString("es-MX")}`,
              "Ingresos",
            ]}
          />
          <Bar
            dataKey="monto"
            fill="#0ea5e9"
            radius={[6, 6, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
