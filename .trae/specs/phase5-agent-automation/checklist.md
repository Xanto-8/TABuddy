# Phase 5：Agent 自动化 Checklist

## 任务 5.1：复制引导模式（CopyGuide）组件

- [ ] `components/feedback/CopyGuideDialog.tsx` 文件存在
- [ ] 对话框显示当前学生姓名和反馈内容
- [ ] "复制当前"按钮使用 `navigator.clipboard.writeText()`
- [ ] 复制后 toast 提示："已复制 {学生名} 的反馈，共 {n}/{total}"
- [ ] 复制后自动切换到下一位（非最后一位时）
- [ ] 「上一位 / 下一位」导航按钮正常工作
- [ ] 第一条时"上一位" disabled
- [ ] 最后一条时"下一位"显示为"完成"
- [ ] 进度条显示"已复制 X / 总人数 Y"
- [ ] 已复制学生显示 ✓ 标记
- [ ] → 右箭头：切换到下一位
- [ ] ← 左箭头：切换到上一位
- [ ] Ctrl+C：复制当前内容并自动前进
- [ ] Esc 键关闭对话框
- [ ] 全部复制完成后显示"全部完成"状态
- [ ] AnimatePresence 进出动画流畅
- [ ] 无控制台错误

## 任务 5.2：反馈页面集成

- [ ] 批量生成完成后显示"逐条复制"按钮
- [ ] 至少有一条反馈时按钮可用
- [ ] 无反馈时按钮 disabled + tooltip 提示
- [ ] "逐条复制" → 打开 CopyGuideDialog
- [ ] 传入正确的学生列表和反馈内容
- [ ] BatchActionBar 组件正确渲染"逐条复制"和"自动填写配置"
- [ ] 关闭 CopyGuide 后返回反馈页面，状态不丢失

## 任务 5.3：可视化站点配置面板

- [ ] `components/feedback/AutoFillConfigPanel.tsx` 文件存在
- [ ] 包含目标网站 URL 输入框
- [ ] 包含 CSS 选择器输入框（学生搜索、评语输入、提交按钮）
- [ ] 默认 URL 为 `https://il.xdf.cn/plus/calendar`
- [ ] "保存配置"按钮写入 localStorage
- [ ] 刷新页面后配置仍然保留
- [ ] "重置为默认"按钮清空配置
- [ ] Esc 和关闭按钮都能关闭面板
- [ ] 面板打开时自动加载已有配置
- [ ] 包含桌面客户端提示文案
- [ ] 浅色/深色主题显示正常

## 全局验证

- [ ] `tsc --noEmit` 零错误
- [ ] `next build` 构建成功
- [ ] `localhost:3000` 反馈页面正常加载
- [ ] 无控制台错误
- [ ] 浅色/深色切换无异常
- [ ] 响应式布局正常（移动端适配）
