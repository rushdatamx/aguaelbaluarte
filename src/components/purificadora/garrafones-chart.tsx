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

interface GarrafonesChartProps {
  data: Array<{
    semana: string;
    garrafones: number;
  }>;
}

export function GarrafonesChart({ data }: GarrafonesChartProps) {
  return (
    <div style={{ width: "100%", height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorGarrafones" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 85%)" vertical={false} />
          <XAxis
            dataKey="semana"
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(220, 10%, 45%)" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              border: "1px solid hsl(220, 20%, 85%)",
              borderRadius: "12px",
              fontSize: "12px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            }}
            formatter={(value) => [`${value} garrafones`, "Total"]}
          />
          <Area
            type="monotone"
            dataKey="garrafones"
            stroke="#0ea5e9"
            strokeWidth={2.5}
            fill="url(#colorGarrafones)"
            dot={false}
            activeDot={{ r: 5, fill: "#0369a1", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
