# TABuddy 未来开发路线规划

## 项目当前状态总览

### 技术栈
- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: Tailwind CSS + cn() utility
- **动画**: Framer Motion
- **存储**: localStorage (纯前端)
- **状态管理**: React Context (ProgressProvider)

### ✅ 已完成模块

| 模块 | 状态 | 说明 |
|------|------|------|
| **项目脚手架** | ✅ | Next.js + TS + Tailwind + ESLint 配置完成 |
| **布局系统** | ✅ | Sidebar + Header + PageTransition |
| **主题系统** | ✅ | ThemeProvider (light/dark/system) |
| **班级管理** | ✅ | 列表、创建、编辑、删除、详情页（学生/课表/资源/记录Tab） |
| **学生管理** | ✅ | 列表、创建、编辑、删除、筛选搜索 |
| **上课时间管理** | ✅ | 每周课表 CRUD，含自动检测当前上课班级 |
| **班级资源仓库** | ✅ | 资源 CRUD，文件/链接/文档类型支持 |
| **班级记录** | ✅ | 作业/小测/反馈/考勤记录 CRUD |
| **仪表盘 UI** | ✅ | 欢迎Banner、统计卡片、最近任务、快速操作、即将截止、绩效图表 |

### ❌ 待实现模块

| 模块 | 路由 | 数据层 | 页面 | 组件 |
|------|------|--------|------|------|
| **任务管理** | `/tasks`, `/tasks/new` | ❌ Task CRUD | ❌ | ❌ |
| **作业评估** | `/homework`, `/homework/assess` | ❌ HomeworkAssessment CRUD | ❌ | ❌ |
| **小测管理** | `/quizzes`, `/quizzes/upload` | ❌ QuizRecord CRUD | ❌ | ❌ |
| **话术生成** | `/feedback`, `/feedback/generate` | ❌ FeedbackTemplate + GeneratedFeedback CRUD | ❌ | ❌ |
| **资源容器** | `/resources`, `/resources/new` | ❌ Resource (全局) CRUD | ❌ | ❌ |
| **设置** | `/settings` | ❌ UserSettings | ❌ | ❌ |
| **报告导出** | `/reports/export` | ❌ | ❌ | ❌ |
| **成就系统** | - | ❌ Achievement CRUD | ❌ | ❌ |

### ⚠️ 待优化项
1. **仪表盘使用硬编码 Mock 数据** — Stats、RecentTasks、UpcomingDeadlines、PerformanceChart 均为假数据
2. **快速操作按钮** — 使用 `console.log` 而非实际路由导航
3. **学生管理班级筛选** — 类型下拉列表硬编码，未复用公共组件
4. **部分长下拉选择器未抽取为公共组件**（班级类型选择器在多个页面重复）

---

## 一、短期规划（1-2个月）— 核心功能补齐

### Phase 1: 任务管理模块

**目标**: 实现完整的任务管理系统，让助教可以创建、跟踪、完成任务。

| 任务 | 内容 |
|------|------|
| 1.1 | `lib/store.ts` 补充 `Task` CRUD（getTasks, saveTask, updateTask, deleteTask） |
| 1.2 | 创建 `app/tasks/page.tsx` — 任务列表页（筛选/搜索/状态管理） |
| 1.3 | 创建 `app/tasks/new/page.tsx` — 新建/编辑任务页 |
| 1.4 | 创建 `components/tasks/` 组件目录（TaskCard, TaskForm, TaskFilters） |
| 1.5 | 任务与班级、学生的关联（assignedTo 字段打通） |
| **依赖**: types/index.ts 中 Task 类型已定义 |

### Phase 2: 作业评估模块

**目标**: 实现作业批改流程，支持完成度、书写质量、准确率评估和 AI 话术生成。

| 任务 | 内容 |
|------|------|
| 2.1 | `lib/store.ts` 补充 `HomeworkAssessment` CRUD |
| 2.2 | 创建 `app/homework/page.tsx` — 作业评估列表页 |
| 2.3 | 创建 `app/homework/assess/page.tsx` — 作业批改表单 |
| 2.4 | 创建 `components/homework/` 组件目录 |
| 2.5 | 作业评估与班级、学生的数据联动 |
| **依赖**: types/index.ts 中 HomeworkAssessment 类型已定义 |

### Phase 3: 小测管理模块

**目标**: 支持小测拍照上传和成绩录入。

| 任务 | 内容 |
|------|------|
| 3.1 | `lib/store.ts` 补充 `QuizRecord` CRUD |
| 3.2 | 创建 `app/quizzes/page.tsx` — 小测记录列表 |
| 3.3 | 创建 `app/quizzes/upload/page.tsx` — 小测上传（图片上传 + 评分） |
| 3.4 | 创建 `components/quizzes/` 组件目录 |
| **依赖**: types/index.ts 中 QuizRecord 类型已定义 |

### Phase 4: 话术生成模块

**目标**: 管理反馈模板，生成个性化学生反馈。

| 任务 | 内容 |
|------|------|
| 4.1 | `lib/store.ts` 补充 `FeedbackTemplate` + `GeneratedFeedback` CRUD |
| 4.2 | 创建 `app/feedback/page.tsx` — 反馈管理列表 |
| 4.3 | 创建 `app/feedback/generate/page.tsx` — 反馈生成页 |
| 4.4 | 创建 `components/feedback/` 组件目录 |
| **依赖**: types/index.ts 中 FeedbackTemplate/GeneratedFeedback 类型已定义 |

