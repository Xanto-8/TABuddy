import { IsString, IsOptional, IsArray, IsIn, IsNumber, IsObject } from 'class-validator'

export class ChatHistoryItemDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant'

  @IsString()
  content: string
}

export class ChatDto {
  @IsString()
  message: string

  @IsString()
  @IsOptional()
  courseName?: string

  @IsString()
  @IsOptional()
  classType?: string

  @IsString()
  @IsOptional()
  currentTask?: string

  @IsString()
  @IsOptional()
  remainingTime?: string

  @IsString()
  @IsOptional()
  lessonLabel?: string

  @IsNumber()
  @IsOptional()
  workflowCompleted?: number

  @IsNumber()
  @IsOptional()
  workflowTotal?: number

  @IsObject()
  @IsOptional()
  classData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  history?: ChatHistoryItemDto[]
}
