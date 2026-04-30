import { Injectable } from '@nestjs/common'

export interface ReminderConfig {
  intervals: number[]
}

const DEFAULT_CONFIG: ReminderConfig = {
  intervals: [30, 15],
}

@Injectable()
export class ReminderConfigService {
  private config: ReminderConfig = { ...DEFAULT_CONFIG }

  getConfig(): ReminderConfig {
    return { ...this.config }
  }

  updateConfig(partial: Partial<ReminderConfig>): ReminderConfig {
    if (partial.intervals !== undefined) {
      this.config.intervals = [...new Set(partial.intervals)].sort((a, b) => b - a)
    }
    return this.getConfig()
  }

  resetConfig(): ReminderConfig {
    this.config = { ...DEFAULT_CONFIG }
    return this.getConfig()
  }
}
