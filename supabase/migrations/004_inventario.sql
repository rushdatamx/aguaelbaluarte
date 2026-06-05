-- ============================================================
-- 004 — Módulo de Inventario
-- ============================================================
-- Inventario por TIPO (garrafon / litro), no producto por producto.
--   - productos.tipo_inventario: mapea cada producto a un tipo (o NULL = no es inventario)
--   - inventario: stock actual + último costo por tipo (2 filas)
--   - inventario_movimientos: historial fechado (compra / venta / ajuste)
--   - fn_inventario_compra / _ajuste: entradas y correcciones manuales (admin)
--   - fn_inventario_aplicar_venta / _revertir_venta: descuento automático al vender
--
-- Costeo a ÚLTIMO costo de compra (precio variable, cada compra queda fechada).
-- Stock negativo PERMITIDO (la venta es la fuente de verdad; se resalta en rojo en la UI).
-- Fechas en hora de México vía hoy_mexico() (definida en 002).
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Mapeo producto → tipo de inventario
--    NULL = el producto no descuenta inventario (ej. "Llenado Garrafón" = agua).
-- ------------------------------------------------------------
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS tipo_inventario text
  CHECK (tipo_inventario IN ('garrafon', 'litro'));

-- ------------------------------------------------------------
-- 2. Stock por tipo (2 filas: garrafon, litro)
--    stock_actual y ultimo_costo se mantienen vía las RPCs de abajo.
--    "Inventario a costo" = stock_actual * ultimo_costo (se calcula en el cliente).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario (
  tipo            text PRIMARY KEY CHECK (tipo IN ('garrafon', 'litro')),
  nombre          text NOT NULL,
  stock_actual    numeric(12,2) NOT NULL DEFAULT 0,
  ultimo_costo    numeric(10,2) NOT NULL DEFAULT 0,
  cantidad_minima numeric(12,2) NOT NULL DEFAULT 0,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

INSERT INTO inventario (tipo, nombre) VALUES
  ('garrafon', 'Garrafones'),
  ('litro',    'Botellas de litro')
ON CONFLICT (tipo) DO NOTHING;

-- ------------------------------------------------------------
-- 3. Movimientos de inventario (historial — la "hoja de registro")
--    cantidad: + entra (compra/ajuste positivo), - sale (venta/ajuste negativo)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo           text NOT NULL REFERENCES inventario(tipo),
  clase          text NOT NULL CHECK (clase IN ('compra', 'venta', 'ajuste')),
  cantidad       numeric(12,2) NOT NULL,
  costo_unitario numeric(10,2),       -- solo en 'compra'
  costo_total    numeric(12,2),       -- cantidad * costo_unitario (en 'compra')
  venta_id       uuid REFERENCES ventas(id) ON DELETE SET NULL,
  motivo         text,                -- nota libre (en 'ajuste')
  fecha          date NOT NULL DEFAULT hoy_mexico(),
  created_by     uuid REFERENCES auth.users(id),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inv_mov_tipo  ON inventario_movimientos(tipo);
CREATE INDEX IF NOT EXISTS idx_inv_mov_fecha ON inventario_movimientos(fecha);
CREATE INDEX IF NOT EXISTS idx_inv_mov_venta ON inventario_movimientos(venta_id);

-- ============================================================
-- RPCs
-- ============================================================

-- ------------------------------------------------------------
-- 4.1 Registrar COMPRA (entrada con costo fechado) — admin
--     Suma stock y fija el último costo.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_inventario_compra(
  p_tipo           text,
  p_cantidad       numeric,
  p_costo_unitario numeric,
  p_fecha          date DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  v_fecha date := COALESCE(p_fecha, hoy_mexico());
BEGIN
  IF p_cantidad <= 0 THEN
    RAISE EXCEPTION 'La cantidad de la compra debe ser mayor a 0';
  END IF;

  INSERT INTO inventario_movimientos
    (tipo, clase, cantidad, costo_unitario, costo_total, fecha, created_by)
  VALUES
    (p_tipo, 'compra', p_cantidad, p_costo_unitario,
     p_cantidad * p_costo_unitario, v_fecha, auth.uid());

  UPDATE inventario
  SET stock_actual = stock_actual + p_cantidad,
      ultimo_costo = p_costo_unitario,
      updated_at   = now()
  WHERE tipo = p_tipo;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.fn_inventario_compra(text, numeric, numeric, date) TO authenticated;

-- ------------------------------------------------------------
-- 4.2 Registrar AJUSTE (corrección manual: merma, recuento) — admin
--     p_cantidad puede ser + o -.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_inventario_ajuste(
  p_tipo     text,
  p_cantidad numeric,
  p_motivo   text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF p_cantidad = 0 THEN
    RAISE EXCEPTION 'El ajuste no puede ser 0';
  END IF;

  INSERT INTO inventario_movimientos
    (tipo, clase, cantidad, motivo, fecha, created_by)
  VALUES
    (p_tipo, 'ajuste', p_cantidad, p_motivo, hoy_mexico(), auth.uid());

  UPDATE inventario
  SET stock_actual = stock_actual + p_cantidad,
      updated_at   = now()
  WHERE tipo = p_tipo;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.fn_inventario_ajuste(text, numeric, text) TO authenticated;

-- ------------------------------------------------------------
-- 4.3 Aplicar VENTA (descuento automático) — gatillado al registrar/editar venta
--     SECURITY DEFINER: corre con permisos del dueño para que un VENDEDOR
--     pueda gatillar el descuento sin tener escritura directa sobre inventario.
--     Idempotente: primero revierte movimientos 'venta' previos de esa venta
--     (re-sumando su stock) y luego recalcula desde los venta_items actuales.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_inventario_aplicar_venta(
  p_venta_id uuid
)
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  -- 1) Revertir cualquier descuento previo de esta venta (para re-editar limpio)
  FOR r IN
    SELECT tipo, SUM(cantidad) AS cant
    FROM inventario_movimientos
    WHERE venta_id = p_venta_id AND clase = 'venta'
    GROUP BY tipo
  LOOP
    -- cant es negativa (salidas); restarla devuelve el stock
    UPDATE inventario
    SET stock_actual = stock_actual - r.cant,
        updated_at   = now()
    WHERE tipo = r.tipo;
  END LOOP;

  DELETE FROM inventario_movimientos
  WHERE venta_id = p_venta_id AND clase = 'venta';

  -- 2) Recalcular descuento desde los items actuales, agrupando por tipo_inventario
  --    (ignora productos con tipo_inventario NULL = no son inventario)
  FOR r IN
    SELECT pr.tipo_inventario AS tipo, SUM(vi.cantidad) AS cant
    FROM venta_items vi
    JOIN productos pr ON pr.id = vi.producto_id
    JOIN ventas v ON v.id = vi.venta_id
    WHERE vi.venta_id = p_venta_id
      AND pr.tipo_inventario IS NOT NULL
      AND v.estado <> 'cancelado'
    GROUP BY pr.tipo_inventario
  LOOP
    INSERT INTO inventario_movimientos
      (tipo, clase, cantidad, venta_id, fecha)
    VALUES
      (r.tipo, 'venta', -r.cant, p_venta_id, hoy_mexico());

    UPDATE inventario
    SET stock_actual = stock_actual - r.cant,
        updated_at   = now()
    WHERE tipo = r.tipo;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.fn_inventario_aplicar_venta(uuid) TO authenticated;

-- ------------------------------------------------------------
-- 4.4 Revertir VENTA (al cancelar) — devuelve el stock descontado
--     SECURITY DEFINER por la misma razón que aplicar_venta.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_inventario_revertir_venta(
  p_venta_id uuid
)
RETURNS void AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tipo, SUM(cantidad) AS cant
    FROM inventario_movimientos
    WHERE venta_id = p_venta_id AND clase = 'venta'
    GROUP BY tipo
  LOOP
    -- cant es negativa; restarla regresa el stock
    UPDATE inventario
    SET stock_actual = stock_actual - r.cant,
        updated_at   = now()
    WHERE tipo = r.tipo;
  END LOOP;

  DELETE FROM inventario_movimientos
  WHERE venta_id = p_venta_id AND clase = 'venta';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.fn_inventario_revertir_venta(uuid) TO authenticated;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_movimientos ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier autenticado. Escritura directa: solo admin.
-- (El descuento por venta entra vía fn_inventario_aplicar_venta = SECURITY DEFINER,
--  por lo que no necesita policy de escritura para vendedores.)
DROP POLICY IF EXISTS "Everyone reads inventario" ON inventario;
CREATE POLICY "Everyone reads inventario"
  ON inventario FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages inventario" ON inventario;
CREATE POLICY "Admin manages inventario"
  ON inventario FOR ALL USING (public.user_role() = 'admin');

DROP POLICY IF EXISTS "Everyone reads inv movimientos" ON inventario_movimientos;
CREATE POLICY "Everyone reads inv movimientos"
  ON inventario_movimientos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manages inv movimientos" ON inventario_movimientos;
CREATE POLICY "Admin manages inv movimientos"
  ON inventario_movimientos FOR ALL USING (public.user_role() = 'admin');
