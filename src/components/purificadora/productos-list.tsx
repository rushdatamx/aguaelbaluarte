"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, ShoppingCart, Check, Loader2 } from "lucide-react";
import { actualizarProducto } from "@/lib/actions/productos";
import { useRouter } from "next/navigation";
import type { Producto } from "@/lib/types";

interface ProductosListProps {
  productos: Producto[];
}

export function ProductosList({ productos }: ProductosListProps) {
  const router = useRouter();
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(productos.map((p) => [p.id, p.precio.toString()]))
  );
  const [savedId, setSavedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const domicilio = productos.filter((p) => p.canal === "domicilio");
  const fisico = productos.filter((p) => p.canal === "fisico");

  const guardarPrecio = (producto: Producto) => {
    const nuevo = parseFloat(precios[producto.id]);
    if (isNaN(nuevo) || nuevo < 0) {
      setPrecios((prev) => ({ ...prev, [producto.id]: producto.precio.toString() }));
      return;
    }
    if (nuevo === producto.precio) return;

    setPendingId(producto.id);
    startTransition(async () => {
      const result = await actualizarProducto({ id: producto.id, precio: nuevo });
      setPendingId(null);
      if (result.error) {
        alert("Error: " + result.error);
        setPrecios((prev) => ({ ...prev, [producto.id]: producto.precio.toString() }));
        return;
      }
      setSavedId(producto.id);
      setTimeout(() => setSavedId(null), 1500);
      router.refresh();
    });
  };

  const toggleActivo = (producto: Producto) => {
    setPendingId(producto.id);
    startTransition(async () => {
      const result = await actualizarProducto({
        id: producto.id,
        activo: !producto.activo,
      });
      setPendingId(null);
      if (result.error) {
        alert("Error: " + result.error);
        return;
      }
      router.refresh();
    });
  };

  const renderProducto = (p: Producto) => {
    const cambio = precios[p.id] !== p.precio.toString();
    const isPending = pendingId === p.id;
    const isSaved = savedId === p.id;

    return (
      <div
        key={p.id}
        className={`grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-colors ${
          p.activo
            ? "border-border bg-background"
            : "border-border/50 bg-muted/30 opacity-60"
        }`}
      >
        {/* Nombre + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium truncate">{p.nombre}</span>
            {p.litros_por_unidad != null && (
              <span className="text-xs text-muted-foreground">
                {p.litros_por_unidad}L/{p.unidad}
              </span>
            )}
            {!p.activo && (
              <Badge variant="outline" className="text-[10px]">
                Inactivo
              </Badge>
            )}
          </div>
        </div>

        {/* Precio editable */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">$</span>
          <input
            type="number"
            min="0"
            step="0.50"
            value={precios[p.id] ?? ""}
            onChange={(e) =>
              setPrecios((prev) => ({ ...prev, [p.id]: e.target.value }))
            }
            onBlur={() => guardarPrecio(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            disabled={!p.activo || isPending}
            className="w-24 h-10 px-2 text-right rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground">/{p.unidad}</span>
        </div>

        {/* Estado de guardado */}
        <div className="w-6 flex items-center justify-center">
          {isPending && <Loader2 className="h-4 w-4 animate-spin text-sky-500" />}
          {isSaved && <Check className="h-4 w-4 text-green-600" />}
          {!isPending && !isSaved && cambio && (
            <span className="text-[10px] text-amber-600">●</span>
          )}
        </div>

        {/* Toggle activo */}
        <button
          onClick={() => toggleActivo(p)}
          disabled={isPending}
          className={`h-10 px-3 rounded-md text-xs font-medium transition-colors ${
            p.activo
              ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              : "bg-neutral-100 text-neutral-600 border border-neutral-200 hover:bg-neutral-200"
          } disabled:opacity-40`}
        >
          {p.activo ? "Activo" : "Inactivo"}
        </button>
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Productos</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edita precios y activa/desactiva productos del catálogo
        </p>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Domicilio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-sky-500" />
              Ventas Domicilio
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {domicilio.length} productos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {domicilio.map(renderProducto)}
          </CardContent>
        </Card>

        {/* Físico */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-sky-500" />
              Ventas Físico
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {fisico.length} productos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">{fisico.map(renderProducto)}</CardContent>
        </Card>

        {/* Info card */}
        <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 flex gap-3">
          <Package className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
          <div className="text-xs text-sky-900">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="space-y-1 text-sky-800/80">
              <li>• Modifica el precio y haz clic fuera (o presiona Enter) para guardar</li>
              <li>• Los productos inactivos no aparecen en los formularios de venta</li>
              <li>• Los cambios de precio aplican a las ventas nuevas, no afectan ventas pasadas</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
