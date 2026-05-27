# AGENTS.md — Project Memory & Progress

## Goal

Sprint 9 (Production Hardening + Responsive MVP): poner Calibre listo para producción — rate limiting, health checks, graceful shutdown, responsive design mobile, datos reales en UI.

Sprint 9.5 (Premium Visual Pass): transformación visual del dashboard a dark theme profundo con glassmorphism real, glow/bloom, y alta jerarquía tipográfica (referencias: Linear.app, Stripe, Hypefluency).

## Constraints & Preferences

- Backend en TypeScript con Express + Supabase + Gmail API + Gemini 2.0 Flash
- Frontend React 19 + Vite + Tailwind v4 + Framer Motion
- Modo degradado (sin Gemini) ejecuta funciones deterministas, genera resumen estratégico propio
- Paleta: acento naranja #EA5103 (warning mapea a dorado, no usar para naranja)
- YouTube API quota optimizada: Uploads Playlist (2 unids) + Videos batch (1 unid) = 3 unids/ciclo vs Search API (100 unids)
- Temporal API (`@js-temporal/polyfill`) para relative time en vez de `Date` manual

## Progress

### Done

- **YouTube metrics infrastructure**: Search API reemplazada por Uploads Playlist (`contentDetails.relatedPlaylists.uploads` → `playlistItems` → `videos` con `part=statistics,contentDetails`)
- **Smart Shorts filtering**: videos con duración ≤ 60s se saltan automáticamente (con fallback si todo el feed son Shorts)
- **selectBestVideo algorithm**: prioriza video no-Short > 24h → no-Short > 1h más visto → cualquier no-Short → Short con más interacción
- **Data consistency filter**: videos con views=0 y likes>0 se descartan (datos inválidos)
- **engagementRate pre-calculated**: `(likes+comments)/subscribers*100` se calcula server-side y se persiste en `media_kit_update`
- **Metrics cache**: `channel_metrics_cache` con upsert a Supabase (TTL 1h)
- **Degraded mode summary**: `runDegradedMode` captura métricas, insights previos, forecast, marca nombres → genera resumen narrativo → persiste como `agent_summary`
- **Pulse feedback visual**: 3 estados en `PulseButton` — idle (Sparkles naranja), pulsing (círculo expandido + fondo verde + dots saltando + ondas expansivas), success (check spring) / error (X shake). Auto-clear 2s
- **PulseStatus state machine**: `pulse-context` expandido con `pulseStatus: 'idle' | 'pulsing' | 'success' | 'error'`. Dashboard setea `success` al detectar nuevo `agent_summary`, `error` tras timeout 60s
- **Relative time with Temporal**: hook `useRelativeTime` + componente `<RelativeTime>` usando `Temporal.Instant.since()`. Auto-refresh cada 30s
- **Logs limit increase**: `/logs` endpoint LIMIT 50 → 200
- **Pending Pitches square card**: card cuadrada naranja oscura primera en bento grid

### Tests & Quality (Sprint 7)

- **105 unit tests backend** en 7 archivos: metrics-service (45), metrics-cache (9), youtube.ts (7), tool-executor (16), pulse.ts (8), calculate-sponsorship (12), generate-pitch (12)
- **15 integration tests API** con supertest: /health, /logs, /auth/login, /pulse, /api/pitches/:id/send
- **7 frontend tests**: PulseButton (3 estados visuales, click handlers)
- **Side effects eliminados**: config.ts, supabase-client.ts, mcp-manager.ts convertidos a lazy Proxy — nada corre al importar
- **sendMessageWithRetry iterativo**: while loop reemplaza recursión, elimina unhandled rejection
- **Dead code removido**: youtube-client.ts, generate-media-kit.ts, LogEntryCard, PitchCard, hasMediaKit
- **Express app refactor**: `src/index.ts` → `src/app.ts` (routes) + `src/index.ts` (startup). Permite supertest sin puerto
- **TypeScript build fixed**: test files excluidos del build tsconfig, tsconfig.test.json separado para typechecking
- **Global error handler Express**: middleware 4-params al final de app.ts
- **Rate limiting**: `express-rate-limit` con 100 req/min global, 10 req/min para /pulse y /send. Omitido en test mode
- **Scripts agregados**: `typecheck`, `typecheck:tests`, `typecheck:all`
- **Frontend test infra**: vitest + jsdom + @testing-library/react en apps/web

### Completed (Sprint 7)

