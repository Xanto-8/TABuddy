export interface ReminderConfig {
  intervals: number[]
}

const DEFAULT_CONFIG: ReminderConfig = {
  intervals: [30, 15],
}

let config: ReminderConfig = { ...DEFAULT_CONFIG }

export function getConfig(): ReminderConfig {
  return { ...config }
}

export function updateConfig(partial: Partial<ReminderConfig>): ReminderConfig {
  if (partial.intervals !== undefined) {
    config.intervals = Array.from(new Set(partial.intervals)).sort((a, b) => b - a)
  }
  return getConfig()
}

export function resetConfig(): ReminderConfig {
  config = { ...DEFAULT_CONFIG }
  return getConfig()
}
