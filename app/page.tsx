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
        <header className="py-8 md:py-16 mb-8 md:mb-12">
          <div className="flex flex-col items-center justify-center">
            {/* Logo with glow effect */}
            <div className="w-24 h-24 md:w-32 md:h-32 mb-6 md:mb-8 bg-gradient-to-br from-primary via-secondary to-accent rounded-full backdrop-blur-md flex items-center justify-center overflow-hidden shadow-2xl relative">
              {/* Inner circle for better contrast */}
              <div className="absolute inset-2 md:inset-3 rounded-full bg-white/15 backdrop-blur-sm"></div>

              {/* Glow effect behind the logo */}
              <div className="absolute w-16 h-16 md:w-24 md:h-24 bg-white/30 rounded-full filter blur-md animate-pulse-slow"></div>

              {/* Using the provided image with better visibility */}
              <div className="relative w-16 h-16 md:w-24 md:h-24 flex items-center justify-center z-10">
                <img
                  src="/mi_escuela_1.png"
                  alt="Icono de escuela"
                  className="w-16 h-16 md:w-24 md:h-24 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                />
              </div>
            </div>

            {/* Title with glow effect */}
            <h1 className="text-center text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 drop-shadow-lg px-4">
              Buscador de establecimientos educativos
            </h1>

            {/* Subtitle with glass effect */}
            <div className="bg-white/15 px-6 md:px-8 py-2 md:py-3 rounded-full backdrop-blur-md border border-white/20 shadow-lg">
              <p className="text-white text-center font-medium text-base md:text-lg">Región 1</p>
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
