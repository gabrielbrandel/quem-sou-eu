import { useEffect, useMemo, useRef, useState } from 'react'
import { ForeheadScreen } from '../components/ForeheadScreen'
import {
  PeopleIcon,
  PlayIcon,
  ThemeCardsIcon,
} from '../components/Icons'
import { PlayerCard } from '../components/PlayerCard'
import { QuestionMarksBg } from '../components/QuestionMarksBg'
import { LOBBY_ROOMS } from '../lib/id'
import { enterRoom, type RoomSession } from '../lib/peerRoom'
import { THEMES } from '../lib/themes'
import type { RoomState } from '../types'

type Step = 'entry' | 'lobby' | 'playing' | 'done'

type Props = {
  onBack: () => void
}

export function MultiPhoneGame({ onBack }: Props) {
  const [step, setStep] = useState<Step>('entry')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [room, setRoom] = useState<RoomState | null>(null)
  const [myId, setMyId] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [draftWord, setDraftWord] = useState('')
  const [draftTheme, setDraftTheme] = useState<string>(THEMES[0])
  const [pickingWord, setPickingWord] = useState(false)
  const [editingTheme, setEditingTheme] = useState(false)

  const sessionRef = useRef<RoomSession | null>(null)

  useEffect(() => {
    return () => {
      sessionRef.current?.destroy()
      sessionRef.current = null
    }
  }, [])

  const me = useMemo(
    () => room?.players.find((p) => p.id === myId) ?? null,
    [room, myId],
  )

  const themeReady = !!room?.theme
  const allReady = !!room && room.players.length >= 2 && room.players.every((p) => p.ready)
  const showThemePicker = isHost && (!themeReady || editingTheme)

  const bindSession = (session: RoomSession) => {
    sessionRef.current?.destroy()
    sessionRef.current = session
    setMyId(session.myId)
    setIsHost(session.isHost)
    session.setOnRoom((next) => {
      setRoom(next)
      if (next.phase === 'playing') setStep('playing')
      if (next.phase === 'done') setStep('done')
      if (next.phase === 'lobby') setStep('lobby')
    })
    session.setOnError((message) => setError(message))
    session.setOnClose(() => {
      setError('Conexão com a partida foi perdida.')
      setStep('entry')
      setRoom(null)
    })
  }

  const handleEnter = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Digite seu nome antes de entrar.')
      return
    }
    setBusy(true)
    setError('')
    try {
      const session = await enterRoom(LOBBY_ROOMS[0].id, LOBBY_ROOMS[0].name, trimmed)
      bindSession(session)
      setStep('lobby')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.')
    } finally {
      setBusy(false)
    }
  }

  const confirmTheme = () => {
    if (!draftTheme.trim() || !sessionRef.current) return
    sessionRef.current.setTheme(draftTheme)
    setPickingWord(false)
    setDraftWord('')
    setEditingTheme(false)
  }

  const submitWord = () => {
    const word = draftWord.trim()
    if (!word || !sessionRef.current) return
    sessionRef.current.submitWord(word)
    setPickingWord(false)
  }

  const startEditWord = () => {
    if (!me || !sessionRef.current) return
    setDraftWord(me.word)
    setPickingWord(true)
    sessionRef.current.beginEditWord()
  }

  const cancelEditWord = () => {
    if (!me?.word.trim() || !sessionRef.current) {
      setPickingWord(false)
      setDraftWord('')
      return
    }
    // reconfirma a palavra anterior
    sessionRef.current.submitWord(me.word)
    setPickingWord(false)
  }

  const startGame = () => sessionRef.current?.startGame()

  const leave = () => {
    sessionRef.current?.destroy()
    sessionRef.current = null
    setRoom(null)
    setStep('entry')
    setError('')
    setDraftWord('')
    setDraftTheme(THEMES[0])
    setPickingWord(false)
    setEditingTheme(false)
  }

  if (step === 'entry') {
    return (
      <section className="screen">
        <button type="button" className="back-link" onClick={onBack}>
          ← Voltar
        </button>
        <img className="lobby-hero" src="/hero.png" alt="" />
        <h2 className="screen-title">Seu nome</h2>
        <p className="screen-sub">
          O primeiro a entrar vira anfitrião e escolhe o tema.
        </p>

        <form
          className="players-form"
          onSubmit={(e) => {
            e.preventDefault()
            void handleEnter()
          }}
        >
          <label className="label" htmlFor="player-name">
            Nome
          </label>
          <input
            id="player-name"
            className="field field-lg"
            value={name}
            maxLength={24}
            placeholder="Como te chamam"
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
            autoFocus
          />

          {error && <p className="form-error">{error}</p>}

            <button
              type="submit"
              className="btn btn-primary btn-spark"
              disabled={busy || !name.trim()}
            >
              {busy ? 'Entrando…' : 'Continuar'}
            </button>
        </form>
      </section>
    )
  }

  if (step === 'lobby' && room) {
    return (
      <section className="screen lobby-screen">
        <QuestionMarksBg />

        <button type="button" className="back-link back-link-gold" onClick={leave}>
          ← Sair
        </button>

        <img className="lobby-hero" src="/hero.png" alt="Quem Sou Eu?" />

        <p className="eyebrow">Partida</p>
        <div className="lobby-heading">
          <h2 className="screen-title">Jogadores</h2>
          <p className="room-people room-people-lg" aria-live="polite">
            <span className="room-people-dot" aria-hidden />
            {room.players.length}{' '}
            {room.players.length === 1 ? 'pessoa' : 'pessoas'}
          </p>
        </div>

        {!showThemePicker && (
          <button
            type="button"
            className="theme-row"
            disabled={!isHost}
            onClick={() => {
              if (!isHost) return
              setDraftTheme(room.theme || THEMES[0])
              setEditingTheme(true)
            }}
          >
            <span className="theme-row-icon" aria-hidden>
              <ThemeCardsIcon />
            </span>
            <p className="theme-row-text">
              Tema: <strong>{themeReady ? room.theme : 'escolher…'}</strong>
            </p>
            {isHost && (
              <span className="theme-row-chevron" aria-hidden>
                ›
              </span>
            )}
          </button>
        )}

        {showThemePicker && (
          <div className="theme-picker">
            <label className="label">Tema da partida</label>
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
            <label className="label" htmlFor="custom-theme">
              Ou crie um tema
            </label>
            <input
              id="custom-theme"
              className="field"
              value={(THEMES as readonly string[]).includes(draftTheme) ? '' : draftTheme}
              maxLength={32}
              placeholder="Ex.: Marcas de carro, Youtubers…"
              onChange={(e) => setDraftTheme(e.target.value)}
              autoComplete="off"
            />
            <button
              type="button"
              className="btn btn-primary btn-spark"
              disabled={!draftTheme.trim()}
              onClick={confirmTheme}
            >
              <PlayIcon className="btn-svg" />
              Confirmar tema
            </button>
            {themeReady && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setEditingTheme(false)}
              >
                Cancelar
              </button>
            )}
          </div>
        )}

        {!isHost && !themeReady && (
          <p className="form-hint">Aguardando o anfitrião escolher o tema…</p>
        )}

        <ul className="player-card-list">
          {room.players.map((p) => (
            <li key={p.id}>
              <PlayerCard
                player={p}
                isYou={p.id === myId}
                isHost={p.id === room.hostId}
                roomTheme={room.theme}
              />
            </li>
          ))}
        </ul>

        <div className="lobby-actions">
          {themeReady && me && !me.ready && !pickingWord && (
            <button
              type="button"
              className="btn btn-primary btn-spark"
              onClick={() => setPickingWord(true)}
            >
              <PlayIcon className="btn-svg" />
              Escolher palavra
            </button>
          )}

          {themeReady && me && !me.ready && pickingWord && (
            <>
              <label className="label" htmlFor="multi-word">
                Sua palavra · {room.theme}
              </label>
              <input
                id="multi-word"
                className="field field-lg"
                placeholder="Ex.: Maçã…"
                value={draftWord}
                maxLength={40}
                onChange={(e) => setDraftWord(e.target.value)}
                autoComplete="off"
                autoFocus
              />
              <button
                type="button"
                className="btn btn-primary btn-spark"
                disabled={!draftWord.trim()}
                onClick={submitWord}
              >
                <PlayIcon className="btn-svg" />
                Confirmar palavra
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={cancelEditWord}
              >
                Cancelar
              </button>
            </>
          )}

          {themeReady && me?.ready && !pickingWord && (
            <>
              <p className="form-hint">
                {isHost
                  ? allReady
                    ? 'Todo mundo pronto. Pode começar.'
                    : 'Palavra enviada. Aguarde os outros.'
                  : 'Palavra enviada. Aguarde o anfitrião começar…'}
              </p>
              <button type="button" className="btn btn-ghost" onClick={startEditWord}>
                Editar palavra
              </button>
            </>
          )}

          {error && <p className="form-error">{error}</p>}

          {isHost && themeReady && (
            <button
              type="button"
              className={`btn ${allReady ? 'btn-primary btn-spark' : 'btn-muted'}`}
              disabled={!allReady}
              onClick={startGame}
            >
              <PeopleIcon className="btn-svg" />
              Começar jogo
            </button>
          )}
        </div>

        <div className="lobby-footer" aria-hidden>
          <div className="lobby-footer-glow" />
          <div className="lobby-footer-curve" />
          <div className="lobby-footer-cards">
            <div className="lobby-footer-card lobby-footer-card-person" />
            <div className="lobby-footer-card lobby-footer-card-idea" />
          </div>
        </div>
      </section>
    )
  }

  if (step === 'playing' && me?.assignedWord) {
    return (
      <>
        <ForeheadScreen
          word={me.assignedWord}
          theme={me.assignedTheme || room?.theme || ''}
          playerName={me.name}
        />
        {isHost && (
          <div className="host-bar">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => sessionRef.current?.endGame()}
            >
              Encerrar partida
            </button>
          </div>
        )}
      </>
    )
  }

  return (
    <section className="screen home-screen">
      <img className="lobby-hero" src="/hero.png" alt="" />
      <p className="eyebrow">Fim</p>
      <h2 className="brand">Boa partida</h2>
      <p className="lede">Podem tirar os celulares da testa.</p>
      <button type="button" className="btn btn-primary btn-spark" onClick={leave}>
        Voltar ao início
      </button>
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        Trocar modo
      </button>
    </section>
  )
}
