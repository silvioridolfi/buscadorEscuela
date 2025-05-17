import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAbbreviatedSchoolName(name: string): string {
  if (!name) return "Sin nombre"
  if (name.length <= 25) return name

  const words = name.split(" ")
  if (words.length <= 2) return name

  // Intentar abreviar manteniendo primera y última palabra
  return `${words[0]} ... ${words[words.length - 1]}`
}
