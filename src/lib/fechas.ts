// Helpers de fecha en zona horaria de México (America/Monterrey, UTC-6).
// Todo el cálculo de "hoy", inicios de periodo y formato vive aquí para
// evitar divergencias entre el dashboard y el historial de ventas.

const TZ = "America/Monterrey";

// "Hoy" en hora de México como YYYY-MM-DD, independiente del navegador.
export function getHoy(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ });
}

// Componentes (año, mes, día) de hoy en hora de México.
export function partesHoyMexico(): { year: number; month: number; day: number } {
  const [year, month, day] = getHoy().split("-").map(Number);
  return { year, month, day };
}

// Inicio de la semana (lunes) en formato YYYY-MM-DD.
export function getInicioSemana(): string {
  const { year, month, day } = partesHoyMexico();
  const d = new Date(Date.UTC(year, month - 1, day));
  const dow = d.getUTCDay();
  const diff = dow === 0 ? 6 : dow - 1; // lunes como inicio de semana
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().split("T")[0];
}

// Inicio del mes actual (día 1) en formato YYYY-MM-DD.
export function getInicioMes(): string {
  const { year, month } = partesHoyMexico();
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

// Inicio del mes anterior en formato YYYY-MM-DD.
export function getInicioMesAnterior(): string {
  const { year, month } = partesHoyMexico();
  const d = new Date(Date.UTC(year, month - 1, 1));
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().split("T")[0];
}

// Último día del mes anterior en formato YYYY-MM-DD.
export function getFinMesAnterior(): string {
  const { year, month } = partesHoyMexico();
  // Día 0 del mes actual = último día del mes anterior.
  const d = new Date(Date.UTC(year, month - 1, 0));
  return d.toISOString().split("T")[0];
}

// Convierte un objeto Date (del calendario) a YYYY-MM-DD usando sus
// componentes locales, sin desplazamiento por timezone.
export function dateToYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Parsea YYYY-MM-DD a Date local (mediodía para evitar saltos de día).
export function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// Etiqueta legible de un rango. Ej: "12 – 18 may 2026" o "3 jun 2026".
export function formatRangoLabel(desde: string, hasta: string): string {
  const dDesde = ymdToDate(desde);
  const dHasta = ymdToDate(hasta);
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("es-MX", {
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
    });
  if (desde === hasta) return fmt(dDesde, true);
  const mismoAnio = dDesde.getFullYear() === dHasta.getFullYear();
  return `${fmt(dDesde, !mismoAnio)} – ${fmt(dHasta, true)}`;
}

// Etiqueta de mes corto en español a partir de "YYYY-MM". Ej: "Jun".
export function mesLabel(periodo: string): string {
  const [y, m] = periodo.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "short" });
  return label.charAt(0).toUpperCase() + label.slice(1).replace(".", "");
}
