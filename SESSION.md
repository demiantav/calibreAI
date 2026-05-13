# CALIBRE — Session Context

> Última actualización: 2026-05-13

## Estado Actual

**Sprint actual:** Sprint 3 (Pendiente) — Visualización y Dashboard

**Rama:** `feature/sprint-2-sales-engine`

**Último commit:** `d5cff02` — feat: implement Auto-Pitch Engine with Gmail MCP integration

---

## Lo que está implementado (Sprint 2 — Completo)

### Gmail MCP
- Servidor MCP en `src/domains/agent-core/mcp-connector/gmail-mcp-server.ts`
- Tools: `list_emails`, `send_email`
- Manager singleton en `src/infrastructure/mcp/mcp-manager.ts`
- OAuth2 con Google, tokens guardados en Supabase (`user_auth` table)

### Auto-Pitch Engine
- Entidad `BrandDeal` en `src/domains/brand-deals/entities/brand-deal.ts`
- Use case `generatePitchUseCase` en `src/domains/brand-deals/use-cases/generate-pitch.ts`
  - Toma: brandName, brandEmail, brandContext, pitchStyle
  - Busca último MediaKit en `agent_logs`
  - Gemini genera pitch personalizado
  - Guarda draft en `agent_logs` (type: `pitch_draft`)
  - No envía automáticamente (solo draft)
- Tool declarada: `generateAndDraftPitch`

### Sponsorship Forecasting
- Use case `calculateSponsorshipUseCase` en `src/domains/brand-deals/use-cases/calculate-sponsorship.ts`
  - Calcula engagement: `(lastVideoViews / subscribers) * 100`
  - Gemini estima: mention, dedicated, series + CPM + marketContext
  - Guarda en `agent_logs` (type: `sponsorship_forecast`)
- Tool declarada: `calculateSponsorshipValue`

### Bugs corregidos
1. `tool-executor.ts` — import `config` no usado (eliminado)
2. `generate-media-kit.ts` — import `RealYouTubeMetrics` con ruta incorrecta (corregido)
3. `tools-definition.ts` — tipos `string` reemplazados por `SchemaType` del SDK
4. `mcp-manager.ts`:
   - Non-null assertion para `Promise<void> | null`
   - Se agregó handshake `initialize` al spawn del MCP server
   - Se corrigió `callTool`: ahora usa `method: "tools/call"` con `params.name`
   - Se agregó `notifications/initialized` post-handshake

---

## Lo que se probó

- ✅ Build TypeScript sin errores
- ✅ Servidor Express arranca y `/health` responde 200
- ✅ `/logs` devuelve datos desde Supabase
- ✅ OAuth Gmail funcional (logueo exitoso)
- ❌ YouTube Data API: cuota agotada (Too Many Requests)
- ❌ MCP: fix aplicado pero no testeado end-to-end por cuota YouTube

---

## Problemas conocidos

| # | Problema | Estado |
|---|----------|--------|
| 1 | Cuota YouTube Data API agotada (free tier: 10k unidades/día) | Esperar reset o implementar mock |
| 2 | MCP handshake corregido pero no verificado en producción | Pendiente de test |
| 3 | Email hardcodeado a `tavolarodemian06@gmail.com` en MCP server e index.ts | Pendiente de hacer configurable |
| 4 | Canal YouTube hardcodeado a midudev en `pulse.ts` | Pendiente de hacer configurable |
| 5 | `brand_deals` table no creada en Supabase | Pendiente (usa `agent_logs` por ahora) |
| 6 | No hay tests automatizados | Pendiente |

---

## Tools disponibles para Gemini (6)

1. `getYouTubeMetrics(channelId)` → métricas reales
2. `getPreviousInsights(creatorName)` → memoria comparativa
3. `updateLiveMediaKit(creatorName, metrics, insights)` → persiste MediaKit
4. `listEmails(maxResults?)` → lee inbox Gmail vía MCP
5. `sendEmail(to, subject, body)` → envía email vía MCP
6. `generateAndDraftPitch(creatorName, brandName, brandEmail, brandContext, pitchStyle?)` → genera draft de pitch
7. `calculateSponsorshipValue(creatorName, subscribers, totalViews, lastVideoViews, niche)` → tarifas estimadas

---

## Archivos clave creados/modificados

### Creados
- `src/domains/brand-deals/entities/brand-deal.ts`
- `src/domains/brand-deals/use-cases/generate-pitch.ts`
- `src/domains/brand-deals/use-cases/calculate-sponsorship.ts`

### Modificados
- `src/domains/agent-core/reasoning/tools-definition.ts`
- `src/domains/agent-core/reasoning/tool-executor.ts`
- `src/domains/agent-core/reasoning/gemini-client.ts`
- `src/domains/agent-core/heartbeat/pulse.ts`
- `src/infrastructure/mcp/mcp-manager.ts`
- `CALIBRE_MEMORY.md`
- `PROJECT.md`

---

## Próximos pasos (orden sugerido)

### Opción A: Seguir en feature branch (más cambios en backend)
1. Implementar mock de YouTube para testing offline
2. Testear MCP end-to-end (emails reales)
3. Hacer merge a `develop`
4. Comenzar Sprint 3: Dashboard React

### Opción B: Hacer merge a develop ahora
1. Merge `feature/sprint-2-sales-engine` → `develop`
2. Eliminar feature branch
3. Comenzar Sprint 3: Dashboard React
4. Los fixes de bugs pendientes se hacen en nueva rama

### Opción C: Tests primero
1. Escribir tests con Vitest para use cases y tools
2. Luego merge a develop o seguir con Sprint 3
