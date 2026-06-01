"use client";

import { useState, useMemo, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Search, Users, Plus, Loader2, UserPlus, Pencil } from "lucide-react";
import { crearCliente, actualizarCliente } from "@/lib/actions/clientes";
import { useRouter } from "next/navigation";
import type { ClienteStats } from "@/lib/types";

interface ClientesListProps {
  clientes: ClienteStats[];
  totalClientes: number;
  isAdmin: boolean;
}

const PUBLICO_EN_GENERAL_ID = "00000000-0000-0000-0000-000000000001";

export function ClientesList({ clientes, totalClientes, isAdmin }: ClientesListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  // Form state
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [colonia, setColonia] = useState("");
  const [referencia, setReferencia] = useState("");
  const [notas, setNotas] = useState("");

  const resetForm = () => {
    setNombre("");
    setTelefono("");
    setDireccion("");
    setColonia("");
    setReferencia("");
    setNotas("");
    setFormError("");
    setEditId(null);
  };

  const openEdit = (cliente: ClienteStats) => {
    if (cliente.id === PUBLICO_EN_GENERAL_ID) return;
    setEditId(cliente.id);
    setNombre(cliente.nombre);
    setTelefono(cliente.telefono || "");
    setDireccion(cliente.direccion || "");
    setColonia(cliente.colonia || "");
    setReferencia(cliente.referencia || "");
    setNotas(cliente.notas || "");
    setFormError("");
    setSheetOpen(true);
  };

  const openCreate = () => {
    resetForm();
    setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!nombre.trim()) {
      setFormError("El nombre es obligatorio");
      return;
    }

    startTransition(async () => {
      const payload = {
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        direccion: direccion.trim() || undefined,
        colonia: colonia.trim() || undefined,
        referencia: referencia.trim() || undefined,
        notas: notas.trim() || undefined,
      };

      const result = editId
        ? await actualizarCliente({ id: editId, ...payload })
        : await crearCliente(payload);

      if (result.error) {
        setFormError(result.error);
        return;
      }

      resetForm();
      setSheetOpen(false);
      router.refresh();
    });
  };

  const filtered = useMemo(() => {
    if (!search) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono || "").includes(q) ||
        (c.direccion || "").toLowerCase().includes(q) ||
        (c.colonia || "").toLowerCase().includes(q)
    );
  }, [search, clientes]);

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 md:mb-8 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {clientes.length} clientes activos de {totalClientes} registrados
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="h-11 md:h-10 px-4 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden md:inline">Nuevo Cliente</span>
            <span className="md:hidden">Nuevo</span>
          </button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium">Base de Clientes</CardTitle>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, telefono, colonia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 md:h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Desktop: table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Telefono</TableHead>
                  <TableHead>Colonia</TableHead>
                  <TableHead className="text-right">Pedidos</TableHead>
                  <TableHead className="text-right">Total Gastado</TableHead>
                  <TableHead>Ultimo Pedido</TableHead>
                  {isAdmin && <TableHead className="w-[60px] text-center"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="text-sm font-medium">
                      <div className="flex items-center gap-2">
                        {cliente.nombre}
                        {cliente.id === PUBLICO_EN_GENERAL_ID && (
                          <Badge variant="secondary" className="text-[10px]">
                            Predeterminado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{cliente.telefono || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cliente.colonia || "-"}</TableCell>
                    <TableCell className="text-right text-sm">{cliente.total_pedidos}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${(cliente.total_gastado || 0).toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cliente.ultimo_pedido || "-"}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-center">
                        {cliente.id !== PUBLICO_EN_GENERAL_ID && (
                          <button
                            type="button"
                            onClick={() => openEdit(cliente)}
                            className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors mx-auto"
                            aria-label="Editar cliente"
                            title="Editar cliente"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile: card list */}
          <div className="md:hidden space-y-2">
            {filtered.map((cliente) => (
              <div
                key={cliente.id}
                className="rounded-lg border border-border/50 p-3 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium">{cliente.nombre}</p>
                    {cliente.id === PUBLICO_EN_GENERAL_ID && (
                      <Badge variant="secondary" className="text-[10px]">
                        Predeterminado
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-bold text-sky-600 ml-2 shrink-0">
                    ${(cliente.total_gastado || 0).toLocaleString("es-MX")}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{cliente.telefono || "-"}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{cliente.colonia || "-"} &middot; {cliente.total_pedidos} pedidos</span>
                  <span>{cliente.ultimo_pedido || "-"}</span>
                </div>
                {isAdmin && cliente.id !== PUBLICO_EN_GENERAL_ID && (
                  <button
                    type="button"
                    onClick={() => openEdit(cliente)}
                    className="w-full h-9 mt-1 flex items-center justify-center gap-1.5 rounded-md border border-border bg-background text-muted-foreground hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition-colors text-xs font-medium"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </button>
                )}
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No se encontraron clientes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sheet: Nuevo Cliente */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) resetForm();
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-base">
              {editId ? (
                <Pencil className="h-4 w-4 text-sky-500" />
              ) : (
                <UserPlus className="h-4 w-4 text-sky-500" />
              )}
              {editId ? "Editar Cliente" : "Nuevo Cliente"}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {editId
                ? "Actualiza los datos del cliente"
                : "Registra un nuevo cliente en la base de datos"}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Teléfono
              </label>
              <Input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="81 1234 5678"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Dirección
              </label>
              <Input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle, número"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Colonia
              </label>
              <Input
                type="text"
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                placeholder="Colonia"
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Referencia
              </label>
              <Input
                type="text"
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Entre calles, color de casa, etc."
                className="h-11"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Información adicional..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none"
              />
            </div>

            {formError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">
                {formError}
              </p>
            )}
          </form>

          <div className="border-t border-border p-4 flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setSheetOpen(false);
              }}
              disabled={isPending}
              className="flex-1 h-11 rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isPending || !nombre.trim()}
              className="flex-1 h-11 bg-sky-500 text-white rounded-lg text-sm font-bold hover:bg-sky-600 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending
                ? "Guardando..."
                : editId
                  ? "Guardar Cambios"
                  : "Crear Cliente"}
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
