import { useEffect, useId, useMemo, useState } from 'react'
import { EscopaIcon, TrashIcon } from '../components/Icons'

type Props = {
  onBack: () => void
}

type PointKey = 'escopas' | 'as' | 'sete' | 'dama' | 'rei'

type PlayerScore = {
  id: string
  name: string
  escopas: number
  as: number
  sete: number
  dama: number
  rei: number
}

const POINT_BUTTONS: { key: PointKey; label: string }[] = [
  { key: 'escopas', label: 'Escopa' },
  { key: 'as', label: 'Ás' },
  { key: 'sete', label: '7' },
  { key: 'dama', label: 'Dama' },
  { key: 'rei', label: 'Rei' },
]

function newPlayer(name: string): PlayerScore {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    escopas: 0,
    as: 0,
    sete: 0,
    dama: 0,
    rei: 0,
  }
}

export function EscopaScore({ onBack }: Props) {
  const [players, setPlayers] = useState<PlayerScore[]>([])
  const [draftName, setDraftName] = useState('')
  const [maisOurosId, setMaisOurosId] = useState<string | null>(null)
  const [maisCartasId, setMaisCartasId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [addError, setAddError] = useState('')
  const pointsTitleId = useId()
  const addTitleId = useId()

  const ranked = useMemo(() => {
    const withTotals = players.map((p) => {
      const base = p.escopas + p.as + p.sete + p.dama + p.rei
      const bonus =
        (p.id === maisOurosId ? 1 : 0) + (p.id === maisCartasId ? 1 : 0)
      return { ...p, total: base + bonus }
    })
    return withTotals.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [players, maisOurosId, maisCartasId])

  const selected = ranked.find((p) => p.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedId && !addingPlayer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setSelectedId(null)
      setAddingPlayer(false)
      setAddError('')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, addingPlayer])

  const openAddModal = () => {
    setSelectedId(null)
    setDraftName('')
    setAddError('')
    setAddingPlayer(true)
  }

  const closeAddModal = () => {
    setAddingPlayer(false)
    setDraftName('')
    setAddError('')
  }

  const addPlayer = () => {
    const name = draftName.trim()
    if (!name) {
      setAddError('Digite um nome.')
      return
    }
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      setAddError('Esse nome já está no placar.')
      return
    }
    setPlayers((prev) => [...prev, newPlayer(name)])
    closeAddModal()
  }

  const addPoint = (id: string, key: PointKey) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const max = key === 'escopas' ? 99 : 4
        return { ...p, [key]: Math.min(max, p[key] + 1) }
      }),
    )
  }

  const removePoint = (id: string, key: PointKey) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: Math.max(0, p[key] - 1) } : p)),
    )
  }

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
    if (maisOurosId === id) setMaisOurosId(null)
    if (maisCartasId === id) setMaisCartasId(null)
    if (selectedId === id) setSelectedId(null)
  }

  const toggleBonus = (
    current: string | null,
    setCurrent: (id: string | null) => void,
    id: string,
  ) => {
    setCurrent(current === id ? null : id)
  }

  const resetScores = () => {
    setPlayers((prev) =>
      prev.map((p) => ({ ...p, escopas: 0, as: 0, sete: 0, dama: 0, rei: 0 })),
    )
    setMaisOurosId(null)
    setMaisCartasId(null)
  }

  return (
    <section className="screen escopa-screen">
      <div className="escopa-topbar">
        <button type="button" className="back-link" onClick={onBack}>
          ← Voltar
        </button>
        <button
          type="button"
          className="escopa-add-fab"
          aria-label="Adicionar pessoa"
          onClick={openAddModal}
        >
          +
        </button>
      </div>

      <p className="eyebrow">Placar</p>
      <h2 className="screen-title escopa-title">
        <EscopaIcon className="escopa-title-icon" />
        Escopa
      </h2>
      <p className="screen-sub">
        Toque no + pra adicionar gente e no nome pra marcar pontos.
      </p>

      {players.length > 0 && (
        <div className="escopa-bonuses">
          <div className="escopa-bonus-block">
            <p className="escopa-bonus-label">Mais ouros (+1)</p>
            <div className="escopa-bonus-picks">
              {players.map((p) => (
                <button
                  key={`ouros-${p.id}`}
                  type="button"
                  className={`theme-chip ${maisOurosId === p.id ? 'is-active' : ''}`}
                  onClick={() => toggleBonus(maisOurosId, setMaisOurosId, p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
          <div className="escopa-bonus-block">
            <p className="escopa-bonus-label">Mais cartas (+1)</p>
            <div className="escopa-bonus-picks">
              {players.map((p) => (
                <button
                  key={`cartas-${p.id}`}
                  type="button"
                  className={`theme-chip ${maisCartasId === p.id ? 'is-active' : ''}`}
                  onClick={() => toggleBonus(maisCartasId, setMaisCartasId, p.id)}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {players.length === 0 && (
        <p className="form-hint">Toque no + pra adicionar quem está jogando.</p>
      )}

      <ol className="escopa-rank">
        {ranked.map((player, index) => (
          <li key={player.id}>
            <button
              type="button"
              className="escopa-person escopa-person-btn"
              onClick={() => {
                setAddingPlayer(false)
                setSelectedId(player.id)
              }}
            >
              <div className="escopa-person-identity">
                <span className="escopa-rank-pos">{index + 1}º</span>
                <div className="escopa-person-copy">
                  <span className="escopa-person-name">{player.name}</span>
                  <span className="escopa-person-total">{player.total} pts</span>
                  {(player.id === maisOurosId || player.id === maisCartasId) && (
                    <span className="escopa-person-bonus">
                      {player.id === maisOurosId ? 'Mais ouros' : ''}
                      {player.id === maisOurosId && player.id === maisCartasId ? ' · ' : ''}
                      {player.id === maisCartasId ? 'Mais cartas' : ''}
                    </span>
                  )}
                </div>
              </div>
              <span className="escopa-person-chevron" aria-hidden>
                ›
              </span>
            </button>
          </li>
        ))}
      </ol>

      {players.length > 0 && (
        <button type="button" className="btn btn-ghost" onClick={resetScores}>
          Zerar placar
        </button>
      )}

      {addingPlayer && (
        <div
          className="escopa-modal-backdrop"
          role="presentation"
          onClick={closeAddModal}
        >
          <div
            className="escopa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={addTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <p className="eyebrow">Nova pessoa</p>
            <h3 id={addTitleId} className="escopa-modal-title">
              Adicionar
            </h3>
            <form
              className="escopa-add-modal-form"
              onSubmit={(e) => {
                e.preventDefault()
                addPlayer()
              }}
            >
              <input
                className="field field-lg"
                placeholder="Nome da pessoa"
                value={draftName}
                maxLength={18}
                onChange={(e) => {
                  setDraftName(e.target.value)
                  setAddError('')
                }}
                autoFocus
              />
              {addError && <p className="form-error">{addError}</p>}
              <button type="submit" className="btn btn-primary btn-spark" disabled={!draftName.trim()}>
                Adicionar
              </button>
              <button type="button" className="btn btn-ghost" onClick={closeAddModal}>
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="escopa-modal-backdrop"
          role="presentation"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="escopa-modal escopa-modal-points"
            role="dialog"
            aria-modal="true"
            aria-labelledby={pointsTitleId}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="escopa-remove-icon"
              aria-label={`Remover ${selected.name}`}
              title="Remover pessoa"
              onClick={() => removePlayer(selected.id)}
            >
              <TrashIcon />
            </button>
            <p className="eyebrow">Marcar pontos</p>
            <h3 id={pointsTitleId} className="escopa-modal-title">
              {selected.name}
            </h3>
            <p className="escopa-modal-total">{selected.total} pts</p>

            <div className="escopa-point-grid">
              {POINT_BUTTONS.map((btn) => (
                <div key={btn.key} className="escopa-point-cell">
                  <button
                    type="button"
                    className={`escopa-point-btn ${selected[btn.key] > 0 ? 'has-points' : ''}`}
                    onClick={() => addPoint(selected.id, btn.key)}
                  >
                    <span className="escopa-point-label">+ {btn.label}</span>
                    <span className="escopa-point-count">{selected[btn.key]}</span>
                  </button>
                  <button
                    type="button"
                    className="escopa-point-minus"
                    aria-label={`Tirar ${btn.label} de ${selected.name}`}
                    disabled={selected[btn.key] <= 0}
                    onClick={() => removePoint(selected.id, btn.key)}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-primary btn-spark"
              onClick={() => setSelectedId(null)}
            >
              Pronto
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
