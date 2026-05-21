# CALIBRE — Proyecto

## Visión General
Calibre es un Agente de IA autónomo para la gestión de negocio de creadores de contenido.

---

## 🟢 Sprint 0: Cimentación e Infraestructura (Completado)
Screaming Architecture, Gemini 2.0 Flash, YouTube Data API v3, Supabase, Git Flow.

## 🟢 Sprint 1: Inteligencia Comparativa y Control (Completado)
Memoria Comparativa, Function Calling, Retry Logic, endpoints `/pulse` y `/logs`.

## 🟢 Sprint 2: Motor de Ventas e Ingresos (Completado)
Gmail MCP (list_emails, send_email), Auto-Pitch Engine, Sponsorship Forecasting.

## 🟢 Sprint 3: Visualización y Dashboard (Completado)
Dashboard React 19 + Vite + Tailwind v4 + Framer Motion. Dark/Light mode, 4 páginas, métricas reales.

---

## 🔵 Sprint 4: Draft Review Flow (Completado)
**Objetivo:** Cerrar el loop pitch → revisión → envío real con aprobación del usuario.

### Features
- Status `draft_ready` → `sent` → `responded` en `BrandDeal`
- `POST /api/pitches/:id/send` (valida, envía por MCP, actualiza BD)
- `SendPitchModal` (preview + edit + send + original email collapsible)
- Badge "Draft Ready" (amarillo) + botón "Review & Send" en Pitches
- Card "Pending Pitches" en Dashboard (fondo naranja, contador)
- Tabs (Pending / Sent / Responded) en página Pitches
- Auto-pulse al iniciar servidor (5s delay)
- RFC 2047 decoding de subjects
- From header extraction (corrige `unknown@email.com`)
- Brand name desde From header
- Dedup persistente vía `processed_emails`
- Daily Brief del agente (hero section en Dashboard con resumen AI)
- Email original visible en SendPitchModal (collapsible)
- AI Active animation con CSS keyframes (sin reinicio en re-render)
- Fallback de sponsorship sin "Gemini no disponible"

### Bugs detectados y fixeados
| Bug | Causa | Fix |
|-----|-------|-----|
| "Just now" no se actualiza | `formatDate()` se ejecuta una vez al renderizar | Hook `useRelativeTime` con setInterval cada 30s |
| Pulse sin feedback visual | Botón dispara pero UI no muestra progreso | `PulseButton` con 3 estados: idle/pulsing/success/error. Auto-clear 2s |
| Auto-pulse regeneraba pitches | Sin GRANT INSERT en `processed_emails` | `GRANT INSERT, SELECT ON processed_emails` |
| AI Active animation se reiniciaba | Framer Motion keyframes se re-crean | Reemplazado por CSS `@keyframes` nativo |
| "Gemini no disponible" en UI | Texto de fallback expuesto al usuario | Mensaje genérico amigable |
| Engagement 0.0% por Shorts | Search API devolvía Shorts como último video | Uploads Playlist + smart Shorts filtering por duración |
| Dashboard no se actualiza tras pulse | Sin polling entre Layout y Dashboard | `PulseContext` + polling hasta detectar nuevo `agent_summary` |

---

## 🔵 Sprint 5: YouTube Optimization & Engagement (Completado)
**Objetivo:** Reemplazar Search API (100u/ciclo) por Uploads Playlist (3u/ciclo). 50x más eficiente.

### Features
- YouTube metrics vía Uploads Playlist + Videos batch (3 unidades/ciclo vs 100)
- Smart Shorts detection por duración (`contentDetails.duration`, ≤ 60s)
- Algoritmo `selectBestVideo`: maduro > 24h → reciente > 1h → más visto → fallback Short
- Filtro de datos inconsistentes (views=0 + likes>0 se descartan)
- Engagement rate pre-calculado server-side (`(likes+comments)/subs*100`)
- Cache layer (`channel_metrics_cache` con TTL 1h, upsert a Supabase)
- Modo degradado: `runDegradedMode` captura métricas, insights, forecast → genera resumen narrativo → persiste `agent_summary`
- Display `<0.01%` para engagement pequeño (evita `0.00%` engañoso)
- Relative time con Temporal API (`Temporal.Instant.since()`)

