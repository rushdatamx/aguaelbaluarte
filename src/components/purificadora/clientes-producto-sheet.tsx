"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Search, Users, Check, Loader2, Info } from "lucide-react";
import { setClientesDeProducto } from "@/lib/actions/productos";
import { useRouter } from "next/navigation";

interface ClienteLite {
  id: string;
  nombre: string;
  colonia: string | null;
}

interface ClientesProductoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productoId: string;
  productoNombre: string;
  clientes: ClienteLite[];
  asignados: string[]; // cliente_ids actualmente asignados
}

export function ClientesProductoSheet({
  open,
  onOpenChange,
  productoId,
  productoNombre,
  clientes,
  asignados,
}: ClientesProductoSheetProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(asignados));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  // Re-sincroniza la selección cada vez que se abre el panel (para otro producto).
  const [lastKey, setLastKey] = useState("");
  const key = `${productoId}:${open}`;
  if (open && key !== lastKey) {
    setSeleccion(new Set(asignados));
    setSearch("");
    setError("");
    setLastKey(key);
  }

  const filtrados = useMemo(() => {
    if (!search.trim()) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.colonia || "").toLowerCase().includes(q)
    );
  }, [search, clientes]);

  const toggle = (id: string) => {
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const marcarTodos = () => setSeleccion(new Set(clientes.map((c) => c.id)));
  const limpiar = () => setSeleccion(new Set());

  const guardar = () => {
    setError("");
    startTransition(async () => {
      const result = await setClientesDeProducto({
        producto_id: productoId,
        cliente_ids: Array.from(seleccion),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onOpenChange(false);
      router.refresh();
    });
  };

  const total = seleccion.size;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-sky-500" />
            Clientes de “{productoNombre}”
          </SheetTitle>
          <SheetDescription className="text-xs">
            Marca los clientes a los que se les ofrece este producto en Domicilio.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o colonia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {total} de {clientes.length} seleccionados
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={marcarTodos}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                Todos
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                type="button"
                onClick={limpiar}
                className="text-xs text-sky-600 hover:text-sky-700 font-medium"
              >
                Ninguno
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          {filtrados.map((c) => {
            const checked = seleccion.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggle(c.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  checked ? "bg-sky-50" : "hover:bg-muted/50"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    checked
                      ? "bg-sky-500 border-sky-500 text-white"
                      : "border-border bg-background"
                  }`}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium truncate">{c.nombre}</span>
                  {c.colonia && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {c.colonia}
                    </span>
                  )}
                </span>
              </button>
            );
          })}

          {filtrados.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              No se encontraron clientes.
            </p>
          )}
        </div>

        {total === 0 && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5">
            <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Sin clientes marcados, este producto se ofrece a <strong>todos</strong>.
            </p>
          </div>
        )}

        {error && (
          <p className="mx-4 mb-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
            {error}
          </p>
        )}

        <div className="border-t border-border p-4 flex gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={isPending}
            className="flex-1 h-11 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
