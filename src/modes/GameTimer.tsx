import { useEffect, useRef, useState } from 'react'
import { TimerIcon } from '../components/Icons'

type Props = {
  onBack: () => void
}

const PRESETS = [
  { label: '30s', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '2 min', seconds: 120 },
  { label: '3 min', seconds: 180 },
  { label: '5 min', seconds: 300 },
] as const

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds)
  const m = Math.floor(safe / 60)
  const s = safe % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function playDoneBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const now = ctx.currentTime
    ;[0, 0.18, 0.36].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = i === 2 ? 880 : 660
      gain.gain.setValueAtTime(0.0001, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.18, now + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.16)
    })
    window.setTimeout(() => void ctx.close(), 800)
  } catch {
    // sem áudio disponível
  }
}

export function GameTimer({ onBack }: Props) {
  const [selected, setSelected] = useState(60)
  const [remaining, setRemaining] = useState(60)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const endAtRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return

    const tick = () => {
      if (endAtRef.current == null) return
      const left = Math.ceil((endAtRef.current - Date.now()) / 1000)
      if (left <= 0) {
        setRemaining(0)
        setRunning(false)
        setDone(true)
        endAtRef.current = null
        playDoneBeep()
        return
      }
      setRemaining(left)
    }

    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [running])

  const pickPreset = (seconds: number) => {
    setSelected(seconds)
    setRemaining(seconds)
    setRunning(false)
    setDone(false)
    endAtRef.current = null
  }

  const start = () => {
    const base = remaining > 0 ? remaining : selected
    setRemaining(base)
    setDone(false)
    endAtRef.current = Date.now() + base * 1000
    setRunning(true)
  }

  const pause = () => {
    setRunning(false)
    endAtRef.current = null
  }

  const reset = () => {
    setRunning(false)
    setDone(false)
    setRemaining(selected)
    endAtRef.current = null
  }

  return (
    <section className="screen timer-screen">
      <button type="button" className="back-link" onClick={onBack}>
        ← Voltar
      </button>

      <p className="eyebrow">Ferramenta</p>
      <h2 className="screen-title timer-title">
        <TimerIcon className="timer-title-icon" />
        Contador
      </h2>
      <p className="screen-sub">Marca o tempo das rodadas do Quem Sou Eu?</p>

      <div className={`timer-display ${done ? 'is-done' : ''} ${running ? 'is-running' : ''}`} aria-live="polite">
        <span className="timer-digits">{formatTime(remaining)}</span>
        {done && <span className="timer-done-label">Tempo!</span>}
      </div>

      <div className="timer-presets" role="group" aria-label="Duração">
        {PRESETS.map((preset) => (
          <button
            key={preset.seconds}
            type="button"
            className={`theme-chip ${selected === preset.seconds ? 'is-active' : ''}`}
            disabled={running}
            onClick={() => pickPreset(preset.seconds)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="timer-actions">
        {!running ? (
          <button type="button" className="btn btn-primary btn-spark" onClick={start} disabled={selected <= 0 && remaining <= 0}>
            {remaining > 0 && remaining < selected ? 'Continuar' : 'Começar'}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-spark" onClick={pause}>
            Pausar
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={reset} disabled={remaining === selected && !running && !done}>
          Reiniciar
        </button>
      </div>
    </section>
  )
}
