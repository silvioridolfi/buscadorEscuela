"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import CoordinateCorrector from "@/admin/tools/CoordinateCorrector"
import MigrationPanel from "./MigrationPanel"
import Link from "next/link"
import { FileSpreadsheet } from "lucide-react"

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

      {/* Tarjeta de Migración desde Google Sheets */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-colors">
        <Link href="/admin/sheet-migration" className="flex flex-col h-full">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Migración desde Sheets</h3>
          </div>
          <p className="text-sm text-white/70 mb-4">
            Migra datos desde hojas de Google Sheets a la base de datos Supabase.
          </p>
          <div className="mt-auto">
            <span className="text-xs px-2 py-1 bg-emerald-900/30 text-emerald-400 rounded-full">Nueva herramienta</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
