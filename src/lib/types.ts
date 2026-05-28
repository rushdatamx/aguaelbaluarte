export interface Producto {
  id: string;
  nombre: string;
  canal: "domicilio" | "fisico";
  precio: number;
  unidad: string;
  litros_por_unidad: number | null;
  orden: number;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  direccion: string | null;
  colonia: string | null;
  referencia: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
}

export interface ClienteStats extends Cliente {
  total_pedidos: number;
  total_gastado: number;
  ultimo_pedido: string | null;
}

export interface VentaItemInput {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface VentaInput {
  cliente_id?: string | null;
  fuente: "domicilio" | "fisico";
  turno?: "matutino" | "vespertino" | null;
  estado: "pendiente" | "en_camino" | "entregado" | "cancelado";
  estado_pago: "pagado" | "no_pagado";
  metodo_pago: "efectivo" | "transferencia" | "credito";
  lectura_inicial?: number | null;
  lectura_final?: number | null;
  evidencia_url?: string | null;
  items: VentaItemInput[];
}

export interface VentaRow {
  id: string;
  numero_venta: number;
  cliente_id: string | null;
  fuente: string;
  turno: string | null;
  estado: string;
  estado_pago: string;
  metodo_pago: string;
  lectura_inicial: number | null;
  lectura_final: number | null;
  evidencia_url: string | null;
  monto_total: number;
  fecha_venta: string;
  created_by: string | null;
  created_at: string;
}

export interface VentaConDetalles extends VentaRow {
  clientes: { nombre: string; colonia: string } | null;
  venta_items: {
    cantidad: number;
    precio_unitario: number;
    monto_total: number;
    productos: { nombre: string; unidad: string } | null;
  }[];
}

export type UserRole = "admin" | "vendedor_fisico" | "vendedor_domicilio";

export interface UserProfile {
  id: string;
  nombre: string;
  role: UserRole;
  activo: boolean;
}

export interface DashboardKpis {
  ingresos_hoy: number;
  ingresos_semana: number;
  ingresos_mes: number;
  ingresos_mes_anterior: number;
  entregas_hoy: number;
  pendientes_hoy: number;
  total_ventas_hoy: number;
}

export interface DesgloseProducto {
  producto_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  monto: number;
  num_ventas: number;
}

export interface Ingreso7Dias {
  fecha: string;
  dia: string;
  monto: number;
}
