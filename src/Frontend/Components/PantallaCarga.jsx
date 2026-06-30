/**
 * PantallaCarga.jsx — Splash screen inicial (2 segundos).
 * Llama a onDone() al terminar la barra de progreso.
 * Barra de 4 segmentos que se iluminan secuencialmente.
 */
import { useEffect, useState } from 'react'

const ESTADOS = [
  'Iniciando sistema...',
  'Validando credenciales...',
  'Cargando módulos...',
  'Listo.',
]

const SEGMENTOS = 4

export default function PantallaCarga({ onDone }) {
  const [progress,   setProgress]   = useState(0)
  const [estadoIdx,  setEstadoIdx]  = useState(0)
  const [visible,    setVisible]    = useState(true)

  // Progreso de 0→100 en 2000 ms
  useEffect(() => {
    const start    = Date.now()
    const DURATION = 2000
    const id = setInterval(() => {
      const pct = Math.min(((Date.now() - start) / DURATION) * 100, 100)
      setProgress(pct)
      if (pct >= 100) { clearInterval(id); setTimeout(onDone, 150) }
    }, 20)
    return () => clearInterval(id)
  }, [onDone])

  // Rotar texto con fade cada ~480 ms
  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setEstadoIdx(i => Math.min(i + 1, ESTADOS.length - 1))
        setVisible(true)
      }, 220)
    }, 480)
    return () => clearInterval(id)
  }, [])

  // Cuántos segmentos están activos (0-4)
  const segActivos = Math.ceil((progress / 100) * SEGMENTOS)

  return (
    <div style={s.root}>
      <div style={s.radial} />

      <div style={s.content}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.glow} />
          <img src="/assets/img/logo.png" alt="Precision Truck Parts" style={s.logo} />
        </div>

        {/* Nombre empresa */}
        <p style={s.brand}>Precision Truck Parts</p>

        {/* Estado con fade */}
        <p style={{ ...s.status, opacity: visible ? 1 : 0 }}>
          {ESTADOS[estadoIdx]}
        </p>

        {/* Barra segmentada — 4 bloques tipo tablero de carro */}
        <div style={s.segTrack}>
          {Array.from({ length: SEGMENTOS }).map((_, i) => {
            const activo = i < segActivos
            return (
              <div key={i} style={{
                ...s.seg,
                background: activo
                  ? `linear-gradient(90deg, #FF6600, #FF9A00)`
                  : 'rgba(255,255,255,0.07)',
                boxShadow: activo ? '0 0 8px rgba(255,102,0,0.6)' : 'none',
                transition: 'background 0.18s, box-shadow 0.18s',
              }} />
            )
          })}
        </div>

        {/* Porcentaje */}
        <p style={s.pct}>{Math.round(progress)}%</p>
      </div>

      <style>{`
        @keyframes pulse-glow { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.12)} }
        @keyframes logo-in    { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slide-up   { from{opacity:0;transform:translateY(8px)}  to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  )
}

const s = {
  root: {
    position: 'fixed', inset: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#121212',
    fontFamily: "'Inter','Segoe UI',sans-serif",
    zIndex: 9999,
  },
  radial: {
    position: 'absolute', inset: 0, pointerEvents: 'none',
    background: 'radial-gradient(ellipse 55% 42% at 50% 50%, rgba(255,102,0,0.10) 0%, transparent 70%)',
  },
  content: {
    position: 'relative',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '18px',
  },
  logoWrap: {
    position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  glow: {
    position: 'absolute', inset: '-22px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255,102,0,0.18) 0%, transparent 70%)',
    animation: 'pulse-glow 2.4s ease-in-out infinite',
  },
  logo: {
    height: '130px', width: 'auto', objectFit: 'contain',
    filter: 'drop-shadow(0 0 18px rgba(255,102,0,0.45))',
    animation: 'logo-in 0.55s ease-out forwards',
  },
  brand: {
    color: '#FFFFFF', fontSize: '18px', fontWeight: 900,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    margin: 0, lineHeight: 1,
    animation: 'slide-up 0.5s 0.15s ease-out both',
  },
  status: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: '10px', fontWeight: 500,
    letterSpacing: '0.16em', textTransform: 'uppercase',
    margin: 0, transition: 'opacity 0.22s ease',
    animation: 'slide-up 0.5s 0.28s ease-out both',
  },
  segTrack: {
    display: 'flex', gap: '5px',
    animation: 'slide-up 0.5s 0.38s ease-out both',
  },
  seg: {
    width: '48px', height: '6px', borderRadius: '3px',
  },
  pct: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: '10px', fontWeight: 600,
    letterSpacing: '0.06em', margin: 0,
  },
}
