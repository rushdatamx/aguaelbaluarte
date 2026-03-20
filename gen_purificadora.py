"""
Generador de datos mock para Demo 10: Purificadora El Baluarte
Sistema de Gestion de Entregas — purificadora de agua con ~30 entregas/dia,
un repartidor (Tiburcio), y un dueno basico en tech.

Productos: Garrafon 20L, Botella 1L, Botella 500ml, Cuentalitros
Fuentes de registro: admin (administradora), tiburcio (reporte WhatsApp)
"""
import json
import random
import math
from datetime import datetime, timedelta

random.seed(42)

# --- Configuracion ---
HOY = datetime(2026, 3, 9)
INICIO_HISTORICO = HOY - timedelta(days=60)
HOY_STR = HOY.strftime("%Y-%m-%d")

PRODUCTOS = [
    {"id": "garrafon_20l", "nombre": "Garrafon 20L", "precio": 35, "unidad": "pza"},
    {"id": "botella_1l", "nombre": "Botella 1L", "precio": 12, "unidad": "pza"},
    {"id": "botella_500ml", "nombre": "Botella 500ml", "precio": 8, "unidad": "pza"},
    {"id": "cuentalitros", "nombre": "Cuentalitros", "precio": 3, "unidad": "litro"},
]

# Peso de cada producto en ventas
PRODUCTO_WEIGHTS = [60, 15, 10, 15]

# --- Colonias de Monterrey ---
colonias = [
    "Col. Mitras Centro", "Col. Cumbres", "Col. Del Valle", "Col. Contry",
    "Col. San Jeronimo", "Col. Vista Hermosa", "Col. Roma", "Col. Anahuac",
    "Col. Tecnologico", "Col. Obispado", "Col. Linda Vista", "Col. Moderna",
    "Col. Terminal", "Col. Centro", "Col. Chepevera", "Col. Buenos Aires",
    "Col. Altavista", "Col. Las Brisas", "Col. Lomas de San Francisco",
    "Col. Residencial Lincoln",
]

calles = [
    "Av. Revolucion", "Calle Hidalgo", "Av. Garza Sada", "Calle Morelos",
    "Av. Constitucion", "Calle Juarez", "Av. Madero", "Calle Zaragoza",
    "Av. Universidad", "Calle 5 de Mayo", "Av. Morones Prieto", "Calle Allende",
    "Av. Colon", "Calle Matamoros", "Av. Lazaro Cardenas", "Calle Pino Suarez",
]

# --- Generar clientes ---
nombres_clientes = [
    "Maria Lopez", "Juan Garcia", "Rosa Martinez", "Pedro Hernandez",
    "Ana Ramirez", "Carlos Torres", "Lupita Flores", "Miguel Sanchez",
    "Teresa Diaz", "Roberto Gonzalez", "Carmen Ruiz", "Fernando Morales",
    "Patricia Castillo", "Alejandro Vargas", "Claudia Mendoza",
    "Ricardo Jimenez", "Sofia Gutierrez", "Jose Reyes", "Laura Ortiz",
    "Alberto Cruz", "Marta Rivera", "Enrique Aguilar", "Beatriz Romero",
    "Raul Herrera", "Alicia Medina", "Francisco Navarro", "Isabel Dominguez",
    "Daniel Suarez", "Veronica Guerrero", "Sergio Castro",
    "Gloria Pena", "Hector Delgado", "Nora Vega", "Pablo Rios",
    "Elena Soto", "Luis Campos", "Martha Nunez", "Oscar Ibarra",
    "Adriana Mejia", "Jorge Molina",
]

