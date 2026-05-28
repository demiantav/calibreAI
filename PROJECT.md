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
- Algoritmo `selectBestVideo`: maduro > 24h → más reciente no-Short → fallback Short más reciente
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
| 9 | Supabase visibility gap | **Pendiente (workaroundado)** — `agent_logs` insertado con `error: null` no aparece en `SELECT` inmediato del mismo endpoint (mismo `user_id`, service role). Root cause desconocido. Workaround: onboarding ya no depende de polling en tiempo real |
| 10 | Scalability (>5 usuarios) | **Pendiente** — arquitectura actual no escala: Gemini 500 RPD, sin job queue, auto-pulse en startup simultáneo para todos |

---

## 🗺️ Roadmap (post-MVP)

| Prioridad | Feature | Estado | Descripción |
|---|---|---|---|
| 🟢 | **Production hardening** | ✅ Completado | Rate limiting, caching YouTube, health checks, graceful shutdown |
| 🟢 | **Multi-tenant Auth + Onboarding** | ✅ Completado | JWT auth, data isolation, onboarding 3 steps end-to-end |
| 🟢 | **Auto-Pitch opcional** | ✅ Completado | Toggle en Sidebar + backend `PATCH /auth/me` + respeto en `pulse.ts` |
| 🟢 | **Email digest diario** | ✅ Completado | Scheduler `node-cron` + servicio de digest + HTML template responsive |
| 🟢 | **Acción sugerida (SuggestedAction)** | ✅ Completado | Componente post-Daily Brief con acciones concretas (pitches pendientes, engagement bajo, recordatorio) |
| 🟢 | **Audience Intelligence** | ✅ Completado | Análisis de comentarios YouTube: sentimiento, temas, preguntas frecuentes |
| 🟢 | **Contract Auditor** | ✅ Completado | Upload de PDF + análisis Gemini con fallback regex + historial |
| 🔴 P1 | **Landing page** | ❌ No iniciado | Presencia pública en inglés para Google for Startups |
| 🔴 P1 | **Pipeline visual de deals** | ❌ No iniciado | Vista kanban de `draft_ready → sent → responded`. Core del valor para creadores serios |
| 🔴 P1 | **Multi-tenant (Agency)** | ❌ No iniciado | Una cuenta con múltiples creadores. Switcher, Gmail tokens por creator, RLS |
| 🟡 P2 | **Integration tests JWT** | 🟡 Parcial | Re-escribir 22 tests legacy para nuevo flujo auth |
| 🟡 P2 | **Benchmarks reales de sponsorship** | ❌ No iniciado | Datos por nicho/región para que el forecast sea referencia de mercado, no estimación |
| 🟡 P2 | **Historial de conversaciones por deal** | ❌ No iniciado | Hilo completo de negociación (emails de ida y vuelta) |
| 🟡 P2 | **Instagram / TikTok** | ❌ No iniciado | Métricas multi-plataforma para sponsorship |
| 🟡 P2 | **Job queue / scalability** | ❌ No iniciado | BullMQ/pgboss + rate limiting per user + staggered startup + worker separado |
| 🟢 P3 | **Pagos (Stripe)** | ❌ No iniciado | Free / Creator ($19) / Pro ($49) |
| 🟢 P3 | **Agency Dashboard** | ❌ No iniciado | Métricas agregadas, facturación, reportes |
| 🟢 P3 | **Timezone configurable** | ❌ No iniciado | Digest ajustado a timezone del usuario (ahora fijo a Europe/Rome) |

---

## 🟢 Sprint 11b: Onboarding Bug Fixes + Auth Flow Verified (Completado)

### Bug Fixes
- **Zod `updateMeSchema`**: agregados `onboarding_completed: z.boolean()` y `onboarding_step: z.number()` al schema de `PATCH /auth/me`. Antes solo aceptaba `auto_pitch_enabled` → `updateUser({ onboarding_completed: true })` era silenciosamente ignorado por Zod → `ProtectedRoute` redirigía a onboarding en loop infinito tras cada recarga.
- **api-config Content-Type fix**: `getApiHeaders()` enviaba `Content-Type: application/json` en GET requests → causaba 404 en el navegador (CORS preflight innecesario). Ahora `getAuthHeaders()` (solo `Authorization`) para GET/DELETE y `getJsonHeaders()` (agrega `Content-Type`) para POST/PATCH/PUT. `useApiFetch` elige automáticamente según método HTTP.
- **FirstPulse simplificado**: eliminado el polling frágil de 2 minutos que esperaba `agent_summary` en `/logs?type=agent_summary`. El insert en Supabase (`error: null`) no era visible en el `SELECT` posterior del mismo endpoint (mismo `user_id`, misma conexión service role). Ahora el onboarding se completa inmediatamente tras `/pulse` 200. El análisis corre en background y las métricas se cargan vía el polling existente del Dashboard.

