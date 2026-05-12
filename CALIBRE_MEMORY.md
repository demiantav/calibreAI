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

## 🔵 SPRINT 1: Inteligencia Comparativa y Control (En curso)
**Objetivo:** Convertir al agente en un sistema con memoria y control manual de ejecución.
- [x] **Memoria Comparativa:** Herramienta `getPreviousInsights` para leer el pasado en Supabase.
- [x] **Function Calling Autónomo:** El agente decide qué herramientas usar.
- [x] **Retry Logic:** Manejo automático de errores 429 (Cuota de Google).
- [x] **Endpoints de Control:** Creación de `/pulse` y `/logs`.
- [ ] **Sprint Goal:** Finalizar permisos de Supabase y validar el primer informe comparativo guardado.

---

## ⚪ SPRINT 2: Visualización y Dashboard (Pendiente)
**Objetivo:** Crear la interfaz para que el creador vea el trabajo del agente.
- [ ] Inicialización de React + Vite en `apps/web`.
- [ ] Conexión de Frontend con la API del Agente.
- [ ] Diseño de la tarjeta de "Live Media Kit".
- [ ] Pantalla de historial de razonamientos.

---

## ⚪ SPRINT 3: Brand Deals & CRM (Pendiente)
**Objetivo:** Implementar la lógica comercial de acuerdos con marcas.
- [ ] Entidades y Repositorio de `Brand Deals`.
- [ ] Skill de detección de acuerdos estancados.
- [ ] Integración inicial con Gmail (MCP).

---

### Última Sesión Summary
- Se implementó la lógica de reintentos (`sendMessageWithRetry`) para errores 429 de Gemini.
- Se actualizaron `PROJECT.md` y `CALIBRE_MEMORY.md` para reflejar un modelo de desarrollo SaaS basado en Sprints fuera del entorno de hackathon.
- El agente ahora tiene un flujo de razonamiento comparativo obligatorio.

### Próximo Paso Inmediato
Validar que el `GRANT ALL` en Supabase permite al endpoint `/logs` devolver los datos sin error 42501 y observar el primer análisis comparativo real.

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
