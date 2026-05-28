# 🧪 Manual Testing Checklist — Calibre MVP

> **Rama:** `feature/mvp-testing`  
> **Fecha:** 2026-05-28  
> **Propósito:** Validar todos los flujos de usuario end-to-end antes de merge a `develop`.

---

## Setup Previo

- [v] Backend corriendo (`pnpm --filter calibre-api dev` o equivalente)
- [v] Frontend corriendo (`pnpm --filter calibre-dashboard dev`)
- [v] Gmail OAuth en Testing mode (tokens pueden estar vencidos — útil para testear reconnect)
- [v] **Base de datos limpia** (ver abajo)

### Limpiar la base de datos (Testing desde cero)

Para testear el onboarding completo con un usuario nuevo:

1. Ir a **Supabase SQL Editor**
2. Copiar y ejecutar el contenido de `scripts/clean-database.sql`
3. Verificar que `SELECT COUNT(*) FROM users;` retorna `0`
4. Reiniciar el backend para que limpie la caché en memoria

> ⚠️ **ATENCIÓN:** Este script borra TODOS los usuarios, logs, emails procesados y métricas cacheadas. No usar en producción.

---

## Flujo 1: Registro + Login (5 min)

### 1.1 Registro

- [v] Ir a `/register`
- [v] Completar email + password
- [v] Verificar redirección a `/onboarding?step=1`
- [v] Verificar que el JWT se guardó en `localStorage` (DevTools -> Application -> Local Storage)

### 1.2 Login

- [v] Ir a `/login`
- [v] Completar credenciales del usuario creado
- [v] Verificar redirección a `/onboarding` si `onboarding_completed: false`, o a `/` si `true`

### 1.3 Logout

- [v] Click en "Cerrar sesión" en Sidebar
- [v] Verificar que JWT se elimina de `localStorage`
- [v] Verificar redirección a `/login`

---

## Flujo 2: Onboarding Completo (10 min)

### 2.1 Step 1 — Connect YouTube

- [v] Pegar URL de canal (ej: `https://www.youtube.com/@midudev` o `https://www.youtube.com/channel/UC...`)
- [v] Verificar que el backend detecta el canal (preview de nombre + subs)
- [v] Click "Confirmar"
- [v] Verificar redirección a `?step=2`

### 2.2 Step 2 — Connect Gmail

- [v] Click "Conectar Gmail" -> redirige a Google OAuth
- [v] Autorizar -> redirige a `/auth/callback` -> `/onboarding?step=3`
- [ ] **Testear reconnect:** Si el token está vencido, verificar que aparece banner rojo en Sidebar + Dashboard con "Reconectar Gmail"
- [v] **Dev skip:** En development, botón "Saltar Gmail (solo para testear)" funciona

### 2.3 Step 3 — First Pulse

- [v] Verificar que el botón "Analizar" está habilitado
- [v] Click "Analizar" -> spinner
- [v] Verificar que `/pulse?wait=true` retorna 200
- [v] Verificar redirección a Dashboard
- [v] Verificar que `onboarding_completed=true` en la DB (o en `/auth/me`)

---

## Flujo 3: Dashboard (5 min)

### 3.1 Métricas

- [v] Verificar que las métricas del canal cargan (subs, views, engagement rate)
- [v] Verificar que los números hacen count-up animation
- [v] Verificar que las cards tienen hover effect

### 3.2 Daily Brief

- [v] Verificar que aparece "Resumen del día"
- [v] Verificar que el texto del brief es legible (no truncado)

### 3.3 Acción Sugerida (SuggestedAction)

- [ ] Si hay deals pendientes -> aparece "Tenés X propuestas esperando revisión" con link a `/deals`
- [v] Si no hay deals -> verificar que no aparece o muestra otra sugerencia

### 3.4 Audience Insights

- [v] Verificar que aparece la sección con barras de sentimiento
- [v] Verificar que hay temas recurrentes y preguntas frecuentes

### 3.5 Growth Chart

- [ ] Si hay datos -> gráfico renderiza con línea y área
- [v] Si no hay datos -> empty state honesto

---

## Flujo 4: Pulse Manual (5 min)

### 4.1 Éxito

- [v] Click en botón "Analizar" (PulseButton)
- [v] Verificar estado "pulsing" (animación de círculo + dots)
- [v] Esperar a que termine -> estado "success" (check verde)
- [v] Verificar que las métricas se actualizan en el Dashboard
- [v] Verificar que aparece nuevo log en `/logs`

### 4.2 Timeout

- [ ] Si tarda más de 60s -> verificar que el botón pasa a estado "error" (X roja)
- [ ] Verificar que el error se limpia automáticamente tras 2s