clientes = []
for i, nombre in enumerate(nombres_clientes):
    col = random.choice(colonias)
    calle = random.choice(calles)
    num = random.randint(100, 2500)
    telefono = f"81{random.randint(1000, 9999)}{random.randint(1000, 9999)}"
    clientes.append({
        "id": f"cli-{i+1:03d}",
        "nombre": nombre,
        "telefono": telefono,
        "direccion": f"{calle} #{num}, {col}",
        "colonia": col,
        "referencia": random.choice([
            "Casa azul con porton negro", "Frente a la tiendita",
            "A lado del parque", "Edificio esquina, depto 3",
            "Casa con barda cafe", "Junto a la farmacia",
            "Atras de la escuela", "Casa blanca con rejas", "", "",
        ]),
        "notas": random.choice([
            "Prefiere pago en efectivo", "Siempre pide 3 garrafones",
            "Cliente desde 2024", "A veces no esta, dejar con vecina",
            "Pide cada semana", "", "", "",
        ]),
        "created_at": (INICIO_HISTORICO - timedelta(days=random.randint(0, 180))).isoformat(),
    })


def pick_producto():
    prod = random.choices(PRODUCTOS, weights=PRODUCTO_WEIGHTS)[0]
    if prod["id"] == "garrafon_20l":
        cantidad = random.choices([1, 2, 3, 4, 5, 6], weights=[15, 30, 25, 15, 10, 5])[0]
    elif prod["id"] == "cuentalitros":
        cantidad = random.choices([20, 40, 60, 100, 200], weights=[20, 30, 25, 15, 10])[0]
    elif prod["id"] == "botella_1l":
        cantidad = random.choices([6, 12, 24, 48], weights=[30, 35, 25, 10])[0]
    else:  # botella_500ml
        cantidad = random.choices([12, 24, 48], weights=[35, 40, 25])[0]
    return prod, cantidad


def make_venta(numero, cliente, producto, cantidad, estado, ruta, fecha_pedido, fecha_ruta, hora, fuente="admin"):
    monto = cantidad * producto["precio"]
    metodo_pago = random.choices(["efectivo", "transferencia", "credito"], weights=[65, 25, 10])[0]
    # estado_pago: pagado, no_pagado. Credito = mostly no_pagado, others mostly pagado
    if metodo_pago == "credito":
        estado_pago = random.choices(["pagado", "no_pagado"], weights=[20, 80])[0]
    else:
        estado_pago = random.choices(["pagado", "no_pagado"], weights=[92, 8])[0]
    return {
        "id": f"ven-{numero}",
        "numero_venta": numero,
        "cliente_id": cliente["id"],
        "cliente_nombre": cliente["nombre"],
        "cliente_telefono": cliente["telefono"],
        "cliente_direccion": cliente["direccion"],
        "cliente_colonia": cliente["colonia"],
        "producto_id": producto["id"],
        "producto_nombre": producto["nombre"],
        "cantidad": cantidad,
        "unidad": producto["unidad"],
        "precio_unitario": producto["precio"],
        "monto_total": monto,
        "estado": estado,
        "estado_pago": estado_pago,
        "ruta": ruta,
        "fecha_pedido": fecha_pedido.strftime("%Y-%m-%d"),
        "fecha_ruta": fecha_ruta.strftime("%Y-%m-%d"),
        "metodo_pago": metodo_pago,
        "fuente": fuente,
        "created_at": fecha_pedido.replace(hour=hora, minute=random.randint(0, 59)).isoformat(),
    }


# --- Generar ventas historicas (dias 0 a 57) ---
ventas = []
ingresos = []
numero_venta = 1000

for dia_offset in range(58):
    fecha = INICIO_HISTORICO + timedelta(days=dia_offset)
    es_domingo = fecha.weekday() == 6
    num_ventas = random.randint(5, 10) if es_domingo else random.randint(18, 38)
    if fecha.weekday() in [0, 4]:
        num_ventas = min(num_ventas + random.randint(3, 8), 42)

    for _ in range(num_ventas):
        cliente = random.choice(clientes)
        producto, cantidad = pick_producto()
        numero_venta += 1
        hora = random.randint(0, 23)
        ruta = "manana" if hora >= 15 else "tarde"
        fecha_ruta = fecha + timedelta(days=1) if hora >= 15 else fecha
        estado = random.choices(["entregado", "cancelado"], weights=[95, 5])[0]
        fuente = random.choices(["admin", "tiburcio"], weights=[60, 40])[0]

        venta = make_venta(numero_venta, cliente, producto, cantidad, estado, ruta, fecha, fecha_ruta, hora, fuente)
        ventas.append(venta)

        if estado == "entregado":
            ingresos.append({
                "id": f"ing-{numero_venta}",
                "venta_id": venta["id"],
                "monto": venta["monto_total"],
                "producto_id": producto["id"],
                "metodo_pago": venta["metodo_pago"],
                "fuente": fuente,
                "registrado_at": fecha_ruta.replace(hour=random.randint(9, 17), minute=random.randint(0, 59)).isoformat(),
            })

