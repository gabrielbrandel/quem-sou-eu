import Peer, { type DataConnection, type PeerError } from 'peerjs'
import { peerIdForRoom, uid } from './id'
import { derange } from './derangement'
import type { RoomPlayer, RoomState } from '../types'

type ClientToHost =
  | { type: 'join'; player: Pick<RoomPlayer, 'id' | 'name'> }
  | { type: 'setWord'; playerId: string; word: string }
  | { type: 'unready'; playerId: string }
  | { type: 'ping' }

type HostToClient =
  | { type: 'sync'; room: RoomState }
  | { type: 'error'; message: string }
  | { type: 'kicked'; message: string }

export type RoomSession = {
  isHost: boolean
  myId: string
  getRoom: () => RoomState
  setOnRoom: (cb: (room: RoomState) => void) => void
  setOnError: (cb: (message: string) => void) => void
  setOnClose: (cb: () => void) => void
  setTheme: (theme: string) => void
  submitWord: (word: string) => void
  beginEditWord: () => void
  startGame: () => void
  endGame: () => void
  destroy: () => void
}

function emptyPlayer(id: string, name: string): RoomPlayer {
  return {
    id,
    name,
    word: '',
    ready: false,
    assignedWord: '',
    assignedTheme: '',
  }
}

/** Entra numa sala fixa: vira anfitrião se estiver livre, senão entra como convidado. */
export async function enterRoom(
  roomId: string,
  roomName: string,
  playerName: string,
): Promise<RoomSession> {
  const hostPeer = new Peer(peerIdForRoom(roomId), { debug: 0 })
  const status = await waitHostPeer(hostPeer)

  if (status === 'unavailable') {
    hostPeer.destroy()
    return joinRoom(roomId, roomName, playerName)
  }

  return createHostSession(hostPeer, roomId, roomName, playerName)
}

