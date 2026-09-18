// Anki 式问答卡片的正文解析。
// 卡片 = frontmatter 标了 type: card 的 .md 文件，正文约定为两个一级标题段：
//   # 问题
//   ...
//   # 答案
//   ...

/** 一张卡片解析出的正反面（Markdown 原文，去掉标题行本身） */
export interface CardQA {
  question: string
  answer: string
}

interface Section {
  title: string
  lines: string[]
}

/** 按一级标题切段（跳过代码块内的 `#`），再按标题名匹配问题/答案 */
function splitSections(body: string): Section[] {
  const sections: Section[] = []
  let current: Section | null = null
  let inCodeBlock = false

  for (const line of body.split(/\r?\n/)) {
    if (/^```/.test(line.trim())) {
      inCodeBlock = !inCodeBlock
      if (current) current.lines.push(line)
      continue
    }
    if (!inCodeBlock) {
      const m = /^#\s+(.+?)\s*$/.exec(line)
      if (m) {
        current = { title: m[1].trim(), lines: [] }
        sections.push(current)
        continue
      }
    }
    if (current) current.lines.push(line)
  }
  return sections
}

const QUESTION_TITLES = ['问题', 'question', 'q']
const ANSWER_TITLES = ['答案', '回答', 'answer', 'a']

/**
 * 从卡片正文解析出问答两段。
 * 优先按标题名（问题/答案）匹配；匹配不到时按出现顺序兜底
 * （第一段=问题，第二段=答案），让轻微写错的卡片仍可复习。
 */
export function parseCardBody(body: string): CardQA {
  const sections = splitSections(body)
  const byName = (names: string[]) =>
    sections.find((s) => names.includes(s.title.toLowerCase()))

  let question = byName(QUESTION_TITLES)
  let answer = byName(ANSWER_TITLES)

  if (!question && !answer && sections.length > 0) {
    question = sections[0]
    answer = sections[1]
  }

  return {
    question: (question?.lines.join('\n') ?? body).trim(),
    answer: (answer?.lines.join('\n') ?? '').trim(),
  }
}
