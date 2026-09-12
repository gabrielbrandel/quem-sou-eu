/** Mantém a tela acesa enquanto a partida estiver na testa. */
export type WakeLockStop = () => void

export async function startWakeLock(): Promise<WakeLockStop> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return () => {}
  }

  let sentinel: WakeLockSentinel | null = null
  let stopped = false

  const request = async () => {
    if (stopped) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener('release', () => {
        sentinel = null
      })
    } catch {
      sentinel = null
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && !stopped && !sentinel) {
      void request()
    }
  }

  await request()
  document.addEventListener('visibilitychange', onVisibility)

  return () => {
    stopped = true
    document.removeEventListener('visibilitychange', onVisibility)
    void sentinel?.release()
    sentinel = null
  }
}
