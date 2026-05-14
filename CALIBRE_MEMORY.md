# CALIBRE — PROYECTO DE DESARROLLO (SPRINT TRACKING)

## Visión General
Calibre es un Agente de IA autónomo para la gestión de negocio de creadores de contenido. Este documento rastrea el progreso técnico mediante Sprints.

---

## 🟢 SPRINT 0: Cimentación e Infraestructura (Completado)
**Objetivo:** Establecer la arquitectura base y la comunicación con el "cerebro".
- [x] Configuración de Screaming Architecture.
- [x] Conexión con Gemini 2.0 Flash.
- [x] Integración real con YouTube Data API v3.
- [x] Implementación de Capa de Persistencia (Supabase).
- [x] Inicialización de Git Flow.

---

## 🟢 SPRINT 1: Inteligencia Comparativa y Control (Completado)
**Objetivo:** Convertir al agente en un sistema con memoria y control manual de ejecución.
- [x] **Memoria Comparativa:** Herramienta `getPreviousInsights` para leer el pasado en Supabase.
- [x] **Function Calling Autónomo:** El agente decide qué herramientas usar.
- [x] **Retry Logic:** Manejo automático de errores 429 (Cuota de Google).
- [x] **Endpoints de Control:** Creación de `/pulse` y `/logs`.
- [x] **Sprint Goal:** Permisos de Supabase validados y primer informe comparativo funcional.

---

## 🟢 SPRINT 2: Motor de Ventas e Ingresos (Completado)
**Objetivo:** Transformar el agente de analítico a transaccional.
- [x] **Integración Gmail (MCP):** Servidor MCP con herramientas `list_emails` y `send_email`.
- [x] **Tool declaradas en Gemini:** `listEmails` y `sendEmail` disponibles para function calling.
- [x] Implementación de `Auto-Pitch Engine` (borradores automáticos).
- [x] Lógica de `Sponsorship Forecasting` (predicción de valor de mercado).
- [ ] Botón de contacto en Media Kit (flujo de leads).

---

## 🔵 SPRINT 3: Visualización y Dashboard (En curso)
**Objetivo:** Crear la interfaz para que el creador vea el trabajo del agente.
- [x] Inicialización de React + Vite en `apps/web`.
  - React 19 + React Router v7 + GSAP + CSS Modules
  - 4 páginas: Dashboard, Logs, Pitches, Sponsorship
  - Botón Pulse con animación breathing
  - Contadores animados con GSAP
  - Cards con hover sutil
  - Gráfica de sponsorship con barras animadas
- [ ] Conexión de Frontend con la API del Agente (CORS si es necesario).
- [ ] Dashboard de ingresos proyectados y gestión de CRM.

---

### Última Sesión Summary
- **Sprint 3 avanzado:** Dashboard migrado de diseño v0 Gen-Z a filosofía Stitch (Google).
  - Nueva paleta: monocromática carbón + único acento azul (#3B82F6).
  - Tipografía: Satoshi + Cabinet Grotesk (reemplaza DM Sans + Fraunces).
  - Layout: bento grid asimétrico, sidebar premium 280px, profile bar compacto.
  - Anti-patrones eliminados: gradientes, glassmorphism, sombras grandes, múltiples acentos, rounded excesivos.
  - Build: 2131 módulos, 417KB JS, 104KB CSS.
- **Pendiente:** Al usuario no le convence el diseño aún. Se retoma mañana para iterar.

### Próximo Paso Inmediato
Iterar sobre el diseño del dashboard (estilo visual, layout, componentes) hasta alcanzar un look premium que convenza.

---

## 🛠 CONTEXTO DE DESARROLLO (VITAL PARA CONTINUAR)
- **Rama Git Actual:** `feature/dashboard`
- **Canal de YouTube Test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Tablas Críticas:** 
  - `agent_logs`: Almacena el historial de razonamientos e informes.
  - `brand_deals`: (Pendiente de uso real) Almacenará negociaciones.
- **Endpoints Locales:**
  - `GET /pulse`: Dispara el razonamiento del agente.
  - `GET /logs`: Muestra la memoria persistida.
- **Modelo IA:** `gemini-flash-latest` (con lógica de reintento para errores 429).
