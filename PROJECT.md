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

## 🟢 Sprint 9.5: Premium Visual Pass — "Creator Studio" (Completado)

### Completado
- **Dashboard rediseñado**: de "panel de métricas SaaS" a "estudio digital del creador"
- **Hero Section prominente**: nombre del creador en `text-7xl`, avatar grande (`w-28`) con anillo orgánico SVG animado + glow orb, engagement rate como métrica hero (`text-8xl`, naranja acento)
- **Growth Chart**: componente SVG puro con área bajo la curva, gradiente naranja, puntos interactivos con tooltip hover — estilo Mathical
- **Daily Brief editorial**: texto grande (`text-2xl-3xl`) sin card container, lectura tipo artículo/reporte
- **Rates como barras horizontales**: `RateBar` con gradiente animado de ancho, labels editoriales, comparativa con market avg
- **Timeline vertical elegante**: línea conectora, iconos coloreados por tipo, fechas relativas, hover expand
- **Layout asimétrico**: 7-col + 5-col grid, pending pitches como card naranja prominente
- **Eliminado bento grid genérico**: reemplazado por secciones diferenciadas con tratamientos visuales propios
- **Dark theme profundo**: `--bg: #030305`, `--surface: rgba(255,255,255,0.02)`, glassmorphism real con `blur(40px)`
- **Contraste tipográfico radical**: `--text: #F0F0F5` (blanco frío), `--text-secondary: #A0A0B0`, `--text-tertiary: #5A5A70`
- **Acento secundario frío**: cyan `#22D3EE` para badges secundarios y gradientes (contraste con naranja `#FF6B2C`)
- **Ambient glow orbs**: 4 gradientes radiales en `body` (naranja + cyan + púrpura)
- **Glow/bloom real**: `.neon-glow` duplica intensidad en dark; `.glow-border` genera borde luminoso animado en cards
- **CountUp animation**: hook `useCountUp` — números animan de 0 al valor (1800ms)
- **PulseButton transform**: gradiente cónico rotatorio según estado, glow pulsante, anillo orgánico SVG, 3 ripple rings en pulsing, sparkles rotando en idle, label "Pulse" en idle
- **Tipografía jerárquica**: labels `uppercase tracking-[0.15em] font-semibold`, números `tabular-nums`, body `font-normal`
- **Responsive rates**: `RateBar` adaptativo, `GrowthChart` con `viewBox` fluido

### Stats
- **Total tests:** 263 (187 backend + 76 frontend) — all passing
- **Test files:** 22 (10 backend + 12 frontend)
- **Build:** 0 errores, 0 warnings
- **Bundle:** ~618KB JS (188KB gzip) / ~134KB CSS (21KB gzip)

---

## 🟢 Sprint 10: Multi-tenant Auth + Onboarding (Completado)

### Objetivo
Hacer que Calibre soporte múltiples usuarios reales con sus propios canales de YouTube y cuentas de Gmail. Eliminar el hardcodeo a un único usuario.

