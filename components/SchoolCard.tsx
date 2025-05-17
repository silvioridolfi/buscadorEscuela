"use client"

import type React from "react"

import { useState } from "react"
import {
  School,
  Building,
  Hash,
  MapIcon,
  User,
  Info,
  AlertTriangle,
  Phone,
  MapPin,
  ExternalLink,
  ChevronRight,
  Maximize2,
} from "lucide-react"
import type { EstablecimientoConContacto } from "@/lib/supabase"
import { getAbbreviatedSchoolName } from "@/lib/utils"

interface SchoolCardProps {
  school: EstablecimientoConContacto
  onViewDetails?: (cue: number) => void
  sharedPredioInfo?: {
    isShared: boolean
    sharedWith: Array<{
      CUE: string
      ESTABLECIMIENTO: string
    }>
  }
}

export default function SchoolCard({ school, onViewDetails, sharedPredioInfo }: SchoolCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const openModal = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onViewDetails) {
      onViewDetails(school.cue)
    }
  }

  const hasSharedPredio = sharedPredioInfo?.isShared
  const hasLocation = school.lat && school.lon && school.lat !== 0 && school.lon !== 0

  // Handle click on a shared school CUE
  const handleCUEClick = (cue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // Implementación futura
  }

  // Determine school type for icon
  const getSchoolTypeIcon = () => {
    const name = school.establecimiento?.toLowerCase() || ""
    if (name.includes("jardin") || name.includes("inicial")) {
      return <School className="w-5 h-5 text-white" />
    } else if (name.includes("primaria")) {
      return <School className="w-5 h-5 text-white" />
    } else if (name.includes("secundaria") || name.includes("tecnica")) {
      return <School className="w-5 h-5 text-white" />
    } else {
      return <Building className="w-5 h-5 text-white" />
    }
  }

  // Función para formatear el cargo con la primera letra en mayúscula y el resto en minúscula
  const formatCargoTitle = (cargo: string): string => {
    if (!cargo) return "Contacto"

    // Verificar si es un cargo directivo
    const lowerCargo = cargo.toLowerCase()
    if (lowerCargo.includes("director") || lowerCargo.includes("directora")) {
      return "Directivo"
    }

    // Para otros cargos, formatear con primera letra mayúscula y resto minúscula
    return cargo.charAt(0).toUpperCase() + cargo.slice(1).toLowerCase()
  }

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-xl border border-white/20 flex flex-col h-full transition-all hover:shadow-2xl hover:translate-y-[-4px] group">
      {/* Card Header - Gradient Background */}
      <div className="p-5 bg-gradient-to-r from-primary via-secondary to-accent relative overflow-hidden">
        {/* Efecto de resplandor en el fondo */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-30"></div>

        <div className="relative z-10">
          <div className="flex items-start gap-3">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm flex-shrink-0 shadow-lg">
              {getSchoolTypeIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg md:text-xl font-bold text-white leading-tight mb-2">
                <span className="md:hidden">{getAbbreviatedSchoolName(school.establecimiento || "")}</span>
                <span className="hidden md:block">{school.establecimiento}</span>
              </h2>
            </div>
          </div>

          {/* Badges for CUE, District, Predio */}
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center text-white text-xs shadow-sm">
              <Hash className="w-3.5 h-3.5 mr-1.5" />
              <span className="font-medium">CUE:&nbsp;</span>
              {school.cue}
            </div>

            {school.distrito && (
              <div className="bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center text-white text-xs shadow-sm">
                <MapIcon className="w-3.5 h-3.5 mr-1.5" />
                <span className="font-bold">Distrito:&nbsp;</span>
                <span className="font-bold">{school.distrito}</span>
              </div>
            )}

            {school.predio && (
              <div
                className={`${hasSharedPredio ? "bg-amber-500/80" : "bg-white/20"} px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center text-white text-xs shadow-sm`}
              >
                {hasSharedPredio ? (
                  <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Building className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span className="font-medium">Predio:&nbsp;</span>
                {school.predio}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="px-5 pt-4 pb-1">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Información básica
        </h3>
      </div>

      {/* Main Info Block */}
      <div className="px-5 pb-4 flex-grow">
        {/* FED a cargo - Asegurarse de que se muestre correctamente */}
        {school.fed_a_cargo && (
          <div className="mb-3 bg-white/10 p-3 rounded-xl flex items-center border border-white/10 shadow-sm">
            <User className="w-4 h-4 text-white/80 mr-2 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold text-white/90">FED a cargo:</span>
              <span className="ml-1.5 text-sm font-bold text-white/80 break-words">{school.fed_a_cargo}</span>
            </div>
          </div>
        )}

        {/* Ciudad y Dirección */}
        <div className="space-y-2 mb-3">
          {school.ciudad && (
            <div className="flex items-center p-3 bg-white/10 rounded-xl border border-white/10 shadow-sm">
              <MapIcon className="w-4 h-4 text-white/80 mr-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white/90">Ciudad:</span>
                <span className="ml-1.5 text-sm text-white/80 break-words">{school.ciudad}</span>
              </div>
            </div>
          )}

          {school.direccion && (
            <div className="flex items-start p-3 bg-white/10 rounded-xl border border-white/10 shadow-sm">
              <MapPin className="w-4 h-4 text-white/80 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white/90">Dirección:</span>
                <span className="ml-1.5 text-sm text-white/80 break-words">{school.direccion}</span>
              </div>
            </div>
          )}
        </div>

        {/* Contact Section */}
        {(school.nombre || school.apellido) && (
          <div className="border-t border-white/10 pt-3 space-y-2">
            {(school.nombre || school.apellido) && (
              <div className="flex items-center p-3 bg-white/10 rounded-xl border border-white/10 shadow-sm mt-2.5">
                <User className="w-4 h-4 text-white/80 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white/90">{formatCargoTitle(school.cargo || "")}:</span>
                  <span className="ml-1.5 text-sm text-white/80 break-words">
                    {school.nombre} {school.apellido}
                  </span>
                </div>
              </div>
            )}

            {school.telefono && (
              <div className="flex items-center p-3 bg-white/10 rounded-xl border border-white/10 shadow-sm">
                <Phone className="w-4 h-4 text-white/80 mr-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-white/90">Teléfono:</span>
                  <span className="ml-1.5 text-sm text-white/80 break-words">{school.telefono}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información de Predio Compartido */}
      {hasSharedPredio && sharedPredioInfo?.sharedWith && (
        <div className="px-5 pb-4 border-t border-white/10 pt-3">
          <div className="bg-amber-500/20 p-3 rounded-xl border border-amber-500/30 shadow-sm">
            <div className="flex items-start">
              <AlertTriangle className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-amber-200">Predio {school.predio} compartido con:</div>
                <ul className="mt-1.5 space-y-1.5 max-h-24 overflow-y-auto">
                  {sharedPredioInfo.sharedWith.map((shared) => (
                    <li key={shared.CUE} className="text-sm text-amber-100 flex items-start">
                      <span className="text-amber-400 mr-1.5">•</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium break-words">
                          {getAbbreviatedSchoolName(shared.ESTABLECIMIENTO)}
                        </span>
                        <button
                          onClick={(e) => handleCUEClick(shared.CUE, e)}
                          className="ml-1.5 text-amber-300 hover:text-amber-100 hover:underline flex items-center text-xs"
                        >
                          CUE: {shared.CUE}
                          <ExternalLink className="w-3 h-3 ml-0.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Button */}
      <div className="border-t border-white/10 p-4 mt-auto">
        <button
          onClick={openModal}
          className="w-full flex items-center justify-between gap-2 py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm group-hover:shadow-xl"
          aria-label="Ver información detallada de la escuela"
        >
          <span className="flex items-center">
            <Maximize2 className="w-4 h-4 mr-2" />
            Ver información detallada
          </span>
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  )
}
