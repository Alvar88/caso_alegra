'use client'
import { useState, useRef } from 'react'
import { reps } from '@/data/reps'

const presets = [
  {
    label: '🔥 Contador HOT — Despacho grande',
    lead: {
      nombre: 'Armando Fuentes',
      cargo: 'Dueño del despacho',
      empresa: 'Fuentes & Asociados Contadores',
      pais: 'México',
      sector: 'Servicios contables',
      tamano: '38 clientes activos',
      fuente: 'Descarga de guía de cierres contables',
      accion: 'Descargó la guía + abrió 4 emails de la secuencia + visitó la página de precios 2 veces',
      software: 'CONTAPAQi + hojas de cálculo',
      notas: 'Es decisor único. Mencionó que pierde 4 días al mes en cierres manuales.',
    },
  },
  {
    label: '🟡 PyME WARM — Empresa mediana evaluando',
    lead: {
      nombre: 'Marcela Ríos',
      cargo: 'Gerente Administrativa',
      empresa: 'Distribuidora Ríos Hermanos',
      pais: 'Colombia',
      sector: 'Distribución y logística',
      tamano: '22 empleados',
      fuente: 'Formulario web',
      accion: 'Llenó formulario pidiendo más información sobre planes. No ha agendado demo.',
      software: 'Excel',
      notas: 'No confirmó si es decisora. Mencionó que "lo tiene que revisar con el dueño".',
    },
  },
  {
    label: '❄️ Lead COLD — Datos incompletos',
    lead: {
      nombre: 'José M.',
      cargo: 'Desconocido',
      empresa: '',
      pais: 'Argentina',
      sector: 'Sin especificar',
      tamano: '1-2 empleados (estimado)',
      fuente: 'Google Ads',
      accion: 'Clic en anuncio, llegó a landing, rebotó en 40 segundos sin interacción',
      software: '',
      notas: 'Solo dejó email de gmail. Sin número de teléfono.',
    },
  },
  {
    label: '🔥 Contador HOT — Migración urgente',
    lead: {
      nombre: 'Patricia Solano',
      cargo: 'Socia directora',
      empresa: 'Solano Consultores Fiscales',
      pais: 'Perú',
      sector: 'Consultoría fiscal y tributaria',
      tamano: '27 clientes activos (empresas medianas)',
      fuente: 'Demo solicitada directamente desde web',
      accion: 'Solicitó demo para esta semana. Mencionó que su software actual tuvo un error en la SUNAT y perdió un cliente',
      software: 'Sistema local desactualizado',
      notas: 'Urgencia real: perdió un cliente por error del sistema. Busca migrar en menos de 30 días.',
    },
  },
]

type LeadForm = typeof presets[0]['lead']

const icpColors: Record<string, string> = {
  HOT: 'var(--hot)',
  WARM: 'var(--warm)',
  COLD: 'var(--muted)',
}
const icpBg: Record<string, string> = {
  HOT: 'var(--hot-bg)',
  WARM: 'var(--warm-bg)',
  COLD: 'var(--cold-bg)',
}

function selectRepForLead(segment: string, icpScore: string): typeof reps[0] {
  const icpWeight = icpScore === 'HOT' ? 1.5 : icpScore === 'WARM' ? 1.0 : 0.5
  const scored = reps.map(r => {
    const specializationMatch =
      r.specialization === segment || r.specialization === 'mixed' ? 1.2 : 0.8
    const capacityInverse = (100 - r.capacityScore) / 100
    return { rep: r, score: (capacityInverse * specializationMatch * icpWeight) }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0].rep
}

function tryParsePartialJSON(text: string): Record<string, string> | null {
  const fields: Record<string, string> = {}
  const keys = ['segment', 'icp_score', 'confidence', 'pain_hypothesis', 'first_message', 'routing_reason']

  for (const key of keys) {
    const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]*)"?`)
    const match = text.match(regex)
    if (match) {
      fields[key] = match[1]
    }
  }

  return Object.keys(fields).length > 0 ? fields : null
}

