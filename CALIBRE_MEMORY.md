## Project: Calibre — AI Agent for Content Creators
## Hackathon: Google for Startups AI Agent Challenge — Track 1: Build
## Deadline: June 5th, 2026

### Tech Stack (summary)
- **Runtime:** Node.js + TypeScript
- **AI Core:** Gemini 1.5 Pro (Google AI SDK)
- **Framework:** Google ADK + MCP (Model Context Protocol)
- **Database:** Supabase (PostgreSQL)
- **APIs:** YouTube Data API v3, Gmail API, Google Calendar API
- **Infrastructure:** Google Cloud Run
- **Frontend:** React + Vite + TypeScript

### Architecture Pattern
Screaming Architecture — domain-driven folder structure organized by business capabilities:
- brand-deals
- content-pipeline
- media-kit
- creator-profile
- agent-core (The Heartbeat)

### Current Status
- [x] Project structure designed
- [x] Project structure created
- [x] Dependencies installed
- [x] Environment variables configured
- [x] Agent core initialized
- [x] First heartbeat loop working (Pulse Check)
- [x] YouTube API integrated
- [x] Supabase (Database) integrated
- [x] Autonomous reasoning loop (Function Calling) implemented
- [ ] Brand Deals domain implemented
- [ ] Content Pipeline domain implemented
- [ ] Media Kit domain implemented
- [ ] Frontend demo connected

### Last Session Summary
- Se implementó la persistencia real en **Supabase** (tabla `agent_logs`).
- Se migró de un flujo imperativo a un **flujo autónomo mediante Function Calling**.
- El agente ahora decide por sí mismo cuándo consultar YouTube y cuándo actualizar el Media Kit.
- Se refactorizó el servidor para incluir endpoints de control (`/pulse`, `/logs`) y evitar bloqueos por cuota de API.
- Se corrigieron problemas de rutas y tipos en las definiciones de herramientas para Gemini.

### Next Step
Inicializar Git con arquitectura Git Flow y comenzar la implementación del Frontend (React + Vite) en la carpeta `apps/web`.

### Pending Decisions
- Definir el esquema de la tabla de "Media Kits" finales para que el Frontend pueda consultar la versión más reciente por URL pública.
- Finalizar el prompt de sistema para que el Media Kit tenga un tono de venta de marca.

### Pending Decisions
- Evaluar si persistiremos los informes en Supabase inmediatamente o después de definir el dominio de Media Kit.
- Finalizar el prompt de sistema para que el Media Kit tenga un tono de venta de marca.

### Pending Decisions
- Decide on the specific MCP server implementation for Gmail (Standard Google MCP vs. custom wrapper).
- Finalize the Supabase schema for "Reasoning Memory".

### Known Issues
- None (Project Initialization phase).
