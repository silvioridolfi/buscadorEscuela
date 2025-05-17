import SchoolSearch from "@/components/SchoolSearch"
import SetupInstructions from "./setup-instructions"
import { checkApiKeyConfigured } from "./api-key-check"
import Footer from "@/components/Footer"
import ScrollToTopButton from "@/components/ScrollToTopButton"

export default async function Home() {
  const isApiKeyConfigured = await checkApiKeyConfigured()

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

        {!isApiKeyConfigured && <SetupInstructions />}

        <SchoolSearch />
      </div>

      <Footer />

      {/* Botón para volver al inicio */}
      <ScrollToTopButton />
    </main>
  )
}
