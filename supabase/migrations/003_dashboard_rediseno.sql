-- ============================================================
-- 003 — Rediseño del Dashboard
-- ============================================================
-- Agrega funciones y vistas para el nuevo dashboard:
--   - fn_kpis_rango: KPIs según un rango de fechas arbitrario
--   - fn_desglose_producto_canal: ventas por producto Y canal (fisico/domicilio)
--   - fn_resumen_dia: totales del rango (ingresos, pza/litros, entregas)
--   - v_tendencia_12_meses: ingresos mensuales de los últimos 12 meses
--   - v_sparklines_kpi: serie diaria (14 días) para las mini-gráficas de KPIs
--
-- Todo en hora de México vía hoy_mexico() (definida en 002).
-- Las funciones son STABLE y SECURITY INVOKER (respetan RLS).
-- ============================================================

-- ------------------------------------------------------------
-- 1. KPIs por rango de fechas
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_kpis_rango(
  p_desde date,
  p_hasta date,
  p_canal text DEFAULT 'todos',        -- 'todos' | 'fisico' | 'domicilio'
  p_estado_pago text DEFAULT 'todos'   -- 'todos' | 'pagado' | 'no_pagado'
)
RETURNS TABLE (
  ingresos numeric,
  num_ventas bigint,
  entregas_completadas bigint,
  entregas_total bigint,
  ventas_pza bigint,
  ventas_litros numeric
) AS $$
  SELECT
    COALESCE(SUM(v.monto_total), 0)                                              AS ingresos,
    COUNT(DISTINCT v.id)                                                         AS num_ventas,
    COUNT(DISTINCT v.id) FILTER (
      WHERE v.fuente = 'domicilio' AND v.estado = 'entregado'
    )                                                                            AS entregas_completadas,
    COUNT(DISTINCT v.id) FILTER (
      WHERE v.fuente = 'domicilio'
    )                                                                            AS entregas_total,
    -- piezas vendidas (productos con unidad != 'litro')
    COALESCE(SUM(vi.cantidad) FILTER (WHERE p.unidad <> 'litro'), 0)             AS ventas_pza,
    -- litros vendidos (productos con unidad = 'litro')
    COALESCE(SUM(vi.cantidad) FILTER (WHERE p.unidad = 'litro'), 0)              AS ventas_litros
  FROM ventas v
  LEFT JOIN venta_items vi ON vi.venta_id = v.id
  LEFT JOIN productos p ON p.id = vi.producto_id
  WHERE v.fecha_venta BETWEEN p_desde AND p_hasta
    AND v.estado <> 'cancelado'
    AND (p_canal = 'todos' OR v.fuente = p_canal)
    AND (p_estado_pago = 'todos' OR v.estado_pago = p_estado_pago);
$$ LANGUAGE sql STABLE SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.fn_kpis_rango(date, date, text, text) TO authenticated;

-- ------------------------------------------------------------
-- 2. Desglose por producto Y canal (fisico/domicilio)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_desglose_producto_canal(
  p_desde date,
  p_hasta date,
  p_estado_pago text DEFAULT 'todos'   -- 'todos' | 'pagado' | 'no_pagado'
)
RETURNS TABLE (
  producto_id text,
  nombre text,
  unidad text,
  orden int,
  cantidad_total numeric,
  monto_total numeric,
  num_ventas_total bigint,
  cantidad_fisico numeric,
  monto_fisico numeric,
  num_ventas_fisico bigint,
  cantidad_domicilio numeric,
  monto_domicilio numeric,
  num_ventas_domicilio bigint
) AS $$
  SELECT
    p.id,
    p.nombre,
    p.unidad,
    p.orden,
    COALESCE(SUM(vi.cantidad), 0)                                                  AS cantidad_total,
    COALESCE(SUM(vi.monto_total), 0)                                               AS monto_total,
    COUNT(DISTINCT v.id)                                                           AS num_ventas_total,
    COALESCE(SUM(vi.cantidad)    FILTER (WHERE v.fuente = 'fisico'), 0)            AS cantidad_fisico,
    COALESCE(SUM(vi.monto_total) FILTER (WHERE v.fuente = 'fisico'), 0)            AS monto_fisico,
    COUNT(DISTINCT v.id)         FILTER (WHERE v.fuente = 'fisico')                AS num_ventas_fisico,
    COALESCE(SUM(vi.cantidad)    FILTER (WHERE v.fuente = 'domicilio'), 0)         AS cantidad_domicilio,
    COALESCE(SUM(vi.monto_total) FILTER (WHERE v.fuente = 'domicilio'), 0)         AS monto_domicilio,
    COUNT(DISTINCT v.id)         FILTER (WHERE v.fuente = 'domicilio')             AS num_ventas_domicilio
  FROM productos p
  LEFT JOIN venta_items vi ON vi.producto_id = p.id
  LEFT JOIN ventas v ON v.id = vi.venta_id
    AND v.fecha_venta BETWEEN p_desde AND p_hasta
    AND v.estado <> 'cancelado'
    AND (p_estado_pago = 'todos' OR v.estado_pago = p_estado_pago)
  WHERE p.activo = true
  GROUP BY p.id, p.nombre, p.unidad, p.orden
  ORDER BY p.orden;
