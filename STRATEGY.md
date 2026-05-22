# Calibre — Análisis Estratégico de Producto & Marketing

> Perspectiva de Head of Product + Growth + Marketing  
> Fecha: Mayo 2026 · Post Sprint 9.75

---

## Diagnóstico general

El stack técnico está sobredimensionado para el estado actual del negocio. Hay 263 tests, glassmorphism, animaciones CountUp, glow orbs — pero no existe un segundo usuario real ni un onboarding funcional. No es una crítica al trabajo técnico; es una señal de que hay que reorientar el foco hacia validación de negocio.

El diferencial real de Calibre no es el dashboard. Es que el agente actúa mientras el creador graba. Ese ángulo todavía no existe en ninguna pantalla ni en ningún copy.

---

## Blockers P0 — antes de hablar con inversores o usuarios

### 1. No hay onboarding. El producto empieza en el vacío.

Hoy un nuevo usuario llega y ve el dashboard del canal de prueba (midudev). No existe ningún flujo de "conecta tu canal → autoriza Gmail → primer pulse". Sin onboarding, la primera sesión es desorientadora y el churn es inmediato.

**Es el gap más crítico antes de cualquier lanzamiento público.**

Flujo mínimo necesario:

1. Conectar canal de YouTube (OAuth o URL)
2. Autorizar Gmail
3. Primer Pulse automático disparado
4. Mostrar resultados con contexto ("Tu primer análisis está listo")

---

### 2. No hay propuesta de valor clara en ninguna pantalla.

El producto no responde "¿qué hago yo exactamente?" en ningún lado. "Pulse", "AI Active", "Daily Brief" son términos internos de desarrollo, no copy que convierte.

Se necesita una frase de posicionamiento de una línea que entienda un creador de 50k subs. Ejemplo de dirección:

> "El chief of staff de tu canal. Encuentra sponsors, prepara los pitches y los envía — mientras vos grabás."

---

### 3. Auth atada a un solo Gmail. Sin multi-tenant, no es un producto.

Todo el sistema está hardcodeado a `tavolarodemian06@gmail.com`. Cualquier creador que intente usar el producto hoy verá los datos de otro canal. El roadmap lo tiene como P1, pero en la práctica es **P0** si se quiere un segundo usuario real.

---

## Gaps P1 — limitan la retención una vez que el usuario entra

### 4. El valor del agente no es observable ni accionable.

El Daily Brief existe, pero el usuario no sabe cuándo fue generado, qué tan fresco está, ni qué acción concreta debería tomar hoy.

El AI Brief necesita una acción sugerida al final, por ejemplo:

- "Escribir a TechCorp esta semana — respondieron hace 2 días"
- "Tu engagement bajó un 12%, publicá antes de las 18h los martes"

Sin acción concreta, es un resumen que no activa comportamiento.

---

### 5. No hay historial de deals ni pipeline visual.

Un creador que maneja 5+ marcas simultáneas no puede ver el estado de cada deal de un vistazo. El CRM básico existe en la base de datos (Draft → Sent → Responded), pero no hay una vista tipo kanban o pipeline.

Este es el core del valor para creadores serios. Sin una vista de pipeline, Calibre se siente como un inbox, no como un sistema de ventas.

---

### 6. No hay notificaciones. El usuario tiene que acordarse de abrir la app.

Si el agente detecta que una marca respondió, o que hay un pitch listo para revisar, ¿cómo se entera el creador? Sin email digest o notificación, el engagement activo depende de que el usuario recuerde entrar.

Un resumen diario por email con el Daily Brief cambiaría la retención radicalmente. Es el principal driver de hábito para una herramienta de este tipo.

---

### 7. Las tasas de sponsorship son estimaciones, no datos de mercado.

El forecast usa `subs × 0.002` como fallback. Para que el creador confíe en los números, se necesitan benchmarks reales por nicho (tech, gaming, lifestyle) y por región.

Sin datos de mercado, el "Sponsorship Forecast" es marketing interno, no inteligencia real.

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

### Sprint 10 — Imprescindible para tener un segundo usuario

| Feature                 | Justificación                                                |
| ----------------------- | ------------------------------------------------------------ |
| Onboarding end-to-end   | Sin esto no hay segundo usuario. Bloquea todo lo demás.      |
| Multi-tenant básico     | Cada creador ve solo sus datos. Prerequisito de lanzamiento. |
| Landing page + waitlist | Validar demanda antes de construir más features.             |

**Métrica de validación:** 100 signups en waitlist en 30 días. Si no se llega, el posicionamiento o el canal están mal.

---

### Sprint 11 — Drivers de retención

| Feature                           | Justificación                                                 |
| --------------------------------- | ------------------------------------------------------------- |
| Email digest diario               | Principal driver de hábito. Retención semana 2–4.             |
| Pipeline visual de deals          | Convierte el producto de "herramienta" a "sistema de ventas". |
| Acción sugerida en el Daily Brief | Hace el brief accionable, no solo informativo.                |

---

### Sprint 12 — Credibilidad de los datos

| Feature                              | Justificación                                                        |
| ------------------------------------ | -------------------------------------------------------------------- |
| Benchmarks de sponsorship por nicho  | Los números de forecast pasan de estimación a referencia de mercado. |
| Historial de conversaciones por deal | El creador puede ver el hilo completo de cada negociación.           |
| Toggle auto-pitch / manual           | Control del usuario sobre la automatización (confianza).             |

---

### Sprint 13+ — Monetización y escala

| Feature            | Justificación                                  |
| ------------------ | ---------------------------------------------- |
| Stripe + planes    | Solo monetizar después de validar retención.   |
| Agency tier        | 5–10x LTV de un creador individual.            |
| Instagram / TikTok | Amplía el TAM una vez que YouTube está sólido. |

**Estructura de pricing sugerida:**

| Plan    | Precio  | Límites                                         |
| ------- | ------- | ----------------------------------------------- |
| Free    | $0      | 1 canal, pulse manual 1x/día, sin digest        |
| Creator | $19/mes | Pulse automático, email digest, pipeline        |
| Pro     | $49/mes | Multi-canal, agency view, benchmarks de mercado |

---

## Resumen ejecutivo

**Lo que está bien:** infraestructura técnica sólida, flujo de pitch end-to-end funcionando, UI premium diferenciada, modo degradado robusto, cobertura de tests seria.

**Lo que falta para ser un negocio:**

1. Onboarding + multi-tenant → sin esto no hay segundo usuario
2. Propuesta de valor comunicada en pantalla → sin esto no hay conversión
3. Email digest diario → sin esto no hay retención orgánica
4. Beta cerrada con creadores reales → sin esto no hay product-market fit validado
5. Landing page con waitlist → sin esto no hay señal de mercado

**El orden importa:** Onboarding → Beta cerrada → Landing → Retención → Monetización.

No al revés.

---

_Documento generado para uso interno de producto. Última actualización: Mayo 2026._
