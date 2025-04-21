import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-xl flex flex-col items-center">
        <div className="w-16 h-16 mb-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Cargando...</h2>
        <p className="text-white/70 text-center">
          Estamos preparando la información de los establecimientos educativos.
        </p>
      </div>
    </div>
  )
}