# --- Ayer ---
ayer = INICIO_HISTORICO + timedelta(days=58)
for _ in range(30):
    cliente = random.choice(clientes)
    producto, cantidad = pick_producto()
    numero_venta += 1
    hora = random.randint(0, 23)
    ruta = "manana" if hora >= 15 else "tarde"
    fecha_ruta = ayer + timedelta(days=1) if hora >= 15 else ayer
    fuente = random.choices(["admin", "tiburcio"], weights=[55, 45])[0]

    venta = make_venta(numero_venta, cliente, producto, cantidad, "entregado", ruta, ayer, fecha_ruta, hora, fuente)
    ventas.append(venta)
    ingresos.append({
        "id": f"ing-{numero_venta}",
        "venta_id": venta["id"],
        "monto": venta["monto_total"],
        "producto_id": producto["id"],
        "metodo_pago": venta["metodo_pago"],
        "fuente": fuente,
        "registrado_at": fecha_ruta.replace(hour=random.randint(9, 17), minute=random.randint(0, 59)).isoformat(),
    })

# --- HOY: ventas explicitas ---
# Ruta manana: 15 entregas (10 entregadas, 3 en camino, 2 asignadas)
ruta_manana_estados = ["entregado"] * 10 + ["en_camino"] * 3 + ["asignado"] * 2
random.shuffle(ruta_manana_estados)
clientes_manana = random.sample(clientes, 15)

for cliente, estado in zip(clientes_manana, ruta_manana_estados):
    producto, cantidad = pick_producto()
    numero_venta += 1
    fuente = "tiburcio" if estado == "entregado" else "admin"
    venta = make_venta(numero_venta, cliente, producto, cantidad, estado, "manana", ayer, HOY, random.randint(15, 22), fuente)
    ventas.append(venta)
    if estado == "entregado":
        ingresos.append({
            "id": f"ing-{numero_venta}",
            "venta_id": venta["id"],
            "monto": venta["monto_total"],
            "producto_id": producto["id"],
            "metodo_pago": venta["metodo_pago"],
            "fuente": fuente,
            "registrado_at": HOY.replace(hour=random.randint(10, 12), minute=random.randint(0, 59)).isoformat(),
        })

# Ruta tarde: 12 pedidos pendientes
ruta_tarde_estados = ["asignado"] * 8 + ["pendiente"] * 4
random.shuffle(ruta_tarde_estados)
clientes_tarde = random.sample([c for c in clientes if c not in clientes_manana], 12)

for cliente, estado in zip(clientes_tarde, ruta_tarde_estados):
    producto, cantidad = pick_producto()
    numero_venta += 1
    venta = make_venta(numero_venta, cliente, producto, cantidad, estado, "tarde", HOY, HOY, random.randint(6, 13), "admin")
    ventas.append(venta)

# --- Ventas del dia (para pagina de registro) ---
ventas_hoy = sorted(
    [v for v in ventas if v["fecha_ruta"] == HOY_STR],
    key=lambda x: x["created_at"], reverse=True
)

# --- Generar rutas ---
rutas = []
fechas_unicas = sorted(set(v["fecha_ruta"] for v in ventas))

