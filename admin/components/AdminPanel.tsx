"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import CoordinateCorrector from "@/admin/tools/CoordinateCorrector"
import MigrationPanel from "./MigrationPanel"

interface AdminPanelProps {
  onLogout: () => void
  authKey: string
}

export default function AdminPanel({ onLogout, authKey }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState("coordinates")

  return (
    <div className="w-full max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Panel de Administración</h2>
        <Button variant="outline" size="sm" onClick={onLogout} className="text-white border-white/30 hover:bg-white/10">
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6 bg-white/10">
          <TabsTrigger value="coordinates" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Corrección de Coordenadas
          </TabsTrigger>
          <TabsTrigger value="migration" className="data-[state=active]:bg-primary data-[state=active]:text-white">
            Migración de Datos
          </TabsTrigger>
        </TabsList>
        <TabsContent value="coordinates">
          <CoordinateCorrector authKey={authKey} />
        </TabsContent>
        <TabsContent value="migration">
          <MigrationPanel authKey={authKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
