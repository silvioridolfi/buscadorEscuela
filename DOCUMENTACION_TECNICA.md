# Documentación Técnica: Buscador de Establecimientos Educativos

## Descripción General

El "Buscador de Establecimientos Educativos" es una aplicación web desarrollada para la Dirección de Tecnología Educativa de la Provincia de Buenos Aires. Su propósito principal es permitir a los usuarios buscar y visualizar información detallada sobre instituciones educativas de la Región Educativa 1, incluyendo datos de conectividad, infraestructura tecnológica y contacto.

## Propósito y Funcionalidad

### Objetivo Principal
Proporcionar una herramienta intuitiva y eficiente para consultar información actualizada sobre establecimientos educativos, facilitando el acceso a datos críticos como:

- Información básica de las escuelas (CUE, nombre, distrito, etc.)
- Datos de contacto de las instituciones
- Información sobre conectividad e infraestructura tecnológica
- Ubicación geográfica de los establecimientos
- Relaciones entre escuelas que comparten predios

### Usuarios Objetivo
- Personal administrativo de la Dirección de Tecnología Educativa
- Directivos y personal de las instituciones educativas
- Técnicos y personal de soporte de infraestructura tecnológica
- Funcionarios del sistema educativo provincial

## Arquitectura Técnica

### Tecnologías Utilizadas

- **Frontend**: 
  - Next.js 13.5.4 (App Router)
  - React 18
  - TypeScript
  - Tailwind CSS para estilos
  - Lucide React para iconografía

- **Backend**:
  - API Routes de Next.js
  - Integración con Google Sheets como fuente de datos
  - Servicios de Google Maps para visualización de ubicaciones

- **Integración de Datos**:
  - SheetDB (API primaria)
  - Sheet2API (API secundaria de respaldo)
  - Sistema de caché y fallback para garantizar disponibilidad

### Estructura del Proyecto

