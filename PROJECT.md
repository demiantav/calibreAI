# CALIBRE — PROYECTO DE DESARROLLO (SPRINT TRACKING)

## Visión General
Calibre es un Agente de IA autónomo para la gestión de negocio de creadores de contenido.

---
## 🟢 SPRINT 0: Cimentación e Infraestructura (Completado)
- [x] Configuración de Screaming Architecture.
- [x] Conexión con Gemini 2.0 Flash.
- [x] Integración real con YouTube Data API v3.
- [x] Implementación de Capa de Persistencia (Supabase).
- [x] Inicialización de Git Flow.

---
## 🟢 SPRINT 1: Inteligencia Comparativa y Control (Completado)
- [x] Memoria Comparativa, Function Calling, Retry Logic, Endpoints de control.
- [x] Permisos de base de datos validados y análisis comparativo funcional.

---
## 🟢 SPRINT 2: Motor de Ventas e Ingresos (Completado)
- [x] Integración Gmail (MCP) para lectura/escritura de correos.
- [x] Implementación de `Auto-Pitch Engine` (borradores automáticos).
- [x] Lógica de `Sponsorship Forecasting`.

---
## 🟢 SPRINT 3: Visualización y Dashboard (Completado)
- [x] Dashboard con React 19 + Vite + Tailwind v4 + Framer Motion.
- [x] 4 páginas: Dashboard, Logs, Pitches, Sponsorship.
- [x] Dark/Light mode + animaciones motion design premium.
- [x] Build: 446KB JS, 122KB CSS, 0 errores.

---
## 🔵 SPRINT 4: Draft Review Flow (En curso)
**Objetivo:** Cerrar el loop pitch → revisión → envío real con aprobación del usuario.

### Implementado
- [x] Status `draft_ready` → `sent` → `responded`
- [x] `POST /api/pitches/:id/send` (valida, envía, actualiza)
- [x] SendPitchModal (preview + edit + send + original email collapsible)
- [x] Badge "Draft Ready" + botón "Review & Send"
- [x] Card compacta "Pending Pitches" en Dashboard (fondo naranja, contador)
- [x] Tabs (Pending / Sent / Responded) en página Pitches
- [x] Auto-pulse al iniciar servidor
- [x] RFC 2047 decoding de subjects
- [x] From header extraction
- [x] Dedup persistente (processed_emails)
- [x] Daily Brief del agente (hero section en Dashboard)
- [x] Email original visible en SendPitchModal
- [x] AI Active animation con CSS keyframes (sin reinicio)
- [x] Fallback de sponsorship sin "Gemini no disponible"

### Bugs detectados en testing
| Bug | Estado |
|-----|--------|
| "Just now" no se actualiza | Pendiente |
| Pulse sin feedback visual | Pendiente |
| SQL permissions (processed_emails) | ✅ Fixeado |
| AI Active animation se reinicia | ✅ Fixeado |
| "Gemini no disponible" en UI | ✅ Fixeado |

---
## 🔵 SPRINT 5: Production Readiness & Infrastructure (Planificado)
**Objetivo:** Preparar Calibre para clientes reales gestionando límites free tier y escalabilidad multi-tenant.

### Free Tier Limits (Verificado 18/05/2026)

| API | Free Tier | Consumo/ciclo | Ciclos/día |
|---|---|---|---|
| **Gemini Flash** | 60 RPM / 1,000 RPD | 1-4 calls | ~250-1000 (RPM bottleneck) |
| **YouTube Data API** | 10,000 Q/día | ~102 Q (search=100 + stats=2) | **~96** 🚨 |
| **Gmail API** | 1B Q/día | ~5 Q | Ilimitado |
| **Supabase** | 500 MB DB / 2 GB BW | Mínimo | 50K filas/mes |

**Cuello de botella principal:** YouTube `search` endpoint cuesta **100 unidades** por ciclo.

### Plan de Migración a Producción

| # | Acción | Impacto | Costo est. |
|---|--------|---------|------------|
| 1 | **Gemini: Activar facturación** (Google AI Studio → 2,000 RPM / 10,000 RPD) | Elimina 429s | ~$2-5/mes |
| 2 | **YouTube: Cache metrics en Supabase** con TTL 1h (reduce 102Q → ~2Q por canal) | +96 ciclos/día | $0 (código) |
| 3 | **YouTube: API Key con cuota paga** (sin límite diario) | Ilimitado | ~$1-3/mes |
| 4 | **Rate limiter interno**: cola de requests Gemini, throttle 1 pulso/5min por creator | Evita 429s residuales | $0 (código) |
| 5 | **Supabase: Pro ($25/mes)** al tener >3 clientes (8 GB DB, 50 GB BW) | Escala | $25/mes |
| 6 | **Multi-tenant keys**: YouTube/Gemini compartidas, Gmail OAuth por creator (ya hecho) | Sin cambio | $0 |

### Implementación
- [ ] Activar facturación en Google AI Studio
- [ ] Cache de YouTube metrics en Supabase (TTL 1h)
- [ ] YouTube API key con cuota paga en .env
- [ ] Cola de requests para Gemini (rate limiter interno)
- [ ] Throttle de pulsos por creator
- [ ] Evaluar upgrade a Supabase Pro

---
## 🗺️ Roadmap (post-MVP)

| Prioridad | Feature | Descripción |
|---|---|---|
| 🔴 P1 | **Production hardening** | Rate limiting, caching YouTube, paid API keys |
| 🔴 P1 | **Multi-tenant (Agency)** | Una cuenta de agencia con múltiples creadores. Switcher, Gmail tokens por creator, RLS |
| 🔴 P1 | **Auto-Pitch opcional** | Modo automático configurable por creador |
| 🔴 P1 | **Landing page** | Presencia pública en inglés para Google for Startups |
| 🟡 P2 | **Instagram Integration** | Métricas de IG para sponsorship multi-plataforma |
| 🟡 P2 | **TikTok Integration** | Ídem |
| 🟡 P2 | **Tests (Vitest)** | Cobertura backend + frontend |
| 🟢 P3 | **Pagos (Stripe)** | Free / Creator ($19) / Pro ($49) |
| 🟢 P3 | **Agency Dashboard** | Métricas agregadas, facturación, reportes |

---
## 🛠 CONTEXTO DE DESARROLLO
- **Rama:** `feature/sprint-4-draft-review`
- **Canal de YouTube Test:** `UC8LeXCWOalN8SxlrPcG-PaQ` (midudev)
- **Tablas:** `agent_logs`, `processed_emails`, `user_auth`, `brand_deals`
- **Endpoints:** `GET /pulse`, `GET /logs`, `POST /api/pitches/:id/send`, `GET /auth/login`, `GET /auth/callback`
- **Modelo IA:** `gemini-flash-latest`
- **Dashboard:** `apps/web` — React 19 + Vite + Tailwind v4 + Framer Motion
- **Package manager:** pnpm (workspace: raíz + apps/web)
- **Rate limiting actual:** Retry 3x con backoff 15-30s en 429 Gemini + modo degradado
- **Fallbacks actuales:** Mock YouTube (738K subs / 67M views), mock pitch (template), mock sponsorship (subs * 0.002)
