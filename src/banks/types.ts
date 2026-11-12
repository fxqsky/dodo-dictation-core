import type { LocalSubject } from '../local/types.js'
export type BankKind = 'DICTATION' | 'RECITATION'
export interface BankItem { text: string; tts_text: string }
export interface BankContent {
  title: string
  kind: BankKind
  subject: LocalSubject
  items: BankItem[]
  voice_rate: number
  gap_seconds: number
  repeats: number
}
export class ShareError extends Error {
  constructor(public code: string, message: string) { super(message) }
}
export function defaultBankContent(): BankContent {
  return { title: '', kind: 'DICTATION', subject: 'CHINESE', items: [],
    voice_rate: 0.8, gap_seconds: 10, repeats: 2 }
}
export function validatedContent(value: BankContent): BankContent {
  const v = value as BankContent
  if (!v || typeof v.title !== 'string' || !v.title.trim() || v.title.trim().length > 80 ||
      !['DICTATION', 'RECITATION'].includes(v.kind) ||
      !['CHINESE', 'ENGLISH'].includes(v.subject) ||
      !Array.isArray(v.items) || v.items.length < 1 || v.items.length > 120 ||
      (v.kind === 'RECITATION' && v.items.length > 60) ||
      !Number.isFinite(v.voice_rate) || v.voice_rate < 0.5 || v.voice_rate > 1.5 ||
      !Number.isInteger(v.repeats) || v.repeats < 1 || v.repeats > 5 ||
      !Number.isInteger(v.gap_seconds) || v.gap_seconds < 0 || v.gap_seconds > 90) {
    throw new ShareError('INVALID_CONTENT', '请填写题库标题和有效内容，并检查朗读设置')
  }
  const items = v.items.map(item => {
    if (!item || typeof item.text !== 'string' || typeof item.tts_text !== 'string' ||
        !item.text.trim() || !item.tts_text.trim() ||
        item.text.length > 400 || item.tts_text.length > 400) {
      throw new ShareError('INVALID_CONTENT', '存在空白或过长条目（每段最多400字）')
    }
    return { text: item.text.trim(), tts_text: item.tts_text.trim() }
  })
  const content = { title: v.title.trim(), kind: v.kind, subject: v.subject,
    items, voice_rate: v.voice_rate, gap_seconds: v.gap_seconds, repeats: v.repeats }
  if (new TextEncoder().encode(JSON.stringify(content)).byteLength > 32768) {
    throw new ShareError('CONTENT_TOO_LARGE', '题库文字超过32KB，请分成多份')
  }
  return content
}
export function parsePastedText(text: string, kind: BankKind): BankItem[] {
  // Dictation: newlines, Chinese/English commas, enumeration marks, semicolons,
  // tabs and two-or-more spaces. One space in "good morning" is meaningful.
  // Recitation: blank lines delimit paragraphs; single newlines are preserved.
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
  const parts = kind === 'RECITATION'
    ? normalized.trim().split(/\n[ \t]*\n+/)
    : normalized.split(/(?:\n|[,，、;；\t]| {2,})+/)
  const items = parts.map(s => s.trim()).filter(Boolean).map(s => ({text: s, tts_text: s}))
  if (items.length > 120 || (kind === 'RECITATION' && items.length > 60) ||
      items.some(i => i.text.length > 400)) throw new ShareError('INVALID_CONTENT', '条目太多或段落太长，请拆分')
  return items
}
