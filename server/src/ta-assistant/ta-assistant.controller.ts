import { Controller, Post, Get, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { TaAssistantService } from './ta-assistant.service'
import { ChatDto } from './dto/chat.dto'

@Controller('ta-assistant')
export class TaAssistantController {
  constructor(private readonly taAssistantService: TaAssistantService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chat(@Body() dto: ChatDto) {
    const result = await this.taAssistantService.chat({
      message: dto.message,
      courseName: dto.courseName,
      classType: dto.classType,
      currentTask: dto.currentTask,
      remainingTime: dto.remainingTime,
      lessonLabel: dto.lessonLabel,
      workflowCompleted: dto.workflowCompleted,
      workflowTotal: dto.workflowTotal,
      classData: dto.classData,
      history: dto.history,
    })
    return { success: true, data: result }
  }

  @Get('knowledge')
  @HttpCode(HttpStatus.OK)
  async getKnowledgeBase() {
    const entries = this.taAssistantService.getAllKnowledgeEntries()
    return { success: true, data: entries }
  }
}
