# CLAUDE.md — Purificadora El Baluarte

## Sobre el proyecto

Sistema de gestión de ventas y entregas para **Purificadora El Baluarte**, una purificadora de agua en Monterrey, NL. El sistema tiene dos canales de registro de ventas (Domicilio para entregas, Físico para punto de venta), un dashboard con KPIs, y un historial completo de ventas filtrable.

**Estado actual:** Producción con Supabase (PostgreSQL + Auth). Módulo de inventario activo (garrafón/litro con descuento automático). GPS diferido.

### Cliente
- **Negocio:** Purificadora de agua con entregas a domicilio y ventas en punto de venta
- **Repartidor:** Hace ~30 entregas/día en camioneta (Chevrolet NP300 2021)
- **Administradora:** Registra ventas físicas y supervisa operación desde el dashboard
- **GPS:** PAJ Vehicle Finder 4G instalado en la camioneta
- **Usuarios del sistema:** 1 Admin (acceso total) + vendedores con rol `vendedor_fisico` o `vendedor_domicilio` (solo registrar ventas + clientes)

### Problema que resuelve
Todo se lleva en papel (notas de remisión físicas). No hay visibilidad de ventas en tiempo real y no se sabe cuánto se vendió hasta contar efectivo. El registro de ventas se hace directamente desde la app (Ventas Domicilio y Ventas Físico).

## Stack técnico

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework + App Router |
| React | 19.2.3 | UI Library |
| TypeScript | 5 | Tipado |
| Tailwind CSS | 4 | Estilos (OKLch color space) |
| Supabase | @supabase/ssr + @supabase/supabase-js | Backend (PostgreSQL + Auth) |
| shadcn/ui | new-york style | Componentes UI (Card, Badge, Input, Table, Sheet) |
| Recharts | 3.7.0 | Gráficas (BarChart) |
| Lucide React | 0.563.0 | Iconos |
| Radix UI | 1.4.3 | Primitivos accesibles (paquete unificado `radix-ui`) |
| react-day-picker | 10 | Calendario del rango de fechas del dashboard (locale es) |
| date-fns | 4 | Dependencia de react-day-picker |
| Plus Jakarta Sans | — | Tipografía principal |

### Arquitectura
- **Frontend/Hosting:** Vercel + Next.js
- **Base de datos + Auth:** Supabase (PostgreSQL + Row Level Security)
- **Server Actions:** Para registrar ventas y buscar clientes
- **SQL Views + RPCs:** Para KPIs/desglose del dashboard. El dashboard es un Server shell que monta un Client Component (`DashboardClient`) que consulta funciones RPC parametrizadas por rango desde el browser
- **Zona horaria:** Todo cálculo de fechas en hora de México (ver sección Base de datos → Zona horaria)
- **Roles (3):** `admin` (acceso total) + `vendedor_fisico` / `vendedor_domicilio` (solo formularios de venta + clientes). Los vendedores aterrizan en `/elegir`; el admin en `/`. Definidos en `src/lib/types.ts` (`UserRole`) y aplicados con `requireRole()` de `src/lib/auth.ts`.
- **Inventario:** Módulo por tipo (garrafón / litro) con descuento automático al vender (migración 004)
- **GPS:** Diferido (PAJ-Portal API pendiente)

## Estructura de archivos

