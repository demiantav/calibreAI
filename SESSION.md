# CALIBRE — Session Context

> Última actualización: 2026-05-14

## Estado Actual

**Sprint actual:** Sprint 3 (Completado) — Visualización y Dashboard

**Rama:** `feature/dashboard`

**Último commit:** Siguiente commit — Sprint 3: dashboard, real data, dark/light mode, motion design

---

## Dashboard — estado final

### Paleta

**Light mode:** `#FFEED0` (fondo crema) · `#1A0E09` (texto) · `#EA5103` (acento)
**Dark mode:** `#120A06` (fondo) · `#FFEED0` (texto) · `#EA5103` (interacciones) · `#FFEED0` (decorativo)

### Layout

Bento grid asimétrico (12 columnas), sidebar 260px flotante glass-card, profile bar con avatar ring animado + mini-stats inline.

### Páginas (4)

| Página | Descripción |
|---|---|
| **Dashboard** | Métricas reales desde YouTube API, bento grid con insights, actividad reciente, pitches, rates |
| **Activity Log** | Timeline visual con dots conectados, filtros por tipo, búsqueda |
| **Pitches** | Grid de sponsorship proposals con cards, status badges, metadata |
| **Sponsorship** | CPM hero, rate cards (Mention/Dedicated/Series), market analysis |

### Features implementadas

- [x] Métricas reales desde YouTube Data API v3 (subscribers, totalViews, engagement)
- [x] Dark/Light mode con persistencia (localStorage)
- [x] Animaciones motion design: 3D tilt en MetricCards, staggered entrance, page transitions (AnimatePresence)
- [x] PulseButton flotante fixed (bottom-right) con animación galáctica
- [x] AgentIndicator persistente con estado de actividad
- [x] Settings/Help en sidebar + Social icons
- [x] Viewport-aware entrance animations (whileInView)

### Build actual

- 2133 módulos transformados
- 439KB JS (136KB gzip)
- 121KB CSS (19KB gzip)
- 0 errores, 0 warnings

---

## Problemas conocidos

| # | Problema | Estado |
|---|----------|--------|
| 1 | LogEntryCard y PitchCard existen pero no se usan | Se puede limpiar |
| 2 | Sin tests del frontend | Pendiente |
| 3 | Gmail API no habilitada en Google Cloud Console | Pendiente |
| 4 | YouTube API quota limit (free tier) | Pendiente — usar mock o key dedicada |
| 5 | `scripts/migrate-dashboard.sh` no incluido en repo | Excluido |

---

## Próximo paso

Sprint 4 por definir. Posibles direcciones: tests (Vitest), más integraciones (Twitter/IG), landing page pública, mejoras en Auto-Pitch.
