import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Encode_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/react"

const encodeSans = Encode_Sans({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Buscador de establecimientos educativos",
  description: "Busca información de escuelas desde la base de datos de Google Sheets",
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        {/* Add meta tags to prevent caching */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className={encodeSans.className}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}


import './globals.css'