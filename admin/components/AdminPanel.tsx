"use client"

import { useState } from "react"
import { Database, Settings, LogOut, Server, MapPin } from "lucide-react"
import CoordinateCorrector from "../tools/CoordinateCorrector"
import { MigrationPanel } from "./MigrationPanel"

interface AdminPanelProps {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"migration" | "coordinates" | "settings">("migration")
  const [authToken, setAuthToken] = useState<string | null>(null)

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl w-full max-w-4xl">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Server className="w-5 h-5 mr-2" />
          Panel de Administración
        </h2>
        <button
          onClick={onLogout}
          className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors flex items-center"
        >
          <LogOut className="w-4 h-4 mr-1" />
          <span className="text-sm">Cerrar sesión</span>
        </button>
      </div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("migration")}
          className={`px-4 py-3 text-sm font-medium flex items-center ${
            activeTab === "migration"
              ? "bg-white/10 text-white border-b-2 border-primary"
              : "text-white/70 hover:bg-white/5"
          }`}
        >
          <Database className="w-4 h-4 mr-2" />
          Migración de Datos
        </button>
        <button
          onClick={() => setActiveTab("coordinates")}
          className={`px-4 py-3 text-sm font-medium flex items-center ${
            activeTab === "coordinates"
              ? "bg-white/10 text-white border-b-2 border-primary"
              : "text-white/70 hover:bg-white/5"
          }`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          Coordenadas
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-3 text-sm font-medium flex items-center ${
            activeTab === "settings"
              ? "bg-white/10 text-white border-b-2 border-primary"
              : "text-white/70 hover:bg-white/5"
          }`}
        >
          <Settings className="w-4 h-4 mr-2" />
          Configuración
        </button>
      </div>

      <div className="p-6">
        {activeTab === "migration" && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Herramientas de Migración</h3>
            <MigrationPanel authToken={authToken} />
          </div>
        )}

        {activeTab === "coordinates" && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Corrección de Coordenadas</h3>
            <CoordinateCorrector />
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Configuración del Sistema</h3>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl">
              <p className="text-white/70 mb-4">
                Esta sección está en desarrollo. Próximamente podrás configurar parámetros del sistema desde aquí.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