- **175 tests total**: 137 backend (9 files) + 38 frontend (6 files), all passing
- **Frontend tests**: PulseButton (7), pulse-context (5), useRelativeTime (8), Layout (4), SendPitchModal (6), Dashboard (8)
- **localStorage mocked** in test-setup.tsx via `Object.defineProperty` (vi.stubGlobal no funciona para propiedades de window en jsdom)
- **SendPitchModal query fix**: `getByText(/TechBrand$/)` en vez de `getByText('TechBrand', { exact: false })` para evitar match con `partner@techbrand.com`
- **Layout button query fix**: `getAllByRole('button').length >= 2` en vez de `getByRole('button')` (Sidebar tiene ThemeToggle button adicional)
- **pulse-context lastPulseAt fix**: `vi.useFakeTimers()` + `vi.advanceTimersByTime(100)` para que Date.now() retorne valor distinto en cada llamada
- **"throws outside provider" test eliminado**: `useContext(createContext(defaultValue))` nunca lanza
- **Auth middleware**: `auth-middleware.ts` — protege `/pulse`, `/logs`, `/api/*` con `x-api-key`. Opcional y bypass en test mode. Tests unitarios separados (5 tests).
- **Auth callback tests**: 4 tests de integración para `GET /auth/callback` — code faltante, getToken error, Supabase error, success path
- **Email injection prevention**: regex mejorado para `brandEmail` — rechaza local-parts largos, HTML/script tags, header injection (`\r\n`). 3 tests de integración añadidos
- **parseISODuration `Infinity` downstream**: tests que verifican que `isShort`/`isDurable`/`selectBestVideo` manejan duraciones malformadas (`Infinity`) correctamente
- **403 detection refinement**: `error.toString().includes('403')` reemplazado por `error.status === 403 || error.message?.includes('403')` para evitar falsos positivos en stack traces. Test de contraejemplo añadido

### Blocked

- **runPulseCheck**: bucle Gemini + function calling con 3+ dependencias externas vivas (Gemini chat, tool executor, Supabase)

### Done (Sprint 7 — continuation)

- **mcp-manager.ts tests**: 37 tests unitarios con mock de child_process.spawn via EventEmitter + fake timers / real timers
- **Bug fix**: optional chaining en `spawnServer` (`stdin?.writable` en vez de `stdin.writable`) para evitar TypeError cuando stdin es null
- **runDegradedMode smoke tests**: 4 tests (happy path, YouTube failure, fallbacks, brand emails) en `pulse.test.ts`
- **Docs consolidation**: 6 archivos md → 4 (eliminados CALIBRE_MEMORY.md, SESSION.md, youtube/TEST_CASES.md)

## Key Decisions

- YouTube Uploads Playlist reemplaza Search API: 3 unids/ciclo vs 100, 50x más eficiente
- Shorts detectados por duración (`contentDetails.duration`, ≤ 60s) — definición oficial de YouTube
- Proxy lazy pattern para eliminar side effects al importar (config, supabase, mcp-manager)
- sendMessageWithRetry iterativo en vez de recursivo para evitar unhandled rejection con fake timers
- Test files excluidos del build tsconfig, tsconfig.test.json separado para typechecking de tests
- Rate limiting omitido en test mode (config.NODE_ENV) para no bloquear integration tests
- framer-motion mockeado en frontend tests para evitar errores de animación en jsdom
- Temporal API para relative time (+158KB bundle, trade-off aceptado)

## Test Stats

- **Total tests**: 249 (171 backend + 78 frontend)
- **Test files**: 23 (11 backend + 12 frontend)
- **Build**: pasa con 0 errores (frontend + backend)
- **TypeScript**: `pnpm typecheck` pasa, `pnpm --filter calibre-dashboard build` pasa
- **createMockFetch**: implementado en `test-utils.tsx` con soporte para múltiples URLs, secuencias de respuestas, network errors, delay simulation y assertions (`called`, `callCount`, `lastCall`)
- **framer-motion mock**: extendido con `motion.h1`, `h2`, `h3`, `p`, `svg`, `path`, `rect`, `g`, `defs`, `linearGradient`, `stop`, `line`, `text`, `link` para soportar rediseño

## Completed (Sprint 8 — Frontend Testing + runPulseCheck)

