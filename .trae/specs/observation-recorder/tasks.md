# 随堂记录浮窗 Tasks

## 任务 1：数据层 — 随堂记录存储
- [x] 在 `lib/store.ts` 中新增数据结构和函数
  - [x] 新增 `ObservationRecord` 接口：`{ id, studentId, classId, className, content, courseType, createdAt: Date }`
  - [x] `cache.observations: ObservationRecord[]`
  - [x] `getObservationRecords(classId?: string, studentId?: string): ObservationRecord[]` — 支持按班级/学生过滤
  - [x] `saveObservationRecord(data: Omit<ObservationRecord, 'id' | 'createdAt'>): ObservationRecord`
  - [x] `deleteObservationRecord(id: string): void`
  - [x] 持久化到 localStorage，通过 `debouncedSyncStore()` 同步

## 任务 2：UI — 随堂记录浮窗组件
- [x] 创建 `components/observation/observation-recorder.tsx`
  - [x] `'use client'` 组件
  - [x] 右下角 📝 悬浮按钮，点击展开/收起浮窗
  - [x] 浮窗标题：当前班级名称（从 `getCurrentClassByTime()` 获取）
  - [x] 学生快速选择区：以标签/按钮形式展示当前班级学生，支持搜索过滤
  - [x] 选中学生后显示其今日已有记录列表
  - [x] 底部文本输入框 + 保存按钮
  - [x] 支持 Enter 快捷保存，Shift+Enter 换行
  - [x] 记录卡片：内容 + 时间戳 + 删除按钮（X 图标）
  - [x] 无班级时显示提示，允许手动选择班级
  - [x] 可拖拽移动浮窗（mousedown 拖拽标题栏）
  - [x] 最小化模式：折叠为仅 📝 图标
  - [x] 使用 framer-motion 展开/收起动画

## 任务 3：集成 — 全局挂载 + 反馈关联
- [x] 在 `app/layout.tsx` 中挂载 `ObservationRecorder` 组件
  - [x] import 并放置在 layout body 中（与 FloatingChat 同级）
- [x] 在 `lib/feedback-generator.ts` 中注入随堂记录
  - [x] `getFeedbackPrompt()` 函数中，获取该学生的随堂记录
  - [x] 在 prompt 中追加 "今日课堂表现：XXX" 上下文
- [x] 在 `app/api/feedback/batch-generate/route.ts` 中也注入随堂记录
  - [x] 由于 API 路由不能直接调用 `getObservationRecords`
  - [x] 改为：前端 `BatchFeedbackPanel` 在请求时附带每个学生的随堂记录

# Task Dependencies
- 任务 1 先完成，任务 2 和 3 可并行（任务 2 依赖任务 1 的 API）
- 编译验证最后进行
