export type Player = {
  id: string
  name: string
  word: string
  theme: string
}

export type Assignment = {
  playerId: string
  wordFromIndex: number
  word: string
  theme: string
}

export type GameMode = 'single' | 'multi' | null

export type RoomPlayer = {
  id: string
  name: string
  word: string
  ready: boolean
  assignedWord: string
  assignedTheme: string
}

export type RoomPhase = 'lobby' | 'playing' | 'done'

export type RoomState = {
  id: string
  name: string
  theme: string
  phase: RoomPhase
  hostId: string
  players: RoomPlayer[]
}
