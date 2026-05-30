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

### Done (Sprint 14 — COMPLETO)

#### BUG-5 Fix (Conversation Threading Robustness)

**Root cause**: `generateAndDraftPitch` deduplicaba por `threadId` en `agent_logs`, pero pitches antiguos (pre-threading fix) no tenían `threadId` guardado en `content`, y reply emails no se guardaban en `processed_emails`.

**Fixes**:
- **DEDUP 2a**: Buscar `thread_id` en `processed_emails` (no solo en `agent_logs`). Si ANY email del thread ya fue procesado → es un reply.
- **Always save reply**: Cuando se detecta un reply (thread ya procesado), el email se guarda en `processed_emails` de todos modos, evitando re-procesamiento en cada pulse.
- **Only update if sent**: Solo marca como `responded` si `status === 'sent'` (no si ya está `responded`).
- **Celebrated UI**: `DealDetailSheet` muestra "¡La marca respondió!" con icono `PartyPopper`, fondo verde `bg-success/10`, animación de entrada, y fallback para deals sin snippet.

#### BUG-6 Fix (Send Pitch as Reply — Thread Preservation)

**Root cause**: El pitch se enviaba como email NUEVO (sin `threadId`), creando un nuevo Gmail thread. Cuando la marca respondía, el reply tenía un `threadId` diferente al guardado en el draft, rompiendo la deduplicación.

**Fixes**:
- **MCP `send_email` tool**: Ahora acepta `threadId` opcional y lo pasa a `gmail.users.messages.send` en `requestBody.threadId`
- **`POST /api/pitches/:id/send`**: Pasa `pitch.threadId` al MCP cuando envía
- **Resultado**: El pitch se envía como reply dentro del mismo thread. La respuesta de la marca tiene el mismo `threadId` y el dedup funciona correctamente.
- **Verified end-to-end**: Flujo completo probado manualmente — reply de marca detectado, pitch marcado como `responded`, snippet visible en UI.

### Done (Sprint 14f — Backend Bug Fixes + Timezone Digest)

#### Timezone-per-User Digest

- **Migración `009_user_timezone.sql`**: agrega `timezone TEXT DEFAULT 'UTC'` y `last_digest_sent_at TIMESTAMPTZ` a tabla `users`
- **`tickDigestScheduler()`**: nueva función en `digest-service.ts` — corre cada hora, calcula hora local de cada usuario con `toLocaleString('en-US', { timeZone })`, envía digest a las 8am local si no se envió hoy
- **Cron refactoreado**: de `0 8 * * *` (una vez al día, fijo Europe/Rome) a `0 * * * *` (cada hora + filtro por timezone del usuario)
- **Frontend captura timezone**: `OnboardingPage` envía `Intl.DateTimeFormat().resolvedOptions().timeZone` al primer mount
- **AuthUser + updateMeSchema**: incluyen `timezone` y `email_digest_enabled`

#### Backend Bug Fixes

- **B1 Fix (Pitch status revert)**: Si el envío MCP falla después de marcar el pitch como `sent`, se revierte a `draft_ready` en el catch block (best-effort). Flag `updateCommitted` controla si el pre-update fue exitoso.
- **B2 Fix (JWT_SECRET mandatory)**: `z.string().min(32)` sin default. La app hace `process.exit(1)` si falta la env var.
- **B4 Fix (PII removal)**: Eliminados console.log con asuntos de email, direcciones de usuario y email del usuario de tool-executor.ts

### Blocked

- **runPulseCheck**: bucle Gemini + function calling con 3+ dependencias externas vivas (Gemini chat, tool executor, Supabase)

### Known Issues

- **Gmail OAuth**: Google requiere que el usuario sea "test user" aprobado en Google Cloud Console mientras la app está en "Testing" mode. Para producción, hay que pasar a "Production" mode (requiere verificación de dominio)
- **Supabase visibility gap**: `agent_summary` insertado en `runDegradedMode`/`runPulseCheck` no aparece en el `SELECT` posterior de `/logs` (mismo `user_id`, mismo cliente service role). Workaround: el onboarding ya no depende de detección en tiempo real
- **Threading edge case**: Si el usuario responde al email original antes de que Calibre envíe el pitch (raro), el threadId del reply del usuario puede crear un nuevo thread en Gmail. Solución: enviar pitch rápidamente o usar `In-Reply-To` / `References` headers para threading más robusto

