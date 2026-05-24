# Phase 5：Agent 自动化 Spec

## Why
助教每次生成反馈后需要逐条手动复制粘贴到新东方官网（教师端）的学生评语栏，效率极低。本 Phase 提供"复制引导模式"让助教快速逐条复制，同时为后续 Electron + Playwright 全自动填写做好架构准备。

## What Changes
由于 Electron 应用当前加载的是生产环境 URL（`tabuddy.top`），Playwright 自动化需要安装额外依赖并修改 Electron 主进程，属于中型基础设施变更。本 Phase 优先实现 **Web 端可用** 的功能：

- **新增** 反馈页面"复制引导模式"（CopyGuide）—— 逐个学生展示反馈内容 + 一键复制 + 键盘导航
- **新增** 可视化站点配置面板（选择器采集 UI，为 Playwright 自动化做准备）
- **保留** Electron + Playwright 全自动填写为后续任务（需安装 `playwright` 并重构主进程）

## Impact
- Affected specs: phase3-4-master-spec
- Affected code: `feedback/page.tsx`, `components/feedback/BatchActionBar.tsx`

---

## ADDED Requirements

### Requirement: 复制引导模式（CopyGuide）
系统 SHALL 在反馈页面提供一个"复制引导模式"，逐个学生展示已生成的反馈内容，方便助教快速逐条复制到外部系统。

#### Scenario: 进入复制引导模式
- **GIVEN** 反馈页面已有至少一条已生成的反馈
- **WHEN** 用户点击"逐条复制"按钮
- **THEN** 弹出一个引导面板，显示第一位学生的姓名和反馈内容
- **AND** 面板包含"复制当前"按钮、「上一位/下一位」导航按钮

#### Scenario: 一键复制
- **WHEN** 用户点击"复制当前"按钮
- **THEN** 反馈内容复制到剪贴板
- **AND** toast 提示"已复制张三的反馈，共 1/15"
- **AND** 自动切换到下一位学生

#### Scenario: 键盘导航
- **WHEN** 用户在复制引导模式下
- **THEN** 按 →（右箭头）切换到下一位
- **AND** 按 ←（左箭头）切换到上一位
- **AND** 按 Ctrl+C 自动复制当前内容并前进

#### Scenario: 进度跟踪
- **WHEN** 某位学生的反馈被复制过
- **THEN** 该学生在列表中显示 ✓ 标记
- **AND** 进度条显示"已复制 X/总人数 Y"

#### Scenario: 退出引导模式
- **WHEN** 用户点击"完成"或 Esc 键
- **THEN** 关闭引导面板，返回反馈页面

### Requirement: 可视化站点配置面板
系统 SHALL 提供"自动填写配置"面板，让管理员配置目标网站的 CSS 选择器映射。

#### Scenario: 配置面板
- **GIVEN** 用户在反馈页面
- **WHEN** 点击"填写配置"按钮
- **THEN** 弹出配置面板，包含以下字段：
  - 目标网站 URL（新东方教师端地址）
  - 学生搜索框 CSS 选择器
  - 评论/评语输入框 CSS 选择器
  - 提交按钮 CSS 选择器
- **AND** 配置保存到 localStorage

#### Scenario: 配置加载
- **WHEN** 页面加载时
- **THEN** 自动从 localStorage 读取已有配置
- **AND** 如有配置，复制引导模式可使用更精准的筛选逻辑
