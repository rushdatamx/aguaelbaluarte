-- ============================================================
-- 002 — Zona horaria México (America/Monterrey, UTC-6)
-- ============================================================
-- Problema: el servidor de Supabase corre en UTC. CURRENT_DATE y now()
-- devuelven la fecha/hora en UTC, por lo que una venta registrada de
-- noche en México (que en UTC ya es el día siguiente) quedaba con la
-- fecha equivocada y descuadraba los KPIs de "hoy".
--
-- Solución: derivar SIEMPRE fecha_venta de created_at convertido a la
-- zona horaria de México, tanto en el default como en las views.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Helper: fecha de "hoy" en hora de México
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.hoy_mexico()
RETURNS date AS $$
  SELECT (now() AT TIME ZONE 'America/Monterrey')::date
$$ LANGUAGE sql STABLE;

-- ------------------------------------------------------------
-- 2. Default de fecha_venta → hoy en hora de México
-- ------------------------------------------------------------
ALTER TABLE ventas
  ALTER COLUMN fecha_venta SET DEFAULT (now() AT TIME ZONE 'America/Monterrey')::date;

-- ------------------------------------------------------------
-- 3. Corregir ventas existentes (recalcular desde created_at)
--    created_at es timestamptz (UTC). Lo convertimos a hora México
--    y tomamos la fecha real en que se registró la venta.
-- ------------------------------------------------------------
UPDATE ventas
SET fecha_venta = (created_at AT TIME ZONE 'America/Monterrey')::date
WHERE fecha_venta IS DISTINCT FROM (created_at AT TIME ZONE 'America/Monterrey')::date;

-- ------------------------------------------------------------
-- 4. Recrear views usando hoy_mexico() en vez de CURRENT_DATE
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW v_dashboard_kpis AS
SELECT
  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta = hoy_mexico() AND estado != 'cancelado'
  ), 0) AS ingresos_hoy,

  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('week', hoy_mexico())
      AND estado != 'cancelado'
  ), 0) AS ingresos_semana,

  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('month', hoy_mexico())
      AND estado != 'cancelado'
  ), 0) AS ingresos_mes,

  COALESCE(SUM(monto_total) FILTER (
    WHERE fecha_venta >= date_trunc('month', hoy_mexico() - interval '1 month')
      AND fecha_venta < date_trunc('month', hoy_mexico())
      AND estado != 'cancelado'
  ), 0) AS ingresos_mes_anterior,

  COUNT(*) FILTER (
    WHERE fecha_venta = hoy_mexico() AND fuente = 'domicilio' AND estado = 'entregado'
  ) AS entregas_hoy,

  COUNT(*) FILTER (
    WHERE fecha_venta = hoy_mexico() AND fuente = 'domicilio' AND estado IN ('pendiente', 'en_camino')
  ) AS pendientes_hoy,

  COUNT(*) FILTER (
    WHERE fecha_venta = hoy_mexico() AND estado != 'cancelado'
  ) AS total_ventas_hoy
FROM ventas;

CREATE OR REPLACE VIEW v_ingresos_7_dias AS
SELECT
  d.fecha,
  to_char(d.fecha, 'Dy') AS dia,
  COALESCE(SUM(v.monto_total), 0) AS monto
FROM generate_series(
  hoy_mexico() - interval '6 days',
  hoy_mexico(),
  interval '1 day'
) AS d(fecha)
LEFT JOIN ventas v
  ON v.fecha_venta = d.fecha
  AND v.estado != 'cancelado'
GROUP BY d.fecha
ORDER BY d.fecha;

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
  AND v.fecha_venta = hoy_mexico()
  AND v.estado != 'cancelado'
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.unidad, p.orden
ORDER BY p.orden;

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
  AND v.fecha_venta >= date_trunc('month', hoy_mexico())
  AND v.estado != 'cancelado'
WHERE p.activo = true
GROUP BY p.id, p.nombre, p.unidad, p.orden
ORDER BY p.orden;
