# CALIBRE — Session Context

> Última actualización: 2026-05-19

## Estado Actual

**Sprint actual:** Sprint 5 (En curso) — YouTube API Optimization & Engagement

**Rama:** `feature/sprint-5-youtube-optimization`

**Último commit:** `42e1dc4` — Sprint 3: dashboard, real data, dark/light mode, motion design

**Package manager:** npm

---

## Dashboard — estado final

### Paleta

**Light mode:** `#FFEED0` (fondo crema) · `#1A0E09` (texto) · `#EA5103` (acento)
**Dark mode:** `#120A06` (fondo) · `#FFEED0` (texto) · `#EA5103` (interacciones) · `#FFEED0` (decorativo)

### Layout

Bento grid asimétrico (12 columnas), sidebar 260px flotante glass-card, profile bar con avatar ring animado + mini-stats inline.

### Páginas (4)

| Página           | Descripción                                                                                               |
| ---------------- | --------------------------------------------------------------------------------------------------------- |
| **Dashboard**    | Métricas reales desde YouTube API, bento grid con insights, actividad reciente, pitches pendientes, rates |
| **Activity Log** | Timeline visual con dots conectados, filtros por tipo, búsqueda                                           |
| **Pitches**      | Grid de drafts con status badges, modal de revisión y envío (`SendPitchModal`)                            |
| **Sponsorship**  | CPM hero, rate cards (Mention/Dedicated/Series), market analysis                                          |

### Features Sprint 4 implementadas

- [x] Status `draft_ready` → `sent` → `responded` en `BrandDeal`
- [x] Endpoint `POST /api/pitches/:id/send` (valida status, MCP send_email, actualiza log)
- [x] Componente `SendPitchModal` (preview + edit + send + original email collapsible)
- [x] Badge "Draft Ready" (amarillo) + botón "Review & Send" en página de Pitches
- [x] Card compacta "Pending Pitches" en Dashboard con contador y fondo naranja
- [x] Tabs (Pending / Sent / Responded) en página Pitches
- [x] Auto-pulse al iniciar servidor (5s delay tras `app.listen`)
- [x] Decodificación RFC 2047 de subjects (elimina caracteres raros)
- [x] Extracción de `From` header en `listEmails` (corrige `unknown@email.com`)
- [x] Extracción de brandName desde `From` header
- [x] Dedup persistente: tabla `processed_emails`
- [x] Manejo no-fatal de error UPDATE en send
- [x] Daily Brief del agente (hero section en Dashboard con resumen AI)
- [x] Email original visible en modal de revisión (collapsible)
- [x] Animación AI Active con CSS keyframes (sin reinicio en re-render)
- [x] Mensaje de fallback de sponsorship sin "Gemini no disponible"

### Features Sprint 5 implementadas

- [x] YouTube metrics vía Uploads Playlist en vez de Search API (100u → 3u por ciclo)
- [x] Smart Shorts detection por duración (`contentDetails.duration`)
- [x] Algoritmo `selectBestVideo`: maduro > 24h → reciente > 1h → más visto → fallback Short
- [x] Filtro de datos inconsistentes (views=0 + likes>0 se descartan)
- [x] Engagement rate pre-calculado server-side (`(likes+comments)/subs*100`)
- [x] Cache layer (`channel_metrics_cache` con TTL 1h)
- [x] Resumen estratégico en modo degradado (agente escribe `agent_summary`)
- [x] Dashboard se auto-actualiza tras pulse (polling vía PulseContext)
- [x] Display `<0.01%` para engagement pequeño (evita `0.00%` engañoso)

### Build actual

- 2136 módulos transformados
- 451KB JS (138KB gzip)
- 124KB CSS (19KB gzip)
- 0 errores, 0 warnings

---

## Bugs encontrados en testing (pendientes de fix)

