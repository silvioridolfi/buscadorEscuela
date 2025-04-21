"use client"
import {
  X,
  AlertTriangle,
  MapPin,
  Bug,
  School,
  Building,
  Hash,
  MapIcon,
  User,
  Phone,
  Mail,
  Calendar,
  Wifi,
  Info,
  ExternalLink,
  ArrowLeft,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { SharedPredioInfo } from "./SchoolSearch"
import SchoolMap from "./SchoolMap"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { getAbbreviatedSchoolName } from "@/lib/school-utils"

interface SchoolInfo {
  CUE: string
  PREDIO: string
  ESTABLECIMIENTO: string
  FED_A_CARGO: string
  DISTRITO: string
  CIUDAD: string
  DIRECCION: string
  PLAN_ENLACE: string
  SUBPLAN_ENLACE: string
  FECHA_INICIO_CONECTIVIDAD: string
  PROVEEDOR_INTERNET_PNCE: string
  FECHA_INSTALACION_PNCE: string
  PNCE_TIPO_MEJORA: string
  PNCE_FECHA_MEJORA: string
  PNCE_ESTADO: string
  PBA_GRUPO_1_PROVEEDOR_INTERNET: string
  PBA_GRUPO_1_FECHA_INSTALACION: string
  PBA_GRUPO_1_ESTADO: string
  PBA_2019_PROVEEDOR_INTERNET: string
  PBA_2019_FECHA_INSTALACION: string
  PBA_2019_ESTADO: string
  PBA_GRUPO_2_A_PROVEEDOR_INTERNET: string
  PBA_GRUPO_2_A_FECHA_INSTALACION: string
  PBA_GRUPO_2_A_TIPO_MEJORA: string
  PBA_GRUPO_2_A_FECHA_MEJORA: string
  PBA_GRUPO_2_A_ESTADO: string
  PLAN_PISO_TECNOLOGICO: string
  PROVEEDOR_PISO_TECNOLOGICO_CUE: string
  FECHA_TERMINADO_PISO_TECNOLOGICO_CUE: string
  TIPO_MEJORA: string
  FECHA_MEJORA: string
  TIPO_PISO_INSTALADO: string
  TIPO: string
  OBSERVACIONES: string
  TIPO_ESTABLECIMIENTO: string
  LISTADO_CONEXION_INTERNET: string
  ESTADO_INSTALACION_PBA: string
  PROVEEDOR_ASIGNADO_PBA: string
  MB: string
  AMBITO: string
  CUE_ANTERIOR: string
  RECLAMOS_GRUPO_1_ANI: string
  RECURSO_PRIMARIO: string
  ACCESS_ID: string
  LAT: string
  LON: string
  NOMBRE: string
  APELLIDO: string
  CARGO: string
  TELEFONO: string
  CORREO_INSTITUCIONAL: string
}

interface DetailedInfoModalProps {
  school: SchoolInfo
  isOpen: boolean
  onClose: () => void
  sharedPredioInfo?: SharedPredioInfo
  onSearchByCUE?: (cue: string) => void
}

export default function DetailedInfoModal({
  school: initialSchool,
  isOpen,
  onClose,
  sharedPredioInfo,
  onSearchByCUE,
}: DetailedInfoModalProps) {
  const [activeTab, setActiveTab] = useState<"info" | "map">("info")
  const [mounted, setMounted] = useState(false)
  const [currentSchool, setCurrentSchool] = useState<SchoolInfo>(initialSchool)
  const [schoolHistory, setSchoolHistory] = useState<SchoolInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentSharedPredioInfo, setCurrentSharedPredioInfo] = useState<SharedPredioInfo | undefined>(sharedPredioInfo)

  // Estados para secciones colapsables en móvil
  const [activeSection, setActiveSection] = useState<"basic" | "contact" | "technical" | "sharedPredio" | null>("basic")

  // Detectar si estamos en móvil
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [isOpen])

  // Only mount the portal after the component is mounted on the client
  useEffect(() => {
    setMounted(true)

    // Lock body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Reset current school when initial school changes
  useEffect(() => {
    setCurrentSchool(initialSchool)
    setSchoolHistory([])
    setCurrentSharedPredioInfo(sharedPredioInfo)
    // Establecer la sección básica como activa por defecto
    setActiveSection("basic")
  }, [initialSchool, sharedPredioInfo])

  // Function to toggle section expansion - modificada para que solo una sección esté activa a la vez
  const toggleSection = (section: "basic" | "contact" | "technical" | "sharedPredio") => {
    // Añadir un pequeño retraso si estamos cerrando una sección y abriendo otra
    if (activeSection && activeSection !== section) {
      setActiveSection(null)
      setTimeout(() => {
        setActiveSection(section)
      }, 50)
    } else {
      setActiveSection(activeSection === section ? null : section)
    }
  }

  // Function to fetch school data by CUE
  const fetchSchoolByCUE = async (cue: string) => {
    setLoading(true)
    setError(null)

    try {
      // Add timestamp to URL to bypass cache
      const timestamp = Date.now()
      const url = `/api/search?query=${encodeURIComponent(cue)}&_t=${timestamp}`

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener datos de la escuela: ${response.status}`)
      }

      const data = await response.json()

      if (!data || data.length === 0) {
        throw new Error(`No se encontró información para el CUE: ${cue}`)
      }

      // Get the first result (should be exact match by CUE)
      const schoolData = data[0]

      // Save current school to history before changing
      setSchoolHistory((prev) => [...prev, currentSchool])

      // Update current school
      setCurrentSchool(schoolData)

      // Fetch shared PREDIO info for the new school
      await fetchSharedPredioInfo(schoolData.PREDIO, schoolData.CUE)

      // Establecer la sección básica como activa al cambiar de escuela
      setActiveSection("basic")
    } catch (error) {
      console.error("Error fetching school by CUE:", error)
      setError(error.message || "Error al cargar la información de la escuela")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch shared PREDIO info
  const fetchSharedPredioInfo = async (predio: string, cue: string) => {
    if (!predio) {
      setCurrentSharedPredioInfo(undefined)
      return
    }

    try {
      // Add timestamp to URL to bypass cache
      const timestamp = Date.now()
      const url = `/api/schools-by-predio?predio=${encodeURIComponent(predio)}&_t=${timestamp}`

      const response = await fetch(url, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      })

      if (!response.ok) {
        throw new Error(`Error al obtener información de PREDIO compartido: ${response.status}`)
      }

      const data = await response.json()
      const schools = data.schools || []

      if (schools.length > 1) {
        // This PREDIO is shared by multiple schools
        const newSharedPredioInfo: SharedPredioInfo = {
          isShared: true,
          predio: predio,
          sharedWith: schools
            .filter((s: SchoolInfo) => s.CUE !== cue)
            .map((s: SchoolInfo) => ({
              CUE: s.CUE,
              ESTABLECIMIENTO: s.ESTABLECIMIENTO,
            })),
        }
        setCurrentSharedPredioInfo(newSharedPredioInfo)
      } else {
        setCurrentSharedPredioInfo(undefined)
      }
    } catch (error) {
      console.error("Error fetching shared PREDIO info:", error)
      setCurrentSharedPredioInfo(undefined)
    }
  }

  // Handle click on a shared school CUE
  const handleCUEClick = (cue: string) => {
    fetchSchoolByCUE(cue)
  }

  // Handle going back to previous school
  const handleGoBack = () => {
    if (schoolHistory.length > 0) {
      const previousSchool = schoolHistory[schoolHistory.length - 1]
      setCurrentSchool(previousSchool)
      setSchoolHistory((prev) => prev.slice(0, -1))

      // If we have onSearchByCUE, use it to update shared PREDIO info
      if (onSearchByCUE) {
        fetchSharedPredioInfo(previousSchool.PREDIO, previousSchool.CUE)
      }
    }
  }

  if (!isOpen || !mounted) return null

  const hasSharedPredio = currentSharedPredioInfo?.isShared
  const hasLocation =
    currentSchool.LAT &&
    currentSchool.LON &&
    currentSchool.LAT !== "0" &&
    currentSchool.LON !== "0" &&
    currentSchool.LAT.trim() !== "" &&
    currentSchool.LON.trim() !== ""

  // Determine school type for icon
  const getSchoolTypeIcon = () => {
    const name = currentSchool.ESTABLECIMIENTO.toLowerCase()
    if (name.includes("jardin") || name.includes("inicial")) {
      return <School className="w-6 h-6 text-white" />
    } else if (name.includes("primaria")) {
      return <School className="w-6 h-6 text-white" />
    } else if (name.includes("secundaria") || name.includes("tecnica")) {
      return <School className="w-6 h-6 text-white" />
    } else {
      return <Building className="w-6 h-6 text-white" />
    }
  }

  // Función para mostrar el nombre según el dispositivo
  const getDisplayName = () => {
    return (
      <>
        <span className="md:hidden">{getAbbreviatedSchoolName(currentSchool.ESTABLECIMIENTO)}</span>
        <span className="hidden md:block">{currentSchool.ESTABLECIMIENTO}</span>
      </>
    )
  }

  // Group the data into categories for better organization
  const basicInfo = [
    { label: "CUE", value: currentSchool.CUE, icon: <Hash className="w-4 h-4" /> },
    { label: "ESTABLECIMIENTO", value: currentSchool.ESTABLECIMIENTO, icon: <School className="w-4 h-4" /> },
    { label: "PREDIO", value: currentSchool.PREDIO, icon: <Building className="w-4 h-4" /> },
    { label: "FED A CARGO", value: currentSchool.FED_A_CARGO, icon: <User className="w-4 h-4" />, isBold: true },
    { label: "DISTRITO", value: currentSchool.DISTRITO, icon: <MapIcon className="w-4 h-4" />, isBold: true },
    { label: "CIUDAD", value: currentSchool.CIUDAD, icon: <MapIcon className="w-4 h-4" /> },
    { label: "DIRECCIÓN", value: currentSchool.DIRECCION, icon: <MapPin className="w-4 h-4" /> },
  ]

  const contactInfo = [
    { label: "NOMBRE", value: currentSchool.NOMBRE || "Sin datos", icon: <User className="w-4 h-4" /> },
    { label: "APELLIDO", value: currentSchool.APELLIDO || "Sin datos", icon: <User className="w-4 h-4" /> },
    { label: "CARGO", value: currentSchool.CARGO || "Sin datos", icon: <User className="w-4 h-4" /> },
    { label: "TELÉFONO", value: currentSchool.TELEFONO || "Sin datos", icon: <Phone className="w-4 h-4" /> },
    {
      label: "CORREO INSTITUCIONAL",
      value: currentSchool.CORREO_INSTITUCIONAL || "Sin datos",
      icon: <Mail className="w-4 h-4" />,
    },
  ]

  // Comprehensive technical information - excluding LAT and LON
  const technicalInfo = [
    { label: "PLAN ENLACE", value: currentSchool.PLAN_ENLACE, icon: <Wifi className="w-4 h-4" /> },
    { label: "SUBPLAN ENLACE", value: currentSchool.SUBPLAN_ENLACE, icon: <Wifi className="w-4 h-4" /> },
    {
      label: "FECHA INICIO CONECTIVIDAD",
      value: currentSchool.FECHA_INICIO_CONECTIVIDAD,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "PROVEEDOR INTERNET PNCE",
      value: currentSchool.PROVEEDOR_INTERNET_PNCE,
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      label: "FECHA INSTALACIÓN PNCE",
      value: currentSchool.FECHA_INSTALACION_PNCE,
      icon: <Calendar className="w-4 h-4" />,
    },
    { label: "PNCE TIPO DE MEJORA", value: currentSchool.PNCE_TIPO_MEJORA, icon: <Info className="w-4 h-4" /> },
    { label: "PNCE FECHA DE MEJORA", value: currentSchool.PNCE_FECHA_MEJORA, icon: <Calendar className="w-4 h-4" /> },
    { label: "PNCE ESTADO", value: currentSchool.PNCE_ESTADO, icon: <Info className="w-4 h-4" /> },
    {
      label: "PBA - GRUPO 1 PROVEEDOR INTERNET",
      value: currentSchool.PBA_GRUPO_1_PROVEEDOR_INTERNET,
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      label: "PBA - GRUPO 1 FECHA INSTALACIÓN",
      value: currentSchool.PBA_GRUPO_1_FECHA_INSTALACION,
      icon: <Calendar className="w-4 h-4" />,
    },
    { label: "PBA - GRUPO 1 ESTADO", value: currentSchool.PBA_GRUPO_1_ESTADO, icon: <Info className="w-4 h-4" /> },
    {
      label: "PBA 2019 PROVEEDOR INTERNET",
      value: currentSchool.PBA_2019_PROVEEDOR_INTERNET,
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      label: "PBA 2019 FECHA INSTALACIÓN",
      value: currentSchool.PBA_2019_FECHA_INSTALACION,
      icon: <Calendar className="w-4 h-4" />,
    },
    { label: "PBA 2019 ESTADO", value: currentSchool.PBA_2019_ESTADO, icon: <Info className="w-4 h-4" /> },
    {
      label: "PBA - GRUPO 2 - A PROVEEDOR INTERNET",
      value: currentSchool.PBA_GRUPO_2_A_PROVEEDOR_INTERNET,
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      label: "PBA - GRUPO 2 - A FECHA INSTALACIÓN",
      value: currentSchool.PBA_GRUPO_2_A_FECHA_INSTALACION,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "PBA - GRUPO 2 - A TIPO DE MEJORA",
      value: currentSchool.PBA_GRUPO_2_A_TIPO_MEJORA,
      icon: <Info className="w-4 h-4" />,
    },
    {
      label: "PBA - GRUPO 2 - A FECHA DE MEJORA",
      value: currentSchool.PBA_GRUPO_2_A_FECHA_MEJORA,
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      label: "PBA - GRUPO 2 - A ESTADO",
      value: currentSchool.PBA_GRUPO_2_A_ESTADO,
      icon: <Info className="w-4 h-4" />,
    },
    { label: "PLAN PISO TECNOLÓGICO", value: currentSchool.PLAN_PISO_TECNOLOGICO, icon: <Info className="w-4 h-4" /> },
    {
      label: "PROVEEDOR PISO TECNOLÓGICO CUE",
      value: currentSchool.PROVEEDOR_PISO_TECNOLOGICO_CUE,
      icon: <Info className="w-4 h-4" />,
    },
    {
      label: "FECHA TERMINADO PISO TECNOLÓGICO CUE",
      value: currentSchool.FECHA_TERMINADO_PISO_TECNOLOGICO_CUE,
      icon: <Calendar className="w-4 h-4" />,
    },
    { label: "TIPO DE MEJORA", value: currentSchool.TIPO_MEJORA, icon: <Info className="w-4 h-4" /> },
    { label: "FECHA DE MEJORA", value: currentSchool.FECHA_MEJORA, icon: <Calendar className="w-4 h-4" /> },
    { label: "TIPO DE PISO INSTALADO", value: currentSchool.TIPO_PISO_INSTALADO, icon: <Info className="w-4 h-4" /> },
    { label: "TIPO", value: currentSchool.TIPO, icon: <Info className="w-4 h-4" /> },
    { label: "OBSERVACIONES", value: currentSchool.OBSERVACIONES, icon: <Info className="w-4 h-4" /> },
    {
      label: "TIPO DE ESTABLECIMIENTO",
      value: currentSchool.TIPO_ESTABLECIMIENTO,
      icon: <School className="w-4 h-4" />,
    },
    {
      label: "LISTADO POR EL QUE SE CONECTA INTERNET",
      value: currentSchool.LISTADO_CONEXION_INTERNET,
      icon: <Wifi className="w-4 h-4" />,
    },
    {
      label: "ESTADO DE INSTALACIÓN PBA",
      value: currentSchool.ESTADO_INSTALACION_PBA,
      icon: <Info className="w-4 h-4" />,
    },
    {
      label: "PROVEEDOR ASIGNADO PBA",
      value: currentSchool.PROVEEDOR_ASIGNADO_PBA,
      icon: <Wifi className="w-4 h-4" />,
    },
    { label: "MB", value: currentSchool.MB, icon: <Wifi className="w-4 h-4" /> },
    { label: "ÁMBITO", value: currentSchool.AMBITO, icon: <Info className="w-4 h-4" /> },
    { label: "CUE ANTERIOR", value: currentSchool.CUE_ANTERIOR, icon: <Hash className="w-4 h-4" /> },
    { label: "RECLAMOS GRUPO 1 ANI", value: currentSchool.RECLAMOS_GRUPO_1_ANI, icon: <Info className="w-4 h-4" /> },
    { label: "RECURSO PRIMARIO", value: currentSchool.RECURSO_PRIMARIO, icon: <Info className="w-4 h-4" /> },
    { label: "Access ID", value: currentSchool.ACCESS_ID, icon: <Hash className="w-4 h-4" /> },
  ]

  // Filter out empty values from technical info
  const filteredTechnicalInfo = technicalInfo.filter((item) => item.value)

  // Function to check coordinates in debug mode
  const checkCoordinates = () => {
    window.open(
      `/api/debug/coordinates?lat=${encodeURIComponent(currentSchool.LAT)}&lon=${encodeURIComponent(currentSchool.LON)}`,
      "_blank",
    )
  }

  // Solo renderizar el portal si estamos en el cliente y el componente está montado
  if (typeof window === "undefined" || !mounted) return null

  // Use createPortal to render the modal outside of the component hierarchy
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop with blur effect */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      {/* Modal Content - Ahora a pantalla completa */}
      <div
        className="relative bg-gradient-to-br from-gray-900 to-gray-800 w-full h-full md:h-full overflow-hidden flex flex-col border-0 md:border md:border-white/10"
        onClick={(e) => e.stopPropagation()} // Prevent clicks from closing the modal
      >
        {/* Header with gradient background */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-primary via-secondary to-accent flex justify-between items-center sticky top-0 z-10">
          {/* Efecto de resplandor en el fondo */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent opacity-30"></div>

          <div className="flex items-center gap-3 relative z-10">
            {schoolHistory.length > 0 && (
              <button
                onClick={handleGoBack}
                className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm hover:bg-white/30 transition-colors flex-shrink-0 shadow-lg"
                title="Volver a la escuela anterior"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm flex-shrink-0 shadow-lg">
              {getSchoolTypeIcon()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white">{getDisplayName()}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm text-white text-xs md:text-sm flex items-center shadow-sm">
                  <Hash className="w-3 h-3 mr-1" />
                  CUE: {currentSchool.CUE}
                </span>
                {hasSharedPredio && (
                  <span className="bg-amber-500/80 px-3 py-1 rounded-full backdrop-blur-sm text-white text-xs md:text-sm flex items-center shadow-sm">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Predio Compartido
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2.5 transition-colors flex-shrink-0 relative z-10"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-white font-medium">Cargando información...</p>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 bg-red-900/50 border-b border-red-500/30 backdrop-blur-sm">
            <div className="flex items-start gap-2 text-red-200">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-medium">Error al cargar la información</p>
                <p className="text-sm opacity-90">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs for navigation */}
        {hasLocation && (
          <div className="bg-gray-800 border-b border-white/10 z-10 relative">
            <div className="flex">
              <button
                onClick={() => setActiveTab("info")}
                className={`px-5 py-3 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "info"
                    ? "bg-gray-900 text-primary border-b-2 border-primary"
                    : "text-white/70 hover:bg-gray-700"
                }`}
              >
                <Info className="w-4 h-4" />
                Información
              </button>
              <button
                onClick={() => setActiveTab("map")}
                className={`px-5 py-3 font-medium text-sm flex items-center gap-2 ${
                  activeTab === "map"
                    ? "bg-gray-900 text-primary border-b-2 border-primary"
                    : "text-white/70 hover:bg-gray-700"
                }`}
              >
                <MapPin className="w-4 h-4" />
                Mapa
              </button>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div className="flex-grow overflow-auto">
          {activeTab === "map" && hasLocation ? (
            <div className="p-5 md:p-6">
              <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Ubicación
                  </h3>
                  <button
                    onClick={checkCoordinates}
                    className="text-xs bg-gray-700 px-3 py-1 rounded-full text-white/70 flex items-center hover:bg-gray-600"
                  >
                    <Bug className="w-3 h-3 mr-1" />
                    Verificar coordenadas
                  </button>
                </div>
                <div className="h-[300px] md:h-[calc(100vh-220px)] rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <SchoolMap
                    lat={currentSchool.LAT}
                    lon={currentSchool.LON}
                    schoolName={currentSchool.ESTABLECIMIENTO}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 md:p-6 space-y-6">
              {/* Basic Information Section - Collapsible on mobile */}
              <section>
                <button
                  onClick={() => toggleSection("basic")}
                  className={`w-full flex justify-between items-center text-left ${isMobile ? "mb-2" : "mb-4"}`}
                >
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <School className="w-5 h-5 text-primary" />
                    Información Básica
                  </h3>
                  {isMobile &&
                    (activeSection === "basic" ? (
                      <ChevronUp className="w-5 h-5 text-white/70 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/70 transition-transform duration-300" />
                    ))}
                </button>

                {/* Basic Information Section - Collapsible on mobile */}
                <div
                  className={`bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${
                    !isMobile || activeSection === "basic"
                      ? "p-4 md:p-5 opacity-100 max-h-[2000px]"
                      : "max-h-0 p-0 opacity-0 border-0"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {basicInfo.map((item, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-xl ${
                          item.label === "PREDIO" && hasSharedPredio
                            ? "col-span-1 md:col-span-2 bg-amber-900/30 border border-amber-500/30"
                            : "bg-gray-700/50 border border-white/5 shadow-sm"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className={item.label === "PREDIO" && hasSharedPredio ? "text-amber-400" : "text-primary"}
                          >
                            {item.label === "PREDIO" && hasSharedPredio ? (
                              <AlertTriangle className="w-4 h-4" />
                            ) : (
                              item.icon
                            )}
                          </div>
                          <span
                            className={`font-bold text-sm ${item.label === "PREDIO" && hasSharedPredio ? "text-amber-300" : "text-white"}`}
                          >
                            {item.label}
                          </span>
                        </div>
                        <div className="pl-6 text-white/90">
                          {/* Aplicar negrita a los valores de DISTRITO y FED A CARGO */}
                          <span
                            className={`${item.label === "DISTRITO" || item.label === "FED A CARGO" ? "font-bold" : ""}`}
                          >
                            {item.value || "Sin datos"}
                          </span>
                          {item.label === "PREDIO" && hasSharedPredio && (
                            <span className="ml-2 text-xs bg-amber-500/30 text-amber-300 px-2 py-0.5 rounded-full inline-flex items-center">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Compartido
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {hasLocation && activeTab !== "map" && (!isMobile || activeSection === "basic") && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Ubicación
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab("map")}
                          className="text-xs bg-primary/20 px-3 py-1 rounded-full text-primary flex items-center hover:bg-primary/30"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Ver mapa completo
                        </button>
                      </div>
                    </div>
                    <div className="h-36 md:h-48 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                      <SchoolMap
                        lat={currentSchool.LAT}
                        lon={currentSchool.LON}
                        schoolName={currentSchool.ESTABLECIMIENTO}
                      />
                    </div>
                  </div>
                )}

                {hasSharedPredio && (
                  <div className="mt-4">
                    <button
                      onClick={() => toggleSection("sharedPredio")}
                      className={`w-full flex justify-between items-center text-left mb-2 ${!isMobile && "hidden"}`}
                    >
                      <h4 className="font-bold text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        Predio Compartido
                      </h4>
                      {isMobile &&
                        (activeSection === "sharedPredio" ? (
                          <ChevronUp className="w-5 h-5 text-amber-400 transition-transform duration-300" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-amber-400 transition-transform duration-300" />
                        ))}
                    </button>

                    {/* Shared Predio Information Section - Collapsible on mobile */}
                    <div
                      className={`bg-amber-900/30 rounded-xl border border-amber-500/30 shadow-lg overflow-hidden transition-all duration-300 ease-in-out ${
                        !isMobile || activeSection === "sharedPredio"
                          ? "p-4 opacity-100 max-h-[2000px]"
                          : "max-h-0 p-0 opacity-0 border-0"
                      }`}
                    >
                      {!isMobile && (
                        <h4 className="font-bold text-amber-300 mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                          Predio Compartido
                        </h4>
                      )}
                      <p className="text-sm text-amber-200 mb-3">
                        Este establecimiento comparte el predio {currentSchool.PREDIO} con:
                      </p>
                      <div className="bg-gray-800/70 rounded-xl p-3 max-h-36 md:max-h-48 overflow-y-auto border border-amber-500/20">
                        <ul className="space-y-2">
                          {currentSharedPredioInfo?.sharedWith.map((shared) => (
                            <li key={shared.CUE} className="text-sm text-amber-100 flex items-start gap-2">
                              <span className="text-amber-400 mr-1.5">•</span>
                              <div>
                                <span className="font-medium">{getAbbreviatedSchoolName(shared.ESTABLECIMIENTO)}</span>
                                <br />
                                <button
                                  onClick={() => handleCUEClick(shared.CUE)}
                                  className="text-xs text-amber-300 hover:text-amber-100 hover:underline flex items-center"
                                >
                                  CUE: {shared.CUE}
                                  <ExternalLink className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* Contact Information Section - Collapsible on mobile */}
              <section>
                <button
                  onClick={() => toggleSection("contact")}
                  className={`w-full flex justify-between items-center text-left ${isMobile ? "mb-2" : "mb-4"}`}
                >
                  <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    Información de Contacto
                  </h3>
                  {isMobile &&
                    (activeSection === "contact" ? (
                      <ChevronUp className="w-5 h-5 text-white/70 transition-transform duration-300" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/70 transition-transform duration-300" />
                    ))}
                </button>

                {/* Contact Information Section - Collapsible on mobile */}
                <div
                  className={`bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${
                    !isMobile || activeSection === "contact"
                      ? "p-4 md:p-5 opacity-100 max-h-[2000px]"
                      : "max-h-0 p-0 opacity-0 border-0"
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    {contactInfo.map((item, index) => (
                      <div key={index} className="p-3 rounded-xl bg-gray-700/50 border border-white/5 shadow-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-primary">{item.icon}</div>
                          <span className="font-bold text-white text-sm">{item.label}</span>
                        </div>
                        <div className="pl-6 text-white/90">
                          {item.label === "CORREO INSTITUCIONAL" && item.value !== "Sin datos" ? (
                            <a
                              href={`mailto:${item.value}`}
                              className="text-primary hover:underline flex items-center gap-1 text-sm break-all"
                            >
                              {item.value}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <span className="text-sm">{item.value}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Technical Information Section - Collapsible on mobile */}
              {filteredTechnicalInfo.length > 0 && (
                <section>
                  <button
                    onClick={() => toggleSection("technical")}
                    className={`w-full flex justify-between items-center text-left ${isMobile ? "mb-2" : "mb-4"}`}
                  >
                    <h3 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                      <Wifi className="w-5 h-5 text-primary" />
                      Información Técnica
                    </h3>
                    {isMobile &&
                      (activeSection === "technical" ? (
                        <ChevronUp className="w-5 h-5 text-white/70 transition-transform duration-300" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/70 transition-transform duration-300" />
                      ))}
                  </button>

                  {/* Technical Information Section - Collapsible on mobile */}
                  <div
                    className={`bg-gray-800/50 rounded-xl border border-white/5 overflow-hidden transition-all duration-300 ease-in-out ${
                      !isMobile || activeSection === "technical"
                        ? "p-4 md:p-5 opacity-100 max-h-[2000px]"
                        : "max-h-0 p-0 opacity-0 border-0"
                    }`}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      {filteredTechnicalInfo.map((item, index) => (
                        <div key={index} className="p-3 rounded-xl bg-gray-700/50 border border-white/5 shadow-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="text-primary">{item.icon}</div>
                            <span className="font-bold text-white text-sm">{item.label}</span>
                          </div>
                          <div className="pl-6 text-white/90 text-sm">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Footer with close button */}
        <div className="p-4 border-t border-white/10 bg-gray-800/80 backdrop-blur-sm sticky bottom-0 z-10">
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all font-medium shadow-lg text-sm"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>,
    document.body, // Render directly to the body element
  )
}
