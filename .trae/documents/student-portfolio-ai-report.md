# 学生成长档案 AI 专业报告 优化方案

## 目标

将当前的学生成长档案页面升级为**专业的 AI 学习分析报告**，通过 DeepSeek 大模型全面分析学生所有历史数据，生成：
- 📊 **逐次小测成绩明细表**（单词得分、语法得分、正确率）
- 📋 **出勤总结**（缺勤/请假统计）
- 🤖 **AI 学期综合总结**（基于所有反馈记录提炼）
- 🎯 **薄弱点与重难点分析**（结合课程类型 GY/KET/PET/FCE/CAE/CPE）
- 💡 **个性化学习建议**（针对弱项的提升方案）
- 📄 **专业 PDF 报告导出**

---

## 实施步骤

### Step 1：新增 AI 分析 API 路由

**文件**：`app/api/portfolio/analyze/route.ts`

创建一个新的 POST API 端点，接收学生全部数据，调用 DeepSeek 生成分析报告。

**输入参数**：
```typescript
interface PortfolioAnalysisRequest {
  studentName: string       // 学生姓名
  className: string         // 班级名称
  classType: ClassType      // GY/KET/PET/FCE/CAE/CPE
  // 量化数据
  quizRecordsSummary: {     // 小测汇总
    total: number
    avgWordAccuracy: number  // 平均单词正确率
    latestWordAccuracy: number
    wordScoreHistory: { date: string; score: number; total: number; accuracy: number }[]
    grammarAccuracy?: number
    completionRate: number   // 完成率
  }
  homeworkSummary: {         // 作业汇总
    total: number
    avgAccuracy: number
    latestAccuracy: number
    handwritingDistribution: Record<string, number>
    completionRate: number
  }
  // AI 可分析数据
  allFeedbackContents: string[]   // 所有历史反馈原文
  observationContents: string[]   // 所有随手记原文
  absenceCount: number            // 缺勤次数
  totalLessons: number            // 总课时
  // 课程信息
  courseTasks: { lesson: string; title: string; content: string }[]
}
```

**AI Prompt 设计**（关键部分）：

```
你是新东方少儿英语课程的资深教学顾问。请基于以下学生的全部学习数据，
生成一份专业的学期学习分析报告。报告需包含以下章节：

## 1. 学期学习总结（200-300字）
综合小测成绩趋势、作业完成情况、出勤情况、课堂反馈记录，
客观总结学生本学期的整体学习状态和进步轨迹。

## 2. 各模块掌握情况分析（200-300字）
- 词汇掌握：根据历次单词测试得分分析
- 语法运用：根据语法得分/课堂表现分析
- 作业质量：根据正确率、书写质量分析
- 课堂参与：根据反馈关键词和随手记分析

## 3. 薄弱点与重难点诊断（150-200字）
根据{课程类型}课程体系要求，结合学生实际数据，明确指出：
- 学生当前最需要加强的1-2个核心薄弱点
- 本阶段课程中需要重点突破的难点

## 4. 个性化学习建议（150-200字）
针对上述薄弱点，给出具体可操作的学习建议，包括：
- 课后复习重点
- 练习方法和频率
- 家长配合建议

格式要求：使用 Markdown 格式，层级清晰，语言专业温暖，适合给家长阅读。
```

**降级策略**：API 调用失败时，前端根据已有数据自动生成模板化分析（类似现有的本地话术库降级逻辑）。

---

### Step 2：创建数据聚合函数

**文件**：`lib/portfolio-aggregator.ts`

封装数据汇总逻辑，从多个数据源聚合成 AI 分析所需的结构：

```typescript
export function aggregateStudentPortfolio(studentId: string) {
  // 1. 获取作业评估数据
  const homework = getHomeworkAssessmentsByStudent(studentId)
  // 2. 获取小测记录
  const quizzes = getQuizRecordsByStudent(studentId)
  // 3. 获取反馈历史
  const feedbacks = getFeedbackHistoryByStudent(studentId)
  // 4. 获取缺勤记录（需遍历所有班级的所有日期）
  const absences = getAllAbsenceRecordsForStudent(studentId)
  // 5. 获取随手记
  const observations = getObservationRecords(undefined, studentId)
  // 6. 获取课程任务（通过学生班级获取）
  const courseTasks = getCourseTasksForStudent(studentId)
  
  // 计算汇总指标
  return { quizSummary, homeworkSummary, absenceCount, totalLessons, ... }
}
```