### Auth Flow Verificado (end-to-end)
- Register → Login → JWT emitido (`expiresIn: 7d`) → Onboarding 3-step (YouTube → Gmail → FirstPulse) → Dashboard: flujo completo probado con usuario real.
- `jwtAuthMiddleware` protege `/pulse`, `/logs`, `/api/*` correctamente. `ProtectedRoute` redirige a `/login` si no autenticado, a `/onboarding?step=X` si `onboarding_completed: false`.
- `updateUser` optimistic + rollback validado: el update optimista permite navegar al Dashboard inmediatamente sin esperar la respuesta del server. Si el server falla, `fetchUser()` restaura el estado real.

### Stats
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS 639KB, CSS 135KB
- **Tests backend:** 171 passing, 22 skipped
- **Tests frontend:** 78/78 passing

---

## 🟢 Sprint 11c: Auth Headers Fixes (Completado)

### Bug Fixes
- **`pulse-context.tsx` 401 fix**: `triggerPulse` hacía `fetch` a `/pulse` sin headers de autenticación (URL hardcodeada a `localhost:8080` sin `Authorization`). El backend retornaba 401 silenciosamente gracias a `.catch(() => {})` → el botón Pulse parecía funcionar pero el servidor nunca recibía el request real.
- **`Dashboard.tsx` 401 fix**: El polling del Dashboard hacía `fetch` a `/logs` sin headers de autenticación. Retornaba 401 cada 3 segundos → nunca detectaba el `agent_summary` nuevo → safety timeout a los 60s disparaba `error` (X roja) aunque el backend había terminado exitosamente.
- **Eliminado hardcodeo de `localhost:8080`**: `pulse-context.tsx` y `Dashboard.tsx` ahora usan `API_BASE_URL` desde `api-config.ts`.

### Stats
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS 640KB, CSS 135KB
- **Tests backend:** 171 passing, 22 skipped
- **Tests frontend:** 78/78 passing

---

## 🟢 Sprint 12: Email Digest Daily (Completado)

### Features
- **`node-cron` scheduler**: corre todos los días a las 8:00 AM (`Europe/Rome`). Itera usuarios con `email_digest_enabled=true` + `youtube_channel_id IS NOT NULL`. Stagger 5s entre usuarios.
- **`DigestService`**: `generateAndSendDigest(user)` → dispara `runPulseCheck` para datos frescos → espera 3s → query logs últimas 24h → genera HTML responsive → envía vía Gmail MCP.
- **HTML Template**: tabla-based layout compatible Gmail/Outlook. Secciones: header (logo + fecha), métricas snapshot (subs/views/engagement), Daily Brief, pitches pendientes, tarifas estimadas, CTA "Abrir Dashboard", footer.
- **Gmail MCP `send_email`**: ahora acepta `html?: string`. Cuando se pasa, usa `Content-Type: text/html` en vez de `text/plain`.
- **Subject mejorado**: `📊 Calibre · Daily Brief de {creatorName} · {fecha}` (ej: lunes, 25 de mayo).
- **Sidebar toggle**: "Daily Digest" debajo de "Auto-pitch". Mismo patrón de switch accesible + update optimista.
- **Migración**: `005_email_digest.sql` agrega `email_digest_enabled BOOLEAN DEFAULT false` a `users`.

### Known Issues
- **Timezone configurable**: ahora el digest corre a las 8am `Europe/Rome` (fijo). Futuro: guardar `timezone` del usuario (detectar del navegador) y correr cron cada hora filtrando `hora_local = 8am`.

### Stats
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS 640KB, CSS 135KB
- **Tests backend:** 171 passing, 22 skipped
- **Tests frontend:** 78/78 passing

---

## 🟢 Sprint 13: Audience Intelligence / Escucha Activa (Completado)

### Features Implemented
- **`getAudienceInsights` tool**: nueva función en el agente que analiza comentarios del último video de YouTube
- **YouTube Comments API**: endpoint `commentThreads.list` (1 quota unit), fetch de hasta 100 comentarios por video
- **Comment Analyzer** (`comment-analyzer.ts`):
  - **Sentiment analysis**: keywords positivas/negativas en español e inglés + emojis
  - **Theme extraction**: 12 categorías temáticas (TypeScript, React, Performance, Career, etc.) con conteo y ejemplos
  - **Question detection**: identifica preguntas por signo de interrogación o palabras interrogativas (`cómo`, `qué`, `por qué`, etc.)
  - **Deduplicación**: normaliza preguntas similares para mostrar las más frecuentes