- **createMockFetch abstraction**: builder pattern con `.get()`, `.post()`, secuencias, network errors, delay, assertions
- **Dashboard migrated** a `createMockFetch` con test de secuencias para polling
- **MetricCard tests** (7): render props, trend positivo/negativo, icon, prefix/suffix, accent
- **AgentIndicator tests** (4): render counts, link a /logs, texto "AI Agent Active", defaults
- **Logs tests** (8): fetch on mount, filtro por tipo, búsqueda, empty state, network error, loading
- **Sponsorship tests** (5): fetch on mount, fallback CPM, header, network error
- **Pitches tests** (8): fetch, tabs, brand info, Review & Send button, empty states, sorting, network error
- **Sidebar tests** (6): nav items, active route, profile data fetch, fallback, theme toggle
- **runPulseCheck tests** (8): single round, multi-round, no function calls, 429 fallback, retry success, non-429 error, executeToolCall error, prompt verification
  - Refactor: inyección de dependencias opcionales (`deps?: PulseCheckDeps`) con defaults

## Completed (Sprint 9 — Production Hardening + Responsive)

- **Gmail API verified**: tokens existen para `tavolarodemian06@gmail.com` en `user_auth`
- **Supabase cache permissions**: `channel_metrics_cache` funciona correctamente (columna `data`)
- **Rate limiting Gemini**: `p-queue` con `concurrency: 1` + delay 1s entre requests en `gemini-client.ts`
- **Health check real**: `GET /health` verifica Supabase, Gmail MCP, YouTube API. Retorna 200 o 503 con `checks` detallado
- **Graceful shutdown**: SIGTERM/SIGINT cierran HTTP server, MCP child process, y exit limpio
- **Responsive sidebar**: hamburger menu en mobile (`lg:hidden`), drawer con backdrop, desktop sin cambios
- **Responsive layout**: `ml-0 lg:ml-[300px]`, paddings adaptativos, `pt-14 lg:pt-4`
- **PulseButton mobile**: oculto en mobile (`hidden lg:block`), visible solo desktop
- **AgentIndicator real**: `Layout` fetchea logs y pasa counts dinámicos (re-fetch tras pulse)
- **Typography mobile**: paddings reducidos (`p-4 lg:p-10`), font sizes adaptativos, flex-wrap en stats

## Completed (Sprint 9.5 — Premium Visual Pass)

### Dashboard Redesign — "Creator Studio"
- **Hero Section prominente**: nombre del creador en headline enorme (7xl), avatar con anillo orgánico SVG + glow orb, engagement rate como métrica hero (texto 8xl)
- **Growth Chart**: componente SVG puro con área bajo la curva, gradiente naranja, línea fina, puntos interactivos con tooltip hover — estilo Mathical
- **Daily Brief editorial**: sección prominente con texto grande (2xl-3xl), sin card container, lectura tipo artículo/reporte
- **Rates como barras horizontales**: `RateBar` con gradiente animado de ancho, labels editoriales, comparativa con market avg
- **Timeline vertical elegante**: `Timeline` con línea conectora, iconos coloreados por tipo, fechas relativas, hover expand
- **Layout asimétrico**: 7-col + 5-col grid (no bento uniforme), pending pitches como card naranja prominente
- **Eliminado bento grid genérico**: reemplazado por secciones diferenciadas con tratamientos visuales propios

### Tema Visual Premium
- **Dark theme profundo**: `--bg: #030305`, `--surface: rgba(255,255,255,0.02)`, glassmorphism real con `blur(40px)`
- **Contraste tipográfico radical**: `--text: #F0F0F5` (blanco frío), `--text-secondary: #A0A0B0`, `--text-tertiary: #5A5A70` (labels)
- **Acento secundario frío**: cyan `#22D3EE` para badges secundarios y gradientes (contraste con naranja `#FF6B2C`)
- **Ambient glow orbs**: 4 gradientes radiales en `body` (naranja + cyan + púrpura) crean profundidad de fondo
- **Glow/bloom real**: `.neon-glow` duplica intensidad en dark (`0 0 30px rgba(234,81,3,0.5)`); `.glow-border` genera borde luminoso animado en cards
- **CountUp animation**: hook `useCountUp` + integrado en `MetricCard` — números animan de 0 al valor (1800ms)
- **Tipografía jerárquica**: labels `uppercase tracking-[0.15em] font-semibold`, números `tabular-nums`, body `font-normal`

