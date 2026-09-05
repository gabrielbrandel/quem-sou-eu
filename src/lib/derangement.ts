/** Permutação aleatória em que ninguém fica na própria posição. */
export function derange(n: number): number[] {
  if (n < 2) return n === 1 ? [0] : []

  for (let attempt = 0; attempt < 100; attempt++) {
    const perm = shuffle([...Array(n).keys()])
    if (perm.every((v, i) => v !== i)) return perm
  }

  // Fallback determinístico: rotação cíclica
  return [...Array(n).keys()].map((i) => (i + 1) % n)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
