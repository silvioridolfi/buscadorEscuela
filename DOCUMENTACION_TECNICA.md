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
  - Supabase como base de datos principal
  - Servicios de Google Maps para visualización de ubicaciones

- **Integración de Datos**:
  - Supabase (fuente principal de datos)

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
│   ├── api-utils.ts          # Utilidades para manejo de APIs
│   ├── legacy-api-utils.ts   # Funciones histórica conservadas como respaldo
│   ├── supabase.ts           # Cliente y tipos para Supabase
│   ├── db-utils.ts           # Utilidades para acceso a base de datos
│   └── school-utils.ts       # Utilidades específicas para escuelas
├── public/                   # Archivos estáticos
│   └── images/               # Imágenes e iconos
├── admin/                    # Componentes y herramientas administrativas
│   ├── components/           # Componentes para el panel de administración
│   └── tools/                # Herramientas administrativas
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

1. **Fuente de Datos**: 
   - Supabase (fuente principal y única)

2. **Procesamiento de Datos**:
   - Los datos se normalizan y procesan en el servidor
   - Se aplica la lógica de búsqueda y filtrado directamente en las consultas a Supabase

3. **Búsqueda y Filtrado**:
   - Búsqueda por CUE, nombre de establecimiento, distrito
   - Algoritmos avanzados de coincidencia para mejorar resultados
   - Detección de relaciones entre escuelas (predios compartidos)
   - Estrategias específicas para tipos de escuela + número (ej: "jardín 938")

4. **Visualización**:
   - Presentación de resultados en formato de tarjetas
   - Información detallada disponible en modal
   - Visualización de ubicación en mapa cuando está disponible

## APIs y Endpoints

### `/api/search/supabase`
Endpoint principal para buscar establecimientos educativos usando Supabase.
- **Parámetros**: `query` (término de búsqueda), `filter`, `district`, `level`
- **Respuesta**: Array de escuelas que coinciden con los criterios
- **Características especiales**: 
  - Manejo avanzado de búsquedas tipo+número (ej: "jardín 938")
  - Normalización de acentos y caracteres especiales
  - Estrategias de búsqueda en dos fases para mayor precisión
  - Enfoque flexible como respaldo cuando no hay coincidencias exactas

### `/api/schools-by-predio/supabase`
Busca escuelas que comparten un mismo predio usando Supabase.
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
Proporciona información sobre el estado del sistema y la conexión con Supabase.
- **Respuesta**: Estado de la API de Supabase y metadatos del sistema

## Características Técnicas Destacadas

### Simplificación de la Arquitectura
- Eliminación de las APIs secundarias (SheetDB y Sheet2API)
- Consolidación en una única fuente de datos (Supabase)
- Mantenimiento de funciones históricas para referencia y plan de contingencia

### Algoritmo Avanzado de Búsqueda
- Búsqueda en dos fases para mayor precisión
- Manejo específico para tipos de escuela + número (ej: "jardín 938")
- Normalización de texto para manejar acentos y variaciones
- Estrategias de respaldo para asegurar resultados relevantes
- Filtrado post-consulta para refinar resultados

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

- **Consultas Optimizadas**: Uso eficiente de consultas SQL en Supabase para mejorar el tiempo de respuesta
- **Carga Progresiva**: Los componentes pesados (como mapas) se cargan solo cuando son necesarios
- **Optimización de Imágenes**: Uso de Next.js Image para optimizar la carga de imágenes
- **Prevención de Caché del Navegador**: Implementación de estrategias para evitar problemas con datos obsoletos

## Mantenimiento y Actualización

### Versionado
El sistema utiliza un esquema de versionado semántico (X.Y.Z):
- **X**: Cambios mayores que afectan la arquitectura o funcionalidad principal
- **Y**: Nuevas características o mejoras significativas
- **Z**: Correcciones de errores y ajustes menores

La versión actual es 2.2.0, que refleja la consolidación a Supabase como única fuente de datos.

### Actualización de Datos
Los datos se actualizan mediante el panel de administración que permite ejecutar migraciones manuales a la base de datos Supabase.

## Plan de Contingencia

A pesar de que ahora utilizamos Supabase como única fuente de datos, mantenemos un plan de contingencia:

1. El archivo `legacy-api-utils.ts` contiene todas las funciones necesarias para reconectar con las antiguas APIs (SheetDB y Sheet2API) si fuera necesario.
2. Las modificaciones realizadas permitirían una reactivación rápida del sistema de múltiples APIs si surgieran problemas con Supabase.
3. La documentación y el código comentado facilitan la comprensión del sistema antiguo para futuros desarrolladores.

## Algoritmo de Búsqueda

El sistema implementa un algoritmo de búsqueda avanzado en dos fases:

### Fase 1: Consulta SQL
- Detección de patrones tipo+número (ej: "jardín 938")
- Manejo específico para tipos de escuela comunes (jardines, primarias, etc.)
- Normalización de texto para manejar acentos y variaciones
- Construcción de consultas SQL optimizadas según el tipo de búsqueda

### Fase 2: Filtrado Post-Consulta
- Verificación detallada de patrones en los nombres de escuelas
- Manejo de variaciones en la forma de escribir números (n°, nro, etc.)
- Estrategias específicas para jardines y otros tipos de escuela
- Enfoque flexible como respaldo cuando no hay coincidencias exactas

### Estrategias de Respaldo
- Si el filtrado estricto no encuentra resultados, se aplica un enfoque más flexible
- Para búsquedas numéricas, se priorizan escuelas donde el número es parte del identificador
- Registro detallado para facilitar la depuración y mejora continua

## Panel de Administración

El sistema incluye un panel de administración con las siguientes funcionalidades:

- **Migración de Datos**: Herramienta para sincronizar datos con Supabase
- **Corrección de Coordenadas**: Interfaz para actualizar coordenadas geográficas de escuelas
- **Autenticación**: Sistema de autenticación basado en tokens para proteger el acceso

## Conclusión

El "Buscador de Establecimientos Educativos" es una herramienta robusta y eficiente diseñada para facilitar el acceso a información crítica sobre instituciones educativas. Su arquitectura técnica ha sido simplificada para mejorar la mantenibilidad y rendimiento, consolidando todas las fuentes de datos en Supabase mientras se mantiene un plan de contingencia detallado.

La aplicación combina tecnologías modernas de frontend con estrategias avanzadas de manejo de datos para proporcionar una solución confiable y escalable para las necesidades de la Dirección de Tecnología Educativa de la Provincia de Buenos Aires.
