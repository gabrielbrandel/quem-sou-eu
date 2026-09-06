import { useEffect, useState } from 'react'
import { MultiPhoneGame } from './modes/MultiPhoneGame'
import { SinglePhoneGame } from './modes/SinglePhoneGame'
import { checkRoomHasHost } from './lib/roomPresence'
import type { GameMode } from './types'
import './App.css'

export default function App() {
  const [mode, setMode] = useState<GameMode>(null)
  const [hostOnline, setHostOnline] = useState<boolean | null>(null)

  useEffect(() => {
    if (mode !== null) return

    let cancelled = false
    setHostOnline(null)

    checkRoomHasHost().then((hasHost) => {
      if (!cancelled) setHostOnline(hasHost)
    })

    return () => {
      cancelled = true
    }
  }, [mode])

  return (
    <div className="app-shell">
      <div className="atmosphere" aria-hidden />

      {mode === null && (
        <section className="screen home-screen">
          <h1 className="sr-only">Quem Sou Eu?</h1>
          <img
            className="home-hero"
            src="/hero.png"
            alt="Quem Sou Eu?"
            width={1024}
            height={1024}
          />

          {hostOnline === null && (
            <p className="lede">Procurando partida…</p>
          )}

          {hostOnline === true && (
            <>
              <p className="lede">A partida já começou. Digite seu nome e entre.</p>
              <button type="button" className="btn btn-primary btn-spark" onClick={() => setMode('multi')}>
                Jogar
              </button>
              <p className="room-people room-people-home">
                <span className="room-people-dot" aria-hidden />
                Anfitrião online
              </p>
            </>
          )}

          {hostOnline === false && (
            <>
              <p className="lede">
                Escreva uma identidade, coloque na cabeça e descubra quem você é.
              </p>
              <div className="mode-cards">
                <button type="button" className="mode-card" onClick={() => setMode('single')}>
                  <span className="mode-card-title">Um celular</span>
                  <span className="mode-card-text">
                    Passa o aparelho. Alguém revela e passa a palavra X para a pessoa Y
                    colocar na cabeça.
                  </span>
                </button>
                <button type="button" className="mode-card" onClick={() => setMode('multi')}>
                  <span className="mode-card-title">Cada um com o celular</span>
                  <span className="mode-card-text">
                    Você inicia a partida, escolhe o tema e os outros entram pelo Jogar.
                  </span>
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {mode === 'single' && <SinglePhoneGame onBack={() => setMode(null)} />}
      {mode === 'multi' && <MultiPhoneGame onBack={() => setMode(null)} />}
    </div>
  )
}
