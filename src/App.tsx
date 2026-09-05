import { useMemo, useState } from 'react'
import { RevealCard } from './components/RevealCard'
import { derange } from './lib/derangement'
import type { Assignment, Player, Screen } from './types'
import './App.css'

function uid() {
  return crypto.randomUUID()
}

const THEMES = [
  'Celebridades',
  'Animais',
  'Comidas',
  'Profissões',
  'Personagens',
  'Objetos',
  'Países',
  'Livres',
]

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [names, setNames] = useState<string[]>(['', '', ''])
  const [players, setPlayers] = useState<Player[]>([])
  const [writeIndex, setWriteIndex] = useState(0)
  const [draftWord, setDraftWord] = useState('')
  const [draftTheme, setDraftTheme] = useState(THEMES[0])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [handoffFor, setHandoffFor] = useState<'write' | 'reveal'>('write')

  const currentWriter = players[writeIndex]
  const currentAssignment = assignments[revealIndex]

  const canStartPlayers = useMemo(
    () => names.filter((n) => n.trim()).length >= 2,
    [names],
  )

  const reset = () => {
    setScreen('home')
    setNames(['', '', ''])
    setPlayers([])
    setWriteIndex(0)
    setDraftWord('')
    setDraftTheme(THEMES[0])
    setAssignments([])
    setRevealIndex(0)
  }

  const goPlayers = () => setScreen('players')

  const addNameSlot = () => {
    if (names.length >= 12) return
    setNames((n) => [...n, ''])
  }

  const updateName = (i: number, value: string) => {
    setNames((prev) => prev.map((n, idx) => (idx === i ? value : n)))
  }

  const removeName = (i: number) => {
    if (names.length <= 2) return
    setNames((prev) => prev.filter((_, idx) => idx !== i))
  }

  const confirmPlayers = () => {
    const cleaned = names.map((n) => n.trim()).filter(Boolean)
    if (cleaned.length < 2) return
    const list: Player[] = cleaned.map((name) => ({
      id: uid(),
      name,
      word: '',
      theme: '',
    }))
    setPlayers(list)
    setWriteIndex(0)
    setDraftWord('')
    setDraftTheme(THEMES[0])
    setHandoffFor('write')
    setScreen('handoff')
  }

  const startWriting = () => setScreen('write')

  const submitWord = () => {
    const word = draftWord.trim()
    if (!word) return

    const nextPlayers = players.map((p, i) =>
      i === writeIndex ? { ...p, word, theme: draftTheme } : p,
    )
    setPlayers(nextPlayers)
    setDraftWord('')

    if (writeIndex + 1 < nextPlayers.length) {
      setWriteIndex(writeIndex + 1)
      setDraftTheme(THEMES[0])
      setHandoffFor('write')
      setScreen('handoff')
    } else {
      const map = derange(nextPlayers.length)
      const assigned: Assignment[] = nextPlayers.map((player, i) => {
        const from = map[i]
        return {
          playerId: player.id,
          wordFromIndex: from,
          word: nextPlayers[from].word,
          theme: nextPlayers[from].theme,
        }
      })
      setAssignments(assigned)
      setRevealIndex(0)
      setHandoffFor('reveal')
      setScreen('handoff')
    }
  }

  const startReveal = () => setScreen('reveal')

  const afterReveal = () => {
    if (revealIndex + 1 < assignments.length) {
      setRevealIndex(revealIndex + 1)
      setHandoffFor('reveal')
      setScreen('handoff')
    } else {
      setScreen('done')
    }
  }

  const handoffPlayer =
    handoffFor === 'write'
      ? players[writeIndex]
      : players.find((p) => p.id === assignments[revealIndex]?.playerId)

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden />

      {screen === 'home' && (
        <section className="screen home-screen">
          <p className="eyebrow">Jogo de festas</p>
          <h1 className="brand">Quem Sou Eu?</h1>
          <p className="lede">
            Cada um escreve uma identidade. Ninguém recebe a própria palavra. Arraste para
            cima e descubra quem você é.
          </p>
          <button type="button" className="btn btn-primary" onClick={goPlayers}>
            Começar
          </button>
          <ol className="how-to">
            <li>Adicione os jogadores</li>
            <li>Cada um escolhe um tema e escreve uma palavra</li>
            <li>Na mesma ordem, cada um revela — sem pegar a própria</li>
          </ol>
        </section>
      )}

      {screen === 'players' && (
        <section className="screen">
          <button type="button" className="back-link" onClick={() => setScreen('home')}>
            ← Voltar
          </button>
          <h2 className="screen-title">Jogadores</h2>
          <p className="screen-sub">Mínimo 2. A ordem aqui é a ordem da revelação.</p>

          <div className="name-list">
            {names.map((name, i) => (
              <div className="name-row" key={i}>
                <span className="name-index">{i + 1}</span>
                <input
                  className="field"
                  placeholder={`Nome do jogador ${i + 1}`}
                  value={name}
                  maxLength={24}
                  onChange={(e) => updateName(i, e.target.value)}
                  autoComplete="off"
                />
                {names.length > 2 && (
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Remover"
                    onClick={() => removeName(i)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <button type="button" className="btn btn-ghost" onClick={addNameSlot} disabled={names.length >= 12}>
            + Adicionar jogador
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canStartPlayers}
            onClick={confirmPlayers}
          >
            Continuar
          </button>
        </section>
      )}

      {screen === 'handoff' && handoffPlayer && (
        <section className="screen handoff-screen">
          <p className="eyebrow">Passe o celular</p>
          <h2 className="brand handoff-name">{handoffPlayer.name}</h2>
          <p className="lede">
            {handoffFor === 'write'
              ? 'Só esta pessoa deve ver a próxima tela e escrever a palavra.'
              : 'Só esta pessoa deve arrastar para cima e ver a identidade.'}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handoffFor === 'write' ? startWriting : startReveal}
          >
            Sou {handoffPlayer.name}
          </button>
        </section>
      )}

      {screen === 'write' && currentWriter && (
        <section className="screen">
          <p className="eyebrow">
            Palavra {writeIndex + 1} de {players.length}
          </p>
          <h2 className="screen-title">{currentWriter.name}</h2>
          <p className="screen-sub">
            Escolha um tema e escreva a identidade. Você não vai receber esta palavra.
          </p>

          <label className="label" htmlFor="theme">
            Tema
          </label>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t}
                type="button"
                className={`theme-chip ${draftTheme === t ? 'is-active' : ''}`}
                onClick={() => setDraftTheme(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <label className="label" htmlFor="word">
            Palavra / identidade
          </label>
          <input
            id="word"
            className="field field-lg"
            placeholder="Ex.: Maçã, Harry Potter, Gato..."
            value={draftWord}
            maxLength={40}
            onChange={(e) => setDraftWord(e.target.value)}
            autoComplete="off"
            autoFocus
          />

          <button
            type="button"
            className="btn btn-primary"
            disabled={!draftWord.trim()}
            onClick={submitWord}
          >
            Confirmar palavra
          </button>
        </section>
      )}

      {screen === 'reveal' && currentAssignment && (
        <RevealCard
          key={currentAssignment.playerId}
          playerName={
            players.find((p) => p.id === currentAssignment.playerId)?.name ?? 'Jogador'
          }
          word={currentAssignment.word}
          theme={currentAssignment.theme}
          playerIndex={revealIndex}
          total={assignments.length}
          onDone={afterReveal}
        />
      )}

      {screen === 'done' && (
        <section className="screen home-screen">
          <p className="eyebrow">Pronto</p>
          <h2 className="brand">Hora de perguntar</h2>
          <p className="lede">
            Cada um já sabe quem é. Façam perguntas de sim ou não até descobrir as identidades.
          </p>
          <ul className="done-list">
            {assignments.map((a, i) => {
              const who = players.find((p) => p.id === a.playerId)?.name
              return (
                <li key={a.playerId}>
                  <span>{i + 1}. {who}</span>
                  <span className="done-muted">já revelou</span>
                </li>
              )
            })}
          </ul>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Nova partida
          </button>
        </section>
      )}
    </div>
  )
}
