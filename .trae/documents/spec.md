# TABuddy 全面优化规范

> 目标用户：新东方少儿英语培训助教  
> 核心目标：减少重复操作、提升效率、统一交互体验、清新视觉风格

---

## Phase 1：代码清理 + 紧急Bug修复（预计 2-3 小时）

> 目标：清理无用代码、修复高危交互bug，不改变任何功能逻辑。

### 任务 1.1：删除无用文件（18个文件）
- [ ] `components/feedback/BookmarkletSetup.tsx`
- [ ] `lib/auto-fill/` 整个目录（3个文件）
- [ ] `components/feedback/AutoFillConfigPanel.tsx`
- [ ] `components/dashboard/quick-actions.tsx`
- [ ] `components/dashboard/recent-tasks.tsx`
- [ ] `components/dashboard/upcoming-deadlines.tsx`
- [ ] `components/dashboard/stats.tsx`
- [ ] `components/dashboard/my-class-dropdown.tsx`
- [ ] `components/dashboard/performance-chart.tsx`
- [ ] `components/layout/app-shell.tsx`
- [ ] `app/(app)/download/page.tsx`
- [ ] `lib/api/dashboard.service.ts`
- [ ] `lib/api/schedule.service.ts`
- [ ] `lib/api/task.service.ts`
- [ ] `lib/api/user.service.ts`
- [ ] `lib/auth-guard.ts`
- [ ] `lib/account-store.ts`

**完成后**：删除 `feedback/page.tsx` 中对 `BookmarkletSetup` 和 `AutoFillConfigPanel` 的 import 和使用代码。

### 任务 1.2：提取重复代码
- [ ] `getLocalDateString()` 从 `homework/page.tsx`、`quizzes/page.tsx`、`feedback/page.tsx` 移到 `lib/utils.ts`
- [ ] `completionLabels`/`completionColors` 从 `homework/page.tsx`、`quizzes/page.tsx` 提取到 `lib/constants.ts`
- [ ] 统一 `resources/page.tsx` 和 `store.ts` 中的 `getTypeIcon/getTypeLabel`，使用 `store.ts` 版本

### 任务 1.3：紧急交互Bug修复
- [ ] **【高危】反馈删除添加二次确认** — `feedback/page.tsx:L173-177`，删除前弹出确认提示
- [ ] **Dashboard 全页刷新改为数据刷新** — `dashboard/page.tsx:L264`，`window.location.reload()` 改为 dispatch `classDataChanged` 事件
- [ ] **统一弹窗风格** — 项目中所有 `window.confirm()` 和 `alert()` 替换为 `toast` 通知：
  - `classes/page.tsx:L72-76` → `toast` + 确认Action
  - `classes/[id]/page.tsx:L302-306` → `toast` + 确认Action
  - `classes/[id]/page.tsx:L458` → `toast.success`
  - `classes/[id]/page.tsx:L1078` → `toast.error`
  - `students/page.tsx:L46-49` → `toast` + 确认Action
  - `knowledge-base/page.tsx:L267-271`、`:L309-321` → `toast` + 确认Action
  - `workflow/page.tsx:L67` → `toast` + 确认Action
  - `classes/[id]/page.tsx:L419-424` → `toast.success`（删除课表后）
  - `classes/[id]/page.tsx:L1198-1203` → `toast.success`（删除记录后）

### 任务 1.4：Toast.loading 清理 + 轮询优化
- [ ] 在所有使用 `toast.loading()` 的地方确保 catch/finally 中有 `toast.dismiss()`
- [ ] `bound-members/page.tsx` 8秒轮询 → 30秒
- [ ] `admin/users/page.tsx` 8秒轮询 → 30秒

---

## Phase 2：Dashboard 核心功能 + 配色升级（预计 3-4 小时）

> 目标：Dashboard 新增今日工作总览和智能重测名单，全局配色切换为清新风格。

### 任务 2.1：📅 今日工作总览卡片
- [ ] 在 Dashboard 新增"今日待办"Card 组件
- [ ] 列出今天有课的所有班级
- [ ] 每个班级显示工作流 9 步完成进度条（如 3/9）
- [ ] 点击步骤可跳转到对应页面并预选班级
- [ ] 利用现有的 `getTodayClasses()` 和 `getCurrentClassByTime()` 获取数据

### 任务 2.2：🚨 智能重测名单
- [ ] 小测页面成绩录入后，正确率 <80% 的学生自动标红
- [ ] 一键生成文案："XX班需重测名单：张三、李四...以上孩子可课后留下重测"
- [ ] 自动添加到 Dashboard 风险学生面板

### 任务 2.3：🎨 配色升级为清新风格
- [ ] 修改 `globals.css` 中 `:root` 的 CSS 变量：
  - 背景：`hsl(35,20%,96%)` → `hsl(200,30%,97%)`（淡蓝白）
  - 主色：`hsl(210,20%,55%)` → `hsl(195,75%,45%)`（天蓝）
  - 辅色：`hsl(10,25%,65%)` → `hsl(170,60%,42%)`（青绿）
  - muted：`hsl(35,15%,92%)` → `hsl(200,20%,94%)`
  - border：`hsl(35,15%,88%)` → `hsl(195,20%,88%)`
- [ ] 修改 `.dark` 的 CSS 变量：
  - 背景：`hsl(220,15%,12%)` → `hsl(215,25%,10%)`
  - 主色：`hsl(210,20%,60%)` → `hsl(195,65%,52%)`
  - 辅色：`hsl(10,20%,60%)` → `hsl(170,50%,48%)`
  - 将 `.dark` 中大面积 `dark:bg-orange-900/xx` 的 CSS 覆盖规则替换为暗色 semantic token