---

## 🟢 Sprint 6: UX Polish (Completado)
- Pulse feedback visual (3 estados en PulseButton)
- PulseStatus state machine (`idle | pulsing | success | error`)
- Dashboard setea `success` al detectar nuevo `agent_summary`, `error` tras timeout 60s
- Relative time hook + componente `<RelativeTime>`
- Pending Pitches card cuadrada naranja oscura primera en bento grid

---

## 🟢 Sprint 7: Testing & Quality (Completado)

### Completado
- 179 tests unitarios backend (10 archivos): metrics-service, mcp-manager (37), tool-executor, pulse (12), calculate-sponsorship, generate-pitch, metrics-cache, youtube, auth-middleware
- 15 tests de integración API (supertest: /health, /logs, /pulse, /pitches, /auth)
- 38 tests frontend (6 archivos): PulseButton, pulse-context, useRelativeTime, Layout, SendPitchModal, Dashboard
- 4 tests smoke `runDegradedMode` (happy path, fallbacks, brand emails)
- Side effects eliminados (Proxy lazy pattern en config, supabase, mcp-manager)
- Dead code removido (youtube-client.ts, generate-media-kit.ts, LogEntryCard, PitchCard)
- Express refactor (app.ts + index.ts) + global error handler + rate limiting
- Docs consolidados (6 → 4 archivos md)

### Stats
- **Total tests:** 217 (179 backend + 38 frontend)
- **Test files:** 16 (10 backend + 6 frontend)
- **Build:** 0 errores, 0 warnings

---

## 🟢 Sprint 8: Frontend Testing Completion (Completado)

### Completado
- `createMockFetch` abstraction: builder pattern con `.get()`, `.post()`, secuencias, network errors, delay, assertions
- 76 tests frontend (12 archivos): PulseButton (7), pulse-context (5), useRelativeTime (8), Layout (4), SendPitchModal (6), Dashboard (8), MetricCard (7), AgentIndicator (4), Logs (8), Sponsorship (5), Pitches (8), Sidebar (6)
- Dashboard migrado a `createMockFetch` con test de secuencias para polling
- Todos los componentes principales del dashboard tienen cobertura de test
- **runPulseCheck testing** (8 tests): inyección de dependencias opcionales (`PulseCheckDeps`) con defaults. Single/multi-round, 429 fallback, retry, non-429 error, executeToolCall error, prompt verification
- Última cobertura faltante crítica cerrada

### Stats
- **Total tests:** 263 (187 backend + 76 frontend)
- **Test files:** 22 (10 backend + 12 frontend)
- **Build:** 0 errores, 0 warnings

---

## 🟢 Sprint 9: Production Hardening + Responsive MVP (Completado)

### Completado
- **Gmail API**: tokens verificados en `user_auth` para `tavolarodemian06@gmail.com`
- **Supabase cache**: `channel_metrics_cache` funciona correctamente (columna `data`)
- **Rate limiting Gemini**: `p-queue` con `concurrency: 1` + delay 1s entre requests
- **Health check real**: `GET /health` verifica Supabase, Gmail MCP, YouTube API — retorna 200/503 con checks detallados
- **Graceful shutdown**: SIGTERM/SIGINT cierran HTTP server + MCP child process
- **Responsive sidebar**: hamburger menu en mobile (`lg:hidden`), drawer con backdrop
- **Responsive layout**: `ml-0 lg:ml-[300px]`, paddings adaptativos
- **PulseButton mobile**: oculto en mobile, visible solo desktop
- **AgentIndicator real**: Layout fetchea logs y pasa counts dinámicos
- **Typography mobile**: paddings reducidos, font sizes adaptativos, flex-wrap

