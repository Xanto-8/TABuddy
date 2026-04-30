import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(__dirname, '../../.env.local') })

import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { Logger, ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  app.setGlobalPrefix('api/v1')

  const port = process.env.PORT || 3001
  await app.listen(port)

  const hasApiKey = !!process.env.DEEPSEEK_API_KEY
  Logger.log(`Notification server running on http://localhost:${port}`, 'Bootstrap')
  Logger.log(`DeepSeek AI: ${hasApiKey ? '已配置' : '未配置（使用本地兜底文案）'}`, 'Bootstrap')
}

bootstrap()