### PulseButton Transform
- **Botón como pieza central**: gradiente cónico rotatorio (naranja/emerald/rojo según estado), glow pulsante, anillo orgánico SVG en idle
- **Estados fluidos**: idle (sparkles rotando + glow orb), pulsing (3 ripple rings + dots loader + breathing scale), success (check + emerald glow), error (X shake + red glow)
- **Label tooltip**: "Pulse" aparece debajo del botón en idle
- **Transiciones suaves**: AnimatePresence con spring physics entre estados

## Completed (Sprint 9.75 — Impeccable Polish Pass)

### Harden (impeccable harden)
- **useApiFetch hook**: `data | isLoading | error | refetch` — reemplaza fetch manuales silenciosos en toda la app
- **ErrorState component**: UI visual de error con icono, mensaje y botón "Try again"
- **Skeleton components**: `SkeletonCard`, `SkeletonMetric`, `SkeletonText` con `animate-pulse`
- **Datos fake eliminados**: "Sarah Chen", 127,500, +15%, +209% YoY, default rates, defaultData en GrowthChart
- **Empty states honestos**: "No metrics yet", "No forecast yet", "No growth data yet" con call-to-action

### Typeset (impeccable typeset)
- **Display font restringida**: `Cabinet Grotesk` solo en hero headings (text-4xl+). UI labels, nav, tabs, data migrados a `Satoshi` / `font-sans`
- **Font-display swap**: `@font-face` declarations en `index.html` con `font-display: swap`
- **Focus indicators**: `:focus-visible` global con `outline: 2px solid var(--accent)`. Focus rings en tabs, botones, inputs
- **Pesos normalizados**: `font-black` → `font-semibold` en nav, tabs, labels. `font-black` → `font-bold` en data numbers

### Distill (impeccable distill)
- **Glassmorphism universal eliminado**: `backdrop-blur(40px)` removido de cards, sidebar, modales, logs. Ahora superficies sólidas con bordes sutiles
- **Glow orbs reducidos**: 4 orbs radiales pesados → 1 orb sutil en dark, 2 en light
- **`.neon-glow` reducido**: `0 0 30px` → `0 0 16px`
- **`.glow-border` reducido**: opacidad 0.4 permanente → 0.25, solo en hover
- **Sidebar**: `glass-card` → `bg-surface border border-border shadow-lg`

### Quieter (impeccable quieter)
- **prefers-reduced-motion global**: `@media` reduce todas las animaciones a 0.01ms
- **3D tilt eliminado**: MetricCard `rotateX/Y` + `preserve-3d` reemplazado por `whileHover={{ y: -2 }}`

### Polish (impeccable polish)
- **Contrastes WCAG**: Badges cyan sobre cyan 12% → `bg-surface-raised text-text-secondary`. Pending Pitches `text-white/50` → `text-white/80`
- **ARIA**: `aria-label` dinámico en PulseButton (4 estados). `aria-expanded` en mobile hamburger. `aria-live="polite"` en polling toast
- **SendPitchModal error visible**: Estado `sendError` con banner rojo en vez de `console.error` silencioso
- **Rutas fantasmas ocultas**: `/settings`, `/help` y social links (`#`) comentados hasta implementación
- **Code cleanup**: Imports no usados removidos (Settings, HelpCircle, Youtube, Instagram, Twitter, Music2)

### Adapt (impeccable adapt)
- **PulseButton visible en mobile**: Removido `hidden lg:block`, ahora accesible en todos los dispositivos
- **Touch targets ≥ 44px**: Hamburger `w-10 → w-11`, close modal `w-8 → w-11`, tabs `py-2 → py-2.5`, filter pills `min-h-[44px]`, AgentIndicator `min-h-[44px]`, SendPitchModal CTAs `py-3 min-h-[44px]`
- **Links sin padding**: "Details →", "View all pitches" ahora tienen `px-3 py-2`/`px-2 py-1.5`
- **Font sizes mínimos en mobile**: `text-xs` (12px) → `sm:text-sm` (14px) en tabs, filtros, AgentIndicator. `text-[10px]` oculto en mobile (`hidden sm:inline`)
- **Tablet grid**: Asymmetric 7+5 colapsa a single-column (`grid-cols-1 lg:grid-cols-12`) sin breakage

### Stats post-adapt
- **Build**: ✅ 0 errores TypeScript
- **Tests**: ✅ 76/76 frontend tests pasando
- **CSS bundle**: 132KB (stable)
- **JS bundle**: 618KB (stable)

