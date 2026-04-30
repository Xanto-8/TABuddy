import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common'
import { CourseService } from './course.service'

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get('today')
  @HttpCode(HttpStatus.OK)
  async getTodayCourses() {
    const courses = await this.courseService.getTodayCourses()
    return {
      success: true,
      data: courses,
    }
  }
}
