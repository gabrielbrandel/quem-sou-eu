import { useMemo, useState } from 'react'
import { EscopaIcon } from '../components/Icons'

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

  const ranked = useMemo(() => {
    const withTotals = players.map((p) => {
      const base = p.escopas + p.as + p.sete + p.dama + p.rei
      const bonus =
        (p.id === maisOurosId ? 1 : 0) + (p.id === maisCartasId ? 1 : 0)
      return { ...p, total: base + bonus }
    })
    return withTotals.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
  }, [players, maisOurosId, maisCartasId])

  const addPlayer = () => {
    const name = draftName.trim()
    if (!name) return
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return
    setPlayers((prev) => [...prev, newPlayer(name)])
    setDraftName('')
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
      <button type="button" className="back-link" onClick={onBack}>
        ← Voltar
      </button>

      <p className="eyebrow">Placar</p>
      <h2 className="screen-title escopa-title">
        <EscopaIcon className="escopa-title-icon" />
        Escopa
      </h2>
      <p className="screen-sub">
        Toque pra somar ponto. Ouros e cartas: só uma pessoa leva.
      </p>

      <form
        className="escopa-add"
        onSubmit={(e) => {
          e.preventDefault()
          addPlayer()
        }}
      >
        <input
          className="field"
          placeholder="Nome da pessoa"
          value={draftName}
          maxLength={18}
          onChange={(e) => setDraftName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!draftName.trim()}>
          Adicionar
        </button>
      </form>

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
        <p className="form-hint">Adicione quem está jogando pra começar a marcar.</p>
      )}

      <ol className="escopa-rank">
        {ranked.map((player, index) => (
          <li key={player.id} className="escopa-person">
            <header className="escopa-person-head">
              <div className="escopa-person-identity">
                <span className="escopa-rank-pos">{index + 1}º</span>
                <div>
                  <h3 className="escopa-person-name">{player.name}</h3>
                  <p className="escopa-person-total">{player.total} pts</p>
                </div>
              </div>
              <button type="button" className="back-link" onClick={() => removePlayer(player.id)}>
                Remover
              </button>
            </header>

            <div className="escopa-point-grid">
              {POINT_BUTTONS.map((btn) => (
                <div key={btn.key} className="escopa-point-cell">
                  <button
                    type="button"
                    className={`escopa-point-btn ${player[btn.key] > 0 ? 'has-points' : ''}`}
                    onClick={() => addPoint(player.id, btn.key)}
                  >
                    <span className="escopa-point-label">{btn.label}</span>
                    <span className="escopa-point-count">{player[btn.key]}</span>
                  </button>
                  <button
                    type="button"
                    className="escopa-point-minus"
                    aria-label={`Tirar ${btn.label} de ${player.name}`}
                    disabled={player[btn.key] <= 0}
                    onClick={() => removePoint(player.id, btn.key)}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>

            {(player.id === maisOurosId || player.id === maisCartasId) && (
              <p className="escopa-person-bonus">
                {player.id === maisOurosId ? 'Mais ouros' : ''}
                {player.id === maisOurosId && player.id === maisCartasId ? ' · ' : ''}
                {player.id === maisCartasId ? 'Mais cartas' : ''}
              </p>
            )}
          </li>
        ))}
      </ol>

      {players.length > 0 && (
        <button type="button" className="btn btn-ghost" onClick={resetScores}>
          Zerar placar
        </button>
      )}
    </section>
  )
}
