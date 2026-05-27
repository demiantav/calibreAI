# 🧪 Manual Testing Checklist — Calibre MVP

> **Rama:** `feature/mvp-testing`  
> **Fecha:** 2026-05-27  
> **Propósito:** Validar todos los flujos de usuario end-to-end antes de merge a `develop`.

---

## Setup Previo

- [ ] Backend corriendo (`pnpm --filter calibre-api dev` o equivalente)
- [ ] Frontend corriendo (`pnpm --filter calibre-dashboard dev`)
- [ ] Base de datos limpia (opcional: crear usuario nuevo para testear onboarding de cero)
- [ ] Gmail OAuth en Testing mode (tokens pueden estar vencidos — útil para testear reconnect)

---

## Flujo 1: Registro + Login (5 min)

### 1.1 Registro
- [ ] Ir a `/register`
- [ ] Completar email + password
- [ ] Verificar redireccion a `/onboarding?step=1`
- [ ] Verificar que el JWT se guardo en `localStorage` (DevTools -> Application -> Local Storage)

### 1.2 Login
- [ ] Ir a `/login`
- [ ] Completar credenciales del usuario creado
- [ ] Verificar redireccion a `/onboarding` si `onboarding_completed: false`, o a `/` si `true`

### 1.3 Logout
- [ ] Click en "Logout" en Sidebar
- [ ] Verificar que JWT se elimina de `localStorage`
- [ ] Verificar redireccion a `/login`

---

## Flujo 2: Onboarding Completo (10 min)

### 2.1 Step 1 — Connect YouTube
- [ ] Pegar URL de canal (ej: `https://www.youtube.com/@midudev` o `https://www.youtube.com/channel/UC...`)
- [ ] Verificar que el backend detecta el canal (preview de nombre + subs)
- [ ] Click "Confirmar"
- [ ] Verificar redireccion a `?step=2`

### 2.2 Step 2 — Connect Gmail
- [ ] Click "Conectar Gmail" -> redirige a Google OAuth
- [ ] Autorizar -> redirige a `/auth/callback` -> `/onboarding?step=3`
- [ ] **Testear reconnect:** Si el token esta vencido, verificar que aparece banner rojo en Sidebar + Dashboard con "Reconectar Gmail"

### 2.3 Step 3 — First Pulse
- [ ] Verificar que el boton "Analizar" esta habilitado
- [ ] Click "Analizar" -> spinner
- [ ] Verificar que `/pulse?wait=true` retorna 200
- [ ] Verificar redireccion a Dashboard
- [ ] Verificar que `onboarding_completed=true` en la DB (o en `/auth/me`)

---

## Flujo 3: Dashboard (5 min)

### 3.1 Metricas
- [ ] Verificar que las metricas del canal cargan (subs, views, engagement rate)
- [ ] Verificar que los numeros hacen count-up animation
- [ ] Verificar que las cards tienen hover effect

### 3.2 Daily Brief
- [ ] Verificar que aparece "Resumen del dia"
- [ ] Verificar que el texto del brief es legible (no truncado)

### 3.3 SuggestedAction
- [ ] Si hay pitches pendientes -> aparece "Tenes X propuestas esperando revision" con link a /pitches
- [ ] Si no hay pitches -> verificar que no aparece o muestra otra sugerencia

### 3.4 AudienceInsights
- [ ] Verificar que aparece la seccion con barras de sentimiento
- [ ] Verificar que hay temas recurrentes y preguntas frecuentes

### 3.5 GrowthChart
- [ ] Si hay datos -> grafico renderiza con linea y area
- [ ] Si no hay datos -> empty state honesto

---

## Flujo 4: Pulse Manual (5 min)

### 4.1 Exito
- [ ] Click en boton "Analizar" (PulseButton)
- [ ] Verificar estado "pulsing" (animacion de circulo + dots)
- [ ] Esperar a que termine -> estado "success" (check verde)
- [ ] Verificar que las metricas se actualizan en el Dashboard
- [ ] Verificar que aparece nuevo log en `/logs`

### 4.2 Timeout
- [ ] Si tarda mas de 60s -> verificar que el boton pasa a estado "error" (X roja)
- [ ] Verificar que el error se limpia automaticamente tras 2s

---

## Flujo 5: Pitches (10 min) :star: CRITICO

### 5.1 Lista
- [ ] Ir a `/pitches`
- [ ] Verificar tabs "Pendientes" / "Enviadas"
- [ ] Verificar que cada pitch muestra: brand name, email, asunto, estado

