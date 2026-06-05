"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, ShoppingCart, Check, Loader2, Plus, X, Users } from "lucide-react";
import { actualizarProducto, crearProducto } from "@/lib/actions/productos";
import { ClientesProductoSheet } from "@/components/purificadora/clientes-producto-sheet";
import { useRouter } from "next/navigation";
import type { ProductoConClientes } from "@/lib/types";

interface ClienteLite {
  id: string;
  nombre: string;
  colonia: string | null;
}

interface ProductosListProps {
  productos: ProductoConClientes[];
  clientes: ClienteLite[];
}

export function ProductosList({ productos, clientes }: ProductosListProps) {
  const router = useRouter();
  const [precios, setPrecios] = useState<Record<string, string>>(
    Object.fromEntries(productos.map((p) => [p.id, p.precio.toString()]))
  );

  // Sync local precio state when productos change (e.g. after creating a new product)
  useEffect(() => {
    setPrecios((prev) => {
      const next = { ...prev };
      for (const p of productos) {
        if (!(p.id in next)) next[p.id] = p.precio.toString();
      }
      return next;
    });
  }, [productos]);

  const [savedId, setSavedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Sheet de clientes por producto (canal domicilio)
  const [clientesSheetProducto, setClientesSheetProducto] =
    useState<ProductoConClientes | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newNombre, setNewNombre] = useState("");
  const [newCanal, setNewCanal] = useState<"domicilio" | "fisico" | "ambos">("domicilio");
  const [newPrecio, setNewPrecio] = useState("");
  const [newUnidad, setNewUnidad] = useState("pza");
  const [newLitros, setNewLitros] = useState("");
  const [creating, setCreating] = useState(false);

  const resetForm = () => {
    setNewNombre("");
    setNewCanal("domicilio");
    setNewPrecio("");
    setNewUnidad("pza");
    setNewLitros("");
  };

  const handleCrear = () => {
    const nombre = newNombre.trim();
    const precio = parseFloat(newPrecio);
    if (!nombre || isNaN(precio) || precio < 0) {
      alert("Completa nombre y precio válido");
      return;
    }
    const litros = newLitros.trim() === "" ? null : parseFloat(newLitros);
    setCreating(true);
    startTransition(async () => {
      const result = await crearProducto({
        nombre,
        canal: newCanal,
        precio,
        unidad: newUnidad.trim() || "pza",
        litros_por_unidad: litros !== null && !isNaN(litros) ? litros : null,
      });
      setCreating(false);
      if (result.error) {
        alert("Error: " + result.error);
        return;
      }
      resetForm();
      setShowForm(false);
      router.refresh();
    });
  };

  const domicilio = productos.filter((p) => p.canal === "domicilio");
  const fisico = productos.filter((p) => p.canal === "fisico");

  const guardarPrecio = (producto: ProductoConClientes) => {
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

  const toggleActivo = (producto: ProductoConClientes) => {
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

  const renderProducto = (p: ProductoConClientes) => {
    const cambio = precios[p.id] !== p.precio.toString();
    const isPending = pendingId === p.id;
    const isSaved = savedId === p.id;
    const esDomicilio = p.canal === "domicilio";
    const numClientes = p.cliente_ids.length;

    return (
      <div
        key={p.id}
        className={`grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg border transition-colors ${
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

        {/* Clientes (solo domicilio) */}
        {esDomicilio ? (
          <button
            type="button"
            onClick={() => setClientesSheetProducto(p)}
            className={`h-10 px-3 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 border ${
              numClientes > 0
                ? "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            }`}
            title="Elegir a qué clientes se ofrece este producto"
          >
            <Users className="h-3.5 w-3.5" />
            {numClientes > 0 ? `${numClientes} clientes` : "Todos"}
          </button>
        ) : (
          <span className="hidden md:block" />
        )}

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
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Productos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edita precios y activa/desactiva productos del catálogo
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="h-10 px-3 md:px-4 rounded-lg bg-sky-500 text-white text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-1.5 shrink-0"
        >
          {showForm ? (
            <>
              <X className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelar</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Formulario nuevo producto */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Plus className="h-4 w-4 text-sky-500" />
                Nuevo producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre</label>
                <input
                  type="text"
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej. Botella 1.5L"
                  className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Canal</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "domicilio", label: "Domicilio" },
                    { id: "fisico", label: "Físico" },
                    { id: "ambos", label: "Ambos" },
                  ].map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCanal(c.id as "domicilio" | "fisico" | "ambos")}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                        newCanal === c.id
                          ? "bg-sky-500 text-white border-sky-500"
                          : "bg-background text-muted-foreground border-border hover:border-sky-200"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                {newCanal === "ambos" && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Se creará en Domicilio y en Físico con el mismo precio.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Precio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={newPrecio}
                    onChange={(e) => setNewPrecio(e.target.value)}
                    placeholder="0"
                    className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Unidad</label>
                  <input
                    type="text"
                    value={newUnidad}
                    onChange={(e) => setNewUnidad(e.target.value)}
                    placeholder="pza"
                    className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Litros</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={newLitros}
                    onChange={(e) => setNewLitros(e.target.value)}
                    placeholder="opcional"
                    className="w-full h-11 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              <button
                onClick={handleCrear}
                disabled={creating}
                className="w-full py-3 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                {creating ? "Creando..." : "Crear producto"}
              </button>
            </CardContent>
          </Card>
        )}

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
              <li>• En Domicilio, usa “Clientes” para elegir a quién se le ofrece cada producto (sin marcar nadie = todos)</li>
            </ul>
          </div>
        </div>
      </div>

      {clientesSheetProducto && (
        <ClientesProductoSheet
          open={!!clientesSheetProducto}
          onOpenChange={(open) => {
            if (!open) setClientesSheetProducto(null);
          }}
          productoId={clientesSheetProducto.id}
          productoNombre={clientesSheetProducto.nombre}
          clientes={clientes}
          asignados={clientesSheetProducto.cliente_ids}
        />
      )}
    </div>
  );
}
