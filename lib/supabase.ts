import { createClient } from "@supabase/supabase-js"

// Verificar y obtener las variables de entorno
const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    console.error("ADVERTENCIA: URL de Supabase no configurada")
  }
  return url || ""
}

const getSupabaseAnonKey = () => {
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    console.error("ADVERTENCIA: Clave anónima de Supabase no configurada")
  }
  return key || ""
}

const getSupabaseServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    console.error("ADVERTENCIA: Clave de servicio de Supabase no configurada")
  }
  return key || ""
}

// Crear clientes de Supabase
export const supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
  auth: {
    persistSession: false,
  },
})

export const supabaseAdmin = createClient(getSupabaseUrl(), getSupabaseServiceKey(), {
  auth: {
    persistSession: false,
  },
})

// Función para generar UUIDs
export function generateUUID() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
}

// Tipos para las tablas de Supabase
export interface Establecimiento {
  id: string
  cue: number
  nombre?: string | null
  distrito?: string | null
  ciudad?: string | null
  direccion?: string | null
  lat?: number | null
  lon?: number | null
  predio?: string | null
  fed_a_cargo?: string | null
  plan_enlace?: string | null
  subplan_enlace?: string | null
  fecha_inicio_conectividad?: string | null
  proveedor_internet_pnce?: string | null
  fecha_instalacion_pnce?: string | null
  pnce_tipo_mejora?: string | null
  pnce_fecha_mejora?: string | null
  pnce_estado?: string | null
  pba_grupo_1_proveedor_internet?: string | null
  pba_grupo_1_fecha_instalacion?: string | null
  pba_grupo_1_estado?: string | null
  pba_2019_proveedor_internet?: string | null
  pba_2019_fecha_instalacion?: string | null
  pba_2019_estado?: string | null
  pba_grupo_2_a_proveedor_internet?: string | null
  pba_grupo_2_a_fecha_instalacion?: string | null
  pba_grupo_2_a_tipo_mejora?: string | null
  pba_grupo_2_a_fecha_mejora?: string | null
  pba_grupo_2_a_estado?: string | null
  plan_piso_tecnologico?: string | null
  proveedor_piso_tecnologico_cue?: string | null
  fecha_terminado_piso_tecnologico_cue?: string | null
  tipo_mejora?: string | null
  fecha_mejora?: string | null
  tipo_piso_instalado?: string | null
  tipo?: string | null
  observaciones?: string | null
  tipo_establecimiento?: string | null
  listado_conexion_internet?: string | null
  estado_instalacion_pba?: string | null
  proveedor_asignado_pba?: string | null
  mb?: string | null
  ambito?: string | null
  cue_anterior?: string | null
  reclamos_grupo_1_ani?: string | null
  recurso_primario?: string | null
  access_id?: string | null
  [key: string]: any
}

export interface Contacto {
  id: string
  cue?: number | null
  nombre?: string | null
  apellido?: string | null
  correo?: string | null
  telefono?: string | null
  cargo?: string | null
  [key: string]: any
}