export default function AgentePage() {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [form, setForm] = useState<LeadForm>(presets[0].lead)
  const [loading, setLoading] = useState(false)
  const [rawStream, setRawStream] = useState('')
  const [parsed, setParsed] = useState<Record<string, string> | null>(null)
  const [phase, setPhase] = useState<'idle' | 'connecting' | 'streaming' | 'done'>('idle')
  const [assignedRep, setAssignedRep] = useState<typeof reps[0] | null>(null)
  const rawRef = useRef('')

  const handlePreset = (i: number) => {
    setSelectedPreset(i)
    setForm(presets[i].lead)
    setCustomMode(false)
    resetState()
  }

  const resetState = () => {
    setRawStream('')
    setParsed(null)
    setPhase('idle')
    setAssignedRep(null)
    rawRef.current = ''
  }

  const handleAnalizar = async () => {
    resetState()
    setLoading(true)
    setPhase('connecting')

    try {
      const res = await fetch('/api/analizar-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead: form }),
      })

      if (!res.ok) {
        const err = await res.json()
        setRawStream(`Error: ${err.error ?? 'No se pudo conectar con DeepSeek'}`)
        setPhase('done')
        setLoading(false)
        return
      }

      setPhase('streaming')
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        rawRef.current += chunk
        setRawStream(rawRef.current)

        const partial = tryParsePartialJSON(rawRef.current)
        if (partial) {
          setParsed(partial)
          if (partial.segment && partial.icp_score && !assignedRep) {
            const rep = selectRepForLead(partial.segment, partial.icp_score)
            setAssignedRep(rep)
          }
        }
      }

      setPhase('done')
      const final = tryParsePartialJSON(rawRef.current)
      if (final) {
        setParsed(final)
        if (final.segment && final.icp_score) {
          setAssignedRep(selectRepForLead(final.segment, final.icp_score))
        }
      }
    } catch (e) {
      setRawStream(`Error de conexión: ${e}`)
      setPhase('done')
    }

    setLoading(false)
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 12px',
          background: 'var(--accent-glow)',
          border: '1px solid rgba(124,92,252,0.3)',
          borderRadius: 20,
          fontSize: 11, color: 'var(--accent)', fontWeight: 600,
          marginBottom: 12,
          textTransform: 'uppercase', letterSpacing: 0.8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
          LIVE · Conectado a DeepSeek API
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>
          Lead Intelligence Agent
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>
          Clasificación ICP · Routing automático · Primer mensaje WhatsApp — generado por IA en tiempo real
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>
        {/* LEFT: Input */}
        <div>
          {/* Presets */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Escenarios de ejemplo
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {presets.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handlePreset(i)}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    borderRadius: 8,
                    border: '1px solid',
                    borderColor: selectedPreset === i ? 'var(--accent)' : 'var(--border)',
                    background: selectedPreset === i ? 'var(--accent-glow)' : 'var(--surface)',
                    color: selectedPreset === i ? 'var(--foreground)' : 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => { setCustomMode(true); setSelectedPreset(null); resetState() }}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  borderRadius: 8,
                  border: '1px dashed',
                  borderColor: customMode ? 'var(--accent)' : 'var(--border)',
                  background: customMode ? 'var(--accent-glow)' : 'transparent',
                  color: customMode ? 'var(--foreground)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}>
                ✏️ Ingresar lead personalizado
              </button>
            </div>
          </div>

          {/* Form */}
          {(selectedPreset !== null || customMode) && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                Datos del lead
              </div>
              {[
                { key: 'nombre', label: 'Nombre' },
                { key: 'cargo', label: 'Cargo' },
                { key: 'empresa', label: 'Empresa (opcional)' },
                { key: 'pais', label: 'País' },
                { key: 'sector', label: 'Sector' },
                { key: 'tamano', label: 'Empleados / Clientes' },
                { key: 'fuente', label: 'Fuente del lead' },
                { key: 'accion', label: 'Acción / señal detectada' },
                { key: 'software', label: 'Software actual' },
                { key: 'notas', label: 'Notas adicionales' },
              ].map(field => (
                <div key={field.key} style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>
                    {field.label}
                  </label>
                  {field.key === 'accion' || field.key === 'notas' ? (
                    <textarea
                      value={(form as Record<string, string>)[field.key] ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      rows={2}
                      style={{
                        width: '100%',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        color: 'var(--foreground)',
                        fontSize: 12,
                        resize: 'none',
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <input
                      value={(form as Record<string, string>)[field.key] ?? ''}
                      onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      style={{
                        width: '100%',
                        background: 'var(--surface-2)',
                        border: '1px solid var(--border)',
                        borderRadius: 6,
                        padding: '8px 10px',
                        color: 'var(--foreground)',
                        fontSize: 12,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {(selectedPreset !== null || customMode) && (
            <button
              onClick={handleAnalizar}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: loading ? 'var(--border)' : 'var(--accent)',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                letterSpacing: 0.3,
              }}
            >
              {loading ? '◌ Analizando con IA...' : '◆ Analizar con Lead Intelligence Agent'}
            </button>
          )}
        </div>

        {/* RIGHT: Output */}
        <div>
          {phase === 'idle' && (
            <div style={{
              height: '100%',
              minHeight: 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px dashed var(--border)',
              borderRadius: 12,
              color: 'var(--muted)',
              fontSize: 14,
              textAlign: 'center',
              padding: 40,
            }}>
              <div>
                <div style={{ fontSize: 32, marginBottom: 12 }}>◆</div>
                <div>Selecciona un escenario y haz clic en<br /><strong>Analizar</strong> para ver el agente en acción</div>
              </div>
            </div>
          )}

          {phase === 'connecting' && (
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--accent)',
              borderRadius: 12,
              padding: 24,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: 'var(--accent)',
                animation: 'pulse-glow 1s infinite',
              }} />
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Conectando con DeepSeek API...</span>
            </div>
          )}

          {(phase === 'streaming' || phase === 'done') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Parsed results */}
              {parsed && (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  animation: 'slide-in 0.3s ease',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: phase === 'streaming' ? 'var(--accent-glow)' : 'transparent',
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {phase === 'streaming' ? '⟳ Clasificando...' : '✓ Clasificación completada'}
                    </span>
                  </div>

                  <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {/* ICP + Segment */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      {parsed.icp_score && (
                        <div style={{
                          flex: 1, padding: '14px 16px',
                          background: icpBg[parsed.icp_score] ?? 'var(--surface-2)',
                          border: `1px solid ${(icpColors[parsed.icp_score] ?? 'var(--border)')}44`,
                          borderRadius: 10,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 24, fontWeight: 800, color: icpColors[parsed.icp_score] }}>
                            {parsed.icp_score}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>ICP Score</div>
                        </div>
                      )}
                      {parsed.segment && (
                        <div style={{
                          flex: 1, padding: '14px 16px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: parsed.segment === 'CONTADOR' ? 'var(--accent)' : 'var(--won)' }}>
                            {parsed.segment}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Segmento</div>
                        </div>
                      )}
                      {parsed.confidence && (
                        <div style={{
                          flex: 1, padding: '14px 16px',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          borderRadius: 10,
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--muted)' }}>
                            {parsed.confidence}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Confianza</div>
                        </div>
                      )}
                    </div>

                    {/* Pain hypothesis */}
                    {parsed.pain_hypothesis && (
                      <div style={{
                        padding: '12px 16px',
                        background: 'var(--surface-2)',
                        borderRadius: 10,
                        borderLeft: '3px solid var(--accent)',
                      }}>
                        <div style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>
                          Pain hypothesis
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--foreground)', lineHeight: 1.5 }}>
                          {parsed.pain_hypothesis}
                          {phase === 'streaming' && !parsed.routing_reason && (
                            <span className="cursor-blink" />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Rep routing */}
                    {assignedRep && (
                      <div style={{
                        padding: '12px 16px',
                        background: 'var(--surface-2)',
                        borderRadius: 10,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: 'var(--accent)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                        }}>{assignedRep.avatar}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }}>
                            Asignado a
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{assignedRep.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            Capacity {assignedRep.capacityScore}% · {assignedRep.activeDeals} deals activos
                          </div>
                        </div>
                        <div style={{
                          fontSize: 10, padding: '4px 10px',
                          borderRadius: 6,
                          background: 'var(--won-bg)',
                          color: 'var(--won)',
                          fontWeight: 600,
                        }}>ASIGNADO</div>
                      </div>
                    )}

                    {/* WhatsApp message */}
                    {parsed.first_message && (
                      <div style={{
                        padding: '14px 16px',
                        background: '#1a2b1a',
                        border: '1px solid #2a4a2a',
                        borderRadius: 10,
                      }}>
                        <div style={{ fontSize: 10, color: '#52c41a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>📱</span> Primer mensaje WhatsApp
                        </div>
                        <div style={{
                          fontSize: 13, color: '#e8e8ed', lineHeight: 1.6,
                          background: '#0f1f0f',
                          borderRadius: 8, padding: '10px 14px',
                          fontFamily: 'inherit',
                        }}>
                          {parsed.first_message}
                          {phase === 'streaming' && (
                            <span className="cursor-blink" />
                          )}
                        </div>
                        {phase === 'done' && (
                          <div style={{ marginTop: 8, fontSize: 11, color: '#52c41a' }}>
                            ✓ Listo para enviar · El rep confirma con un toque
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Raw JSON stream */}
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border)',
                  fontSize: 11, color: 'var(--muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 0.8,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: phase === 'streaming' ? 'var(--accent)' : 'var(--border)',
                    display: 'inline-block',
                    ...(phase === 'streaming' ? { animation: 'pulse-glow 1s infinite' } : {}),
                  }} />
                  Respuesta raw de DeepSeek API
                </div>
                <pre style={{
                  margin: 0, padding: '14px 16px',
                  fontSize: 11, lineHeight: 1.6,
                  color: 'var(--accent)',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: 200,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {rawStream || ''}
                  {phase === 'streaming' && <span className="cursor-blink" />}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
