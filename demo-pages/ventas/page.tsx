"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  CheckCircle2,
  Camera,
  ImageIcon,
  Gauge,
} from "lucide-react";
import data from "../../../../../public/data/purificadora.json";

const PRODUCTOS_FISICO = [
  { id: "llenado_garrafon_20l", nombre: "Llenado Garrafon 20L", precio: 20, unidad: "pza", litrosPorUnidad: 20 },
  { id: "llenado_garrafon_4_10l", nombre: "Llenado Garrafon 4-10L", precio: 10, unidad: "litro", litrosPorUnidad: 1 },
  { id: "garrafon_20l", nombre: "Garrafon 20L", precio: 110, unidad: "pza", litrosPorUnidad: 20 },
  { id: "botella_1l", nombre: "Botella 1L", precio: 10, unidad: "pza", litrosPorUnidad: 1 },
];

export default function VentasFisicoPage() {
  const { empresa } = data;

  const [turno, setTurno] = useState("matutino");
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(PRODUCTOS_FISICO.map((p) => [p.id, 0]))
  );
  const [lecturaInicial, setLecturaInicial] = useState("1883");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [evidencia, setEvidencia] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const montoTotal = PRODUCTOS_FISICO.reduce(
    (sum, p) => sum + (cantidades[p.id] || 0) * p.precio,
    0
  );

  const litrosTotales = useMemo(() => {
    return PRODUCTOS_FISICO.reduce(
      (sum, p) => sum + (cantidades[p.id] || 0) * p.litrosPorUnidad,
      0
    );
  }, [cantidades]);

  const lecturaInicialNum = parseInt(lecturaInicial) || 0;
  const lecturaFinal = lecturaInicialNum > 0 ? lecturaInicialNum + litrosTotales : 0;

  const tieneProductos = Object.values(cantidades).some((c) => c > 0);

  const handleRegistrar = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCantidades(Object.fromEntries(PRODUCTOS_FISICO.map((p) => [p.id, 0])));
      setLecturaInicial("1883");
      setEstadoPago("pagado");
      setEvidencia(null);
    }, 2000);
  };

  const updateCantidad = (productoId: string, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    setCantidades((prev) => ({ ...prev, [productoId]: num }));
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Ventas Fisico</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de ventas en punto de venta · {empresa.nombre}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-sky-500" />
            Nueva Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-700">Venta registrada</p>
            </div>
          ) : (
            <>
              {/* Turno */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Turno</label>
                <div className="flex gap-2">
                  {[
                    { id: "matutino", label: "Matutino" },
                    { id: "vespertino", label: "Vespertino" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTurno(t.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        turno === t.id
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-background text-muted-foreground border-border hover:border-sky-200"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Productos - tabla tipo nota de remision */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Productos</label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_80px_90px] bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>Descripcion</span>
                    <span className="text-center">Precio</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-right">Importe</span>
                  </div>
                  {PRODUCTOS_FISICO.map((p) => {
                    const cant = cantidades[p.id] || 0;
                    const importe = cant * p.precio;
                    return (
                      <div
                        key={p.id}
                        className={`grid grid-cols-[1fr_80px_80px_90px] items-center px-3 py-2.5 border-t border-border/50 transition-colors ${
                          cant > 0 ? "bg-sky-50/50" : ""
                        }`}
                      >
                        <div>
                          <span className="text-sm font-medium">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground ml-1">/{p.unidad}</span>
                        </div>
                        <span className="text-sm text-center text-muted-foreground">
                          ${p.precio}
                        </span>
                        <div className="flex justify-center">
                          <input
                            type="number"
                            min="0"
                            value={cant || ""}
                            onChange={(e) => updateCantidad(p.id, e.target.value)}
                            placeholder="0"
                            className="w-16 h-8 text-center rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>
                        <span className={`text-sm text-right font-medium ${importe > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>
                          ${importe.toLocaleString("es-MX")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cuentalitros */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-sky-500" />
                  Cuentalitros
                </label>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-2 gap-px bg-border">
                    <div className="bg-background p-3">
                      <span className="text-xs text-muted-foreground block mb-1">Lectura Inicial</span>
                      <input
                        type="number"
                        min="0"
                        value={lecturaInicial}
                        onChange={(e) => setLecturaInicial(e.target.value)}
                        placeholder="0"
                        className="w-full h-9 text-center rounded-md border border-border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="bg-background p-3">
                      <span className="text-xs text-muted-foreground block mb-1">Lectura Final</span>
                      <div className="w-full h-9 flex items-center justify-center rounded-md bg-muted/50 text-lg font-bold text-sky-600">
                        {lecturaFinal > 0 ? lecturaFinal.toLocaleString("es-MX") : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border px-3 py-2 bg-muted/30 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Litros totales</span>
                    <span className="text-sm font-bold text-sky-600">{litrosTotales.toLocaleString("es-MX")} L</span>
                  </div>
                </div>
              </div>

              {/* Metodo de pago */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Metodo de Pago</label>
                <div className="flex gap-2">
                  {[
                    { id: "efectivo", label: "Efectivo" },
                    { id: "transferencia", label: "Transferencia" },
                    { id: "credito", label: "Credito" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setMetodoPago(m.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        metodoPago === m.id
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-background text-muted-foreground border-border hover:border-sky-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Estado de pago */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Estado de Pago</label>
                <div className="flex gap-2">
                  {[
                    { id: "pagado", label: "Pagado" },
                    { id: "no_pagado", label: "No Pagado" },
                  ].map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setEstadoPago(e.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        estadoPago === e.id
                          ? e.id === "pagado"
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-background text-muted-foreground border-border hover:border-sky-200"
                      }`}
                    >
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evidencia */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Evidencia</label>
                {evidencia ? (
                  <div className="relative rounded-lg border border-border overflow-hidden">
                    <div className="h-32 bg-neutral-100 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-neutral-400" />
                    </div>
                    <div className="flex items-center justify-between p-2 bg-muted/30">
                      <span className="text-xs text-muted-foreground truncate">{evidencia}</span>
                      <button
                        onClick={() => setEvidencia(null)}
                        className="text-xs text-red-500 hover:text-red-600 shrink-0 ml-2"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setEvidencia("evidencia_venta_" + Date.now() + ".jpg")}
                    className="w-full py-3 rounded-lg border border-dashed border-border hover:border-sky-300 hover:bg-sky-50/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground"
                  >
                    <Camera className="h-4 w-4" />
                    Adjuntar Evidencia
                  </button>
                )}
              </div>

              {/* Total */}
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-sky-600">
                    ${montoTotal.toLocaleString("es-MX")}
                  </span>
                </div>
              </div>

              {/* Boton registrar */}
              <button
                onClick={handleRegistrar}
                disabled={!tieneProductos}
                className="w-full py-3 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Registrar Venta
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
