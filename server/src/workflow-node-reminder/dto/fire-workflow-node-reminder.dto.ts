import { IsString, IsOptional } from 'class-validator'

export class FireWorkflowNodeReminderDto {
  @IsString()
  classId: string

  @IsString()
  className: string

  @IsString()
  courseType: string

  @IsString()
  workflowNodeId: string

  @IsString()
  workflowNodeName: string
}

export class CompleteWorkflowNodeReminderDto {
  @IsString()
  reminderId: string

  @IsString()
  classId: string

  @IsString()
  workflowNodeId: string
}