| #   | Bug                                          | Causa                                                                                          | Fix planeado                                                | Estado    |
| --- | -------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | --------- |
| 1   | **"Just now" no se actualiza**               | `formatDate()` se ejecuta una vez al renderizar. Logs de hace horas siguen diciendo "Just now" | Crear hook `useRelativeTime` con setInterval cada 30s       | Pendiente |
| 2   | **Pulse no da feedback visual**              | El botón dispara el ciclo pero la UI no muestra que está trabajando                            | Toast "Analyzing..." + AgentIndicator cambia a "Working..." | Pendiente |
| 3   | **Auto-pulse regenera pitches al reiniciar** | Sin GRANT INSERT en `processed_emails`, el dedup no funciona                                   | Ya ejecutado: `GRANT INSERT, SELECT ON processed_emails`    | ✅ Fixeado |
| 4   | **AI Active animation se reinicia**          | Framer Motion keyframes se re-crean en cada re-render                                          | Reemplazado por CSS `@keyframes` nativo                     | ✅ Fixeado |
| 5   | **"Gemini no disponible" en UI**             | Texto de fallback expuesto al usuario                                                          | Mensaje más amigable y genérico                             | ✅ Fixeado |
| 6   | **Engagement 0.0% por Shorts**              | Search API devolvía Shorts como último video. Sin filtro de duración                           | Uploads Playlist + duración + smart filter                  | ✅ Fixeado |
| 7   | **Dashboard no se actualiza tras pulse**    | Sin polling ni conexión entre Layout y Dashboard                                               | PulseContext + polling hasta detectar nuevo agent_summary   | ✅ Fixeado |
| 8   | **Degraded mode no genera resumen**         | Solo hacía console.log, no persistía `agent_summary`                                           | Resumen estratégico narrativo guardado en agent_logs        | ✅ Fixeado |

---

## Problemas conocidos

| #   | Problema                                                   | Estado             |
| --- | ---------------------------------------------------------- | ------------------ |
| 1   | LogEntryCard y PitchCard existen pero no se usan           | Se puede limpiar   |
| 2   | Sin tests del frontend                                     | Pendiente          |
| 3   | Gmail API no habilitada en Google Cloud Console            | Pendiente          |
| 4   | YouTube API quota limit (free tier, pero 3u/ciclo ahora)   | Mitigado           |
| 5   | "Just now" no se actualiza dinámicamente                   | Pendiente de fix   |
| 6   | Pulse sin feedback visual en UI                            | Pendiente de fix   |
| 7   | Cache `channel_metrics_cache` tiene error permission denied | Correr GRANT       |
| 8   | Sin rate limiting interno (cola Gemini)                    | Pendiente Sprint 5 |
| 9   | Gemini en free tier (429 frecuentes)                       | Pendiente Sprint 5 |

---

---

## Análisis de Producción (18/05/2026)

### Límites Free Tier Verificados

| Servicio | Free | Producción (con pago) | Costo est. mensual |
|---|---|---|---|
| **Gemini Flash** | 60 RPM / 1,000 RPD | 2,000 RPM / 10,000 RPD | ~$2-5 |
| **YouTube Data API** | 10,000 Q/día | Sin límite diario | ~$1-3 |
| **Gmail API** | 1B Q/día | 1B Q/día | $0 |
| **Supabase** | 500 MB DB / 2 GB BW | 8 GB DB / 50 GB BW (Pro) | $25 |

**Cuello de botella anterior:** YouTube `search` endpoint (100 unidades/ciclo) — solo ~96 pulsos/día en free tier.
**Optimizado:** Ahora usa Uploads Playlist + Videos batch (3 unidades/ciclo) + cache 1h → ~3,300 pulsos/día en free tier.

### Decisiones tomadas para producción

| Decisión | Detalle |
|---|---|
| Gemini → Pay-as-you-go | Activar facturación en Google AI Studio (sin cambios de código) |
| YouTube → Cache + pago | ✅ Cache implementado (TTL 1h). Falta fix permission denied en tabla `channel_metrics_cache`. API key con cuota paga opcional |
| Rate limiting | Implementar cola de requests Gemini + throttle 1 pulso/5min por creator |
| Supabase → Pro | Migrar cuando hayamos >3 clientes activos |
| Multi-tenant keys | YouTube/Gemini compartidas (sistema). Gmail OAuth por creator (ya listo) |

### Cambios de infraestructura

- npm → pnpm con workspace (`pnpm-workspace.yaml`: raíz + apps/web)
- Build scripts de esbuild y protobufjs aprobados
- Fallbacks actuales: mock YouTube (738K subs), mock pitch (template), mock sponsorship (subs * 0.002)

---

## Contexto de desarrollo

- **Modelo IA:** `gemini-flash-latest` (con retry para errores 429)
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Backend:** Express + Supabase + MCP (Gmail child process)
- **Auth:** Gmail OAuth2 con tokens en tabla `user_auth`
- **Nueva tabla:** `processed_emails` (gmail_id PK, brand_email, processed_at)
- **Endpoints:** `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`, `GET /auth/login`, `GET /auth/callback`
- **Package manager:** pnpm v10.30.0
