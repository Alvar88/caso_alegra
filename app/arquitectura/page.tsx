export default function ArquitecturaPage() {
  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          Cómo funciona por detrás
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>Arquitectura del Sistema</h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
          Stack completo · Flujo de datos en tiempo real · Costos de operación
        </p>
      </div>

      {/* Diagrama principal */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 24 }}>
          Flujo: Lead entra → IA clasifica → Rep recibe en 60 seg
        </div>

        {/* Fila de nodos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
          {[
            { icon: '◉', label: 'Lead Source', sub: 'Formulario · Webinar\nGoogle Ads · Referido', color: 'var(--muted)' },
            { arrow: true },
            { icon: '⬡', label: 'HubSpot / CRM', sub: 'Deal creado\nWebhook disparado', color: '#ff7a59' },
            { arrow: true },
            { icon: '⟳', label: 'n8n Workflow', sub: 'Orquestador\nTiempo real', color: '#ea4b71' },
            { arrow: true },
            { icon: '◆', label: 'DeepSeek API', sub: 'Clasificación ICP\nPrimer mensaje', color: 'var(--accent)', highlight: true },
            { arrow: true },
            { icon: '▣', label: 'Supabase', sub: 'Deal actualizado\nicp_score · pain', color: '#3ecf8e' },
            { arrow: true },
            { icon: '📱', label: 'WhatsApp Biz', sub: 'Rep notificado\n< 60 segundos', color: '#25D366' },
          ].map((node: any, i) => {
            if (node.arrow) {
              return (
                <div key={i} style={{ padding: '0 4px', color: 'var(--border)', fontSize: 20, flexShrink: 0 }}>→</div>
              )
            }
            return (
              <div key={i} style={{
                flexShrink: 0,
                background: node.highlight ? 'var(--accent-glow)' : 'var(--surface-2)',
                border: `1px solid ${node.highlight ? 'rgba(124,92,252,0.4)' : 'var(--border)'}`,
                borderRadius: 12,
                padding: '16px 14px',
                textAlign: 'center',
                minWidth: 110,
              }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{node.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: node.color, marginBottom: 5 }}>{node.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>{node.sub}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stack cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            layer: 'Frontend / UI',
            color: 'var(--accent)',
            items: [
              { name: 'Next.js 14', role: 'App Router + Server Components' },
              { name: 'Tailwind CSS', role: 'Dark theme, diseño responsive' },
              { name: 'Vercel', role: 'Deploy automático desde GitHub' },
            ],
          },
          {
            layer: 'Base de Datos',
            color: '#3ecf8e',
            items: [
              { name: 'Supabase', role: 'PostgreSQL + RLS + Realtime' },
              { name: '4 tablas', role: 'reps · companies · contacts · deals' },
              { name: 'Row Level Security', role: 'Lectura pública para el demo' },
            ],
          },
          {
            layer: 'Inteligencia IA',
            color: 'var(--warm)',
            items: [
              { name: 'DeepSeek V4', role: 'Clasificación ICP · Primer mensaje' },
              { name: 'Streaming API', role: 'Respuesta token a token en vivo' },
              { name: '$2.74/mes', role: 'Costo a 14K leads/mes en producción' },
            ],
          },
          {
            layer: 'Automatización',
            color: '#ea4b71',
            items: [
              { name: 'n8n', role: 'Orquestador de flujos sin código' },
              { name: 'Webhooks HubSpot', role: 'Trigger en creación de deal' },
              { name: 'Clay / Enrichment', role: 'Enriquecimiento automático de datos' },
            ],
          },
          {
            layer: 'Comunicación',
            color: '#25D366',
            items: [
              { name: 'WhatsApp Biz API', role: 'Notificación al rep < 60 seg' },
              { name: 'Braze / HubSpot AI', role: 'Secuencias de nurturing automáticas' },
              { name: 'Modjo / Spiich', role: 'Transcripción y análisis de llamadas' },
            ],
          },
          {
            layer: 'Routing de Leads',
            color: 'var(--hot)',
            items: [
              { name: 'ICP Weight', role: 'HOT 1.5× · WARM 1.0× · COLD 0.5×' },
              { name: 'Capacity Score', role: '(100 − deals activos) × especialización' },
              { name: 'Score compuesto', role: 'ICP × Capacity → rep con mayor score' },
            ],
          },
        ].map(block => (
          <div key={block.layer} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              padding: '12px 16px', borderBottom: '1px solid var(--border)',
              fontSize: 11, fontWeight: 700, color: block.color,
              textTransform: 'uppercase', letterSpacing: 0.8,
            }}>{block.layer}</div>
            <div style={{ padding: '12px 16px' }}>
              {block.items.map(item => (
                <div key={item.name} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{item.role}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fórmula de routing */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, marginBottom: 24,
      }}>
        <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
          Fórmula de Routing — Cómo el sistema elige al rep
        </div>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 10, padding: '16px 20px',
          fontFamily: 'monospace', fontSize: 13, color: 'var(--accent)', lineHeight: 2,
        }}>
          <div style={{ color: 'var(--muted)', fontSize: 11, marginBottom: 8 }}># Para cada rep disponible:</div>
          <div>icp_weight = HOT → 1.5 | WARM → 1.0 | COLD → 0.5</div>
          <div>capacity = (100 − deals_activos) / 100</div>
          <div>spec_bonus = match_segmento → 1.2 | mixed → 1.0 | no_match → 0.8</div>
          <div style={{ color: 'var(--foreground)', fontWeight: 700, borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8 }}>
            score = capacity × spec_bonus × icp_weight
          </div>
          <div style={{ color: 'var(--won)', marginTop: 4 }}>→ Asignar al rep con score más alto</div>
        </div>
      </div>

      {/* Fases de validación */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 12, color: 'var(--warm)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 16 }}>
          Plan de Implementación — 3 fases antes de escalar
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              fase: 'Fase 0', sub: 'Semanas 1–4', label: 'Validación silenciosa',
              desc: 'El agente clasifica todos los leads pero NO modifica el routing. Se compara la clasificación contra Closed Won/Lost reales.',
              signal: 'Verde: HOT convierte ≥ 35% · Rojo: HOT y COLD similares',
              color: 'var(--accent)',
            },
            {
              fase: 'Fase 1', sub: 'Semanas 5–12', label: 'A/B Test controlado',
              desc: '80% leads HOT van a reps priorizados por el sistema. 20% siguen en rotación normal. Métricas separadas por grupo.',
              signal: 'Verde: HOT close rate > 30% · Rojo: < 25%',
              color: 'var(--warm)',
            },
            {
              fase: 'Fase 2', sub: 'Semana 13+', label: 'Escala completa',
              desc: 'Routing 100% basado en score compuesto. Primer mensaje IA enviado por el rep con un toque. Objetivo: SQL→Close 21% → 27%.',
              signal: 'North star: ARR de leads HOT ≥ 2× COLD',
              color: 'var(--won)',
            },
          ].map(f => (
            <div key={f.fase} style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: f.color }}>{f.fase}</span>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{f.sub}</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>{f.label}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{f.desc}</div>
              <div style={{ fontSize: 11, color: f.color, background: f.color + '15', padding: '6px 10px', borderRadius: 6 }}>
                {f.signal}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
