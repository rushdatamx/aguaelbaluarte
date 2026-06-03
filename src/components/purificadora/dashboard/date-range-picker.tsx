"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  getHoy,
  getInicioSemana,
  getInicioMes,
  getInicioMesAnterior,
  getFinMesAnterior,
  formatRangoLabel,
  dateToYMD,
  ymdToDate,
} from "@/lib/fechas";
import type { RangoFechas } from "@/lib/types";

interface DateRangePickerProps {
  value: RangoFechas;
  onChange: (rango: RangoFechas) => void;
}

type PresetKey = "hoy" | "semana" | "mes" | "mes_anterior" | "personalizado";

const PRESETS: { key: PresetKey; label: string }[] = [
  { key: "hoy", label: "Hoy" },
  { key: "semana", label: "Semana" },
  { key: "mes", label: "Mes" },
  { key: "mes_anterior", label: "Mes anterior" },
];

function rangoDePreset(key: PresetKey): RangoFechas {
  const hoy = getHoy();
  switch (key) {
    case "hoy":
      return { desde: hoy, hasta: hoy };
    case "semana":
      return { desde: getInicioSemana(), hasta: hoy };
    case "mes":
      return { desde: getInicioMes(), hasta: hoy };
    case "mes_anterior":
      return { desde: getInicioMesAnterior(), hasta: getFinMesAnterior() };
    default:
      return { desde: hoy, hasta: hoy };
  }
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [preset, setPreset] = useState<PresetKey>("mes");
  const [open, setOpen] = useState(false);

  const aplicarPreset = (key: PresetKey) => {
    setPreset(key);
    onChange(rangoDePreset(key));
  };

  const seleccion: DateRange | undefined = value.desde
    ? { from: ymdToDate(value.desde), to: ymdToDate(value.hasta) }
    : undefined;

  const onCalendarSelect = (range: DateRange | undefined) => {
    if (!range?.from) return;
    const desde = dateToYMD(range.from);
    const hasta = dateToYMD(range.to ?? range.from);
    setPreset("personalizado");
    onChange({ desde, hasta });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Presets — segmented control con scroll horizontal en móvil */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide rounded-lg border border-border p-0.5 bg-background snap-x">
        {PRESETS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => aplicarPreset(p.key)}
            className={`px-3 h-9 md:h-8 rounded-md text-xs md:text-sm font-medium whitespace-nowrap snap-start transition-colors ${
              preset === p.key
                ? "bg-sky-500 text-white"
                : "text-muted-foreground hover:bg-accent"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Rango personalizado con calendario */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`h-9 md:h-8 ${
              preset === "personalizado" ? "border-sky-500 text-sky-700" : ""
            }`}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="hidden sm:inline">
              {preset === "personalizado"
                ? formatRangoLabel(value.desde, value.hasta)
                : "Personalizado"}
            </span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-2">
          <Calendar
            mode="range"
            selected={seleccion}
            onSelect={onCalendarSelect}
            defaultMonth={seleccion?.from}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
