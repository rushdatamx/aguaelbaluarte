import Link from "next/link";
import { Truck, ShoppingCart } from "lucide-react";
import { requireRole } from "@/lib/auth";

export default async function ElegirPage() {
  await requireRole(["admin", "vendedor_fisico", "vendedor_domicilio"]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] md:min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground">¿Qué vas a registrar?</h1>
          <p className="text-sm text-muted-foreground mt-1">Selecciona el tipo de venta</p>
        </div>

        <Link
          href="/ventas-domicilio"
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-background hover:border-sky-500 hover:bg-sky-50 active:scale-[0.98] transition-all"
        >
          <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <Truck className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-base">Domicilio</p>
            <p className="text-xs text-muted-foreground">Entrega a domicilio</p>
          </div>
        </Link>

        <Link
          href="/ventas"
          className="flex items-center gap-4 p-5 rounded-xl border-2 border-border bg-background hover:border-sky-500 hover:bg-sky-50 active:scale-[0.98] transition-all"
        >
          <div className="h-14 w-14 rounded-full bg-sky-100 flex items-center justify-center shrink-0">
            <ShoppingCart className="h-7 w-7 text-sky-600" />
          </div>
          <div>
            <p className="font-semibold text-base">Punto de Venta</p>
            <p className="text-xs text-muted-foreground">Venta física en sucursal</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
