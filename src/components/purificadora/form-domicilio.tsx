"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Truck,
  CheckCircle2,
  Camera,
  ImageIcon,
  Minus,
  Plus,
} from "lucide-react";
import { registrarVenta } from "@/lib/actions/ventas";
import { buscarClientes } from "@/lib/actions/clientes";
import type { Producto } from "@/lib/types";

interface FormDomicilioProps {
  productos: Producto[];
}

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

export function FormDomicilio({ productos }: FormDomicilioProps) {
  const [clienteId, setClienteId] = useState(PUBLICO_EN_GENERAL_ID);
  const [clienteNombre, setClienteNombre] = useState("Público en general");
  const [clienteDireccion, setClienteDireccion] = useState("Cliente predeterminado");
  const [cantidades, setCantidades] = useState<Record<string, number>>(
    () => Object.fromEntries(productos.map((p) => [p.id, 0]))
  );
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [clienteSearch, setClienteSearch] = useState("");
  const [estadoPago, setEstadoPago] = useState("pagado");
  const [evidencia, setEvidencia] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [clientesFiltrados, setClientesFiltrados] = useState<
    { id: string; nombre: string; direccion: string | null; colonia: string | null }[]
  >([]);
  const [isPending, startTransition] = useTransition();
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const montoTotal = productos.reduce(
    (sum, p) => sum + (cantidades[p.id] || 0) * p.precio,
    0
  );

  const tieneProductos = Object.values(cantidades).some((c) => c > 0);

  const handleSearchChange = (value: string) => {
    setClienteSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (value.length < 2) {
      setClientesFiltrados([]);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await buscarClientes(value);
      setClientesFiltrados(results);
    }, 300);
    setSearchTimeout(timeout);
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
        fuente: "domicilio",
        estado: "entregado",
        estado_pago: estadoPago as "pagado" | "no_pagado",
        metodo_pago: metodoPago as "efectivo" | "transferencia",
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
        setClienteDireccion("Cliente predeterminado");
        setClienteSearch("");
        setCantidades(Object.fromEntries(productos.map((p) => [p.id, 0])));
        setEstadoPago("pagado");
        setEvidencia(null);
      }, 2000);
    });
  };

  const updateCantidad = (productoId: string, value: string) => {
    const num = value === "" ? 0 : Math.max(0, parseInt(value) || 0);
    setCantidades((prev) => ({ ...prev, [productoId]: num }));
  };

  const stepCantidad = (productoId: string, delta: number) => {
    setCantidades((prev) => ({
      ...prev,
      [productoId]: Math.max(0, (prev[productoId] || 0) + delta),
    }));
  };

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Ventas Domicilio</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registro de entregas a domicilio
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Truck className="h-4 w-4 text-sky-500" />
            Nueva Entrega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-sm font-medium text-green-700">Entrega registrada</p>
            </div>
          ) : (
            <>
              {/* Cliente */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Cliente</label>
                {clienteId ? (
                  <div className="flex items-center justify-between p-3 bg-sky-50 rounded-lg border border-sky-100">
                    <div>
                      <p className="text-sm font-medium">{clienteNombre}</p>
                      <p className="text-xs text-muted-foreground">{clienteDireccion}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (clienteId === PUBLICO_EN_GENERAL_ID) {
                          setClienteId("");
                          setClienteNombre("");
                          setClienteDireccion("");
                        } else {
                          setClienteId(PUBLICO_EN_GENERAL_ID);
                          setClienteNombre("Público en general");
                          setClienteDireccion("Cliente predeterminado");
                        }
                        setClienteSearch("");
                      }}
                      className="text-xs text-sky-600 hover:text-sky-700"
                    >
                      {clienteId === PUBLICO_EN_GENERAL_ID ? "Buscar cliente" : "Cambiar"}
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={clienteSearch}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Buscar cliente por nombre..."
                      className="w-full h-11 md:h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    />
                    {clientesFiltrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                        {clientesFiltrados.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setClienteId(c.id);
                              setClienteNombre(c.nombre);
                              setClienteDireccion(c.direccion || c.colonia || "");
                              setClienteSearch("");
                              setClientesFiltrados([]);
                            }}
                            className="w-full text-left px-3 py-3 md:py-2 hover:bg-muted/50 transition-colors"
                          >
                            <p className="text-sm font-medium">{c.nombre}</p>
                            <p className="text-xs text-muted-foreground">{c.colonia}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Productos - desktop table */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Productos</label>

                {/* Desktop: table grid */}
                <div className="hidden md:block rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-[1fr_80px_80px_90px] bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>Descripcion</span>
                    <span className="text-center">Precio</span>
                    <span className="text-center">Cantidad</span>
                    <span className="text-right">Importe</span>
                  </div>
                  {productos.map((p) => {
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

                {/* Mobile: product cards with steppers */}
                <div className="md:hidden space-y-2">
                  {productos.map((p) => {
                    const cant = cantidades[p.id] || 0;
                    const importe = cant * p.precio;
                    return (
                      <div
                        key={p.id}
                        className={`rounded-lg border border-border p-3 transition-colors ${
                          cant > 0 ? "bg-sky-50/50 border-sky-200" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium">{p.nombre}</span>
                            <span className="text-xs text-muted-foreground ml-1">/{p.unidad}</span>
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
                              className="h-11 w-11 flex items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors"
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
                disabled={!clienteId || !tieneProductos || isPending}
                className="w-full py-3 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? "Registrando..." : "Registrar Entrega"}
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