### Phase 5: 全局资源容器

**目标**: 区别于班级资源仓库，全局资源跨班级共享。

| 任务 | 内容 |
|------|------|
| 5.1 | `lib/store.ts` 补充全局 `Resource` CRUD |
| 5.2 | 创建 `app/resources/page.tsx` — 全局资源库 |
| 5.3 | 创建 `components/resources/` 组件目录 |
| **依赖**: types/index.ts 中 Resource 类型已定义 |

---

## 二、中期规划（3-4个月）— 数据打通与体验优化

### Phase 6: 仪表盘数据真实化

| 任务 | 内容 |
|------|------|
| 6.1 | DashboardStats 接入真实 Task/Homework/Student 数据 |
| 6.2 | RecentTasks 从 Task store 读取真实任务 |
| 6.3 | UpcomingDeadlines 从 Task store 读取真实截止日期 |
| 6.4 | PerformanceChart 基于真实数据生成趋势图 |
| 6.5 | QuickActions 按钮对接真实路由（next/navigation） |

### Phase 7: 设置页面

| 任务 | 内容 |
|------|------|
| 7.1 | `lib/store.ts` 补充 `UserSettings` CRUD 及持久化 |
| 7.2 | 创建 `app/settings/page.tsx` — 设置页面 |
| 7.3 | 主题切换（已支持 ThemeProvider，需打通设置页） |
| 7.4 | 通知偏好设置 |
| 7.5 | 快捷键设置 |

### Phase 8: 报告与导出

| 任务 | 内容 |
|------|------|
| 8.1 | 创建报表数据聚合逻辑 |
| 8.2 | 创建 `app/reports/page.tsx` — 报告生成页 |
| 8.3 | 支持导出为 PDF/CSV/Excel 格式 |
| 8.4 | 创建可复用的导出工具函数 |

### Phase 9: 代码质量与架构优化

| 任务 | 内容 |
|------|------|
| 9.1 | 抽取公共组件（Select/Modal/Dropdown 通用化） |
| 9.2 | 班级类型选项列表统一管理（减少硬编码） |
| 9.3 | 添加表单验证工具库 |
| 9.4 | 补充错误边界和加载状态 |
| 9.5 | 补充全局类型校验（运行时/编译时） |

---

## 三、长期规划（5-6个月）— 进阶功能与架构升级

### Phase 10: 成就系统

| 任务 | 内容 |
|------|------|
| 10.1 | `lib/store.ts` 补充 `Achievement` CRUD |
| 10.2 | 成就解锁逻辑（完成任务数、批改份数等条件触发） |
| 10.3 | 成就展示 UI（侧边栏成就卡片 + 成就页面） |

### Phase 11: AI 功能集成

| 任务 | 内容 |
|------|------|
| 11.1 | 对接 LLM API（DeepSeek / OpenAI）用于话术生成 |
| 11.2 | 图片识别（小测拍照自动评分） |
| 11.3 | 智能任务推荐 |
| 11.4 | 学生表现分析报告自动生成 |

### Phase 12: 后端迁移

| 任务 | 内容 |
|------|------|
| 12.1 | 设计数据库 Schema（SQLite / PostgreSQL） |
| 12.2 | 实现 RESTful API 层 |
| 12.3 | 用户认证与权限管理 |
| 12.4 | 多教师/多助教协作支持 |
| 12.5 | 数据迁移工具（localStorage → 数据库） |
| 12.6 | 部署到云服务器 |

### Phase 13: 平台化扩展

| 任务 | 内容 |
|------|------|
| 13.1 | 家长端查看学生报告 |
| 13.2 | 学生端提交作业/查看反馈 |
| 13.3 | 移动端适配（PWA / React Native） |
| 13.4 | 国际化支持（i18n） |
| 13.5 | 数据分析仪表盘（高级版） |

---

## 建议执行顺序

```
短期（1-2个月）              中期（3-4个月）               长期（5-6个月）
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ Phase 1: 任务管理  │ → │ Phase 6: 数据打通  │ → │ Phase 10: 成就系统 │
│ Phase 2: 作业评估  │ → │ Phase 7: 设置页面   │ → │ Phase 11: AI 集成 │
│ Phase 3: 小测管理  │ → │ Phase 8: 报告导出   │ → │ Phase 12: 后端迁移 │
│ Phase 4: 话术生成  │ → │ Phase 9: 架构优化   │ → │ Phase 13: 平台化  │
│ Phase 5: 资源容器  │    │                  │    │                  │
└─────────────────┘    └──────────────────┘    └──────────────────┘
```

### 优先级建议
- **P0（立即开始）**: Phase 1, 2 — 核心教学工作流
- **P1（下一步）**: Phase 3, 4, 5 — 辅助教学功能
- **P2（中期）**: Phase 6, 7, 8, 9 — 体验优化
- **P3（长期）**: Phase 10, 11, 12, 13 — 进阶扩展

---

## 技术债务与注意事项

1. **数据一致性**: 班级删除时需级联清理关联的课表、学生、记录、资源
2. **类型统一**: `ClassResource`（班级级别）和 `Resource`（全局）有重叠，需明确职责边界
3. **导航打通**: Sidebar 导航项和 QuickActions 均需正确路由
4. **错误处理**: 补充全局错误边界和 toast 通知
5. **性能优化**: localStorage 数据量大时考虑分页/虚拟滚动
6. **测试覆盖**: 核心 CRUD 逻辑建议添加单元测试