### Harden Critical (impeccable harden — Option A)
- **API config centralizada**: `lib/api-config.ts` con `API_BASE_URL` via `VITE_API_URL` env + `getApiHeaders()` con `x-api-key`
- **useApiFetch refactor**: AbortController + 10s timeout + auth headers + stale closure fix (optionsRef) + keep stale data on error
- **Polling cleanup fix**: `guard.timeoutId` guarda el `setTimeout` recursivo y se limpia en cleanup
- **Division by zero fixes**: GrowthChart (`rawMax === 0 ? 1 : rawMax * 1.15`), RateBar (`min === 0 ? 0 : spread`)
- **URLs hardcodeadas removidas**: `localhost:8080` eliminado de Dashboard, Logs, Pitches, Sponsorship, Sidebar, Layout, SendPitchModal, pulse-context
- **vite-env.d.ts**: types para `import.meta.env`

### Stats post-harden-critical
- **Build**: ✅ 0 errores TypeScript
- **Tests**: ✅ 76/76 frontend tests pasando
- **CSS bundle**: 132KB (stable)
- **JS bundle**: 618KB (stable)

### Harden B-Group (impeccable harden — follow-up)
- **Datos fake eliminados**: "Rate pending" y "High match" badges removidos de Pitch cards (eran strings estáticas, no datos reales)
- **Market avg hardcoded eliminado**: `item.min * 1.15` removido de RateBar y Sponsorship. Reemplazado por range real del forecast
- **SendPitchModal accessibility**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Escape key handler, auto-focus on open, `aria-label="Close dialog"`
- **Timeline truncate fix**: `group-hover:truncate-none` (clase Tailwind inválida) removida

### Final Pass (impeccable polish + adapt follow-up)
- **Timeline colores hardcoded fix**: Hex (`#FF6B2C`, `#22D3EE`, etc.) reemplazados por clases Tailwind usando tokens CSS (`text-accent`, `text-accent-muted`, `text-purple-400`, `text-warning`). Ahora respetan el tema dark/light
- **Sidebar mobile accessibility**: Escape key cierra el drawer. Auto-focus en primer elemento focusable al abrir. Componente `MobileSidebarDrawer` extraído
- **Keyboard shortcuts**: Hook `useKeyboardShortcuts` — `D` (Dashboard), `L` (Logs), `P` (Pitches), `R` (Rates/Sponsorship). Ignora cuando el usuario escribe en inputs

### Stats post-final-pass
- **Build**: ✅ 0 errores TypeScript
- **Tests**: ✅ 76/76 frontend tests pasando
- **CSS bundle**: 133KB (stable)
- **JS bundle**: 619KB (stable)

## Completed (Sprint 10 — Multi-tenant Auth + Onboarding)

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

### Tests
- **Backend**: 164/164 unit tests pasando, 22 integration tests skipped (legacy — requieren refactor para JWT)
- **Frontend**: 76/76 tests pasando
- **TypeScript**: 0 errores backend + frontend

### Fixes durante testeo
- **YouTube URL format**: `extractChannelId` ahora detecta handles (`@VictorAbarca`) vs channel IDs (`UC...`). La API usa `forHandle` o `id` según el tipo
- **Supabase permissions**: Migraciones `002_fix_rls_permissions.sql` + `003_grant_service_role.sql` + `004_grant_all_permissions.sql` para evitar "permission denied for table users"
- **OAuth redirect**: `/auth/callback` redirige a `FRONTEND_URL` (env var) en vez de path relativo
- **SPA catch-all**: Express sirve `index.html` para rutas no-API (fix Express v5: usa `app.use()` en vez de `app.get('*')`)
- **Onboarding sequence guard**: `OnboardingPage` impide saltear steps. `FirstPulse` redirige si no hay `youtube_channel_id`
- **Dev skip Gmail**: Botón "Saltar Gmail (solo para testear)" en `ConnectGmail` (visible solo en `import.meta.env.DEV`)

### Known Issues
- **Gmail OAuth**: Google requiere que el usuario sea "test user" aprobado en Google Cloud Console mientras la app está en "Testing" mode. Para producción, hay que pasar a "Production" mode (requiere verificación de dominio)
- **Integration tests**: 22 tests legacy skipped — requieren refactor para nuevo flujo JWT + mock de oauth_sessions

### Stats Sprint 10
- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS bundle 639KB (+20KB por auth + toggle), CSS 135KB (+2KB)
- **Tests backend**: 171 passing, 22 skipped
- **Tests frontend**: 78/78 passing

## Completed (Sprint 11a — Auto-Pitch Toggle)

