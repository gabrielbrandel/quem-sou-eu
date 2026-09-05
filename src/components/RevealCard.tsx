import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from 'react'

type Props = {
  playerName: string
  word: string
  theme: string
  playerIndex: number
  total: number
  onDone: () => void
}

const REVEAL_THRESHOLD = 110

export function RevealCard({
  playerName,
  word,
  theme,
  playerIndex,
  total,
  onDone,
}: Props) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [closing, setClosing] = useState(false)
  const startY = useRef(0)
  const dragging = useRef(false)

  const progress = Math.min(1, Math.max(0, -offset / REVEAL_THRESHOLD))

  const onPointerDown = (e: PointerEvent) => {
    if (revealed || closing) return
    dragging.current = true
    startY.current = e.clientY
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging.current || revealed) return
    const dy = e.clientY - startY.current
    setOffset(Math.min(0, Math.max(dy, -220)))
  }

  const finishReveal = useCallback(() => {
    setRevealed(true)
    setOffset(-180)
  }, [])

  const onPointerUp = () => {
    if (!dragging.current) return
    dragging.current = false
    if (-offset >= REVEAL_THRESHOLD) {
      finishReveal()
    } else {
      setOffset(0)
    }
  }

  const hideAndPass = () => {
    setClosing(true)
    setTimeout(onDone, 280)
  }

  const style: CSSProperties = {
    transform: `translateY(${offset}px)`,
    transition: dragging.current ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
  }

  return (
    <div className={`reveal-screen ${closing ? 'is-closing' : ''}`}>
      <p className="reveal-meta">
        Jogador {playerIndex + 1} de {total}
      </p>
      <h2 className="reveal-name">{playerName}</h2>
      <p className="reveal-hint">
        {revealed
          ? 'Memorize e esconda antes de passar o celular'
          : 'Arraste o card para cima para descobrir quem você é'}
      </p>

      <div className="reveal-stage">
        <div
          className={`reveal-card ${revealed ? 'is-revealed' : ''}`}
          style={style}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="reveal-card-face reveal-card-front">
            <div className="reveal-orb" style={{ opacity: 0.35 + progress * 0.65 }} />
            <div className="pull-affordance">
              <span className="pull-chevron" aria-hidden>
                ⌃
              </span>
              <span>Arraste para cima</span>
            </div>
            <p className="front-label">Quem sou eu?</p>
          </div>

          <div className="reveal-card-face reveal-card-back" aria-hidden={!revealed}>
            <p className="back-theme">{theme || 'Identidade'}</p>
            <p className="back-word">{word}</p>
            <p className="back-note">Você não pode dizer o que é — só responder sim ou não.</p>
          </div>
        </div>
      </div>

      {revealed ? (
        <button type="button" className="btn btn-primary" onClick={hideAndPass}>
          Esconder e passar
        </button>
      ) : (
        <p className="reveal-footer">Só {playerName} deve olhar a tela</p>
      )}
    </div>
  )
}