$$ LANGUAGE sql STABLE SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.fn_desglose_producto_canal(date, date, text) TO authenticated;

-- ------------------------------------------------------------
-- 3. Resumen del día / rango (totales)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_resumen_dia(
  p_desde date,
  p_hasta date,
  p_canal text DEFAULT 'todos',        -- 'todos' | 'fisico' | 'domicilio'
  p_estado_pago text DEFAULT 'todos'   -- 'todos' | 'pagado' | 'no_pagado'
)
RETURNS TABLE (
  ingresos_totales numeric,
  ventas_pza bigint,
  ventas_litros numeric,
  num_ventas bigint,
  entregas_completadas bigint,
  entregas_total bigint
) AS $$
  SELECT
    COALESCE(SUM(vi.monto_total), 0)                                  AS ingresos_totales,
    COALESCE(SUM(vi.cantidad) FILTER (WHERE p.unidad <> 'litro'), 0)  AS ventas_pza,
    COALESCE(SUM(vi.cantidad) FILTER (WHERE p.unidad = 'litro'), 0)   AS ventas_litros,
    COUNT(DISTINCT v.id)                                              AS num_ventas,
    COUNT(DISTINCT v.id) FILTER (
      WHERE v.fuente = 'domicilio' AND v.estado = 'entregado'
    )                                                                 AS entregas_completadas,
    COUNT(DISTINCT v.id) FILTER (WHERE v.fuente = 'domicilio')        AS entregas_total
  FROM ventas v
  LEFT JOIN venta_items vi ON vi.venta_id = v.id
  LEFT JOIN productos p ON p.id = vi.producto_id
  WHERE v.fecha_venta BETWEEN p_desde AND p_hasta
    AND v.estado <> 'cancelado'
    AND (p_canal = 'todos' OR v.fuente = p_canal)
    AND (p_estado_pago = 'todos' OR v.estado_pago = p_estado_pago);
$$ LANGUAGE sql STABLE SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.fn_resumen_dia(date, date, text, text) TO authenticated;

-- ------------------------------------------------------------
-- 4. Tendencia de ingresos — últimos 12 meses
--    mes_label se formatea en el cliente (es-MX) para que salga
--    en español; aquí entregamos el periodo (YYYY-MM) y el monto.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_tendencia_12_meses AS
SELECT
  to_char(m.mes, 'YYYY-MM')        AS periodo,
  m.mes                            AS mes_inicio,
  COALESCE(SUM(v.monto_total), 0)  AS monto,
  COUNT(DISTINCT v.id)             AS num_ventas
FROM generate_series(
  date_trunc('month', hoy_mexico()) - interval '11 months',
  date_trunc('month', hoy_mexico()),
  interval '1 month'
) AS m(mes)
LEFT JOIN ventas v
  ON v.fecha_venta >= m.mes
  AND v.fecha_venta < m.mes + interval '1 month'
  AND v.estado <> 'cancelado'
GROUP BY m.mes
ORDER BY m.mes;

-- ------------------------------------------------------------
-- 5. Sparklines — serie diaria de los últimos 14 días
--    Una fila por día con las métricas que alimentan cada
--    mini-gráfica de los KPI cards.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_sparklines_kpi AS
SELECT
  d.fecha,
  COALESCE(SUM(v.monto_total), 0)                                   AS ingresos,
  COUNT(DISTINCT v.id) FILTER (
    WHERE v.fuente = 'domicilio' AND v.estado = 'entregado'
  )                                                                 AS entregas,
  COUNT(DISTINCT v.cliente_id)                                      AS clientes
FROM generate_series(
  hoy_mexico() - interval '13 days',
  hoy_mexico(),
  interval '1 day'
) AS d(fecha)
LEFT JOIN ventas v
  ON v.fecha_venta = d.fecha
  AND v.estado <> 'cancelado'
GROUP BY d.fecha
ORDER BY d.fecha;
