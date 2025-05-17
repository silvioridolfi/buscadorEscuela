import { createHmac } from "crypto"

// Función para verificar la autenticación del administrador
export function verifyAdminAuth(token: string | null): boolean {
  if (!token) return false

  // Obtener la clave secreta desde las variables de entorno
  const secretKey = process.env.MIGRATION_AUTH_KEY

  if (!secretKey) {
    console.error("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
    return false
  }

  try {
    // Crear un timestamp para hoy (YYYY-MM-DD)
    const today = new Date().toISOString().split("T")[0]

    // Crear un HMAC usando la fecha actual y la clave secreta
    const hmac = createHmac("sha256", secretKey)
    hmac.update(today)
    const expectedToken = hmac.digest("hex")

    // Comparar el token proporcionado con el esperado
    return token === expectedToken
  } catch (error) {
    console.error("Error al verificar la autenticación:", error)
    return false
  }
}

// Función para generar un token de administrador (para uso en desarrollo)
export function generateAdminToken(): string {
  const secretKey = process.env.MIGRATION_AUTH_KEY

  if (!secretKey) {
    throw new Error("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
  }

  const today = new Date().toISOString().split("T")[0]
  const hmac = createHmac("sha256", secretKey)
  hmac.update(today)
  return hmac.digest("hex")
}
