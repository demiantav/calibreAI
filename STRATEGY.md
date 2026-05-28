# Calibre — Análisis Estratégico de Producto & Marketing

> Perspectiva de Head of Product + Growth + Marketing  
> Fecha: Mayo 2026 · Post Sprint 14

---

## Diagnóstico general

La infraestructura técnica está sólida: 251+ tests, onboarding end-to-end, multi-tenant auth, email digest diario, audience intelligence, contract auditor, modo degradado robusto. El producto pasó de "demo técnica" a "producto usable por un creador real".

Sin embargo, el foco ahora debe ser **validación de negocio**, no más features técnicas. Tenemos un MVP funcional pero no tenemos: (1) presencia pública, (2) pipeline visual de deals, (3) arquitectura que escale más allá de ~5 usuarios.

El diferencial real de Calibre sigue siendo el mismo: el agente actúa mientras el creador graba. Ese mensaje debe estar en la landing page y en el copy de onboarding.

---

## Blockers P0 — antes de cualquier lanzamiento público

### 1. No hay landing page ni presencia pública.

Hoy Calibre no tiene ninguna página pública. Un creador que escuche del producto no tiene dónde leer qué hace, cuánto cuesta, ni dónde registrarse. Para Google for Startups y para validar demanda orgánica, esto es un bloqueante absoluto.

**Es el gap más crítico ahora.**

Mínimo necesario:

1. Landing page en español e inglés con posicionamiento claro
2. Formulario de waitlist (validación de demanda)
3. Testimonios / casos de uso (aunque sean de uso propio por ahora)
4. Pricing transparento (Free / Creator / Pro)

---

### 2. No hay pipeline visual de deals.

El CRM existe en la base de datos (`draft_ready → sent → responded`), pero la vista `/pitches` es una lista tabulada, no un pipeline visual. Para un creador que maneja 5+ marcas simultáneas, esto es insuficiente. Se siente como un inbox, no como un sistema de ventas.

Sin una vista kanban o pipeline de deals, el producto no entrega su core promise: "el sistema que cierra los deals por vos".

---

### 3. La arquitectura no escala más allá de ~5 usuarios.

El MVP está construido para validar producto, no para escalar:

| Limitación | Detalle |
|---|---|
| **Gemini API** | 500 requests/day. Cada pulse = 3-4 requests. 50 usuarios = quota excedida inmediatamente. |
| **Auto-pulse en startup** | Al reiniciar el servidor, ejecuta pulse para TODOS los usuarios con `auto_pitch_enabled=true` simultáneamente. |
| **Sin job queue** | No hay cola de procesamiento (BullMQ/pgboss). Si falla un pulse, no hay retry ni backoff. |
| **YouTube API** | 10,000 units/day. 50 usuarios × 4 units = 200/day. Aún manejable, pero sin margen. |

**Para beta cerrada (5 usuarios):** la arquitectura actual es suficiente.  
**Para lanzamiento público (50+ usuarios):** requiere job queue, rate limiting per user, worker separado, y monitoreo de quota.

---

## Gaps P1 — limitan la retención y credibilidad

### 4. Las tasas de sponsorship son estimaciones, no datos de mercado.

El forecast usa `subs × 0.002` como fallback. Para que el creador confíe en los números, se necesitan benchmarks reales por nicho (tech, gaming, lifestyle) y por región.

Sin datos de mercado, el "Sponsorship Forecast" es marketing interno, no inteligencia real.

**Prioridad:** Media — el forecast funciona como estimador, pero no genera confianza de "esto es lo que cobra el mercado".

---

### 5. No hay historial de conversaciones por deal.

Un creador que negocia con una marca necesita ver el hilo completo: email original de la marca, pitch enviado, respuesta de la marca, contra-oferta, etc. Hoy solo hay `brand_deals` con un status, pero no el historial de interacciones.

Esto limita la utilidad del producto para deals que requieren múltiples rondas de negociación.

---

### 6. Los tests de integración legacy están skipped.

22 tests de integración API (supertest) están skipped desde Sprint 10 porque requieren refactor para el nuevo flujo JWT + mock de `oauth_sessions`. Sin ellos, no hay cobertura de integración end-to-end para auth, onboarding, y pulse.

