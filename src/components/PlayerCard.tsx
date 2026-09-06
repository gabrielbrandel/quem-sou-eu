import type { RoomPlayer } from '../types'
import { CrownIcon, MenuDotsIcon } from './Icons'

type Props = {
  player: RoomPlayer
  isYou: boolean
  isHost: boolean
  roomTheme: string
}

export function PlayerCard({ player, isYou, isHost, roomTheme }: Props) {
  const initial = player.name.trim().charAt(0).toUpperCase() || '?'
  const showWord = isYou && !!player.word

  const details: { text: string; className?: string }[] = []
  if (isYou) details.push({ text: 'Você' })

  if (!roomTheme) {
    details.push({ text: 'aguardando tema', className: 'player-word is-pending' })
  } else if (showWord && player.ready) {
    details.push({ text: player.word, className: 'player-word' })
  } else if (showWord && !player.ready) {
    details.push({ text: 'editando…', className: 'player-word is-pending' })
  } else if (player.ready) {
    details.push({ text: 'palavra ok', className: 'player-word is-hidden' })
  } else {
    details.push({ text: 'sem palavra', className: 'player-word is-pending' })
  }

  return (
    <article
      className={[
        'player-card',
        isYou ? 'is-you' : '',
        player.ready ? 'is-ready' : 'is-waiting',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="player-avatar" aria-hidden>
        {initial}
      </div>

      <div className="player-card-main">
        <h3 className="player-card-name">{player.name}</h3>
        <p className="player-card-sub">
          {details.map((part, i) => (
            <span key={`${part.text}-${i}`}>
              {i > 0 && <span className="player-sep"> · </span>}
              <span className={part.className}>{part.text}</span>
            </span>
          ))}
        </p>
      </div>

      <div className="player-card-actions">
        {isHost && (
          <span className="player-crown" title="Anfitrião" aria-label="Anfitrião">
            <CrownIcon />
          </span>
        )}
        <span className="player-menu" aria-hidden>
          <MenuDotsIcon />
        </span>
      </div>
    </article>
  )
}
