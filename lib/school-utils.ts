/**
 * Abrevia los nombres de instituciones educativas según un esquema estandarizado
 * @param name Nombre completo de la institución
 * @returns Nombre abreviado según el esquema definido
 */
export function getAbbreviatedSchoolName(name: string): string {
  if (!name) return ""

  // Esquema de abreviaciones institucionales específico
  const institutionalAbbreviations = [
    { full: "ESCUELA DE EDUCACIÓN SECUNDARIA TÉCNICA", abbr: "E.E.S.T." },
    { full: "ESCUELA DE EDUCACIÓN SECUNDARIA AGRARIA", abbr: "E.E.S.A." },
    { full: "ESCUELA DE EDUCACIÓN SECUNDARIA", abbr: "E.E.S." },
    { full: "ESCUELA DE EDUCACIÓN PRIMARIA", abbr: "E.P." },
    { full: "ESCUELA DE EDUCACIÓN ESPECIAL", abbr: "E.E.E." },
    { full: "JARDÍN DE INFANTES", abbr: "J.I." },
  ]

  // Normalizar el nombre a mayúsculas para hacer la comparación insensible a mayúsculas/minúsculas
  const normalizedName = name.toUpperCase()
  let abbreviatedName = name

  // Aplicar las abreviaciones en orden (de más específico a menos específico)
  for (const { full, abbr } of institutionalAbbreviations) {
    // Buscar la denominación completa
    if (normalizedName.includes(full)) {
      // Determinar la posición exacta para preservar mayúsculas/minúsculas originales
      const startIndex = normalizedName.indexOf(full)
      const endIndex = startIndex + full.length

      // Reemplazar solo la denominación institucional, manteniendo el resto intacto
      abbreviatedName = abbreviatedName.substring(0, startIndex) + abbr + abbreviatedName.substring(endIndex)

      // Solo aplicar la primera coincidencia
      break
    }
  }

  return abbreviatedName
}
