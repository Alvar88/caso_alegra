# Alegra CRM Demo — Estado del Proyecto

> Documento de referencia técnica. Actualizado al 30 de mayo 2026.

---

## 1. Propósito

Demo funcional de un CRM comercial construido como parte del caso técnico para el puesto **Head of Sales / GTM / AI Engineering en Alegra**. Demuestra un sistema de ventas inteligente con IA embebida, pipelines reales, datos de muestra, páginas de detalle con historial de notas, y un agente de clasificación de leads en tiempo real.

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
  page.tsx                    → Dashboard principal
  layout.tsx                  → Layout global (Sidebar + main, height 100vh)
  globals.css                 → Design tokens y variables CSS
  agente/page.tsx             → Lead Intelligence Agent (demo IA)
  arquitectura/page.tsx       → Diagrama de arquitectura del sistema
  contactos/
    page.tsx                  → Tabla de contactos (búsqueda, filtros, scroll interno)
    [id]/page.tsx             → Detalle de contacto (3 columnas)
  empresas/
    page.tsx                  → Tabla de empresas (búsqueda, filtros, scroll interno)
    [id]/page.tsx             → Detalle de empresa (3 columnas)
  pipeline/
    page.tsx                  → Kanban de deals (drag-and-drop)
    [id]/page.tsx             → Detalle de deal (3 columnas)
  api/
    analizar-lead/route.ts    → API Route: análisis de lead con DeepSeek (streaming)
    db/route.ts               → API Route: proxy Supabase legacy (no se usa actualmente)

components/
  Sidebar.tsx                 → Navegación lateral
  PipelineKanban.tsx          → Kanban con drag-and-drop + botón crear deal
  modals/
    Modal.tsx                 → Componente base de modal (overlay, ESC para cerrar)
    CreateContactModal.tsx    → Formulario de nuevo contacto con selector de empresa
    CreateEmpresaModal.tsx    → Formulario de nueva empresa
    CreateDealModal.tsx       → Formulario de nuevo deal con selector de contacto

data/                         → Datos estáticos de referencia (TypeScript, camelCase)
  contacts.ts                 → 20 contactos (contadores + PyMEs, 4 países)
  companies.ts                → 8 empresas
  deals.ts                    → 20 deals (10 por pipeline)
  reps.ts                     → 4 sales reps

lib/
  db.ts                       → Función dbFetch (cliente → Supabase REST directo)
  supabase.ts                 → Cliente Supabase SDK (disponible, no se usa en producción)
  types.ts                    → Tipos TypeScript del dominio

supabase/
  schema.sql                  → DDL completo de la base de datos
  seed.sql                    → Datos semilla para Supabase
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
| **notes** | TEXT | nullable — almacena JSON array de notas con timestamp |

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
| notes | TEXT | almacena JSON array de notas con timestamp |

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
| pain_hypothesis | TEXT | nullable — hipótesis generada por IA |
| confidence | ENUM | HIGH, MEDIUM, LOW |
| response_time_min | INT | nullable |
| updated_at | TIMESTAMPTZ | auto-updated por trigger |
| **notes** | TEXT | nullable — almacena JSON array de notas con timestamp |

### RLS (Row Level Security)
- SELECT público en todas las tablas (`FOR SELECT USING (true)`)
- UPDATE habilitado en `deals` y `companies` (para notas y drag-and-drop de stage)
- INSERT habilitado en `contacts`, `companies`, `deals` (para los modales de creación)

### Migración aplicada manualmente (post-schema inicial)
```sql
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;
CREATE POLICY "Public update companies notes" ON companies FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public update deals notes" ON deals FOR UPDATE USING (true) WITH CHECK (true);
```

---

## 5. Capa de Datos — `lib/db.ts`

```typescript
dbFetch(table: string, params?: string) → Promise<any[]>
```

- Llama directamente a la REST API de Supabase desde el **cliente** (browser)
- Sin proxy server — conexión directa browser → Supabase
- Si la respuesta no es OK: loggea `[dbFetch] tabla → STATUS error` y retorna `[]`
- Si hay error de red: retorna `[]`
- Logging activo en consola del browser para debugging

**Operaciones adicionales (inline en componentes):**
- `PATCH /rest/v1/contacts?id=eq.{id}` — actualizar notas
- `PATCH /rest/v1/companies?id=eq.{id}` — actualizar notas
- `PATCH /rest/v1/deals?id=eq.{id}` — actualizar stage (drag-and-drop) y notas
- `POST /rest/v1/contacts` — crear nuevo contacto
- `POST /rest/v1/companies` — crear nueva empresa
- `POST /rest/v1/deals` — crear nuevo deal

