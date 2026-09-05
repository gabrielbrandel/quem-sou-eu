export type Player = {
  id: string
  name: string
  word: string
  theme: string
}

export type Assignment = {
  playerId: string
  /** Índice da palavra recebida (quem escreveu) */
  wordFromIndex: number
  word: string
  theme: string
}

export type Screen =
  | 'home'
  | 'players'
  | 'write'
  | 'handoff'
  | 'reveal'
  | 'done'
