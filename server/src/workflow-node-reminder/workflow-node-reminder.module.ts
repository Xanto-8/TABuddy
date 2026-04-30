import { Module } from '@nestjs/common'
import { DeepseekModule } from '../deepseek/deepseek.module'
import { WorkflowNodeReminderService } from './workflow-node-reminder.service'
import { WorkflowNodeReminderController } from './workflow-node-reminder.controller'

@Module({
  imports: [DeepseekModule],
  controllers: [WorkflowNodeReminderController],
  providers: [WorkflowNodeReminderService],
  exports: [WorkflowNodeReminderService],
})
export class WorkflowNodeReminderModule {}
