"use client"

import { useState } from "react"
import MigrationPanel from "./MigrationPanel"
import CoordinateCorrector from "../tools/CoordinateCorrector"

export default function AdminPanel({ authKey }: { authKey: string }) {
  const [activeTab, setActiveTab] = useState("migration")

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("migration")}
            className={`${
              activeTab === "migration"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Migración de Datos
          </button>
          <button
            onClick={() => setActiveTab("coordinates")}
            className={`${
              activeTab === "coordinates"
                ? "border-indigo-500 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Corrección de Coordenadas
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === "migration" && <MigrationPanel authKey={authKey} />}
      {activeTab === "coordinates" && <CoordinateCorrector authKey={authKey} />}
    </div>
  )
}
