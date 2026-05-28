# Tests — Documentación Completa

## Resumen

| Archivo de Test | Archivo SUT | Tests | Tipo | Prioridad |
|---|---|---|---|---|---|
| `metrics-service.test.ts` | `metrics-service.ts` | 45 | Unit | 🔴 Alta |
| `metrics-cache.test.ts` | `metrics-cache.ts` | 9 | Unit | 🔴 Alta |
| `youtube.test.ts` | `content-pipeline/tools/youtube.ts` | 7 | Unit | 🔴 Alta |
| `tool-executor.test.ts` | `agent-core/reasoning/tool-executor.ts` | 16 | Unit | 🔴 Alta |
| `pulse.test.ts` | `agent-core/heartbeat/pulse.ts` | 12 | Unit | 🔴 Alta |
| `mcp-manager.test.ts` | `mcp/mcp-manager.ts` | 37 | Unit | 🔴 Alta |
| `calculate-sponsorship.test.ts` | `brand-deals/use-cases/calculate-sponsorship.ts` | 12 | Unit | 🟡 Media |
| `generate-pitch.test.ts` | `brand-deals/use-cases/generate-pitch.ts` | 12 | Unit | 🟡 Media |
| `api.integration.test.ts` | `app.ts` (Express routes) | 15 | Integración | 🔴 Alta |
| `PulseButton.test.tsx` | `PulseButton.tsx` | 7 | Frontend | 🟡 Media |
| `pulse-context.test.tsx` | `pulse-context.tsx` | 5 | Frontend | 🟡 Media |
| `use-relative-time.test.tsx` | `use-relative-time.ts` | 8 | Frontend | 🟡 Media |
| `Layout.test.tsx` | `Layout.tsx` | 4 | Frontend | 🟡 Media |
| `SendPitchModal.test.tsx` | `SendPitchModal.tsx` | 6 | Frontend | 🟡 Media |
| `Dashboard.test.tsx` | `Dashboard.tsx` | 8 | Frontend | 🟡 Media |
| `MetricCard.test.tsx` | `MetricCard.tsx` | 7 | Frontend | 🟡 Media |
| `AgentIndicator.test.tsx` | `AgentIndicator.tsx` | 4 | Frontend | 🟡 Media |
| `Logs.test.tsx` | `Logs.tsx` | 8 | Frontend | 🟡 Media |
| `Sponsorship.test.tsx` | `Sponsorship.tsx` | 5 | Frontend | 🟡 Media |
| `Pitches.test.tsx` | `Pitches.tsx` | 8 | Frontend | 🟡 Media |
| `Sidebar.test.tsx` | `Sidebar.tsx` | 6 | Frontend | 🟡 Media |
| `auth-middleware.test.ts` | `auth-middleware.ts` | 5 | Unit | 🔴 Alta |
| **Total** | | **255** (179 backend + 76 frontend) | | |

> *Pulse.test.ts: 8 tests de sendMessageWithRetry + 4 tests de runDegradedMode. MCP-manager: 37 tests unitarios con mock de child_process.spawn + EventEmitter. Frontend: 76 tests en 12 archivos, todos con `createMockFetch` o mocks de framer-motion.*

---

## 1. `metrics-service.test.ts` (45 tests)

Archivo: `src/infrastructure/youtube/__tests__/metrics-service.test.ts`

### `parseISODuration` (15 tests)
Tests de conversión ISO 8601 → segundos.

| # | Input | Esperado | Categoría |
|---|-------|----------|-----------|
| 1 | `PT1H30M15S` | 5415 | Standard |
| 2 | `PT30M` | 1800 | Standard |
| 3 | `PT15S` | 15 | Standard |
| 4 | `PT1H` | 3600 | Standard |
| 5 | `PT1H30M` | 5400 | Standard |
| 6 | `PT1M30S` | 90 | Standard |
| 7 | `PT1H0M0S` | 3600 | Ceros explícitos |
| 8 | `PT0S` | 0 | Borde: duración cero |
| 9 | `PT0H0M0S` | 0 | Borde: todos cero |
| 10 | `PT` | 0 | Borde: regex matchea con grupos opcionales |
| 11 | `""` | Infinity | Borde: string vacío |
| 12 | `PT100H` | 360000 | Grande |
| 13 | `PT999S` | 999 | Grande |
| 14 | `P1DT2H` | Infinity | Malformado: días no soportados |
| 15 | `foobar` | Infinity | Malformado: sin prefijo PT |

