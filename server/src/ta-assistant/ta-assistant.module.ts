import { Module } from '@nestjs/common'
import { TaAssistantController } from './ta-assistant.controller'
import { TaAssistantService } from './ta-assistant.service'
import { KnowledgeMatcherService } from './knowledge-matcher.service'
import { DeepseekChatService } from './deepseek-chat.service'

@Module({
  controllers: [TaAssistantController],
  providers: [TaAssistantService, KnowledgeMatcherService, DeepseekChatService],
  exports: [TaAssistantService, KnowledgeMatcherService],
})
export class TaAssistantModule {}
