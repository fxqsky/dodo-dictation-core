import { localId } from './id.js'
import type { LocalItem, LocalSubject, LocalTask, ManualJudgement } from './types.js'

export interface ReviewCounts {
  correct: number
  wrong: number
  pending: number
  total: number
  finalized: boolean
}

export function reviewCounts(task: LocalTask): ReviewCounts {
  const decisions = task.review?.decisions || {}
  let correct = 0
  let wrong = 0
  let pending = 0
  for (const item of task.items) {
    const choice = decisions[item.id]
    if (choice === 'correct') correct++
    else if (choice === 'wrong') wrong++
    else pending++
  }
  return { correct, wrong, pending, total: task.items.length,
    finalized: !!task.review?.finalized_at && pending === 0 }
}

function copiedItem(item: LocalItem): LocalItem {
  return {
    id: localId('item'),
    answer_text: item.answer_text,
    spoken_prompt_text: item.spoken_prompt_text,
    prompt_language: item.prompt_language,
    confirmed: true,
    spoken_manual: true,
    ocr_confidence: null,
    source_page_id: '',
  }
}

/** New READY task contains only parent-confirmed wrong items, never photo data. */
export function wrongOnlyTask(source: LocalTask): LocalTask {
  if (!reviewCounts(source).finalized) throw new Error('REVIEW_NOT_FINALIZED')
  const wrongItems = source.items.filter(item => source.review?.decisions[item.id] === 'wrong')
  if (!wrongItems.length) throw new Error('NO_WRONG_WORDS')
  const now = new Date().toISOString()
  return {
    id: localId('task'), child_id: source.child_id, child_name: source.child_name,
    title: '错词复习 · ' + source.title,
    subject: source.subject, mode: source.mode,
    voice_rate: source.voice_rate, gap_seconds: source.gap_seconds, repeats: source.repeats,
    status: 'READY', revision: 1, created_at: now, pages: [],
    items: wrongItems.map(copiedItem),
    review_origin: { source_task_id: source.id, source_item_ids: wrongItems.map(v => v.id) },
  }
}

export interface PendingWrongWord {
  key: string
  child_id: string
  child_name: string
  subject: LocalSubject
  answer_text: string
  spoken_prompt_text: string
  prompt_language: LocalItem['prompt_language']
  error_count: number
  last_review_at: string
  pending: boolean
  source_task_id: string
}

function wordKey(task: LocalTask, item: LocalItem): string {
  return [task.child_id, task.subject, item.answer_text.normalize('NFKC').trim().toLowerCase()].join('|')
}

/** Latest finalized human judgment per child + subject + word determines pending status. */
export function pendingWrongWords(tasks: LocalTask[]): PendingWrongWord[] {
  const byWord = new Map<string, PendingWrongWord>()
  const reviewed = [...tasks].filter(t => t.review?.finalized_at)
    .sort((a,b) => String(a.review?.finalized_at).localeCompare(String(b.review?.finalized_at)) || a.id.localeCompare(b.id))
  for (const task of reviewed) {
    for (const item of task.items) {
      const decision: ManualJudgement | undefined = task.review?.decisions[item.id]
      if (decision !== 'wrong' && decision !== 'correct') continue
      const key = wordKey(task,item)
      const old = byWord.get(key)
      const latest: PendingWrongWord = {
        key, child_id: task.child_id, child_name: task.child_name,
        subject: task.subject, answer_text: item.answer_text,
        spoken_prompt_text: item.spoken_prompt_text,
        prompt_language: item.prompt_language,
        error_count: (old?.error_count || 0) + (decision === 'wrong' ? 1 : 0),
        last_review_at: task.review!.finalized_at!,
        pending: decision === 'wrong',
        source_task_id: task.id,
      }
      byWord.set(key,latest)
    }
  }
  return [...byWord.values()].filter(v => v.pending)
    .sort((a,b)=>b.last_review_at.localeCompare(a.last_review_at) || a.answer_text.localeCompare(b.answer_text))
}

/** Generate a per-child, per-subject local listening session from latest wrong words. */
export function wrongbookTask(words: PendingWrongWord[]): LocalTask {
  if (!words.length) throw new Error('NO_WRONG_WORDS')
  const first = words[0]
  if (words.some(w => w.subject !== first.subject || w.child_id !== first.child_id)) {
    throw new Error('MIXED_SUBJECT_OR_CHILD')
  }
  const now = new Date()
  return {
    id: localId('task'), child_id: first.child_id, child_name: first.child_name,
    title: (first.subject === 'CHINESE' ? '语文' : '英语') + '错词复习 · ' +
      (now.getMonth()+1) + '月' + now.getDate() + '日',
    subject: first.subject,
    mode: first.subject === 'CHINESE' ? 'ZH_AUDIO_TO_ZH' : 'EN_AUDIO_TO_EN',
    voice_rate: .8, gap_seconds: 8, repeats: 2,
    status: 'READY', revision: 1, created_at: now.toISOString(), pages: [],
    items: words.map(w => ({
      id: localId('item'), answer_text: w.answer_text,
      spoken_prompt_text: w.spoken_prompt_text, prompt_language: w.prompt_language,
      confirmed: true, spoken_manual: true, ocr_confidence: null, source_page_id: '',
    })),
  }
}
