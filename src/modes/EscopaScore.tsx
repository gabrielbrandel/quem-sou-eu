import { useMemo, useState } from 'react'
import { EscopaIcon } from '../components/Icons'

type Props = {
  onBack: () => void
}

type SideScore = {
  name: string
  escopas: number
  ouros: number
  cartas: number
  as: number
  sete: number
  dama: number
  rei: number
}

const emptySide = (name: string): SideScore => ({
  name,
  escopas: 0,
  ouros: 0,
  cartas: 0,
  as: 0,
  sete: 0,
  dama: 0,
  rei: 0,
})

type StatKey = 'escopas' | 'ouros' | 'cartas' | 'as' | 'sete' | 'dama' | 'rei'

const STATS: { key: StatKey; label: string; hint: string; max?: number }[] = [
  { key: 'escopas', label: 'Escopas', hint: '1 ponto cada' },
  { key: 'ouros', label: 'Ouros', hint: 'Quem tiver mais leva 1' },
  { key: 'cartas', label: 'Cartas', hint: 'Quem tiver mais leva 1' },
  { key: 'as', label: 'Ás', hint: '1 ponto cada', max: 4 },
  { key: 'sete', label: '7', hint: '1 ponto cada', max: 4 },
  { key: 'dama', label: 'Dama', hint: '1 ponto cada', max: 4 },
  { key: 'rei', label: 'Rei', hint: '1 ponto cada', max: 4 },
]

function clamp(value: number, max = 99) {
  return Math.max(0, Math.min(max, value))
}

function facePoints(side: SideScore) {
  return side.escopas + side.as + side.sete + side.dama + side.rei
}

export function EscopaScore({ onBack }: Props) {
  const [sides, setSides] = useState<[SideScore, SideScore]>([
    emptySide('Time A'),
    emptySide('Time B'),
  ])

  const totals = useMemo(() => {
    const [a, b] = sides
    const mostOurosA = a.ouros > b.ouros
    const mostOurosB = b.ouros > a.ouros
    const mostCartasA = a.cartas > b.cartas
    const mostCartasB = b.cartas > a.cartas

    const totalA = facePoints(a) + (mostOurosA ? 1 : 0) + (mostCartasA ? 1 : 0)
    const totalB = facePoints(b) + (mostOurosB ? 1 : 0) + (mostCartasB ? 1 : 0)

    return {
      a: totalA,
      b: totalB,
      mostOurosA,
      mostOurosB,
      mostCartasA,
      mostCartasB,
    }
  }, [sides])

  const bump = (index: 0 | 1, key: StatKey, delta: number) => {
    setSides((prev) => {
      const next = [...prev] as [SideScore, SideScore]
      const side = { ...next[index] }
      const max = STATS.find((s) => s.key === key)?.max ?? 99
      side[key] = clamp(side[key] + delta, max)
      next[index] = side
      return next
    })
  }

  const rename = (index: 0 | 1, name: string) => {
    setSides((prev) => {
      const next = [...prev] as [SideScore, SideScore]
      next[index] = { ...next[index], name }
      return next
    })
  }

  const reset = () => {
    setSides((prev) => [emptySide(prev[0].name), emptySide(prev[1].name)])
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
        Conta escopas, ouros, cartas e as figuras. Ás, 7, dama e rei valem 1 ponto cada.
      </p>

      <div className="escopa-totals" aria-live="polite">
        <div className={`escopa-total ${totals.a > totals.b ? 'is-lead' : ''}`}>
          <span className="escopa-total-name">{sides[0].name || 'Time A'}</span>
          <span className="escopa-total-score">{totals.a}</span>
        </div>
        <div className={`escopa-total ${totals.b > totals.a ? 'is-lead' : ''}`}>
          <span className="escopa-total-name">{sides[1].name || 'Time B'}</span>
          <span className="escopa-total-score">{totals.b}</span>
        </div>
      </div>

      <div className="escopa-boards">
        {sides.map((side, index) => {
          const i = index as 0 | 1
          const bonusOuros = i === 0 ? totals.mostOurosA : totals.mostOurosB
          const bonusCartas = i === 0 ? totals.mostCartasA : totals.mostCartasB
          return (
            <article key={i} className="escopa-board">
              <label className="sr-only" htmlFor={`escopa-name-${i}`}>
                Nome do time {i + 1}
              </label>
              <input
                id={`escopa-name-${i}`}
                className="field escopa-name"
                value={side.name}
                maxLength={18}
                onChange={(e) => rename(i, e.target.value)}
              />

              <ul className="escopa-stats">
                {STATS.map((stat) => (
                  <li key={stat.key} className="escopa-stat">
                    <div className="escopa-stat-copy">
                      <span className="escopa-stat-label">{stat.label}</span>
                      <span className="escopa-stat-hint">{stat.hint}</span>
                    </div>
                    <div className="escopa-stat-controls">
                      <button
                        type="button"
                        className="escopa-step"
                        aria-label={`Diminuir ${stat.label}`}
                        onClick={() => bump(i, stat.key, -1)}
                      >
                        −
                      </button>
                      <span className="escopa-stat-value">{side[stat.key]}</span>
                      <button
                        type="button"
                        className="escopa-step"
                        aria-label={`Aumentar ${stat.label}`}
                        onClick={() => bump(i, stat.key, 1)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="escopa-bonus">
                {bonusOuros ? '• Mais ouros (+1)' : '• Ouros empatados ou atrás'}
                <br />
                {bonusCartas ? '• Mais cartas (+1)' : '• Cartas empatadas ou atrás'}
              </p>
            </article>
          )
        })}
      </div>

      <button type="button" className="btn btn-ghost" onClick={reset}>
        Zerar placar
      </button>
    </section>
  )
}