### `isShort` (8 tests)
Duración ≤ 60s → true.

| # | Input | Esperado | Categoría |
|---|-------|----------|-----------|
| 1 | `PT15S` | true | Standard |
| 2 | `PT59S` | true | Borde: -1s del límite |
| 3 | `PT60S` | true | Borde: exactamente 60s |
| 4 | `PT61S` | false | Borde: +1s del límite |
| 5 | `PT1M` | true | 1 minuto = 60s |
| 6 | `PT1M1S` | false | 61s |
| 7 | `PT0S` | true | Duración cero |
| 8 | `PT10M` | false | Video normal |

### `isDurable` (4 tests)
Opuesto lógico de isShort.

### `hoursSince` (6 tests)
Con `vi.useFakeTimers()` congelado en `2026-05-20T12:00:00Z`.

| publishedAt | Esperado |
|---|---|
| `2026-05-19T12:00:00Z` | 24 |
| `2026-05-20T10:00:00Z` | 2 |
| `2026-05-20T11:30:00Z` | 0.5 |
| `2026-05-18T12:00:00Z` | 48 |
| `2026-05-20T12:00:00Z` | 0 |
| `2026-05-21T12:00:00Z` | -24 (futuro) |
### `selectBestVideo` (12 tests)

Algoritmo de selección del mejor video (prioridad: maduro > 24h → más reciente no-Short → Short más reciente → null).

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Array vacío | null |
| 2 | Video único (non-short) | ese mismo |
| 3 | Video único (short) | ese mismo |
| 4 | Solo shorts → mejor engagement | highEng |
| 5 | Maduro 48h vs reciente 2h → maduro | mature |
| 6 | Sin maduro → más reciente no-Short | recent |
| 7 | Todos < 1h → más reciente no-Short | recent |
| 8 | Sin non-shorts → fallback Short más reciente | recentShort |
| 9 | Shorts ignorados si hay non-shorts maduros | mature |
| 10 | Múltiples maduros → primero en array | mature-1 |
| 11 | Borde: exactamente 24h (no >24) → más reciente | recent-24h |
| 12 | Mix shorts + recent + mature → mature | mature |

---

## 2. `metrics-cache.test.ts` (9 tests)

Archivo: `src/infrastructure/youtube/__tests__/metrics-cache.test.ts`

Mock: `vi.mock('supabase-client')` con hoisted fns.

### `getCachedMetrics` (6 tests)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Cache válido (age < TTL) | Retorna datos |
| 2 | Cache expirado (age > TTL) | null |
| 3 | Age exactamente igual a TTL (no >) | Retorna datos |
| 4 | Sin datos en DB | null |
| 5 | Error de DB | null |
| 6 | Excepción lanzada | null |

### `setCachedMetrics` (3 tests)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Upsert exitoso | No lanza, llama con params correctos |
| 2 | Error en upsert | No lanza (warning) |
| 3 | Excepción lanzada | No lanza |

---

## 3. `youtube.test.ts` (7 tests)

Archivo: `src/domains/content-pipeline/tools/__tests__/youtube.test.ts`

Mock: cache, metrics-service, youtube-mock.

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Cache hit → retorna sin llamar API | cached data |
| 2 | Cache miss → API success → persiste | API data |
| 3 | API quotaExceeded → mock | mock data |
| 4 | API 403 → mock | mock data |
| 5 | API generic error → mock | mock data |
| 6 | API success pero cache save fails | API data (no bloqueante) |
| 7 | error.toString() contiene "403" | mock data |

---

## 4. `tool-executor.test.ts` (16 tests)

Archivo: `src/domains/agent-core/reasoning/__tests__/tool-executor.test.ts`

Funciones puras duplicadas del source (no exportadas).

### `normalizeEmail` (8 tests)