**Riesgo:** Regresiones en flujos críticos sin detección automática.

---

### 7. Google OAuth está en "Testing" mode.

Para lanzamiento público, Google requiere verificación de dominio y pasar la app a "Production" mode en Google Cloud Console. Mientras tanto, cada usuario nuevo debe ser agregado manualmente como "test user".

**Bloquea:** Cualquier lanzamiento que no sea beta cerrada con usuarios pre-aprobados.

---

## ICP & Posicionamiento

### El usuario objetivo: el creador en la "meseta del medio"

| Atributo            | Detalle                                                             |
| ------------------- | ------------------------------------------------------------------- |
| Suscriptores        | 10.000 – 200.000 (sweet spot real)                                  |
| Situación           | Ya recibe emails de marcas, los gestiona con Gmail + un spreadsheet |
| Dolor               | Pierde deals por falta de seguimiento y pitches débiles             |
| Nicho más receptivo | Tech, educación, finanzas personales                                |
| Geografía primaria  | España, México, Argentina, Colombia                                 |
| Publicación         | Consistente (1–2 videos por semana)                                 |

Canales grandes (+500k) tienen management. Canales chicos (<5k) no tienen deals aún. El ICP es el creador que ya tiene el problema pero no tiene el sistema para resolverlo.

---

### Posicionamiento: no compitas con herramientas de analytics

TubeBuddy, VidIQ y Social Blade dan números. Calibre **actúa**.

El diferencial no es el dashboard bonito. Es que el agente detecta oportunidades, prepara los pitches y los envía mientras el creador graba. El posicionamiento debería vivir en ese eje:

> **No es analytics. Es el sistema que cierra los deals por vos.**

---

### Ventaja competitiva: español primero

Todos los competidores relevantes (Grin, Creator.co, AspireIQ) son en inglés y están orientados a marcas, no a creadores. Un producto en español, pensado desde el creador, con pricing accesible para LATAM, no tiene competidor directo en este momento.

Ese es el moat disponible hoy. Se cierra en 12–18 meses cuando los players globales lleguen al mercado hispanohablante.

---

## Growth: cómo adquirir los primeros 100 usuarios

### Canal 1 — Beta cerrada con creadores reales (ahora, antes de la landing)

Antes de la landing page, antes de cualquier marketing: usar el producto con creadores reales en modo white-glove.

- Elegir 5–10 creadores entre 20k–100k subs en tech/edu hispanohablante
- Hacer el onboarding manualmente
- Recibir feedback semanal
- Obtener testimonios + casos de uso reales con números

Sin esto, la landing page es ficción.

---

### Canal 2 — Distribución vía los mismos creadores

El ICP _es_ el canal de distribución. Un creador que muestra "usé esta IA para conseguir mi primer sponsor de $2.000" tiene 10–50x más credibilidad que cualquier ad.

El producto debe diseñarse para que los resultados sean compartibles:

- Screenshot del primer deal cerrado
- Card de ingresos generados ese mes
- "Powered by Calibre" visible (opcional, no invasivo)

---

### Canal 3 — Email digest diario como gancho de hábito

Una app que solo vive en el browser compite con el olvido. Un email a las 8am con el Daily Brief crea el hábito diario sin que el usuario tenga que recordar abrir la app.

Estructura del digest:

1. Métrica destacada del canal (engagement, vistas últimos 7 días)
2. Pitches pendientes de revisión
3. Marcas que respondieron
4. Acción sugerida del día

---

### Canal 4 — SEO en longtails de intención alta (medio plazo)

Búsquedas con alto intent y poca competencia en español:

- "cómo conseguir sponsors youtube canal pequeño"
- "cuánto cobrar por publicidad youtube"
- "email para marcas colaboración youtube template"
- "cómo hacer un media kit youtube"

Calibre puede rankear con contenido útil antes de que la competencia global llegue al mercado hispanohablante.

---

## Roadmap recomendado (perspectiva de negocio)

### Fase 1 — Beta Cerrada (ahora, 5 usuarios máximo)

**Objetivo:** Validar product-market fit con creadores reales antes de cualquier presión pública.

