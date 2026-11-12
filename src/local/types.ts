export type LocalSubject = 'ENGLISH' | 'CHINESE'
export type LocalMode = 'EN_AUDIO_TO_EN' | 'ZH_AUDIO_TO_ZH'

export interface LocalPage {
  id: string
  page_number: number
  data_url: string
  width?: number
  height?: number
}

export interface LocalItem {
  id: string
  answer_text: string
  spoken_prompt_text: string
  spoken_manual?: boolean
  prompt_language: 'zh-CN' | 'en-US'
  confirmed: boolean
  ocr_confidence: number | null
  source_page_id: string
  source_bbox?: number[][]
}

export type ManualJudgement = 'correct' | 'wrong'

/** Parent-confirmed results only. Unmarked items are never treated as correct. */
export interface ManualReview {
  decisions: Record<string, ManualJudgement>
  updated_at: string
  finalized_at?: string
}

export interface ReviewOrigin {
  source_task_id: string
  source_item_ids: string[]
}

export interface LocalTask {
  review?: ManualReview
  /** Unlock answers only after the child explicitly finishes the dictation. */
  review_unlocked_at?: string
  review_origin?: ReviewOrigin
  id: string
  child_id: string
  child_name: string
  title: string
  subject: LocalSubject
  mode: LocalMode
  voice_rate: number
  gap_seconds: number
  repeats: number
  status: 'REVIEW_REQUIRED' | 'READY'
  revision: number
  created_at: string
  items: LocalItem[]
  pages: LocalPage[]
  bank_source?: {key: string;version: number}
  public_bank?: {bank_id: string;bank_code: string;content_version: number}
}

export interface LocalOcrLine {
  text: string
  score: number
  bbox?: number[][]
}

export interface LocalOcrPage {
  page_number: number
  width: number
  height: number
  lines: LocalOcrLine[]
  total_ms?: number
}
