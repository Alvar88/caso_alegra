import OpenAI from 'openai'
import { NextRequest } from 'next/server'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com',
})

const SYSTEM_PROMPT = `Eres el Lead Intelligence Agent de Alegra, plataforma SaaS de contabilidad para PyMEs y despachos contables en América Latina.

CONTEXTO DE SEGMENTOS:
- Segmento CONTADOR: despachos contables que evalúan el producto para gestionar su cartera de clientes. Ciclo: 14-35 días. LTV alto. ICP HOT si tienen 10+ clientes activos y señal activa (demo, precios, migración).
- Segmento PYME: empresas que buscan resolver un problema contable propio. Ciclo: 3-14 días. ICP HOT si tienen 2+ empleados, señal directa (trial, pricing, demo) y decisor confirmado.

CRITERIOS ICP:
- HOT: cumple todos los criterios de segmento + señal activa de compra inmediata
- WARM: cumple parcialmente o tiene intención pero sin urgencia clara
- COLD: no califica ICP, muy pequeño, sin señal de compra, o datos insuficientes

TAREA: analiza el lead y responde ÚNICAMENTE con un JSON válido, sin texto adicional, sin markdown, sin bloques de código.

El JSON debe tener exactamente esta estructura:
{
  "segment": "CONTADOR" o "PYME",
  "icp_score": "HOT", "WARM" o "COLD",
  "confidence": "HIGH", "MEDIUM" o "LOW",
  "pain_hypothesis": "una oración concreta sobre el problema más probable que este lead quiere resolver hoy",
  "first_message": "mensaje de WhatsApp en español, máximo 3 líneas, que mencione lo que hizo el lead, nombre su pain probable, y tenga un solo CTA (llamada de 15 min). Debe sonar humano, no como plantilla.",
  "routing_reason": "una oración explicando por qué se asigna al rep seleccionado basado en su especialización y capacity score"
}`

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { lead } = body

  if (!process.env.DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'DEEPSEEK_API_KEY no configurada. Agrégala en las variables de entorno de Vercel.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const userMessage = `Analiza este lead:
- Nombre: ${lead.nombre}
- Cargo: ${lead.cargo}
- Empresa: ${lead.empresa || 'No especificada'}
- País: ${lead.pais}
- Sector: ${lead.sector}
- Empleados/Clientes: ${lead.tamano}
- Fuente: ${lead.fuente}
- Contenido/acción: ${lead.accion}
- Software actual: ${lead.software || 'No especificado'}
- Notas adicionales: ${lead.notas || 'Ninguna'}`

  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
    stream: true,
    temperature: 0.7,
    max_tokens: 500,
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        if (delta) {
          controller.enqueue(encoder.encode(delta))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  })
}
