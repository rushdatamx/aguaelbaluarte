"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  CheckCircle2,
  Gauge,
  Minus,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { registrarVenta } from "@/lib/actions/ventas";
import { ClienteCombobox } from "@/components/purificadora/cliente-combobox";
import { EvidenciaUpload } from "@/components/purificadora/evidencia-upload";
import type { Producto } from "@/lib/types";

interface FormFisicoProps {
  productos: Producto[];
}

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

export function FormFisico({ productos }: FormFisicoProps) {
  const [clienteId, setClienteId] = useState(PUBLICO_EN_GENERAL_ID);
  const [clienteNombre, setClienteNombre] = useState("Público en general");
  const [turno, setTurno] = useState("matutino");
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(productos.map((p) => [p.id, 0]))
  );
  const [lecturaInicial, setLecturaInicial] = useState("");
  const [lecturaFinal, setLecturaFinal] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [evidencia, setEvidencia] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const montoTotal = productos.reduce(
    (sum, p) => sum + (cantidades[p.id] || 0) * p.precio,
    0
  );

  const lecturaInicialNum = parseInt(lecturaInicial) || 0;
  const lecturaFinalNum = parseInt(lecturaFinal) || 0;
  const litrosDisponibles = lecturaFinalNum > lecturaInicialNum ? lecturaFinalNum - lecturaInicialNum : 0;

  const litrosUsados = useMemo(() => {
    return productos.reduce(
      (sum, p) => sum + (cantidades[p.id] || 0) * (p.litros_por_unidad || 0),
      0
    );
  }, [cantidades, productos]);

  const litrosRestantes = litrosDisponibles - litrosUsados;
  const excedeLitros = litrosUsados > litrosDisponibles && litrosDisponibles > 0;
  const tieneCuentalitros = lecturaInicialNum > 0 && lecturaFinalNum > lecturaInicialNum;

  const tieneProductos = Object.values(cantidades).some((c) => c > 0);

  const puedeAgregarProducto = (productoId: string) => {
    if (!tieneCuentalitros) return true;
    const producto = productos.find((p) => p.id === productoId);
    if (!producto) return false;
    return litrosRestantes >= (producto.litros_por_unidad || 0);
  };

  const handleRegistrar = () => {
    const items = productos
      .filter((p) => (cantidades[p.id] || 0) > 0)
      .map((p) => ({
        producto_id: p.id,
        cantidad: cantidades[p.id],
        precio_unitario: p.precio,
      }));

    startTransition(async () => {
      const result = await registrarVenta({
        cliente_id: clienteId,
        fuente: "fisico",
        turno: turno as "matutino" | "vespertino",
        estado: "entregado",
        estado_pago: estadoPago as "pagado" | "no_pagado",
        metodo_pago: metodoPago as "efectivo" | "transferencia" | "credito",
        lectura_inicial: lecturaInicialNum || null,
        lectura_final: lecturaFinalNum || null,
        evidencia_url: evidencia,
        items,
      });

      if (result.error) {
        alert("Error: " + result.error);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setClienteId(PUBLICO_EN_GENERAL_ID);
        setClienteNombre("Público en general");
        setCantidades(Object.fromEntries(productos.map((p) => [p.id, 0])));
        setLecturaInicial("");
        setLecturaFinal("");
        setEstadoPago("pagado");
        setEvidencia(null);
      }, 2000);
    });
  };

  const updateCantidad = (productoId: string, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    const producto = productos.find((p) => p.id === productoId)!;
    const litrosSinEste = litrosUsados - (cantidades[productoId] || 0) * (producto.litros_por_unidad || 0);
    const litrosConNuevo = litrosSinEste + num * (producto.litros_por_unidad || 0);

    if (tieneCuentalitros && litrosConNuevo > litrosDisponibles) return;
    setCantidades((prev) => ({ ...prev, [productoId]: num }));
  };

  const stepCantidad = (productoId: string, delta: number) => {
    const producto = productos.find((p) => p.id === productoId)!;
    const newCant = Math.max(0, (cantidades[productoId] || 0) + delta);
    const litrosSinEste = litrosUsados - (cantidades[productoId] || 0) * (producto.litros_por_unidad || 0);
    const litrosConNuevo = litrosSinEste + newCant * (producto.litros_por_unidad || 0);

    if (tieneCuentalitros && litrosConNuevo > litrosDisponibles) return;
    setCantidades((prev) => ({
      ...prev,
      [productoId]: newCant,
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Ventas Fisico</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de ventas en punto de venta
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
              {/* Cliente */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Cliente</label>
                <ClienteCombobox
                  value={clienteId}
                  nombre={clienteNombre}
                  onSelect={(c) => {
                    setClienteId(c.id);
                    setClienteNombre(c.nombre);
                  }}
                />
              </div>

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
                      className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors border ${
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
                        className="w-full h-11 md:h-9 text-center rounded-md border border-border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div className="bg-background p-3">
                      <span className="text-xs text-muted-foreground block mb-1">Lectura Final</span>
                      <input
                        type="number"
                        min="0"
                        value={lecturaFinal}
                        onChange={(e) => setLecturaFinal(e.target.value)}
                        placeholder="0"
                        className="w-full h-11 md:h-9 text-center rounded-md border border-border bg-background text-lg font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                  </div>
                  <div className="border-t border-border px-3 py-2 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Litros disponibles</span>
                      <span className="text-sm font-bold text-sky-600">
                        {litrosDisponibles > 0 ? `${litrosDisponibles.toLocaleString("es-MX")} L` : "\u2014"}
                      </span>
                    </div>
                    {tieneCuentalitros && tieneProductos && (
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">Litros restantes</span>
                        <span className={`text-sm font-bold ${litrosRestantes > 0 ? "text-green-600" : litrosRestantes === 0 ? "text-amber-600" : "text-red-600"}`}>
                          {litrosRestantes.toLocaleString("es-MX")} L
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {excedeLitros && (
                  <div className="flex items-center gap-1.5 mt-2 text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-xs">Los litros de los productos exceden el cuentalitros</span>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Productos
                  {tieneCuentalitros && (
                    <span className="text-xs text-muted-foreground font-normal ml-2">
                      ({litrosUsados}/{litrosDisponibles} L asignados)
                    </span>
                  )}
                </label>

                {/* Desktop: table grid */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_60px_80px_80px_90px] bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>Descripcion</span>
                    <span className="text-center">Litros</span>
                    <span className="text-center">Precio</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-right">Importe</span>
                  </div>
                  {productos.map((p) => {
                    const cant = cantidades[p.id] || 0;
                    const importe = cant * p.precio;
                    const bloqueado = tieneCuentalitros && !puedeAgregarProducto(p.id) && cant === 0;
                    return (
                      <div
                        key={p.id}
                        className={`grid grid-cols-[1fr_60px_80px_80px_90px] items-center px-3 py-2.5 border-t border-border/50 transition-colors ${
                          cant > 0 ? "bg-sky-50/50" : ""
                        } ${bloqueado ? "opacity-40" : ""}`}
                      >
                        <div>
                          <span className="text-sm font-medium">{p.nombre}</span>
                          <span className="text-xs text-muted-foreground ml-1">/{p.unidad}</span>
                        </div>
                        <span className="text-xs text-center text-muted-foreground">
                          {p.litros_por_unidad}L
                        </span>
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

                {/* Mobile: product cards with steppers */}
                <div className="md:hidden space-y-2">
                  {productos.map((p) => {
                    const cant = cantidades[p.id] || 0;
                    const importe = cant * p.precio;
                    const bloqueado = tieneCuentalitros && !puedeAgregarProducto(p.id) && cant === 0;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-lg border border-border p-3 transition-colors ${
                          cant > 0 ? "bg-sky-50/50 border-sky-200" : ""
                        } ${bloqueado ? "opacity-40" : ""}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium">{p.nombre}</span>
                            <span className="text-xs text-muted-foreground ml-1">/{p.unidad}</span>
                            <span className="text-xs text-muted-foreground ml-1">{"\u00B7"} {p.litros_por_unidad}L</span>
                          </div>
                          <span className="text-sm text-muted-foreground">${p.precio}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => stepCantidad(p.id, -1)}
                              disabled={cant === 0}
                              className="h-11 w-11 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="text-lg font-bold w-8 text-center">{cant}</span>
                            <button
                              onClick={() => stepCantidad(p.id, 1)}
                              disabled={bloqueado || (tieneCuentalitros && !puedeAgregarProducto(p.id))}
                              className="h-11 w-11 flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors disabled:opacity-30 disabled:hover:bg-sky-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <span className={`text-sm font-bold ${importe > 0 ? "text-foreground" : "text-muted-foreground/40"}`}>
                            ${importe.toLocaleString("es-MX")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                      className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors border ${
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
                      className={`flex-1 py-3 md:py-2 rounded-lg text-sm font-medium transition-colors border ${
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
                <EvidenciaUpload value={evidencia} onChange={setEvidencia} />
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
                disabled={!tieneProductos || excedeLitros || isPending}
                className="w-full py-3 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Registrando..." : "Registrar Venta"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
