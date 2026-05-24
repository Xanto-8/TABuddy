# Phase 3: 用户体验增强 Spec

## Why
Phase 2 完成了 Dashboard 核心功能和全局配色升级，Phase 3 在此基础上全面提升助教的日常工作效率：让通知触手可及、看板一目了然、批量操作省时省力、AI 对话更智能。

## What Changes
- **新增** 侧边栏通知铃铛（已有后端基础，仅需渲染到侧边栏）
- **新增** 数据看板页面（班级趋势 / 学生进步 / 小测分布）
- **新增** 批量导入学生（Excel/CSV）+ 批量导出作业成绩
- **增强** 工作流模板按课程类型区分 + Dashboard 快速完成
- **增强** AI 对话上下文记忆 + 流式响应

## Impact
- Affected specs: phase2-dashboard-colors
- Affected code: `sidebar.tsx`, `notification-center.tsx`, `dashboard/page.tsx`, `workflow-store.ts`, `floating-chat-assistant.tsx`, `deepseek-chat.service.ts`

---

## ADDED Requirements

### Requirement: 侧边栏通知铃铛
系统 SHALL 在侧边栏底部渲染已有的 `NotificationCenter` 组件，让助教随时看到通知红点和查看通知列表。

#### Scenario: 通知铃铛显示在侧边栏
- **GIVEN** 用户登录后进入任意页面
- **WHEN** 侧边栏渲染
- **THEN** 侧边栏底部显示铃铛图标 + 未读通知数 badge
- **AND** 点击弹出通知列表 dropdown

#### Scenario: 新通知实时更新
- **WHEN** 服务端推送新通知（如上课提醒、工作流超时提醒）
- **THEN** 铃铛 badge 数字 +1，无需刷新页面

### Requirement: 数据看板页面
系统 SHALL 提供 `/stats` 数据看板页面，使用 recharts 展示多维度数据分析图表。该页面面向**班级管理员**和**超级管理员**重点展示，在管理员 Dashboard 中存在醒目的引导入口；助教角色可通过直接 URL 访问但不作为侧边栏主导航突出显示。

#### Scenario: 管理员 Dashboard 醒目的看板入口
- **GIVEN** 用户角色为 classadmin 或 superadmin
- **WHEN** 打开 Dashboard 页面
- **THEN** 在 `WelcomeBanner` 下方或统计卡片区域显示醒目的"数据看板"引导卡片
- **AND** 卡片包含关键指标预览（班级数、学生数、本月正确率均值）
- **AND** 点击卡片跳转到 `/stats`

#### Scenario: 班级维度数据看板
- **GIVEN** 用户打开 `/stats` 页面
- **WHEN** 页面加载完成
- **THEN** 显示"班级学习概览"标签页，包含：
  - 各班级整体正确率柱状图（BarChart）
  - 近 30 天正确率趋势折线图（LineChart）
  - 各班级学生人数/记录数汇总卡片

#### Scenario: 小测成绩分布
- **GIVEN** 用户切换到"小测分析"标签页
- **WHEN** 数据加载完成
- **THEN** 显示：
  - 单词正确率分段饼图（<60%, 60-79%, 80-89%, ≥90%）
  - 各班级单词/语法平均正确率对比柱状图

#### Scenario: 学生进步追踪
- **GIVEN** 用户切换到"学生进步"标签页
- **WHEN** 选择一个学生
- **THEN** 显示该学生近 10 次测验正确率趋势折线图
- **AND** 标注首次成绩和最近成绩的变化量（+X% 进步 / -X% 退步）

#### Scenario: 班级选择器
- **WHEN** 用户通过顶部下拉框选择班级
- **THEN** 所有图表仅展示该班级数据
- **AND** 默认选择"所有班级"

### Requirement: 批量导入学生
系统 SHALL 提供 Excel/CSV 批量导入学生功能，支持在班级详情页一键导入。

#### Scenario: 上传导入文件
- **GIVEN** 用户在班级详情页或学生管理页
- **WHEN** 点击"批量导入学生"按钮并选择 .xlsx/.csv 文件
- **THEN** 弹出预览对话框，显示表格前 5 行预览
- **AND** 支持选择姓名列、备注列的映射关系

#### Scenario: 导入确认
- **WHEN** 用户确认导入
- **THEN** 系统逐行创建学生，显示进度条（已导入 N/M）
- **AND** 导入完成后显示结果摘要：成功 X 人，跳过 Y 人（重复），失败 Z 人
- **AND** 失败行注明原因（姓名空、已存在等）

#### Scenario: 导出作业成绩
- **GIVEN** 班级有作业记录
- **WHEN** 用户点击"导出成绩"按钮
- **THEN** 下载 .xlsx 文件，包含：学生姓名、提交次数、最近得分、完成率

### Requirement: 工作流模板差异化
系统 SHALL 为不同课程类型提供不同的默认工作流模板节点。

#### Scenario: 课程类型模板区分
- **GIVEN** 系统预设 7 种课程类型（GY, KET, PET, FCE, CAE, CPE, OTHER）
- **WHEN** 创建新班级时选择课程类型
- **THEN** 自动应用对应的工作流模板
- **AND** GY/低级别课程：9 步完整流程
- **AND** KET/PET：增加"写作批改"步骤
- **AND** FCE/CAE/CPE：增加"口语评分"和"写作批改"步骤

#### Scenario: Dashboard 快速完成步骤
- **GIVEN** Dashboard 展示今日工作流进度
- **WHEN** 用户点击进度条展开步骤列表
- **THEN** 每步显示快捷操作按钮：✅ 完成 / ⏭️ 跳过
- **AND** 点击完成/跳过后立即更新进度条，无需跳转页面

### Requirement: AI 对话增强
系统 SHALL 为 AI 助教对话添加流式响应和多轮上下文记忆能力。

#### Scenario: 流式输出
- **GIVEN** 用户在 AI 对话中发送问题
- **WHEN** AI 开始生成回复
- **THEN** 回复内容逐字/逐段流式显示（打字机效果）
- **AND** 用户可以随时中断生成

#### Scenario: 上下文记忆
- **GIVEN** 用户在同一对话会话中连续提问
- **WHEN** 用户说"那 B 班呢？"
- **THEN** AI 能理解上下文（上文提到了 A 班），正确回答 B 班的数据
- **AND** 上下文记忆保留最近 10 轮对话

---

## MODIFIED Requirements

### Requirement: 侧边栏导航
在侧边栏的 classadmin/superadmin 专属菜单中新增"数据看板"入口（`/stats`），图标 `BarChart3`。普通助教的侧边栏不显示该入口，但可通过 URL 直接访问。

### Requirement: 管理员 Dashboard 看板引导卡片
在 `dashboard/page.tsx` 中，当用户角色为 classadmin 或 superadmin 时，在 `WelcomeBanner` 下方展示"数据看板"引导卡片，预览关键指标，点击跳转到 `/stats`。

### Requirement: Dashboard 今日工作总览卡片
`TodayTodoCard` 中每个展开的工作流步骤增加"快速完成"和"跳过"按钮，允许不跳转页面直接标记完成。

---

## REMOVED Requirements

无。
