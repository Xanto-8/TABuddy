import { Controller, Get, Put, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { ReminderConfigService } from './reminder-config.service'

class UpdateConfigDto {
  intervals: number[]
}

@Controller('reminder-config')
export class ReminderConfigController {
  constructor(private readonly reminderConfigService: ReminderConfigService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getConfig() {
    return {
      success: true,
      data: this.reminderConfigService.getConfig(),
    }
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  updateConfig(@Body() dto: UpdateConfigDto) {
    const config = this.reminderConfigService.updateConfig(dto)
    return {
      success: true,
      data: config,
    }
  }
}
