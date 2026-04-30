import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { WorkflowNodeReminderService } from './workflow-node-reminder.service'
import { FireWorkflowNodeReminderDto, CompleteWorkflowNodeReminderDto } from './dto'

@Controller('workflow-node-reminder')
export class WorkflowNodeReminderController {
  constructor(private readonly service: WorkflowNodeReminderService) {}

  @Post('fire')
  @HttpCode(HttpStatus.OK)
  async fire(@Body() dto: FireWorkflowNodeReminderDto) {
    const result = await this.service.fire({
      classId: dto.classId,
      className: dto.className,
      courseType: dto.courseType,
      workflowNodeId: dto.workflowNodeId,
      workflowNodeName: dto.workflowNodeName,
    })
    return { success: true, data: result }
  }

  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Body() dto: CompleteWorkflowNodeReminderDto) {
    const result = await this.service.markComplete({
      reminderId: dto.reminderId,
      classId: dto.classId,
      workflowNodeId: dto.workflowNodeId,
    })
    return { success: true, data: result }
  }
}
