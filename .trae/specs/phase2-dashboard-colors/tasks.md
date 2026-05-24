# Phase 2 Tasks

## 任务 2.1：今日工作总览卡片
- [x] 创建 `components/dashboard/today-todo-card.tsx` 组件
  - [x] 声明 `TodayTodoCard` 组件，接收 `classes`, `teachingClassId`, `todayClasses` prop
  - [x] 使用 `getTodayClasses()` 获取今天有课的班级，按最早开始时间排序
  - [x] 每个班级展示：班级名 + 课程类型标签 + 工作流完成数 x/9 进度条 + 上课时间段
  - [x] 正在上课的班级添加主色左边框 + `bg-primary/5` 背景
  - [x] 点击进度条展开显示 9 个工作流步骤列表（每步显示名称+勾/圈状态）
  - [x] 点击未完成步骤跳转到对应页面并预选班级
  - [x] 空状态：今天无课时显示友好提示
  - [x] 步骤→页面映射：
    - 1.批改作业 → `/homework`
    - 2.作业反馈 → `/homework`
    - 3.小测批改 → `/quizzes`
    - 4.记录学情 → `/quizzes`
    - 5.撰写反馈 → `/feedback`
    - 6.家长群发内容 → `/feedback`
    - 7.家长群发作业 → `/feedback`
    - 8.同步小测 → `/quizzes`
    - 9.重测名单 → `/quizzes`
- [x] 在 `dashboard/page.tsx` 中集成 `TodayTodoCard`
  - [x] import 组件
  - [x] 放置在 `ClassTodoCenter` 下方或绑定区域下方
  - [x] 传入 `classes`, `teachingClassId` 数据

## 任务 2.2：小测页面智能重测标红
- [x] 在 `quizzes/page.tsx` 中添加重测标红逻辑
  - [x] 查找当前班级学生的单词正确率显示代码
  - [x] 添加 `wordAccuracy < 80` 条件判断，低于阈值时添加红色样式 class
  - [x] 使用 `accuracyColor()` 或新增 class：`text-red-600 dark:text-red-400 font-semibold`
- [x] 添加"复制重测名单"按钮
  - [x] 在班级操作栏添加按钮，仅当有学生正确率 < 80% 时显示
  - [x] 点击按钮复制标准格式文案到剪贴板
  - [x] 文案格式：`{班级名}需重测名单：\n{学生1} 单词正确率{X}%\n...\n以上孩子可课后留下重测`
  - [x] toast 提示 `重测名单已复制，共 N 人`
- [x] 全班通过时显示绿色提示
  - [x] 当无人需要重测时显示 `全班通过，无人需要重测 ✓`

## 任务 2.3：全局配色升级
- [x] 修改 `globals.css` 中 `:root` 的 CSS 变量
  - [x] `--background` → `200 30% 97%`
  - [x] `--foreground` → `215 25% 25%`
  - [x] `--primary` → `195 75% 45%`
  - [x] `--primary-foreground` → `0 0% 100%`
  - [x] `--secondary` → `170 60% 42%`
  - [x] `--secondary-foreground` → `0 0% 100%`
  - [x] `--muted` → `200 20% 94%`
  - [x] `--muted-foreground` → `215 15% 50%`
  - [x] `--accent` → `200 25% 93%`
  - [x] `--border` → `195 20% 88%`
  - [x] `--input` → `195 20% 88%`
  - [x] `--ring` → `195 75% 45%`
- [x] 修改 `globals.css` 中 `.dark` 的 CSS 变量
  - [x] `--background` → `215 25% 10%`
  - [x] `--foreground` → `195 20% 92%`
  - [x] `--card` → `215 25% 14%`
  - [x] `--card-foreground` → `195 20% 92%`
  - [x] `--primary` → `195 65% 52%`
  - [x] `--primary-foreground` → `0 0% 100%`
  - [x] `--secondary` → `170 50% 48%`
  - [x] `--secondary-foreground` → `0 0% 100%`
  - [x] `--muted` → `215 20% 18%`
  - [x] `--muted-foreground` → `195 15% 60%`
  - [x] `--accent` → `215 20% 20%`
  - [x] `--destructive` → `0 50% 50%`
  - [x] `--border` → `215 20% 22%`
  - [x] `--input` → `215 20% 22%`
  - [x] `--ring` → `195 65% 52%`
- [x] 精简 `.dark` CSS 覆盖规则
  - [x] 保留必要的 L80-L129 区域规则但缩小覆盖范围
  - [x] 移除对 `text-xxx-600/700/800` 的大面积覆盖（L132-L169）
- [x] 更新 `tailwind.config.ts` 的固定色阶
  - [x] primary 色阶改为 cyan 色系
  - [x] secondary 色阶改为 teal 色系
- [x] 验证配色
  - [x] 检查 Sidebar 主题切换
  - [x] 检查 Dashboard 各卡片
  - [x] 检查 feedback/homework/quizzes 页面
  - [x] 检查深色模式下 waterwark 水印效果
  - [x] 检查 0.28s 过渡动画是否正常

# Task Dependencies
- 任务 2.1 和 2.2 独立，可并行
- 任务 2.3 独立，可并行
- 所有任务完成后进行验证
