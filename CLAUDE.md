# CLAUDE.md — Purificadora El Baluarte

## Sobre el proyecto

Sistema de gestión de ventas y entregas para **Purificadora El Baluarte**, una purificadora de agua en Monterrey, NL. El sistema tiene dos canales de registro de ventas (Domicilio para entregas, Físico para punto de venta), un dashboard con KPIs, GPS del repartidor, y un historial completo de ventas filtrable.

**Estado actual:** Demo/MVP con datos mock. Sin backend ni base de datos conectados.

### Cliente
- **Negocio:** Purificadora de agua con entregas a domicilio y ventas en punto de venta
- **Repartidor:** Hace ~30 entregas/día en camioneta (Chevrolet NP300 2021)
- **Administradora:** Registra ventas físicas y supervisa operación desde el dashboard
- **GPS:** PAJ Vehicle Finder 4G instalado en la camioneta
- **Usuarios del sistema:** 1-3 (dueño/administradores)

### Problema que resuelve
Todo se lleva en papel (notas de remisión físicas). No hay visibilidad de ventas en tiempo real, no se sabe cuánto se vendió hasta contar efectivo, y los pedidos por WhatsApp se pierden.

## Stack técnico (demo actual)

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.1.6 | Framework + App Router |
| React | 19.2.3 | UI Library |
| TypeScript | 5 | Tipado |
| Tailwind CSS | 4 | Estilos (OKLch color space) |
| shadcn/ui | new-york style | Componentes UI (Card, Badge, Input, Table, Sheet) |
| Recharts | 3.7.0 | Gráficas (BarChart, AreaChart) |
| Lucide React | 0.563.0 | Iconos |
| Radix UI | 1.4.3 | Primitivos accesibles |
| Plus Jakarta Sans | — | Tipografía principal |

### Stack planeado para producción
- **Frontend/Hosting:** Vercel + Next.js
- **Backend/Automatización:** n8n
- **Base de datos:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Infraestructura:** Railway
- **WhatsApp:** Meta Cloud API (WhatsApp Business)
- **GPS:** PAJ-Portal API

## Estructura de archivos (real)

```
purificadora-el-baluarte/
├── CLAUDE.md                           # Este archivo
├── vercel.json                         # Config Vercel (framework: nextjs)
├── gen_purificadora.py                 # Generador de datos mock (Python)
├── package.json
├── next.config.ts
├── tsconfig.json
├── components.json                     # Config shadcn/ui
├── postcss.config.mjs                  # Config Tailwind CSS
├── public/
│   ├── images/
│   │   └── rushdata-logo.png
│   └── data/
│       └── purificadora.json           # Datos mock (~2.3MB)
├── src/
│   ├── app/
│   │   ├── layout.tsx                  # Root layout (Plus Jakarta Sans font)
│   │   ├── page.tsx                    # Home — redirect a /demos/purificadora
│   │   ├── globals.css                 # Estilos globales + CSS vars + glassmorphism + scrollbar-hide
│   │   └── demos/purificadora/
│   │       ├── layout.tsx              # Layout con sidebar (DemoSidebar) + pt-14 mobile offset
│   │       ├── page.tsx                # Dashboard (KPIs, gráficas, últimas ventas)
│   │       ├── ventas-domicilio/
│   │       │   └── page.tsx            # Formulario entregas a domicilio
│   │       ├── ventas/
│   │       │   └── page.tsx            # Formulario ventas punto de venta
│   │       ├── todas-ventas/
│   │       │   └── page.tsx            # Historial de ventas (tabla desktop / cards móvil)
│   │       ├── gps/
│   │       │   └── page.tsx            # GPS en tiempo real (mapa SVG simulado)
│   │       └── clientes/
│   │           └── page.tsx            # Base de clientes (tabla desktop / cards móvil)
│   ├── hooks/
│   │   └── use-mobile.ts              # Hook useIsMobile (matchMedia 768px)
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── table.tsx
│   │   │   └── sheet.tsx               # Sheet/drawer para sidebar móvil
│   │   ├── shared/
│   │   │   └── demo-sidebar.tsx        # Sidebar + mobile header + Sheet drawer
│   │   └── purificadora/
│   │       ├── ingresos-chart.tsx      # Gráfica de ingresos (BarChart, responsive height)
│   │       └── garrafones-chart.tsx    # Gráfica de garrafones (AreaChart, responsive height)
│   └── lib/
│       └── utils.ts                    # clsx + tailwind-merge utility
```

