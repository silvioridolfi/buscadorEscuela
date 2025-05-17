"use client"

import { useState } from "react"
import { searchEstablecimientos } from "@/lib/actions"
import SearchForm from "@/components/SearchForm"
import SchoolCard from "@/components/SchoolCard"
import Footer from "@/components/Footer"
import ScrollToTopButton from "@/components/ScrollToTopButton"
import type { EstablecimientoConContacto } from "@/lib/supabase"

export default function Home() {
  const [schools, setSchools] = useState<EstablecimientoConContacto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSearched, setIsSearched] = useState(false)

  const handleSearch = async (query: string) => {
    try {
      setError(null)
      const results = await searchEstablecimientos(query)
      setSchools(results)
      setIsSearched(true)
    } catch (err) {
      console.error("Error al buscar:", err)
      setError("Ocurrió un error al realizar la búsqueda. Por favor, intenta nuevamente.")
      setSchools([])
    }
  }

  const handleViewDetails = (cue: number) => {
    // En una implementación completa, esto podría navegar a una página de detalles
    console.log(`Ver detalles de escuela con CUE: ${cue}`)
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <header className="py-16 mb-12">
          <div className="flex flex-col items-center justify-center">
            {/* Logo con efecto de resplandor */}
            <div className="w-32 h-32 mb-8 bg-gradient-to-br from-primary via-secondary to-accent rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl relative">
              {/* Círculo interior para mejorar el contraste */}
              <div className="absolute inset-3 rounded-full bg-white/15 backdrop-blur-sm"></div>

              {/* Efecto de resplandor detrás del logo */}
              <div className="absolute w-24 h-24 bg-white/30 rounded-full filter blur-md animate-pulse-slow"></div>

              {/* Usando la imagen proporcionada con mejor visibilidad */}
              <div className="relative w-24 h-24 flex items-center justify-center z-10">
                <img
                  src="/mi_escuela_1.png"
                  alt="Icono de escuela"
                  className="w-24 h-24 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                />
              </div>
            </div>

            {/* Título con efecto de resplandor */}
            <h1 className="text-center text-white text-4xl md:text-5xl font-bold mb-6 drop-shadow-lg">
              Buscador de establecimientos educativos
            </h1>

            {/* Subtítulo con efecto de vidrio */}
            <div className="bg-white/15 px-8 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
              <p className="text-white text-center font-medium text-lg">Región 1</p>
            </div>
          </div>
        </header>

        <div className="mx-auto mb-8 max-w-2xl">
          <SearchForm onSearch={handleSearch} />
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-500/20 border border-red-500/30 p-4 text-white">
            <p>{error}</p>
          </div>
        )}

        {isSearched && schools.length === 0 && !error && (
          <div className="mb-6 rounded-xl bg-amber-bg border border-amber-border p-4 text-amber-text">
            <p>No se encontraron establecimientos con los criterios de búsqueda especificados.</p>
          </div>
        )}

        {schools.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-white">Resultados ({schools.length})</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {schools.map((school) => (
                <SchoolCard key={school.cue} school={school} onViewDetails={handleViewDetails} />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
      <ScrollToTopButton />
    </main>
  )
}
