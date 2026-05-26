# Guión de Video — Presentación Head of Sales, Alegra
**Alvar Rodríguez · Mayo 2026**

---

> **Estructura de tiempo:**
> - Slides 2–15 → **15 minutos** (~64 seg/slide en promedio)
> - Slides 16–19 → **5 minutos** (~75 seg/slide)
> - Slide 20 (Gracias) → cierre visual, sin narración

---

## PARTE 1 — El diagnóstico y el sistema (15 min)

---

### Slide 2 · La matemática del revenue *(~90 seg)*

Antes de hablar de estrategia, necesito hablar de matemática. Porque si el sistema actual genera $30M ARR con 14,000 leads al mes, 4,760 SQLs, y mil cierres — eso significa que cada punto porcentual que ganamos en la tasa de cierre vale $1.3 millones de ARR adicional. No es una estimación, es la aritmética del funnel.

Y hay un número que cambia todo: el churn. Si Alegra pierde el 10% de su base al año, eso son $3 millones que hay que reponer antes de crecer. La meta real del Año 1 no es generar $15M brutos — es generar $18M para llegar netos a $45M. Esa diferencia define si el equipo está ganando o corriendo en una banda sin moverse.

---

### Slide 3 · Los 3 cuellos de botella *(~60 seg)*

El funnel tiene tres puntos donde el revenue se cae silenciosamente. Primero: 5.2 horas de tiempo de respuesta promedio al lead — eso vale entre 5 y 10 millones de ARR. Segundo: 38% de los SQLs nunca son contactados efectivamente — $9.1 millones en deals que se cierran solos si alguien llama. Tercero: el CRM está al 61% de utilización — eso distorsiona el forecast y cuesta entre 4 y 5 millones en decisiones tomadas sobre datos incorrectos.

Ninguno de estos tres problemas requiere contratar más reps. Requiere un sistema.

---

### Slide 4 · Cuello #1 — Speed-to-Lead *(~75 seg)*

5.2 horas. Ése es el promedio, pero el promedio miente. La distribución real muestra que hay leads que esperan 12, 18, hasta 24 horas. Y los datos de conversión son contundentes: un lead contactado en los primeros 5 minutos tiene 21 veces más probabilidad de calificar que uno contactado una hora después.

El problema no es motivación. Es que el sistema de asignación actual es ciego. Un lead HOT llega al rep que toca turno, no al rep con capacidad real de atenderlo. Por eso diseñé el Capacity Score: una fórmula que mide deals abiertos, gap de cuota y actividad reciente para enviar cada lead al rep que puede responder ahora. No al que le toca.

El impacto conservador: $5.2M ARR. El agresivo, si además mejoramos el routing: $10.4M.

---

### Slide 5 · Cuello #2 — 38% No Responde *(~75 seg)*

El 38% de los SQLs que no responden no son leads perdidos — son leads abandonados. Ya levantaron la mano. Ya llenaron un formulario. El sistema simplemente no los siguió.

El rep promedio hace 1.8 intentos. El protocolo óptimo tiene 9 touchpoints en 5 días: WhatsApp personalizado el día cero, llamada, email, de nuevo WhatsApp — combinando canal, momento y mensaje. Cuando se implementa correctamente, la tasa de contacto efectivo sube del 62% al 79%. Eso son 307 deals adicionales al mes que antes nadie estaba cerrando.

El impacto: $9.1M ARR. Sin un rep nuevo. Solo con un protocolo que el sistema ejecuta de forma consistente.

---

### Slide 6 · Cuello #3 — CRM al 61% *(~60 seg)*

Un CRM al 61% no es un problema de adopción — es un problema de inteligencia de negocio. Si el 39% del pipeline está incompleto, el forecast es ficción. Y las decisiones de headcount, de presupuesto, de cuota — todas se toman sobre ficción.

Los tres síntomas del pipeline zombi: deals que no avanzan, close dates que se mueven solos, valores vacíos. La capa de IA de conversación — Modjo o Spiich — resuelve esto sin pedirle al rep que llene campos. La IA escucha la llamada y actualiza el CRM sola. El rep vende. El sistema registra.