| Feature | Estado | Justificación |
|---|---|---|
| Onboarding end-to-end | ✅ Completado | JWT auth, YouTube connect, Gmail OAuth, FirstPulse |
| Multi-tenant básico | ✅ Completado | Data isolation por `user_id` en todas las tablas |
| Auto-pitch toggle | ✅ Completado | Control del usuario sobre automatización |
| Email digest diario | ✅ Completado | Driver de hábito. Ya corre a las 8am Europe/Rome |
| Acción sugerida | ✅ Completado | Brief accionable con prioridades (pitches, engagement, recordatorio) |
| Audience Intelligence | ✅ Completado | Análisis de comentarios YouTube |
| Contract Auditor | ✅ Completado | Análisis de PDFs de contratos con Gemini + fallback |
| Gmail reconnect banner | ✅ Completado | Detección automática de tokens vencidos + CTA de reconexión |

**Actividades manuales:**
- Elegir 3–5 creadores entre 20k–100k subs en tech/edu hispanohablante
- Onboarding manual (white-glove) para capturar fricciones
- Feedback semanal estructurado
- Obtener 2–3 testimonios con números concretos

**Métrica de validación:** 3 de 5 creadores siguen usando el producto semanalmente tras 30 días.

---

### Fase 2 — Lanzamiento Público MVP (post-validación)

**Objetivo:** Abrir el producto a waitlist con arquitectura que soporte 50+ usuarios.

| Feature | Estado | Justificación |
|---|---|---|
| Landing page + waitlist | ❌ No iniciado | Presencia pública, posicionamiento claro, validación de demanda |
| Pipeline visual de deals | ❌ No iniciado | Core del valor. Convierte "herramienta" en "sistema de ventas" |
| Job queue + scalability | ❌ No iniciado | BullMQ/pgboss, rate limiting per user, worker separado |
| Google OAuth production mode | ❌ No iniciado | Verificación de dominio + pasar a "Production" en Google Cloud |
| Integration tests JWT | 🟡 Parcial | Re-escribir 22 tests legacy para evitar regresiones |

**Métrica de validación:** 100 signups en waitlist en 30 días. Si no se llega, el posicionamiento o el canal están mal.

---

### Fase 3 — Retención y monetización (post-PMF)

| Feature | Justificación |
|---|---|
| Benchmarks de sponsorship por nicho | Forecast pasa de estimación a referencia de mercado |
| Historial de conversaciones por deal | Hilo completo de negociación (emails de ida y vuelta) |
| Stripe + planes | Free / Creator ($19) / Pro ($49). Solo tras validar retención |
| Agency tier | 5–10x LTV de un creador individual |
| Instagram / TikTok | Amplía el TAM una vez que YouTube está sólido |
| Timezone configurable | Digest ajustado a timezone del usuario |

**Estructura de pricing sugerida:**

| Plan    | Precio  | Límites                                         |
| ------- | ------- | ----------------------------------------------- |
| Free    | $0      | 1 canal, pulse manual 1x/día, sin digest        |
| Creator | $19/mes | Pulse automático, email digest, pipeline        |
| Pro     | $49/mes | Multi-canal, agency view, benchmarks de mercado |

---

## Resumen ejecutivo

**Lo que está bien:** infraestructura técnica sólida, onboarding end-to-end funcional, multi-tenant auth operativo, flujo de pitch end-to-end funcionando, email digest diario corriendo, audience intelligence activa, contract auditor con fallback, UI premium diferenciada, modo degradado robusto, cobertura de tests seria (251+ tests).

**Lo que falta para ser un negocio:**

1. **Landing page + waitlist** → sin esto no hay señal de mercado ni canal de adquisición
2. **Pipeline visual de deals** → sin esto el producto no entrega su core promise ("sistema de ventas")
3. **Beta cerrada con creadores reales** → sin esto no hay product-market fit validado
4. **Scalability (job queue + rate limiting)** → sin esto no podemos pasar de 5 a 50+ usuarios
5. **Google OAuth production mode** → sin esto no hay lanzamiento público autónomo

**El orden importa:** Beta cerrada (5 usuarios) → Landing + Waitlist → Pipeline visual → Scalability → Lanzamiento público → Monetización.

No al revés.

---

_Documento generado para uso interno de producto. Última actualización: Mayo 2026 · Post Sprint 14._
