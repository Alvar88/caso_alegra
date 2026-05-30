# Alegra CRM Demo — Estado del Proyecto

> Documento de referencia técnica. Refleja el estado actual del sistema al 30 de mayo 2026.

---

## 1. Propósito

Demo funcional de un CRM comercial construido como parte del caso técnico para el puesto **Head of Sales / GTM / AI Engineering en Alegra**. El objetivo es demostrar un sistema de ventas inteligente con IA embebida, pipelines reales, datos de muestra y un agente de clasificación de leads en tiempo real.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16.2.6 (App Router, Turbopack) |
| UI | React 19 — inline styles, sin librería de componentes |
| Lenguaje | TypeScript 5 |
| Base de datos | Supabase (PostgreSQL) |
| AI / LLM | DeepSeek API (`deepseek-chat`) vía OpenAI SDK |
| Estilos globales | Tailwind CSS 4 + variables CSS custom |
| Fuente | Nunito (Google Fonts) |
| Deploy | Vercel (conectado a GitHub `Alvar88/caso_alegra`, rama `main`) |

---

## 3. Estructura de Archivos

```
app/
  page.tsx                  → Dashboard principal
  layout.tsx                → Layout global (Sidebar + main)
  globals.css               → Design tokens y variables CSS
  agente/page.tsx           → Lead Intelligence Agent (demo IA)
  arquitectura/page.tsx     → Diagrama de arquitectura del sistema
  contactos/page.tsx        → Vista tabla de contactos
  empresas/page.tsx         → Vista tabla de empresas
  pipeline/page.tsx         → Vista Kanban del pipeline
  api/
    analizar-lead/route.ts  → API Route: análisis de lead con DeepSeek (streaming)
    db/route.ts             → API Route: proxy a Supabase (legacy, no se usa actualmente)

components/
  Sidebar.tsx               → Navegación lateral
  PipelineKanban.tsx        → Kanban con drag-and-drop

data/                       → Datos estáticos de referencia (TypeScript, camelCase)
  contacts.ts               → 20 contactos (contadores + PyMEs, 4 países)
  companies.ts              → 8 empresas
  deals.ts                  → 20 deals (10 por pipeline)
  reps.ts                   → 4 sales reps

lib/
  db.ts                     → Función dbFetch (cliente → Supabase REST directo)
  supabase.ts               → Cliente Supabase SDK (disponible, no se usa en producción)
  types.ts                  → Tipos TypeScript del dominio

supabase/
  schema.sql                → DDL completo de la base de datos
  seed.sql                  → Datos semilla para Supabase
```

---

## 4. Base de Datos — Supabase

**Proyecto:** `jpptlznlexkxehxnyjeh.supabase.co`
**Plan:** Free tier
**Auth:** Anon key pública (hardcodeada como fallback en `lib/db.ts`)

### Tablas

#### `reps`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| avatar | TEXT | Iniciales (ej. "CM") |
| specialization | ENUM | CONTADOR, PYME, mixed |
| country | ENUM | MX, CO, PE, AR |
| active_deals | INT | |
| quota_gap | NUMERIC | USD |
| capacity_score | INT | 0–100 |
| mrr | NUMERIC | USD/mes |
| closed_this_month | INT | |

#### `companies`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| name | TEXT | |
| segment | ENUM | CONTADOR, PYME |
| country | ENUM | MX, CO, PE, AR |
| industry | TEXT | |
| employees | INT | nullable — PyMEs |
| clients | INT | nullable — Contadores |
| current_software | TEXT | nullable |
| website | TEXT | nullable |

#### `contacts`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| first_name / last_name | TEXT | |
| email | TEXT UNIQUE | |
| phone | TEXT | nullable |
| role | ENUM | dueno, cfo, fundador, etc. |
| company_id | UUID FK → companies | nullable |
| country | ENUM | |
| source | ENUM | webinar, google_ads, formulario_web, etc. |
| segment | ENUM | CONTADOR, PYME |
| icp_score | ENUM | HOT, WARM, COLD |
| notes | TEXT | nullable |

