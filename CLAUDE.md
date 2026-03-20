# CLAUDE.md — Purificadora El Baluarte

## Sobre el proyecto

Sistema de gestión de ventas y entregas para **Purificadora El Baluarte**, una purificadora de agua en Monterrey, NL. El sistema tiene dos canales de registro de ventas (Tiburcio para domicilio, físico para punto de venta), un dashboard con KPIs, GPS del repartidor, y un historial completo de ventas filtrable.

### Cliente
- **Negocio:** Purificadora de agua con entregas a domicilio y ventas en punto de venta
- **Repartidor:** Tiburcio — hace ~30 entregas/día en camioneta (Chevrolet NP300 2021)
- **Administradora:** Registra ventas físicas y supervisa operación desde el dashboard
- **GPS:** PAJ Vehicle Finder 4G instalado en la camioneta

### Problema que resuelve
Todo se lleva en papel (notas de remisión físicas). No hay visibilidad de ventas en tiempo real, no se sabe cuánto se vendió hasta contar efectivo, y los pedidos por WhatsApp se pierden.

## Stack técnico (demo actual)

- Next.js 16 + App Router
- React 19 + TypeScript
- Tailwind CSS 4
- shadcn/ui (new-york style, neutral base)
- Recharts (gráficas)
- Lucide React (iconos)
- Plus Jakarta Sans (tipografía)
- Datos mock en JSON (generados con Python)

### Stack planeado para producción
- **Frontend/Hosting:** Vercel + Next.js
- **Backend/Automatización:** n8n
- **Base de datos:** Supabase
- **Infraestructura:** Railway
- **WhatsApp:** Meta Cloud API (WhatsApp Business)
- **GPS:** PAJ-Portal API

## Estructura de archivos

```
purificadora-el-baluarte/
├── CLAUDE.md                  # Este archivo
├── gen_purificadora.py        # Generador de datos mock (Python)
├── purificadora.json          # Datos mock generados
├── demo-pages/                # Páginas Next.js de la demo
│   ├── layout.tsx             # Layout con sidebar (DemoSidebar)
│   ├── page.tsx               # Dashboard principal (KPIs, gráficas)
│   ├── ventas-tiburcio/       # Registro de entregas a domicilio
│   │   └── page.tsx
│   ├── ventas/                # Registro de ventas en punto de venta (físico)
│   │   └── page.tsx
│   ├── todas-ventas/          # Tabla de todas las ventas con filtros
│   │   └── page.tsx
│   ├── gps/                   # GPS en tiempo real de Tiburcio
│   │   └── page.tsx
│   └── clientes/              # Base de clientes
│       └── page.tsx
└── demo-components/           # Componentes de gráficas
    ├── ingresos-chart.tsx     # Gráfica de ingresos (BarChart)
    └── garrafones-chart.tsx   # Gráfica de garrafones por semana (AreaChart)
```

## Productos y precios

### Ventas Tiburcio (entregas a domicilio)
| Producto | Precio | Unidad |
|---|---|---|
| Llenado Garrafón 20L | $25 | pza |
| Garrafón 20L (nuevo) | $110 | pza |
| Botella 1L | $9 | pza |
| Botella 500ml | $6 | pza |

- Métodos de pago: Efectivo, Transferencia
- Requiere seleccionar cliente

### Ventas Físico (punto de venta)
| Producto | Precio | Unidad | Litros por unidad |
|---|---|---|---|
| Llenado Garrafón 20L | $20 | pza | 20 |
| Llenado Garrafón 4-10L | $10 | litro | 1 |
| Garrafón 20L (nuevo) | $110 | pza | 20 |
| Botella 1L | $10 | pza | 1 |

- Métodos de pago: Efectivo, Transferencia, Crédito
- Tiene selector de turno (Matutino/Vespertino)
- Tiene cuentalitros automático (lectura inicial manual, final = inicial + litros totales)
- No requiere seleccionar cliente

### Notas
- Algunos clientes tienen precios de mayoreo (pendiente de implementar)
- Tiburcio tiene precios diferentes al punto de venta físico
- La lectura de cuentalitros se reinicia a principio de cada mes

## Campos de cada venta

- Cliente (solo en Tiburcio)
- Turno (solo en físico)
- Productos (tabla con cantidad e importe auto-calculado)
- Cuentalitros inicial/final (solo en físico)
- Método de pago
- Estado de pago: Pagado / No Pagado
- Evidencia fotográfica (opcional, sin etiquetarlo como opcional)

## Secciones del sistema

1. **Dashboard** — KPIs (ingresos hoy/semana/mes, entregas, clientes activos), desglose por producto, gráfica de ingresos 7 días, ruta activa, últimas ventas
2. **Ventas Tiburcio** — Formulario de registro de entregas a domicilio
3. **Ventas Físico** — Formulario de registro de ventas en punto de venta con cuentalitros
4. **Ventas** — Tabla completa con filtros (periodo, método pago, estado pago, fuente), buscador, resumen de totales
5. **GPS Tiburcio** — Mapa simulado con ruta, stats del vehículo, alertas, historial semanal
6. **Clientes** — Base de datos de clientes con búsqueda

## Integraciones planeadas

### WhatsApp Business API (Meta Cloud API)
- Tiburcio envía resumen diario por WhatsApp en formato simple
- El sistema registra automáticamente las ventas reportadas
- Clientes pueden pedir garrafones por WhatsApp

### PAJ-Portal GPS API
- Rastreo en tiempo real de la camioneta de Tiburcio
- Endpoints disponibles: autenticación, gestión de vehículos
- Home Assistant integration revela endpoints adicionales (ubicación, velocidad, batería)
- Por ahora se usa mockup; implementación real requiere credenciales del cliente

## Diseño

- UI estilo Notion: minimalista, whitespace, tipografía limpia, bordes sutiles
- Color acento: sky (azul cielo)
- Todo el texto en español (mercado mexicano)
- Responsive design

## Empresa desarrolladora

**RushData** — Consultoría tecnológica en Monterrey, NL
- Web: www.rushdata.com.mx
- Stack: Vercel, Next.js, n8n, Supabase, Railway