**关键计算**：
- 小测平均正确率、最近一次正确率（趋势）
- 作业平均正确率、书写质量分布
- 缺勤率
- 反馈中高频关键词提取

---

### Step 3：UI 页面重新设计

**文件**：`app/(app)/students/[id]/page.tsx`（重写）

#### 整体布局（专业报告风格）

```
┌──────────────────────────────────────────────┐
│ ← 返回    [头像] 张三 · GY秋季班            │
│                              [📥 导出PDF报告] │
├──────────────────────────────────────────────┤
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐       │
│  │ 作业  │ │ 小测  │ │ 缺勤  │ │平均正 │       │
│  │ 12次  │ │ 8次   │ │ 2次   │ │ 87%   │       │
│  └──────┘ └──────┘ └──────┘ └──────┘       │
├──────────────────────────────────────────────┤
│  📊 正确率趋势图（保留现有 Recharts 折线图）  │
│  ┌──────────────────────────────────────────┐ │
│  │  作业正确率(蓝色) + 小测单词正确率(紫色)   │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  📝 小测成绩明细（新增 - 核心需求）           │
│  ┌──────────────────────────────────────────┐ │
│  │ 日期  │ 单词得分 │ 语法得分 │ 正确率 │ 完成 │ │
│  │ 05/01 │  12/14   │   8/10   │  85%   │  ✓  │ │
│  │ 04/24 │  10/14   │   7/10   │  70%   │  ✓  │ │
│  │ 04/17 │ 缺勤     │ 缺勤     │ 缺勤   │  ✗  │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  📋 出勤总结（新增）                          │
│  ┌──────────────────────────────────────────┐ │
│  │ 总课时：16次  │ 出勤：14次  │ 缺勤：2次    │ │
│  │ 出勤率：87.5%  │             │              │ │
│  │ 缺勤日期：04/17, 03/08                    │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  🤖 AI 学习分析报告（新增 - 核心需求）        │
│  ┌──────────────────────────────────────────┐ │
│  │ [加载中/已生成]                            │ │
│  │                                          │ │
│  │ ## 学期学习总结                            │ │
│  │ 张三本学期整体表现稳定，小测平均正确率...   │ │
│  │                                          │ │
│  │ ## 薄弱点与重难点诊断                      │ │
│  │ 1. 词汇拼写：在单元测验中多次出现...        │ │
│  │ 2. 语法时态：PET阶段重点掌握的现在完成时... │ │
│  │                                          │ │
│  │ ## 个性化学习建议                          │ │
│  │ ...                                      │ │
│  │                                          │ │
│  │ [🔄 重新生成分析]                          │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  💬 近期课堂反馈（保留但美化）                  │
│  ┌──────────────────────────────────────────┐ │
│  │ 05/15 | 张三本节课整体表现优秀...          │ │
│  │ 05/08 | 本节课注意力较集中...              │ │
│  └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│  ⏱ 成长时间轴（保留，精简显示）               │
└──────────────────────────────────────────────┘
```

#### 关键状态管理

```typescript
// AI 分析相关
const [aiReport, setAiReport] = useState<string | null>(null)
const [aiLoading, setAiLoading] = useState(false)
const [aiError, setAiError] = useState<string | null>(null)

// 使用 sessionStorage 缓存 AI 报告（同一次浏览不重复请求）
const CACHE_KEY = `portfolio_report_${studentId}`
```

#### AI 分析组件

将 AI 报告区提取为独立组件 `components/portfolio/AIReportCard.tsx`：
- 接收聚合数据作为 props
- 内部调用 `/api/portfolio/analyze`
- 支持「重新生成」按钮
- Markdown 渲染（可使用轻量库如 `react-markdown` 或直接用 `dangerouslySetInnerHTML` + 简单的 Markdown 解析）

---

### Step 4：小测成绩明细表组件

**文件**：`components/portfolio/QuizDetailTable.tsx`

```typescript
interface QuizDetailRow {
  date: string
  lesson?: string         // 对应课时（如"第3课"）
  wordScore: number | null
  wordTotal: number | null
  wordAccuracy: number | null
  grammarScore: number | null
  grammarTotal: number | null
  completion: CompletionStatus
  isAbsent: boolean
}
```