#### `deals`
| Campo | Tipo | Notas |
|-------|------|-------|
| id | UUID PK | |
| title | TEXT | |
| contact_id | UUID FK → contacts | CASCADE delete |
| rep_id | UUID FK → reps | |
| pipeline | ENUM | contadores, pymes |
| stage | ENUM | discovery → ramp (7 etapas) |
| icp_score | ENUM | HOT, WARM, COLD |
| mrr | NUMERIC | USD/mes |
| close_date | DATE | nullable |
| loss_reason | ENUM | precio, no_responde, etc. |
| pain_hypothesis | TEXT | nullable |
| confidence | ENUM | HIGH, MEDIUM, LOW |
| response_time_min | INT | nullable |
| updated_at | TIMESTAMPTZ | auto-updated por trigger |

**RLS:** Habilitado con políticas de lectura pública (`FOR SELECT USING (true)`). No hay políticas de escritura excepto PATCH en deals (sin autenticación — funciona con anon key).

---

## 5. Capa de Datos — `lib/db.ts`

```typescript
dbFetch(table: string, params?: string) → Promise<any[]>
```

- Llama directamente a la REST API de Supabase desde el **cliente** (browser)
- Sin proxy server — conexión directa browser → Supabase
- Si la respuesta no es OK (`!res.ok`): loggea el error y retorna `[]`
- Si hay error de red: retorna `[]`
- Logging activo: `[dbFetch] tabla → N rows` o `[dbFetch] tabla → STATUS error`