### Stats
- **Total tests:** 263 (187 backend + 76 frontend) — all passing
- **Test files:** 22 (10 backend + 12 frontend)
- **Build:** 0 errores, 0 warnings
- **Frontend responsive:** usable en mobile (sidebar, layout, typography)

---

## Análisis de Producción

### Free Tier Limits (Verificado 18/05/2026)
| Servicio | Free | Producción (con pago) | Costo est. mensual |
|---|---|---|---|
| **Gemini Flash** | 60 RPM / 1,000 RPD | 2,000 RPM / 10,000 RPD | ~$2-5 |
| **YouTube Data API** | 10,000 Q/día | Sin límite diario | ~$1-3 |
| **Gmail API** | 1B Q/día | 1B Q/día | $0 |
| **Supabase** | 500 MB DB / 2 GB BW | 8 GB DB / 50 GB BW (Pro) | $25 |

### Decisiones de producción
| Decisión | Detalle |
|---|---|
| Gemini → Pay-as-you-go | Activar facturación en Google AI Studio (sin cambios de código) |
| YouTube → Cache + pago | Cache implementado (TTL 1h). API key con cuota paga opcional |
| Rate limiting | Cola de requests Gemini + throttle 1 pulso/5min por creator |
| Supabase → Pro | Migrar cuando haya >3 clientes activos |
| Multi-tenant keys | YouTube/Gemini compartidas (sistema). Gmail OAuth por creator (ya listo) |

---

## Problemas Conocidos

| # | Problema | Estado |
|---|---------|--------|
| 1 | Cache `channel_metrics_cache` tiene error permission denied | Correr GRANT |
| 2 | Gmail API no habilitada en Google Cloud Console | Pendiente |
| 3 | Sin rate limiting interno (cola Gemini) | Pendiente |
| 4 | Gemini en free tier (429 frecuentes) | Mitigado con retry + degraded mode |
| 5 | YouTube API quota limit | Mitigado (3u/ciclo + cache 1h) |

---

## 🗺️ Roadmap (post-MVP)

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔴 P1 | **Production hardening** | Rate limiting, caching YouTube, paid API keys |
| 🔴 P1 | **Multi-tenant (Agency)** | Una cuenta con múltiples creadores. Switcher, Gmail tokens por creator, RLS |
| 🔴 P1 | **Auto-Pitch opcional** | Modo automático configurable por creador |
| 🔴 P1 | **Landing page** | Presencia pública en inglés para Google for Startups |
| 🟡 P2 | **Instagram / TikTok** | Métricas multi-plataforma para sponsorship |
| 🟡 P2 | **Más tests** | Cobertura frontend adicional |
| 🟢 P3 | **Pagos (Stripe)** | Free / Creator ($19) / Pro ($49) |
| 🟢 P3 | **Agency Dashboard** | Métricas agregadas, facturación, reportes |

---

## 🛠 Contexto de Desarrollo

- **Modelo IA:** `gemini-flash-latest` (con retry 3x para 429)
- **Backend:** Express + Supabase + MCP (Gmail child process)
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Package manager:** pnpm (workspace: raíz + apps/web)
- **Tablas:** `agent_logs`, `processed_emails`, `user_auth`, `brand_deals`, `channel_metrics_cache`
- **Endpoints:** `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`, `GET /auth/login`, `GET /auth/callback`
- **Auth:** Gmail OAuth2 con tokens en tabla `user_auth`
- **Paleta:** acento naranja `#EA5103`. Light: `#FFEED0` fondo / `#1A0E09` texto. Dark: `#120A06` fondo / `#FFEED0` texto
- **Layout:** Bento grid asimétrico (12 col), sidebar 260px flotante glass-card, profile bar con avatar ring animado
- **Canal test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Build:** 451KB JS (138KB gzip) / 124KB CSS (19KB gzip)
- **Fallbacks:** mock YouTube (738K subs), mock pitch (template), mock sponsorship (subs × 0.002)
