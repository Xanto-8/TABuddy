# 随堂记录浮窗 Spec

## Why
助教在上课过程中需要随时记录孩子的课堂表现（如"发言积极"、"注意力不集中"、"作文写得很好"等），这些记录需要在生成反馈时自动带入 AI 上下文，让反馈更个性化、更有针对性。

## What Changes
- **新增** 一个浮窗形式的随堂记录组件，始终可访问
- **新增** 记录按「当前上课班级」的学生列表组织，快速选择学生并输入
- **新增** 记录存储到 localStorage，与班级/学生/日期关联
- **增强** 反馈生成时自动将随堂记录注入 AI prompt 上下文

## Impact
- Affected specs: phase3-4-master-spec
- Affected code: `FloatingChat`, `feedback/page.tsx`, `lib/store.ts`, `lib/feedback-generator.ts`

---

## ADDED Requirements

### Requirement: 随堂记录浮窗
系统 SHALL 在页面右下角（FloatingChat 旁边）提供一个可拖拽的随堂记录浮窗。

#### Scenario: 打开记录浮窗
- **GIVEN** 用户在任何页面
- **WHEN** 点击右下角的 📝 悬浮按钮
- **THEN** 弹出一个浮窗面板，标题显示当前上课班级名称
- **AND** 面板包含学生快速选择区和文本输入区

#### Scenario: 没有上课班级时
- **GIVEN** 当前没有上课班级（通过 `getCurrentClassByTime()` 判断）
- **WHEN** 用户打开记录浮窗
- **THEN** 显示"当前没有上课班级"提示，仍可手动选择班级

#### Scenario: 快速记录
- **GIVEN** 浮窗已打开
- **WHEN** 用户点击一个学生名字 → 在输入框输入文字 → 按 Enter 或点击保存
- **THEN** 记录保存到 localStorage，显示在该学生的记录列表下方
- **AND** 每条记录包含：学生ID、内容、时间戳、班级ID、课程类型

#### Scenario: 查看已有记录
- **WHEN** 用户点击学生名字
- **THEN** 下方显示该学生今日的已有记录列表
- **AND** 可点击删除某条记录

#### Scenario: 浮窗拖拽与缩放
- **WHEN** 用户拖拽浮窗标题栏
- **THEN** 浮窗可自由移动到屏幕任意位置
- **AND** 浮窗可最小化为 📝 图标

### Requirement: 随堂记录存储
系统 SHALL 在 `lib/store.ts` 中新增 `getObservationRecords` 和 `saveObservationRecord` 函数，数据存储在 `localStorage` 中。

### Requirement: 反馈自动关联随堂记录
系统 SHALL 在生成反馈时，自动查找该学生的今日随堂记录，注入到 AI 生成 context 中。

#### Scenario: AI 反馈包含随堂记录上下文
- **GIVEN** 学生对"张三"有一条随堂记录"课堂发言积极"
- **WHEN** 为张三生成反馈时
- **THEN** AI prompt 中的 student context 包含"今日课堂表现：课堂发言积极"
- **AND** AI 生成的反馈可能包含"上课发言积极，继续保持"等个性化内容
