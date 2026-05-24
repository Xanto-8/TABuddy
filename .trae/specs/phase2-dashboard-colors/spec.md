# Phase 2: Dashboard 核心功能 + 清新配色 Spec

## Why
助教每天管理多个班级，需要一眼看到今天有哪些课、每节课的工作流完成进度。同时小测页面需要快速识别需要重测的学生。整体视觉风格也需要从"稳重暖色"升级为"清新天蓝青绿"风格。

## What Changes
- **新增** 今日工作总览卡片（Dashboard 新组件）
- **增强** 小测页面智能重测标红 + 一键复制文案
- **修改** 全局 CSS 变量为清新配色（天蓝主色 + 青绿辅色）
- **清理** .dark 中大量 CSS 覆盖规则，改用 semantic token

## Impact
- Affected specs: 无（全新功能）
- Affected code: `globals.css`, `dashboard/page.tsx`, `quizzes/page.tsx`, `components/dashboard/`, `tailwind.config.ts`

---

## ADDED Requirements

### Requirement: 今日工作总览卡片
系统 SHALL 在 Dashboard 页面新增"今日待办"卡片组件，展示今天有课的所有班级及其工作流完成进度。

#### Scenario: 今天有课的正常展示
- **GIVEN** 今天有 3 个班级有课（按最早上课时间排序）
- **WHEN** 助教打开 Dashboard
- **THEN** 显示"今日待办"卡片，列出 3 个班级，每个显示：班级名 + 课程类型标签 + 工作流进度条（如 3/9 完成）+ 今日上课时间
- **AND** 正在上课的班级用主色高亮边框标记

#### Scenario: 点击工作流步骤跳转
- **WHEN** 助教点击某个班级的工作流进度条
- **THEN** 展开显示该班级的 9 个工作流步骤列表
- **AND** 已完成步骤显示绿色勾，未完成显示灰色圈
- **AND** 点击某个步骤跳转到对应操作页面并自动预选该班级

#### Scenario: 今天无课
- **WHEN** 今天没有任何班级有课
- **THEN** 卡片显示"今天没有课程安排"的友好空状态
- **AND** 提示"去排课页面添加上课时间"

### Requirement: 小测页面智能重测标红
系统 SHALL 在小测成绩录入页面中，当学生单词正确率低于 80% 时自动标红显示分数，并提供一键复制重测名单的功能。

#### Scenario: 正确率低于阈值自动标红
- **GIVEN** 某个学生的单词正确率计算结果为 75%
- **WHEN** 成绩渲染在页面上
- **THEN** 该学生的单词正确率以红色粗体显示（`text-red-600 dark:text-red-400 font-semibold`）
- **AND** 该行的正确率 ≥ 80% 的其他学生不受影响

#### Scenario: 一键生成重测文案
- **GIVEN** 当前班级有 3 个学生单词正确率低于 80%
- **WHEN** 助教点击"复制重测名单"按钮
- **THEN** 系统复制文案到剪贴板：
  ```
  XX班需重测名单：
  张三 单词正确率 75%
  李四 单词正确率 60%
  王五 单词正确率 45%
  以上孩子可课后留下重测
  ```
- **AND** toast 提示"重测名单已复制，共 N 人"

#### Scenario: 无需要重测的学生
- **WHEN** 当前班级所有学生单词正确率均 ≥ 80%
- **THEN** "复制重测名单"按钮不可见
- **AND** 显示绿色提示"全班通过，无人需要重测 ✓"

## MODIFIED Requirements

### Requirement: 全局配色系统
系统 SHALL 使用清新的天蓝+青绿配色替代当前的蓝灰+暖橙配色。

#### 浅色模式新配色（:root）
| Token | 旧值 | 新值 | 说明 |
|-------|------|------|------|
| `--background` | `35 20% 96%` | `200 30% 97%` | 暖白→淡蓝白 |
| `--foreground` | `220 15% 25%` | `215 25% 25%` | 保持深色文字 |
| `--primary` | `210 20% 55%` | `195 75% 45%` | 灰蓝→天蓝 |
| `--secondary` | `10 25% 65%` | `170 60% 42%` | 暖橙→青绿 |
| `--muted` | `35 15% 92%` | `200 20% 94%` | 暖灰→淡蓝灰 |
| `--accent` | `35 15% 94%` | `200 25% 93%` | 暖白→淡蓝白 |
| `--border` | `35 15% 88%` | `195 20% 88%` | 暖灰→蓝灰 |
| `--input` | `35 15% 88%` | `195 20% 88%` | 同上 |
| `--ring` | `210 20% 55%` | `195 75% 45%` | 与主色一致 |
| `--destructive` | 不变 | 不变 | 红色保留 |

#### 深色模式新配色（.dark）
| Token | 旧值 | 新值 |
|-------|------|------|
| `--background` | `220 15% 12%` | `215 25% 10%` |
| `--foreground` | `35 20% 92%` | `195 20% 92%` |
| `--card` | `220 15% 16%` | `215 25% 14%` |
| `--primary` | `210 20% 60%` | `195 65% 52%` |
| `--secondary` | `10 20% 60%` | `170 50% 48%` |
| `--muted` | `220 12% 20%` | `215 20% 18%` |
| `--accent` | `220 12% 22%` | `215 20% 20%` |
| `--border` | `220 12% 24%` | `215 20% 22%` |

#### Scenario: 主题无感知切换
- **WHEN** 用户从浅色切换到深色模式（或反之）
- **THEN** 所有使用 semantic token（`bg-primary`, `text-foreground`, `bg-muted` 等）的元素自动适配新配色
- **AND** 0.28s 过渡动画保持流畅

#### Scenario: 自定义颜色兼容
- **WHEN** 页面使用了原始 Tailwind 颜色类（如 `bg-stone-100`）
- **THEN** 这些颜色在 .dark 规则下仍然正确转换为深色
- **AND** 后续逐步迁移到 semantic token

### Requirement: Tailwind Config 同步
`tailwind.config.ts` 中的自定义颜色（primary.50~900, secondary.50~900 固定 hex 值）SHALL 更新为新配色色阶：

- primary 色阶：天蓝色系 `#ecfeff ~ #155e75`（cyan 色阶）
- secondary 色阶：青绿色系 `#f0fdf9 ~ #134e4a`（teal 色阶）

---

## REMOVED Requirements

### Requirement: 深色模式 CSS 覆盖规则精简
**Reason**: 当前 `.dark` 下有 200+ 行针对 `bg-xxx-100`, `text-xxx-600` 等非 semantic token 的 CSS 覆盖规则，维护成本高。
**Migration**: 保留必要的覆盖规则以确保现有页面不受影响，但移除"对所有颜色一揽子覆盖"的大面积 CSS 类覆写，将 `dark:bg-orange-900/xx` 这类硬编码替换为 `dark:bg-primary/15` 等 semantic token 的透明变体。
