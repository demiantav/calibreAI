# AGENTS.md — Project Memory & Progress

## Goal
Sprint 7 (Testing & Quality): tests unitarios, tests de integración, infraestructura de calidad, fixing de side effects y dead code.

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
- **158 tests total**: 120 backend (8 files) + 38 frontend (6 files), all passing
- **Frontend tests**: PulseButton (7), pulse-context (5), useRelativeTime (8), Layout (4), SendPitchModal (6), Dashboard (8)
- **localStorage mocked** in test-setup.tsx via `Object.defineProperty` (vi.stubGlobal no funciona para propiedades de window en jsdom)
- **SendPitchModal query fix**: `getByText(/TechBrand$/)` en vez de `getByText('TechBrand', { exact: false })` para evitar match con `partner@techbrand.com`
- **Layout button query fix**: `getAllByRole('button').length >= 2` en vez de `getByRole('button')` (Sidebar tiene ThemeToggle button adicional)
- **pulse-context lastPulseAt fix**: `vi.useFakeTimers()` + `vi.advanceTimersByTime(100)` para que Date.now() retorne valor distinto en cada llamada
- **"throws outside provider" test eliminado**: `useContext(createContext(defaultValue))` nunca lanza

### Blocked
- **mcp-manager.ts**: spawn de child process + JSON-RPC. Tests requieren mocking pesado de child_process
- **runDegradedMode / runPulseCheck**: 5+ dependencias externas (Gemini, Supabase, Gmail, YouTube, MCP)

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
- **Total tests**: 158 (120 backend + 38 frontend)
- **Test files**: 14 (8 backend + 6 frontend)
- **Build**: pasa con 0 errores
- **TypeScript**: `pnpm typecheck` pasa, `pnpm typecheck:all` chequea tests también

## Next Steps
1. **Tests para mcp-manager.ts**: mocking de child_process.spawn + JSON-RPC
2. **Tests para runDegradedMode**: orquestación completa del modo degradado
3. **Limpiar repo**: commit de todos los cambios de testing a feature branch
4. **Ampliar frontend tests**: RelativeTime, pulse-context, MetricCard, Dashboard

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
- `src/infrastructure/mcp/mcp-manager.ts`: Proxy lazy, spawn postergado
- `src/domains/agent-core/heartbeat/pulse.ts`: sendMessageWithRetry iterativo
- `src/__tests__/api.integration.test.ts`: 15 tests API con supertest
- `tsconfig.test.json`: config separada para typecheck de tests
- `vitest.config.ts`: config raíz backend
- `apps/web/vite.config.ts`: config frontend con test settings
- `apps/web/src/components/__tests__/PulseButton.test.tsx`: 7 tests frontend
- `apps/web/src/test-setup.ts`: setup de @testing-library/jest-dom