\`\`\`
├── app/                      # Directorio principal de la aplicación Next.js
│   ├── api/                  # Endpoints de API
│   │   ├── all-schools/      # API para obtener todas las escuelas
│   │   ├── autocomplete/     # API para sugerencias de autocompletado
│   │   ├── maps/             # APIs relacionadas con mapas
│   │   ├── schools-by-predio/# API para buscar escuelas por PREDIO
│   │   ├── search/           # API principal de búsqueda
│   │   └── status/           # API para verificar estado del sistema
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx            # Layout principal de la aplicación
│   └── page.tsx              # Página principal
├── components/               # Componentes React reutilizables
│   ├── DetailedInfoModal.tsx # Modal con información detallada
│   ├── Footer.tsx            # Componente de pie de página
│   ├── SchoolCard.tsx        # Tarjeta de escuela
│   ├── SchoolMap.tsx         # Componente de mapa
│   ├── SchoolSearch.tsx      # Componente principal de búsqueda
│   └── ScrollToTopButton.tsx # Botón para volver al inicio
├── lib/                      # Utilidades y funciones auxiliares
│   └── api-utils.ts          # Utilidades para manejo de APIs
├── public/                   # Archivos estáticos
│   └── images/               # Imágenes e iconos
└── types/                    # Definiciones de tipos TypeScript
\`\`\`

## Componentes Principales

### SchoolSearch
Componente principal que maneja la búsqueda de establecimientos educativos. Incluye:
- Campo de búsqueda
- Lógica para consultar las APIs
- Visualización de resultados
- Detección de predios compartidos

### SchoolCard
Componente que muestra la información básica de una escuela en formato de tarjeta. Características:
- Diseño adaptativo para móviles y escritorio
- Visualización compacta con opción de expandir para ver más detalles
- Muestra información crítica (CUE, Distrito, Predio, FED a cargo) en el encabezado
- Información detallada disponible al expandir la tarjeta

### DetailedInfoModal
Modal que muestra información completa y detallada de un establecimiento educativo:
- Información básica y de contacto
- Datos técnicos de conectividad
- Mapa de ubicación
- Información sobre predios compartidos
- Navegación entre escuelas relacionadas

### SchoolMap
Componente que integra Google Maps para mostrar la ubicación geográfica de las escuelas.

## Flujo de Datos

1. **Fuente de Datos**: La información se obtiene de hojas de Google Sheets a través de dos APIs:
   - SheetDB (API primaria)
   - Sheet2API (API secundaria de respaldo)

2. **Procesamiento de Datos**:
   - Los datos se normalizan y procesan en el servidor
   - Se implementa un sistema de caché para mejorar el rendimiento
   - Se aplica lógica de fallback entre APIs para garantizar disponibilidad

3. **Búsqueda y Filtrado**:
   - Búsqueda por CUE, nombre de establecimiento, distrito
   - Algoritmos de coincidencia para mejorar resultados
   - Detección de relaciones entre escuelas (predios compartidos)

4. **Visualización**:
   - Presentación de resultados en formato de tarjetas
   - Información detallada disponible en modal
   - Visualización de ubicación en mapa cuando está disponible

## APIs y Endpoints

### `/api/search`
Endpoint principal para buscar establecimientos educativos.
- **Parámetros**: `query` (término de búsqueda), `filter`, `district`, `level`
- **Respuesta**: Array de escuelas que coinciden con los criterios

### `/api/schools-by-predio`
Busca escuelas que comparten un mismo predio.
- **Parámetros**: `predio` (número de predio)
- **Respuesta**: Array de escuelas con el mismo predio

### `/api/all-schools`
Retorna una versión simplificada de todas las escuelas para verificación de predios.
- **Respuesta**: Array con datos básicos de todas las escuelas

### `/api/maps`
Genera URLs para embeber mapas de Google Maps.
- **Parámetros**: `lat`, `lon`, `name`
- **Respuesta**: URLs para visualización de mapas

### `/api/status`
Proporciona información sobre el estado del sistema y las APIs.
- **Respuesta**: Estado de las APIs primaria y secundaria, estado de la caché

## Características Técnicas Destacadas

### Sistema de Resiliencia de APIs
- Implementación de múltiples fuentes de datos (SheetDB y Sheet2API)
- Detección automática de fallos y cambio entre APIs
- Sistema de cooldown para APIs con problemas
- Caché de datos para reducir dependencia de APIs externas

### Optimización para Dispositivos Móviles
- Diseño completamente responsive
- Abreviación inteligente de nombres de instituciones
- Interfaz adaptativa que prioriza información crítica
- Secciones colapsables para mejorar la navegación en pantallas pequeñas

### Detección de Predios Compartidos
- Algoritmo para identificar escuelas que comparten el mismo predio
- Visualización clara de estas relaciones
- Navegación directa entre escuelas relacionadas

### Integración con Google Maps
- Visualización de ubicaciones en mapa
- Manejo de coordenadas y validación
- Fallback para coordenadas inválidas o no disponibles

## Consideraciones de Rendimiento

- **Caché de Datos**: Implementación de caché en memoria para reducir llamadas a APIs externas
- **Carga Progresiva**: Los componentes pesados (como mapas) se cargan solo cuando son necesarios
- **Optimización de Imágenes**: Uso de Next.js Image para optimizar la carga de imágenes
- **Prevención de Caché del Navegador**: Implementación de estrategias para evitar problemas con datos obsoletos

## Mantenimiento y Actualización

### Versionado
El sistema utiliza un esquema de versionado semántico (X.Y.Z):
- **X**: Cambios mayores que afectan la arquitectura o funcionalidad principal
- **Y**: Nuevas características o mejoras significativas
- **Z**: Correcciones de errores y ajustes menores

La versión actual es 1.1.0, que refleja las mejoras en el diseño de las tarjetas de escuelas.

### Actualización de Datos
Los datos se actualizan automáticamente desde las hojas de Google Sheets. No se requiere intervención manual para reflejar cambios en la fuente de datos.

## Conclusión

El "Buscador de Establecimientos Educativos" es una herramienta robusta y eficiente diseñada para facilitar el acceso a información crítica sobre instituciones educativas. Su arquitectura técnica garantiza disponibilidad, rendimiento y una experiencia de usuario óptima tanto en dispositivos móviles como de escritorio.

La aplicación combina tecnologías modernas de frontend con estrategias avanzadas de manejo de datos para proporcionar una solución confiable y escalable para las necesidades de la Dirección de Tecnología Educativa de la Provincia de Buenos Aires.
