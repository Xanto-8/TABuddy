# Phase 3（剩余）+ Phase 4 Tasks

## 任务 4.1：批量成绩录入表格模式
- [x] 在 `homework/page.tsx` 中添加表格模式
  - [x] 新增 `gridMode` state 切换按钮（与列表模式互斥）
  - [x] 选中班级后，在操作栏显示"表格模式"/"列表模式"切换
  - [x] 表格以学生姓名为行、评估维度为列（完成/未完成、得分、评语等）
  - [x] 单元格支持直接输入（input 或 select）
  - [x] 键盘导航：Tab 右移，Enter 下移，方向键移动
  - [x] "批量保存"按钮：收集所有修改的行 → 调用 `saveHomeworkRecord()` 逐个保存
  - [x] 保存进度 toast："已保存 N/M"
- [x] 在 `quizzes/page.tsx` 中同样添加表格模式
  - [x] 同上逻辑，适配小测的评估维度（单词得分/总分、语法得分/总分）

## 任务 4.2：全班快速标记
- [x] 在 `homework/page.tsx` 操作栏添加快速标记按钮组
  - [x] "全班完成"按钮：使用 `toast` Action 确认 → 批量更新所有学生 homework 状态为已完成
  - [x] "全班未完成"按钮：批量重置所有学生状态
  - [x] 确认后 toast 显示"已标记 N 名学生"
- [x] 在 `quizzes/page.tsx` 操作栏添加快速标记按钮组
  - [x] "全班已打卡"按钮：批量标记所有学生打卡状态
  - [x] 批量操作后仍可单独修改个别学生

## 任务 4.3：一键家长群文案生成
- [x] 创建 `app/api/feedback/generate-parent-text/route.ts` API 路由
  - [x] POST 接收 `{ classId, classContent, courseType }`
  - [x] 尝试调用 DeepSeek API 生成文案（使用 `DEEPSEEK_API_KEY`）
  - [x] 不同课程类型使用不同 system prompt 模板（GY/KET/PET/FCE）
  - [x] 文案结构：今日学习内容 + 课后作业提醒 + 重点注意事项
  - [x] API 不可用时有本地模板降级
- [x] 创建 `lib/generate-parent-text.ts` 本地模板降级
  - [x] 根据课程类型输出预设文案框架
- [x] 在 `feedback/page.tsx` 中添加"生成家长群文案"按钮
  - [x] 选中班级后显示按钮
  - [x] 点击 → loading → 弹出结果面板
  - [x] 结果区显示文案 + "一键复制"按钮
  - [x] 复制后 toast 提示"文案已复制"

## 任务 4.4：侧边栏路由高亮修复
- [x] 修改 `sidebar.tsx` 中 4 处 `pathname === item.href` 为高亮逻辑
  - [x] 对于有子路由的项（如 `/classes`、`/admin`），使用 `pathname.startsWith()`
  - [x] Dashboard `/` 作为 fallback — 仅当 pathname 等于 `/dashboard` 或 `/` 时高亮
  - [x] 考虑 `/stats` 等不需要子路由高亮的项保持原样

## 任务 4.5：弹窗 Esc 关闭 + 表单 Enter 提交
- [x] 创建一个 `useEscapeKey(onClose: () => void)` hook 在 `lib/use-escape-key.ts`
- [x] 在以下弹窗组件中使用该 hook：
  - [x] `BatchImportDialog`（批量导入弹窗）
  - [x] `KnowledgeImportDialog`（知识库导入）
  - [x] `BindInviteCodeModal`（绑定邀请码弹窗）
- [x] 在以下表单组件中确保 Enter 可提交：
  - [x] `feedback/page.tsx` 反馈编辑表单
  - [x] `knowledge-base/page.tsx` 知识库条目编辑表单
  - [x] `classes/[id]/page.tsx` 班级信息编辑表单

## 任务 4.6：面包屑导航
- [x] 创建 `components/ui/breadcrumb.tsx` 面包屑组件
  - [x] 接收 `items: { label: string; href?: string }[]`
  - [x] 最后一项不可点击（当前页）
  - [x] 使用 ChevronRight 图标作为分隔符
  - [x] 支持浅色/深色主题
- [x] 在 `PageContainer` 中集成面包屑
  - [x] 根据 `pathname` 自动映射路径到中文名称
  - [x] 路径映射规则：`/dashboard` → 工作台, `/classes` → 班级管理, `/classes/[id]` → 班级详情...
  - [x] 动态段（如 `[id]`）使用班级名称或其他上下文

## 任务 4.7：全局加载骨架屏
- [x] 创建 `app/(app)/loading.tsx` 骨架屏组件
  - [x] 与 `PageContainer` 布局一致
  - [x] 顶部标题区骨架（短矩形）
  - [x] 中部卡片区域骨架（2-3 个矩形卡片）
  - [x] 底部区域骨架
  - [x] 使用 animate-pulse 动画

## 任务 4.8：数据一致性修复
- [x] 移除 `FloatingChat` 中独立维护的主题状态（如存在），统一从 `next-themes` 读取
- [x] 检查 `FloatingChat` 和 `Sidebar` 主题切换按钮是否都使用 `useTheme()` hook
- [x] 聊天记录超过 100 条截断时（`floating-chat-assistant.tsx`），添加 toast 提示："对话历史已超过 100 条，已自动清理早期记录"

# Task Dependencies
- 任务 4.1、4.2、4.3 独立可并行
- 任务 4.4、4.6 独立可并行
- 任务 4.5 影响多个弹窗组件，需要逐个检查
- 任务 4.7 独立
- 任务 4.8 依赖 FloatingChat 组件分析
- 所有任务完成后进行编译验证