| # | Input | Esperado |
|---|-------|----------|
| 1 | `"John Doe <john@test.com>"` | `john@test.com` |
| 2 | `<john@test.com>` | `john@test.com` |
| 3 | `john@test.com` (sin brackets) | `john@test.com` |
| 4 | `"Jane Doe" <jane@test.com>` | `jane@test.com` |
| 5 | `John <JOHN@TEST.COM>` | `john@test.com` (lowercase) |
| 6 | `"  John <john@test.com>  "` | `john@test.com` (trim) |
| 7 | `"John <Doe>" <john@test.com>` | `john@test.com` |
| 8 | `""` | `""` |

### `decodeRFC2047` (8 tests)

| # | Input | Esperado |
|---|-------|----------|
| 1 | `=?UTF-8?B?QXN1bnRvOiBwcsOzdmVjaGE=?=` | `Asunto: próvecha` |
| 2 | `Hello world` | `Hello world` |
| 3 | `Re: =?UTF-8?B?YXN1bnRv?=` | `Re: asunto` |
| 4 | Múltiples partes: `=?UTF-8?B?aG9sYQ==?= =?UTF-8?B?bcOhcw==?=` | `hola más` |
| 5 | `=?UTF-8?B?SG9sYSBtdW5kbw==?=` | `Hola mundo` |
| 6 | `=?UTF-8?Q?hello?=` (Q encoding no soportado) | mismo texto |
| 7 | `="" ` | `="" ` |
| 8 | String sin match | unchanged |

---

## 5. `pulse.test.ts` (7 tests)

Archivo: `src/domains/agent-core/heartbeat/__tests__/pulse.test.ts`

Mock: `chat.sendMessage`. Usa `vi.useFakeTimers()` y `vi.advanceTimersByTimeAsync()`.

### `sendMessageWithRetry` (7 tests)

| # | Escenario | Resultado |
|---|-----------|-----------|
| 1 | Éxito en primer intento | Retorna resultado |
| 2 | 429 con retryDelay → reintenta → éxito | success |
| 3 | 429 sin retryDelay → usa default 15s → éxito | success |
| 4 | retryDelay > 30s → cap a 30s | success |
| 5 | 3 intentos fallidos → lanza error | error429 |
| 6 | Error 401 (no 429) → lanza inmediato | auth error |
| 7 | Error 500 → lanza inmediato | server error |

---

## 6. `calculate-sponsorship.test.ts` (12 tests)

Archivo: `src/domains/brand-deals/use-cases/__tests__/calculate-sponsorship.test.ts`

Mock: Gemini siempre lanza (usa fallback mock). Supabase mockeado.

### Engagement rate (4 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | engagementRate pre-calculado → se usa | insights contiene "5.50%" |
| 2 | Sin pre-calculado → calcula desde likes+comments | insights contiene "5.50%" |
| 3 | Sin likes/comments → calcula desde views | insights contiene "50.00%" |
| 4 | Engagement muy pequeño (<0.01%) → muestra "<0.01%" | insights contiene "<0.01%" |

### Mock fallback formula (5 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | 100k subs → baseRate=200 | mention.min=200, max=300 |
| 2 | >500k subs → estimatedCpm=8 | estimatedCpm=8 |
| 3 | <500k subs → estimatedCpm=5 | estimatedCpm=5 |
| 4 | 0 subs → mention.min=0 | todos los montos en 0 |
| 5 | marketContext en fallback mock | contiene "Estimación basada" |

### Forecast structure (3 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | USD currency en todos los tiers | mention/dedicated/series.currency = "USD" |
| 2 | Persiste en agent_logs | type="sponsorship_forecast" |
| 3 | Creator name en log | creator_name="TestCreator" |

---

## 7. `generate-pitch.test.ts` (12 tests)

Archivo: `src/domains/brand-deals/use-cases/__tests__/generate-pitch.test.ts`

Mock: Gemini siempre lanza. Supabase con cadena completa.

### Mock fallback (2 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Subject formato "Propuesta: {brand} x {creator}" | subject correcto |
| 2 | Content incluye brandName y creatorName | content los contiene |

### BrandDeal entity (5 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Status draft_ready | draft.status = "draft_ready" |
| 2 | brandName y brandEmail correctos | values match input |
| 3 | Original email fields pasan al draft | gmailId, from, subject, snippet |
| 4 | detectedAt es ISO string | formato /^\d{4}-/ |
| 5 | sourceEmailSubject fallback a brandContext | correcto |

