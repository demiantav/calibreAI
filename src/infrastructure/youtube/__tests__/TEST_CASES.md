# Backend Tests — metrics-service.ts

Archivo de test: `src/infrastructure/youtube/__tests__/metrics-service.test.ts`

---

## Función: `parseISODuration`

Convierte duración ISO 8601 (formato YouTube) a segundos. RegEx: `/PT(\d+H)?(\d+M)?(\d+S)?/`

| #  | Input            | Esperado  | Categoría         | Descripción                         |
|----|-----------------|-----------|-------------------|-------------------------------------|
| 1  | `PT1H30M15S`    | 5415      | Standard          | Horas + minutos + segundos          |
| 2  | `PT30M`         | 1800      | Standard          | Solo minutos                        |
| 3  | `PT15S`         | 15        | Standard          | Solo segundos                       |
| 4  | `PT1H`          | 3600      | Standard          | Solo horas                          |
| 5  | `PT1H30M`       | 5400      | Standard          | Horas + minutos                     |
| 6  | `PT1M30S`       | 90        | Standard          | Minutos + segundos                  |
| 7  | `PT1H0M0S`      | 3600      | Standard          | Ceros explícitos                    |
| 8  | `PT0S`          | 0         | Borde             | Duración cero                       |
| 9  | `PT0H0M0S`      | 0         | Borde             | Todos los componentes en cero       |
| 10 | `PT`            | 0         | Borde             | Todos los grupos opcionales, regex matchea PT → 0 |
| 11 | `""` (vacio)    | Infinity  | Borde             | String vacío (sin match)            |
| 12 | `PT100H`        | 360000    | Grande             | Valor grande de horas               |
| 13 | `PT999S`        | 999       | Grande             | Valor grande de segundos            |
| 14 | `P1DT2H`        | Infinity  | Malformado        | Formato con días no soportado       |
| 15 | `foobar`        | Infinity  | Malformado        | Sin prefijo PT, sin match            |

---

## Función: `isShort`

Determina si una duración corresponde a un Short (≤ 60 segundos).

| #  | Input  | Esperado | Categoría         | Descripción                     |
|----|--------|----------|-------------------|---------------------------------|
| 1  | PT15S  | true     | Standard          | Short típico                    |
| 2  | PT59S  | true     | Borde             | 1s por debajo del límite        |
| 3  | PT60S  | true     | Borde             | Exactamente en el límite        |
| 4  | PT61S  | false    | Borde             | 1s por encima del límite        |
| 5  | PT1M   | true     | Borde             | 1 minuto = 60s, es Short        |
| 6  | PT1M1S | false    | Borde             | 61s, no es Short                |
| 7  | PT0S   | true     | Borde             | Duración cero, se considera Short |
| 8  | PT10M  | false    | Standard          | Video largo                     |

---

## Función: `isDurable`

Opuesto lógico de `isShort`. Determina si un video NO es un Short (> 60s).

| #  | Video (duration) | Esperado | Descripción              |
|----|------------------|----------|--------------------------|
| 1  | PT61S            | true     | 1s sobre límite, durable |
| 2  | PT60S            | false    | Exacto límite, no durable|
| 3  | PT15S            | false    | Short claro               |
| 4  | PT10M            | true     | Video largo               |

---

## Función: `hoursSince`

Calcula las horas transcurridas desde la publicación del video usando `Date.now()`.

Mock: `Date.now()` congelado en `2026-05-20T12:00:00Z` vía `vi.setSystemTime()`.

| #  | publishedAt               | Esperado | Categoría     | Descripción                  |
|----|---------------------------|----------|---------------|------------------------------|
| 1  | `2026-05-19T12:00:00Z`    | 24       | Standard      | Exactamente 24h atrás        |
| 2  | `2026-05-20T10:00:00Z`    | 2        | Standard      | 2h atrás                     |
| 3  | `2026-05-20T11:30:00Z`    | 0.5      | Standard      | 30 min atrás                 |
| 4  | `2026-05-18T12:00:00Z`    | 48       | Standard      | 48h atrás                    |
| 5  | `2026-05-20T12:00:00Z`    | 0        | Borde         | Mismo instante que ahora     |
| 6  | `2026-05-21T12:00:00Z`    | -24      | Borde         | Fecha futura (negativo)      |