- **Integración con Gemini**: el prompt del pulse incluye paso 7 — `getAudienceInsights` se ejecuta en cada ciclo
- **Persistencia**: resultados guardados en `agent_logs` con `type='audience_insights'`
- **Frontend `AudienceInsights` component**:
  - Barras de sentimiento (positive/neutral/negative) con porcentajes
  - Top 5 temas recurrentes con ejemplos reales de comentarios
  - Top 5 preguntas frecuentes con conteo de repeticiones
  - Diseño consistente con el dashboard (cards redondeadas, tipografía jerárquica)
- **Dashboard integration**: sección renderizada entre Daily Brief y Growth Chart

### Gemini Infrastructure Fixes
- **Model upgrade**: `gemini-2.0-flash` → `gemini-3.1-flash-lite` (500 RPD vs 20 RPD)
- **Request counter**: logging de cada request con timestamp (`[Gemini] Request #X at ...`)
- **Endpoint `/metrics/gemini`**: visibilidad de consumo en tiempo real
- **Fix 429 retries**: no reintentar cuando la cuota diaria está agotada (sin `retryDelay`)
- **Error persistence**: errores no-429 se guardan como `agent_error` en Supabase

### Gmail Auth Resilience
- **`GmailAuthError` class**: errores específicos de autenticación de Gmail
- **Refresh token detection**: detecta falta de refresh token antes de intentar refresh
- **`gmail_auth_error` type**: tag específico para errores de Gmail (distinto de `agent_error`)
- **Endpoint `GET /auth/gmail/status`**: retorna estado de conexión (access_token, refresh_token, connected)
- **Sidebar reconnect banner**: aparece automáticamente cuando `connected: false`
- **Dashboard reconnect banner**: detectado vía polling de `gmail_auth_error` logs

### Stats
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS bundle 659KB (+20KB), CSS 136KB (+1KB)
- **Tests backend:** 173 passing, 22 skipped
- **Tests frontend:** 78/78 passing

---

## 🟢 Sprint 13b: Copy + Acciones Sugeridas (Completado)

### UX Copy Improvements
- **PulseButton**: label visible "Analizar" + aria-label en español
- **AgentIndicator**: "AI Agent Active" → "Calibre activo"
- **Sidebar nav**: "Activity" → "Actividad", "Pitches" → "Propuestas", "Contracts" → "Contratos", "Rates" → "Tarifas"
- **Daily Brief**: título cambiado a "Resumen del día"
- **Empty states**: "No metrics yet" → "Aún no hay métricas. Analizá tu canal para ver tus estadísticas."
- **Onboarding**: "Configuración de Calibre" → "Empecemos"
- **Sponsorship empty**: "No forecast yet" → "Aún no hay tarifas estimadas"
- **GrowthChart empty**: "No growth data yet" → "Aún no hay datos de crecimiento"

### Acción Sugerida (SuggestedAction)
- Nuevo componente que muestra una acción concreta después del Daily Brief
- **Prioridad 1**: Pitches pendientes → "Tenés X propuestas esperando revisión" + link a /pitches
- **Prioridad 2**: Engagement bajó → sugerencia de publicar contenido más interactivo
- **Prioridad 3**: Más de 24h sin pulse → recordatorio de mantener métricas al día
- Hace el producto accionable, no solo informativo

### Stats
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS bundle 662KB (+3KB), CSS 136KB (+0KB)
- **Tests backend:** 173 passing, 22 skipped
- **Tests frontend:** 78/78 passing

---

## 🟡 Sprint 14: MVP Testing + Pre-Launch Fixes (En Progreso)

### Bugs encontrados y fixeados durante testing manual

#### BUG-1: SendPitchModal 401 Unauthorized (CRÍTICO)
- **Problema**: `fetch` a `/api/pitches/:id/send` usaba URL hardcodeada `localhost:8080` y no enviaba header `Authorization`
- **Fix**: Usar `API_BASE_URL` + `getJsonHeaders()` desde `api-config.ts`
- **Archivo**: `apps/web/src/components/SendPitchModal.tsx`

#### BUG-2: Audience Insights channelId → videoId (CRÍTICO)
- **Problema**: Gemini pasaba `channelId` (ej: `UC8LeXCWOalN8SxlrPcG-PaQ`) a `getAudienceInsights`, que luego lo usaba como `videoId` en YouTube Comments API → error "video not found"
- **Fix**: 
  - Agregar `lastVideoId` a `RealYouTubeMetrics` y retornarlo desde `getRealYouTubeMetrics`
  - En `pulse.ts`, interceptar llamada a `getAudienceInsights` y reemplazar `channelId` por `lastVideoId` real
  - Invalidar cache entries que no tengan `lastVideoId` (migración de schema)
