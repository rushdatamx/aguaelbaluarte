"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto">
      <div className="text-center py-20">
        <h2 className="text-xl font-semibold mb-2">Algo salio mal</h2>
        <p className="text-sm text-muted-foreground mb-6">
          {error.message || "Ocurrio un error inesperado"}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