**Variables de entorno:**
```
NEXT_PUBLIC_SUPABASE_URL=https://jpptlznlexkxehxnyjeh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
Configuradas en Vercel dashboard y en `.env.local` local. Hardcodeadas como fallback en el código.

---

## 6. Páginas Implementadas

### `/` — Dashboard
- KPIs: MRR cerrado, Pipeline value, Close rate, Tiempo de respuesta promedio
- Contadores: HOT/WARM/COLD leads, total contactos/empresas
- Tabla de actividad reciente (últimos 6 deals)
- Tabla del equipo comercial con capacity score y barra de progreso
- Banner de Lead Intelligence Agent activo con CTA

### `/pipeline` — Kanban
- Dos pipelines: Contadores / PyMEs (tabs)
- 7 columnas: Discovery → Calificación → Demo → Trial → Negociación → Closed Won → Closed Lost
- **Drag-and-drop nativo** (HTML5 DnD API): arrastra cards entre columnas
  - Feedback visual: columna destino se ilumina en verde al hover
  - Actualización local inmediata + PATCH a Supabase en background
- Columnas con `height: 650px` fijo (todas iguales) + scroll interno
- Cards muestran: ICP badge, MRR, nombre contacto, empresa, país, rep avatar, alerta si response_time > 60 min

### `/contactos` — Tabla de Contactos
- Barra de búsqueda (nombre, empresa, email)
- Filtros desplegables: Segmento (Contador/PyME) + ICP (HOT/WARM/COLD)
- Botón "Limpiar filtros" (aparece solo si hay filtros activos)
- Scroll interno en la tabla (layout no crece)
- Columnas: Avatar+Nombre, Empresa, Segmento, ICP, Fuente, Deals asociados

### `/empresas` — Tabla de Empresas
- Misma estructura que Contactos
- Barra de búsqueda (nombre, industria)
- Filtro por Segmento
- Scroll interno
- Columnas: Empresa+Industria, Tipo, Clientes/Empleados, Deals activos, País

### `/agente` — Lead Intelligence Agent (DEMO IA)
- 4 presets de escenarios (HOT Contador, WARM PyME, COLD incompleto, HOT migración urgente)
- Modo personalizado: formulario libre de 10 campos
- Llama a `/api/analizar-lead` con streaming
- Muestra en tiempo real (typewriter): ICP Score, Segmento, Confianza, Pain hypothesis, Rep asignado, Primer mensaje WhatsApp
- Routing automático de rep: algoritmo por especialización + capacity score inverso
- Raw stream visible (JSON de DeepSeek mientras escribe)

### `/arquitectura` — Diagrama de Arquitectura
- Vista estática del sistema (pendiente de revisión de contenido)

---

## 7. APIs

### `POST /api/analizar-lead`
**Propósito:** Analizar un lead con IA y retornar clasificación + mensaje en streaming

**Request body:**
```json
{
  "lead": {
    "nombre": "...",
    "cargo": "...",
    "empresa": "...",
    "pais": "...",
    "sector": "...",
    "tamano": "...",
    "fuente": "...",
    "accion": "...",
    "software": "...",
    "notas": "..."
  }
}
```

**Response:** `text/plain` streaming (chunks de JSON parcial)

**JSON final esperado:**
```json
{
  "segment": "CONTADOR|PYME",
  "icp_score": "HOT|WARM|COLD",
  "confidence": "HIGH|MEDIUM|LOW",
  "pain_hypothesis": "...",
  "first_message": "Mensaje WhatsApp en español...",
  "routing_reason": "..."
}
```

**Modelo:** `deepseek-chat` vía `api.deepseek.com` (compatible con OpenAI SDK)
**Variable requerida:** `DEEPSEEK_API_KEY` en Vercel env vars
**Estado:** API Key no configurada en Vercel → muestra error en UI si se intenta usar sin la key

### `GET /api/db?type=...`
**Propósito:** Proxy legacy a Supabase desde server-side (ya no se usa — las páginas hacen fetch directo desde el cliente)
**Tipos disponibles:** `test`, `dashboard`, `pipeline`, `contacts`, `companies`

---

## 8. Integración DeepSeek

- **SDK:** `openai` npm package apuntando a `baseURL: 'https://api.deepseek.com'`
- **Modelo:** `deepseek-chat`
- **Modo:** streaming (`stream: true`)
- **Temperatura:** 0.7, max_tokens: 500
- **Prompt:** System prompt extenso con contexto de segmentos Alegra, criterios ICP, y formato de respuesta JSON estricto
- **Parseo:** `tryParsePartialJSON()` — extrae campos con regex mientras el stream llega (permite UI progresiva)

---

## 9. Componentes

### `Sidebar`
- Navegación con 6 items: Dashboard, Pipeline, Contactos, Empresas, Lead Agent IA, Arquitectura
- Item "Lead Agent IA" destacado con badge "LIVE"
- Footer con estado de conexiones: DeepSeek · n8n · Supabase · WhatsApp Business API

### `PipelineKanban`
- Toda la lógica del Kanban (ver sección `/pipeline`)
- Estado local de deals + drag-and-drop con `useRef` para el ID arrastrado

---

## 10. Design System

Variables CSS en `globals.css`:
```css
--primary:     #00C073   /* Verde Alegra */
--secondary:   #5C2D91   /* Morado */
--background:  #F5F4FA
--surface:     #FFFFFF
--foreground:  #1A1A2E
--hot:         #EF4444
--warm:        #B45309
--cold:        #9CA3AF
--font-family: 'Nunito', 'Inter', sans-serif
```

---

## 11. Datos de Muestra

- **20 contactos:** 12 contadores + 8 PyMEs, 4 países (MX, CO, PE, AR), mezcla HOT/WARM/COLD
- **8 empresas:** 4 despachos contables + 4 PyMEs
- **20 deals:** 10 pipeline contadores + 10 pipeline PyMEs, todas las etapas representadas
- **4 reps:** Carlos Mendoza (MX), Valeria Soto (CO), Diego Ramos (PE), Ana García (AR)

---

## 12. Despliegue

- **URL producción:** `https://caso-alegra.vercel.app`
- **Repositorio:** `https://github.com/Alvar88/caso_alegra`
- **Rama:** `main` (Vercel despliega automáticamente en cada push)
- **Build:** Next.js Turbopack, ~1-2 min por deploy
- **Variables de entorno en Vercel:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DEEPSEEK_API_KEY` ← **pendiente de configurar para activar el agente**

---

## 13. Pendiente / Próximos Pasos

- [ ] Páginas de detalle: contacto individual, empresa individual, deal individual
- [ ] Activar DeepSeek API Key en Vercel para el Lead Agent
- [ ] Integración IA más profunda en el CRM (scoring automático, sugerencias)
- [ ] Módulo de registro/creación de contactos, empresas y deals
- [ ] Vista de reportes / analytics
