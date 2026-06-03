"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkline } from "./sparkline";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface KpiCardProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  subtexto?: React.ReactNode;
  delta?: number | null; // % de cambio, opcional
  sparklineData?: number[];
  sparklineColor?: string;
}

export function KpiCard({
  titulo,
  valor,
  icono,
  subtexto,
  delta,
  sparklineData,
  sparklineColor,
}: KpiCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="pt-4 pb-3 md:pt-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-sky-50 shrink-0">
            {icono}
          </div>
          <span className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {titulo}
          </span>
        </div>

        <div className="text-2xl md:text-3xl font-bold tracking-tight">{valor}</div>

        <div className="mt-1 min-h-[18px]">
          {delta != null ? (
            <div className="flex items-center gap-1">
              {delta >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-600" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-600" />
              )}
              <span
                className={`text-xs font-medium ${
                  delta >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {delta >= 0 ? "+" : ""}
                {delta}%
              </span>
              <span className="text-xs text-muted-foreground">vs mes anterior</span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground truncate">{subtexto}</p>
          )}
        </div>

        {sparklineData && sparklineData.length > 0 && (
          <div className="mt-2 -mx-1">
            <Sparkline data={sparklineData} color={sparklineColor} height={36} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
