# AGENTS.md — Project Memory & Progress

## Goal

Sprint 14 (MVP Testing + Pre-Launch Fixes): validar todos los flujos end-to-end, fixear bugs críticos encontrados durante testing manual, y dejar el producto listo para beta cerrada (max 5 usuarios).

## Constraints & Preferences

- Backend en TypeScript con Express + Supabase + Gmail API + Gemini 2.0 Flash
- Frontend React 19 + Vite + Tailwind v4 + Framer Motion
- Modo degradado (sin Gemini) ejecuta funciones deterministas, genera resumen estratégico propio
- Paleta: acento naranja #EA5103 (warning mapea a dorado, no usar para naranja)
- YouTube API quota optimizada: Uploads Playlist (2 unids) + Videos batch (1 unid) = 3 unids/ciclo vs Search API (100 unids)
- Temporal API (`@js-temporal/polyfill`) para relative time en vez de `Date` manual

## Progress

### Done (Sprints 7–13 — ver detalles en historial previo)

Resumen de features completadas pre-Sprint 14:
- YouTube metrics, Smart Shorts, selectBestVideo, engagementRate, Metrics cache
- Degraded mode, Pulse visual feedback, Relative time
- Auth JWT multi-tenant, Onboarding 3-step, Auto-pitch toggle, Daily Digest
- Contract Auditor (PDF upload + Gemini analysis + fallback regex)
- Audience Intelligence (YouTube comments analysis: sentiment, themes, questions)
- Premium Visual Pass (dark theme, glassmorphism, glow, count-up, typography)
- Impeccable passes (harden, typeset, distill, quieter, polish, adapt)

### Done (Sprint 14 — Pipeline Visual de Deals)

- **`/deals` page (replaces `/pitches`)**: Kanban board with 3 columns (Draft, Sent, Responded)
- **`@dnd-kit` drag & drop**: Cards draggable between columns with real-time status update via `PATCH /api/pitches/:id/status`
- **`PATCH /api/pitches/:id/status` endpoint**: Allows moving deals between columns. Validates transitions (no sent -> draft_ready)
- **`useDeals` hook**: Only fetches pitch_drafts (no leads — auto-pitch generates pitches immediately)
- **`DealBoard` component**: Board view + List view toggle. PipelineSummary bar with win rate (3 columns)
- **`DealColumn` component**: Droppable column with count header and scrollable card list
- **`DealCard` component**: Sortable card with brand avatar, email, urgency badge (>3d), quick action hover button
- **`DealDetailSheet` component**: Redesigned Radix Sheet with solid background, generous spacing, editable pitch content, timeline, original email collapsible, send/response actions
- **Migration `006_pipeline_snippet.sql`**: Adds `snippet` column to `processed_emails`
- **Migration `007_processed_emails_subject.sql`**: Adds `subject` column to `processed_emails`
- **Migration `008_thread_id.sql`**: Adds `thread_id` column to `processed_emails` with index
- **Route migration**: `/pitches` redirects to `/deals`. Sidebar nav updated. Keyboard shortcut `P` -> `/deals`
- **No "New" column**: Removed because auto-pitch generates drafts immediately. Pipeline: Draft → Sent → Responded

### Done (Sprint 14b/c/d — Pre-Launch Fixes)

#### Pipeline Fixes

- **BUG-1 Fix (SendPitchModal 401)**: `fetch` a `/api/pitches/:id/send` usaba `API_BASE_URL` + `getJsonHeaders()`
- **BUG-2 Fix (user_id en pitch_draft)**: `generatePitchUseCase` ahora guarda `user_id` en `agent_logs` → pitches visibles en `/deals`
- **BUG-3 Fix (Sidebar scroll)**: `overflow-hidden` → `overflow-y-auto` para evitar botón Logout recortado
- **BUG-4 Fix (Tests español)**: Textos actualizados en tests para copy en español

#### Conversation Threading

