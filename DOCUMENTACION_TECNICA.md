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
  - ShadCN/UI para componentes de interfaz

- **Backend**:
  - API Routes de Next.js
  - Supabase como base de datos principal
  - Integración con Google Sheets como fuente de datos
  - Servicios de Google Maps para visualización de ubicaciones

- **Integración de Datos**:
  - Google Sheets API para importación de datos
  - Sistema de migración a Supabase
  - Sistema de caché y fallback para garantizar disponibilidad

### Estructura del Proyecto

\`\`\`
├── app/                      # Directorio principal de la aplicación Next.js
│   ├── api/                  # Endpoints de API
│   │   ├── admin/            # APIs para funciones administrativas
│   │   │   ├── login/        # API para autenticación de administradores
│   │   │   ├── migrate/      # API para migración de datos
│   │   │   ├── set-google-api-key/ # API para configurar la clave de Google Sheets
│   │   │   ├── load-sheets/  # API para cargar datos desde Google Sheets
│   │   │   ├── update-coordinates/ # API para actualizar coordenadas
│   │   │   └── verify/       # API para verificar sesiones de administrador
│   │   ├── all-schools/      # API para obtener todas las escuelas
│   │   ├── autocomplete/     # API para sugerencias de autocompletado
│   │   ├── debug/            # APIs para depuración
│   │   ├── geocode/          # API para geocodificación
│   │   ├── maps/             # APIs relacionadas con mapas
│   │   ├── schools-by-predio/# API para buscar escuelas por PREDIO
│   │   ├── search/           # API principal de búsqueda
│   │   ├── status/           # API para verificar estado del sistema
│   │   └── version/          # API para obtener versión del sistema
│   ├── admin/                # Página de administración
│   ├── debug/                # Páginas de depuración
│   ├── globals.css           # Estilos globales
│   ├── layout.tsx            # Layout principal de la aplicación
│   └── page.tsx              # Página principal
├── admin/                    # Componentes de administración
│   ├── components/           # Componentes específicos para administración
│   │   ├── AdminLogin.tsx    # Componente de inicio de sesión
│   │   ├── AdminPanel.tsx    # Panel de administración
│   │   ├── GoogleSheetsApiKeyForm.tsx # Formulario para clave de API
│   │   ├── LoadSheetsButton.tsx # Botón para cargar hojas
│   │   └── MigrationButton.tsx # Botón para migración de datos
│   └── tools/                # Herramientas administrativas
│       └── CoordinateCorrector.tsx # Corrector de coordenadas
├── components/               # Componentes React reutilizables
│   ├── ApiStatusIndicator.tsx # Indicador de estado de API
│   ├── CoordinateDebugger.tsx # Depurador de coordenadas
│   ├── DetailedInfoModal.tsx # Modal con información detallada
│   ├── Footer.tsx            # Componente de pie de página
│   ├── MapDebug.tsx          # Depurador de mapas
│   ├── SchoolCard.tsx        # Tarjeta de escuela
│   ├── SchoolMap.tsx         # Componente de mapa
│   ├── SchoolSearch.tsx      # Componente principal de búsqueda
│   ├── ScrollToTopButton.tsx # Botón para volver al inicio
│   ├── SearchForm.tsx        # Formulario de búsqueda
│   └── ui/                   # Componentes de UI reutilizables
├── lib/                      # Utilidades y funciones auxiliares
│   ├── actions.ts            # Acciones del servidor
│   ├── api-utils.ts          # Utilidades para manejo de APIs
│   ├── auth-utils.ts         # Utilidades para autenticación
│   ├── db-utils.ts           # Utilidades para base de datos
│   ├── school-utils.ts       # Utilidades específicas para escuelas
│   ├── supabase.ts           # Cliente de Supabase para frontend
│   ├── supabase-admin.ts     # Cliente de Supabase para administración
│   └── utils.ts              # Utilidades generales
├── public/                   # Archivos estáticos
│   └── images/               # Imágenes e iconos
├── scripts/                  # Scripts de utilidad
│   └── migrate-to-supabase.ts # Script de migración a Supabase
└── types/                    # Definiciones de tipos TypeScript
    └── global.d.ts           # Tipos globales
\`\`\`

## Sistema de Base de Datos

### Migración de Google Sheets a Supabase

El sistema utiliza Supabase como base de datos principal, pero mantiene la capacidad de importar datos desde Google Sheets. El proceso de migración incluye:

1. **Extracción de datos**: Se obtienen los datos de las hojas de Google Sheets utilizando la API de Google Sheets.
2. **Transformación**: Los datos se procesan y normalizan para adaptarse al esquema de Supabase.
3. **Carga**: Los datos transformados se insertan en las tablas correspondientes de Supabase.

### Estructura de la Base de Datos

La base de datos en Supabase contiene las siguientes tablas principales:

- **establecimientos**: Contiene la información básica de los establecimientos educativos.
- **conectividad**: Almacena datos sobre la conectividad de los establecimientos.
- **infraestructura**: Contiene información sobre la infraestructura tecnológica.
- **contacto**: Almacena datos de contacto de los establecimientos.

### Manejo de Errores en la Base de Datos

El sistema implementa varias estrategias para manejar errores en la base de datos:

1. **Validación de columnas**: Verifica dinámicamente las columnas disponibles en las tablas.
2. **Normalización de nombres de columnas**: Convierte nombres de columnas a formato snake_case.
3. **Verificación de duplicados**: Detecta y resuelve nombres de columnas duplicados.
4. **Manejo seguro de respuestas**: Procesa de manera segura las respuestas de las APIs.

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
- Lógica para mostrar el nombre del establecimiento de manera óptima

### DetailedInfoModal
Modal que muestra información completa y detallada de un establecimiento educativo:
- Información básica y de contacto
- Datos técnicos de conectividad
- Mapa de ubicación
- Información sobre predios compartidos
- Navegación entre escuelas relacionadas

### SchoolMap
Componente que integra Google Maps para mostrar la ubicación geográfica de las escuelas:
- Visualización de marcadores en el mapa
- Manejo de coordenadas inválidas
- Integración con la API de Google Maps

## Sistema de Administración

### Panel de Administración
El sistema incluye un panel de administración con las siguientes funcionalidades:

1. **Autenticación**: Sistema de inicio de sesión seguro para administradores.
2. **Migración de Datos**: Herramientas para migrar datos desde Google Sheets a Supabase.
3. **Configuración de API**: Formulario para configurar la clave de API de Google Sheets.
4. **Corrección de Coordenadas**: Herramienta para corregir coordenadas geográficas de los establecimientos.

### Seguridad del Panel de Administración
- Autenticación basada en claves de acceso
- Verificación de sesiones mediante tokens JWT
- Protección de rutas administrativas

## Integración con Google Sheets

### Configuración de la API
El sistema permite configurar la clave de API de Google Sheets a través del panel de administración. Esta clave se almacena de forma segura y se utiliza para acceder a los datos de las hojas de cálculo.

### Proceso de Carga de Datos
1. **Verificación de la clave de API**: Se verifica que la clave de API sea válida.
2. **Obtención de datos**: Se obtienen los datos de las hojas de cálculo.
3. **Procesamiento**: Se procesan y normalizan los datos.
4. **Inserción en Supabase**: Los datos procesados se insertan en las tablas correspondientes.

### Manejo de Errores
- Validación de respuestas de la API
- Procesamiento seguro de JSON
- Registro detallado de errores
- Reintentos automáticos en caso de fallos

## Integración con Google Maps

### Geocodificación
El sistema incluye funcionalidades para geocodificar direcciones y obtener coordenadas geográficas:
- Conversión de direcciones a coordenadas
- Validación de coordenadas
- Corrección manual de coordenadas incorrectas

### Visualización de Mapas
- Generación de URLs para embeber mapas
- Visualización de marcadores en el mapa
- Manejo de coordenadas inválidas

## Flujo de Datos

1. **Fuente de Datos**: La información se obtiene de hojas de Google Sheets y se almacena en Supabase.

2. **Procesamiento de Datos**:
   - Los datos se normalizan y procesan en el servidor
   - Se implementa un sistema de caché para mejorar el rendimiento
   - Se aplica lógica de fallback entre APIs para garantizar disponibilidad

3. **Búsqueda y Filtrado**:
   - Búsqueda por CUE, nombre de establecimiento, distrito
   - Algoritmos de coincidencia para mejorar resultados
   - Detección de relaciones entre escuelas (predios compartidos)
   - Verificación dinámica de columnas disponibles

4. **Visualización**:
   - Presentación de resultados en formato de tarjetas
   - Información detallada disponible en modal
   - Visualización de ubicación en mapa cuando está disponible

## APIs y Endpoints

### APIs de Búsqueda

#### `/api/search`
Endpoint principal para buscar establecimientos educativos.
- **Parámetros**: `query` (término de búsqueda), `filter`, `district`, `level`
- **Respuesta**: Array de escuelas que coinciden con los criterios

#### `/api/search/supabase`
Endpoint para buscar establecimientos educativos en Supabase.
- **Parámetros**: `query` (término de búsqueda), `filter`, `district`, `level`
- **Respuesta**: Array de escuelas que coinciden con los criterios

#### `/api/schools-by-predio`
Busca escuelas que comparten un mismo predio.
- **Parámetros**: `predio` (número de predio)
- **Respuesta**: Array de escuelas con el mismo predio

#### `/api/schools-by-predio/supabase`
Busca escuelas que comparten un mismo predio en Supabase.
- **Parámetros**: `predio` (número de predio)
- **Respuesta**: Array de escuelas con el mismo predio

#### `/api/all-schools`
Retorna una versión simplificada de todas las escuelas para verificación de predios.
- **Respuesta**: Array con datos básicos de todas las escuelas

### APIs de Mapas

#### `/api/maps`
Genera URLs para embeber mapas de Google Maps.
- **Parámetros**: `lat`, `lon`, `name`
- **Respuesta**: URLs para visualización de mapas

#### `/api/maps/embed-url`
Genera URLs para embeber mapas de Google Maps.
- **Parámetros**: `lat`, `lon`, `name`
- **Respuesta**: URL para embeber mapa

#### `/api/maps/coordinates`
Obtiene coordenadas para una dirección.
- **Parámetros**: `address`
- **Respuesta**: Coordenadas geográficas

#### `/api/geocode`
Geocodifica una dirección utilizando la API de Google Maps.
- **Parámetros**: `address`
- **Respuesta**: Coordenadas geográficas

### APIs de Administración

#### `/api/admin/login`
Endpoint para autenticación de administradores.
- **Parámetros**: `password`
- **Respuesta**: Token JWT

#### `/api/admin/verify`
Verifica la validez de un token JWT.
- **Parámetros**: `token`
- **Respuesta**: Estado de validez del token

#### `/api/admin/migrate`
Inicia el proceso de migración de datos desde Google Sheets a Supabase.
- **Respuesta**: Estado de la migración

#### `/api/admin/set-google-api-key`
Configura la clave de API de Google Sheets.
- **Parámetros**: `apiKey`
- **Respuesta**: Estado de la configuración

#### `/api/admin/load-sheets`
Carga datos desde Google Sheets a Supabase.
- **Respuesta**: Estado de la carga de datos

#### `/api/admin/update-coordinates`
Actualiza las coordenadas de un establecimiento.
- **Parámetros**: `id`, `lat`, `lon`
- **Respuesta**: Estado de la actualización

### APIs de Depuración

#### `/api/debug/coordinates`
Obtiene coordenadas para depuración.
- **Parámetros**: `address`
- **Respuesta**: Coordenadas geográficas

#### `/api/debug/map-coordinates`
Obtiene coordenadas para depuración de mapas.
- **Parámetros**: `address`
- **Respuesta**: Coordenadas geográficas

#### `/api/debug/database-structure`
Obtiene la estructura de la base de datos para depuración.
- **Respuesta**: Estructura de la base de datos

### Otras APIs

#### `/api/status`
Proporciona información sobre el estado del sistema y las APIs.
- **Respuesta**: Estado de las APIs primaria y secundaria, estado de la caché

#### `/api/version`
Proporciona información sobre la versión del sistema.
- **Respuesta**: Versión del sistema

#### `/api/autocomplete`
Proporciona sugerencias de autocompletado para la búsqueda.
- **Parámetros**: `query`
- **Respuesta**: Sugerencias de autocompletado

#### `/api/autocomplete/supabase`
Proporciona sugerencias de autocompletado para la búsqueda desde Supabase.
- **Parámetros**: `query`
- **Respuesta**: Sugerencias de autocompletado

## Características Técnicas Destacadas

### Sistema de Resiliencia de Datos
- Implementación de múltiples fuentes de datos (Google Sheets y Supabase)
- Detección automática de fallos y cambio entre fuentes
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
- Herramientas para corrección manual de coordenadas

### Sistema de Manejo de Errores
- Validación dinámica de columnas en la base de datos
- Procesamiento seguro de respuestas HTTP
- Normalización de nombres de columnas
- Detección y resolución de duplicados
- Registro detallado de errores

## Consideraciones de Rendimiento

- **Caché de Datos**: Implementación de caché en memoria para reducir llamadas a APIs externas
- **Carga Progresiva**: Los componentes pesados (como mapas) se cargan solo cuando son necesarios
- **Optimización de Imágenes**: Uso de Next.js Image para optimizar la carga de imágenes
- **Prevención de Caché del Navegador**: Implementación de estrategias para evitar problemas con datos obsoletos
- **Consultas Optimizadas**: Uso de índices y consultas optimizadas en Supabase

## Mantenimiento y Actualización

### Versionado
El sistema utiliza un esquema de versionado semántico (X.Y.Z):
- **X**: Cambios mayores que afectan la arquitectura o funcionalidad principal
- **Y**: Nuevas características o mejoras significativas
- **Z**: Correcciones de errores y ajustes menores

La versión actual es 1.2.0, que refleja la integración con Supabase y las mejoras en el panel de administración.

### Actualización de Datos
Los datos se pueden actualizar de dos formas:
1. **Automáticamente**: A través de la integración con Google Sheets
2. **Manualmente**: A través del panel de administración

## Seguridad

### Autenticación de Administradores
- Sistema de autenticación basado en claves de acceso
- Generación y verificación de tokens JWT
- Protección de rutas administrativas

### Protección de Datos
- Uso de variables de entorno para almacenar claves sensibles
- Validación de entradas para prevenir inyecciones SQL
- Manejo seguro de respuestas HTTP

## Conclusión

El "Buscador de Establecimientos Educativos" es una herramienta robusta y eficiente diseñada para facilitar el acceso a información crítica sobre instituciones educativas. Su arquitectura técnica garantiza disponibilidad, rendimiento y una experiencia de usuario óptima tanto en dispositivos móviles como de escritorio.

La aplicación combina tecnologías modernas de frontend con estrategias avanzadas de manejo de datos para proporcionar una solución confiable y escalable para las necesidades de la Dirección de Tecnología Educativa de la Provincia de Buenos Aires.

La integración con Supabase como base de datos principal y las herramientas de administración proporcionan una solución completa y sostenible para la gestión de datos educativos.
