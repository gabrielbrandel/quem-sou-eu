import { useMemo, useState } from 'react'
import { RevealCard } from '../components/RevealCard'
import { derange } from '../lib/derangement'
import { uid } from '../lib/id'
import { THEMES } from '../lib/themes'
import type { Assignment, Player } from '../types'

type Screen = 'players' | 'write' | 'handoff' | 'reveal' | 'done'
type HandoffKind = 'write' | 'reveal'

type Props = {
  onBack: () => void
}

export function SinglePhoneGame({ onBack }: Props) {
  const [screen, setScreen] = useState<Screen>('players')
  const [names, setNames] = useState<string[]>(['', ''])
  const [players, setPlayers] = useState<Player[]>([])
  const [writeIndex, setWriteIndex] = useState(0)
  const [draftWord, setDraftWord] = useState('')
  const [draftTheme, setDraftTheme] = useState<string>(THEMES[0])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [revealIndex, setRevealIndex] = useState(0)
  const [handoffFor, setHandoffFor] = useState<HandoffKind>('write')
  const [handoffName, setHandoffName] = useState('')

  const currentWriter = players[writeIndex]
  const currentAssignment = assignments[revealIndex]

  const filledNames = useMemo(
    () => names.map((n) => n.trim()).filter(Boolean),
    [names],
  )
  const canStartPlayers = filledNames.length >= 2

  const reset = () => {
    setScreen('players')
    setNames(['', ''])
    setPlayers([])
    setWriteIndex(0)
    setDraftWord('')
    setDraftTheme(THEMES[0])
    setAssignments([])
    setRevealIndex(0)
    setHandoffName('')
    setHandoffFor('write')
  }

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
    if (filledNames.length < 2) return
    const list: Player[] = filledNames.map((name) => ({
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
    setHandoffName(list[0].name)
    setScreen('handoff')
  }

  const submitWord = () => {
    const word = draftWord.trim()
    if (!word) return

    const nextPlayers = players.map((p, i) =>
      i === writeIndex ? { ...p, word, theme: draftTheme } : p,
    )
    setPlayers(nextPlayers)
    setDraftWord('')

    if (writeIndex + 1 < nextPlayers.length) {
      const nextIndex = writeIndex + 1
      setWriteIndex(nextIndex)
      setDraftTheme(THEMES[0])
      setHandoffFor('write')
      setHandoffName(nextPlayers[nextIndex].name)
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
      setHandoffName(nextPlayers[0].name)
      setScreen('handoff')
    }
  }

  const afterReveal = () => {
    if (revealIndex + 1 < assignments.length) {
      const nextIndex = revealIndex + 1
      const nextPlayer = players.find((p) => p.id === assignments[nextIndex]?.playerId)
      setRevealIndex(nextIndex)
      setHandoffFor('reveal')
      setHandoffName(nextPlayer?.name ?? '')
      setScreen('handoff')
    } else {
      setScreen('done')
    }
  }

  return (
    <>
      {screen === 'players' && (
        <section className="screen">
          <button type="button" className="back-link" onClick={onBack}>
            ← Voltar
          </button>
          <h2 className="screen-title">Um celular</h2>
          <p className="screen-sub">
            Mínimo 2. A ordem define quem escreve e em quem a palavra será colocada.
          </p>

          <form
            className="players-form"
            onSubmit={(e) => {
              e.preventDefault()
              confirmPlayers()
            }}
          >
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
                    required={i < 2}
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

            <button
              type="button"
              className="btn btn-ghost"
              onClick={addNameSlot}
              disabled={names.length >= 12}
            >
              + Adicionar jogador
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canStartPlayers}>
              Continuar
            </button>
            {!canStartPlayers && (
              <p className="form-hint">Preencha pelo menos 2 nomes para continuar.</p>
            )}
          </form>
        </section>
      )}

      {screen === 'handoff' && (
        <section className="screen handoff-screen">
          <p className="eyebrow">
            {handoffFor === 'write' ? 'Passe o celular' : 'Prepare a cabeça'}
          </p>
          <h2 className="brand handoff-name">{handoffName}</h2>
          <p className="lede">
            {handoffFor === 'write'
              ? 'Só esta pessoa deve ver a próxima tela e escrever a palavra.'
              : `${handoffName} não pode olhar. Outra pessoa arrasta e vê o que vai na cabeça dela.`}
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setScreen(handoffFor === 'write' ? 'write' : 'reveal')}
          >
            {handoffFor === 'write' ? `Sou ${handoffName}` : `Montar cabeça de ${handoffName}`}
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
            Escolha um tema e escreva uma identidade. Você não vai receber esta palavra.
          </p>

          <label className="label">Tema</label>
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
          targetName={
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
            Cada um já tem uma palavra na cabeça. Façam perguntas de sim ou não.
          </p>
          <ul className="done-list">
            {assignments.map((a, i) => {
              const who = players.find((p) => p.id === a.playerId)?.name
              return (
                <li key={a.playerId}>
                  <span>
                    {i + 1}. {who}
                  </span>
                  <span className="done-muted">montado</span>
                </li>
              )
            })}
          </ul>
          <button type="button" className="btn btn-primary" onClick={reset}>
            Nova partida
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Trocar modo
          </button>
        </section>
      )}
    </>
  )
}