特性：
- 按日期倒序排列
- 缺勤行灰色显示
- 正确率<80% 的行标红/标黄
- 支持折叠/展开（默认显示最近 10 次）

---

### Step 5：出勤总结组件

**文件**：`components/portfolio/AttendanceCard.tsx`

数据来源：`getAbsenceRecords()` + 班级排课信息反推总课时。

```typescript
// 通过所有班级的排课 schedule 反推学期总课时
function getTotalLessonsForStudent(studentId: string): number {
  const classes = getClasses()
  let total = 0
  for (const cls of classes) {
    const hasStudent = getStudentsByClass(cls.id).some(s => s.id === studentId)
    if (hasStudent) {
      const schedules = getClassSchedules(cls.id)
      // 按 schedule dayOfWeek 统计已过去的周数 × 每周课时
      // 或从 courseTasks 中统计已过去的带课时号的任务数
      total += countPastLessons(cls.id)
    }
  }
  return total
}
```

简化方案：以 **有记录的不同日期数** 作为总课时近似，或从 `courseTasks` 中统计该学生的课时数。

---

### Step 6：增强 PDF 导出

**文件**：直接修改 `page.tsx` 中的 `handleExportPDF`

改进：
- 将打印标题改为 `{学生姓名} 学期学习分析报告`
- 头部添加：学生信息、班级、报告生成日期
- pdf 分页时正确处理 AI 分析的长文本
- 图表区域截取为图片嵌入

---

### Step 7：可选的 Markdown 渲染

由于 AI 报告输出为 Markdown 格式，前端需要简单渲染：

方案：创建轻量 Markdown 渲染器 `components/ui/markdown-renderer.tsx`：
- 解析 `##` 标题 → `<h2>`
- 解析 `**` 加粗 → `<strong>`
- 解析 `- ` 列表 → `<ul><li>`
- 解析换行 → `<br />` 或 `<p>`
- 不引入额外依赖

---

## 文件变更清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `app/api/portfolio/analyze/route.ts` | AI 分析 API 端点 |
| **新增** | `lib/portfolio-aggregator.ts` | 数据聚合函数（小测、作业、反馈、缺勤、随手记） |
| **新增** | `components/portfolio/AIReportCard.tsx` | AI 分析报告展示卡片 |
| **新增** | `components/portfolio/QuizDetailTable.tsx` | 小测成绩明细表格 |
| **新增** | `components/portfolio/AttendanceCard.tsx` | 出勤统计卡片 |
| **新增** | `components/ui/markdown-renderer.tsx` | 轻量 Markdown 渲染 |
| **重写** | `app/(app)/students/[id]/page.tsx` | 主页面改为专业报告布局 |
| **保留** | `app/(app)/students/[id]/_growth-chart.tsx` | 图表组件（不改） |
| **删除** | 无 | 原有组件保留或内联替代 |

---

## 降级策略

| 场景 | 处理 |
|------|------|
| DeepSeek API Key 缺失 | 用本地规则引擎生成分析（汇总数据 + 模板话术） |
| API 调用超时/失败 | 显示「AI 分析暂时不可用」+ 重试按钮 |
| 数据量不足（<3 次小测） | 提示「数据不足，至少需要 3 次小测记录」 |
| 无反馈记录 | AI 分析跳过「学期总结」章节，仅显示数据汇总 |
| PDF 导出时 AI 未加载 | 导出的报告中标注「AI 分析未生成」 |

---

## 优先级建议

| 优先级 | 步骤 | 影响 |
|--------|------|------|
| 🔴 P0 | Step 2: 数据聚合函数 | 所有后续步骤依赖 |
| 🔴 P0 | Step 1: AI 分析 API | 核心功能 |
| 🔴 P0 | Step 6: AIReportCard 组件 | 核心 UI |
| 🟡 P1 | Step 3: 页面重写 | 整体布局 |
| 🟡 P1 | Step 4: 小测明细表 | 用户核心需求 |
| 🟡 P1 | Step 5: 出勤总结 | 用户需求 |
| 🟢 P2 | Step 7: Markdown 渲染 | 美化 |
| 🟢 P2 | Step 8: PDF 导出增强 | 锦上添花 |
