"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

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
  PBA_2019_PROVEEDOR_INTERNET: string
  PBA_GRUPO_2_A_PROVEEDOR_INTERNET: string
  PLAN_PISO_TECNOLOGICO: string
  PROVEEDOR_PISO_TECNOLOGICO_CUE: string
  TIPO_PISO_INSTALADO: string
  TIPO: string
  OBSERVACIONES: string
  LISTADO_CONEXION_INTERNET: string
  PROVEEDOR_ASIGNADO_PBA: string
  LAT: string
  LON: string
  NOMBRE: string
  APELLIDO: string
  CARGO: string
  TELEFONO: string
}

export default function SchoolSearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SchoolInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchResults = useCallback(async () => {
    if (query.length === 0) {
      setResults([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred while fetching data")
      }

      setResults(data)
    } catch (error) {
      console.error("Error in fetchResults:", error)
      setError(error.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchResults()
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter CUE, school name, or any other details"
          className="flex-grow"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {results.map((school) => (
            <Card key={school.CUE}>
              <CardHeader>
                <CardTitle>{school.ESTABLECIMIENTO}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Basic Information</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        <li>
                          <span className="font-semibold">CUE:</span> {school.CUE}
                        </li>
                        <li>
                          <span className="font-semibold">PREDIO:</span> {school.PREDIO}
                        </li>
                        <li>
                          <span className="font-semibold">FED A CARGO:</span> {school.FED_A_CARGO}
                        </li>
                        <li>
                          <span className="font-semibold">DISTRITO:</span> {school.DISTRITO}
                        </li>
                        <li>
                          <span className="font-semibold">CIUDAD:</span> {school.CIUDAD}
                        </li>
                        <li>
                          <span className="font-semibold">DIRECCIÓN:</span> {school.DIRECCION}
                        </li>
                        <li>
                          <span className="font-semibold">PLAN ENLACE:</span> {school.PLAN_ENLACE}
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Contact Information</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        <li>
                          <span className="font-semibold">NOMBRE:</span> {school.NOMBRE}
                        </li>
                        <li>
                          <span className="font-semibold">APELLIDO:</span> {school.APELLIDO}
                        </li>
                        <li>
                          <span className="font-semibold">CARGO:</span> {school.CARGO}
                        </li>
                        <li>
                          <span className="font-semibold">TELÉFONO:</span> {school.TELEFONO}
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Technical Information</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        <li>
                          <span className="font-semibold">SUBPLAN ENLACE:</span> {school.SUBPLAN_ENLACE}
                        </li>
                        <li>
                          <span className="font-semibold">FECHA INICIO CONECTIVIDAD:</span>{" "}
                          {school.FECHA_INICIO_CONECTIVIDAD}
                        </li>
                        <li>
                          <span className="font-semibold">Proveedor INTERNET PNCE:</span>{" "}
                          {school.PROVEEDOR_INTERNET_PNCE}
                        </li>
                        <li>
                          <span className="font-semibold">Fecha Instalación PNCE:</span> {school.FECHA_INSTALACION_PNCE}
                        </li>
                        <li>
                          <span className="font-semibold">PBA 2019 Proveedor INTERNET:</span>{" "}
                          {school.PBA_2019_PROVEEDOR_INTERNET}
                        </li>
                        <li>
                          <span className="font-semibold">PBA - GRUPO 2 - A Proveedor INTERNET:</span>{" "}
                          {school.PBA_GRUPO_2_A_PROVEEDOR_INTERNET}
                        </li>
                        <li>
                          <span className="font-semibold">PLAN PISO TECNOLÓGICO:</span> {school.PLAN_PISO_TECNOLOGICO}
                        </li>
                        <li>
                          <span className="font-semibold">Proveedor PISO TECNOLÓGICO CUE:</span>{" "}
                          {school.PROVEEDOR_PISO_TECNOLOGICO_CUE}
                        </li>
                        <li>
                          <span className="font-semibold">Tipo de Piso instalado:</span> {school.TIPO_PISO_INSTALADO}
                        </li>
                        <li>
                          <span className="font-semibold">Tipo:</span> {school.TIPO}
                        </li>
                        <li>
                          <span className="font-semibold">Observaciones:</span> {school.OBSERVACIONES}
                        </li>
                        <li>
                          <span className="font-semibold">Listado por el que se conecta internet:</span>{" "}
                          {school.LISTADO_CONEXION_INTERNET}
                        </li>
                        <li>
                          <span className="font-semibold">Proveedor asignado PBA:</span> {school.PROVEEDOR_ASIGNADO_PBA}
                        </li>
                        <li>
                          <span className="font-semibold">Latitud:</span> {school.LAT}
                        </li>
                        <li>
                          <span className="font-semibold">Longitud:</span> {school.LON}
                        </li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !loading && query.length > 0 && <p>No results found.</p>
      )}
    </div>
  )
}