function createHostSession(
  peer: Peer,
  roomId: string,
  roomName: string,
  hostName: string,
): RoomSession {
  const myId = uid()

  let room: RoomState = {
    id: roomId,
    name: roomName,
    theme: '',
    phase: 'lobby',
    hostId: myId,
    players: [emptyPlayer(myId, hostName)],
  }

  const connections = new Map<string, DataConnection>()
  let onRoom: ((room: RoomState) => void) | null = null
  let onError: ((message: string) => void) | null = null
  let onClose: (() => void) | null = null
  let destroyed = false
  let reconnectTimer: number | null = null
  let reconnectAttempts = 0

  const broadcast = () => {
    onRoom?.(room)
    const msg: HostToClient = { type: 'sync', room }
    for (const conn of connections.values()) {
      if (conn.open) conn.send(msg)
    }
  }

  const sendError = (conn: DataConnection, message: string) => {
    const msg: HostToClient = { type: 'error', message }
    if (conn.open) conn.send(msg)
  }

  const clearReconnectTimer = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  const tryReconnect = () => {
    if (destroyed || peer.destroyed) return
    if (!peer.disconnected) return
    reconnectAttempts += 1
    if (reconnectAttempts > 12) {
      onClose?.()
      return
    }
    try {
      peer.reconnect()
    } catch {
      const delay = Math.min(1000 * reconnectAttempts, 5000)
      reconnectTimer = window.setTimeout(tryReconnect, delay)
    }
  }

  peer.on('connection', (conn) => {
    conn.on('data', (raw) => {
      const data = raw as ClientToHost
      if (data.type === 'join') {
        const existing = room.players.find((p) => p.id === data.player.id)
        // Reconexão do mesmo jogador (ex.: tela do anfitrião apagou e voltou)
        if (existing) {
          connections.set(data.player.id, conn)
          broadcast()
          return
        }
        if (room.phase !== 'lobby') {
          sendError(conn, 'A partida já começou.')
          return
        }
        if (room.players.length >= 12) {
          sendError(conn, 'Sala cheia.')
          return
        }
        if (room.players.some((p) => p.name.toLowerCase() === data.player.name.toLowerCase())) {
          sendError(conn, 'Esse nome já está na sala.')
          return
        }
        connections.set(data.player.id, conn)
        room = {
          ...room,
          players: [...room.players, emptyPlayer(data.player.id, data.player.name)],
        }
        broadcast()
        return
      }

      if (data.type === 'setWord') {
        if (!room.theme) {
          sendError(conn, 'Aguarde o anfitrião escolher o tema.')
          return
        }
        room = {
          ...room,
          players: room.players.map((p) =>
            p.id === data.playerId ? { ...p, word: data.word, ready: true } : p,
          ),
        }
        broadcast()
      }

      if (data.type === 'unready') {
        if (room.phase !== 'lobby') return
        room = {
          ...room,
          players: room.players.map((p) =>
            p.id === data.playerId ? { ...p, ready: false } : p,
          ),
        }
        broadcast()
      }

      if (data.type === 'ping') {
        if (conn.open) conn.send({ type: 'sync', room } satisfies HostToClient)
      }
    })

    conn.on('close', () => {
      let leftId: string | null = null
      for (const [id, c] of connections) {
        if (c === conn) {
          leftId = id
          connections.delete(id)
          break
        }
      }
      if (!leftId || room.phase !== 'lobby') return
      room = {
        ...room,
        players: room.players.filter((p) => p.id !== leftId),
      }
      broadcast()
    })
  })

  peer.on('error', (err) => {
    // Falhas transitórias de rede no mobile: tenta reconectar em vez de derrubar a sala
    if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
      tryReconnect()
      return
    }
    onError?.(err.message || 'Erro de conexão do anfitrião.')
  })

  peer.on('disconnected', () => {
    if (destroyed) return
    // Não encerra a partida: reconecta no PeerServer mantendo o mesmo ID e o estado da sala
    tryReconnect()
  })

  peer.on('open', () => {
    reconnectAttempts = 0
    clearReconnectTimer()
    broadcast()
  })

  const onVisibility = () => {
    if (document.visibilityState !== 'visible' || destroyed) return
    if (peer.disconnected && !peer.destroyed) tryReconnect()
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('online', onVisibility)

  return {
    isHost: true,
    myId,
    getRoom: () => room,
    setOnRoom: (cb) => {
      onRoom = cb
      cb(room)
    },
    setOnError: (cb) => {
      onError = cb
    },
    setOnClose: (cb) => {
      onClose = cb
    },
    setTheme: (theme) => {
      const next = theme.trim()
      if (!next || room.phase !== 'lobby') return
      room = {
        ...room,
        theme: next,
        players: room.players.map((p) => ({ ...p, word: '', ready: false })),
      }
      broadcast()
    },
    submitWord: (word) => {
      if (!room.theme) {
        onError?.('Escolha o tema da sala primeiro.')
        return
      }
      room = {
        ...room,
        players: room.players.map((p) =>
          p.id === myId ? { ...p, word, ready: true } : p,
        ),
      }
      broadcast()
    },
    beginEditWord: () => {
      if (room.phase !== 'lobby') return
      room = {
        ...room,
        players: room.players.map((p) =>
          p.id === myId ? { ...p, ready: false } : p,
        ),
      }
      broadcast()
    },
    startGame: () => {
      if (!room.theme) {
        onError?.('Escolha o tema da sala primeiro.')
        return
      }
      if (room.players.length < 2) {
        onError?.('Precisa de pelo menos 2 jogadores.')
        return
      }
      if (!room.players.every((p) => p.ready && p.word.trim())) {
        onError?.('Todos precisam escolher uma palavra.')
        return
      }
      const map = derange(room.players.length)
      const players = room.players.map((player, i) => {
        const from = room.players[map[i]]
        return {
          ...player,
          assignedWord: from.word,
          assignedTheme: room.theme,
        }
      })
      room = { ...room, phase: 'playing', players }
      broadcast()
    },
    endGame: () => {
      room = { ...room, phase: 'done' }
      broadcast()
    },
    destroy: () => {
      destroyed = true
      clearReconnectTimer()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onVisibility)
      for (const conn of connections.values()) conn.close()
      peer.destroy()
    },
  }
}

