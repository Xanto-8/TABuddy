import { IsString, IsOptional } from 'class-validator'

export class PreviewNotificationDto {
  @IsString()
  scene: string

  @IsString()
  @IsOptional()
  courseName?: string

  @IsString()
  @IsOptional()
  workflowNodeName?: string

  @IsString()
  @IsOptional()
  extraContext?: string
}