- **Backend**: `PATCH /auth/me` endpoint con Zod validation para actualizar `auto_pitch_enabled`
- **Backend**: `runPulseCheck` y `runDegradedMode` respetan `auto_pitch_enabled` — prompt dinámico y salteo de pitch generation
- **Backend**: Auto-pulse corregido para multi-tenant — itera todos los usuarios con `auto_pitch_enabled=true` y canal configurado
- **Frontend**: `updateUser` en `AuthContext` con update optimista + rollback en error
- **Frontend**: Toggle "Auto-pitch" en Sidebar con label, descripción, switch accesible (`role="switch"`, `aria-checked`, `aria-label`)
- **Frontend**: Componente `Switch` reutilizable en `toggle-switch.tsx` con focus-visible y estados naranja/gris
- **Frontend**: Fix onboarding completion — `FirstPulse` ahora marca `onboarding_completed=true` vía `updateUser` tras análisis exitoso, timeout o skip
- **Tests backend**: 4 tests para `PATCH /auth/me`, 2 tests para `runDegradedMode` (skip pitches cuando false), 2 tests para `runPulseCheck` (prompt dinámico)
- **Tests frontend**: 2 tests para toggle (render + accesibilidad)

## Completed (Sprint 11b — Onboarding Bug Fixes + Auth Flow Verified)

### Bug Fixes
- **Zod `updateMeSchema`**: agregados `onboarding_completed: z.boolean()` y `onboarding_step: z.number()` al schema de `PATCH /auth/me`. Antes solo aceptaba `auto_pitch_enabled` → `updateUser({ onboarding_completed: true })` era silenciosamente ignorado por Zod → `ProtectedRoute` redirigía a onboarding en loop infinito tras cada recarga.
- **api-config Content-Type fix**: `getApiHeaders()` enviaba `Content-Type: application/json` en GET requests → causaba 404 en el navegador (CORS preflight innecesario). Ahora `getAuthHeaders()` (solo `Authorization`) para GET/DELETE y `getJsonHeaders()` (agrega `Content-Type`) para POST/PATCH/PUT. `useApiFetch` elige automáticamente según método HTTP.
- **FirstPulse simplificado**: eliminado el polling frágil de 2 minutos que esperaba `agent_summary` en `/logs?type=agent_summary`. El insert en Supabase (`error: null`) no era visible en el `SELECT` posterior del mismo endpoint (mismo `user_id`, misma conexión service role). Ahora el onboarding se completa inmediatamente tras `/pulse` 200. El análisis corre en background y las métricas se cargan vía el polling existente del Dashboard.

### Auth Flow Verificado (end-to-end)
- Register → Login → JWT emitido (`expiresIn: 7d`) → Onboarding 3-step (YouTube → Gmail → FirstPulse) → Dashboard: flujo completo probado con usuario real.
- `jwtAuthMiddleware` protege `/pulse`, `/logs`, `/api/*` correctamente. `ProtectedRoute` redirige a `/login` si no autenticado, a `/onboarding?step=X` si `onboarding_completed: false`.
- `updateUser` optimistic + rollback validado: el update optimista permite navegar al Dashboard inmediatamente sin esperar la respuesta del server. Si el server falla, `fetchUser()` restaura el estado real.

### Known Issues
- **Supabase visibility gap**: `agent_summary` insertado con `error: null` en `runDegradedMode`/`runPulseCheck` no aparece en el `SELECT` posterior de `/logs` (mismo `user_id`, mismo cliente service role). Workaround: el onboarding ya no depende de detección en tiempo real. Requiere debuggear schema/RLS de `agent_logs`.

### Stats Sprint 11b
- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS 639KB, CSS 135KB
- **Tests backend**: 171 passing, 22 skipped
- **Tests frontend**: 78/78 passing

## Completed (Sprint 11c — Auth Headers Fixes)

### Bug Fixes
- **`pulse-context.tsx` 401 fix**: `triggerPulse` hacía `fetch` a `/pulse` sin headers de autenticación (URL hardcodeada a `localhost:8080` sin `Authorization`). El backend retornaba 401 silenciosamente gracias a `.catch(() => {})` → el botón Pulse parecía funcionar pero el servidor nunca recibía el request real.
- **`Dashboard.tsx` 401 fix**: El polling del Dashboard hacía `fetch` a `/logs` sin headers de autenticación. Retornaba 401 cada 3 segundos → nunca detectaba el `agent_summary` nuevo → safety timeout a los 60s disparaba `error` (X roja) aunque el backend había terminado exitosamente.
- **Eliminado hardcodeo de `localhost:8080`**: `pulse-context.tsx` y `Dashboard.tsx` ahora usan `API_BASE_URL` desde `api-config.ts`.

