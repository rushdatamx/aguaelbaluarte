"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X, Users } from "lucide-react";
import { listarClientes } from "@/lib/actions/clientes";

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  colonia: string | null;
}

interface ClienteComboboxProps {
  value: string;
  nombre: string;
  onSelect: (cliente: { id: string; nombre: string; direccion: string; colonia: string }) => void;
}

export function ClienteCombobox({ value, nombre, onSelect }: ClienteComboboxProps) {
  const [open, setOpen] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [filtro, setFiltro] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Click fuera cierra el dropdown
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setFiltro("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Cargar clientes al abrir
  const handleOpen = async () => {
    if (open) {
      setOpen(false);
      setFiltro("");
      return;
    }
    setOpen(true);
    if (clientes.length === 0) {
      setLoading(true);
      const data = await listarClientes();
      setClientes(data);
      setLoading(false);
    }
  };

  const filtered = filtro.trim()
    ? clientes.filter((c) => {
        const q = filtro.toLowerCase();
        return (
          c.nombre.toLowerCase().includes(q) ||
          (c.direccion || "").toLowerCase().includes(q) ||
          (c.colonia || "").toLowerCase().includes(q) ||
          (c.telefono || "").includes(q)
        );
      })
    : clientes;

  const isPublico = value === PUBLICO_EN_GENERAL_ID;

  const handleSelectPublico = () => {
    onSelect({
      id: PUBLICO_EN_GENERAL_ID,
      nombre: "Público en general",
      direccion: "Cliente predeterminado",
      colonia: "",
    });
    setOpen(false);
    setFiltro("");
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-3 h-11 rounded-lg border border-border bg-background text-left hover:border-sky-300 transition-colors"
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Users className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{nombre || "Selecciona un cliente"}</span>
          {isPublico && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
              Default
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 overflow-hidden">
          {/* Filtro */}
          <div className="p-2 border-b border-border bg-muted/30">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Buscar por nombre, dirección, colonia..."
                className="w-full h-10 pl-9 pr-9 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
              {filtro && (
                <button
                  type="button"
                  onClick={() => setFiltro("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-72 overflow-auto">
            {/* Opción Público en general */}
            {!filtro.trim() && (
              <button
                type="button"
                onClick={handleSelectPublico}
                className={`w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 ${
                  isPublico ? "bg-sky-50" : ""
                }`}
              >
                <p className="text-sm font-medium">Público en general</p>
                <p className="text-xs text-muted-foreground">Cliente predeterminado</p>
              </button>
            )}

            {loading && (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">Cargando clientes...</p>
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="px-3 py-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {filtro.trim() ? "No se encontraron coincidencias" : "No hay clientes registrados"}
                </p>
              </div>
            )}

            {!loading &&
              filtered.map((c) => {
                const detalle = [c.direccion, c.colonia].filter(Boolean).join(" · ");
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      onSelect({
                        id: c.id,
                        nombre: c.nombre,
                        direccion: c.direccion || "",
                        colonia: c.colonia || "",
                      });
                      setOpen(false);
                      setFiltro("");
                    }}
                    className={`w-full text-left px-3 py-3 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                      isSelected ? "bg-sky-50" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{c.nombre}</p>
                    {detalle ? (
                      <p className="text-xs text-muted-foreground truncate">{detalle}</p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic">Sin dirección</p>
                    )}
                  </button>
                );
              })}
          </div>

          {/* Footer con conteo */}
          {!loading && clientes.length > 0 && (
            <div className="px-3 py-2 border-t border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                {filtered.length} de {clientes.length} clientes
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