for fecha_str in fechas_unicas:
    for tipo_ruta in ["manana", "tarde"]:
        ventas_ruta = [v for v in ventas if v["fecha_ruta"] == fecha_str and v["ruta"] == tipo_ruta]
        if not ventas_ruta:
            continue
        entregados = sum(1 for v in ventas_ruta if v["estado"] == "entregado")
        cancelados = sum(1 for v in ventas_ruta if v["estado"] == "cancelado")
        activos = len(ventas_ruta) - cancelados
        total_monto = sum(v["monto_total"] for v in ventas_ruta)

        if entregados == activos and activos > 0:
            estado_ruta = "completada"
        elif entregados > 0 or any(v["estado"] in ["en_camino", "asignado"] for v in ventas_ruta):
            estado_ruta = "en_progreso"
        else:
            estado_ruta = "pendiente"

        rutas.append({
            "id": f"ruta-{fecha_str}-{tipo_ruta}",
            "tipo": tipo_ruta,
            "fecha": fecha_str,
            "estado": estado_ruta,
            "total_ventas": len(ventas_ruta),
            "total_monto": total_monto,
            "ventas_entregadas": entregados,
            "ventas_ids": [v["id"] for v in ventas_ruta],
        })

# --- KPIs ---
hoy_str = HOY_STR
inicio_semana = (HOY - timedelta(days=HOY.weekday())).strftime("%Y-%m-%d")
inicio_mes = HOY.replace(day=1).strftime("%Y-%m-%d")

ventas_hoy_all = [v for v in ventas if v["fecha_ruta"] == hoy_str]
ingresos_hoy = sum(i["monto"] for i in ingresos if i["registrado_at"][:10] == hoy_str)
ingresos_semana = sum(i["monto"] for i in ingresos if i["registrado_at"][:10] >= inicio_semana)
ingresos_mes = sum(i["monto"] for i in ingresos if i["registrado_at"][:10] >= inicio_mes)

inicio_mes_ant = (HOY.replace(day=1) - timedelta(days=1)).replace(day=1).strftime("%Y-%m-%d")
fin_mes_ant = (HOY.replace(day=1) - timedelta(days=1)).strftime("%Y-%m-%d")
ingresos_mes_ant = sum(i["monto"] for i in ingresos if inicio_mes_ant <= i["registrado_at"][:10] <= fin_mes_ant)
variacion_mes = round(((ingresos_mes - ingresos_mes_ant) / ingresos_mes_ant * 100) if ingresos_mes_ant > 0 else 0, 1)

entregas_hoy = sum(1 for v in ventas_hoy_all if v["estado"] == "entregado")
pendientes_hoy = sum(1 for v in ventas_hoy_all if v["estado"] in ["pendiente", "asignado", "en_camino"])

# Desglose por producto hoy
def desglose_productos(ventas_list):
    result = {}
    for prod in PRODUCTOS:
        vs = [v for v in ventas_list if v["producto_id"] == prod["id"] and v["estado"] == "entregado"]
        result[prod["id"]] = {
            "nombre": prod["nombre"],
            "cantidad": sum(v["cantidad"] for v in vs),
            "unidad": prod["unidad"],
            "monto": sum(v["monto_total"] for v in vs),
            "ventas": len(vs),
        }
    return result

desglose_hoy = desglose_productos(ventas_hoy_all)
desglose_mes = desglose_productos([v for v in ventas if v["fecha_ruta"] >= inicio_mes])

# --- Ingresos ultimos 7 dias ---
ingresos_7_dias = []
dias_semana_es = {"Mon": "Lun", "Tue": "Mar", "Wed": "Mie", "Thu": "Jue", "Fri": "Vie", "Sat": "Sab", "Sun": "Dom"}
for i in range(7):
    dia = HOY - timedelta(days=6 - i)
    dia_str = dia.strftime("%Y-%m-%d")
    dia_en = dia.strftime("%a")
    dia_label = f"{dias_semana_es.get(dia_en, dia_en)} {dia.strftime('%d')}"
    monto_dia = sum(ing["monto"] for ing in ingresos if ing["registrado_at"][:10] == dia_str)
    ingresos_7_dias.append({"fecha": dia_str, "dia": dia_label, "monto": monto_dia})

