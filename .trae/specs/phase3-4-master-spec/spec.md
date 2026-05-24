# Phase 3（剩余）+ Phase 4 Spec

## Why
Master spec 中的 Phase 3 批量效率任务（表格录入、家长群文案、全班标记）以及 Phase 4 交互体验统一任务尚未实现。本 spec 继续完成这些功能，让助教的工作效率再上一个台阶。

## What Changes
### Phase 3 剩余：批量效率增强
- **新增** 作业/小测页面表格模式（学生 x 维度网格视图，方向键导航）
- **新增** 全班快速标记按钮（全班完成 / 全班优秀 / 全班已打卡）
- **新增** 一键生成家长群文案（AI 生成可复制微信文案）

### Phase 4：交互体验统一
- **修复** 侧边栏路由高亮（`===` → `startsWith`）
- **新增** 所有弹窗 Esc 关闭 + 表单 Enter 提交
- **新增** 面包屑导航组件
- **新增** 全局 loading.tsx 骨架屏
- **修复** 数据一致性（侧边栏统一、主题切换统一、聊天截断提示）

## Impact
- Affected specs: phase2-dashboard-colors, phase3-ux-enhancement
- Affected code: `homework/page.tsx`, `quizzes/page.tsx`, `feedback/page.tsx`, `sidebar.tsx`, `PageContainer`, `FloatingChat`

---

## ADDED Requirements

### Requirement: 批量成绩录入表格模式
系统 SHALL 在作业和小测页面提供"表格模式"视图，以学生为行、评估维度为列的网格视图。

#### Scenario: 切换到表格模式
- **GIVEN** 用户在作业或小测页面选中班级并展开学生列表
- **WHEN** 点击"表格模式"切换按钮
- **THEN** 学生列表切换为网格表格（学生姓名行 × 评估维度列）
- **AND** 单元格内可直接输入/选择成绩

#### Scenario: 键盘导航
- **WHEN** 用户在表格模式下操作
- **THEN** Tab 键切换到下一个单元格
- **AND** Enter 键换到下一行
- **AND** 方向键可上下左右移动焦点

#### Scenario: 批量保存
- **WHEN** 用户修改多个单元格后点击"批量保存"
- **THEN** 系统逐个保存修改，显示进度 toast
- **AND** 完成后显示"已保存 N 条记录"

### Requirement: 全班快速标记
系统 SHALL 在作业/小测页面提供"全班完成"、"全班优秀"、"全班已打卡"一键按钮。

#### Scenario: 全班完成
- **GIVEN** 班级已选中且有学生列表
- **WHEN** 用户点击"全班完成"按钮
- **THEN** 弹出 toast 确认提示"确认将全班 N 名学生标记为已完成？"
- **AND** 确认后批量设置所有学生状态
- **AND** toast 提示"已标记 N 名学生"

#### Scenario: 单独修改例外
- **WHEN** 用户批量标记后
- **THEN** 仍然可以单独修改个别学生的状态

### Requirement: 一键家长群文案生成
系统 SHALL 在反馈页面提供"生成家长群文案"按钮，基于当日课堂内容 + 课程类型 + 作业/小测结果 AI 生成可复制微信文案。

#### Scenario: 生成文案
- **GIVEN** 用户在反馈页面选中班级
- **WHEN** 点击"生成家长群文案"按钮
- **THEN** 调用 `/api/feedback/generate-parent-text` 生成文案
- **AND** 文案包含：今日学习内容、课后作业、重点提醒
- **AND** 不同课程类型（GY/KET/PET/FCE）使用不同模板风格
- **AND** 文案可一键复制到剪贴板

#### Scenario: API 不可用降级
- **WHEN** AI API 不可用
- **THEN** 使用本地模板生成基础文案

### Requirement: 侧边栏路由高亮修复
系统 SHALL 使用 `pathname.startsWith(item.href)` 替代 `pathname === item.href` 判断菜单高亮。

#### Scenario: 子路由高亮
- **GIVEN** 用户访问 `/classes/123`（班级详情页）
- **WHEN** 侧边栏渲染
- **THEN** "班级管理"菜单项正确高亮

### Requirement: 弹窗 Esc 关闭 + 表单 Enter 提交
系统 SHALL 为所有 Modal 弹窗添加 Esc 键关闭监听，所有表单支持 Enter 键提交。

### Requirement: 面包屑导航
系统 SHALL 在 `PageContainer` 中统一渲染面包屑导航组件，根据当前 pathname 自动生成路径。

#### Scenario: 多级路径
- **GIVEN** 用户访问 `/classes/123`
- **WHEN** 页面渲染
- **THEN** 面包屑显示：首页 > 班级管理 > 班级名称

### Requirement: 全局加载骨架屏
系统 SHALL 提供 `app/(app)/loading.tsx` 统一骨架屏，样式与页面实际布局匹配。

### Requirement: 数据一致性修复
系统 SHALL 统一 FloatingChat 和 Sidebar 主题切换通过 `next-themes` 管理，聊天记录超过 100 条截断时 toast 提示。
