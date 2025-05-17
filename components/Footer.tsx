export default function Footer() {
  // Generar versión automática basada en la fecha en formato latino (DD.MM.AAAA)
  const today = new Date()
  const AUTO_VERSION = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`

  return (
    <footer className="w-full py-6 mt-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex flex-col md:flex-row items-center">
            <h2 className="text-white text-xl text-center">
              <span className="font-medium">Dirección de </span>
              <span className="font-bold">Tecnología Educativa</span>
            </h2>

            {/* Separador vertical para desktop */}
            <div className="hidden md:block h-12 w-px bg-white/30 mx-8"></div>

            {/* Separador horizontal para móvil */}
            <div className="md:hidden h-px w-48 bg-white/30 my-5 rounded-full"></div>

            {/* Logo para desktop */}
            <div className="hidden md:block h-[80px]">
              <img
                src="/images/pba-logo.png"
                alt="Gobierno de la Provincia de Buenos Aires"
                className="h-[80px] w-auto object-contain"
              />
            </div>
          </div>

          {/* Logo para móvil */}
          <div className="mt-3 md:hidden">
            <img
              src="/images/pba-logo.png"
              alt="Gobierno de la Provincia de Buenos Aires"
              className="h-[80px] w-auto object-contain"
            />
          </div>
        </div>

        <div className="text-center text-white/50 text-xs mt-6">
          © {new Date().getFullYear()} Dirección de Tecnología Educativa | Dirección General de Cultura y Educación
        </div>

        {/* Version indicator - Estilo discreto */}
        <div className="text-center text-white/30 text-xs mt-2">v2.0.5 ({AUTO_VERSION})</div>

        {/* Marca Silvio® - Mismo color que la versión */}
        <div className="text-center text-white/30 text-xs mt-1">Silvio®</div>
      </div>
    </footer>
  )
}