---

### Slide 7 · Dos pipelines por segmento *(~90 seg)*

Uno de los errores más costosos que veo en equipos de ventas es gestionar dos tipos de cliente completamente distintos con el mismo pipeline. El Contador y la PyME no se comportan igual, no deciden igual, y no deben gestionarse igual.

El pipeline Contador tiene 7 etapas, dura entre 14 y 35 días, y el argumento de venta es económico — ROI, ahorro de tiempo, cumplimiento. La regla de close date es clara: si el deal entra antes del día 9 del mes, cierra este mes. Si no, cierra el siguiente.

La PyME es diferente. Ciclo de 3 a 14 días. La señal de cierre real no es una llamada — es una acción en producto: una factura creada, un período cerrado. El rep que entiende esa señal duplica su tasa de cierre con PyME. La regla de close date aquí: día 17 es el límite.

Dos pipelines. Dos cadencias. Dos playbooks. Eso es gestionar con precisión.

---

### Slide 8 · Propiedades del pipeline *(~60 seg)*

Cada etapa del pipeline necesita datos específicos para poder predecir y diagnosticar. No campos genéricos — campos que responden preguntas concretas. ¿Cuánto tardó el rep en responder? ¿Cuál fue el pain declarado por el cliente? ¿Qué objeción bloqueó el avance?

Estos campos tienen un tipo de llenado definido: algunos los rellena el sistema automáticamente — tiempo de respuesta, actividad reciente. Otros los rellena el rep después de cada interacción. La diferencia entre un CRM útil y uno que nadie usa es qué tan fácil es dar la información correcta en el momento correcto.

---

### Slide 9 · CRM como source of truth *(~60 seg)*

El CRM no es una herramienta de registro — es el sistema que hace posibles las decisiones. Si el CRM miente, el forecast miente. Si el forecast miente, el equipo toma decisiones equivocadas sobre qué perseguir esta semana.

Un ejemplo concreto: si el día 18 del mes el forecast dice $500K pero las reglas del pipeline dicen que ningún deal nuevo puede cerrar este mes — la acción correcta no es presionar al equipo. Es construir el pipeline del mes siguiente. Esa claridad solo la da un CRM que dice la verdad.

---

### Slide 10 · Automatizaciones — $14.3M ARR *(~90 seg)*

Las automatizaciones no son un proyecto de tecnología — son la infraestructura que hace que todo lo anterior funcione a escala. Dos motores.

Motor uno: Speed-to-Lead. Cuando un contacto pasa a SQL, HubSpot dispara n8n, que hace tres llamadas a la API: cuenta los deals activos del rep, revisa su agenda de las próximas 48 horas, y lee su cuota. Con esos datos calcula el Capacity Score y asigna el deal al rep con mayor disponibilidad real. Simultáneamente, genera el primer mensaje de WhatsApp personalizado para el lead. Todo esto en menos de 60 segundos desde que el lead llegó.

Motor dos: SQL Rescue. Los 9 touchpoints en 5 días ejecutados de forma automática para el 38% de SQLs que no responden. El rep no tiene que recordar hacer el seguimiento — el sistema lo hace.

Stack: HubSpot Sequences, n8n, WhatsApp Business API. Sin herramientas exóticas. Con lo que Alegra probablemente ya tiene o puede tener en semanas.

---

### Slide 11 · La curva J — rollout por territorio *(~75 seg)*

Cuando un equipo migra a un sistema nuevo, la productividad baja antes de subir. Eso no es un problema — es física. El problema es no tenerlo calculado.

La curva J del territorio piloto muestra que en la Semana 1 el rep opera al 40% de su capacidad efectiva: el pipeline viejo está lleno, el proceso nuevo se está aprendiendo y solo 35 de 80 slots están disponibles. En la Semana 2 sube al 65%. En la Semana 3, al 85% o más.

