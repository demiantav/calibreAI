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
- [x] Memoria Comparativa, Function Calling, Retry Logic, Endpoints de control.
- [x] Permisos de base de datos validados y análisis comparativo funcional.

---

## 🔵 SPRINT 2: Motor de Ventas e Ingresos (En curso)
**Objetivo:** Transformar el agente de analítico a transaccional.
- [x] Integración Gmail (MCP) para lectura/escritura de correos.
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
- Corregidos bugs de imports en `tool-executor.ts` y `generate-media-kit.ts`.
- Agregada declaración de `listEmails` en `tools-definition.ts` y nueva herramienta `sendEmail`.
- Build TypeScript limpio y servidor validado.
- Sprint 1 marcado como completado (validación de logs OK).

### Próximo Paso Inmediato
Implementar `Auto-Pitch Engine` para borradores automáticos o `Sponsorship Forecasting`.

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