## Rutas de la app

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `src/app/page.tsx` | Redirect a `/demos/purificadora` |
| `/demos/purificadora` | `src/app/demos/purificadora/page.tsx` | Dashboard principal |
| `/demos/purificadora/ventas-domicilio` | `.../ventas-domicilio/page.tsx` | Formulario entregas domicilio |
| `/demos/purificadora/ventas` | `.../ventas/page.tsx` | Formulario punto de venta |
| `/demos/purificadora/todas-ventas` | `.../todas-ventas/page.tsx` | Historial de ventas |
| `/demos/purificadora/gps` | `.../gps/page.tsx` | GPS en tiempo real |
| `/demos/purificadora/clientes` | `.../clientes/page.tsx` | Base de clientes |

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

### 1. Dashboard (`/demos/purificadora`)
- **KPI Cards (4):** Ingresos Hoy, Ingresos del Mes (con % vs mes anterior), Entregas Hoy (completadas/total + pendientes), Clientes Activos
  - Móvil: grid 2 columnas, textos `text-xl` | Desktop: grid 4 columnas, `text-2xl`
- **Desglose por producto (4 cols):** Garrafón 20L, Botella 1L, Botella 500ml, Cuentalitros — cada uno muestra cantidad, unidad, monto, # ventas
  - Móvil: grid 2 columnas | Desktop: grid 4 columnas
- **Gráfica de ingresos 7 días:** BarChart (Recharts) con `ingresos-chart.tsx` (h-200px móvil / h-280px desktop)
- **Ruta activa:** Tiempo, barra de progreso, monto total, nombre del repartidor, estado (En progreso/Completada/Pendiente)
- **Últimas 5 ventas:** Cliente, producto, cantidad, monto, estado (Entregado/En camino/Asignado/Pendiente), fuente (WhatsApp/Admin)

### 2. Ventas Domicilio (`/demos/purificadora/ventas-domicilio`)
- Formulario con búsqueda de cliente (dropdown con nombre + dirección, items `py-3` en móvil)
- **Desktop:** Tabla grid de productos con cantidades editables y totales auto-calculados
- **Móvil:** Cards de producto con botones +/- stepper (44×44px touch targets)
- Método y estado de pago (botones `py-3` en móvil / `py-2` en desktop)
- Upload de evidencia fotográfica
- Pantalla de confirmación de éxito (2 segundos) → reset del formulario
- Botón deshabilitado hasta llenar campos requeridos

### 3. Ventas Físico (`/demos/purificadora/ventas`)
- Toggle de turno: Matutino / Vespertino (botones `py-3` en móvil)
- **Cuentalitros (va primero en el formulario):** Ambas lecturas manuales (inicial y final, `h-11` en móvil). Litros disponibles = final - inicial. Muestra litros restantes (verde/ámbar/rojo)
- **Desktop:** Tabla grid de productos con columna "Litros" por unidad
- **Móvil:** Cards de producto con botones +/- stepper (44×44px touch targets), muestra litros por unidad
- Bloqueo: no permite agregar productos si exceden litros disponibles del cuentalitros (botones +/inputs se deshabilitan, productos bloqueados con opacity-40)
- Método y estado de pago (incluye Crédito)
- Upload de evidencia fotográfica
- Pantalla de confirmación → reset (ambas lecturas se limpian)