La clave del rollout por territorio es que en ningún momento más de un territorio está en la curva J al mismo tiempo. Los otros tres siguen generando revenue sin interrupción. El costo del cambio: $200K en revenue retrasado por tres semanas. El costo de hacer el cambio todo junto — Big Bang — puede ser entre $800K y $1.2M en riesgo simultáneo. No hay manera de justificar ese riesgo.

---

### Slide 12 · Plan del equipo — Managers y AEs *(~75 seg)*

Un sistema que se le impone al equipo se tolera. Uno que el equipo co-diseñó se defiende.

Con los Sales Managers, el proceso empieza antes de escribir una sola regla: cinco preguntas de diagnóstico para entender cómo gestionan hoy, qué datos confían, qué no confían, dónde sienten que el sistema falla. De esas conversaciones salen los seis acuerdos que hacen que el sistema funcione — acuerdos sobre qué datos son obligatorios, cómo se lee el forecast, qué pasa cuando un deal no tiene close date.

Con los AEs, la adopción tiene cuatro principios: automatizar lo que odian hacer — el follow-up manual, el llenado del CRM. Darles un espejo de datos — que vean sus propios números en tiempo real. Gamificación con consecuencias reales — un leaderboard que importa. Y recursos cuando algo no funciona — soporte real, no un PDF de onboarding.

---

### Slide 13 · Revenue Council *(~60 seg)*

El Revenue Council es la estructura que convierte las reuniones de ventas en decisiones de negocio. Un foro mensual — Sales, Producto y Marketing — donde las razones de pérdida de deals no son una queja sino un reporte financiero de oportunidades perdidas.

Si en 30 días se acumulan más de 10 deals perdidos por la misma razón, Producto tiene 15 días para responder. Eso convierte a ventas en el mejor sistema de feedback que Producto puede tener. Y convierte a Producto en un multiplicador de revenue, no en un obstáculo.

---

### Slide 14 · Las 6 palancas *(~75 seg)*

Las seis palancas identificadas representan $38M+ en ARR potencial. Speed-to-Lead entre $5.2M y $10.4M, activable en el Q1 del Año 1. SQL Rescue $9.1M, también Q1. Canal Contador $10.1M, Q2 del Año 1 en adelante. MQL a SQL con 840 SQLs adicionales al mes: $5.7M. NRR Expansion: $1.8M en Q3. Y el PLG para PyME, medible a partir del Q2 del Año 2.

Estas palancas no se suman todas en un año — operan en plazos distintos, y su efecto se compone. Por eso el camino a $101M no es una suma: es crecimiento compuesto durante tres años.

---

### Slide 15 · Visión 3 años *(~75 seg)*

El camino a $101M tiene tres fases y cada una tiene una lógica distinta.

Año 1 es eficiencia. Sin reps nuevos. Los $18M brutos vienen de recuperar el revenue que ya existía en el funnel y que el sistema estaba dejando ir. SQL→Close sube al 25-27%.

Año 2 es calidad. El funnel inferior ya funciona, entonces el trabajo sube al funnel superior: scoring predictivo, PLG para PyME, coaching con IA. SQL→Close llega al 28%.

Año 3 es escala. NRR al 110%: la base crece sola. El canal contador representa entre el 25 y el 30% del ARR. SQL→Close al 30% o más. Y el headcount se agrega al ritmo que el sistema puede soportar — no antes.

El camino a $101M no pasa por contratar más reps. Pasa por recuperar lo que ya existe, sistematizar lo que funciona, y dejar que la inteligencia amplíe lo que el equipo no puede hacer a escala.

---

## PARTE 2 — IA Aplicada al Proceso Comercial (5 min)

---

### Slide 16 · IA Aplicada — Transición *(~55 seg)*

La IA más poderosa no es la más sofisticada. Es la que genera revenue medible desde el día 60.

En las siguientes tres secciones voy a mostrar exactamente cómo. Primero el problema — qué falla en el momento exacto en que llega un lead. Segundo la solución — la arquitectura de un agente que actúa en menos de 60 segundos. Y tercero la evidencia — cómo validar antes de comprometer al equipo, con datos que confirman que el sistema supera el juicio humano.