**Variables de entorno:**
```
NEXT_PUBLIC_SUPABASE_URL=https://jpptlznlexkxehxnyjeh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 6. Páginas Implementadas

### `/` — Dashboard
- KPIs: MRR cerrado, Pipeline value, Close rate, Tiempo de respuesta promedio
- Contadores: HOT/WARM/COLD leads, total contactos/empresas
- Tabla de actividad reciente (últimos 6 deals)
- Tabla del equipo comercial con capacity score y barra de progreso
- Banner de Lead Intelligence Agent con CTA

### `/contactos` — Tabla de Contactos
- Barra de búsqueda (nombre, empresa, email)
- Filtros desplegables: Segmento + ICP; botón "Limpiar filtros" contextual
- Scroll interno en tabla (página no crece)
- Filas clickeables → navegan a `/contactos/[id]`
- Botón **"+ Nuevo contacto"** → abre `CreateContactModal`

### `/contactos/[id]` — Detalle de Contacto
**Layout 3 columnas:**
- **Izquierda (260px):** Card con avatar/iniciales, badges ICP+Segmento, propiedades (email, teléfono, país, fuente, fecha creación)
- **Centro:** Tabla de deals asociados → Sección de notas con historial
- **Derecha (220px):** Card de empresa asociada (clickeable → va a `/empresas/[id]`) + resumen de deals (total, won, activos, MRR)
- **Botón "+ Nuevo deal"** en header (deal pre-asociado al contacto)

### `/empresas` — Tabla de Empresas
- Barra de búsqueda (nombre, industria) + filtro por Segmento
- Scroll interno; filas clickeables → `/empresas/[id]`
- Columnas: Empresa, Tipo, Clientes/Empleados, Deals activos, País
- Botón **"+ Nueva empresa"** → abre `CreateEmpresaModal`

### `/empresas/[id]` — Detalle de Empresa
**Layout 3 columnas:**
- **Izquierda (260px):** Card con ícono del segmento, nombre, badges, propiedades
- **Centro:** Tabla de contactos asociados (clickeables → `/contactos/[id]`) → Tabla de deals (clickeables → `/pipeline/[id]`) → Notas con historial
- **Derecha (220px):** Resumen (contactos, deals totales/activos/won, MRR) + ICP Mix (barras HOT/WARM/COLD)
- **Botones "+ Nuevo contacto"** (empresa pre-asociada) y **"+ Nuevo deal"** en header

### `/pipeline` — Kanban de Deals
- Dos pipelines: Contadores / PyMEs (tabs)
- 7 columnas: Discovery → Calificación → Demo → Trial → Negociación → Closed Won → Closed Lost
- **Drag-and-drop nativo** (HTML5 DnD API): arrastra cards entre columnas
  - Feedback visual: columna destino se ilumina en verde
  - Actualización local inmediata + PATCH stage a Supabase en background
  - Click sin arrastrar → navega a `/pipeline/[id]`
- Columnas `height: 650px` fijo + scroll interno
- Botón **"+ Nuevo deal"** → abre `CreateDealModal`

### `/pipeline/[id]` — Detalle de Deal
**Layout 3 columnas:**
- **Izquierda (260px):** Card con título, badges ICP/Stage/Pipeline, MRR destacado, todas las propiedades (confianza, fecha cierre, response time, software, pain category, descuento, trial facturas, pain hypothesis)
- **Centro:** Card de contacto (clickeable → `/contactos/[id]`) → Card de empresa (clickeable → `/empresas/[id]`) → Notas con historial
- **Derecha (220px):** Card del rep asignado con barra de capacity + resumen del deal

### `/agente` — Lead Intelligence Agent
- 4 presets + modo personalizado (formulario de 10 campos)
- Llama a `/api/analizar-lead` con streaming en tiempo real
- Muestra: ICP Score, Segmento, Confianza, Pain hypothesis, Rep asignado, Primer mensaje WhatsApp
- Routing automático de rep: algoritmo por especialización + capacity score inverso
- Raw stream visible del JSON de DeepSeek

---

## 7. Sistema de Notas (Historial)

Las notas se almacenan como **JSON array en el campo `notes` TEXT** de cada tabla.

**Formato:**
```json
[
  { "text": "Nota más reciente", "created_at": "2026-05-30T15:30:00.000Z" },
  { "text": "Nota anterior", "created_at": "2026-05-30T10:00:00.000Z" }
]
```

- Las notas nuevas se **prependen** al array (la más reciente siempre arriba)
- Compatibilidad con texto plano legacy: si el campo no es JSON válido, se trata como una sola entrada
- Shortcut: **⌘ + Enter** para guardar desde el textarea
- Disponible en: contactos, empresas y deals

---

## 8. Modales de Creación

Todos los modales comparten el componente base `Modal.tsx` (overlay oscuro, cierre con ESC o clic fuera).

### `CreateContactModal`
- Campos: nombre*, apellido*, email*, teléfono, país, rol, fuente, segmento, ICP score
- **Selector de empresa**: dropdown con todas las empresas existentes
- Soporte `preselectedCompanyId` — cuando se abre desde el detalle de una empresa, la empresa viene pre-seleccionada
- POST a `/rest/v1/contacts`

### `CreateEmpresaModal`
- Campos: nombre*, segmento, país, industria*, clientes (si CONTADOR) / empleados (si PYME), software actual, website
- El campo clientes/empleados cambia dinámicamente según el segmento
- POST a `/rest/v1/companies`

### `CreateDealModal`
- Campos: título*, contacto* (selector), rep* (selector), pipeline, etapa, ICP, confianza, MRR, fecha de cierre, software actual
- **El pipeline se auto-selecciona** según el segmento del contacto elegido
- Soporte `preselectedContactId` — cuando se abre desde el detalle de un contacto, el contacto viene pre-seleccionado
- POST a `/rest/v1/deals`

---

## 9. APIs

### `POST /api/analizar-lead`
**Request:** `{ lead: { nombre, cargo, empresa, pais, sector, tamano, fuente, accion, software, notas } }`
**Response:** `text/plain` streaming — JSON parcial mientras DeepSeek escribe

**JSON final:**
```json
{
  "segment": "CONTADOR|PYME",
  "icp_score": "HOT|WARM|COLD",
  "confidence": "HIGH|MEDIUM|LOW",
  "pain_hypothesis": "...",
  "first_message": "Mensaje WhatsApp...",
  "routing_reason": "..."
}
```
**Variable requerida:** `DEEPSEEK_API_KEY` en Vercel

### `GET /api/db?type=...`
Proxy legacy a Supabase (server-side). Ya no se usa — las páginas hacen fetch directo desde el browser. Disponible como fallback.

---

## 10. Integración DeepSeek

- **SDK:** `openai` npm apuntando a `baseURL: 'https://api.deepseek.com'`
- **Modelo:** `deepseek-chat` · temperatura 0.7 · max_tokens 500 · stream: true
- **Parseo progresivo:** `tryParsePartialJSON()` extrae campos via regex mientras llega el stream
- **Estado:** `DEEPSEEK_API_KEY` pendiente de configurar en Vercel para activar el agente en producción

---

## 11. Componentes

### `Sidebar`
- 6 items en orden: Dashboard → Contactos → Empresas → Deals → Lead Agent IA → Arquitectura
- "Lead Agent IA" destacado con badge "LIVE" y fondo morado
- Footer: DeepSeek · n8n · Supabase · WhatsApp Business API

### `PipelineKanban`
- Kanban completo con drag-and-drop, columnas fijas, scroll interno
- `useRef` para `draggedId` y `didDrag` (distingue click de drag)
- Botón "+ Nuevo deal" integrado

### `Modal` (base)
- Overlay oscuro con `z-index: 1000`
- Cierre: botón ✕, click fuera del modal, tecla ESC
- Scroll interno en el body del modal

---

## 12. Design System

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

## 13. Datos de Muestra

- **20 contactos:** 12 contadores + 8 PyMEs, 4 países (MX, CO, PE, AR), mezcla HOT/WARM/COLD
- **8 empresas:** 4 despachos contables + 4 PyMEs
- **20 deals:** 10 pipeline contadores + 10 pipeline PyMEs, todas las etapas representadas
- **4 reps:** Carlos Mendoza (MX), Valeria Soto (CO), Diego Ramos (PE), Ana García (AR)

---

## 14. Despliegue

- **URL producción:** `https://caso-alegra.vercel.app`
- **Repositorio:** `https://github.com/Alvar88/caso_alegra`
- **Rama:** `main` (auto-deploy en cada push)
- **Build time:** ~1-2 min (Turbopack)
- **Variables de entorno en Vercel:**
  - `NEXT_PUBLIC_SUPABASE_URL` ✅
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
  - `DEEPSEEK_API_KEY` ⚠️ pendiente de configurar

---

## 15. Próximos Pasos

- [ ] Configurar `DEEPSEEK_API_KEY` en Vercel para activar el Lead Agent en producción
- [ ] Integración IA en el CRM: scoring automático al crear contactos, sugerencias de siguiente acción
- [ ] Vista de reportes / analytics (funnel, conversión por etapa, MRR por rep)
- [ ] Notificaciones en tiempo real (Supabase Realtime)
