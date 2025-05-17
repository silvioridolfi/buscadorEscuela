"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LogOut, Database, Map, Settings } from "lucide-react"
import MigrationButton from "@/admin/tools/MigrationButton"
import CoordinateCorrector from "@/admin/tools/CoordinateCorrector"
import LoadSheetsButton from "@/admin/components/LoadSheetsButton"

interface AdminPanelProps {
  onLogout: () => void
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("migration")

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
        <button onClick={onLogout} className="flex items-center text-white/70 hover:text-white text-sm">
          <LogOut className="w-4 h-4 mr-1" />
          Cerrar sesión
        </button>
      </div>

      <Tabs defaultValue="migration" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="migration" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <Database className="w-4 h-4 mr-2" />
            Migración
          </TabsTrigger>
          <TabsTrigger value="coordinates" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <Map className="w-4 h-4 mr-2" />
            Coordenadas
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="migration" className="space-y-6">
          <MigrationButton />
          <LoadSheetsButton />
        </TabsContent>

        <TabsContent value="coordinates">
          <CoordinateCorrector />
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <h3 className="text-white font-bold mb-4">Configuración</h3>
            <p className="text-white/70">Opciones de configuración adicionales estarán disponibles próximamente.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