### Persistence (2 tests)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Type pitch_draft y creator_name | insert llamado con datos correctos |
| 2 | Insights incluye estilo de pitch | `casual` en insights |

### Supabase query (1 test)

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Query media_kit_update | select/eq/eq llamados correctamente |

---

---

## 8. `api.integration.test.ts` (15 tests)

Archivo: `src/__tests__/api.integration.test.ts`

Framework: `supertest` sobre la app Express. Mocks: Supabase, MCP Manager, Gmail Client.

### `GET /health` (1 test)

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Health check básico | 200, body.status "Calibre Agent is online", body.timestamp ISO |

### `GET /logs` (3 tests)

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Supabase responde OK | 200, body = fakeData |
| 2 | Filtro ?type= | 200, mockFrom('agent_logs'), mockEq('type', 'pitch_draft') |
| 3 | Supabase error | 500 |

### `GET /auth/login` (1 test)

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Redirección a Google OAuth | 302, location = URL de auth |

### `GET /pulse` (1 test)

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Disparo del agente | 200, message contiene "Ciclo del agente iniciado" |

### `POST /api/pitches/:id/send` (9 tests)

Mock por defecto: MCP healthy, Supabase configurable por test.

| # | Escenario | Esperado |
|---|-----------|----------|
| 1 | Body vacío | 400, error "requeridos" |
| 2 | Pitch no existe (404) | 404, error "Pitch no encontrado" |
| 3 | Log type no es pitch_draft | 400, error "no es un pitch" |
| 4 | Pitch ya enviado (status = sent) | 400, error "ya fue enviado" |
| 5 | Pitch no está en draft_ready | 400, error "draft_ready" |
| 6 | brandEmail vacío/inválido | 400, error "inválido" |
| 7 | MCP unhealthy → 503 | 503, error "MCP no disponible" |
| 8 | Flujo exitoso completo | 200, success=true, sent=true, result de MCP |
| 9 | Supabase update falla antes del send | 500 |

---

## 9. `PulseButton.test.tsx` (7 tests)

Archivo: `apps/web/src/components/__tests__/PulseButton.test.tsx`

Mock: `framer-motion` (para evitar errores de animación en jsdom).

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Idle state → Sparkles icon | `.lucide-sparkles` visible |
| 2 | Click en idle → llama onPulse | handler llamado 1 vez |
| 3 | Click en pulsing → NO llama | handler no llamado |
| 4 | Click en success → NO llama | handler no llamado |
| 5 | Click en error → NO llama | handler no llamado |
| 6 | Success state → Check icon | `.lucide-check` visible |
| 7 | Error state → X icon | `.lucide-x` visible |

## 10. `pulse-context.test.tsx` (5 tests)

Archivo: `apps/web/src/lib/__tests__/pulse-context.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Provider renderiza children | child tag visible |
| 2 | Estado inicial idle + lastPulseAt null | default values |
| 3 | triggerPulse setea status pulsing + llama fetch | fetch llamado con /pulse |
| 4 | setPulseStatus actualiza status | success → error → idle |
| 5 | lastPulseAt se actualiza en cada triggerPulse | second > first (fake timers) |

## 11. `use-relative-time.test.tsx` (8 tests)

Archivo: `apps/web/src/lib/__tests__/use-relative-time.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | < 1 min ago | "Just now" |
| 2 | 5 min ago | "5m ago" |
| 3 | 2 hours ago | "2h ago" |
| 4 | ~1 day ago | "Yesterday" |
| 5 | 3 days ago | "3d ago" |
| 6 | null/undefined input | "" |
| 7 | Invalid ISO string | original string passthrough |
| 8 | RelativeTime component render | "2h ago" visible |

## 12. `Layout.test.tsx` (4 tests)

