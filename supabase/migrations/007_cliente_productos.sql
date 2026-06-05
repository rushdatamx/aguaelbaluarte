-- ============================================================
-- 007 — Productos por cliente (catálogo personalizado en Domicilio)
-- ============================================================
-- Relación muchos-a-muchos cliente ↔ producto. Permite que cada cliente
-- de Ventas Domicilio vea solo los productos que se le ofrecen.
--   - Si un producto NO tiene ninguna fila aquí → se ofrece a TODOS (default).
--   - Si tiene filas → solo aparece para los clientes listados.
-- Solo aplica al canal domicilio (Físico no usa cliente).
-- PKs reales: clientes.id = uuid, productos.id = text (slug).
-- Idempotente (IF NOT EXISTS / CREATE OR REPLACE).
-- ============================================================

CREATE TABLE IF NOT EXISTS cliente_productos (
  cliente_id  uuid NOT NULL REFERENCES clientes(id)  ON DELETE CASCADE,
  producto_id text NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cliente_id, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_cliente_productos_cliente  ON cliente_productos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_productos_producto ON cliente_productos(producto_id);

-- ============================================================
-- RLS
-- ============================================================
-- Lectura: todos (el formulario de domicilio la consulta en runtime).
-- Escritura: solo admin (la config vive en /productos, admin-only).
-- (El helper de rol vive en public, no en auth.)
ALTER TABLE cliente_productos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone reads cliente_productos" ON cliente_productos;
CREATE POLICY "Everyone reads cliente_productos"
  ON cliente_productos FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin inserts cliente_productos" ON cliente_productos;
CREATE POLICY "Admin inserts cliente_productos"
  ON cliente_productos FOR INSERT WITH CHECK (public.user_role() = 'admin');

DROP POLICY IF EXISTS "Admin deletes cliente_productos" ON cliente_productos;
CREATE POLICY "Admin deletes cliente_productos"
  ON cliente_productos FOR DELETE USING (public.user_role() = 'admin');
