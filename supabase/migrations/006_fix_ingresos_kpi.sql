-- ============================================================
-- 006 — Fix: "Ingresos del periodo" inflado en fn_kpis_rango
-- ============================================================
-- PROBLEMA: fn_kpis_rango calculaba ingresos como SUM(v.monto_total),
-- pero la consulta hace LEFT JOIN a venta_items. Cuando una venta tiene
-- N productos, su fila se duplica N veces y monto_total (el total de la
-- venta completa) se suma N veces → ingresos inflados.
-- (Es el mismo problema del CSV que ya se corrigió en el frontend.)
--
-- FIX: sumar vi.monto_total (el monto de cada línea/producto), igual que
-- ya lo hacen fn_resumen_dia y fn_desglose_producto_canal. Así el total
-- es correcto sin importar cuántos productos tenga cada venta.
--
-- El resto de la función queda idéntico: num_ventas y entregas usan
-- COUNT(DISTINCT v.id) (nunca estuvieron infladas), y ventas_pza/litros
-- ya sumaban por item (vi.cantidad).
--
-- Idempotente (CREATE OR REPLACE).
-- ============================================================

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
    -- FIX: suma por item (vi.monto_total), no por venta (v.monto_total),
    -- para no multiplicar el total por el número de productos.
    COALESCE(SUM(vi.monto_total), 0)                                             AS ingresos,
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