- [ ] Tailwind config 中 `success`/`warning`/`error` 保持不变

---

## Phase 3：批量效率 + AI 辅助（预计 4-5 小时）

> 目标：批量成绩录入、全班快速标记、家长群文案生成。

### 任务 3.1：🔢 批量成绩录入表格
- [ ] 作业/小测页面新增"表格模式"切换按钮
- [ ] 以学生为行、评估维度为列的网格视图
- [ ] 支持键盘导航：Tab 切单元格、Enter 换行
- [ ] 支持方向键移动焦点
- [ ] 批量保存时 toast 显示进度

### 任务 3.2：📋 一键家长群文案生成
- [ ] 反馈页面新增"生成家长群文案"按钮
- [ ] 调用 `/api/feedback/generate-parent-text` API
- [ ] 基于当日课堂内容 + 课程类型 + 作业/小测结果，AI 生成可直接复制的微信文案
- [ ] 支持不同课程类型模板（GY/KET/PET/FCE）
- [ ] 文案包含：今日学习内容、课后作业、重点提醒

### 任务 3.3：⚡ 全班快速标记
- [ ] 作业/小测页面新增"全班完成"、"全班优秀"、"全班已打卡"一键按钮
- [ ] 点击后弹出确认对话框
- [ ] 确认后批量设置所有学生，给出 toast 提示
- [ ] 支持后续单独修改例外学生

---

## Phase 4：交互体验统一（预计 2-3 小时）

> 目标：统一交互模式，修复导航和表单细节问题。

### 任务 4.1：侧边栏路由高亮修复
- [ ] `sidebar.tsx` 中 `pathname === item.href` 改为 `pathname.startsWith(item.href)`
- [ ] 确保 `/classes/123` 时"班级管理"菜单正确高亮

### 任务 4.2：Esc 关闭弹窗 + Enter 提交
- [ ] 所有 Modal 弹窗添加 Esc 键监听
- [ ] 所有表单确保 Enter 键可提交
- [ ] 自定义下拉框添加方向键导航支持

### 任务 4.3：面包屑导航
- [ ] 在 `PageContainer` 或 `Header` 中统一添加面包屑组件
- [ ] 根据当前 `pathname` 自动生成面包屑路径

### 任务 4.4：全局 loading.tsx 骨架屏
- [ ] 在 `app/(app)/loading.tsx` 添加统一骨架屏
- [ ] 骨架屏样式与页面实际布局匹配

### 任务 4.5：数据一致性修复
- [ ] 侧边栏桌面版和移动版合并为一个组件
- [ ] FloatingChat 和 Sidebar 主题切换统一通过 `next-themes` 管理
- [ ] 聊天记录超 100 条截断时 toast 提示

---

## Phase 5：Agent 自动化（预计 5-6 小时）

> 目标：一键自动填写反馈到目标网站。

### 任务 5.1：Electron + Playwright 集成
- [ ] 在 Electron 主进程中集成 Playwright
- [ ] 实现 `preload.ts` 暴露 `autoFill` API 给渲染进程

### 任务 5.2：可视化站点配置助手
- [ ] 创建 `AutoFillConfigAssistant` 组件
- [ ] 实现"拾取模式"：鼠标悬停高亮页面元素，点击自动生成 CSS 选择器
- [ ] "测试定位"按钮验证选择器有效性
- [ ] 配置保存到本地/数据库

### 任务 5.3：自动填写核心逻辑
- [ ] Playwright 脚本：打开网站 → 检测登录状态 → 选择班级 → 逐个填写 → 提交
- [ ] 扫码登录：检测登录态过期→等待用户扫码→保存状态
- [ ] SSE 实时推送进度到前端
- [ ] 异常处理：找不到学生→暂停等待人工介入

### 任务 5.4：反馈页面集成
- [ ] 反馈页面新增"自动填写"按钮
- [ ] 弹出确认面板（预览学生列表、可勾选/取消）
- [ ] 显示实时进度条

### 任务 5.5：降级方案（Web版）
- [ ] 复制引导模式：逐个显示学生名+反馈内容+一键复制按钮

---

## Phase 6：锦上添花（预计 3-4 小时）

> 目标：语音输入、学生档案、搜索增强等锦上添花功能。

### 任务 6.1：🎤 语音转反馈
- [ ] 使用浏览器 `Web Speech API` 实现录音转文字
- [ ] 反馈页面增加录音按钮
- [ ] 转文字后可选 AI 润色

### 任务 6.2：📊 学生个人成长档案
- [ ] 学生详情页增加"成长档案"时间轴视图
- [ ] 聚合：历次作业+小测折线图+出勤记录+反馈记录
- [ ] 支持一键导出为 PDF

### 任务 6.3：全局搜索增强
- [ ] 统一 `Ctrl+K` 快捷键唤起全局搜索
- [ ] 支持搜索学生→跳转到作业/小测/反馈记录
- [ ] 支持搜索班级、知识库文件
- [ ] 显示近期搜索历史

### 任务 6.4：数据导出 CSV
- [ ] 小测/作业成绩支持导出 CSV
- [ ] 反馈支持批量导出为合并 DOCX

---

## Phase 7：架构升级（按需进行）

> 目标：长期架构优化，非紧急。

### 任务 7.1：store.ts 拆分
- [ ] 按数据域拆分为 8 个模块文件
- [ ] 保持现有 API 接口不变

### 任务 7.2：班级选择器组件提取
- [ ] 从 homework/quizzes/feedback/resources 四页面提取通用 `ClassSelector` 组件

### 任务 7.3：React Suspense + 懒加载
- [ ] 大型页面使用 `dynamic()` 懒加载
- [ ] 添加 Suspense 边界