- **Archivos**: `src/infrastructure/youtube/metrics-service.ts`, `src/domains/agent-core/heartbeat/pulse.ts`, `src/infrastructure/youtube/metrics-cache.ts`, `src/domains/content-pipeline/tools/youtube-mock.ts`

#### BUG-3: Sidebar sin scroll — botón Logout invisible
- **Problema**: El sidebar tenía `overflow-hidden` sin scroll. En pantallas con poca altura (o con muchos elementos como toggles + reconnect banner + profile), el botón de "Cerrar sesión" quedaba recortado fuera de la pantalla
- **Fix**: Cambiar `overflow-hidden` → `overflow-y-auto` en desktop y mobile sidebar. Agregar wrapper `flex flex-col min-h-full` para distribución correcta
- **Archivo**: `apps/web/src/components/Sidebar.tsx`

#### BUG-4: Tests de copy en español fallando
- **Problema**: Sprint 13b tradujo toda la UI al español, pero 6 tests seguían buscando textos en inglés
- **Fix**: Actualizar textos en tests: "AI Agent Active" → "Calibre activo", "Activity" → "Actividad", "Pitches" → "Propuestas", "Rates" → "Tarifas", "Daily Brief" → "Resumen del día", "No forecast yet" → "Aún no hay tarifas estimadas"
- **Archivos**: 5 archivos de test en `apps/web/src/**/__tests__`

### Mejoras implementadas durante testing

#### Gmail Email Discovery mejorado
- **Antes**: `maxResults: 5`, sin filtro de lectura, orden aleatorio
- **Ahora**: 
  - `maxResults: 20` (más margen)
  - `q: 'is:unread newer_than:30d'` (solo no leídos, máximo 30 días de antigüedad)
  - Orden: más nuevo primero (captura propuestas frescas y con deadlines vigentes)
- **Rationale**: Las marcas esperan respuesta en 7-14 días. Propuestas de >30 días probablemente ya cerraron con otro creador
- **Archivo**: `src/domains/agent-core/reasoning/tool-executor.ts`

### Stats Sprint 14 (parcial — testing en progreso)
- **Build backend:** ✅ 0 errores
- **Build frontend:** ✅ 0 errores, JS 662KB, CSS 136KB
- **Tests backend:** 173 passing, 22 skipped
- **Tests frontend:** 78/78 passing
- **TypeScript:** 0 errores backend + frontend
- **Rama:** `feature/mvp-testing`

---

## 🛠 Contexto de Desarrollo

- **Modelo IA:** `gemini-3.1-flash-lite` (upgrade desde 2.0 flash, 500 RPD vs 20 RPD). Retry 3x para 429
- **Backend:** Express + Supabase + MCP (Gmail child process)
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Package manager:** pnpm (workspace: raíz + apps/web)
- **Tablas:** `users`, `oauth_sessions`, `agent_logs`, `processed_emails`, `brand_deals`, `channel_metrics_cache`
- **Endpoints:**
  - Public: `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/youtube`, `GET /auth/gmail/start`, `GET /auth/callback`
  - Protected: `PATCH /auth/me`, `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`, `POST /api/contracts/audit`, `GET /auth/gmail/status`, `GET /metrics/gemini`
  - System: `GET /health`
- **Auth:** JWT (`jsonwebtoken` + `bcryptjs`) con `Authorization: Bearer <token>`. Gmail OAuth2 por usuario, tokens en tabla `users`
- **Paleta:** acento naranja `#FF6B2C` (antes `#EA5103`). Acento secundario frío: cyan `#22D3EE`. Dark: `#030305` fondo / `#F0F0F5` texto / `#A0A0B0` secundario / `#5A5A70` terciario. Light: `#FFEED0` fondo / `#1A0E09` texto
- **Layout:** Dashboard asimétrico (7-col + 5-col), secciones diferenciadas (hero, growth chart, audience insights, rates bars, timeline), sidebar 260px flotante glass-card, profile bar con avatar ring orgánico SVG animado
- **Componentes nuevos:** `Switch` (toggle-switch.tsx), `AudienceInsights`, `SuggestedAction`, `SendPitchModal`, `ContractUploader`, `MobileSidebarDrawer`
- **Canal test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Build backend:** 0 errores TypeScript
- **Build frontend:** ~662KB JS / ~136KB CSS
- **Tests:** 173 backend unit passing + 22 integration skipped (legacy) + 78 frontend passing. Total: 251/273 effective
- **Fallbacks:** mock YouTube (738K subs), mock pitch (template), mock sponsorship (subs × 0.002), mock contract audit (regex de cláusulas abusivas)
