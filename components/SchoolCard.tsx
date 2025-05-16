"use client"

import { useState } from "react"
import {
  MapPin,
  Phone,
  Mail,
  User,
  Building,
  Info,
  School,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { SharedPredioInfo } from "./SchoolSearch"
import DetailedInfoModal from "./DetailedInfoModal"

interface SchoolCardProps {
  school: any
  sharedPredioInfo?: SharedPredioInfo
  onSearchByCUE?: (cue: string) => void
}

export default function SchoolCard({ school, sharedPredioInfo, onSearchByCUE }: SchoolCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // Función para manejar el clic en el botón de compartir predio
  const handleSharedPredioClick = () => {
    if (sharedPredioInfo && onSearchByCUE) {
      // Buscar la primera escuela compartida
      const firstSharedSchool = sharedPredioInfo.sharedWith[0]
      if (firstSharedSchool) {
        onSearchByCUE(firstSharedSchool.CUE)
      }
    }
  }

  return (
    <>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl overflow-hidden border border-white/20 shadow-xl transition-all hover:shadow-2xl hover:bg-white/15">
        {/* Encabezado con CUE y tipo */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <School className="w-5 h-5 mr-2" />
              <h3 className="font-bold text-lg">CUE: {school.CUE}</h3>
            </div>
            {school.TIPO_ESTABLECIMIENTO && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium">
                {school.TIPO_ESTABLECIMIENTO}
              </span>
            )}
          </div>
        </div>

        {/* Cuerpo de la tarjeta */}
        <div className="p-4">
          {/* Nombre del establecimiento */}
          <h2 className="text-xl font-bold text-white mb-3">{school.ESTABLECIMIENTO}</h2>

          {/* Información básica */}
          <div className="space-y-2 mb-4">
            {school.FED_A_CARGO && (
              <div className="flex items-start text-white/90">
                <Building className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">{school.FED_A_CARGO}</span>
              </div>
            )}

            {school.DIRECCION && (
              <div className="flex items-start text-white/90">
                <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">
                  {school.DIRECCION}
                  {school.CIUDAD && `, ${school.CIUDAD}`}
                  {school.DISTRITO && ` (${school.DISTRITO})`}
                </span>
              </div>
            )}

            {/* Información de contacto */}
            {(school.NOMBRE || school.APELLIDO) && (
              <div className="flex items-start text-white/90">
                <User className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <span className="text-sm">
                  {school.NOMBRE} {school.APELLIDO}
                  {school.CARGO && <span className="block text-xs text-white/70">{school.CARGO}</span>}
                </span>
              </div>
            )}

            {school.TELEFONO && (
              <div className="flex items-start text-white/90">
                <Phone className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <a href={`tel:${school.TELEFONO}`} className="text-sm hover:text-primary">
                  {school.TELEFONO}
                </a>
              </div>
            )}

            {school.CORREO_INSTITUCIONAL && (
              <div className="flex items-start text-white/90">
                <Mail className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                <a href={`mailto:${school.CORREO_INSTITUCIONAL}`} className="text-sm hover:text-primary truncate">
                  {school.CORREO_INSTITUCIONAL}
                </a>
              </div>
            )}
          </div>

          {/* Información técnica (expandible) */}
          <div className="mt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-between w-full text-white/80 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg p-2 transition-colors"
            >
              <span className="flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Información técnica
              </span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-3 bg-white/5 p-3 rounded-lg text-sm text-white/80">
                {/* Información de conectividad */}
                {(school.PLAN_ENLACE || school.PROVEEDOR_INTERNET_PNCE || school.PBA_GRUPO_1_PROVEEDOR_INTERNET) && (
                  <div>
                    <h4 className="font-medium text-white mb-1">Conectividad</h4>
                    <ul className="space-y-1 pl-2">
                      {school.PLAN_ENLACE && <li>Plan: {school.PLAN_ENLACE}</li>}
                      {school.PROVEEDOR_INTERNET_PNCE && <li>Proveedor PNCE: {school.PROVEEDOR_INTERNET_PNCE}</li>}
                      {school.PBA_GRUPO_1_PROVEEDOR_INTERNET && (
                        <li>Proveedor PBA G1: {school.PBA_GRUPO_1_PROVEEDOR_INTERNET}</li>
                      )}
                      {school.MB && <li>Ancho de banda: {school.MB}</li>}
                    </ul>
                  </div>
                )}

                {/* Información de piso tecnológico */}
                {school.PLAN_PISO_TECNOLOGICO && (
                  <div>
                    <h4 className="font-medium text-white mb-1">Piso Tecnológico</h4>
                    <ul className="space-y-1 pl-2">
                      <li>Plan: {school.PLAN_PISO_TECNOLOGICO}</li>
                      {school.TIPO_PISO_INSTALADO && <li>Tipo: {school.TIPO_PISO_INSTALADO}</li>}
                    </ul>
                  </div>
                )}

                {/* Información de predio */}
                {school.PREDIO && (
                  <div>
                    <h4 className="font-medium text-white mb-1">Predio</h4>
                    <p>ID: {school.PREDIO}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="mt-4 flex flex-wrap gap-2">
            {/* Botón para ver en Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center bg-primary/20 hover:bg-primary/30 text-white py-2 px-3 rounded-lg text-sm transition-colors"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Ver en mapa
            </a>

            {/* Botón para ver detalles completos */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 flex items-center justify-center bg-secondary/20 hover:bg-secondary/30 text-white py-2 px-3 rounded-lg text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              Ver detalles
            </button>

            {/* Botón para escuelas con predio compartido */}
            {sharedPredioInfo && sharedPredioInfo.isShared && sharedPredioInfo.sharedWith.length > 0 && (
              <button
                onClick={handleSharedPredioClick}
                className="w-full mt-1 flex items-center justify-center bg-accent/20 hover:bg-accent/30 text-white py-2 px-3 rounded-lg text-sm transition-colors"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Predio compartido con {sharedPredioInfo.sharedWith.length} escuela(s)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de información detallada */}
      {isModalOpen && <DetailedInfoModal school={school} onClose={() => setIsModalOpen(false)} />}
    </>
  )
}
