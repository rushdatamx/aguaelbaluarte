"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings2, Loader2, Package, Droplet, Info } from "lucide-react";
import { setTipoInventarioProducto } from "@/lib/actions/inventario";
import { useRouter } from "next/navigation";
import type { Producto, TipoInventario } from "@/lib/types";

interface ConfigProductosProps {
  productos: Producto[];
}

type Opcion = "garrafon" | "litro" | "ninguno";

const OPCIONES: { id: Opcion; label: string }[] = [
  { id: "garrafon", label: "Garrafón" },
  { id: "litro", label: "Litro" },
  { id: "ninguno", label: "No es inventario" },
];

export function ConfigProductos({ productos }: ConfigProductosProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);

  const cambiar = (producto: Producto, opcion: Opcion) => {
    const tipo: TipoInventario | null = opcion === "ninguno" ? null : opcion;
    if (tipo === producto.tipo_inventario) return;

    setSavingId(producto.id);
    startTransition(async () => {
      await setTipoInventarioProducto({ producto_id: producto.id, tipo });
      setSavingId(null);
      router.refresh();
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base font-medium">
            Configuración de inventario por producto
          </CardTitle>
        </div>
        <div className="mt-2 flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-100 p-3">
          <Info className="h-4 w-4 text-sky-500 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Elige qué descuenta cada producto al venderse. Los productos marcados como{" "}
            <strong>Garrafón</strong> o <strong>Litro</strong> bajan ese inventario. Deja en{" "}
            <strong>No es inventario</strong> los que no consumen stock (ej. los{" "}
            <em>Llenado de Garrafón</em>, que son venta de agua).
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {productos.map((p) => {
          const actual: Opcion = p.tipo_inventario ?? "ninguno";
          const isSaving = savingId === p.id && isPending;
          return (
            <div
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
            >
              <div className="min-w-0 flex items-center gap-2">
                {p.tipo_inventario === "garrafon" && (
                  <Package className="h-4 w-4 text-sky-500 shrink-0" />
                )}
                {p.tipo_inventario === "litro" && (
                  <Droplet className="h-4 w-4 text-cyan-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.nombre}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[10px]">
                      {p.canal === "domicilio" ? "Domicilio" : "Físico"}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      ${p.precio} / {p.unidad}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isSaving && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground mr-1" />
                )}
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {OPCIONES.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      disabled={isPending}
                      onClick={() => cambiar(p, op.id)}
                      className={`px-2.5 py-2 text-xs font-medium transition-colors disabled:opacity-50 ${
                        actual === op.id
                          ? op.id === "ninguno"
                            ? "bg-muted text-foreground"
                            : "bg-sky-500 text-white"
                          : "bg-background text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {productos.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No hay productos activos.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
