"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Gauge,
  Clock,
  Route,
  Fuel,
  AlertTriangle,
  Navigation,
  CircleDot,
  Truck,
} from "lucide-react";
import data from "../../../../../public/data/purificadora.json";

export default function GPSPage() {
  const { gps, empresa } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">GPS Tiburcio</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Ubicacion en tiempo real via PAJ-Portal · {gps.vehiculo}
            </p>
          </div>
          <Badge
            variant="default"
            className={`${
              gps.estado === "en_ruta"
                ? "bg-green-500"
                : gps.estado === "detenido"
                  ? "bg-amber-500"
                  : "bg-neutral-400"
            }`}
          >
            {gps.estado === "en_ruta" ? "En Ruta" : gps.estado === "detenido" ? "Detenido" : "En Base"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa simulado */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Mapa en Vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative bg-neutral-100 rounded-xl overflow-hidden" style={{ height: 420 }}>
              {/* Mapa estilizado con CSS */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-50 to-emerald-50">
                {/* Grid de calles simuladas */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 420">
                  {/* Calles horizontales */}
                  <line x1="0" y1="80" x2="600" y2="80" stroke="#d4d4d8" strokeWidth="1.5" />
                  <line x1="0" y1="160" x2="600" y2="160" stroke="#d4d4d8" strokeWidth="1.5" />
                  <line x1="0" y1="240" x2="600" y2="240" stroke="#e5e5e5" strokeWidth="1" />
                  <line x1="0" y1="320" x2="600" y2="320" stroke="#d4d4d8" strokeWidth="1.5" />

                  {/* Calles verticales */}
                  <line x1="100" y1="0" x2="100" y2="420" stroke="#d4d4d8" strokeWidth="1.5" />
                  <line x1="200" y1="0" x2="200" y2="420" stroke="#e5e5e5" strokeWidth="1" />
                  <line x1="300" y1="0" x2="300" y2="420" stroke="#d4d4d8" strokeWidth="1.5" />
                  <line x1="420" y1="0" x2="420" y2="420" stroke="#d4d4d8" strokeWidth="1.5" />
                  <line x1="520" y1="0" x2="520" y2="420" stroke="#e5e5e5" strokeWidth="1" />

                  {/* Avenida principal */}
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#a1a1aa" strokeWidth="3" />
                  <text x="10" y="195" fill="#71717a" fontSize="9" fontFamily="sans-serif">Av. Universidad</text>

                  {/* Ruta recorrida */}
                  <polyline
                    points={gps.ruta_puntos.map((p: { lat: number; lng: number }, i: number) => {
                      const x = 80 + (i / (gps.ruta_puntos.length - 1)) * 440;
                      const y = 200 + (p.lat - 25.6866) * 8000 + Math.sin(i * 0.5) * 30;
                      return `${x},${y}`;
                    }).join(" ")}
                    fill="none"
                    stroke="#0ea5e9"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="0"
                  />

                  {/* Paradas (puntos verdes) */}
                  {gps.ruta_puntos.filter((p: { es_parada: boolean }) => p.es_parada).map((p: { lat: number; lng: number; velocidad_kmh: number; hora: string; es_parada: boolean }, i: number) => {
                    const idx = gps.ruta_puntos.indexOf(p);
                    const x = 80 + (idx / (gps.ruta_puntos.length - 1)) * 440;
                    const y = 200 + (p.lat - 25.6866) * 8000 + Math.sin(idx * 0.5) * 30;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="5" fill="#22c55e" stroke="#fff" strokeWidth="2" />
                        <text x={x + 8} y={y + 3} fill="#6b7280" fontSize="8" fontFamily="sans-serif">{p.hora}</text>
                      </g>
                    );
                  })}

                  {/* Punto de inicio (base) */}
                  <circle cx="80" cy="200" r="7" fill="#6366f1" stroke="#fff" strokeWidth="2" />
                  <text x="68" y="225" fill="#6366f1" fontSize="9" fontWeight="bold" fontFamily="sans-serif">BASE</text>

                  {/* Ubicacion actual (pulso) */}
                  <circle cx="520" cy="185" r="12" fill="#0ea5e9" opacity="0.2">
                    <animate attributeName="r" from="8" to="18" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.4" to="0" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="520" cy="185" r="7" fill="#0ea5e9" stroke="#fff" strokeWidth="2.5" />
                </svg>
              </div>

              {/* Overlay con ubicacion actual */}
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
                    <Navigation className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{gps.ubicacion_actual.direccion}</p>
                    <p className="text-xs text-muted-foreground">
                      {gps.ubicacion_actual.velocidad_kmh} km/h · Actualizado {gps.ubicacion_actual.ultima_actualizacion}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-sky-600">{gps.ubicacion_actual.velocidad_kmh}</div>
                    <div className="text-[10px] text-muted-foreground">km/h</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de datos */}
        <div className="space-y-4">
          {/* Datos del vehiculo */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vehiculo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{gps.vehiculo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Placa</span>
                  <span className="font-mono font-medium">{gps.placa}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Dispositivo</span>
                  <span className="text-xs">{gps.dispositivo}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Jornada de hoy */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Jornada de Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Route className="h-4 w-4 text-sky-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{gps.jornada_hoy.km_recorridos}</div>
                  <div className="text-[10px] text-muted-foreground">km recorridos</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <CircleDot className="h-4 w-4 text-green-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{gps.jornada_hoy.paradas_realizadas}</div>
                  <div className="text-[10px] text-muted-foreground">paradas</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Gauge className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                  <div className="text-lg font-bold">{gps.jornada_hoy.tiempo_en_ruta}</div>
                  <div className="text-[10px] text-muted-foreground">en movimiento</div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <Clock className="h-4 w-4 text-neutral-400 mx-auto mb-1" />
                  <div className="text-lg font-bold">{gps.jornada_hoy.tiempo_detenido}</div>
                  <div className="text-[10px] text-muted-foreground">detenido</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Salio a las</span>
                  <span className="font-medium">{gps.jornada_hoy.hora_salida}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Regreso estimado</span>
                  <span className="font-medium">{gps.jornada_hoy.hora_regreso_estimada}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Promedio diario</span>
                  <span className="font-medium">{gps.jornada_hoy.km_promedio_diario} km</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          {gps.alertas.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gps.alertas.map((alerta: { tipo: string; mensaje: string; hora: string; nivel: string }, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-amber-800">{alerta.mensaje}</p>
                        <p className="text-[10px] text-amber-600">{alerta.hora}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Historial semanal */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base font-medium">Resumen Semanal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(gps.historial_semanal).map(([dia, datos]) => {
              const d = datos as { km: number; paradas: number; salida: string; regreso: string };
              const diasMap: Record<string, string> = {
                lun: "Lunes", mar: "Martes", mie: "Miercoles",
                jue: "Jueves", vie: "Viernes", sab: "Sabado",
              };
              return (
                <div key={dia} className="bg-muted/30 rounded-xl p-3 text-center border border-border/50">
                  <p className="text-xs font-medium text-muted-foreground mb-2">{diasMap[dia]}</p>
                  <p className="text-lg font-bold">{d.km} <span className="text-xs font-normal text-muted-foreground">km</span></p>
                  <p className="text-xs text-muted-foreground mt-1">{d.paradas} paradas</p>
                  <p className="text-[10px] text-muted-foreground">{d.salida} — {d.regreso}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Datos obtenidos via PAJ GPS Vehicle Finder 4G · API en tiempo real
      </p>
    </div>
  );
}