---

## Función: `selectBestVideo`

Algoritmo de selección del mejor video. Orden de prioridad:

1. **Maduro (> 24h)**: primer non-Short con más de 24h desde publicación
2. **Reciente (> 1h)**: non-Short con más vistas entre los publicados hace > 1h (ninguno > 24h)
3. **Muy reciente (< 1h)**: non-Short con más vistas (ninguno > 1h)
4. **Solo Shorts**: Short con mayor interacción (likes + comments)
5. **Vacío**: `null`

Mock: `Date.now()` congelado en `2026-05-20T12:00:00Z`.

| #  | Escenario                                      | Input (videos)                                                                 | Esperado        | Categoría         |
|----|------------------------------------------------|--------------------------------------------------------------------------------|-----------------|-------------------|
| 1  | Array vacío                                     | `[]`                                                                           | `null`          | Borde             |
| 2  | Video único (non-Short, maduro)                | 1 non-Short, 48h old, 5K views                                                | Ese mismo       | Standard          |
| 3  | Video único (Short)                            | 1 Short (15s), 1h old                                                         | Ese mismo       | Standard          |
| 4  | Solo Shorts → mejor engagement                 | Short A: 5K views, 12 eng. Short B: 1K views, 70 eng.                         | Short B         | Standard          |
| 5  | Maduro > 24h presente (prioridad máxima)       | Maduro 48h (5K), Reciente 2h (10K). Short presente.                           | Maduro          | Prioridad 1       |
| 6  | Sin maduro, con recientes > 1h → más vistas    | Non-Short 3h (1K), Non-Short 5h (20K)                                         | 5h (20K views)  | Prioridad 2       |
| 7  | Todos < 1h → más vistas                        | Non-Short 30min (500), Non-Short 15min (3K)                                   | 15min (3K views)| Prioridad 3       |
| 8  | Sin non-Shorts → fallback Shorts               | Short A (15s, 6 eng), Short B (30s, 30 eng)                                   | Short B         | Prioridad 4       |
| 9  | Shorts ignorados si hay non-Shorts maduros     | Short con 999K views/eng, Maduro 48h 5K views                                 | Maduro          | Shorts no compiten|
| 10 | Múltiples maduros → primero en el array        | Maduro-1 72h (100 views), Maduro-2 48h (999K views)                           | Maduro-1        | No mira views     |
| 11 | Borde: exactamente 24h (no > 24) → cae a paso 2| Non-Short 24h exactas (100), Non-Short 2h (50K)                              | 2h (50K views)  | Borde prioridad   |

### Notas sobre `selectBestVideo`

- El algoritmo **no considera las vistas** al elegir entre videos maduros (paso 1). Simplemente devuelve `matured[0]`.
- Shorts con alta interacción **nunca ganan** sobre non-Shorts, incluso si estos tienen 0 vistas.
- El borde `hoursSince === 24` no entra en el paso 1 (`> 24` es false), cae al paso 2.
- Si dos shorts tienen exactamente la misma interacción, `reduce` mantiene el primero.

---

## Resumen de cobertura

| Función            | Casos de prueba | Cobertura |
|--------------------|----------------|-----------|
| `parseISODuration` | 15             | Todas las variantes ISO + bordes + malformados |
| `isShort`          | 8              | Borde 60s incluido, casos + y - |
| `isDurable`        | 4              | Misma lógica que isShort |
| `hoursSince`       | 6              | Pasado, presente, futuro |
| `selectBestVideo`  | 11             | Todos los caminos del algoritmo + bordes |

**Total: 44 casos de prueba.**
