import { Module } from '@nestjs/common'
import { ReminderConfigService } from './reminder-config.service'
import { ReminderConfigController } from './reminder-config.controller'

@Module({
  controllers: [ReminderConfigController],
  providers: [ReminderConfigService],
  exports: [ReminderConfigService],
})
export class ReminderConfigModule {}
