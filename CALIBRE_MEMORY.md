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

## 🔵 SPRINT 2: Motor de Ventas e Ingresos (En curso)
**Objetivo:** Transformar el agente de analítico a transaccional.
- [x] **Integración Gmail (MCP):** Servidor MCP con herramientas `list_emails` y `send_email`.
- [x] **Tool declaradas en Gemini:** `listEmails` y `sendEmail` disponibles para function calling.
- [ ] Implementación de `Auto-Pitch Engine` (borradores automáticos).
- [ ] Lógica de `Sponsorship Forecasting` (predicción de valor de mercado).
- [ ] Botón de contacto en Media Kit (flujo de leads).

---

## ⚪ SPRINT 3: Visualización y Dashboard (Pendiente)
**Objetivo:** Crear la interfaz para que el creador vea el trabajo del agente.
- [ ] Inicialización de React + Vite en `apps/web`.
- [ ] Dashboard de ingresos proyectados y gestión de CRM.

---

### Última Sesión Summary
- Corregidos bugs de imports en `tool-executor.ts` (import `config` no usado) y `generate-media-kit.ts` (import `RealYouTubeMetrics` con ruta incorrecta).
- Agregada declaración faltante de `listEmails` en `tools-definition.ts` para que Gemini pueda invocarla.
- Implementada herramienta `sendEmail` (MCP server + tool declaration + executor) para envío de correos.
- Actualizado system prompt de Gemini para reflejar capacidades de Gmail.
- Build limpio (`tsc` sin errores) y servidor corriendo correctamente.

### Próximo Paso Inmediato
Implementar `Auto-Pitch Engine` para borradores automáticos de correos a marcas, o comenzar con lógica de `Sponsorship Forecasting`.

---

## 🛠 CONTEXTO DE DESARROLLO (VITAL PARA CONTINUAR)
- **Rama Git Actual:** `feature/agent-memory`
- **Canal de YouTube Test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Tablas Críticas:** 
  - `agent_logs`: Almacena el historial de razonamientos e informes.
  - `brand_deals`: (Pendiente de uso real) Almacenará negociaciones.
- **Endpoints Locales:**
  - `GET /pulse`: Dispara el razonamiento del agente.
  - `GET /logs`: Muestra la memoria persistida.
- **Modelo IA:** `gemini-flash-latest` (con lógica de reintento para errores 429).
