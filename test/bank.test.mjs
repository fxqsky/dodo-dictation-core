import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultBankContent, parsePastedText, validatedContent } from '../dist/banks/types.js'
import { defaultTaskTitle } from '../dist/local/naming.js'
import { reviewCounts, wrongOnlyTask } from '../dist/local/manual-review.js'

test('Chinese delimiters and English phrase spacing', () => {
  assert.deepEqual(parsePastedText('清晨，微风；花朵', 'DICTATION').map(item => item.text), ['清晨', '微风', '花朵'])
  assert.deepEqual(parsePastedText('good morning, take care\nlook up', 'DICTATION').map(item => item.text), ['good morning', 'take care', 'look up'])
})

test('recitation keeps line breaks inside each paragraph', () => {
  assert.deepEqual(parsePastedText('第一行\n第二行\n\n第三行', 'RECITATION').map(item => item.text), ['第一行\n第二行', '第三行'])
  assert.throws(() => parsePastedText(('甲\n\n').repeat(61), 'RECITATION'))
})

test('bank content and local practice naming', () => {
  const content = defaultBankContent()
  assert.throws(() => validatedContent(content))
  assert.equal(validatedContent({ ...content, title: ' 春风 ', items: parsePastedText('微风', 'DICTATION') }).title, '春风')
  assert.equal(defaultTaskTitle('CHINESE', new Date(2026, 10, 12, 9, 5)), '语文听写 · 11月12日 09:05')
})

test('review preserves pending items and creates a task only from confirmed errors', () => {
  const task = {
    id: 'example', child_id: 'sample', child_name: '示例',
    title: '示例', subject: 'CHINESE', mode: 'ZH_AUDIO_TO_ZH', pages: [],
    items: [
      { id: 'a', answer_text: '清晨', spoken_prompt_text: '清晨', prompt_language: 'zh-CN' },
      { id: 'b', answer_text: '微风', spoken_prompt_text: '微风', prompt_language: 'zh-CN' },
    ],
    review: { decisions: { a: 'wrong' } },
  }
  assert.equal(reviewCounts(task).pending, 1)
  assert.throws(() => wrongOnlyTask(task))
  task.review.decisions.b = 'correct'
  task.review.finalized_at = '2026-11-12T00:00:00Z'
  assert.deepEqual(wrongOnlyTask(task).items.map(item => item.answer_text), ['清晨'])
})
