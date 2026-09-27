import { useMemo, useState } from 'react'
import { EscopaIcon } from '../components/Icons'

type Props = {
  onBack: () => void
}

type PlayerScore = {
  id: string
  name: string
  escopas: number
  ouros: number
  cartas: number
  as: number
  sete: number
  dama: number
  rei: number
}

type StatKey = 'escopas' | 'ouros' | 'cartas' | 'as' | 'sete' | 'dama' | 'rei'

const STATS: { key: StatKey; label: string }[] = [
  { key: 'escopas', label: 'Escopas' },
  { key: 'ouros', label: 'Ouros' },
  { key: 'cartas', label: 'Cartas' },
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
    ouros: 0,
    cartas: 0,
    as: 0,
    sete: 0,
    dama: 0,
    rei: 0,
  }
}

function facePoints(p: PlayerScore) {
  return p.escopas + p.as + p.sete + p.dama + p.rei
}

export function EscopaScore({ onBack }: Props) {
  const [players, setPlayers] = useState<PlayerScore[]>([])
  const [draftName, setDraftName] = useState('')

  const totals = useMemo(() => {
    if (players.length === 0) return new Map<string, number>()

    const maxOuros = Math.max(...players.map((p) => p.ouros))
    const maxCartas = Math.max(...players.map((p) => p.cartas))
    const ourosTied = players.filter((p) => p.ouros === maxOuros).length > 1
    const cartasTied = players.filter((p) => p.cartas === maxCartas).length > 1

    const map = new Map<string, number>()
    for (const p of players) {
      let total = facePoints(p)
      if (maxOuros > 0 && p.ouros === maxOuros && !ourosTied) total += 1
      if (maxCartas > 0 && p.cartas === maxCartas && !cartasTied) total += 1
      map.set(p.id, total)
    }
    return map
  }, [players])

  const addPlayer = () => {
    const name = draftName.trim()
    if (!name) return
    if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) return
    setPlayers((prev) => [...prev, newPlayer(name)])
    setDraftName('')
  }

  const bump = (id: string, key: StatKey, delta: number) => {
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const max = key === 'as' || key === 'sete' || key === 'dama' || key === 'rei' ? 4 : 99
        return { ...p, [key]: Math.max(0, Math.min(max, p[key] + delta)) }
      }),
    )
  }

  const removePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id))
  }

  const resetScores = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        escopas: 0,
        ouros: 0,
        cartas: 0,
        as: 0,
        sete: 0,
        dama: 0,
        rei: 0,
      })),
    )
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
        Por pessoa. Escopas, ás, 7, dama e rei valem 1. Mais ouros ou mais cartas: +1.
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

      {players.length === 0 && (
        <p className="form-hint">Adicione quem está jogando pra começar a marcar.</p>
      )}

      <div className="escopa-people">
        {players.map((player) => (
          <article key={player.id} className="escopa-person">
            <header className="escopa-person-head">
              <div>
                <h3 className="escopa-person-name">{player.name}</h3>
                <p className="escopa-person-total">{totals.get(player.id) ?? 0} pts</p>
              </div>
              <button
                type="button"
                className="back-link"
                onClick={() => removePlayer(player.id)}
              >
                Remover
              </button>
            </header>

            <ul className="escopa-stats">
              {STATS.map((stat) => (
                <li key={stat.key} className="escopa-stat">
                  <span className="escopa-stat-label">{stat.label}</span>
                  <div className="escopa-stat-controls">
                    <button
                      type="button"
                      className="escopa-step"
                      aria-label={`Diminuir ${stat.label} de ${player.name}`}
                      onClick={() => bump(player.id, stat.key, -1)}
                    >
                      −
                    </button>
                    <span className="escopa-stat-value">{player[stat.key]}</span>
                    <button
                      type="button"
                      className="escopa-step"
                      aria-label={`Aumentar ${stat.label} de ${player.name}`}
                      onClick={() => bump(player.id, stat.key, 1)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {players.length > 0 && (
        <button type="button" className="btn btn-ghost" onClick={resetScores}>
          Zerar placar
        </button>
      )}
    </section>
  )
}
