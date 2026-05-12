## Project: Calibre — AI Agent for Content Creators
## Hackathon: Google for Startups AI Agent Challenge — Track 1: Build
## Deadline: June 5th, 2026

### Tech Stack (summary)
- **Runtime:** Node.js + TypeScript
- **AI Core:** Gemini 1.5 Flash (Google AI SDK)
- **Framework:** Google ADK + Model Context Protocol (MCP) concepts
- **Database:** Supabase (PostgreSQL)
- **APIs:** YouTube Data API v3
- **Infrastructure:** Git Flow Architecture

### Architecture Pattern
Screaming Architecture — domain-driven folder structure:
- brand-deals
- content-pipeline
- media-kit
- creator-profile
- agent-core (Autonomous Heartbeat)

### Current Status
- [x] Project structure designed and created
- [x] Dependencies and Environment configured
- [x] Agent core initialized with Gemini 1.5 Flash
- [x] Autonomous reasoning loop (Function Calling) implemented
- [x] YouTube Data API v3 real integration
- [x] Supabase (Database) persistence layer implemented
- [x] Agent Memory (Comparative Insights) working
- [x] Git Flow initialized (Branch: `feature/agent-memory`)
- [ ] Frontend Dashboard (React + Vite)
- [ ] Brand Deals domain logic

### Last Session Summary
- Se implementó la **Memoria Comparativa**: El agente ahora usa la herramienta `getPreviousInsights` para leer estados anteriores en Supabase antes de razonar sobre el presente.
- Se migró el motor de ejecución a un **modelo 100% autónomo**: Gemini decide qué herramientas llamar (YouTube -> Memoria -> Update Media Kit).
- Se crearon endpoints de control (`/pulse` para disparar el agente y `/logs` para ver la base de datos).
- Se inicializó el repositorio Git con la arquitectura **Git Flow**, trabajando actualmente en `feature/agent-memory`.
- Se resolvieron problemas críticos de conexión con la API de YouTube y de formato de URL con Supabase.

### Next Step
1. Ejecutar los comandos `GRANT` en Supabase para finalizar los permisos de lectura.
2. Iniciar la implementación del Frontend en React dentro de `apps/web` (Rama: `feature/frontend-init`).

### Pending Decisions
- Definir si el agente debe enviar una notificación (vía WhatsApp o Email) cuando detecte un cambio de tendencia importante.

### Known Issues
- Error de permisos `42501` en Supabase al consultar `/logs` (Pendiente ejecutar comandos SQL de GRANT).
