# Phase 5：Agent 自动化 Tasks

## 任务 5.1：复制引导模式（CopyGuide）组件

- [ ] 创建 `components/feedback/CopyGuideDialog.tsx` 复制引导对话框
  - [ ] 接收 `feedbacks: { studentId, studentName, content }[]` 和 `onClose` props
  - [ ] 维护 `currentIndex` 状态追踪当前学生
  - [ ] 显示当前学生姓名 + 反馈内容
  - [ ] 大号"复制当前"按钮（`Copy` 图标）
  - [ ] 「上一位 / 下一位」导航按钮
  - [ ] 进度条显示"已复制 X / 总人数 Y"
  - [ ] 已复制的学生在列表中显示 ✓ 标记
  - [ ] 全部复制完成后显示"全部完成"提示
  - [ ] 使用 `useEscapeKey` hook 支持 Esc 关闭
  - [ ] 使用 `framer-motion` AnimatePresence 做进出动画

- [ ] 键盘导航支持
  - [ ] →（右箭头）切换到下一位
  - [ ] ←（左箭头）切换到上一位
  - [ ] Ctrl+C 自动复制当前内容并前进
  - [ ] 使用 `useEffect` 注册 `keydown` 监听器

- [ ] 复制逻辑
  - [ ] `handleCopy()` 使用 `navigator.clipboard.writeText()` 复制当前学生反馈
  - [ ] 复制成功后 toast 提示 "已复制 {学生名} 的反馈，共 {currentIndex+1}/{total}"
  - [ ] 复制后自动切换到下一位（如非最后一位）
  - [ ] 记录已复制列表用于进度追踪

## 任务 5.2：反馈页面集成 CopyGuide

- [ ] 在 `feedback/page.tsx` 中集成 CopyGuide
  - [ ] 批量生成完成后显示"逐条复制"按钮
  - [ ] 点击"逐条复制" → 打开 `CopyGuideDialog`
  - [ ] 也可以从已有历史反馈中选择进入 CopyGuide 模式
  - [ ] 传入当前班级所有学生及对应反馈内容
  - [ ] 使用 `BatchActionBar` 组件（目前已 import 但未渲染）放置按钮

- [ ] 按钮交互
  - [ ] 至少有一条已生成反馈时按钮可用
  - [ ] 无反馈时按钮 disabled + tooltip 提示"请先生成反馈"

## 任务 5.3：可视化站点配置面板

- [ ] 创建 `components/feedback/AutoFillConfigPanel.tsx`
  - [ ] 目标网站 URL 输入框（默认值：`https://il.xdf.cn/plus/calendar`）
  - [ ] 学生搜索框 CSS 选择器 输入框
  - [ ] 评论/评语输入框 CSS 选择器 输入框
  - [ ] 提交按钮 CSS 选择器 输入框
  - [ ] "保存配置"按钮 → 写入 localStorage key `autofill_config`
  - [ ] "重置为默认"按钮
  - [ ] 关闭按钮 + Esc 支持
  - [ ] 使用 `framer-motion` 做弹出动画

- [ ] 配置加载
  - [ ] 组件挂载时从 localStorage 读取已有配置
  - [ ] 如有配置则预填各字段

- [ ] 在反馈页面集成
  - [ ] `BatchActionBar` 中"自动填写配置"按钮打开 `AutoFillConfigPanel`
  - [ ] 配置面板以 Dialog/Modal 形式弹出

## 任务 5.4：预留 Playwright 自动化架构

- [ ] 在 `AutoFillConfigPanel` 中添加提示
  - [ ] 文案："自动填写功能需要桌面客户端支持，当前可用'逐条复制模式'手动完成"
  - [ ] 配置说明保留以备后续 Electron 集成

## 任务 5.5：全局验证

- [ ] `tsc --noEmit` 零类型错误
- [ ] `next build` 构建成功
- [ ] `localhost:3000` 反馈页面正常加载
- [ ] CopyGuide 模式完整流程可用（打开 → 复制 → 导航 → 完成）
- [ ] 配置面板保存/加载正常
- [ ] Ctrl+C 复制 + 自动前进正常
- [ ] 箭头键导航正常
- [ ] Esc 关闭正常
- [ ] 浅色/深色主题显示正常
- [ ] 移动端响应式布局正常
