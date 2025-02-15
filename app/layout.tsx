import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Encode_Sans } from "next/font/google"

const encodeSans = Encode_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Buscador de establecimientos educativos",
  description: "Busca información de escuelas desde la base de datos de Google Sheets",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${encodeSans.className} bg-[#00AEC3]`}>{children}</body>
    </html>
  )
}



import './globals.css'