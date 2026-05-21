# AGENTS.md — Project Memory & Progress

## Goal

Sprint 8 (Frontend Testing Completion): cerrar cobertura de tests frontend — createMockFetch infra + MetricCard, AgentIndicator, Logs, Sponsorship, Pitches, Sidebar.

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

- **Total tests**: 255 (179 backend + 76 frontend)
- **Test files**: 22 (10 backend + 12 frontend)
- **Build**: pasa con 0 errores
- **TypeScript**: `pnpm typecheck` pasa
- **createMockFetch**: implementado en `test-utils.tsx` con soporte para múltiples URLs, secuencias de respuestas, network errors, delay simulation y assertions (`called`, `callCount`, `lastCall`)

## Completed (Sprint 8 — Frontend Testing)

- **createMockFetch abstraction**: builder pattern con `.get()`, `.post()`, secuencias, network errors, delay, assertions
- **Dashboard migrated** a `createMockFetch` con test de secuencias para polling
- **MetricCard tests** (7): render props, trend positivo/negativo, icon, prefix/suffix, accent
- **AgentIndicator tests** (4): render counts, link a /logs, texto "AI Agent Active", defaults
- **Logs tests** (8): fetch on mount, filtro por tipo, búsqueda, empty state, network error, loading
- **Sponsorship tests** (5): fetch on mount, fallback CPM, header, network error
- **Pitches tests** (8): fetch, tabs, brand info, Review & Send button, empty states, sorting, network error
- **Sidebar tests** (6): nav items, active route, profile data fetch, fallback, theme toggle

## Next Steps (Sprint 9)

1. **Production Hardening**: Rate limiting interno (cola Gemini), graceful shutdown, health checks
2. **Landing Page**: Presencia pública en inglés para Google for Startups
3. **Auto-Pitch opcional**: Toggle por creador (manual vs automático)

## Critical Context

- El modo degradado (`runDegradedMode`) ahora genera y persiste `agent_summary` → Daily Brief visible en Dashboard incluso sin Gemini
- Engagement se calcula server-side como `(likes+comments)/subscribers*100` y llega pre-calculado a todos los consumidores
- `src/app.ts` contiene las rutas Express, `src/index.ts` solo hace `app.listen()`
- `tsconfig.test.json` extiende tsconfig.json con `strictNullChecks: false` para mocks
- Frontend tests corren con `pnpm --filter calibre-dashboard test`

## Relevant Files

- `src/app.ts`: Express app con routes, global error handler y rate limiting
- `src/index.ts`: solo startup (importa app.ts)
- `src/shared/config.ts`: Proxy lazy para env validation
- `src/infrastructure/supabase/supabase-client.ts`: Proxy lazy para createClient
- `src/infrastructure/mcp/mcp-manager.ts`: Proxy lazy, spawn postergado, clase exportada para testing
- `src/infrastructure/mcp/__tests__/mcp-manager.test.ts`: 37 tests unitarios (constructor, handleStdOut, handleStdErr, handleClose, handleError, callTool, healthCheck, shutdown, singleton)
- `src/domains/agent-core/heartbeat/pulse.ts`: sendMessageWithRetry iterativo
- `src/__tests__/api.integration.test.ts`: 15 tests API con supertest
- `tsconfig.test.json`: config separada para typecheck de tests
- `vitest.config.ts`: config raíz backend
- `apps/web/vite.config.ts`: config frontend con test settings
- `apps/web/src/components/__tests__/PulseButton.test.tsx`: 7 tests frontend
- `apps/web/src/test-setup.ts`: setup de @testing-library/jest-dom