### 5.2 Enviar Pitch (:star: bug fix)
- [ ] Abrir un pitch en estado "draft_ready"
- [ ] Click "Revisar y Enviar"
- [ ] Verificar que el modal carga el contenido del pitch
- [ ] Click "Send" (sin editar)
- [ ] **Verificar que NO da error 401** (esto es lo que fixeamos)
- [ ] Verificar que el pitch desaparece de "Pendientes" y aparece en "Enviadas"

### 5.3 Editar antes de enviar
- [ ] Abrir otro pitch
- [ ] Click "Editar"
- [ ] Modificar el asunto y/o contenido
- [ ] Click "Done Editing"
- [ ] Enviar y verificar que usa el texto editado

---

## Flujo 6: Contracts (5 min)

### 6.1 Subir PDF
- [ ] Ir a `/contracts`
- [ ] Drag & drop o click para subir un PDF de contrato real
- [ ] Verificar que aparece el analisis con:
  - [ ] Risk level badge (low/medium/high)
  - [ ] Red flags list
  - [ ] Suggested negotiation points
  - [ ] Estimated fair rate

### 6.2 Fallback (sin Gemini)
- [ ] Si Gemini no esta disponible -> verificar que el fallback regex funciona

### 6.3 Historial
- [ ] Verificar que el analisis aparece en la lista del historial

---

## Flujo 7: Logs / Actividad (3 min)

### 7.1 Filtros
- [ ] Ir a `/logs`
- [ ] Verificar que los logs cargan (200 items)
- [ ] Filtrar por tipo (media_kit_update, agent_summary, pitch_draft, etc.)
- [ ] Verificar que los filtros funcionan

### 7.2 Busqueda
- [ ] Buscar por texto en el campo de busqueda
- [ ] Verificar que filtra correctamente

---

## Flujo 8: Sponsorship / Tarifas (2 min)

### 8.1 Con datos
- [ ] Ir a `/sponsorship`
- [ ] Verificar que aparecen las barras de RateBar con gradiente
- [ ] Verificar CPM hero

### 8.2 Sin datos
- [ ] Si no hay forecast -> verificar empty state "Aun no hay tarifas estimadas"

---

## Flujo 9: Toggles (3 min)

### 9.1 Auto-pitch
- [ ] En Sidebar, toggle "Auto-pitch"
- [ ] Verificar que el switch cambia de estado
- [ ] Verificar que persiste tras recargar la pagina

### 9.2 Daily Digest
- [ ] En Sidebar, toggle "Daily Digest"
- [ ] Verificar mismo comportamiento

### 9.3 Theme
- [ ] Toggle Dark/Light mode
- [ ] Verificar que el tema cambia
- [ ] Verificar que persiste tras recarga

---

## Flujo 10: Mobile Responsive (3 min)

### 10.1 Sidebar
- [ ] En mobile (< 1024px), verificar que aparece hamburger menu
- [ ] Click en hamburger -> drawer se abre
- [ ] Click en backdrop o "X" -> drawer se cierra

### 10.2 Layout
- [ ] Verificar que el grid del Dashboard no se rompe en mobile
- [ ] Verificar touch targets >= 44px

---

## Flujo 11: Errores (5 min)

### 11.1 401 Unauthorized
- [ ] Borrar JWT de localStorage
- [ ] Recargar Dashboard
- [ ] Verificar redireccion a `/login`

### 11.2 404 Not Found
- [ ] Ir a `/ruta-que-no-existe`
- [ ] Verificar que Express sirve `index.html` (SPA catch-all)

### 11.3 Network Offline
- [ ] Desconectar WiFi / bloquear requests en DevTools
- [ ] Verificar que aparece estado de error en UI

---

## Flujo 12: Keyboard Shortcuts (1 min)

- [ ] Presionar `D` -> navega a Dashboard
- [ ] Presionar `L` -> navega a Logs
- [ ] Presionar `P` -> navega a Pitches
- [ ] Presionar `R` -> navega a Rates/Sponsorship
- [ ] Verificar que NO funciona cuando se escribe en un input

---

## Resultado Esperado

| Flujo | Estado |
|-------|--------|
| Registro + Login | :white_check_mark: |
| Onboarding 3 steps | :white_check_mark: |
| Dashboard carga | :white_check_mark: |
| Pulse manual success | :white_check_mark: |
| Pitches envio real | :white_check_mark: |
| Contracts analisis | :white_check_mark: |
| Logs filtros/busqueda | :white_check_mark: |
| Toggles persisten | :white_check_mark: |
| Mobile responsive | :white_check_mark: |
| Errores manejados | :white_check_mark: |

---

## Notas

- Si un test falla, anotar el paso exacto, el error observado, y los logs de la consola del navegador y/o terminal del backend.
- Priorizar los flujos marcados con :star: (criticos) antes de los opcionales.
