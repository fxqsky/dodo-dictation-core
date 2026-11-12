import type { LocalSubject } from './types.js'

/** Default labels are generated on device. No server/timezone dependency. */
export function defaultTaskTitle(subject: LocalSubject, date = new Date(), kind: 'DICTATION' | 'RECITATION' = 'DICTATION'): string {
  const label = subject === 'ENGLISH' ? '英语' : '语文'
  const action = kind === 'RECITATION' ? '背诵' : '听写'
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${label}${action} · ${mm}月${dd}日 ${hh}:${min}`
}


/** Render an ISO timestamp in the device's local timezone, never as UTC text. */
export function formatLocalDateTime(iso?: string): string {
  const d = new Date(String(iso || ''))
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatLocalMonthDay(iso?: string): string {
  const d = new Date(String(iso || ''))
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