## Beta Readiness Assessment

### CRITICAL — Fix before beta launch

| # | Bug | Archivo | Fix |
|---|---|---|---|
| B1 | **Pitch status no se revierte si falla envío** | `app.ts:231-254` | ✅ Revert status a `draft_ready` en catch block (best-effort) |
| B2 | **JWT_SECRET con default hardcodeado** | `config.ts:14` | ✅ Min 32 chars, sin default. App no arranca si falta |
| B3 | **oAuth2Client compartido globalmente** | `gmail-client.ts` | Mitigado para beta (5 usuarios, secuencial). Bloqueante para multi-tenant |
| B4 | **Timezone mismatch en digest** | `index.ts:47` | ✅ Refactorizado: cron cada hora + `tickDigestScheduler()` con timezone por usuario |

### HIGH — Tech debt to address post-beta

#### Backend
| Problema | Esfuerzo | Impacto |
|---|---|---|
| `app.ts` monolítico (552 líneas, 10+ routes inline) — extraer a route modules como `auth.routes.ts` | Medio | Mantenibilidad |
| Service role key de Supabase bypassa RLS — un `.eq('user_id')` perdido = data leak cross-tenant | Alto | Seguridad |
| `console.log` con PII (asuntos de email, dirección de usuario) en producción | Bajo | Privacidad |
| 165 console.log/warn/error — no hay structured logging (`winston` instalado pero no usado) | Medio | Observabilidad |
| Sin paginación en `/logs` (limit 200 hardcodeado) | Bajo | Performance |
| Dead deps: `winston`, `pino-pretty`, `@google-cloud/secret-manager` | Bajo | Limpieza |
| Dead code: `test-models.ts`, `shared/oauth-state.ts`, `shared/auth-middleware.ts` re-export | Bajo | Limpieza |
| MCP server como child process con flags deprecated (`--experimental-modules`) | Alto | Estabilidad |

#### Frontend
| Problema | Esfuerzo | Impacto |
|---|---|---|
| Sin code splitting — bundle completo se carga en first load (765KB JS) | Medio | Performance |
| `@js-temporal/polyfill` (158KB) para "hace 3h" — reemplazable con 20 líneas nativas | Bajo | Bundle size |
| Sin Error Boundary — si un componente crashea, pantalla blanca | Bajo | Confiabilidad |
| `recharts` instalado pero GrowthChart usa SVG custom — dead dep (~30KB) | Bajo | Bundle size |
| Idioma mixto español/inglés ("Deals" + "Tarifas" + "Pending Pitches") | Bajo | UX |
| `Pitches.tsx` dead code (195 líneas + tests) — ruta redirige a Deals | Bajo | Limpieza |
| `Layout.tsx` y `Dashboard.tsx` fetchean `/logs` redundante en paralelo | Bajo | Performance |
| Gmail reconnect logic duplicada en 3 archivos | Bajo | DRY |
| `Dashboard.tsx` (583L) y `DealDetailSheet.tsx` (688L) — componentes gigantes | Medio | Mantenibilidad |

### Test Coverage Gaps

**Componentes core sin tests** (mayor riesgo para beta):
- `DealBoard.tsx` + `DealDetailSheet.tsx` — 0 tests para el componente principal del producto
- `useDeals` hook — 0 tests para transformación API → UI
- Onboarding flow (3 steps) — 0 tests
- `AuthContext` frontend — 0 tests para login/register/logout
- Conversation threading dedup — 0 tests para la lógica más compleja de Sprint 14
- Contract audit — solo test de import, 0 behavioral tests

**Tests frágiles detectados:**
- `tool-executor.test.ts` copia funciones en vez de importarlas — no catchea regressions
- `digest-service.test.ts` y `audit-contract.test.ts` solo verifican que el módulo importa
- `Pitches.test.tsx` testea la página legacy que ya no está en rutas activas

