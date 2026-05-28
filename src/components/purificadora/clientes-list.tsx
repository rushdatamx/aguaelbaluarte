"use client";

import { useState, useMemo } from "react";
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
import { Search, Users } from "lucide-react";
import type { ClienteStats } from "@/lib/types";

interface ClientesListProps {
  clientes: ClienteStats[];
  totalClientes: number;
}

export function ClientesList({ clientes, totalClientes }: ClientesListProps) {
  const [search, setSearch] = useState("");

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
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {clientes.length} clientes activos de {totalClientes} registrados
        </p>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cliente) => (
                  <TableRow key={cliente.id}>
                    <TableCell className="text-sm font-medium">{cliente.nombre}</TableCell>
                    <TableCell className="text-sm font-mono">{cliente.telefono || "-"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{cliente.colonia || "-"}</TableCell>
                    <TableCell className="text-right text-sm">{cliente.total_pedidos}</TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      ${(cliente.total_gastado || 0).toLocaleString("es-MX")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cliente.ultimo_pedido || "-"}
                    </TableCell>
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
                  <p className="text-sm font-medium">{cliente.nombre}</p>
                  <p className="text-sm font-bold text-sky-600 ml-2 shrink-0">
                    ${(cliente.total_gastado || 0).toLocaleString("es-MX")}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground font-mono">{cliente.telefono || "-"}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{cliente.colonia || "-"} &middot; {cliente.total_pedidos} pedidos</span>
                  <span>{cliente.ultimo_pedido || "-"}</span>
                </div>
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
    </div>
  );
}