### Stats Sprint 11c
- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS 640KB, CSS 135KB
- **Tests backend**: 171 passing, 22 skipped
- **Tests frontend**: 78/78 passing

## Completed (Sprint 12 — Email Digest Daily)

### Features
- **`node-cron` scheduler**: corre todos los días a las 8:00 AM (`Europe/Rome`). Itera usuarios con `email_digest_enabled=true` + `youtube_channel_id IS NOT NULL`. Stagger 5s entre usuarios.
- **`DigestService`**: `generateAndSendDigest(user)` → dispara `runPulseCheck` para datos frescos → espera 3s → query logs últimas 24h → genera HTML responsive → envía vía Gmail MCP.
- **HTML Template**: tabla-based layout compatible Gmail/Outlook. Secciones: header (logo + fecha), métricas snapshot (subs/views/engagement), Daily Brief, pitches pendientes, tarifas estimadas, CTA "Abrir Dashboard", footer.
- **Gmail MCP `send_email`**: ahora acepta `html?: string`. Cuando se pasa, usa `Content-Type: text/html` en vez de `text/plain`.
- **Subject mejorado**: `📊 Calibre · Daily Brief de {creatorName} · {fecha}` (ej: lunes, 25 de mayo).
- **Sidebar toggle**: "Daily Digest" debajo de "Auto-pitch". Mismo patrón de switch accesible + update optimista.
- **Migración**: `005_email_digest.sql` agrega `email_digest_enabled BOOLEAN DEFAULT false` a `users`.

### Known Issues / Next Steps
- **Timezone configurable**: ahora el digest corre a las 8am `Europe/Rome` (fijo). Futuro: guardar `timezone` del usuario (detectar del navegador) y correr cron cada hora filtrando `hora_local = 8am`.
- **Supabase visibility debug**: investigar por qué `agent_logs` insert no es visible en SELECT inmediato (posible RLS residual, schema issue, o timing)
- **Landing Page**: Presencia pública en inglés para Google for Startups
- **Multi-tenant Agency**: Una cuenta con múltiples creadores (tabla `creators` + `user_creators`)
- **Integration tests**: Re-escribir 22 tests de integración para nuevo flujo JWT

## Critical Context

- El modo degradado (`runDegradedMode`) ahora genera y persiste `agent_summary` → Daily Brief visible en Dashboard incluso sin Gemini
- Engagement se calcula server-side como `(likes+comments)/subscribers*100` y llega pre-calculado a todos los consumidores
- `src/app.ts` contiene las rutas Express, `src/index.ts` solo hace `app.listen()`
- `tsconfig.test.json` extiende tsconfig.json con `strictNullChecks: false` para mocks
- Frontend tests corren con `pnpm --filter calibre-dashboard test`

## In Progress (Sprint 12 — Contract Auditor)

### Features Implemented
- **`POST /api/contracts/audit`**: recibe PDF vía `multer` (memory storage), extrae texto con `pdf-parse` (PDFParse v2), dispara `auditContractUseCase` con Gemini.
- **Fallback análisis**: si Gemini falla, usa análisis basado en lista de cláusulas abusivas conocidas (regex sobre texto del contrato).
- **Persistencia**: resultado guardado en `agent_logs` con `type='contract_audit'` para historial.
- **Resultado estructurado**: `riskLevel` (low/medium/high), `redFlags[]`, `suggestedNegotiationPoints[]`, `estimatedFairRate`, `summary`, `contractType`.
- **Frontend `/contracts`**: drag & drop o click para subir PDF, visualización de resultado con badges de riesgo, lista de red flags, sugerencias de negociación, historial de análisis previos.
- **Nav item**: "Contracts" con icono `FileCheck` en Sidebar.

### ⚠️ Pending Verification
- [x] **End-to-end test**: subir un PDF real de contrato y verificar que el análisis se genera correctamente
- [x] **Fallback test**: verificar que el análisis regex funciona cuando Gemini no está disponible
- [x] **Historial test**: verificar que los análisis previos aparecen en la lista del frontend
- [x] **Error handling**: testear PDF corrupto, archivo muy grande, y texto no extraíble

## Completed (Sprint 13 — Audience Intelligence / Escucha Activa)

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

