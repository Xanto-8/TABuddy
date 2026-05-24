# Phase 3 Tasks

## 任务 3.1：侧边栏通知铃铛
- [x] 在 `sidebar.tsx` 中集成 `NotificationCenter` 组件
  - [x] import `NotificationCenter` from `@/components/notification/notification-center`
  - [x] 在侧边栏底部区域（主题切换按钮附近）渲染 `<NotificationCenter />`
  - [x] 确保铃铛图标与现有底部按钮风格一致
  - [x] 验证未读 badge 数字正确显示
  - [x] 验证点击弹出通知列表正常展示

## 任务 3.2：数据看板页面
- [x] 创建 `app/(app)/stats/page.tsx` 页面组件
  - [x] 三个标签页：班级概览 / 小测分析 / 学生进步
  - [x] 标签页切换使用本地 state，带动画过渡
  - [x] 顶部班级选择下拉框（`filterClassId` state，默认全部）
  - [x] 班级选择器在管理员模式下自动预选管理的班级
- [x] 实现"班级概览"标签页
  - [x] 各班级整体正确率柱状图（`BarChart`），数据来源 `getAllOverallAccuracyRecords()`
  - [x] 近 30 天正确率趋势折线图（`LineChart`）
  - [x] 顶部统计卡片：班级总数、学生总数、本月记录数、平均正确率
  - [x] 按选择班级过滤数据
- [x] 实现"小测分析"标签页
  - [x] 单词正确率分段饼图（`PieChart`）：四段（<60%, 60-79%, 80-89%, ≥90%）
  - [x] 数据来源 `getQuizRecordsByClass()`
  - [x] 各班级单词/语法平均正确率对比柱状图（`BarChart`）
- [x] 实现"学生进步"标签页
  - [x] 学生搜索/选择下拉框
  - [x] 近 10 次测验正确率折线图
  - [x] 首次 vs 最近成绩变化量标注（+X% 绿色 / -X% 红色）
  - [x] 空状态：提示选择学生
- [x] 在 `sidebar.tsx` 中添加 `/stats` 导航入口（仅管理员）
  - [x] 在 `CLASSADMIN_SPECIFIC_ITEMS` / superadmin 菜单中新增 `{ icon: BarChart3, label: '数据看板', href: '/stats' }`
  - [x] 普通助教的 `MAIN_MENU_ITEMS` 不添加该入口
- [x] 在 `dashboard/page.tsx` 中添加管理员看板引导卡片
  - [x] 当 `useRoleAccess()` 返回 `isClassAdmin` 或 `isSuperAdmin` 时显示
  - [x] 卡片放在 `WelcomeBanner` 下方
  - [x] 显示预览数据：班级数、学生总数、本月平均正确率
  - [x] 点击卡片跳转 `/stats`

## 任务 3.3：批量导入学生 + 导出作业
- [x] 创建 `components/students/batch-import-dialog.tsx` 组件
  - [x] 文件选择器（接受 .xlsx/.csv）
  - [x] 使用 `xlsx` 库解析文件（已安装依赖）
  - [x] 预览表格：显示前 5 行 + 列映射下拉框（姓名列、备注列）
  - [x] 列映射默认自动检测（匹配"姓名"/"名字"/"学生"等列名）
  - [x] 导入按钮 + 进度条
  - [x] 结果摘要弹窗：成功 N 人 / 跳过 N 人 / 失败 N 人
- [x] 创建 `lib/import-students.ts` 导入逻辑
  - [x] `importStudentsFromRows(rows, classId)` 函数
  - [x] 逐行校验：姓名非空、同班级不重复
  - [x] 调用 `addStudent()` 创建
  - [x] 返回 `{ success: number; skipped: number; errors: string[] }`
- [x] 在班级详情页 `classes/[id]/page.tsx` 添加"批量导入学生"按钮
  - [x] 在班级操作栏放置按钮
  - [x] 点击打开 `BatchImportDialog`
- [x] 在作业页 `homework/page.tsx` 添加导出功能
  - [x] 创建 `lib/export-homework.ts`
  - [x] 导出 .xlsx：学生姓名、提交次数、最近得分、完成率
  - [x] 按钮位于班级操作栏

## 任务 3.4：工作流模板差异化 + 快速完成
- [x] 更新 `lib/workflow-store.ts` 的 `DEFAULT_WORKFLOW_TEMPLATES`
  - [x] GY 保持现有 9 步（批改作业 → 重测名单）
  - [x] KET/PET 模板增加 "写作批改"（`writing_correction`）
  - [x] FCE/CAE/CPE 模板增加 "写作批改" + "口语评分"（`speaking_assessment`）
  - [x] OTHER 保持现有默认
- [x] 更新 `types/index.ts` 的 `WorkflowNodeType` 联合类型
  - [x] 新增 `writing_correction` 和 `speaking_assessment`
  - [x] 更新 `WORKFLOW_NODE_LABELS` 添加对应中文标签
  - [x] 更新 `DEFAULT_WORKFLOW_NODES` 添加新节点
- [x] 更新 `TodayTodoCard` 组件支持快速完成/跳过
  - [x] 在展开的步骤列表中每步右侧添加 ✅ 和 ⏭️ 图标按钮
  - [x] 点击 ✅ 调用 `toggleWorkflowTodo()` 标记完成
  - [x] 点击 ⏭️ 仅展开状态移除该步（不写入 store，仅 UI 层面隐藏）
  - [x] 操作后即时更新进度条
  - [x] 完成后触发 `knowledgeBaseChanged` 事件刷新关联组件

## 任务 3.5：AI 对话流式输出 + 上下文记忆
- [x] 更新 `floating-chat-assistant.tsx` 支持流式渲染
  - [x] 请求改为 `fetch` + `ReadableStream` 模式
  - [x] AI 回复逐 token 追加显示（打字机效果）
  - [x] 添加"停止生成"按钮（流式进行中时显示）
- [x] 更新服务端支持流式响应
  - [x] 调用 DeepSeek API `stream: true`
  - [x] SSE 格式输出到前端
  - [x] 保留原有非流式 `chat()` 作为 fallback
- [x] 实现多轮上下文记忆
  - [x] 在 `floating-chat-assistant.tsx` 中维护 `conversationHistory` 数组（最多 20 条）
  - [x] 每次发送消息时附带最近 10 轮对话历史
- [x] 新增 API 路由 `app/api/chat/stream/route.ts`
  - [x] 接收 `{ messages, context }` 请求体
  - [x] 调用 DeepSeek API stream 模式
  - [x] 返回 `text/event-stream` 响应

# Task Dependencies
- 任务 3.1 独立，可并行
- 任务 3.2 独立，可并行
- 任务 3.3 独立，可并行
- 任务 3.4 依赖 workflow-store 和 TodayTodoCard（Phase 2 已完成）
- 任务 3.5 独立，可并行
- 所有任务完成后进行编译验证