Esto no es un proyecto de IA en el roadmap. Es el sistema que mueve la primera palanca antes de que termine el Q1.

---

### Slide 17 · El momento cero del lead *(~90 seg)*

En el momento exacto en que un lead llega a Alegra, ocurren tres fallas de forma simultánea.

Primera falla: el lead no está clasificado. HOT y COLD reciben el mismo mensaje, el mismo rep, la misma velocidad. El sistema no distingue entre un contador con 30 clientes y una PyME que abrió un email.

Segunda falla: el rep equivocado. El round-robin ciego asigna el lead al rep que toca turno, no al que tiene capacidad real. El lead HOT llega al rep con 14 deals abiertos y la agenda llena. Ese rep no va a priorizar ese lead hoy.

Tercera falla: mensaje genérico. El primer contacto no menciona lo que hizo el lead, no nombra su pain probable, suena exactamente igual que los 4,759 SQLs que recibieron ese mismo mensaje.

El resultado: 5.2 horas de tiempo de respuesta promedio, 21% de SQL→Close, y hasta $10.4M de ARR que se pierden silenciosamente. No en deals que dijeron que no — en deals que nunca tuvieron una conversación real.

---

### Slide 18 · Lead Intelligence Agent *(~90 seg)*

El agente tiene tres outputs en un solo trigger — desde el formulario de entrada, en menos de 60 segundos.

Primero: clasifica. HOT, WARM o COLD más el segmento — Contador o PyME. A partir del cargo, la empresa, el sector, el número de empleados, la fuente y las respuestas del formulario. El score determina el peso en el routing: HOT tiene un multiplicador de 1.5 sobre el Capacity Score del rep.

Segundo: enruta. Toma el lead clasificado, calcula qué rep tiene el mayor score compuesto — capacidad real multiplicada por el peso del lead — y le envía una notificación por Slack con el contexto completo. No un nombre. Un brief.

Tercero: genera. El primer mensaje de WhatsApp personalizado para el lead. Menciona lo que hizo. Nombra su pain probable. Propone una llamada de 15 minutos. El rep lo revisa y lo envía con un toque — no redacta nada.

El flujo técnico: HubSpot dispara n8n, que enriquece con Clay, procesa con OpenAI API, calcula el Capacity Score y dispara simultáneamente hacia Slack y WhatsApp Business API. Todo en menos de 60 segundos desde que el lead existió.

---

### Slide 19 · Validación por fases *(~65 seg)*

El agente no se lanza a producción en el día uno. Se valida en tres fases.

Fase cero: shadow mode. Durante cuatro semanas, el agente corre en paralelo al proceso actual sin intervenir. Cada predicción se compara con el resultado real. La señal de validación: si los leads clasificados como HOT tienen una tasa de cierre mayor o igual al 35%, el modelo es válido.

Fase uno: A/B 80-20. El 20% de los leads va por el agente, el 80% por el proceso actual. Dos señales para escalar: HOT con más del 30% de close rate y revenue por lead mayor a 1.5 veces el grupo de control.

Fase dos: escala completa. SQL→Close sube al 25-27%. Y el equipo adoptó el sistema porque los datos lo confirmaron — no porque se lo pidieron.

Tres métricas que miden todo: tasa de respuesta al primer mensaje mayor al 40%, ARR de leads HOT más del doble que COLD, y SQL→Close de HOT mayor o igual al 35%.

---

> **[Slide 20 — Gracias / cierre visual — sin narración]**

---

## Notas de producción

- **Tono:** directo, seguro, sin sonar vendedor — presenta evidencia, no promesas
- **Ritmo:** pausas de 1-2 seg entre secciones clave (especialmente después de cifras grandes)
- **Énfasis:** las cifras de ARR deben sonar con peso — no apresuradas
- **Transiciones:** el slide ya avanza en pantalla; la voz llega al final de la idea antes de que el slide cambie
- **Duración total:** ~20 minutos + slide de cierre visual
