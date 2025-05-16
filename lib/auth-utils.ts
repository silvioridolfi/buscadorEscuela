// Función para verificar la autenticación del administrador
export function verifyAdminAuth(token: string | null): boolean {
  if (!token) return false

  // Obtener la clave secreta desde las variables de entorno
  const secretKey = process.env.MIGRATION_AUTH_KEY

  if (!secretKey) {
    console.warn("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
    // Si estamos en desarrollo y no hay clave configurada, aceptamos el token de bypass
    if (process.env.NODE_ENV === "development" && token === "bypass_token_temporary") {
      return true
    }
    return false
  }

  try {
    // Verificar directamente si el token coincide con la clave secreta
    return token === secretKey
  } catch (error) {
    console.error("Error al verificar la autenticación:", error)
    return false
  }
}

// Función para generar un token de administrador
export function generateAdminToken(): string {
  const secretKey = process.env.MIGRATION_AUTH_KEY

  if (!secretKey) {
    console.warn("MIGRATION_AUTH_KEY no está configurada en las variables de entorno, usando bypass")
    // Usar un valor de bypass para desarrollo
    return "bypass_token_temporary"
  }

  // Devolver directamente la clave secreta como token
  return secretKey
}
