// NOTA: Este es un bypass temporal para la autenticación de administrador
// Se debe eliminar una vez que se resuelva el problema de autenticación

// Esta función siempre devuelve true para permitir el acceso de administrador
export function bypassAdminAuth(): boolean {
  return true
}

// Esta función genera un token fijo para el bypass
export function getBypassToken(): string {
  return "bypass_token_temporary"
}

// Esta función devuelve el token de bypass para la autenticación
export function getAdminAuthKey(): string {
  return getBypassToken()
}