# --- Garrafones por semana (ultimas 8 semanas) ---
garrafones_por_semana = []
for w in range(8):
    inicio_sem = HOY - timedelta(weeks=8 - w, days=HOY.weekday())
    fin_sem = inicio_sem + timedelta(days=6)
    total_g = sum(
        v["cantidad"] for v in ventas
        if v["producto_id"] == "garrafon_20l"
        and inicio_sem.strftime("%Y-%m-%d") <= v["fecha_ruta"] <= fin_sem.strftime("%Y-%m-%d")
        and v["estado"] == "entregado"
    )
    garrafones_por_semana.append({
        "semana": f"Sem {w + 1}",
        "inicio": inicio_sem.strftime("%Y-%m-%d"),
        "fin": fin_sem.strftime("%Y-%m-%d"),
        "garrafones": total_g,
    })

# --- Ruta activa de hoy ---
ruta_activa = None
for r in rutas:
    if r["fecha"] == hoy_str and r["estado"] == "en_progreso":
        ruta_activa = r
        break
if not ruta_activa:
    rutas_hoy = [r for r in rutas if r["fecha"] == hoy_str]
    if rutas_hoy:
        ruta_activa = rutas_hoy[0]

# --- Ultimos 10 pedidos ---
ultimas_ventas = sorted(ventas, key=lambda x: x["created_at"], reverse=True)[:10]

# --- Actualizar totales de clientes ---
for cliente in clientes:
    ventas_cliente = [v for v in ventas if v["cliente_id"] == cliente["id"]]
    cliente["total_pedidos"] = len(ventas_cliente)
    cliente["total_gastado"] = sum(v["monto_total"] for v in ventas_cliente if v["estado"] == "entregado")
    if ventas_cliente:
        cliente["ultimo_pedido"] = max(v["fecha_pedido"] for v in ventas_cliente)
    else:
        cliente["ultimo_pedido"] = None

# --- Pedidos de hoy para rutas ---
ventas_ruta_manana = sorted(
    [v for v in ventas if v["fecha_ruta"] == hoy_str and v["ruta"] == "manana"],
    key=lambda x: x["cliente_colonia"]
)
ventas_ruta_tarde = sorted(
    [v for v in ventas if v["fecha_ruta"] == hoy_str and v["ruta"] == "tarde"],
    key=lambda x: x["cliente_colonia"]
)

# --- GPS Mock Data (simulacion de PAJ-Portal API) ---
# Ruta de Tiburcio hoy: salio a las 9:45am de la purificadora, son las ~11:30am
BASE_LAT = 25.6866  # Monterrey centro
BASE_LNG = -100.3161

# Puntos de la ruta recorrida (simulando paradas en colonias)
gps_ruta_puntos = []
num_puntos = 25
for i in range(num_puntos):
    t = i / (num_puntos - 1)
    # Ruta que sale del centro hacia Cumbres y regresa
    lat = BASE_LAT + 0.02 * math.sin(t * math.pi) + random.uniform(-0.002, 0.002)
    lng = BASE_LNG - 0.03 * t + random.uniform(-0.002, 0.002)
    hora_punto = 9 + (t * 2.5)  # de 9:45 a ~12:15
    h = int(hora_punto)
    m = int((hora_punto - h) * 60)
    velocidad = random.randint(0, 45) if i % 3 != 0 else 0  # paradas cada 3 puntos
    gps_ruta_puntos.append({
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "velocidad_kmh": velocidad,
        "hora": f"{h:02d}:{m:02d}",
        "es_parada": velocidad == 0,
    })

