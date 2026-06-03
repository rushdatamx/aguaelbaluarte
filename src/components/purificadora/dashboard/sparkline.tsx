"use client";

import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
  height?: number;
}

// Mini-gráfica de línea sin ejes ni tooltip, para usar dentro de los KPI cards.
export function Sparkline({ data, color = "#0ea5e9", height = 40 }: SparklineProps) {
  if (!data || data.length === 0) {
    return <div style={{ height }} />;
  }

  const chartData = data.map((v, i) => ({ i, v }));

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 2, left: 2, bottom: 4 }}>
          {/* Margen vertical para que la línea no se pegue a los bordes */}
          <YAxis hide domain={["dataMin", "dataMax"]} />
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
