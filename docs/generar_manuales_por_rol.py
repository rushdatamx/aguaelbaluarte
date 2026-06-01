"""Genera dos manuales del vendedor en PDF (Carta, una sola hoja c/u):
- manual-vendedor-domicilio.pdf  (usuario: domicilio / domicilio123)
- manual-vendedor-fisico.pdf     (usuario: fisico / fisico123)
"""
from pathlib import Path

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as rl_canvas

FONTS_DIR = Path.home() / ".claude" / "skills" / "canvas-design" / "canvas-fonts"
DOCS_DIR = Path(__file__).parent

# Register fonts
pdfmetrics.registerFont(TTFont("Body", str(FONTS_DIR / "InstrumentSans-Regular.ttf")))
pdfmetrics.registerFont(TTFont("BodyBold", str(FONTS_DIR / "InstrumentSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Display", str(FONTS_DIR / "WorkSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("Mono", str(FONTS_DIR / "GeistMono-Regular.ttf")))

# Paleta sky tipo la app
SKY = HexColor("#0EA5E9")
SKY_LIGHT = HexColor("#E0F2FE")
SKY_DARK = HexColor("#0369A1")
INK = HexColor("#0F172A")
TEXT = HexColor("#334155")
MUTED = HexColor("#64748B")
BORDER = HexColor("#E2E8F0")
BG_SOFT = HexColor("#F8FAFC")
AMBER_BG = HexColor("#FEF3C7")
AMBER_BORDER = HexColor("#FCD34D")
AMBER_TEXT = HexColor("#92400E")


def truck_icon(c, x, y, size=18, color=SKY):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    s = size / 20.0
    c.roundRect(x + 11*s, y + 5*s, 6*s, 7*s, 1.2*s, stroke=1, fill=0)
    c.roundRect(x + 1*s, y + 3*s, 10*s, 9*s, 1.2*s, stroke=1, fill=0)
    c.line(x + 11*s, y + 12*s, x + 17*s, y + 12*s)
    r = 1.6*s
    c.circle(x + 5*s, y + 3*s, r, stroke=1, fill=1)
    c.circle(x + 14*s, y + 3*s, r, stroke=1, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.circle(x + 5*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.circle(x + 14*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.restoreState()


def cart_icon(c, x, y, size=18, color=SKY):
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    s = size / 20.0
    c.line(x + 1*s, y + 15*s, x + 4*s, y + 15*s)
    c.line(x + 4*s, y + 15*s, x + 6*s, y + 7*s)
    p = c.beginPath()
    p.moveTo(x + 6*s, y + 7*s)
    p.lineTo(x + 17*s, y + 7*s)
    p.lineTo(x + 15*s, y + 13*s)
    p.lineTo(x + 7.5*s, y + 13*s)
    p.close()
    c.drawPath(p, stroke=1, fill=0)
    r = 1.4*s
    c.circle(x + 8*s, y + 3*s, r, stroke=1, fill=1)
    c.circle(x + 15*s, y + 3*s, r, stroke=1, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.circle(x + 8*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.circle(x + 15*s, y + 3*s, r*0.4, stroke=0, fill=1)
    c.restoreState()


def droplet_icon(c, x, y, size=14, color=SKY):
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


def lock_icon(c, x, y, size=18, color=SKY):
    """Candado para la sección de acceso."""
    c.saveState()
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.6)
    c.setLineCap(1)
    c.setLineJoin(1)
    s = size / 20.0
    # cuerpo del candado
    c.roundRect(x + 3*s, y + 2*s, 14*s, 10*s, 1.6*s, stroke=1, fill=0)
    # arco
    c.setLineWidth(1.8)
    p = c.beginPath()
    p.moveTo(x + 6*s, y + 12*s)
    p.curveTo(x + 6*s, y + 18*s, x + 14*s, y + 18*s, x + 14*s, y + 12*s)
    c.drawPath(p, stroke=1, fill=0)
    # ojo de cerradura
    c.setFillColor(color)
    c.circle(x + 10*s, y + 7.5*s, 1.3*s, stroke=0, fill=1)
    c.restoreState()


def step_number(c, x, y, n, color=SKY):
    c.saveState()
    c.setFillColor(color)
    c.circle(x, y, 9, stroke=0, fill=1)
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFont("Display", 9.5)
    c.drawCentredString(x, y - 3.2, str(n))
    c.restoreState()


def draw_section(c, x, y, width, height, title, subtitle, icon_fn, steps):
    """Sección de pasos numerados (Domicilio o Físico)."""
    c.saveState()
    c.setFillColor(BG_SOFT)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y - height, width, height, 12, stroke=1, fill=1)
    c.restoreState()

    icon_x = x + 24
    icon_y = y - 40
    icon_fn(c, icon_x, icon_y, size=22)

    c.setFillColor(INK)
    c.setFont("Display", 17)
    c.drawString(x + 60, y - 30, title)

    c.setFillColor(MUTED)
    c.setFont("Body", 9.5)
    c.drawString(x + 60, y - 44, subtitle)

    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(x + 24, y - 60, x + width - 24, y - 60)

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


def draw_login_section(c, x, y, width, height, url, usuario, password):
    """Card destacado con URL + credenciales."""
    # Fondo más vistoso (sky light) para destacar el acceso
    c.saveState()
    c.setFillColor(SKY_LIGHT)
    c.setStrokeColor(SKY)
    c.setLineWidth(1.0)
    c.roundRect(x, y - height, width, height, 12, stroke=1, fill=1)
    c.restoreState()

    # Header
    lock_icon(c, x + 24, y - 40, size=22, color=SKY_DARK)
    c.setFillColor(INK)
    c.setFont("Display", 17)
    c.drawString(x + 60, y - 30, "Acceso al sistema")

    c.setFillColor(SKY_DARK)
    c.setFont("Body", 9.5)
    c.drawString(x + 60, y - 44, "Abre esta liga en tu celular o computadora")

    # Separador
    c.setStrokeColor(SKY)
    c.setLineWidth(0.5)
    c.line(x + 24, y - 60, x + width - 24, y - 60)

    # Campos: URL, Usuario, Contraseña — etiquetas + valores en mono
    field_x = x + 32
    value_x = x + 130
    field_y = y - 82

    fields = [
        ("Liga", url),
        ("Usuario", usuario),
        ("Contraseña", password),
    ]

    for label, value in fields:
        c.setFillColor(MUTED)
        c.setFont("BodyBold", 9)
        c.drawString(field_x, field_y, label.upper())

        # caja monoespaciada para el valor (estilo input)
        c.saveState()
        c.setFillColor(HexColor("#FFFFFF"))
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.6)
        box_w = width - (value_x - x) - 32
        c.roundRect(value_x, field_y - 6, box_w, 20, 5, stroke=1, fill=1)
        c.restoreState()

        c.setFillColor(INK)
        c.setFont("Mono", 10.5)
        c.drawString(value_x + 10, field_y, value)

        field_y -= 28


def draw_header(c, page_w, page_h, role_label):
    """Header común del manual."""
    droplet_icon(c, 56, page_h - 76, size=22, color=SKY)
    c.setFillColor(MUTED)
    c.setFont("Body", 8.5)
    c.drawString(82, page_h - 56, "PURIFICADORA EL BALUARTE")
    c.setFillColor(INK)
    c.setFont("Display", 22)
    c.drawString(82, page_h - 75, f"Manual del Vendedor · {role_label}")

    # Línea + versión (arriba del título para no chocar con títulos largos)
    c.setStrokeColor(SKY)
    c.setLineWidth(1.5)
    c.line(page_w - 130, page_h - 50, page_w - 56, page_h - 50)
    c.setFillColor(MUTED)
    c.setFont("Mono", 7.5)
    c.drawRightString(page_w - 56, page_h - 62, "v1.1 · 2026")

    c.setFillColor(TEXT)
    c.setFont("Body", 10.5)
    c.drawString(82, page_h - 96, "Cómo entrar al sistema y registrar una venta — ten esta hoja a la mano")

    c.setStrokeColor(BORDER)
    c.setLineWidth(0.6)
    c.line(56, page_h - 112, page_w - 56, page_h - 112)


def draw_footer(c, page_w, margin, footer_y=56):
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


def draw_tip(c, x, y, width, text_line1, text_line2):
    tip_h = 44
    c.saveState()
    c.setFillColor(AMBER_BG)
    c.setStrokeColor(AMBER_BORDER)
    c.setLineWidth(0.8)
    c.roundRect(x, y - tip_h, width, tip_h, 8, stroke=1, fill=1)
    c.setFillColor(AMBER_TEXT)
    c.setFont("BodyBold", 8.5)
    c.drawString(x + 18, y - 17, "TIP")
    c.setFillColor(HexColor("#78350F"))
    c.setFont("Body", 10)
    c.drawString(x + 50, y - 17, text_line1)
    c.setFillColor(AMBER_TEXT)
    c.setFont("Body", 9.5)
    c.drawString(x + 50, y - 32, text_line2)
    c.restoreState()
    return tip_h


def generar_manual(output_path, role_label, login_user, login_password,
                   section_title, section_subtitle, section_icon, section_steps,
                   tip_line1, tip_line2):
    c = rl_canvas.Canvas(str(output_path), pagesize=LETTER)
    page_w, page_h = LETTER

    draw_header(c, page_w, page_h, role_label)

    margin = 56
    card_w = page_w - 2 * margin

    # --- 1. Acceso al sistema ---
    login_h = 168
    top_login = page_h - 132
    draw_login_section(
        c, margin, top_login, card_w, login_h,
        url="aguaelbaluarte.vercel.app",
        usuario=login_user,
        password=login_password,
    )

    # --- 2. Sección de venta correspondiente ---
    section_h = 245
    top_section = top_login - login_h - 18
    draw_section(
        c, margin, top_section, card_w, section_h,
        title=section_title,
        subtitle=section_subtitle,
        icon_fn=section_icon,
        steps=section_steps,
    )

    # --- 3. Tip ---
    tip_top = top_section - section_h - 18
    draw_tip(c, margin, tip_top, card_w, tip_line1, tip_line2)

    draw_footer(c, page_w, margin)

    c.save()
    print(f"PDF generado: {output_path}")


def main():
    # Manual Domicilio
    generar_manual(
        output_path=DOCS_DIR / "manual-vendedor-domicilio.pdf",
        role_label="Domicilio",
        login_user="domicilio",
        login_password="domicilio123",
        section_title="Venta a Domicilio",
        section_subtitle="Sidebar → Ventas Domicilio",
        section_icon=truck_icon,
        section_steps=[
            "Selecciona el cliente del menú (o deja Público en general)",
            "Toca + en cada producto para agregar cantidad",
            "Elige método de pago: Efectivo o Transferencia",
            "Marca estado de pago: Pagado o No Pagado",
            "(Opcional) Adjunta evidencia fotográfica",
            'Toca "Registrar Entrega"',
        ],
        tip_line1='El cliente por defecto es "Público en general".',
        tip_line2="Cámbialo solo si el cliente ya está registrado en el sistema.",
    )

    # Manual Físico
    generar_manual(
        output_path=DOCS_DIR / "manual-vendedor-fisico.pdf",
        role_label="Punto de Venta",
        login_user="fisico",
        login_password="fisico123",
        section_title="Venta en Punto de Venta",
        section_subtitle="Sidebar → Ventas Físico",
        section_icon=cart_icon,
        section_steps=[
            "Elige el turno: Matutino o Vespertino",
            "Captura cuentalitros: Lectura Inicial y Final",
            "Toca + en cada producto (no excedas los litros disponibles)",
            "Elige método de pago: Efectivo, Transferencia o Crédito",
            "Marca estado de pago: Pagado o No Pagado",
            'Toca "Registrar Venta"',
        ],
        tip_line1="Captura el cuentalitros antes de agregar productos.",
        tip_line2="Los litros disponibles se calculan como Final − Inicial.",
    )


if __name__ == "__main__":
    main()