### Veredicto para beta cerrada (5 usuarios)

**Launch recomendado** con los 4 fixes inmediatos (B1-B4). El core value prop funciona, el degraded mode provee safety net, y el test suite (285 tests) cubre los flujos críticos de API.

**Post-launch, en este orden:**
1. Error Boundary + code splitting (1-2 días)
2. Quitar Temporal polyfill por implementación nativa (30 min)
3. Extraer routes de app.ts (1 día)
4. Tests de DealBoard + useDeals + Onboarding (2-3 días)
5. Structured logging reemplazando console.* (1 día)

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
- Send pitch as reply within same `threadId`: critical for dedup to work end-to-end. Gmail creates new thread if `threadId` not passed
- Fallback dedup: `threadId` → `gmailId` → `processed_emails.thread_id` — covers old pitches without stored `threadId`
- Always save reply emails to `processed_emails` even when skipping pitch generation

## Test Stats

- **Total tests**: 285 (207 backend + 78 frontend)
- **Test files**: 23 (15 backend + 12 frontend)
- **Skipped tests**: 0
- **Build**: pasa con 0 errores (frontend + backend)
- **TypeScript**: `pnpm typecheck` pasa, `pnpm --filter calibre-dashboard build` pasa

## Stats Actuales (Post-Sprint 14e — Threading VERIFIED)

- **Build backend**: ✅ 0 errores
- **Build frontend**: ✅ 0 errores, JS bundle 765KB, CSS 140KB
- **Tests backend**: 207 passing, 0 skipped
- **Tests frontend**: 78/78 passing
- **TypeScript**: 0 errores backend + frontend
- **End-to-end threading**: ✅ VERIFIED — reply detection + auto-responded + snippet capture
- **Rama activa**: `feature/mvp-testing`

## Next Steps / Roadmap

### Pre-Launch (antes de beta)
- [x] **Testing manual end-to-end**: ✅ `MANUAL_TESTING.md` checklist completo verificado
- [x] **Threading end-to-end**: ✅ Reply detection + auto-responded + snippet capture funciona
- [x] **Integration tests**: ✅ 22 tests refactorizados — 0 skipped, cobertura JWT auth + rutas protegidas
- [x] **Fix B1**: Revertir pitch status en send failure (`app.ts:231-254`)
- [x] **Fix B2**: Obligar JWT_SECRET en .env, fallar al startup (`config.ts:14`)
- [x] **Fix B4**: Align timezone digest (`index.ts:47`)
- [ ] **Testing manual post-fixes**: Validar B1-B4, timezone digest, y todos los flujos end-to-end
- [ ] **Landing Page**: Presencia pública en inglés para Google for Startups (repo aparte)
- [ ] **Threading edge case**: Evaluar headers `In-Reply-To` / `References` para threading más robusto en Gmail

### Post-MVP
- [ ] **Error Boundary + code splitting**: React ErrorBoundary + lazy loading de rutas (1-2 días)
- [ ] **Quitar Temporal polyfill**: Reemplazar `@js-temporal/polyfill` (158KB) por implementación nativa (30 min)
- [ ] **Extract routes de app.ts**: Mover routes inline a módulos separados (1 día)
- [ ] **Tests DealBoard + Onboarding**: Tests para componentes core sin cobertura (2-3 días)
- [ ] **Structured logging**: Reemplazar 165 console.* por winston/pino (1 día)
- [ ] **Brand Identity / Agent Persona**: Definir nombre, tono de voz, visual identity del agente
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
- `src/domains/agent-core/mcp-connector/gmail-mcp-server.ts`: MCP server con tools `list_emails` y `send_email` (con `threadId` para reply)
- `apps/web/src/components/DealDetailSheet.tsx`: Sheet lateral con pitch editable, timeline, "¡La marca respondió!" celebration UI
- `migrations/009_user_timezone.sql`: agrega `timezone` y `last_digest_sent_at` a `users`
- `src/domains/digest/digest-service.ts`: `tickDigestScheduler()` con lógica de hora local por usuario