Archivo: `apps/web/src/components/__tests__/Layout.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Renderiza children | child div visible |
| 2 | Muestra AgentIndicator y PulseButton | "AI Agent Active" + al menos 2 buttons |
| 3 | Auto-clear success tras 2s | status idle después de advanceTimersByTime(2000) |
| 4 | Auto-clear error tras 2s | status idle después de advanceTimersByTime(2000) |

## 13. `SendPitchModal.test.tsx` (6 tests)

Archivo: `apps/web/src/components/__tests__/SendPitchModal.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Renderiza brand name y email | "TechBrand" y "partner@techbrand.com" visible |
| 2 | Renderiza subject y content del pitch | display values |
| 3 | Toggle edit mode | Edit → Done Editing |
| 4 | Send llama fetch POST con datos correctos | body con subject + content |
| 5 | Accordion original email toggle | snippet visible tras click |
| 6 | Close button llama onClose | handler llamado |

## 14. `Dashboard.test.tsx` (8 tests)

Archivo: `apps/web/src/pages/__tests__/Dashboard.test.tsx`

Wrapped in `<ThemeProvider>` + `<PulseProvider>` + `<MemoryRouter>`. Fetch mockeado con `mockFetchResponse`.

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Fetch logs on mount | fetch('http://localhost:8080/logs') |
| 2 | MetricCards con datos reales | "150,000", "5,000,000", "4.5", "$1,000" |
| 3 | Daily Brief cuando agent_summary | "Daily Brief" + "Resumen diario" |
| 4 | Pending Pitches count | "1" + "Pending Pitches" |
| 5 | Creator name y followers | "midudev" + "150,000 Followers" |
| 6 | API vacía no crashea | "Pro Creator" renderizado |
| 7 | Polling con lastPulseAt set | No error |
| 8 | Network error graceful | "Pro Creator" renderizado |

## 15. `auth-middleware.test.ts` (5 tests)

Archivo: `src/__tests__/auth-middleware.test.ts`

Mock: `vi.mock('../shared/config.js')` con objeto config mutable.

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Sin `AUTH_API_KEY` configurada → pasa | next() llamado |
| 2 | `x-api-key` correcto → pasa | next() llamado |
| 3 | `x-api-key` faltante | 401, error "No autorizado" |
| 4 | `x-api-key` incorrecto | 401, error "No autorizado" |
| 5 | Modo test salta auth aunque haya key | next() llamado |

## Cobertura completa ✅

Todos los módulos críticos tienen tests. `runPulseCheck` — el último pendiente — fue resuelto con inyección de dependencias opcionales.

---

## 16. `MetricCard.test.tsx` (7 tests)

Archivo: `apps/web/src/components/__tests__/MetricCard.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Render label y valor formateado | `150,000` visible con label "Followers" |
| 2 | Trend positivo | `+15%` con clase `text-success` |
| 3 | Trend negativo | `-8%` con clase `text-red-500` |
| 4 | Icon rendering | `.lucide-users` visible |
| 5 | Prefix y suffix | `$`, `5,000`, `/mo` visibles |
| 6 | Accent styles | clase `border-accent` presente |
| 7 | Sin trend | no hay elementos con `%` |

## 17. `AgentIndicator.test.tsx` (4 tests)

Archivo: `apps/web/src/components/__tests__/AgentIndicator.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Render "AI Agent Active" | texto visible |
| 2 | Default counts (0, 0) | `0 logs · 0 pitches` |
| 3 | Custom counts | `42 logs · 7 pitches` |
| 4 | Link a /logs | `href="/logs"` |

## 18. `Logs.test.tsx` (8 tests)

Archivo: `apps/web/src/pages/__tests__/Logs.test.tsx`

Mock: `createMockFetch` con logs de 4 tipos distintos.

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Fetch on mount | `called('logs')` true |
| 2 | Render entries con labels | 4 entries con sus insights visibles |
| 3 | Filtro por tipo | click "Pitches" → solo pitch visible |
| 4 | Búsqueda por texto | search "pitch" → filtra correctamente |
| 5 | Empty state con filtro | `No results found` + `Try adjusting...` |
| 6 | Empty state sin datos | API vacía → empty state |
| 7 | Network error | no crashea, empty state aparece |
| 8 | Loading skeleton | `.animate-pulse` presente durante fetch |

## 19. `Sponsorship.test.tsx` (5 tests)

