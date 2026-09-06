import Peer from 'peerjs'
import { LOBBY_ROOMS, peerIdForRoom } from './id'

/** Verifica se já existe anfitrião na sala principal. */
export function checkRoomHasHost(timeoutMs = 2800): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const peer = new Peer({ debug: 0 })

    const finish = (value: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      try {
        peer.destroy()
      } catch {
        // ignore
      }
      resolve(value)
    }

    const timer = window.setTimeout(() => finish(false), timeoutMs)

    peer.on('error', () => finish(false))

    peer.on('open', () => {
      const conn = peer.connect(peerIdForRoom(LOBBY_ROOMS[0].id), { reliable: true })
      conn.on('open', () => {
        try {
          conn.close()
        } catch {
          // ignore
        }
        finish(true)
      })
      conn.on('error', () => finish(false))
    })
  })
}
