# CALIBRE — MEMORIA DEL PROYECTO

## Visión General
Calibre es un Agente de IA autónomo para la gestión de negocio de creadores de contenido.

---
## 🟢 SPRINT 0: Cimentación e Infraestructura (Completado)
- [x] Screaming Architecture, Gemini 2.0 Flash, YouTube API, Supabase, Git Flow.

---
## 🟢 SPRINT 1: Inteligencia Comparativa y Control (Completado)
- [x] Memoria Comparativa, Function Calling, Retry Logic, Endpoints `/pulse` y `/logs`.

---
## 🟢 SPRINT 2: Motor de Ventas e Ingresos (Completado)
- [x] Gmail MCP (list_emails, send_email), Auto-Pitch Engine, Sponsorship Forecasting.

---
## 🟢 SPRINT 3: Visualización y Dashboard (Completado)
- [x] Dashboard React + Framer Motion. Dark/Light mode. Métricas reales desde YouTube.
- [x] Build: 446KB JS, 122KB CSS, 0 errores.

---
## 🔵 SPRINT 4: Draft Review Flow (En curso)

### Implementado
- Status `draft_ready` → `sent` → `responded`
- `POST /api/pitches/:id/send` — valida, envía por MCP, actualiza BD
- SendPitchModal — preview + edit + confirmación
- Badge "Draft Ready" + "Review & Send" en Pitches
- Card "Pending Pitches" en Dashboard
- Auto-pulse al iniciar servidor
- Decodificación RFC 2047 de subjects
- From header extraction (corrige `unknown@email.com`)
- Brand name desde From header
- Dedup persistente vía `processed_emails`
- Manejo no-fatal de error UPDATE

### Bugs detectados en testing
1. **"Just now"** no se actualiza — el timestamp se calcula una vez al renderizar
2. **Pulse sin feedback** — la UI no muestra que el agente está trabajando
3. **Auto-pulse regeneraba pitches** — resuelto con GRANT INSERT en processed_emails

### Pendiente
- [ ] Fix de bugs detectados
- [ ] Test de flujo completo
- [ ] Integraciones sociales (post-MVP)

---
---
## 🟡 SPRINT 5: Production Readiness & Infrastructure (Planificado)

**Objetivo:** Preparar Calibre para clientes reales.

### Límites Free Tier (Verificado 18/05/2026)

| API | Free Tier | Cuello de botella |
|---|---|---|
| Gemini Flash | 60 RPM / 1,000 RPD | 429 Rate Limit al usar varias funciones |
| YouTube Data API | 10,000 Q/día | Search endpoint cuesta 100Q por ciclo (~96 ciclos/día) |
| Gmail API | 1B Q/día | Sin límite práctico |
| Supabase | 500 MB DB / 2 GB BW | OK para pocos creadores |

### Plan de Producción

1. **Gemini:** Activar facturación → 2,000 RPM / 10,000 RPD (~$2-5/mes)
2. **YouTube:** Cache metrics en Supabase con TTL 1h + API key con cuota paga (~$1-3/mes)
3. **Rate limiter:** Cola de requests Gemini + throttle 1 pulso/5min por creator
4. **Supabase:** Pro ($25/mes) al tener >3 clientes
5. **Multi-tenant:** YouTube/Gemini keys compartidas, Gmail OAuth por creator (ya implementado)

### Pendiente Sprint 5
- [ ] Cache YouTube metrics en Supabase (TTL 1h)
- [ ] Rate limiter interno (cola Gemini, throttle pulsos)
- [ ] API keys producción en .env
- [ ] Evaluar Supabase Pro

---
### Última Sesión Summary (18/05)
- Migración de npm a pnpm con workspace configurado (`pnpm-workspace.yaml`)
- Análisis completo de límites free tier de Gemini, YouTube, Gmail y Supabase
- Sprint 5 definido con plan de migración a producción
- Se detectó que YouTube search endpoint (100Q/call) es el principal cuello de botella
- Gemini 429 manejado con retry 3x + modo degradado; sponsorship y pitch tienen fallback mock

---
## 🛠 CONTEXTO DE DESARROLLO
- **Rama:** `feature/sprint-4-draft-review`
- **Canal de YouTube Test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Tablas:** `agent_logs`, `processed_emails`, `user_auth`, `brand_deals`
- **Endpoints:** `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`, `GET /auth/login`, `GET /auth/callback`
- **Modelo IA:** `gemini-flash-latest`
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Package manager:** pnpm (workspace: raíz + apps/web)
