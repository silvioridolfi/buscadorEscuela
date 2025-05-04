import { createClient } from "@supabase/supabase-js"

// Crear un cliente de Supabase usando las variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente para uso en el lado del cliente (solo operaciones públicas)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)

// Cliente para uso en el lado del servidor (operaciones privilegiadas)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Tipos para las tablas de Supabase
export interface Establecimiento {
  id?: number
  cue: string
  predio?: string
  establecimiento: string
  fed_a_cargo?: string
  distrito?: string
  ciudad?: string
  direccion?: string
  plan_enlace?: string
  subplan_enlace?: string
  fecha_inicio_conectividad?: string
  proveedor_internet_pnce?: string
  fecha_instalacion_pnce?: string
  pnce_tipo_mejora?: string
  pnce_fecha_mejora?: string
  pnce_estado?: string
  pba_grupo_1_proveedor_internet?: string
  pba_grupo_1_fecha_instalacion?: string
  pba_grupo_1_estado?: string
  pba_2019_proveedor_internet?: string
  pba_2019_fecha_instalacion?: string
  pba_2019_estado?: string
  pba_grupo_2_a_proveedor_internet?: string
  pba_grupo_2_a_fecha_instalacion?: string
  pba_grupo_2_a_tipo_mejora?: string
  pba_grupo_2_a_fecha_mejora?: string
  pba_grupo_2_a_estado?: string
  plan_piso_tecnologico?: string
  proveedor_piso_tecnologico_cue?: string
  fecha_terminado_piso_tecnologico_cue?: string
  tipo_mejora?: string
  fecha_mejora?: string
  tipo_piso_instalado?: string
  tipo?: string
  observaciones?: string
  tipo_establecimiento?: string
  listado_conexion_internet?: string
  estado_instalacion_pba?: string
  proveedor_asignado_pba?: string
  mb?: string
  ambito?: string
  cue_anterior?: string
  reclamos_grupo_1_ani?: string
  recurso_primario?: string
  access_id?: string
  lat?: string
  lon?: string
  created_at?: string
  updated_at?: string
}

export interface Contacto {
  id?: number
  cue: string
  nombre?: string
  apellido?: string
  cargo?: string
  telefono?: string
  correo_institucional?: string
  created_at?: string
  updated_at?: string
}
