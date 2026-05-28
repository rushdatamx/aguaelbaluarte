-- ============================================================
-- Purificadora El Baluarte — Schema Inicial
-- ============================================================

-- Helper: obtener rol del usuario autenticado
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS text AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- TABLAS
-- ============================================================

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'vendedor')) DEFAULT 'vendedor',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Catálogo de productos
CREATE TABLE productos (
  id text PRIMARY KEY, -- slug: ej. 'dom-llenado-20l'
  nombre text NOT NULL,
  canal text NOT NULL CHECK (canal IN ('domicilio', 'fisico')),
  precio numeric(10,2) NOT NULL,
  unidad text NOT NULL DEFAULT 'pza',
  litros_por_unidad numeric(10,2),
  orden int NOT NULL DEFAULT 0,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Clientes
CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  telefono text,
  direccion text,
  colonia text,
  referencia text,
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ventas (header)
CREATE TABLE ventas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_venta serial UNIQUE,
  cliente_id uuid REFERENCES clientes(id),
  fuente text NOT NULL CHECK (fuente IN ('domicilio', 'fisico')),
  turno text CHECK (turno IN ('matutino', 'vespertino')),
  estado text NOT NULL DEFAULT 'entregado' CHECK (estado IN ('pendiente', 'en_camino', 'entregado', 'cancelado')),
  estado_pago text NOT NULL DEFAULT 'pagado' CHECK (estado_pago IN ('pagado', 'no_pagado')),
  metodo_pago text NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia', 'credito')),
  lectura_inicial numeric(12,2),
  lectura_final numeric(12,2),
  evidencia_url text,
  monto_total numeric(10,2) NOT NULL DEFAULT 0,
  fecha_venta date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Líneas de venta (items)
CREATE TABLE venta_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venta_id uuid NOT NULL REFERENCES ventas(id) ON DELETE CASCADE,
  producto_id text NOT NULL REFERENCES productos(id),
  cantidad int NOT NULL CHECK (cantidad > 0),
  precio_unitario numeric(10,2) NOT NULL,
  monto_total numeric(10,2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX idx_ventas_fecha ON ventas(fecha_venta);
CREATE INDEX idx_ventas_fuente ON ventas(fuente);
CREATE INDEX idx_ventas_cliente ON ventas(cliente_id);
CREATE INDEX idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX idx_venta_items_venta ON venta_items(venta_id);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);
CREATE INDEX idx_clientes_activo ON clientes(activo);

-- ============================================================
-- SEED: Productos
-- ============================================================

INSERT INTO productos (id, nombre, canal, precio, unidad, litros_por_unidad, orden) VALUES
  -- Domicilio
  ('dom-llenado-20l',   'Llenado Garrafón 20L',  'domicilio', 25.00,  'pza', NULL, 1),
  ('dom-garrafon-20l',  'Garrafón 20L (nuevo)',   'domicilio', 110.00, 'pza', NULL, 2),
  ('dom-botella-1l',    'Botella 1L',             'domicilio', 9.00,   'pza', NULL, 3),
  ('dom-botella-500ml', 'Botella 500ml',          'domicilio', 6.00,   'pza', NULL, 4),
  -- Físico
  ('fis-llenado-20l',   'Llenado Garrafón 20L',  'fisico',    20.00,  'pza', 20, 1),
  ('fis-llenado-4-10l', 'Llenado Garrafón 4-10L','fisico',    10.00,  'litro', 1, 2),
  ('fis-garrafon-20l',  'Garrafón 20L (nuevo)',   'fisico',    110.00, 'pza', 20, 3),
  ('fis-botella-1l',    'Botella 1L',             'fisico',    10.00,  'pza', 1,  4);

-- ============================================================
-- VIEWS: KPIs del Dashboard
-- ============================================================

-- Vista: KPIs principales
CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  -- Ingresos hoy
  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta = CURRENT_DATE AND estado != 'cancelado'
  ), 0) AS ingresos_hoy,

  -- Ingresos semana (lunes a hoy)
  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('week', CURRENT_DATE)
      AND estado != 'cancelado'
  ), 0) AS ingresos_semana,

  -- Ingresos mes actual
  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('month', CURRENT_DATE)
      AND estado != 'cancelado'
  ), 0) AS ingresos_mes,

  -- Ingresos mes anterior
  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('month', CURRENT_DATE - interval '1 month')
      AND fecha_venta < date_trunc('month', CURRENT_DATE)
      AND estado != 'cancelado'
  ), 0) AS ingresos_mes_anterior,

  -- Entregas domicilio hoy (entregadas)
  COUNT(*) FILTER (
    WHERE fecha_venta = CURRENT_DATE AND fuente = 'domicilio' AND estado = 'entregado'
  ) AS entregas_hoy,

  -- Pendientes hoy
  COUNT(*) FILTER (
    WHERE fecha_venta = CURRENT_DATE AND fuente = 'domicilio' AND estado IN ('pendiente', 'en_camino')
  ) AS pendientes_hoy,

  -- Total ventas hoy
  COUNT(*) FILTER (
    WHERE fecha_venta = CURRENT_DATE AND estado != 'cancelado'
  ) AS total_ventas_hoy
