"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import {
  MapPin,
  Phone,
  User,
  Building,
  School,
  X,
  Mail,
  Calendar,
  Wifi,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface DetailedInfoModalProps {
  school: any
  onClose: () => void
}

export default function DetailedInfoModal({ school, onClose }: DetailedInfoModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState<string>("basic")

  // Cerrar modal al hacer clic fuera o presionar ESC
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscKey)

    // Bloquear scroll del body
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscKey)
      document.body.style.overflow = "auto"
    }
  }, [onClose])

  // Verificar si hay coordenadas válidas
  const hasValidCoordinates =
    school.LAT &&
    school.LON &&
    !isNaN(Number.parseFloat(school.LAT)) &&
    !isNaN(Number.parseFloat(school.LON)) &&
    Number.parseFloat(school.LAT) !== 0 &&
    Number.parseFloat(school.LON) !== 0

  // Generar URL de Google Maps
  const googleMapsUrl = hasValidCoordinates
    ? `https://www.google.com/maps?q=${Number.parseFloat(school.LAT)},${Number.parseFloat(school.LON)}`
    : `https://www.google.com/maps/search/${encodeURIComponent(
        `${school.ESTABLECIMIENTO} ${school.DIRECCION} ${school.CIUDAD} ${school.DISTRITO}`,
      )}`

  // Función para agrupar campos relacionados
  const groupFields = () => {
    const groups = {
      basic: [
        { key: "CUE", label: "CUE", icon: <School className="w-4 h-4" /> },
        { key: "ESTABLECIMIENTO", label: "Nombre", icon: <Building className="w-4 h-4" /> },
        { key: "TIPO_ESTABLECIMIENTO", label: "Tipo", icon: null },
        { key: "FED_A_CARGO", label: "Fed. a cargo", icon: null },
        { key: "DIRECCION", label: "Dirección", icon: <MapPin className="w-4 h-4" /> },
        { key: "CIUDAD", label: "Ciudad", icon: null },
        { key: "DISTRITO", label: "Distrito", icon: null },
        { key: "AMBITO", label: "Ámbito", icon: null },
      ],
      contact: [
        { key: "NOMBRE", label: "Nombre", icon: <User className="w-4 h-4" /> },
        { key: "APELLIDO", label: "Apellido", icon: null },
        { key: "CARGO", label: "Cargo", icon: null },
        { key: "TELEFONO", label: "Teléfono", icon: <Phone className="w-4 h-4" /> },
        { key: "CORREO_INSTITUCIONAL", label: "Correo", icon: <Mail className="w-4 h-4" /> },
      ],
      connectivity: [
        { key: "PLAN_ENLACE", label: "Plan Enlace", icon: <Wifi className="w-4 h-4" /> },
        { key: "SUBPLAN_ENLACE", label: "Subplan Enlace", icon: null },
        {
          key: "FECHA_INICIO_CONECTIVIDAD",
          label: "Fecha inicio conectividad",
          icon: <Calendar className="w-4 h-4" />,
        },
        { key: "PROVEEDOR_INTERNET_PNCE", label: "Proveedor PNCE", icon: null },
        { key: "FECHA_INSTALACION_PNCE", label: "Fecha instalación PNCE", icon: <Calendar className="w-4 h-4" /> },
        { key: "PNCE_ESTADO", label: "Estado PNCE", icon: null },
        { key: "PBA_GRUPO_1_PROVEEDOR_INTERNET", label: "Proveedor PBA G1", icon: null },
        {
          key: "PBA_GRUPO_1_FECHA_INSTALACION",
          label: "Fecha instalación PBA G1",
          icon: <Calendar className="w-4 h-4" />,
        },
        { key: "PBA_GRUPO_1_ESTADO", label: "Estado PBA G1", icon: null },
        { key: "MB", label: "Ancho de banda", icon: null },
      ],
      technical: [
        { key: "PLAN_PISO_TECNOLOGICO", label: "Plan piso tecnológico", icon: <Info className="w-4 h-4" /> },
        { key: "TIPO_PISO_INSTALADO", label: "Tipo piso instalado", icon: null },
        { key: "PROVEEDOR_PISO_TECNOLOGICO_CUE", label: "Proveedor piso tecnológico", icon: null },
        {
          key: "FECHA_TERMINADO_PISO_TECNOLOGICO_CUE",
          label: "Fecha terminado",
          icon: <Calendar className="w-4 h-4" />,
        },
        { key: "TIPO_MEJORA", label: "Tipo mejora", icon: null },
        { key: "FECHA_MEJORA", label: "Fecha mejora", icon: <Calendar className="w-4 h-4" /> },
      ],
      other: [
        { key: "PREDIO", label: "Predio", icon: <Building className="w-4 h-4" /> },
        { key: "OBSERVACIONES", label: "Observaciones", icon: <Info className="w-4 h-4" /> },
        { key: "CUE_ANTERIOR", label: "CUE anterior", icon: null },
        { key: "ACCESS_ID", label: "Access ID", icon: null },
      ],
    }

    return groups
  }

  const fieldGroups = groupFields()

  // Función para renderizar un grupo de campos
  const renderFieldGroup = (group: Array<{ key: string; label: string; icon: React.ReactNode }>) => {
    return group.map((field) => {
      const value = school[field.key]
      if (!value) return null

      return (
        <div key={field.key} className="mb-2">
          <div className="flex items-center text-white/70 text-sm">
            {field.icon && <span className="mr-1 text-white/50">{field.icon}</span>}
            <span>{field.label}:</span>
          </div>
          <div className="text-white ml-6">
            {field.key === "CORREO_INSTITUCIONAL" ? (
              <a href={`mailto:${value}`} className="text-primary hover:underline flex items-center">
                {value}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            ) : field.key === "TELEFONO" ? (
              <a href={`tel:${value}`} className="text-primary hover:underline flex items-center">
                {value}
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            ) : (
              value
            )}
          </div>
        </div>
      )
    })
  }

  // Función para alternar secciones
  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? "" : section)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        ref={modalRef}
        className="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold text-white">{school.ESTABLECIMIENTO}</h2>
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1" aria-label="Cerrar">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Sección básica */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("basic")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Información Básica
              </span>
              {activeSection === "basic" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {activeSection === "basic" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {renderFieldGroup(fieldGroups.basic)}

                {/* Mapa */}
                {hasValidCoordinates && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-white font-medium">Ubicación</h3>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary text-sm hover:underline flex items-center"
                      >
                        Ver en Google Maps
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                    <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                      <p className="text-white/50 text-sm">
                        Coordenadas: {school.LAT}, {school.LON}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sección de contacto */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("contact")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Información de Contacto
              </span>
              {activeSection === "contact" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {activeSection === "contact" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {renderFieldGroup(fieldGroups.contact)}
              </div>
            )}
          </div>

          {/* Sección de conectividad */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("connectivity")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <Wifi className="w-5 h-5 mr-2" />
                Conectividad
              </span>
              {activeSection === "connectivity" ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {activeSection === "connectivity" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {renderFieldGroup(fieldGroups.connectivity)}
              </div>
            )}
          </div>

          {/* Sección técnica */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("technical")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Información Técnica
              </span>
              {activeSection === "technical" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {activeSection === "technical" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {renderFieldGroup(fieldGroups.technical)}
              </div>
            )}
          </div>

          {/* Otra información */}
          <div className="mb-6">
            <button
              onClick={() => toggleSection("other")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Otra Información
              </span>
              {activeSection === "other" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {activeSection === "other" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {renderFieldGroup(fieldGroups.other)}
              </div>
            )}
          </div>

          {/* Todos los campos */}
          <div>
            <button
              onClick={() => toggleSection("all")}
              className="flex items-center justify-between w-full text-white font-bold text-lg mb-2"
            >
              <span className="flex items-center">
                <Info className="w-5 h-5 mr-2" />
                Todos los Campos
              </span>
              {activeSection === "all" ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            {activeSection === "all" && (
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                {Object.keys(school)
                  .filter((key) => !key.startsWith("_") && school[key])
                  .sort()
                  .map((key) => (
                    <div key={key} className="mb-2">
                      <div className="text-white/70 text-sm">{key}:</div>
                      <div className="text-white ml-6">{school[key]}</div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-4 bg-gray-900 sticky bottom-0">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
