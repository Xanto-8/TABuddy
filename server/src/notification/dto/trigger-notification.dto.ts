import { IsString, IsOptional, IsObject } from 'class-validator'

export class TriggerNotificationDto {
  @IsString()
  scene: string

  @IsString()
  @IsOptional()
  courseId?: string

  @IsString()
  @IsOptional()
  courseName?: string

  @IsString()
  @IsOptional()
  startTime?: string

  @IsString()
  @IsOptional()
  endTime?: string

  @IsString()
  @IsOptional()
  workflowNodeId?: string

  @IsString()
  @IsOptional()
  workflowNodeName?: string

  @IsObject()
  @IsOptional()
  extraParams?: Record<string, string | number | boolean>

  @IsString()
  @IsOptional()
  context?: string
}
