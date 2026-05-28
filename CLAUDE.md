# CLAUDE.md — Purificadora El Baluarte

## Sobre el proyecto

Sistema de gestión de ventas y entregas para **Purificadora El Baluarte**, una purificadora de agua en Monterrey, NL. El sistema tiene dos canales de registro de ventas (Domicilio para entregas, Físico para punto de venta), un dashboard con KPIs, y un historial completo de ventas filtrable.

**Estado actual:** Producción con Supabase (PostgreSQL + Auth). GPS diferido.

### Cliente
- **Negocio:** Purificadora de agua con entregas a domicilio y ventas en punto de venta
- **Repartidor:** Hace ~30 entregas/día en camioneta (Chevrolet NP300 2021)
- **Administradora:** Registra ventas físicas y supervisa operación desde el dashboard
- **GPS:** PAJ Vehicle Finder 4G instalado en la camioneta
- **Usuarios del sistema:** 1 Admin (acceso total) + 2 Vendedores (solo registrar ventas)

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
| Radix UI | 1.4.3 | Primitivos accesibles |
| Plus Jakarta Sans | — | Tipografía principal |

### Arquitectura
- **Frontend/Hosting:** Vercel + Next.js
- **Base de datos + Auth:** Supabase (PostgreSQL + Row Level Security)
- **Server Actions:** Para registrar ventas y buscar clientes
- **SQL Views:** Para KPIs del dashboard (calculados server-side)
- **Roles:** Admin (acceso total) + Vendedor (solo formularios de venta + clientes)
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
│       └── 001_initial_schema.sql      # Schema, seed, views, RLS
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
│   │       ├── page.tsx                # Dashboard (KPIs desde SQL views, admin only)
│   │       ├── ventas-domicilio/
│   │       │   └── page.tsx            # Server wrapper → FormDomicilio
│   │       ├── ventas/
│   │       │   └── page.tsx            # Server wrapper → FormFisico
│   │       ├── todas-ventas/
│   │       │   └── page.tsx            # Server wrapper → VentasList (admin only)
│   │       └── clientes/
│   │           └── page.tsx            # Server wrapper → ClientesList
│   ├── hooks/
│   │   └── use-mobile.ts              # Hook useIsMobile (matchMedia 768px)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── card.tsx, badge.tsx, input.tsx, table.tsx, sheet.tsx
│   │   ├── shared/
│   │   │   └── app-sidebar.tsx         # Sidebar con logout, roles, rutas limpias
│   │   ├── providers/
│   │   │   └── auth-provider.tsx       # AuthContext (id, nombre, role)
│   │   └── purificadora/
│   │       ├── ingresos-chart.tsx      # Gráfica de ingresos (BarChart)
│   │       ├── form-domicilio.tsx      # Formulario entregas (Client Component)
│   │       ├── form-fisico.tsx         # Formulario punto de venta (Client Component)
│   │       ├── ventas-list.tsx         # Lista ventas con filtros (Client Component)
│   │       └── clientes-list.tsx       # Lista clientes con búsqueda (Client Component)
│   └── lib/
│       ├── utils.ts                    # clsx + tailwind-merge
│       ├── types.ts                    # TypeScript interfaces compartidas
│       ├── supabase/
│       │   ├── client.ts              # createBrowserClient()
│       │   ├── server.ts              # createServerClient() con cookies
│       │   └── middleware.ts           # Helper de auth para middleware
│       └── actions/
│           ├── ventas.ts              # registrarVenta() server action
│           └── clientes.ts            # buscarClientes(), crearCliente() server actions
```

## Rutas de la app

| Ruta | Archivo | Acceso | Descripción |
|---|---|---|---|
| `/login` | `src/app/login/page.tsx` | Público | Login email/password |
| `/` | `src/app/(app)/page.tsx` | Admin | Dashboard (KPIs, gráficas, últimas ventas) |
| `/ventas-domicilio` | `src/app/(app)/ventas-domicilio/page.tsx` | Todos | Formulario entregas domicilio |
| `/ventas` | `src/app/(app)/ventas/page.tsx` | Todos | Formulario punto de venta |
| `/todas-ventas` | `src/app/(app)/todas-ventas/page.tsx` | Admin | Historial de ventas |
| `/clientes` | `src/app/(app)/clientes/page.tsx` | Todos | Base de clientes |

**Redirects legacy:** `/demos/purificadora/*` → `/*` (301 permanent)

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
- **KPI Cards (4):** Ingresos Hoy, Ingresos del Mes (con % vs mes anterior), Entregas Hoy (completadas/total + pendientes), Clientes Activos
  - Móvil: grid 2 columnas, textos `text-xl` | Desktop: grid 4 columnas, `text-2xl`
- **Desglose por producto (4 cols):** Garrafón 20L, Botella 1L, Botella 500ml, Cuentalitros — cada uno muestra cantidad, unidad, monto, # ventas
  - Móvil: grid 2 columnas | Desktop: grid 4 columnas
- **Gráfica de ingresos 7 días:** BarChart (Recharts) con `ingresos-chart.tsx` (h-200px móvil / h-280px desktop)
- **Ruta activa:** Tiempo, barra de progreso, monto total, nombre del repartidor, estado (En progreso/Completada/Pendiente)
- **Últimas 5 ventas:** Cliente, producto, cantidad, monto, estado (Entregado/En camino/Asignado/Pendiente), fuente (Domicilio/Físico)

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
- **Desktop:** Tabla con 9 columnas (#Venta, Fecha, Cliente+Colonia, Producto, Cantidad, Monto, Pago, Estado, Fuente)
- **Móvil:** Card list — cada venta muestra nombre+monto arriba, #venta+fecha+cantidad en medio, badges abajo
- Muestra primeros 100 resultados con nota de filtrado
- Badges con colores: verde (pagado), rojo (no pagado), outline (otros), mínimo `text-[11px]`

### 5. Clientes (`/clientes`)
- Header responsive: flex-col en móvil (search full-width), flex-row en desktop (search w-64)
- Búsqueda en tiempo real por nombre, teléfono, dirección, colonia (`h-11` en móvil)
- **Desktop:** Tabla con 6 columnas (Nombre, Teléfono, Colonia, Pedidos, Total Gastado, Último Pedido)
- **Móvil:** Card list — cada cliente muestra nombre+total gastado arriba, teléfono, colonia+pedidos abajo
- Conteo de clientes activos vs total registrados

## Sidebar / Navegación

Componente: `src/components/shared/app-sidebar.tsx`

| Item | Icono | Ruta | Solo Admin |
|---|---|---|---|
| Dashboard | LayoutDashboard | `/` | Sí |
| Ventas Domicilio | Truck | `/ventas-domicilio` | No |
| Ventas Físico | ShoppingCart | `/ventas` | No |
| Ventas | ClipboardList | `/todas-ventas` | Sí |
| Clientes | Users | `/clientes` | No |

- Logo RushData arriba
- Highlight de página activa con `bg-accent` + `ChevronRight`
- Footer: "PURIFICADORA EL BALUARTE" / nombre del usuario / botón "Cerrar sesión"
- Items admin-only se ocultan para vendedores
- **Desktop (≥768px):** `<aside>` fijo `w-60`, fondo glassmorphic con backdrop blur
- **Móvil (<768px):** Header fijo `h-14` con botón hamburguesa + Sheet (drawer) desde la izquierda
- Contenido de navegación extraído a componente interno `SidebarContent`

## Base de datos (Supabase PostgreSQL)

### Tablas
- `user_profiles` — id (FK auth.users), nombre, role (admin/vendedor), activo
- `productos` — id (text slug), nombre, canal (domicilio/fisico), precio, unidad, litros_por_unidad, orden, activo
- `clientes` — id, nombre, telefono, direccion, colonia, referencia, notas, activo
- `ventas` — id, numero_venta (serial), cliente_id, fuente, turno, estado, estado_pago, metodo_pago, lectura_inicial, lectura_final, evidencia_url, monto_total, fecha_venta, created_by
- `venta_items` — id, venta_id (FK CASCADE), producto_id, cantidad, precio_unitario, monto_total

### SQL Views
- `v_dashboard_kpis` — ingresos hoy/semana/mes, mes anterior, entregas, pendientes
- `v_ingresos_7_dias` — últimos 7 días agrupados por fecha
- `v_desglose_hoy` — breakdown por producto (cantidad, monto, # ventas)
- `v_desglose_mes` — breakdown por producto del mes
- `v_cliente_stats` — clientes con total_pedidos, total_gastado, ultimo_pedido

### RLS
- Todos leen productos, clientes, ventas, venta_items
- Todos insertan clientes, ventas, venta_items
- Solo admin modifica/elimina
- Helper: `auth.user_role()` retorna rol del usuario autenticado

### Migration: `supabase/migrations/001_initial_schema.sql`

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
- PostgreSQL para almacenamiento (tablas + views)
- Auth con email/password + Row Level Security
- Server Actions para escritura, SQL Views para lectura

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