### 4. Todas Ventas (`/demos/purificadora/todas-ventas`)
- **Resumen (5 cards):** Total (col-span-2 en móvil), Efectivo, Transferencia, Crédito, No Pagado (rojo si > 0)
- **Filtros:** Periodo (Hoy/Semana/Mes/Todo con scroll horizontal + snap en móvil), búsqueda texto libre (`h-11` móvil), método de pago, estado de pago, fuente (selects `h-11` en móvil)
- **Desktop:** Tabla con 9 columnas (#Venta, Fecha, Cliente+Colonia, Producto, Cantidad, Monto, Pago, Estado, Fuente)
- **Móvil:** Card list — cada venta muestra nombre+monto arriba, #venta+fecha+cantidad en medio, badges abajo
- Muestra primeros 100 resultados con nota de filtrado
- Badges con colores: verde (pagado), rojo (no pagado), outline (otros), mínimo `text-[11px]`

### 5. GPS Domicilio (`/demos/purificadora/gps`)
- **Mapa SVG simulado:** h-280px móvil / h-420px desktop. Grid de calles, ruta (polyline azul), paradas (círculos verdes), base (círculo índigo), ubicación actual (azul cielo con animación pulse)
- **Header responsive:** flex-col en móvil, flex-row en desktop
- **Info del vehículo:** Nombre, placa, ID dispositivo GPS
- **Stats de jornada (2×2):** Km recorridos, paradas realizadas, tiempo en ruta, tiempo detenido
- **Info adicional:** Hora de salida, regreso estimado, promedio diario km
- **Alertas:** Tipo, mensaje, hora, nivel de severidad
- **Resumen semanal (6 cols):** Lun-Sáb con km, paradas, salida, regreso
- Textos mínimo `text-[11px]` (no más text-[9px] o text-[10px])
- Nota: "Datos obtenidos via PAJ GPS Vehicle Finder 4G · API en tiempo real"

### 6. Clientes (`/demos/purificadora/clientes`)
- Header responsive: flex-col en móvil (search full-width), flex-row en desktop (search w-64)
- Búsqueda en tiempo real por nombre, teléfono, dirección, colonia (`h-11` en móvil)
- **Desktop:** Tabla con 6 columnas (Nombre, Teléfono, Colonia, Pedidos, Total Gastado, Último Pedido)
- **Móvil:** Card list — cada cliente muestra nombre+total gastado arriba, teléfono, colonia+pedidos abajo
- Conteo de clientes activos vs total registrados

## Sidebar / Navegación

Componente: `src/components/shared/demo-sidebar.tsx`

| Item | Icono | Ruta | Subtítulo |
|---|---|---|---|
| Dashboard | LayoutDashboard | `/demos/purificadora` | KPIs e ingresos del día |
| Ventas Domicilio | Truck | `.../ventas-domicilio` | Entregas a domicilio |
| Ventas Físico | ShoppingCart | `.../ventas` | Ventas en punto de venta |
| Ventas | ClipboardList | `.../todas-ventas` | Consulta y filtra ventas |
| GPS Domicilio | MapPin | `.../gps` | Ubicación en tiempo real |
| Clientes | Users | `.../clientes` | Base de clientes |

- Logo RushData arriba
- Highlight de página activa con `bg-accent` + `ChevronRight`
- Footer: "PURIFICADORA EL BALUARTE" / "Gestión de entregas con IA"
- **Desktop (≥768px):** `<aside>` fijo `w-60`, fondo glassmorphic con backdrop blur
- **Móvil (<768px):** Header fijo `h-14` con botón hamburguesa + Sheet (drawer) desde la izquierda. Se cierra automáticamente al navegar (usePathname + useEffect)
- Contenido de navegación extraído a componente interno `SidebarContent` (reutilizado en desktop y sheet)

## Estructura de datos mock (purificadora.json)

```
{
  empresa: { nombre, repartidor, productos[], fecha_actualizacion }
  kpis: {
    ingresos_hoy, ingresos_semana, ingresos_mes, variacion_mes,
    entregas_hoy, pendientes_hoy, total_ventas_hoy,
    total_clientes, clientes_activos,
    desglose_hoy: [...], desglose_mes: [...]
  }
  ingresos_7_dias: [{ fecha, dia, monto }]
  garrafones_por_semana: [{ semana, cantidad }]
  ruta_activa: { tipo, estado, ventas_entregadas, total_ventas, total_monto }
  ultimas_ventas: [{ id, numero_venta, cliente_nombre, producto_nombre, cantidad, unidad, monto_total, estado, fuente }]
  todas_ventas: [{ numero_venta, cliente_nombre, cliente_colonia, producto_id, producto_nombre, cantidad, unidad, monto_total, estado, estado_pago, metodo_pago, fuente, fecha_ruta, created_at }]
  clientes: [{ id, nombre, telefono, direccion, colonia, total_pedidos, total_gastado, ultimo_pedido }]
  gps: {
    estado, vehiculo, placa, dispositivo,
    ubicacion_actual: { direccion, velocidad_kmh, ultima_actualizacion },
    ruta_puntos: [{ lat, lng, velocidad_kmh, hora, es_parada }],
    jornada_hoy: { km_recorridos, paradas_realizadas, tiempo_en_ruta, tiempo_detenido, ... },
    historial_semanal: { lun, mar, mie, jue, vie, sab },
    alertas: [{ tipo, mensaje, hora, nivel }]
  }
}
```

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

## Integraciones planeadas

### WhatsApp Business API (Meta Cloud API)
- El repartidor envía resumen diario por WhatsApp en formato simple
- El sistema registra automáticamente las ventas reportadas
- Clientes pueden pedir garrafones por WhatsApp

### PAJ-Portal GPS API
- Rastreo en tiempo real de la camioneta del repartidor
- Endpoints: autenticación, gestión de vehículos, ubicación, velocidad, batería
- Home Assistant integration revela endpoints adicionales
- Por ahora se usa mockup; implementación real requiere credenciales del cliente

### n8n (automatización)
- Procesamiento de mensajes WhatsApp
- Registro automático de ventas
- Reconciliación de pagos

### Supabase (base de datos)
- PostgreSQL para almacenamiento
- Real-time subscriptions para updates en vivo
- Storage para evidencias fotográficas
- Auth para autenticación de usuarios

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
