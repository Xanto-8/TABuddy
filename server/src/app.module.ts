import { Module } from '@nestjs/common'
import { DeepseekModule } from './deepseek/deepseek.module'
import { NotificationModule } from './notification/notification.module'
import { CourseModule } from './course/course.module'
import { ReminderConfigModule } from './reminder-config/reminder-config.module'
import { WorkflowNodeReminderModule } from './workflow-node-reminder/workflow-node-reminder.module'
import { TaAssistantModule } from './ta-assistant/ta-assistant.module'

@Module({
  imports: [DeepseekModule, NotificationModule, CourseModule, ReminderConfigModule, WorkflowNodeReminderModule, TaAssistantModule],
})
export class AppModule {}
