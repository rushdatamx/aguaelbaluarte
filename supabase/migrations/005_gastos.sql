-- ============================================================
-- 005 — Módulo de Gastos (egresos)
-- ============================================================
-- Registro de gastos del negocio (gasolina, insumos, mantenimiento, etc.).
--   - Cualquier usuario autenticado puede registrar (INSERT).
--   - Solo admin modifica/cancela (UPDATE/DELETE) — el historial es admin-only en la UI.
-- Fecha en hora de México vía hoy_mexico() (definida en 002).
-- Soft-delete con estado='cancelado' (igual que ventas).
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

CREATE TABLE IF NOT EXISTS gastos (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_gasto  serial UNIQUE,
  concepto      text NOT NULL,
  monto         numeric(10,2) NOT NULL CHECK (monto >= 0),
  metodo_pago   text NOT NULL DEFAULT 'efectivo'
                  CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  evidencia_url text,
  notas         text,
  estado        text NOT NULL DEFAULT 'activo'
                  CHECK (estado IN ('activo', 'cancelado')),
  fecha         date NOT NULL DEFAULT hoy_mexico(),
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gastos_fecha  ON gastos(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_estado ON gastos(estado);

-- ============================================================
-- RLS
-- ============================================================
-- Todos leen e insertan; solo admin modifica/elimina.
-- (El helper de rol vive en public, no en auth.)
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone reads gastos" ON gastos;
CREATE POLICY "Everyone reads gastos"
  ON gastos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Everyone inserts gastos" ON gastos;
CREATE POLICY "Everyone inserts gastos"
  ON gastos FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin updates gastos" ON gastos;
CREATE POLICY "Admin updates gastos"
  ON gastos FOR UPDATE USING (public.user_role() = 'admin');

DROP POLICY IF EXISTS "Admin deletes gastos" ON gastos;
CREATE POLICY "Admin deletes gastos"
  ON gastos FOR DELETE USING (public.user_role() = 'admin');
