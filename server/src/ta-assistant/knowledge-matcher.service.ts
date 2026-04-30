import { Injectable } from '@nestjs/common'
import { knowledgeBase, KnowledgeEntry } from './knowledge.config'

export interface MatchResult {
  matched: boolean
  entry?: KnowledgeEntry
}

@Injectable()
export class KnowledgeMatcherService {
  match(input: string): MatchResult {
    const normalized = input.toLowerCase().replace(/\s+/g, '')

    const scored = knowledgeBase
      .map((entry) => {
        const score = this.calculateScore(normalized, entry)
        return { entry, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)

    if (scored.length === 0) {
      return { matched: false }
    }

    const best = scored[0]
    return { matched: true, entry: best.entry }
  }

  getAllEntries(): KnowledgeEntry[] {
    return [...knowledgeBase]
  }

  private calculateScore(normalized: string, entry: KnowledgeEntry): number {
    let maxKeywordScore = 0

    for (const keyword of entry.keywords) {
      const normalizedKeyword = keyword.toLowerCase()
      let score = 0

      if (normalized.includes(normalizedKeyword)) {
        score = 100
      } else {
        const matchRatio = this.fuzzyMatchRatio(normalized, normalizedKeyword)
        score = matchRatio * 60
      }

      if (score > maxKeywordScore) {
        maxKeywordScore = score
      }
    }

    return maxKeywordScore * (entry.priority / 10)
  }

  private fuzzyMatchRatio(text: string, keyword: string): number {
    if (keyword.length === 0) return 0

    let ki = 0
    let matches = 0

    for (let ti = 0; ti < text.length && ki < keyword.length; ti++) {
      if (text[ti] === keyword[ki]) {
        matches++
        ki++
      }
    }

    if (ki < keyword.length) return 0

    return matches / keyword.length
  }
}