- **`fetchEmailByGmailId`**: ahora retorna `threadId` desde Gmail API
- **`generateAndDraftPitch`**: deduplica por `threadId` (no solo `gmailId`)
  - Si ya existe pitch para el thread → **NO genera nuevo draft**
  - Si pitch está `sent` y llega respuesta en el mismo thread → **auto-marcar como `responded`**
  - Guarda `latestResponseSnippet` + `latestResponseAt` del último mensaje del thread
- **`BrandDeal` entity**: agregados `threadId`, `latestResponseSnippet`, `latestResponseAt`
- **Frontend**: `UnifiedDeal` mapea los nuevos campos desde `draft.content`

#### UI Improvements

- **DealDetailSheet redesign**: background sólido (`bg-bg`), márgenes generosos (`px-6 py-6 space-y-8`), tipografía jerárquica, timeline con estados done/active/pending, sección "Email original" colapsable, **pitch editable** (input + textarea con toggle Edit/Guardar)
- **"Marcar como respondido" fix**: usa `API_BASE_URL` + `getJsonHeaders()`, feedback visual con spinner + "Actualizando...", error visible, Sheet se cierra automáticamente tras éxito
- **Última respuesta**: sección "Última respuesta de la marca" en deals `responded`, con snippet y fecha de recepción
- **Dashboard Toast**: banner dismissible verde cuando hay deals `responded`, con link a `/deals` y botón X para cerrar

#### Gmail Discovery

- `maxResults: 100` (aumentado de 20) para capturar más emails
- `q: 'newer_than:30d'` (solo emails de últimos 30 días)

### Blocked

- **runPulseCheck**: bucle Gemini + function calling con 3+ dependencias externas vivas (Gemini chat, tool executor, Supabase)

### Known Issues

- **Gmail OAuth**: Google requiere que el usuario sea "test user" aprobado en Google Cloud Console mientras la app está en "Testing" mode. Para producción, hay que pasar a "Production" mode (requiere verificación de dominio)
- **Integration tests**: 22 tests legacy skipped — requieren refactor para nuevo flujo JWT + mock de oauth_sessions
- **Supabase visibility gap**: `agent_summary` insertado en `runDegradedMode`/`runPulseCheck` no aparece en el `SELECT` posterior de `/logs` (mismo `user_id`, mismo cliente service role). Workaround: el onboarding ya no depende de detección en tiempo real

## Key Decisions

- YouTube Uploads Playlist reemplaza Search API: 3 unids/ciclo vs 100, 50x más eficiente
- Shorts detectados por duración (`contentDetails.duration`, ≤ 60s) — definición oficial de YouTube
- Proxy lazy pattern para eliminar side effects al importar (config, supabase, mcp-manager)
- sendMessageWithRetry iterativo en vez de recursivo para evitar unhandled rejection con fake timers
- Test files excluidos del build tsconfig, tsconfig.test.json separado para typechecking de tests
- Rate limiting omitido en test mode (config.NODE_ENV) para no bloquear integration tests
- framer-motion mockeado en frontend tests para evitar errores de animación en jsdom
- Temporal API para relative time (+158KB bundle, trade-off aceptado)
- Pipeline Visual: 3 columnas (Draft/Sent/Responded) sin "New" — auto-pitch genera pitches inmediatamente
- Conversation threading por `threadId`: evita duplicados cuando la marca responde al mismo hilo

## Test Stats

- **Total tests**: 251 (173 backend + 78 frontend)
- **Test files**: 23 (11 backend + 12 frontend)
- **Build**: pasa con 0 errores (frontend + backend)
- **TypeScript**: `pnpm typecheck` pasa, `pnpm --filter calibre-dashboard build` pasa

## Stats Actuales (Post-Sprint 14)

- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS bundle 763KB (+101KB por dnd-kit + nuevos features), CSS 140KB (+4KB)
- **Tests backend**: 173 passing, 22 skipped
- **Tests frontend**: 78/78 passing
- **TypeScript**: 0 errores backend + frontend
- **Rama activa**: `feature/mvp-testing`

## Next Steps / Roadmap

### Pre-Launch (antes de beta)
- [ ] **Testing manual end-to-end**: ejecutar `MANUAL_TESTING.md` checklist completo
- [ ] **Landing Page**: Presencia pública en inglés para Google for Startups (repo aparte)
- [ ] **Integration tests**: Re-escribir 22 tests de integración para nuevo flujo JWT

### Post-MVP
- [ ] **Brand Identity / Agent Persona**: Definir nombre, tono de voz, visual identity del agente de Calibre
- [ ] **Job Queue**: BullMQ o pgboss para escalabilidad
- [ ] **Rate limiting por usuario**: 1 pulse cada 6h
- [ ] **Multi-tenant Agency**: Una cuenta con múltiples creadores (tabla `creators` + `user_creators`)
- [ ] **TikTok/Instagram**: Evaluado: TikTok primero (menor fricción de onboarding)
- [ ] **Timezone configurable**: guardar `timezone` del usuario y correr cron filtrando `hora_local = 8am`

## Relevant Files

- `src/app.ts`: Express app con routes, global error handler y rate limiting
- `src/index.ts`: startup + auto-pulse scheduler (itera usuarios con auto_pitch_enabled)
- `src/shared/config.ts`: Proxy lazy para env validation
- `src/infrastructure/supabase/supabase-client.ts`: Proxy lazy para createClient
- `src/infrastructure/mcp/mcp-manager.ts`: Proxy lazy, spawn postergado, clase exportada para testing
- `src/domains/agent-core/heartbeat/pulse.ts`: sendMessageWithRetry iterativo, runPulseCheck/runDegradedMode con autoPitchEnabled
- `src/domains/agent-core/reasoning/tool-executor.ts`: Gmail discovery, pitch generation, conversation threading by threadId
- `src/routes/auth.routes.ts`: JWT auth routes + PATCH /auth/me para actualizar perfil
- `src/domains/brand-deals/entities/brand-deal.ts`: BrandDeal entity con threadId, latestResponseSnippet, latestResponseAt
- `src/domains/brand-deals/use-cases/generate-pitch.ts`: generatePitchUseCase con userId persistence
- `tsconfig.test.json`: config separada para typecheck de tests
- `vitest.config.ts`: config raíz backend
- `apps/web/vite.config.ts`: config frontend con test settings
- `apps/web/src/styles/globals.css`: tema dark premium con glow orbs, glassmorphism, `.glow-border`
- `apps/web/src/contexts/AuthContext.tsx`: JWT auth context con updateUser optimista
- `apps/web/src/pages/Dashboard.tsx`: Dashboard con Daily Brief, SuggestedAction, AudienceInsights, toast para responded deals
- `apps/web/src/pages/Deals.tsx`: pipeline visual kanban (Draft/Sent/Responded)
- `apps/web/src/components/DealBoard.tsx`: kanban board con DndContext, drag overlay, board/list toggle
- `apps/web/src/components/DealDetailSheet.tsx`: Sheet lateral con timeline, email original, pitch editable, última respuesta
- `apps/web/src/components/PipelineSummary.tsx`: barra de métricas del pipeline (counts, win rate)
- `apps/web/src/hooks/use-deals.ts`: fetching de `/logs?type=pitch_draft` (sin leads)
- `migrations/006_pipeline_snippet.sql`: agrega `snippet` a `processed_emails`
- `migrations/007_processed_emails_subject.sql`: agrega `subject` a `processed_emails`
- `migrations/008_thread_id.sql`: agrega `thread_id` a `processed_emails`
- `scripts/clean-database.sql`: reset total de DB para testing desde cero
- `MANUAL_TESTING.md`: checklist de 12 flujos end-to-end
