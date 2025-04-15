"use client"

import { useState, useEffect } from "react"
import { ChevronUp } from "lucide-react"

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  // Función para verificar si debemos mostrar el botón
  const toggleVisibility = () => {
    // Mostrar el botón cuando el usuario ha desplazado 300px hacia abajo
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  // Función para desplazarse al inicio de la página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Animación suave de desplazamiento
    })
  }

  // Agregar el evento de scroll cuando el componente se monta
  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility)

    // Limpiar el evento cuando el componente se desmonta
    return () => {
      window.removeEventListener("scroll", toggleVisibility)
    }
  }, [])

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-accent text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 animate-fadeIn"
          aria-label="Volver al inicio"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
      )}
    </>
  )
}
