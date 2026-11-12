import { pendingWrongWords, reviewCounts } from './manual-review.js'
import type { LocalTask } from './types.js'

/**
 * Values are derived from completed parent reviews. No listening-playback
 * telemetry or estimated learning scores are used.
 */
export interface LocalLearningSummary {
  reviewedWords: number  // word/phrase occurrences, repeats counted as sessions
  completedReviews: number
  pendingWords: number   // distinct child+subject+normalized word keys
  awaitingReview: number
}

export function summarizeLocalLearning(tasks: LocalTask[]): LocalLearningSummary {
  const complete: LocalTask[] = []
  let awaitingReview = 0
  let reviewedWords = 0
  for (const task of tasks) {
    if (task.status !== 'READY') continue
    const counts = reviewCounts(task)
    if (counts.finalized) {
      complete.push(task)
      reviewedWords += counts.total
    } else if (task.review_unlocked_at) {
      awaitingReview++
    }
  }
  return {
    reviewedWords,
    completedReviews: complete.length,
    pendingWords: pendingWrongWords(complete).length,
    awaitingReview,
  }
}
