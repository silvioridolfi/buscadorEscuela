// Función para generar un token de administrador
export function generateAdminToken(): string {
  // En lugar de generar un token aleatorio, devolvemos directamente el ADMIN_AUTH_KEY
  return process.env.ADMIN_AUTH_KEY || ""
}

// Función para verificar un token de administrador
export function verifyAdminAuth(token: string): boolean {
  const adminAuthKey = process.env.ADMIN_AUTH_KEY

  // Verificar que el token coincida con ADMIN_AUTH_KEY
  return !!token && !!adminAuthKey && token === adminAuthKey
}
