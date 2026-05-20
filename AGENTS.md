# AGENTS.md — Project Memory & Progress

## Goal
Sprint 5 (YouTube API optimization + engagement rate) y Sprint 6 polish (pulse feedback visual, relative time con Temporal, fix historial de pitches, pending pitches card).

## Constraints & Preferences
- Sin tests automatizados aún
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
- **Metrics cache**: `channel_metrics_cache` con upsert a Supabase (TTL 1h). Error `permission denied` atrapado, no crítico
- **Degraded mode summary**: `runDegradedMode` captura métricas, insights previos, forecast, marca nombres → genera resumen narrativo → persiste como `agent_summary`
- **Pulse feedback visual**: 3 estados en `PulseButton` — idle (Sparkles naranja), pulsing (círculo expandido + fondo verde + dots saltando + ondas expansivas), success (check spring) / error (X shake). Auto-clear 2s
- **PulseStatus state machine**: `pulse-context` expandido con `pulseStatus: 'idle' | 'pulsing' | 'success' | 'error'`. Dashboard setea `success` al detectar nuevo `agent_summary`, `error` tras timeout 60s
- **Relative time with Temporal**: hook `useRelativeTime` + componente `<RelativeTime>` usando `Temporal.Instant.since()`. Auto-refresh cada 30s. Implementado en Logs.tsx, LogEntryCard.tsx, Dashboard.tsx
- **Logs limit increase**: `/logs` endpoint LIMIT 50 → 200 para evitar que pitches históricos desaparezcan de la UI
- **Pending Pitches square card**: card cuadrada naranja oscura (`aspect-square`, `lg:col-span-4`) ubicada primera en el bento grid del Dashboard, con número grande, glow sutil y entrada spring en vez del banner full-width anterior
- **Commit history**: commits separados (pnpm migration → features Sprint 4-5 → docs → fix logs limit → sprint 6 polish)
- **Branch**: `feature/sprint-6-ux-polish` creada desde `develop`

### In Progress
- *(none)*

### Blocked
- **YouTube metrics cache**: upsert a `channel_metrics_cache` falla con `permission denied`. Requiere ejecutar `GRANT ALL ON channel_metrics_cache TO service_role;` en Supabase SQL Editor. No bloqueante — sistema funciona sin caché

## Key Decisions
- YouTube Uploads Playlist reemplaza Search API: 3 unids/ciclo vs 100, 50x más eficiente, source of truth real de uploads del canal
- Shorts detectados por duración (`contentDetails.duration`, ≤ 60s) en vez de heurísticas. Es la definición oficial de YouTube
- Temporal API para relative time en vez de `date-fns` (ya instalado pero no se usaba). Políticamente correcto pero +158KB bundle
- Pulse feedback sin Lottie: 3 dots animados + ondas expansivas con Framer Motion alcanzan para el efecto radar/scanning deseado
- Commits separados por tema (infra → features → docs → fix) en vez de un solo commit gigante
- Pending Pitches como card cuadrada en bento grid en vez de banner full-width para mantener consistencia visual con el resto del dashboard

## Next Steps
1. **Fix caché YouTube**: ejecutar `GRANT ALL ON channel_metrics_cache TO service_role;` en Supabase SQL Editor para que el cache funcione
2. **Rate limiting interno**: cola de requests a Gemini para no quemar cuota tan rápido
3. **Tests frontend**: setup Vitest + tests básicos de componentes
4. **Limpiar componentes no usados**: LogEntryCard, PitchCard

## Critical Context
- El modo degradado (`runDegradedMode`) ahora genera y persiste `agent_summary` → Daily Brief visible en Dashboard incluso sin Gemini
- Engagement se calcula server-side como `(likes+comments)/subscribers*100` y llega pre-calculado a todos los consumidores
- `lastVideoViews` dejó de usarse para engagement; ahora es solo informativo
- Si el canal solo sube Shorts, el algoritmo selecciona el de más interacción (likes+comments) — no se rompe
- Bundle size: ~610KB (~185KB gzip), subió ~158KB por `@js-temporal/polyfill`
- El endpoint `/logs` devolvía solo 50 registros — pitches históricos quedaban fuera. Subido a 200
- Pending Pitches card naranja oscura: primera en bento grid, `aspect-square`, con gradiente `#b33a00 → #8a2b00` y glow

## Relevant Files
- `src/infrastructure/youtube/metrics-service.ts`: Uploads Playlist, `selectBestVideo`, `engagementRate`, filtro Shorts por duración
- `src/infrastructure/youtube/metrics-cache.ts`: cache layer con TTL 1h, upsert a Supabase
- `src/domains/content-pipeline/tools/youtube.ts`: cache-aware wrapper, mock fallback si API falla
- `src/domains/content-pipeline/tools/youtube-mock.ts`: mock con `engagementRate`
- `src/domains/agent-core/heartbeat/pulse.ts`: modo degradado genera resumen narrativo. `engagementRate` en `updateLiveMediaKit` y `calculateSponsorshipValue`
- `src/domains/brand-deals/use-cases/calculate-sponsorship.ts`: acepta `engagementRate` directo o lo calcula desde likes/comments
- `src/domains/agent-core/reasoning/tool-executor.ts`: pasa `engagementRate` en handlers
- `src/domains/agent-core/reasoning/tools-definition.ts`: schemas con `engagementRate`, `lastVideoLikes`, `lastVideoComments`
- `src/index.ts`: `/logs` LIMIT 200
- `apps/web/src/lib/pulse-context.tsx`: `PulseStatus` type, `setPulseStatus` en contexto
- `apps/web/src/components/PulseButton.tsx`: 3 estados visuales con Framer Motion (ondas, dots, check/x)
- `apps/web/src/components/Layout.tsx`: pasa `pulseStatus`, auto-clear success/error 2s
- `apps/web/src/pages/Dashboard.tsx`: polling setea `setPulseStatus('success')` al detectar `agent_summary`. RelativeTime dinámico. Pending Pitches square card
- `apps/web/src/lib/use-relative-time.tsx`: hook `useRelativeTime` + componente `<RelativeTime>` con Temporal. Auto-refresh 30s
- `apps/web/src/pages/Logs.tsx`: usa `<RelativeTime>` en reemplazo de `formatDate()` manual
- `apps/web/src/components/LogEntryCard.tsx`: usa `<RelativeTime>` en reemplazo de `formatDate()` inline
