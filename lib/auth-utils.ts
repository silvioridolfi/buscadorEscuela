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
    throw new Error("MIGRATION_AUTH_KEY no está configurada en las variables de entorno")
  }

  // Devolver directamente la clave secreta como token
  return secretKey
}
