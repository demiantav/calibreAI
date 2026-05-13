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

## ⚪ SPRINT 3: Visualización y Dashboard (Pendiente)
**Objetivo:** Crear la interfaz para que el creador vea el trabajo del agente.
- [ ] Inicialización de React + Vite en `apps/web`.
- [ ] Dashboard de ingresos proyectados y gestión de CRM.

---

### Última Sesión Summary
- **Sprint 2 completado:** Gmail MCP + Auto-Pitch Engine + Sponsorship Forecasting.
- Corregidos bugs críticos en `McpManager`:
  - Se agregó envío del mensaje `initialize` al servidor MCP (faltaba el handshake del protocolo).
  - Se corrigió el formato de `callTool`: ahora usa `method: "tools/call"` con `params.name` en vez de `method: toolName`.
  - Se agregó envío de `notifications/initialized` post-handshake.
- **Sponsorship Forecasting:** use case que calcula engagement rate como `(lastVideoViews / subscribers) * 100`, Gemini estima tarifas (mención, dedicado, serie) + CPM + contexto de mercado. Persiste en `agent_logs` (type: `sponsorship_forecast`).
- **Testing real:** Se probó OAuth Gmail exitosamente. El ciclo `/pulse` se ejecuta pero la cuota de YouTube Data API está agotada (Too Many Requests). Se necesita mock para testing sin API real.
- Ramas renombradas de `feature/agent-memory` → `feature/sprint-2-sales-engine`.

### Próximo Paso Inmediato
Implementar mock de YouTube para testing sin API real, o comenzar Dashboard (Sprint 3: React + Vite en `apps/web`).

---

## 🛠 CONTEXTO DE DESARROLLO (VITAL PARA CONTINUAR)
- **Rama Git Actual:** `feature/sprint-2-sales-engine`
- **Canal de YouTube Test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Tablas Críticas:** 
  - `agent_logs`: Almacena el historial de razonamientos e informes.
  - `brand_deals`: (Pendiente de uso real) Almacenará negociaciones.
- **Endpoints Locales:**
  - `GET /pulse`: Dispara el razonamiento del agente.
  - `GET /logs`: Muestra la memoria persistida.
- **Modelo IA:** `gemini-flash-latest` (con lógica de reintento para errores 429).
