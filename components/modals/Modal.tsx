'use client'
import { useEffect } from 'react'

interface ModalProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  width?: number
}

export default function Modal({ title, onClose, children, width = 520 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#fff', borderRadius:14, width:'100%', maxWidth:width, maxHeight:'90vh', display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}
      >
        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid #E5E7EB', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontSize:15, fontWeight:800, color:'#1A1A2E' }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#9CA3AF', lineHeight:1, padding:'2px 6px', borderRadius:6 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ overflowY:'auto', flex:1, padding:'20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