### Backend
- **Nueva tabla `users`**: reemplaza `user_auth` legacy. Campos: `email`, `password_hash`, `youtube_channel_id`, `youtube_channel_url`, `gmail_access_token`, `auto_pitch_enabled`, `onboarding_completed`, `onboarding_step`
- **Tabla `oauth_sessions`**: state temporal para OAuth Gmail con TTL 10min
- **JWT Auth**: `bcryptjs` + `jsonwebtoken`. Endpoints: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/youtube`, `GET /auth/gmail/start`
- **Auth middleware**: `jwtAuthMiddleware` reemplaza `x-api-key`. `declare global` para `req.user` en Express
- **Data isolation**: `user_id` agregado a `agent_logs`, `media_kit_update`, `processed_emails`, `channel_metrics_cache`. Todas las queries filtran por `user_id`
- **`pulse.ts` refactor**: `runPulseCheck(userId, channelId)` y `runDegradedMode(userId, channelId)` — reciben usuario y canal como parámetros
- **`tool-executor.ts` refactor**: `executeToolCall(call, userId?)` pasa `_userId` en args. Funciones que persisten usan `user_id`
- **`gmail-auth.ts` refactor**: `ensureGmailAuth(userId?)` busca tokens en tabla `users` por `userId`
- **`/auth/callback` refactor**: usa `oauth_sessions` para lookup de `userId`, guarda tokens en `users`, redirige a `/onboarding?step=3`
- **Custom errors**: `AppError`, `UnauthorizedError`, `ValidationError`, `ConflictError` en `src/shared/errors.ts`
- **Repository pattern**: `UserRepository` abstrae queries de Supabase
- **SPA catch-all**: Express sirve `index.html` para rutas no-API (fix producción Express v5)

### Frontend
- **AuthContext**: JWT en localStorage, `login/register/logout/refreshUser`. Auto-fetch `/auth/me` al montar
- **ProtectedRoute**: redirige a `/login` si no autenticado, a `/onboarding` si onboarding incompleto
- **LoginPage / RegisterPage**: forms con validación básica, error banners
- **api-config.ts**: `Authorization: Bearer <token>` reemplaza `x-api-key`
- **OnboardingPage**: progress bar de 3 steps — ConnectYouTube → ConnectGmail → FirstPulse
- **ConnectYouTube step**: input URL → validación backend con YouTube API → preview nombre + subs → confirmar
- **ConnectGmail step**: botón OAuth → estado de conexión → "Ya conecté" para reanudar
- **FirstPulse step**: botón "Analizar" → polling de logs → redirect a Dashboard
- **Sidebar**: muestra email del usuario + botón Logout
- **App.tsx**: rutas `/login`, `/register`, `/onboarding` con AuthProvider envolviendo todo

### Migraciones
- `001_sprint10_multitenant.sql`: tablas `users`, `oauth_sessions`, columnas `user_id`
- `002_fix_rls_permissions.sql` + `003_grant_service_role.sql` + `004_grant_all_permissions.sql`: fixes de permisos Supabase

### Fixes durante testeo
- **YouTube URL format**: `extractChannelId` detecta handles (`@VictorAbarca`) vs channel IDs (`UC...`). La API usa `forHandle` o `id` según el tipo
- **Supabase permissions**: múltiples migraciones para evitar "permission denied for table users"
- **OAuth redirect**: `/auth/callback` redirige a `FRONTEND_URL` (env var) en vez de path relativo
- **Onboarding sequence guard**: `OnboardingPage` impide saltear steps. `FirstPulse` redirige si no hay `youtube_channel_id`
- **Dev skip Gmail**: Botón "Saltar Gmail (solo para testear)" en `ConnectGmail` (visible solo en `import.meta.env.DEV`)

### Known Issues
- **Gmail OAuth**: Google requiere que el usuario sea "test user" aprobado en Google Cloud Console mientras la app está en "Testing" mode. Para producción, hay que pasar a "Production" mode (requiere verificación de dominio)
- **Integration tests**: 22 tests legacy skipped — requieren refactor para nuevo flujo JWT + mock de `oauth_sessions`

### Stats
- **Tests backend:** 164/164 unit tests passing, 22 integration tests skipped (legacy)
- **Tests frontend:** 76/76 passing
- **TypeScript:** 0 errores backend + frontend
- **Build backend:** 0 errores
- **Build frontend:** 0 errores, JS bundle ~637KB (+18KB auth), CSS ~135KB (+2KB)

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
|---|---|---------|
| 1 | Cache `channel_metrics_cache` | Resuelto — permissions corregidos, funciona correctamente |
| 2 | Gmail API | Resuelto — OAuth por usuario vía tabla `users`. Requiere "test user" aprobado en Google Cloud Console mientras app está en Testing mode |
| 3 | Rate limiting interno (cola Gemini) | Resuelto — `p-queue` con `concurrency: 1` + delay 1s |
| 4 | Gemini en free tier (429 frecuentes) | Mitigado con retry + degraded mode |
| 5 | YouTube API quota limit | Mitigado (3u/ciclo + cache 1h) |
| 6 | Gmail token expired (`invalid_grant`) | **Resuelto** — tokens ahora se guardan por usuario en tabla `users`. Re-autorización vía onboarding OAuth |
| 7 | Integration tests legacy | **Pendiente** — 22 tests skipped, requieren refactor para flujo JWT + mock de `oauth_sessions` |
| 8 | Google OAuth production mode | **Pendiente** — para producción pública requiere pasar a "Production" mode (verificación de dominio) |

---

## 🗺️ Roadmap (post-MVP)

| Prioridad | Feature | Descripción |
|---|---|---|
| 🟢 | **Production hardening** | Completado: rate limiting, caching YouTube, health checks, graceful shutdown |
| 🟢 | **Multi-tenant Auth + Onboarding** | Completado: JWT auth, data isolation, onboarding 3 steps |
| 🔴 P1 | **Landing page** | Presencia pública en inglés para Google for Startups |
| 🔴 P1 | **Auto-Pitch opcional** | ✅ Completado: Toggle en Sidebar + backend `PATCH /auth/me` + respeto en `pulse.ts` |
| 🔴 P1 | **Multi-tenant (Agency)** | Una cuenta con múltiples creadores. Switcher, Gmail tokens por creator, RLS |
| 🟡 P2 | **Email digest diario** | Scheduler `node-cron` + servicio de digest + HTML template |
| 🟡 P2 | **Integration tests JWT** | Re-escribir 22 tests legacy para nuevo flujo auth |
| 🟡 P2 | **Instagram / TikTok** | Métricas multi-plataforma para sponsorship |
| 🟢 P3 | **Pagos (Stripe)** | Free / Creator ($19) / Pro ($49) |
| 🟢 P3 | **Agency Dashboard** | Métricas agregadas, facturación, reportes |

---

## 🟢 Sprint 11a: Auto-Pitch Toggle (Completado)

### Objetivo
Dar al creador control sobre si Calibre genera borradores de respuesta automáticamente cuando detecta emails de marcas.

### Backend
- **Endpoint `PATCH /auth/me`**: Zod validation (`auto_pitch_enabled: boolean`), actualiza tabla `users`, retorna usuario actualizado
- **`runPulseCheck`**: `autoPitchEnabled` agregado a `PulseCheckDeps`. Prompt dinámico: incluye paso 5 (listEmails + generateAndDraftPitch) solo si `autoPitchEnabled=true`
- **`runDegradedMode`**: Tercer parámetro `autoPitchEnabled = false`. Si `false`, saltea completamente el bloque de emails/pitches. Métricas, forecast, summary siguen corriendo
- **Auto-pulse fix**: `index.ts` itera usuarios con `auto_pitch_enabled=true` + `youtube_channel_id IS NOT NULL`. Stagger de 2s entre usuarios

### Frontend
- **AuthContext `updateUser`**: Update optimista (`setUser` inmediato) + rollback vía `fetchUser()` en error
- **Componente `Switch`**: `toggle-switch.tsx` — `<button role="switch">`, estados naranja/gris, focus-visible outline, `prefers-reduced-motion` friendly
- **Sidebar toggle**: Debajo del profile card. Label "Auto-pitch" + descripción pequeña "Generar borradores automáticamente". Icono `Zap`. Touch target completo ≥ 44px vía padding del contenedor
- **Onboarding fix**: `FirstPulse` ahora marca `onboarding_completed=true` vía `updateUser` tras análisis exitoso, timeout o skip

### Tests
- **Backend**: 4 tests `PATCH /auth/me` (success, 401, 400, 404), 2 tests `runDegradedMode` (pitches cuando true, skip cuando false), 2 tests `runPulseCheck` (prompt con/sin instrucciones de pitch)
- **Frontend**: 2 tests Sidebar toggle (render + accesibilidad ARIA)

### Stats
- **Tests backend:** 171 passing, 22 skipped
- **Tests frontend:** 78/78 passing
- **TypeScript:** 0 errores
- **Build backend:** 0 errores
- **Build frontend:** 0 errores, JS bundle 639KB (+2KB toggle), CSS 135KB (stable)

---

## 🛠 Contexto de Desarrollo

- **Modelo IA:** `gemini-flash-latest` (con retry 3x para 429)
- **Backend:** Express + Supabase + MCP (Gmail child process)
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Package manager:** pnpm (workspace: raíz + apps/web)
- **Tablas:** `users` (reemplaza `user_auth`), `oauth_sessions`, `agent_logs`, `processed_emails`, `brand_deals`, `channel_metrics_cache`
- **Endpoints:**
  - Public: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/youtube`, `GET /auth/gmail/start`, `GET /auth/callback`
  - Protected: `PATCH /auth/me`, `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`
  - System: `GET /health`
- **Auth:** JWT (`jsonwebtoken` + `bcryptjs`) con `Authorization: Bearer <token>`. Gmail OAuth2 por usuario, tokens en tabla `users`
- **Paleta:** acento naranja `#FF6B2C` (antes `#EA5103`). Acento secundario frío: cyan `#22D3EE`. Dark: `#030305` fondo / `#F0F0F5` texto / `#A0A0B0` secundario / `#5A5A70` terciario. Light: `#FFEED0` fondo / `#1A0E09` texto
- **Layout:** Dashboard asimétrico (7-col + 5-col), secciones diferenciadas (hero, growth chart, rates bars, timeline), sidebar 260px flotante glass-card, profile bar con avatar ring orgánico SVG animado
- **Componentes nuevos:** `Switch` (toggle-switch.tsx, accesible), auto-pitch toggle en Sidebar
- **Canal test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Build backend:** 0 errores TypeScript
- **Build frontend:** ~639KB JS (+20KB auth + toggle) / ~135KB CSS (+2KB)
- **Tests:** 171 backend unit passing + 22 integration skipped (legacy) + 78 frontend passing. Total: 249/271 effective
- **Fallbacks:** mock YouTube (738K subs), mock pitch (template), mock sponsorship (subs × 0.002)
