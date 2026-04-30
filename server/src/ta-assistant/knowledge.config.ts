export interface KnowledgeEntry {
  id: string
  keywords: string[]
  title: string
  content: string
  type: 'link' | 'template' | 'document' | 'info'
  url?: string
  priority: number
}

export const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'study-center',
    keywords: ['学习中心', '共享学习', '学习资源', '学习平台', '线上学习', '网课平台'],
    title: '共享学习中心',
    content: '点击下方链接访问共享学习中心，获取所有课程资料和学习资源。',
    type: 'link',
    url: 'https://study.neworiental.edu.cn/share',
    priority: 10,
  },
  {
    id: 'practice-answers',
    keywords: ['练习答案', '习题答案', '作业答案', '答案查询', '参考答案', '课后答案', '练习题答案'],
    title: '练习答案',
    content: '已整理好的练习答案文档，请点击链接查看对应课程单元的参考答案。',
    type: 'link',
    url: 'https://docs.neworiental.edu.cn/practice-answers',
    priority: 9,
  },
  {
    id: 'lesson-plan-template',
    keywords: ['教案', '教案模板', '教学设计', '教学计划', '备课模板', '备课'],
    title: '教案模板',
    content: '标准化教案模板，包含教学目标、重难点、课堂活动设计等模块，直接下载使用。',
    type: 'template',
    url: 'https://template.neworiental.edu.cn/lesson-plan',
    priority: 8,
  },
  {
    id: 'feedback-template',
    keywords: ['反馈模板', '家长反馈', '课程反馈', '反馈', '课程反馈模板', '课堂反馈', '学习反馈'],
    title: '课程反馈模板',
    content: '标准课程反馈模板，涵盖学生学习情况、课堂表现、作业完成度等内容。',
    type: 'template',
    url: 'https://template.neworiental.edu.cn/feedback',
    priority: 8,
  },
  {
    id: 'shared-documents',
    keywords: ['共享文档', '共享文件', '文档链接', '资料文档', '公共文档', '团队文档', '共享资料'],
    title: '共享文档中心',
    content: '团队共享文档库，包含各类教学资料、管理制度、操作手册等常用文档。',
    type: 'document',
    url: 'https://drive.neworiental.edu.cn/shared',
    priority: 7,
  },
  {
    id: 'retest-template',
    keywords: ['重测名单', '重测模板', '留校名单', '重测名单模板', '留校重测', '重测留校'],
    title: '重测/留校名单模板',
    content: '重测及留校名单登记表模板，用于记录需要重测或留校辅导的学生信息。',
    type: 'template',
    url: 'https://template.neworiental.edu.cn/retest-list',
    priority: 9,
  },
  {
    id: 'attendance-check',
    keywords: ['签到', '打卡', '签到打卡', '考勤', '签到记录', '打卡记录', '上课签到'],
    title: '课堂签到指南',
    content: '课堂签到操作说明及常见问题处理，包含学生签到、助教确认签到流程。',
    type: 'info',
    priority: 6,
  },
  {
    id: 'grading-guide',
    keywords: ['批改', '批改标准', '评分标准', '作业批改', '批改指南', '批改规范'],
    title: '作业批改规范指南',
    content: '统一作业批改标准和评分细则，包含各题型批改示例和常见批改问题说明。',
    type: 'document',
    url: 'https://docs.neworiental.edu.cn/grading-guide',
    priority: 7,
  },
  {
    id: 'grade-recording',
    keywords: ['成绩', '成绩记录', '成绩录入', '分数', '成绩登记', '录入成绩', '成绩单'],
    title: '成绩录入指南',
    content: '学生成绩录入系统操作说明，支持批量导入和手动录入两种方式。',
    type: 'link',
    url: 'https://grade.neworiental.edu.cn/guide',
    priority: 6,
  },
  {
    id: 'school-communication',
    keywords: ['家长沟通', '家校沟通', '联系家长', '家长联系', '沟通话术', '家长群'],
    title: '家校沟通指南',
    content: '家校沟通标准话术和注意事项，包含家长群管理规范、常见问题应答参考。',
    type: 'document',
    url: 'https://docs.neworiental.edu.cn/parent-communication',
    priority: 5,
  },
  {
    id: 'workflow-guide',
    keywords: ['工作流', '流程指引', '工作流程', '操作流程', '标准流程', 'SOP'],
    title: '工作流操作指引',
    content: '助教工作流标准操作流程说明，包含课前准备、课中跟进、课后反馈完整链路。',
    type: 'document',
    url: 'https://docs.neworiental.edu.cn/workflow-guide',
    priority: 6,
  },
  {
    id: 'classroom-equipment',
    keywords: ['设备', '教室设备', '多媒体', '投影', '电脑', '教学设备', '设备使用'],
    title: '教室设备使用说明',
    content: '教室多媒体设备操作指南，包含投影仪、音响、电脑等设备开关及故障处理。',
    type: 'info',
    priority: 4,
  },
  {
    id: 'emergency-contact',
    keywords: ['紧急', '紧急联系', '紧急情况', '突发事件', '应急', '事故'],
    title: '紧急联系人及应急预案',
    content: '校区紧急联系人清单及突发事件处理流程，遇紧急情况请第一时间联系主管。',
    type: 'document',
    url: 'https://docs.neworiental.edu.cn/emergency',
    priority: 5,
  },
]