gps_data = {
    "dispositivo": "PAJ Vehicle Finder 4G",
    "vehiculo": "Chevrolet NP300 2021 - Blanca",
    "placa": "STY-4821",
    "estado": "en_ruta",  # en_ruta / detenido / en_base
    "ubicacion_actual": {
        "lat": gps_ruta_puntos[-1]["lat"],
        "lng": gps_ruta_puntos[-1]["lng"],
        "velocidad_kmh": 28,
        "direccion": "Av. Universidad #1450, Col. Mitras Centro",
        "ultima_actualizacion": "11:32 AM",
    },
    "jornada_hoy": {
        "hora_salida": "9:45 AM",
        "hora_regreso_estimada": "2:30 PM",
        "km_recorridos": 18.4,
        "km_promedio_diario": 42,
        "paradas_realizadas": sum(1 for p in gps_ruta_puntos if p["es_parada"]),
        "tiempo_en_ruta": "1h 47min",
        "tiempo_detenido": "38min",
    },
    "ruta_puntos": gps_ruta_puntos,
    "alertas": [
        {"tipo": "velocidad", "mensaje": "Excedio 40 km/h en zona escolar", "hora": "10:15 AM", "nivel": "warning"},
    ],
    "historial_semanal": {
        "lun": {"km": 38.2, "paradas": 14, "salida": "9:30 AM", "regreso": "3:15 PM"},
        "mar": {"km": 45.1, "paradas": 18, "salida": "9:45 AM", "regreso": "4:00 PM"},
        "mie": {"km": 41.3, "paradas": 16, "salida": "9:40 AM", "regreso": "3:30 PM"},
        "jue": {"km": 43.7, "paradas": 17, "salida": "9:35 AM", "regreso": "3:45 PM"},
        "vie": {"km": 48.9, "paradas": 20, "salida": "9:30 AM", "regreso": "4:15 PM"},
        "sab": {"km": 35.6, "paradas": 12, "salida": "10:00 AM", "regreso": "2:00 PM"},
    },
}

# --- Output ---
output = {
    "empresa": {
        "nombre": "Purificadora El Baluarte",
        "repartidor": "Tiburcio",
        "productos": PRODUCTOS,
        "fecha_actualizacion": HOY.strftime("%Y-%m-%d %H:%M"),
    },
    "kpis": {
        "ingresos_hoy": ingresos_hoy,
        "ingresos_semana": ingresos_semana,
        "ingresos_mes": ingresos_mes,
        "variacion_mes": variacion_mes,
        "entregas_hoy": entregas_hoy,
        "pendientes_hoy": pendientes_hoy,
        "total_ventas_hoy": len(ventas_hoy_all),
        "total_clientes": len(clientes),
        "clientes_activos": len([c for c in clientes if c["total_pedidos"] > 0]),
        "desglose_hoy": desglose_hoy,
        "desglose_mes": desglose_mes,
    },
    "ingresos_7_dias": ingresos_7_dias,
    "garrafones_por_semana": garrafones_por_semana,
    "ruta_activa": ruta_activa,
    "ultimas_ventas": ultimas_ventas,
    "ventas_hoy": ventas_hoy,
    "rutas": sorted(rutas, key=lambda x: (x["fecha"], x["tipo"]), reverse=True),
    "ventas_ruta_manana": ventas_ruta_manana,
    "ventas_ruta_tarde": ventas_ruta_tarde,
    "clientes": sorted(clientes, key=lambda x: x["total_pedidos"], reverse=True),
    "todas_ventas": sorted(ventas, key=lambda x: x["fecha_ruta"], reverse=True),
    "historial": sorted(
        [v for v in ventas if v["estado"] == "entregado"],
        key=lambda x: x["fecha_ruta"], reverse=True
    ),
    "gps": gps_data,
}

output_path = "/Users/jmariopgarcia/Desktop/2026/RushData/DEMOS/portfolio/public/data/purificadora.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

print(f"Generado: {output_path}")
print(f"  Clientes: {len(clientes)}")
print(f"  Ventas: {len(ventas)}")
print(f"  Ingresos: {len(ingresos)}")
print(f"  Rutas: {len(rutas)}")
print(f"  Ventas hoy: {len(ventas_hoy)}")
print(f"  GPS puntos: {len(gps_ruta_puntos)}")
print(f"  KPIs hoy: ${ingresos_hoy:,.0f} | {entregas_hoy}/{len(ventas_hoy_all)} entregas | {pendientes_hoy} pendientes")
print(f"  Desglose hoy: {json.dumps({k: v['cantidad'] for k, v in desglose_hoy.items()})}")