---

## Flujo 5: Deals / Pipeline Visual (10 min) :star: CRÍTICO

> **Nota:** No existe columna "New". Con auto-pitch activado, el agente genera pitches inmediatamente al detectar emails. El pipeline tiene 3 columnas: **Draft → Sent → Responded**.

### 5.1 Kanban Board

- [v] Ir a `/deals`
- [v] Verificar **3 columnas**: **Draft** / **Sent** / **Responded**
- [v] Verificar que cada card muestra: brand name, email, snippet, estado
- [v] Verificar que el avatar es la inicial del brand name (no del dominio de email)

### 5.2 Draft — Contenido de IA

- [v] Verificar que pitches generados por el agente aparecen en columna **Draft**
- [v] Abrir card en Draft -> se abre **Sheet lateral** (drawer)
- [v] Verificar background sólido (no transparente), con márgenes generosos
- [v] Verificar que se ve:
  - [v] Asunto del pitch redactado por IA
  - [v] Contenido del pitch redactado por IA (bloque de texto)
  - [v] Timeline del deal
- [v] Verificar que hay botón **"Editar"** para modificar asunto y contenido
- [v] Click "Editar" -> input (asunto) + textarea (contenido) se hacen editables
- [v] Modificar texto, click "Guardar", verificar que se guarda
- [v] Botón **"Enviar Pitch"** visible y clickeable

### 5.3 Enviar Pitch (:star: bug fix)

- [ ] Abrir un deal en estado **Draft**
- [ ] Click **"Enviar Pitch"**
- [ ] **Verificar que NO da error 401** (usa headers de auth correctos)
- [ ] Verificar que el deal se mueve de **Draft** a **Sent**
- [ ] Verificar que aparece timestamp de envío en el timeline

### 5.4 Mover entre columnas (Drag & Drop)

- [ ] Arrastrar un deal de **Draft** a **Sent**
- [ ] Verificar que el backend acepta el cambio (`PATCH /api/pitches/:id/status`)
- [ ] Verificar que no permite mover de **Sent** a **Draft** (validación backend)

### 5.5 Responded

- [ ] Mover un deal de **Sent** a **Responded** (drag & drop o botón)
- [ ] Verificar que cambia de columna correctamente

### 5.6 Email original

- [v] Abrir un deal en Draft
- [v] Verificar sección "Email original de la marca" colapsable
- [v] Click para expandir -> verificar From, Subject, Snippet

### 5.7 Conversation Threading (:star: bug fix)

- [ ] Enviar un email de prueba a la cuenta Gmail del usuario
- [ ] Hacer pulse -> se genera un draft en columna **Draft**
- [ ] Enviar el pitch -> el deal se mueve a **Sent**
- [ ] Desde otra cuenta, responder al mismo hilo de conversación
- [ ] Hacer pulse de nuevo
- [ ] **Verificar que NO se genera un nuevo draft** para la misma conversación
- [ ] **Verificar que el deal existente se marca automáticamente como Responded**

### 5.8 "Marcar como respondido" (:star: bug fix)

- [ ] Abrir un deal en estado **Sent**
- [ ] Click **"Marcar como respondido"**
- [ ] Verificar que hay feedback visual (spinner + "Actualizando...")
- [ ] Verificar que NO da error (usa `API_BASE_URL` + headers correctos)
- [ ] Verificar que el deal se mueve a columna **Responded**
- [ ] Verificar que el Sheet se cierra automáticamente tras éxito

### 5.9 Última respuesta de la marca

- [ ] Abrir un deal en estado **Responded** (marcado manual o automáticamente)
- [ ] Verificar que aparece sección **"Última respuesta de la marca"**
- [ ] Verificar que muestra el snippet del email de respuesta
- [ ] Verificar que muestra la fecha/hora de recepción

### 5.10 Toast en Dashboard

- [ ] Ir al **Dashboard** cuando hay deals en estado **Responded**
- [ ] Verificar que aparece toast verde: "X marcas respondieron a tus pitches"
- [ ] Verificar que tiene botón **"Ver respuestas"** que lleva a `/deals`
- [ ] Verificar que el toast se puede **cerrar** con la X
- [ ] Verificar que NO vuelve a aparecer en la misma sesión tras cerrarlo

---

## Flujo 6: Contracts (5 min)

### 6.1 Subir PDF

- [ ] Ir a `/contracts`
- [ ] Drag & drop o click para subir un PDF de contrato real
- [ ] Verificar que aparece el análisis con:
  - [ ] Risk level badge (low/medium/high)
  - [ ] Red flags list
  - [ ] Suggested negotiation points
  - [ ] Estimated fair rate

