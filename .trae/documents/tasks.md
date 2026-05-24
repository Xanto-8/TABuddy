# TABuddy 优化任务清单

## Phase 1：代码清理 + 紧急Bug修复

### 1.1 删除无用文件
- [ ] 删除 `components/feedback/BookmarkletSetup.tsx`
- [ ] 删除 `lib/auto-fill/` 整个目录
- [ ] 删除 `components/feedback/AutoFillConfigPanel.tsx`
- [ ] 删除 `components/dashboard/quick-actions.tsx`
- [ ] 删除 `components/dashboard/recent-tasks.tsx`
- [ ] 删除 `components/dashboard/upcoming-deadlines.tsx`
- [ ] 删除 `components/dashboard/stats.tsx`
- [ ] 删除 `components/dashboard/my-class-dropdown.tsx`
- [ ] 删除 `components/dashboard/performance-chart.tsx`
- [ ] 删除 `components/layout/app-shell.tsx`
- [ ] 删除 `app/(app)/download/page.tsx`
- [ ] 删除 `lib/api/dashboard.service.ts`
- [ ] 删除 `lib/api/schedule.service.ts`
- [ ] 删除 `lib/api/task.service.ts`
- [ ] 删除 `lib/api/user.service.ts`
- [ ] 删除 `lib/auth-guard.ts`
- [ ] 删除 `lib/account-store.ts`
- [ ] 清理 `feedback/page.tsx` 中的 BookmarkletSetup/AutoFillConfigPanel 引用

### 1.2 提取重复代码
- [ ] `getLocalDateString()` 移到 `lib/utils.ts`
- [ ] `completionLabels` / `completionColors` 移到 `lib/constants.ts`
- [ ] 统一 `getTypeIcon` / `getTypeLabel`

### 1.3 紧急交互Bug
- [ ] 反馈删除添加二次确认
- [ ] Dashboard 全页刷新改为事件通知
- [ ] 替换所有 `window.confirm()` 和 `alert()`
- [ ] 删除操作添加 toast 反馈

### 1.4 Toast + 轮询
- [ ] toast.loading 添加 dismiss 清理
- [ ] bound-members 轮询 8s→30s
- [ ] admin/users 轮询 8s→30s

---

## Phase 2：Dashboard + 配色

### 2.1 今日工作总览
- [ ] 新增 `TodayTodoCard` 组件
- [ ] 读取今日有课班级
- [ ] 工作流进度条显示
- [ ] 点击跳转对应页面

### 2.2 智能重测名单
- [ ] 小测正确率<80%标红
- [ ] 一键生成重测名单文案
- [ ] 同步到风险学生面板

### 2.3 配色升级
- [ ] `:root` 变量改为天蓝+青绿
- [ ] `.dark` 变量同步更新
- [ ] 清理 `.dark` 中的 CSS 覆盖规则

---

## Phase 3：批量效率 + AI

### 3.1 批量成绩录入
- [ ] 表格模式切换按钮
- [ ] 学生×维度网格视图
- [ ] 键盘导航支持
- [ ] 批量保存进度

### 3.2 家长群文案
- [ ] API 端点 `/api/feedback/generate-parent-text`
- [ ] 反馈页面按钮集成
- [ ] 课程类型模板

### 3.3 全班快速标记
- [ ] 一键按钮组件
- [ ] 确认对话框
- [ ] 批量设置逻辑

---

## Phase 4：交互体验

### 4.1 侧边栏路由
- [ ] `pathname.startsWith` 匹配

### 4.2 键盘交互
- [ ] Esc 关闭弹窗
- [ ] Enter 提交表单
- [ ] 方向键导航下拉框

### 4.3 面包屑
- [ ] 面包屑组件
- [ ] 自动路径生成

### 4.4 骨架屏
- [ ] `app/(app)/loading.tsx`

### 4.5 数据一致性
- [ ] 侧边栏合并为一个组件
- [ ] 主题切换统一
- [ ] 聊天截断提示

---

## Phase 5：Agent 自动化

### 5.1 Electron 集成
- [ ] Playwright 集成
- [ ] preload API 暴露

### 5.2 配置助手
- [ ] AutoFillConfigAssistant 组件
- [ ] 拾取模式
- [ ] 测试定位

### 5.3 核心逻辑
- [ ] 自动填写脚本
- [ ] 扫码登录处理
- [ ] SSE 进度推送

### 5.4 页面集成
- [ ] 自动填写按钮
- [ ] 确认面板
- [ ] 进度条

### 5.5 降级方案
- [ ] 复制引导模式

---

## Phase 6：锦上添花

### 6.1 语音
- [ ] Web Speech API 集成
- [ ] 录音按钮
- [ ] AI 润色

### 6.2 学生档案
- [ ] 时间轴视图
- [ ] 折线图
- [ ] PDF 导出

### 6.3 全局搜索
- [ ] Ctrl+K 快捷键
- [ ] 搜索历史

### 6.4 数据导出
- [ ] CSV 导出
- [ ] 批量 DOCX

---

## Phase 7：架构升级

### 7.1 store 拆分
- [ ] 8 模块拆分

### 7.2 ClassSelector
- [ ] 四页面统一组件

### 7.3 Suspense
- [ ] lazy 加载
- [ ] Suspense 边界