async function joinRoom(
  roomId: string,
  roomName: string,
  playerName: string,
): Promise<RoomSession> {
  const myId = uid()
  const peer = new Peer({ debug: 0 })
  await waitOpen(peer)

  let room: RoomState | null = null
  let onRoom: ((room: RoomState) => void) | null = null
  let onError: ((message: string) => void) | null = null
  let onClose: (() => void) | null = null
  let destroyed = false
  let reconnectAttempts = 0
  let reconnectTimer: number | null = null
  let pingTimer: number | null = null
  let conn = peer.connect(peerIdForRoom(roomId), { reliable: true })
  await waitConnOpen(conn)

  const clearTimers = () => {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (pingTimer !== null) {
      window.clearInterval(pingTimer)
      pingTimer = null
    }
  }

  const sendJoin = (connection: DataConnection) => {
    const joinMsg: ClientToHost = {
      type: 'join',
      player: { id: myId, name: playerName },
    }
    if (connection.open) connection.send(joinMsg)
  }

  const bindConn = (connection: DataConnection) => {
    connection.on('data', (raw) => {
      const data = raw as HostToClient
      if (data.type === 'sync') {
        room = data.room
        onRoom?.(data.room)
        reconnectAttempts = 0
      }
      if (data.type === 'error' || data.type === 'kicked') {
        onError?.(data.message)
      }
    })

    connection.on('close', () => {
      if (destroyed) return
      scheduleReconnect()
    })
  }

  const scheduleReconnect = () => {
    if (destroyed) return
    if (reconnectTimer !== null) return
    reconnectAttempts += 1
    if (reconnectAttempts > 10) {
      onClose?.()
      return
    }
    const delay = Math.min(800 * reconnectAttempts, 4000)
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = null
      void reconnect()
    }, delay)
  }

  const reconnect = async () => {
    if (destroyed || peer.destroyed) return
    try {
      if (peer.disconnected) {
        try {
          peer.reconnect()
          await waitOpen(peer)
        } catch {
          // segue tentando connect mesmo assim
        }
      }
      const next = peer.connect(peerIdForRoom(roomId), { reliable: true })
      await waitConnOpen(next)
      conn = next
      bindConn(conn)
      sendJoin(conn)
    } catch {
      scheduleReconnect()
    }
  }

  bindConn(conn)
  sendJoin(conn)

  pingTimer = window.setInterval(() => {
    if (destroyed || !conn.open) return
    const msg: ClientToHost = { type: 'ping' }
    conn.send(msg)
  }, 12000)

  const onVisibility = () => {
    if (document.visibilityState !== 'visible' || destroyed) return
    if (!conn.open) scheduleReconnect()
  }
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('online', onVisibility)

  peer.on('error', (err) => {
    if (destroyed) return
    if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error') {
      scheduleReconnect()
      return
    }
    onError?.(err.message || 'Não foi possível entrar na sala.')
  })

  peer.on('disconnected', () => {
    if (destroyed) return
    try {
      peer.reconnect()
    } catch {
      scheduleReconnect()
    }
  })

  void roomName

  return {
    isHost: false,
    myId,
    getRoom: () => {
      if (!room) throw new Error('Sala ainda não sincronizou.')
      return room
    },
    setOnRoom: (cb) => {
      onRoom = cb
      if (room) cb(room)
    },
    setOnError: (cb) => {
      onError = cb
    },
    setOnClose: (cb) => {
      onClose = cb
    },
    setTheme: () => {
      onError?.('Só o anfitrião escolhe o tema.')
    },
    submitWord: (word) => {
      const msg: ClientToHost = {
        type: 'setWord',
        playerId: myId,
        word,
      }
      if (conn.open) conn.send(msg)
    },
    beginEditWord: () => {
      const msg: ClientToHost = {
        type: 'unready',
        playerId: myId,
      }
      if (conn.open) conn.send(msg)
    },
    startGame: () => {
      onError?.('Só o anfitrião pode iniciar.')
    },
    endGame: () => {
      onError?.('Só o anfitrião pode encerrar.')
    },
    destroy: () => {
      destroyed = true
      clearTimers()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('online', onVisibility)
      conn.close()
      peer.destroy()
    },
  }
}

function waitHostPeer(peer: Peer) {
  return new Promise<'open' | 'unavailable'>((resolve, reject) => {
    peer.on('open', () => resolve('open'))
    peer.on('error', (err: PeerError<'unavailable-id' | string>) => {
      if (err.type === 'unavailable-id') resolve('unavailable')
      else reject(err)
    })
  })
}

function waitOpen(peer: Peer) {
  return new Promise<void>((resolve, reject) => {
    if (!peer.disconnected && peer.id) {
      resolve()
      return
    }
    const onOpen = () => {
      cleanup()
      resolve()
    }
    const onError = (err: Error) => {
      cleanup()
      reject(err)
    }
    const cleanup = () => {
      peer.off('open', onOpen)
      peer.off('error', onError)
    }
    peer.on('open', onOpen)
    peer.on('error', onError)
  })
}

function waitConnOpen(conn: DataConnection) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(
      () => reject(new Error('Ninguém nessa sala agora. Toque de novo para abrir como anfitrião.')),
      10000,
    )
    conn.on('open', () => {
      window.clearTimeout(t)
      resolve()
    })
    conn.on('error', (err) => {
      window.clearTimeout(t)
      reject(err)
    })
  })
}
