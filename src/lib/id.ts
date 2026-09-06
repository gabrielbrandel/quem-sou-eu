export function uid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch {
      // HTTP em IP local não é secure context
    }
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function peerIdForRoom(roomId: string) {
  return `quemsoueu-${roomId}`
}

export const LOBBY_ROOMS = [{ id: 'sala', name: 'Sala' }] as const