Archivo: `apps/web/src/pages/__tests__/Sponsorship.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Fetch on mount | `called('logs')` true |
| 2 | Header y CPM hero | `Sponsorship Rates` + `Your CPM` + `$22.50` |
| 3 | Fallback CPM | API vacía → `$18.50` (fallback) |
| 4 | Header consistente | `AI-powered pricing...` visible |
| 5 | Network error → fallback | `$18.50` visible, no crashea |

## 20. `Pitches.test.tsx` (8 tests)

Archivo: `apps/web/src/pages/__tests__/Pitches.test.tsx`

Mock: 3 pitches con statuses distintos (draft_ready, sent, responded).

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Fetch on mount | `called('logs')` true |
| 2 | Render cards con brand info | `TechBrand`, email, subject, status |
| 3 | Tabs filtran correctamente | click "Sent" → solo `GameCorp` visible |
| 4 | Review & Send para draft_ready | botón visible en tab Pending |
| 5 | Sin Review & Send para sent | botón NO visible en tab Sent |
| 6 | Empty state | `No pending pitches` + explicación |
| 7 | Sorting por fecha | solo pitches del tab activo visibles |
| 8 | Network error graceful | empty state, no crashea |

## 21. `Sidebar.test.tsx` (6 tests)

Archivo: `apps/web/src/components/__tests__/Sidebar.test.tsx`

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Nav items | Dashboard, Activity, Pitches, Rates |
| 2 | Bottom items | Settings, Help |
| 3 | Active route highlight | `/pitches` → link Pitches con `text-accent` |
| 4 | Fetch profile data | `called('logs')` true |
| 5 | Fallback profile | `Sarah Chen` + `Pro Creator` antes de fetch |
 | 6 | Theme toggle | botón "Dark Mode"/"Light Mode" visible |

## 22. `pulse.test.ts` — `runPulseCheck` (8 tests)

Archivo: `src/domains/agent-core/heartbeat/__tests__/pulse.test.ts`

Mock: Inyección de dependencias opcionales (`PulseCheckDeps`). Cada test inyecta mocks controlados de `startChat`, `executeToolCall`, `supabase`, `runDegradedMode`, `config`, `sendMessageWithRetry`.

| # | Escenario | Verificación |
|---|-----------|-------------|
| 1 | Single round: 1 function call + respuesta final | `executeToolCall` 1 vez, Supabase insert con `agent_summary` |
| 2 | Multi-round: 2+ iteraciones de function calls | `executeToolCall` 3 veces (1+2), resumen final persistido |
| 3 | Sin function calls: respuesta directa | `executeToolCall` NO llamado, resumen persistido |
| 4 | 429 error en primer mensaje: fallback a degraded | `runDegradedMode` llamado con channelId correcto |
| 5 | Retry exitoso: 429 luego retry → success | `runDegradedMode` NO llamado, resumen persistido |
| 6 | Error no-429 (500): loguea y termina | `runDegradedMode` NO llamado, NO persiste resumen |
| 7 | Error en executeToolCall: se propaga y loguea | `console.error` llamado, no persiste summary |
| 8 | Prompt incluye channelId y tools | primer mensaje contiene `UC-prompt-test`, `getPreviousInsights`, `listEmails`, `calculateSponsorshipValue` |

## Notas técnicas

- `index.ts` ya no tiene routes — se refactorizó a `app.ts` (routes) + `index.ts` (solo startup). Los tests de integración usan `app.ts` directamente con supertest, sin levantar un puerto real.
- Config de vitest (`include: ['src/**/*.test.ts']`) captura automáticamente los tests de integración sin cambios adicionales.
- `supertest` (v7) es compatible con Express nativamente — no requiere levantar servidor HTTP.
- Frontend tests corren con `vitest` + `jsdom` + `@testing-library/react`. Config en `apps/web/vite.config.ts`.
- `framer-motion` se mockea en frontend tests para evitar errores de animación en jsdom.
- Rate limiting (`express-rate-limit`) se omite automáticamente en test mode (`NODE_ENV=test`) para no bloquear integration tests.
- `tsconfig.test.json` extiende `tsconfig.json` con `strictNullChecks` relajado para tests que acceden a `mock.calls[0]`.
- Scripts disponibles: `pnpm typecheck` (src principal), `pnpm typecheck:tests` (solo tests), `pnpm typecheck:all` (ambos).