### Stats Sprint 13
- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS bundle 659KB (+20KB), CSS 136KB (+1KB)
- **Tests backend**: 173 passing, 22 skipped
- **Tests frontend**: 78/78 passing
- **TypeScript**: 0 errores backend + frontend

## Completed (Sprint 13b — Copy + Acciones Sugeridas)

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

### Stats Sprint 13b
- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS bundle 662KB (+3KB), CSS 136KB (+0KB)
- **Tests backend**: 173 passing, 22 skipped
- **Tests frontend**: 78/78 passing

## Known Issues / Next Steps
- **Timezone configurable**: ahora el digest corre a las 8am `Europe/Rome` (fijo). Futuro: guardar `timezone` del usuario (detectar del navegador) y correr cron cada hora filtrando `hora_local = 8am`.
- **Landing Page**: Presencia pública en inglés para Google for Startups (repo aparte)
- **Multi-tenant Agency**: Una cuenta con múltiples creadores (tabla `creators` + `user_creators`)
- **Integration tests**: Re-escribir 22 tests de integración para nuevo flujo JWT
- **TikTok/Instagram**: Post-MVP. Evaluado: TikTok primero (menor fricción de onboarding)

## Relevant Files

- `src/app.ts`: Express app con routes, global error handler y rate limiting
- `src/index.ts`: startup + auto-pulse scheduler (itera usuarios con auto_pitch_enabled)
- `src/shared/config.ts`: Proxy lazy para env validation
- `src/infrastructure/supabase/supabase-client.ts`: Proxy lazy para createClient
- `src/infrastructure/mcp/mcp-manager.ts`: Proxy lazy, spawn postergado, clase exportada para testing
- `src/infrastructure/mcp/__tests__/mcp-manager.test.ts`: 37 tests unitarios
- `src/domains/agent-core/heartbeat/pulse.ts`: sendMessageWithRetry iterativo, runPulseCheck/runDegradedMode con autoPitchEnabled
- `src/routes/auth.routes.ts`: JWT auth routes + PATCH /auth/me para actualizar perfil
- `src/routes/__tests__/auth.routes.test.ts`: tests de PATCH /auth/me
- `src/__tests__/api.integration.test.ts`: 15 tests API con supertest
- `tsconfig.test.json`: config separada para typecheck de tests
- `vitest.config.ts`: config raíz backend
- `apps/web/vite.config.ts`: config frontend con test settings
- `apps/web/src/styles/globals.css`: tema dark premium con glow orbs, glassmorphism, `.glow-border`
- `apps/web/src/contexts/AuthContext.tsx`: JWT auth context con updateUser optimista
- `apps/web/src/pages/Dashboard.tsx`: rediseño asimétrico audaz — hero, growth chart, rates, timeline
- `apps/web/src/components/GrowthChart.tsx`: gráfico SVG puro con área, gradiente, tooltip hover
- `apps/web/src/components/RateBar.tsx`: barras horizontales de rango con gradiente animado
- `apps/web/src/components/Timeline.tsx`: timeline vertical con iconos coloreados, fechas relativas
- `apps/web/src/components/PulseButton.tsx`: botón central con gradiente cónico, glow, anillo SVG, estados fluidos
- `apps/web/src/components/MetricCard.tsx`: cards de métricas con count-up animation, hover glow
- `apps/web/src/components/ui/toggle-switch.tsx`: Switch accesible (role=switch, focus-visible, estados naranja/gris)
- `apps/web/src/components/Sidebar.tsx`: sidebar con navegación, profile, auto-pitch toggle, logout
- `apps/web/src/lib/api-config.ts`: getAuthHeaders() (GET/DELETE) + getJsonHeaders() (POST/PATCH/PUT) + API_BASE_URL
- `apps/web/src/lib/pulse-context.tsx`: triggerPulse con JWT headers + lastPulseAt tracking
- `apps/web/src/pages/Dashboard.tsx`: rediseño asimétrico audaz + polling de logs con auth headers
- `apps/web/src/pages/onboarding/steps/FirstPulse.tsx`: análisis síncrono vía `/pulse?wait=true`
- `apps/web/src/pages/Contracts.tsx`: upload de PDF + visualización de análisis + historial
- `apps/web/src/test-setup.tsx`: setup + mock centralizado de framer-motion con todos los elementos SVG/HTML
- `src/domains/contracts/use-cases/audit-contract.ts`: auditoría de contratos con Gemini + fallback regex
