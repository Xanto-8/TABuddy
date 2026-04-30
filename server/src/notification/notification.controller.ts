import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { NotificationService } from './notification.service'
import { TriggerNotificationDto } from './dto/trigger-notification.dto'
import { PreviewNotificationDto } from './dto/preview-notification.dto'

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('trigger')
  @HttpCode(HttpStatus.OK)
  async trigger(@Body() dto: TriggerNotificationDto) {
    const result = await this.notificationService.trigger({
      scene: dto.scene,
      courseId: dto.courseId,
      courseName: dto.courseName,
      startTime: dto.startTime,
      endTime: dto.endTime,
      workflowNodeId: dto.workflowNodeId,
      workflowNodeName: dto.workflowNodeName,
      extraParams: dto.extraParams,
      context: dto.context,
    })
    return { success: true, data: result }
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  async preview(@Body() dto: PreviewNotificationDto) {
    const result = await this.notificationService.trigger({
      scene: dto.scene,
      courseName: dto.courseName,
      workflowNodeName: dto.workflowNodeName,
      context: dto.extraContext,
    })
    return { success: true, data: { message: result.message } }
  }

  @Post('check-pre-class')
  @HttpCode(HttpStatus.OK)
  async checkPreClass() {
    const reminders = await this.notificationService.checkPreClassReminders()
    return { success: true, data: reminders }
  }
}
