import { Suspense } from "react"
import SchoolSearch from "@/components/SchoolSearch"
import Footer from "@/components/Footer"
import ScrollToTopButton from "@/components/ScrollToTopButton"
import { searchEstablecimientos } from "@/lib/actions"

export default async function Home({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined }
}) {
  // Función para manejar la búsqueda inicial si hay un parámetro de consulta
  const handleSearch = async () => {
    const query = searchParams?.query

    if (query && typeof query === "string" && query.trim() !== "") {
      try {
        // Realizar la búsqueda inicial
        const results = await searchEstablecimientos(query)
        return results
      } catch (error) {
        console.error("Error en la búsqueda inicial:", error)
        return []
      }
    }

    return []
  }

  // No realizar búsqueda automática al cargar la página
  const initialResults = []

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white pb-20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-2">Buscador de Establecimientos Educativos</h1>
        </div>

        <Suspense fallback={<div className="text-center py-10">Cargando...</div>}>
          <SchoolSearch />
        </Suspense>
      </div>

      <Footer />
      <ScrollToTopButton />
    </main>
  )
}
