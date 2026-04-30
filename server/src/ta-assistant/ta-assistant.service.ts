import { Injectable } from '@nestjs/common'
import { KnowledgeMatcherService, MatchResult } from './knowledge-matcher.service'
import { DeepseekChatService, ChatContext, ChatHistoryItem } from './deepseek-chat.service'
import { KnowledgeEntry } from './knowledge.config'

export interface ChatRequest {
  message: string
  courseName?: string
  classType?: string
  currentTask?: string
  remainingTime?: string
  lessonLabel?: string
  workflowCompleted?: number
  workflowTotal?: number
  classData?: Record<string, unknown>
  history?: ChatHistoryItem[]
}

export interface KnowledgeMatchResponse {
  source: 'knowledge_base'
  entry: KnowledgeEntry
}

export interface AiResponse {
  source: 'ai'
  reply: string
}

export type ChatResponse = KnowledgeMatchResponse | AiResponse

@Injectable()
export class TaAssistantService {
  constructor(
    private readonly knowledgeMatcher: KnowledgeMatcherService,
    private readonly deepseekChat: DeepseekChatService,
  ) {}

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const matchResult: MatchResult = this.knowledgeMatcher.match(request.message)

    if (matchResult.matched && matchResult.entry) {
      return {
        source: 'knowledge_base',
        entry: matchResult.entry,
      }
    }

    const context: ChatContext = {}
    if (request.courseName) context.courseName = request.courseName
    if (request.classType) context.classType = request.classType
    if (request.currentTask) context.currentTask = request.currentTask
    if (request.remainingTime) context.remainingTime = request.remainingTime
    if (request.lessonLabel) context.lessonLabel = request.lessonLabel
    if (request.workflowCompleted !== undefined) context.workflowCompleted = request.workflowCompleted
    if (request.workflowTotal !== undefined) context.workflowTotal = request.workflowTotal
    if (request.classData) context.classData = request.classData as Record<string, unknown>

    const reply = await this.deepseekChat.chat(request.message, context, request.history)

    return {
      source: 'ai',
      reply,
    }
  }

  getAllKnowledgeEntries(): KnowledgeEntry[] {
    return this.knowledgeMatcher.getAllEntries()
  }
}