```
purificadora-el-baluarte/
├── CLAUDE.md                           # Este archivo
├── vercel.json                         # Config Vercel (framework: nextjs)
├── package.json
├── next.config.ts                      # Redirects legacy /demos/purificadora/* → /*
├── tsconfig.json
├── components.json                     # Config shadcn/ui
├── postcss.config.mjs                  # Config Tailwind CSS
├── .env.local                          # NEXT_PUBLIC_SUPABASE_URL + ANON_KEY
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql      # Schema, seed, views, RLS
│       ├── 002_timezone_mexico.sql     # hoy_mexico(), default fecha_venta MX, corrige histórico, views con hoy_mexico()
│       ├── 003_dashboard_rediseno.sql  # RPCs por rango + views de tendencia/sparklines del dashboard
│       └── 004_inventario.sql          # Inventario por tipo (garrafón/litro), movimientos, RPCs de descuento
├── public/
│   └── images/
│       └── rushdata-logo.png
├── src/
│   ├── middleware.ts                   # Auth middleware (redirect a /login si no hay sesión)
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Plus Jakarta Sans font)
│   │   ├── globals.css                 # Estilos globales + CSS vars + glassmorphism
│   │   ├── login/
│   │   │   └── page.tsx                # Login con email/password (Supabase Auth)
│   │   └── (app)/
│   │       ├── layout.tsx              # Layout con sidebar + AuthProvider (Server Component)
│   │       ├── loading.tsx             # Skeleton loading state
│   │       ├── error.tsx               # Error boundary
│   │       ├── page.tsx                # Dashboard shell (Server, admin only) → DashboardClient
│   │       ├── elegir/
│   │       │   └── page.tsx            # Landing de vendedores: elegir Domicilio o Físico
│   │       ├── ventas-domicilio/
│   │       │   └── page.tsx            # Server wrapper → FormDomicilio
│   │       ├── ventas/
│   │       │   └── page.tsx            # Server wrapper → FormFisico
│   │       ├── todas-ventas/
│   │       │   └── page.tsx            # Server wrapper → VentasList (admin only)
│   │       ├── clientes/
│   │       │   └── page.tsx            # Server wrapper → ClientesList
│   │       ├── productos/
│   │       │   └── page.tsx            # Server wrapper → ProductosList (admin only)
│   │       └── inventario/
│   │           └── page.tsx            # Server wrapper → InventarioClient (admin only)
│   ├── hooks/
│   │   └── use-mobile.ts              # Hook useIsMobile (matchMedia 768px)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── card.tsx, badge.tsx, input.tsx, table.tsx, sheet.tsx
│   │   │   ├── button.tsx, popover.tsx  # añadidos para el dashboard
│   │   │   └── calendar.tsx            # react-day-picker (locale es) para el rango de fechas
│   │   ├── shared/
│   │   │   └── app-sidebar.tsx         # Sidebar con logout, roles, rutas limpias
│   │   ├── providers/
│   │   │   └── auth-provider.tsx       # AuthContext (id, nombre, role)
│   │   └── purificadora/
│   │       ├── ingresos-chart.tsx      # Gráfica de ingresos legacy (BarChart, ya no usada en dashboard)
│   │       ├── form-domicilio.tsx      # Formulario entregas (Client Component)
│   │       ├── form-fisico.tsx         # Formulario punto de venta (Client Component)
│   │       ├── ventas-list.tsx         # Lista ventas con filtros + export CSV (Client Component)
│   │       ├── editar-venta-sheet.tsx  # Sheet de edición/cancelación de venta (admin)
│   │       ├── clientes-list.tsx       # Lista clientes con búsqueda (Client Component)
│   │       ├── productos-list.tsx      # Edición de precios/catálogo (admin)
│   │       ├── inventario/             # Módulo de inventario (Client Components)
│   │       │   ├── inventario-client.tsx   # Orquestador: Resumen / Movimientos / Configuración
│   │       │   └── config-productos.tsx    # Mapear cada producto a garrafón/litro/ninguno
│   │       └── dashboard/              # Dashboard rediseñado (todos Client Components)
│   │           ├── dashboard-client.tsx    # Orquestador: estado rango/filtros + queries RPC
│   │           ├── date-range-picker.tsx   # Presets (Hoy/Semana/Mes/Mes anterior) + calendario
│   │           ├── filtros-sheet.tsx       # Panel lateral: filtro canal + estado de pago
│   │           ├── kpi-card.tsx            # KPI card reutilizable con sparkline
│   │           ├── sparkline.tsx           # Mini LineChart sin ejes
│   │           ├── tendencia-chart.tsx     # AreaChart de ingresos 12 meses
│   │           ├── ventas-por-producto.tsx # Toggle canal + vista Tarjetas/Tabla
│   │           └── resumen-dia.tsx         # 4 métricas resumen del periodo
│   └── lib/
│       ├── utils.ts                    # clsx + tailwind-merge
│       ├── auth.ts                     # requireRole() + roleLandingPath (gating por rol)
│       ├── fechas.ts                   # Helpers de fecha en zona México (getHoy, rangos, formato)
│       ├── types.ts                    # TypeScript interfaces compartidas
│       ├── supabase/
│       │   ├── client.ts              # createBrowserClient()
│       │   ├── server.ts              # createServerClient() con cookies
│       │   └── middleware.ts           # Helper de auth para middleware
│       └── actions/
│           ├── ventas.ts              # registrarVenta/actualizarVenta/cancelarVenta (+ descuento inventario)
│           ├── clientes.ts            # buscarClientes(), crearCliente() server actions
│           └── inventario.ts          # registrarCompra/registrarAjuste/setTipoInventarioProducto
```