FROM ventas;

-- Vista: Ingresos últimos 7 días
CREATE OR REPLACE VIEW v_ingresos_7_dias AS
SELECT
  d.fecha,
  to_char(d.fecha, 'Dy') AS dia,
  COALESCE(SUM(v.monto_total), 0) AS monto
FROM generate_series(
  CURRENT_DATE - interval '6 days',
  CURRENT_DATE,
  interval '1 day'
) AS d(fecha)
LEFT JOIN ventas v
  ON v.fecha_venta = d.fecha
  AND v.estado != 'cancelado'
GROUP BY d.fecha
ORDER BY d.fecha;

-- Vista: Desglose por producto hoy
CREATE OR REPLACE VIEW v_desglose_hoy AS
SELECT
  p.id AS producto_id,
  p.nombre,
  p.unidad,
  COALESCE(SUM(vi.cantidad), 0) AS cantidad,
  COALESCE(SUM(vi.monto_total), 0) AS monto,
  COUNT(DISTINCT v.id) AS num_ventas
FROM productos p
LEFT JOIN venta_items vi ON vi.producto_id = p.id
LEFT JOIN ventas v ON v.id = vi.venta_id
  AND v.fecha_venta = CURRENT_DATE
  AND v.estado != 'cancelado'
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.unidad, p.orden
ORDER BY p.orden;

-- Vista: Desglose por producto mes
CREATE OR REPLACE VIEW v_desglose_mes AS
SELECT
  p.id AS producto_id,
  p.nombre,
  p.unidad,
  COALESCE(SUM(vi.cantidad), 0) AS cantidad,
  COALESCE(SUM(vi.monto_total), 0) AS monto,
  COUNT(DISTINCT v.id) AS num_ventas
FROM productos p
LEFT JOIN venta_items vi ON vi.producto_id = p.id
LEFT JOIN ventas v ON v.id = vi.venta_id
  AND v.fecha_venta >= date_trunc('month', CURRENT_DATE)
  AND v.estado != 'cancelado'
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.unidad, p.orden
ORDER BY p.orden;

-- Vista: Estadísticas de clientes
CREATE OR REPLACE VIEW v_cliente_stats AS
SELECT
  c.id,
  c.nombre,
  c.telefono,
  c.direccion,
  c.colonia,
  c.referencia,
  c.notas,
  c.activo,
  c.created_at,
  COUNT(v.id) AS total_pedidos,
  COALESCE(SUM(v.monto_total), 0) AS total_gastado,
  MAX(v.fecha_venta) AS ultimo_pedido
FROM clientes c
LEFT JOIN ventas v ON v.cliente_id = c.id AND v.estado != 'cancelado'
GROUP BY c.id;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE venta_items ENABLE ROW LEVEL SECURITY;

-- user_profiles: cada usuario lee su perfil, admin lee todos
CREATE POLICY "Users read own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid() OR auth.user_role() = 'admin');

CREATE POLICY "Admin manages profiles"
  ON user_profiles FOR ALL
  USING (auth.user_role() = 'admin');

-- productos: todos leen, solo admin modifica
CREATE POLICY "Everyone reads products"
  ON productos FOR SELECT
  USING (true);

CREATE POLICY "Admin manages products"
  ON productos FOR ALL
  USING (auth.user_role() = 'admin');

-- clientes: todos leen e insertan, solo admin actualiza/elimina
CREATE POLICY "Everyone reads clients"
  ON clientes FOR SELECT
  USING (true);

CREATE POLICY "Everyone inserts clients"
  ON clientes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin updates clients"
  ON clientes FOR UPDATE
  USING (auth.user_role() = 'admin');

CREATE POLICY "Admin deletes clients"
  ON clientes FOR DELETE
  USING (auth.user_role() = 'admin');

-- ventas: todos leen e insertan, solo admin actualiza/elimina
CREATE POLICY "Everyone reads sales"
  ON ventas FOR SELECT
  USING (true);

CREATE POLICY "Everyone inserts sales"
  ON ventas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin updates sales"
  ON ventas FOR UPDATE
  USING (auth.user_role() = 'admin');

CREATE POLICY "Admin deletes sales"
  ON ventas FOR DELETE
  USING (auth.user_role() = 'admin');

-- venta_items: todos leen e insertan, solo admin actualiza/elimina
CREATE POLICY "Everyone reads sale items"
  ON venta_items FOR SELECT
  USING (true);

CREATE POLICY "Everyone inserts sale items"
  ON venta_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin updates sale items"
  ON venta_items FOR UPDATE
  USING (auth.user_role() = 'admin');

CREATE POLICY "Admin deletes sale items"
  ON venta_items FOR DELETE
  USING (auth.user_role() = 'admin');
