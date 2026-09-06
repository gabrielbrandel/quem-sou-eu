import { useState } from 'react'

type Props = {
  word: string
  theme: string
  playerName: string
}

export function ForeheadScreen({ word, theme, playerName }: Props) {
  const [placed, setPlaced] = useState(false)

  if (!placed) {
    return (
      <section className="screen handoff-screen forehead-prep">
        <p className="eyebrow">Modo testa</p>
        <h2 className="brand handoff-name">{playerName}</h2>
        <p className="lede">
          Vire o celular com a tela para fora e coloque na testa. Só os outros devem ver a
          palavra.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setPlaced(true)}>
          Já está na testa
        </button>
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