## Rutas de la app

| Ruta | Archivo | Acceso | Descripción |
|---|---|---|---|
| `/login` | `src/app/login/page.tsx` | Público | Login email/password |
| `/` | `src/app/(app)/page.tsx` | Admin | Dashboard (KPIs, gráficas, últimas ventas) |
| `/elegir` | `src/app/(app)/elegir/page.tsx` | Todos | Landing de vendedores: elegir Domicilio o Físico |
| `/ventas-domicilio` | `src/app/(app)/ventas-domicilio/page.tsx` | Todos | Formulario entregas domicilio |
| `/ventas` | `src/app/(app)/ventas/page.tsx` | Todos | Formulario punto de venta |
| `/todas-ventas` | `src/app/(app)/todas-ventas/page.tsx` | Admin | Historial de ventas |
| `/clientes` | `src/app/(app)/clientes/page.tsx` | Todos | Base de clientes |
| `/productos` | `src/app/(app)/productos/page.tsx` | Admin | Editar precios y catálogo |
| `/inventario` | `src/app/(app)/inventario/page.tsx` | Admin | Inventario: stock, costo y movimientos |

**Redirects legacy:** `/demos/purificadora/*` → `/*` (301 permanent)
**Acceso "Todos"** = admin + ambos roles de vendedor (`vendedor_fisico`, `vendedor_domicilio`).

## Productos y precios

### Ventas Domicilio (entregas a domicilio)
| Producto | Precio | Unidad |
|---|---|---|
| Llenado Garrafón 20L | $25 | pza |
| Garrafón 20L (nuevo) | $110 | pza |
| Botella 1L | $9 | pza |
| Botella 500ml | $6 | pza |

- Métodos de pago: Efectivo, Transferencia
- Requiere seleccionar cliente (búsqueda con dropdown)

### Ventas Físico (punto de venta)
| Producto | Precio | Unidad | Litros por unidad |
|---|---|---|---|
| Llenado Garrafón 20L | $20 | pza | 20 |
| Llenado Garrafón 4-10L | $10 | litro | 1 |
| Garrafón 20L (nuevo) | $110 | pza | 20 |
| Botella 1L | $10 | pza | 1 |

- Métodos de pago: Efectivo, Transferencia, Crédito
- Tiene selector de turno (Matutino/Vespertino)
- Tiene cuentalitros manual: ambas lecturas (inicial y final) las ingresa el usuario
  - Litros disponibles = lectura final - lectura inicial (auto-calculado)
  - El usuario reparte esos litros entre los productos
  - Se bloquea agregar productos si exceden los litros disponibles
  - Muestra litros restantes en verde (>0), ámbar (=0), rojo (excede)
- No requiere seleccionar cliente

### Notas de precios
- Algunos clientes tienen precios de mayoreo (pendiente de implementar)
- Domicilio tiene precios diferentes al punto de venta físico
- La lectura de cuentalitros se reinicia a principio de cada mes
- Cuentalitros general: ~$3/litro

## Campos de cada venta

- Cliente (solo en Domicilio)
- Turno (solo en físico)
- Productos (tabla con cantidad e importe auto-calculado)
- Cuentalitros inicial/final, ambos manuales (solo en físico, litros disponibles = final - inicial)
- Método de pago
- Estado de pago: Pagado / No Pagado
- Evidencia fotográfica (opcional, sin etiquetarlo como opcional)

## Secciones del sistema (detalle)

