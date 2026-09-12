import { useEffect, useState } from 'react'
import { startWakeLock } from '../lib/wakeLock'

type Props = {
  word: string
  theme: string
  playerName: string
}

type Phase = 'prep' | 'countdown' | 'live'

export function ForeheadScreen({ word, theme, playerName }: Props) {
  const [phase, setPhase] = useState<Phase>('prep')
  const [count, setCount] = useState(3)

  useEffect(() => {
    if (phase !== 'countdown') return

    const id = window.setTimeout(() => {
      if (count <= 1) {
        setPhase('live')
        return
      }
      setCount(count - 1)
    }, 1000)

    return () => window.clearTimeout(id)
  }, [phase, count])

  useEffect(() => {
    if (phase === 'prep') return

    let stop: (() => void) | undefined
    let cancelled = false

    void startWakeLock().then((release) => {
      if (cancelled) release()
      else stop = release
    })

    return () => {
      cancelled = true
      stop?.()
    }
  }, [phase])

  if (phase === 'prep') {
    return (
      <section className="screen handoff-screen forehead-prep">
        <p className="eyebrow">Modo testa</p>
        <h2 className="brand handoff-name">{playerName}</h2>
        <p className="lede">
          Vire o celular com a tela para fora e coloque na testa. Só os outros devem ver a
          palavra.
        </p>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setCount(3)
            setPhase('countdown')
          }}
        >
          Já está na testa
        </button>
      </section>
    )
  }

  if (phase === 'countdown') {
    return (
      <section className="forehead-countdown" aria-live="assertive" aria-label="Regressiva">
        <p className="forehead-countdown-label">Começa em</p>
        <p key={count} className="forehead-countdown-number">
          {count}
        </p>
      </section>
    )
  }

  return (
    <section className="forehead-live" aria-label={`Identidade de ${playerName}`}>
      <p className="forehead-theme">{theme || 'Identidade'}</p>
      <p className="forehead-word">{word}</p>
      <p className="forehead-caption">Perguntas de sim ou não</p>
    </section>
  )
}