### 6.2 Fallback (sin Gemini)

- [ ] Si Gemini no está disponible -> verificar que el fallback regex funciona

### 6.3 Historial

- [ ] Verificar que el análisis aparece en la lista del historial

---

## Flujo 7: Logs / Actividad (3 min)

### 7.1 Filtros

- [ ] Ir a `/logs`
- [ ] Verificar que los logs cargan (200 items)
- [ ] Filtrar por tipo (media_kit_update, agent_summary, pitch_draft, etc.)
- [ ] Verificar que los filtros funcionan

### 7.2 Búsqueda

- [ ] Buscar por texto en el campo de búsqueda
- [ ] Verificar que filtra correctamente

---

## Flujo 8: Sponsorship / Tarifas (2 min)

### 8.1 Con datos

- [ ] Ir a `/sponsorship`
- [ ] Verificar que aparecen las barras de RateBar con gradiente
- [ ] Verificar CPM hero

### 8.2 Sin datos

- [ ] Si no hay forecast -> verificar empty state "Aún no hay tarifas estimadas"

---

## Flujo 9: Toggles (3 min)

### 9.1 Auto-pitch

- [ ] En Sidebar, toggle "Auto-pitch"
- [ ] Verificar que el switch cambia de estado
- [ ] Verificar que persiste tras recargar la página

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
- [ ] Verificar redirección a `/login`

### 11.2 404 Not Found

- [ ] Ir a `/ruta-que-no-existe`
- [ ] Verificar que Express sirve `index.html` (SPA catch-all)

### 11.3 Network Offline

- [ ] Desconectar WiFi / bloquear requests en DevTools
- [ ] Verificar que aparece estado de error en UI

---

## Flujo 12: Keyboard Shortcuts (1 min)

- [v] Presionar `D` -> navega a Dashboard
- [v] Presionar `L` -> navega a Logs
- [v] Presionar `P` -> navega a Deals
- [v] Presionar `R` -> navega a Rates/Sponsorship
- [v] Verificar que NO funciona cuando se escribe en un input

---

## Limitaciones conocidas para Beta

### Límite de usuarios: 5 max

La arquitectura actual **no escala** más allá de ~5 usuarios activos:

| Limitación                | Detalle                                                                                                        |
| ------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Gemini API**            | 500 requests/day. Cada pulse = 3-4 requests. 50 usuarios = quota excedida inmediatamente.                      |
| **Auto-pulse en startup** | Al reiniciar el servidor, ejecuta pulse para TODOS los usuarios con `auto_pitch_enabled=true` simultáneamente. |
| **Sin job queue**         | No hay cola de procesamiento (BullMQ/pgboss). Si falla un pulse, no hay retry ni backoff.                      |
| **YouTube API**           | 10,000 units/day. 50 usuarios × 4 units = 200/day. Aún manejable, pero sin margen.                             |

### Recomendación para beta cerrada

- **Max 5 usuarios** en el plan actual.
- **Auto-pitch desactivado por defecto** — que sea opt-in.
- **Daily Digest solo** — evitar auto-pulse en startup.

### Para escalar a 50+ usuarios (post-MVP)

Necesita arquitectura con:

1. **Job Queue** (BullMQ / Bull / pgboss)
2. **Rate limiting por usuario** (1 pulse cada 6h)
3. **Stagger en startup** (1 usuario cada 60s, no todos juntos)
4. **Worker separado** del servidor HTTP
5. **Monitoreo de quota** (alerta al 80% de Gemini/YouTube)

---

## Resultado Esperado

| Flujo                 | Estado             |
| --------------------- | ------------------ |
| Registro + Login      | :white_check_mark: |
| Onboarding 3 steps    | :white_check_mark: |
| Dashboard carga       | :white_check_mark: |
| Pulse manual success  | :white_check_mark: |
| Deals pipeline visual | :white_check_mark: |
| Contracts análisis    | :white_check_mark: |
| Logs filtros/búsqueda | :white_check_mark: |
| Toggles persisten     | :white_check_mark: |
| Mobile responsive     | :white_check_mark: |
| Errores manejados     | :white_check_mark: |

---

## Notas

- Si un test falla, anotar el paso exacto, el error observado, y los logs de la consola del navegador y/o terminal del backend.
- Priorizar los flujos marcados con :star: (críticos) antes de los opcionales.
- Documentar cualquier bug encontrado en un issue de GitHub o en este archivo bajo "Bugs encontrados durante testing".

### Bugs encontrados durante testing

_(Agregar acá cualquier bug descubierto con su descripción y pasos para reproducir)_