### 1. Dashboard (`/`) — Admin only

Rediseñado (jun 2026) a estilo SaaS. Es un **Server shell** (`page.tsx`, solo `requireRole`) que monta `<DashboardClient>` (Client Component que orquesta todo el estado y las consultas). Patrón igual al de `ventas-list.tsx`: queries client-side con `createClient()` del browser.

- **Header:** Título + `<DateRangePicker>` (rango funcional: presets Hoy/Semana/Mes/Mes anterior + calendario visual para rango personalizado) + `<FiltrosSheet>` (panel lateral con filtro de canal y estado de pago). El rango y los filtros **recargan los datos** vía RPC.
- **KPI Cards (4):** Ingresos del periodo, Ingresos del Mes (% vs mes anterior), Entregas (completadas/total), Clientes Activos. Cada una con una **sparkline** (mini LineChart de 14 días / 12 meses). Móvil: grid 2 cols | Desktop: 4 cols.
- **Ventas por producto:** toggle de canal (Todos / Normal=físico / Domicilio) + toggle de vista (Tarjetas / Tabla), ambos **client-side** sobre los datos de `fn_desglose_producto_canal` (trae ambos canales en una llamada). En vista "Todos", cada card muestra el desglose Normal vs Domicilio (cantidad + monto + # ventas).
- **Tendencia 12 meses:** AreaChart (Recharts) con `tendencia-chart.tsx`. Independiente del rango/filtro (panorama histórico global).
- **Resumen del periodo (4 métricas):** Ingresos totales, Ventas totales (pza/litro), Entregas completadas, Clientes activos.

**Notas de comportamiento:**
- KPI "Ingresos del Mes" y la tendencia 12m **no** reaccionan al rango ni al filtro de canal (son referencia histórica global). Las demás métricas sí.
- El "mes anterior" para el % se calcula como el penúltimo punto de `v_tendencia_12_meses`.
- Las etiquetas de mes se formatean en el cliente (`mesLabel` en `lib/fechas.ts`, locale es-MX) en vez de confiar en `to_char`.

### 2. Ventas Domicilio (`/ventas-domicilio`)
- Formulario con búsqueda de cliente (dropdown con nombre + dirección, items `py-3` en móvil)
- **Desktop:** Tabla grid de productos con cantidades editables y totales auto-calculados
- **Móvil:** Cards de producto con botones +/- stepper (44×44px touch targets)
- Método y estado de pago (botones `py-3` en móvil / `py-2` en desktop)
- Upload de evidencia fotográfica
- Pantalla de confirmación de éxito (2 segundos) → reset del formulario
- Botón deshabilitado hasta llenar campos requeridos

### 3. Ventas Físico (`/ventas`)
- Toggle de turno: Matutino / Vespertino (botones `py-3` en móvil)
- **Cuentalitros (va primero en el formulario):** Ambas lecturas manuales (inicial y final, `h-11` en móvil). Litros disponibles = final - inicial. Muestra litros restantes (verde/ámbar/rojo)
- **Desktop:** Tabla grid de productos con columna "Litros" por unidad
- **Móvil:** Cards de producto con botones +/- stepper (44×44px touch targets), muestra litros por unidad
- Bloqueo: no permite agregar productos si exceden litros disponibles del cuentalitros (botones +/inputs se deshabilitan, productos bloqueados con opacity-40)
- Método y estado de pago (incluye Crédito)
- Upload de evidencia fotográfica
- Pantalla de confirmación → reset (ambas lecturas se limpian)

### 4. Todas Ventas (`/todas-ventas`) — Admin only
- **Resumen (5 cards):** Total (col-span-2 en móvil), Efectivo, Transferencia, Crédito, No Pagado (rojo si > 0)
- **Filtros:** Periodo (Hoy/Semana/Mes/Todo con scroll horizontal + snap en móvil), búsqueda texto libre (`h-11` móvil), método de pago, estado de pago, fuente (selects `h-11` en móvil)
- **Desktop:** Tabla con 9 columnas (#Venta, Fecha+hora, Cliente+Colonia, Producto, Cantidad, Monto, Pago, Estado, Fuente)
- **Móvil:** Card list — cada venta muestra nombre+monto arriba, #venta+fecha/hora+cantidad en medio, badges abajo
- La **fecha+hora** se muestra en zona México (derivada de `created_at`, no de `fecha_venta`)
- Muestra primeros 100 resultados con nota de filtrado
- Badges con colores: verde (pagado), rojo (no pagado), outline (otros), mínimo `text-[11px]`
- **Export CSV** (botón Descargar): una fila por producto, hasta 2000 ventas, BOM UTF-8 para Excel. Columnas incluyen Fecha, **Hora** (zona MX), **Cuentalitros inicial/final** (solo en físico, vacías en domicilio), datos de cliente, producto, montos, pago

### 5. Clientes (`/clientes`)
- Header responsive: flex-col en móvil (search full-width), flex-row en desktop (search w-64)
- Búsqueda en tiempo real por nombre, teléfono, dirección, colonia (`h-11` en móvil)
- **Desktop:** Tabla con 6 columnas (Nombre, Teléfono, Colonia, Pedidos, Total Gastado, Último Pedido)
- **Móvil:** Card list — cada cliente muestra nombre+total gastado arriba, teléfono, colonia+pedidos abajo
- Conteo de clientes activos vs total registrados

### 6. Productos (`/productos`) — Admin only
- Edición de precios y catálogo de productos (tabla `productos`), agrupado por canal
- Server wrapper → `productos-list.tsx`

### 7. Inventario (`/inventario`) — Admin only

Módulo de inventario **por tipo** (no producto por producto): dos tipos, **garrafón** y **litro/botella**. Es un Server shell (`requireRole(["admin"])`) que monta `<InventarioClient>`. Tres pestañas:

- **Resumen:** 2 tarjetas (Garrafones / Botellas de litro) con **stock actual**, **último costo** e **inventario a costo** (`stock × último_costo`), + tarjeta de **total a costo**. Tarjeta en **rojo** si stock < 0 o < mínimo. Botones rápidos de Compra/Ajuste por tipo.
- **Movimientos:** historial fechado filtrable por tipo y por clase (compra/venta/ajuste). Cantidad en verde (+) / rojo (−).
- **Configuración** (`config-productos.tsx`): el admin mapea cada producto a `garrafón`, `litro` o **No es inventario**. Los productos sin tipo (NULL) **no descuentan** stock (ej. los "Llenado de Garrafón", que son venta de agua: el cliente trae su envase).

**Registrar compra/ajuste** desde un `<Sheet>`:
- **Compra:** tipo + cantidad + costo unitario + fecha (default hoy MX). Muestra el costo total en vivo. Suma stock y **fija el último costo** (costeo a último costo de compra; el historial conserva cada compra con su fecha porque el precio es variable).
- **Ajuste:** corrección manual (+/−) con motivo (merma, recuento).

**Descuento automático:** al registrar/editar/cancelar una venta, el stock se ajusta solo (ver Base de datos → RPCs de inventario). Es *best-effort*: si el descuento falla, la venta igual se registra (es la fuente de verdad) y el stock se reconcilia con un ajuste. **El stock negativo está permitido** (no bloquea ventas).

## Sidebar / Navegación

Componente: `src/components/shared/app-sidebar.tsx`

| Item | Icono | Ruta | Solo Admin |
|---|---|---|---|
| Dashboard | LayoutDashboard | `/` | Sí |
| Ventas Domicilio | Truck | `/ventas-domicilio` | No |
| Ventas Físico | ShoppingCart | `/ventas` | No |
| Ventas | ClipboardList | `/todas-ventas` | Sí |
| Clientes | Users | `/clientes` | No |
| Productos | Package | `/productos` | Sí |
| Inventario | Boxes | `/inventario` | Sí |

- Logo RushData arriba
- Highlight de página activa con `bg-accent` + `ChevronRight`
- Footer: "PURIFICADORA EL BALUARTE" / nombre del usuario / botón "Cerrar sesión"
- Items admin-only se ocultan para vendedores
- **Desktop (≥768px):** `<aside>` fijo `w-60`, fondo glassmorphic con backdrop blur
- **Móvil (<768px):** Header fijo `h-14` con botón hamburguesa + Sheet (drawer) desde la izquierda
- Contenido de navegación extraído a componente interno `SidebarContent`

## Base de datos (Supabase PostgreSQL)

### Tablas
- `user_profiles` — id (FK auth.users), nombre, role (admin/vendedor_fisico/vendedor_domicilio), activo
- `productos` — id (text slug), nombre, canal (domicilio/fisico), precio, unidad, litros_por_unidad, **tipo_inventario** (garrafon/litro/NULL), orden, activo
- `clientes` — id, nombre, telefono, direccion, colonia, referencia, notas, activo
- `ventas` — id, numero_venta (serial), cliente_id, fuente, turno, estado, estado_pago, metodo_pago, lectura_inicial, lectura_final, evidencia_url, monto_total, fecha_venta, created_by
- `venta_items` — id, venta_id (FK CASCADE), producto_id, cantidad, precio_unitario, monto_total
- `inventario` — tipo (PK: garrafon/litro), nombre, stock_actual, ultimo_costo, cantidad_minima, updated_at
- `inventario_movimientos` — id, tipo, clase (compra/venta/ajuste), cantidad (+/−), costo_unitario, costo_total, venta_id (FK), motivo, fecha (default `hoy_mexico()`), created_by

### Zona horaria (importante)
El servidor de Supabase corre en **UTC**, pero el negocio opera en **México (America/Monterrey, UTC−6)**. Migración `002` resuelve esto:
- **`hoy_mexico()`** — función SQL `STABLE` que devuelve la fecha de hoy en hora de México. **Usar SIEMPRE en vez de `CURRENT_DATE`** en views/funciones nuevas.
- `ventas.fecha_venta` tiene default en hora de México (no UTC).
- En el frontend, calcular "hoy"/rangos con los helpers de `lib/fechas.ts` (zona Monterrey), nunca con `new Date().toISOString()` crudo.

### SQL Views
- `v_dashboard_kpis` — ingresos hoy/semana/mes, mes anterior, entregas, pendientes (legacy, ya no usada por el dashboard rediseñado)
- `v_ingresos_7_dias` — últimos 7 días agrupados por fecha (legacy)
- `v_desglose_hoy` / `v_desglose_mes` — breakdown por producto (legacy)
- `v_cliente_stats` — clientes con total_pedidos, total_gastado, ultimo_pedido
- `v_tendencia_12_meses` — ingresos mensuales de los últimos 12 meses (periodo, monto, num_ventas)
- `v_sparklines_kpi` — serie diaria de 14 días (ingresos, entregas, clientes) para las sparklines

### Funciones RPC (migración 003 — usadas por el dashboard)
Todas `STABLE SECURITY INVOKER` (respetan RLS), con `GRANT EXECUTE ... TO authenticated`:
- `fn_kpis_rango(p_desde, p_hasta, p_canal, p_estado_pago)` — KPIs por rango + filtros
- `fn_desglose_producto_canal(p_desde, p_hasta, p_estado_pago)` — por producto con columnas separadas fisico/domicilio
- `fn_resumen_dia(p_desde, p_hasta, p_canal, p_estado_pago)` — totales del periodo
- `p_canal`: 'todos'|'fisico'|'domicilio' · `p_estado_pago`: 'todos'|'pagado'|'no_pagado'

### Funciones RPC de inventario (migración 004)
Con `GRANT EXECUTE ... TO authenticated`:
- `fn_inventario_compra(p_tipo, p_cantidad, p_costo_unitario, p_fecha)` — `SECURITY INVOKER`. Inserta movimiento `compra`, suma stock y fija `ultimo_costo`.
- `fn_inventario_ajuste(p_tipo, p_cantidad, p_motivo)` — `SECURITY INVOKER`. Ajuste manual +/−.
- `fn_inventario_aplicar_venta(p_venta_id)` — **`SECURITY DEFINER`** (`SET search_path = public`). Idempotente: revierte el descuento previo de esa venta y lo recalcula desde los `venta_items` actuales agrupando por `productos.tipo_inventario` (ignora NULL). Es DEFINER para que un **vendedor** pueda gatillar el descuento sin escritura directa sobre las tablas de inventario.
- `fn_inventario_revertir_venta(p_venta_id)` — **`SECURITY DEFINER`**. Devuelve el stock descontado por esa venta (al cancelar).

### RLS
- Todos leen productos, clientes, ventas, venta_items, inventario, inventario_movimientos
- Todos insertan clientes, ventas, venta_items
- Solo admin modifica/elimina (incluye inventario e inventario_movimientos)
- El descuento por venta entra vía `fn_inventario_aplicar_venta` (SECURITY DEFINER), por eso los vendedores no necesitan policy de escritura sobre inventario
- Helper: **`public.user_role()`** retorna rol del usuario autenticado (¡vive en `public`, no en `auth`!)

### Migraciones: `supabase/migrations/`
- `001_initial_schema.sql` — schema, seed, views, RLS
- `002_timezone_mexico.sql` — `hoy_mexico()`, default fecha_venta en MX, corrige histórico, views con `hoy_mexico()`
- `003_dashboard_rediseno.sql` — RPCs por rango + views de tendencia/sparklines
- `004_inventario.sql` — `productos.tipo_inventario`, tablas `inventario`/`inventario_movimientos`, RPCs de inventario, RLS

**Las migraciones se aplican manualmente** en el SQL Editor de Supabase (no hay CLI conectado). Son idempotentes (`CREATE OR REPLACE` / `IF NOT EXISTS`).

## Diseño y colores

- **Filosofía:** UI estilo Notion — minimalista, whitespace, tipografía limpia, bordes sutiles
- **Color space:** OKLch (perceptualmente uniforme)
- **Color primario/acento:** sky (azul cielo) — `oklch(0.6 0.2 230)`
- **Background:** `oklch(0.98 0.01 220)` (off-white)
- **Foreground:** `oklch(0.15 0.02 220)` (dark neutral)
- **Destructive:** `oklch(0.6 0.25 25)` (rojo-naranja)
- **Efectos:** Glassmorphism (`.glass`, `.glass-strong`, `.glass-subtle`) con backdrop blur
- **Dark mode:** Soportado via CSS variables
- **Idioma:** Todo en español (mercado mexicano)
- **Responsive:** Mobile-first (320px+), breakpoint principal `md:` (768px)
  - Tablas → card list en móvil (`hidden md:block` / `md:hidden`)
  - Product grids → cards con steppers +/- (44×44px touch targets)
  - Touch targets mínimo 44px (`h-11 w-11` para botones, `h-11` para inputs)
  - Textos mínimo `text-[11px]` (nunca text-[9px] o text-[10px])
  - Padding `p-4 md:p-6`, títulos `text-xl md:text-2xl`
  - Sidebar → Sheet drawer con hamburguesa en <768px
  - CSS utility `.scrollbar-hide` para scroll horizontal sin scrollbar

## Integraciones

### Supabase (activo)
- PostgreSQL para almacenamiento (tablas + views + funciones RPC)
- Auth con email/password + Row Level Security
- Server Actions para escritura; SQL Views y RPCs para lectura
- Zona horaria de México resuelta vía `hoy_mexico()` y defaults en MX (migración 002)

### Pendientes
- **PAJ-Portal GPS API:** Rastreo en tiempo real (diferido, requiere credenciales del cliente)
- **n8n:** Automatización de procesos internos
- **Supabase Storage:** Para evidencias fotográficas (actualmente solo campo de referencia)

## Comandos de desarrollo

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # ESLint
```

## Deployment

- **Hosting:** Vercel (aguaelbaluarte.vercel.app)
- **Repo:** github.com/rushdatamx/aguaelbaluarte (público, branch main)
- **Framework:** Auto-detectado como Next.js via `vercel.json`
- **Build:** `next build` (todas las páginas son estáticas, prerendered)
- **Push to main** → deploy automático en Vercel

## Empresa desarrolladora

**RushData** — Consultoría tecnológica en Monterrey, NL
- Web: www.rushdata.com.mx
- Stack: Vercel, Next.js, n8n, Supabase, Railway
