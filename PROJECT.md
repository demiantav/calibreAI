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

## 🟢 SPRINT 2: Motor de Ventas e Ingresos (Completado)
**Objetivo:** Transformar el agente de analítico a transaccional.
- [x] Integración Gmail (MCP) para lectura/escritura de correos.
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
- Sprint 2 completado: Gmail MCP + Auto-Pitch + Sponsorship Forecasting.
- Corregido bug de inicialización en McpManager (handshake MCP faltante).
- Testing real: OAuth Gmail funcional, cuota YouTube agotada.

### Próximo Paso Inmediato
Mock de YouTube para testing sin API real, o Dashboard (Sprint 3).

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
