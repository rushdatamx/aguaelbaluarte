"""Genera el manual del vendedor en PDF (Carta, una sola hoja)."""
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

FONTS_DIR = Path.home() / ".claude" / "skills" / "canvas-design" / "canvas-fonts"
OUTPUT = Path(__file__).parent / "manual-vendedor-purificadora-el-baluarte.pdf"

# Register fonts
pdfmetrics.registerFont(TTFont("Body", str(FONTS_DIR / "InstrumentSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("BodyBold", str(FONTS_DIR / "InstrumentSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Display", str(FONTS_DIR / "WorkSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Mono", str(FONTS_DIR / "GeistMono-Regular.ttf")))

# Colors (paleta sky tipo la app)
SKY = HexColor("#0EA5E9")        # sky-500
SKY_LIGHT = HexColor("#E0F2FE")  # sky-100
SKY_DARK = HexColor("#0369A1")   # sky-700
INK = HexColor("#0F172A")        # slate-900
TEXT = HexColor("#334155")       # slate-700
MUTED = HexColor("#64748B")      # slate-500
BORDER = HexColor("#E2E8F0")     # slate-200
BG_SOFT = HexColor("#F8FAFC")    # slate-50
AMBER_BG = HexColor("#FEF3C7")   # amber-100
AMBER_BORDER = HexColor("#FCD34D")  # amber-300
AMBER_TEXT = HexColor("#92400E") # amber-800


def truck_icon(c, x, y, size=18, color=SKY):
    """Camion estilizado, glyph-style."""
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    s = size / 20.0
    # cabina (right) y caja (left)
    # cabina: rectangle
    c.roundRect(x + 11*s, y + 5*s, 6*s, 7*s, 1.2*s, stroke=1, fill=0)
    # caja
    c.roundRect(x + 1*s, y + 3*s, 10*s, 9*s, 1.2*s, stroke=1, fill=0)
    # techo de cabina mas alto
    c.line(x + 11*s, y + 12*s, x + 17*s, y + 12*s)
    # ruedas
    r = 1.6*s
    c.circle(x + 5*s, y + 3*s, r, stroke=1, fill=1)
    c.circle(x + 14*s, y + 3*s, r, stroke=1, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.circle(x + 5*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.circle(x + 14*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.restoreState()


def cart_icon(c, x, y, size=18, color=SKY):
    """Carrito de supermercado estilizado."""
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    s = size / 20.0
    # mango
    c.line(x + 1*s, y + 15*s, x + 4*s, y + 15*s)
    c.line(x + 4*s, y + 15*s, x + 6*s, y + 7*s)
    # canasta (trapezoide)
    p = c.beginPath()
    p.moveTo(x + 6*s, y + 7*s)
    p.lineTo(x + 17*s, y + 7*s)
    p.lineTo(x + 15*s, y + 13*s)
    p.lineTo(x + 7.5*s, y + 13*s)
    p.close()
    c.drawPath(p, stroke=1, fill=0)
    # ruedas
    r = 1.4*s
    c.circle(x + 8*s, y + 3*s, r, stroke=1, fill=1)
    c.circle(x + 15*s, y + 3*s, r, stroke=1, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.circle(x + 8*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.circle(x + 15*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.restoreState()


def droplet_icon(c, x, y, size=14, color=SKY):
    """Gotita de agua como marca."""
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    s = size / 20.0
    p = c.beginPath()
    cx = x + 10*s
    cy_base = y + 2*s
    cy_tip = y + 17*s
    p.moveTo(cx, cy_tip)
    p.curveTo(cx + 9*s, y + 10*s, cx + 6*s, cy_base, cx, cy_base)
    p.curveTo(cx - 6*s, cy_base, cx - 9*s, y + 10*s, cx, cy_tip)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.restoreState()


def step_number(c, x, y, n, color=SKY):
    """Círculo numerado tipo badge."""
    c.saveState()
    c.setFillColor(color)
    c.circle(x, y, 9, stroke=0, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Display", 9.5)
    c.drawCentredString(x, y - 3.2, str(n))
    c.restoreState()


def draw_section(c, x, y, width, height, title, subtitle, icon_fn, steps):
    """Dibuja una sección completa (Domicilio o Físico)."""
    # Card background
    c.saveState()
    c.setFillColor(BG_SOFT)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y - height, width, height, 12, stroke=1, fill=1)
    c.restoreState()

    # Encabezado: ícono + título + subtítulo
    icon_x = x + 24
    icon_y = y - 40
    icon_fn(c, icon_x, icon_y, size=22)

    c.setFillColor(INK)
    c.setFont("Display", 17)
    c.drawString(x + 60, y - 30, title)

    c.setFillColor(MUTED)
    c.setFont("Body", 9.5)
    c.drawString(x + 60, y - 44, subtitle)

    # Separador
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(x + 24, y - 60, x + width - 24, y - 60)

    # Pasos
    step_x = x + 32
    step_text_x = x + 50
    text_max_w = width - 70
    step_y = y - 84
    spacing = 30

    c.setFont("Body", 10)
    for i, step in enumerate(steps, 1):
        step_number(c, step_x, step_y, i)
        c.setFillColor(INK)
        c.setFont("BodyBold", 9.5)
        # break en dos líneas si es muy largo
        words = step.split()
        line1, line2 = [], []
        cur = line1
        for w in words:
            test = " ".join(cur + [w])
            if c.stringWidth(test, "BodyBold", 9.5) > text_max_w and cur is line1:
                cur = line2
            cur.append(w)
        c.drawString(step_text_x, step_y - 2.5, " ".join(line1))
        if line2:
            c.setFont("Body", 9.5)
            c.setFillColor(TEXT)
            c.drawString(step_text_x, step_y - 14, " ".join(line2))
            step_y -= spacing + 4
        else:
            step_y -= spacing


def main():
    c = rl_canvas.Canvas(str(OUTPUT), pagesize=LETTER)
    page_w, page_h = LETTER

    # ---- Header ----
    # Marca arriba: gotita + nombre purificadora
    droplet_icon(c, 56, page_h - 76, size=22, color=SKY)
    c.setFillColor(MUTED)
    c.setFont("Body", 8.5)
    c.drawString(82, page_h - 56, "PURIFICADORA EL BALUARTE")
    c.setFillColor(INK)
    c.setFont("Display", 22)
    c.drawString(82, page_h - 75, "Manual del Vendedor")

    # línea decorativa derecha
    c.setStrokeColor(SKY)
    c.setLineWidth(1.5)
    c.line(page_w - 130, page_h - 64, page_w - 56, page_h - 64)
    c.setFillColor(MUTED)
    c.setFont("Mono", 7.5)
    c.drawRightString(page_w - 56, page_h - 78, "v1.0 · 2026")

    # subtítulo
    c.setFillColor(TEXT)
    c.setFont("Body", 10.5)
    c.drawString(82, page_h - 96, "Cómo registrar una venta en la app — ten esta hoja a la mano")

    # Separador grueso bajo header
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(56, page_h - 112, page_w - 56, page_h - 112)

    # ---- 2 secciones (stacked vertical) ----
    margin = 56
    card_w = page_w - 2 * margin
    card_h = 245

    # Sección 1: Venta a Domicilio
    top1 = page_h - 132
    domicilio_steps = [
        "Selecciona el cliente del menú (o deja Público en general)",
        "Toca + en cada producto para agregar cantidad",
        "Elige método de pago: Efectivo o Transferencia",
        "Marca estado de pago: Pagado o No Pagado",
        "(Opcional) Adjunta evidencia fotográfica",
        'Toca "Registrar Entrega"',
    ]
    draw_section(
        c, margin, top1, card_w, card_h,
        title="Venta a Domicilio",
        subtitle="Sidebar → Ventas Domicilio",
        icon_fn=truck_icon,
        steps=domicilio_steps,
    )

    # Sección 2: Venta en Punto de Venta
    top2 = top1 - card_h - 18
    fisico_steps = [
        "Elige el turno: Matutino o Vespertino",
        "Captura cuentalitros: Lectura Inicial y Final",
        "Toca + en cada producto (no excedas los litros disponibles)",
        "Elige método de pago: Efectivo, Transferencia o Crédito",
        "Marca estado de pago: Pagado o No Pagado",
        'Toca "Registrar Venta"',
    ]
    draw_section(
        c, margin, top2, card_w, card_h,
        title="Venta en Punto de Venta",
        subtitle="Sidebar → Ventas Físico",
        icon_fn=cart_icon,
        steps=fisico_steps,
    )

    # ---- Tip box (amber) ----
    tip_top = top2 - card_h - 18
    tip_h = 44
    c.saveState()
    c.setFillColor(AMBER_BG)
    c.setStrokeColor(AMBER_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(margin, tip_top - tip_h, card_w, tip_h, 8, stroke=1, fill=1)
    # Etiqueta TIP
    c.setFillColor(AMBER_TEXT)
    c.setFont("BodyBold", 8.5)
    c.drawString(margin + 18, tip_top - 17, "TIP")
    # contenido
    c.setFillColor(HexColor("#78350F"))
    c.setFont("Body", 10)
    c.drawString(margin + 50, tip_top - 17,
                 "El cliente por defecto es \"Público en general\".")
    c.setFillColor(AMBER_TEXT)
    c.setFont("Body", 9.5)
    c.drawString(margin + 50, tip_top - 32,
                 "Cámbialo solo si el cliente ya está registrado en el sistema.")
    c.restoreState()

    # ---- Footer ----
    footer_y = 56
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.5)
    c.line(margin, footer_y + 18, page_w - margin, footer_y + 18)

    c.setFillColor(MUTED)
    c.setFont("Body", 8)
    c.drawString(margin, footer_y, "aguaelbaluarte.vercel.app")

    c.setFillColor(INK)
    c.setFont("Display", 9)
    c.drawRightString(page_w - margin, footer_y + 3, "RushData")
    c.setFillColor(MUTED)
    c.setFont("Body", 7.5)
    c.drawRightString(page_w - margin, footer_y - 8, "rushdata.com.mx")

    c.save()
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    main()
