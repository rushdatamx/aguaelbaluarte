"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Droplets, Cylinder, LayoutGrid, TableProperties, ChevronRight } from "lucide-react";
import type { DesgloseProductoCanal, CanalFiltro, VistaProductos } from "@/lib/types";

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

function iconoDe(id: string) {
  return iconMap[id] || <Droplets className="h-4 w-4 text-sky-500" />;
}

const money = (n: number) => `$${Number(n).toLocaleString("es-MX")}`;

const CANALES: { key: CanalFiltro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "fisico", label: "Normal" },
  { key: "domicilio", label: "Domicilio" },
];

interface Props {
  data: DesgloseProductoCanal[];
}

// Devuelve cantidad/monto/ventas según el canal filtrado.
function valoresCanal(p: DesgloseProductoCanal, canal: CanalFiltro) {
  if (canal === "fisico")
    return { cantidad: p.cantidad_fisico, monto: p.monto_fisico, ventas: p.num_ventas_fisico };
  if (canal === "domicilio")
    return {
      cantidad: p.cantidad_domicilio,
      monto: p.monto_domicilio,
      ventas: p.num_ventas_domicilio,
    };
  return { cantidad: p.cantidad_total, monto: p.monto_total, ventas: p.num_ventas_total };
}

export function VentasPorProducto({ data }: Props) {
  const [canal, setCanal] = useState<CanalFiltro>("todos");
  const [vista, setVista] = useState<VistaProductos>("tarjetas");

  // Productos con al menos una venta en el canal activo
  const visibles = data.filter((p) => valoresCanal(p, canal).cantidad > 0 || p.cantidad_total > 0);

  return (
    <div>
      {/* Encabezado con toggles */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-base md:text-lg font-semibold">Ventas por producto</h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Toggle de canal */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5 overflow-x-auto scrollbar-hide">
            {CANALES.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCanal(c.key)}
                className={`px-3 h-8 rounded-md text-xs md:text-sm font-medium whitespace-nowrap transition-colors ${
                  canal === c.key ? "bg-sky-500 text-white" : "text-muted-foreground hover:bg-accent"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Toggle de vista */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
            <button
              type="button"
              onClick={() => setVista("tarjetas")}
              aria-label="Vista tarjetas"
              className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                vista === "tarjetas" ? "bg-sky-500 text-white" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setVista("tabla")}
              aria-label="Vista tabla"
              className={`h-8 w-8 rounded-md flex items-center justify-center transition-colors ${
                vista === "tabla" ? "bg-sky-500 text-white" : "text-muted-foreground hover:bg-accent"
              }`}
            >
              <TableProperties className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {visibles.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No hay ventas en este periodo
          </CardContent>
        </Card>
      ) : vista === "tarjetas" ? (
        <VistaTarjetas data={visibles} canal={canal} />
      ) : (
        <VistaTabla data={visibles} />
      )}
    </div>
  );
}

function VistaTarjetas({ data, canal }: { data: DesgloseProductoCanal[]; canal: CanalFiltro }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {data.map((p) => {
        const v = valoresCanal(p, canal);
        return (
          <Card key={p.producto_id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-sky-50 shrink-0">
                  {iconoDe(p.producto_id)}
                </div>
                <span className="text-xs font-medium text-foreground leading-tight">{p.nombre}</span>
              </div>

              <div className="text-xl font-bold">
                {Number(v.cantidad).toLocaleString("es-MX")}{" "}
                <span className="text-xs font-normal text-muted-foreground">{p.unidad}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{money(v.monto)} total</p>

              {/* Desglose por canal (solo en vista "Todos") */}
              {canal === "todos" && (
                <div className="space-y-1.5 border-t border-border/60 pt-2">
                  <FilaCanal
                    label="Normal"
                    color="text-sky-600"
                    cantidad={p.cantidad_fisico}
                    unidad={p.unidad}
                    monto={p.monto_fisico}
                    ventas={p.num_ventas_fisico}
                  />
                  <FilaCanal
                    label="Domicilio"
                    color="text-emerald-600"
                    cantidad={p.cantidad_domicilio}
                    unidad={p.unidad}
                    monto={p.monto_domicilio}
                    ventas={p.num_ventas_domicilio}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function FilaCanal({
  label,
  color,
  cantidad,
  unidad,
  monto,
  ventas,
}: {
  label: string;
  color: string;
  cantidad: number;
  unidad: string;
  monto: number;
  ventas: number;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className={`font-medium ${color}`}>{label}</span>
      <span className="text-muted-foreground">
        {Number(cantidad).toLocaleString("es-MX")} {unidad} · {money(monto)} · {ventas}{" "}
        {ventas === 1 ? "venta" : "ventas"}
      </span>
    </div>
  );
}

function VistaTabla({ data }: { data: DesgloseProductoCanal[] }) {
  return (
    <Card>
      <CardContent className="p-0">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead className="text-right">Cant. total</TableHead>
                <TableHead className="text-right">Monto total</TableHead>
                <TableHead className="text-right">Normal</TableHead>
                <TableHead className="text-right">Domicilio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.producto_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {iconoDe(p.producto_id)}
                      <span className="text-sm font-medium">{p.nombre}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {Number(p.cantidad_total).toLocaleString("es-MX")} {p.unidad}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {money(p.monto_total)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {Number(p.cantidad_fisico).toLocaleString("es-MX")} {p.unidad}
                    <br />
                    {money(p.monto_fisico)} · {p.num_ventas_fisico} v.
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {Number(p.cantidad_domicilio).toLocaleString("es-MX")} {p.unidad}
                    <br />
                    {money(p.monto_domicilio)} · {p.num_ventas_domicilio} v.
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Móvil */}
        <div className="md:hidden divide-y divide-border">
          {data.map((p) => (
            <div key={p.producto_id} className="p-3">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  {iconoDe(p.producto_id)}
                  <span className="text-sm font-medium">{p.nombre}</span>
                </div>
                <span className="text-sm font-bold">{money(p.monto_total)}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <ChevronRight className="h-3 w-3" />
                <span>
                  {Number(p.cantidad_total).toLocaleString("es-MX")} {p.unidad} · Normal{" "}
                  {Number(p.cantidad_fisico).toLocaleString("es-MX")} · Domicilio{" "}
                  {Number(p.cantidad_domicilio).toLocaleString("es-MX")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
