"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import type { CanalFiltro } from "@/lib/types";

export interface DashboardFiltros {
  canal: CanalFiltro;
  estadoPago: "todos" | "pagado" | "no_pagado";
}

interface FiltrosSheetProps {
  filtros: DashboardFiltros;
  onChange: (f: DashboardFiltros) => void;
}

const CANALES: { key: CanalFiltro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "fisico", label: "Normal (Físico)" },
  { key: "domicilio", label: "Domicilio" },
];

const ESTADOS: { key: DashboardFiltros["estadoPago"]; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "pagado", label: "Pagado" },
  { key: "no_pagado", label: "No pagado" },
];

export function FiltrosSheet({ filtros, onChange }: FiltrosSheetProps) {
  const activos =
    (filtros.canal !== "todos" ? 1 : 0) + (filtros.estadoPago !== "todos" ? 1 : 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-9 md:h-8 relative">
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filtros</span>
          {activos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-sky-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {activos}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>Filtros del dashboard</SheetTitle>
        </SheetHeader>

        <div className="px-4 space-y-6 overflow-y-auto">
          {/* Canal */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Canal de venta</p>
            <div className="grid grid-cols-1 gap-2">
              {CANALES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onChange({ ...filtros, canal: c.key })}
                  className={`h-11 rounded-md border text-sm font-medium text-left px-3 transition-colors ${
                    filtros.canal === c.key
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de pago */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Estado de pago</p>
            <div className="grid grid-cols-1 gap-2">
              {ESTADOS.map((e) => (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => onChange({ ...filtros, estadoPago: e.key })}
                  className={`h-11 rounded-md border text-sm font-medium text-left px-3 transition-colors ${
                    filtros.estadoPago === e.key
                      ? "border-sky-500 bg-sky-50 text-sky-700"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter>
          {activos > 0 && (
            <Button
              variant="ghost"
              onClick={() => onChange({ canal: "todos", estadoPago: "todos" })}
            >
              Limpiar filtros
            </Button>
          )}
          <SheetClose asChild>
            <Button>Ver resultados</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
