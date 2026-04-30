import { Module } from '@nestjs/common'
import { DeepseekModule } from '../deepseek/deepseek.module'
import { CourseModule } from '../course/course.module'
import { ReminderConfigModule } from '../reminder-config/reminder-config.module'
import { NotificationService } from './notification.service'
import { NotificationController } from './notification.controller'

@Module({
  imports: [DeepseekModule, CourseModule, ReminderConfigModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
