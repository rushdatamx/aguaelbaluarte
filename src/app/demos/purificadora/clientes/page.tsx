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
import data from "../../../../../public/data/purificadora.json";

export default function ClientesPage() {
  const [search, setSearch] = useState("");
  const { clientes, kpis } = data;

  const filtered = useMemo(() => {
    if (!search) return clientes;
    const q = search.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        c.direccion.toLowerCase().includes(q) ||
        c.colonia.toLowerCase().includes(q)
    );
  }, [search, clientes]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {kpis.clientes_activos} clientes activos de {kpis.total_clientes} registrados
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base font-medium">Base de Clientes</CardTitle>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, telefono, colonia..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="text-sm font-mono">{cliente.telefono}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cliente.colonia}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
