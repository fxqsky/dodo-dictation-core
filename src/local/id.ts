export function localId(prefix = 'local'): string {
  const c = globalThis.crypto
  if (c && 'randomUUID' in c) return `${prefix}_${c.randomUUID()}`
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
