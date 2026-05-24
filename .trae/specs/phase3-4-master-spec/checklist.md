# Phase 3（剩余）+ Phase 4 Checklist

## 任务 4.1：批量成绩录入表格模式
- [x] 作业页面有表格/列表模式切换按钮
- [x] 小测页面有表格/列表模式切换按钮
- [x] 表格以学生为行、维度为列
- [x] Tab/Enter/方向键导航正常
- [x] 批量保存进度 toast 显示
- [x] 批量保存后数据正确持久化

## 任务 4.2：全班快速标记
- [x] 作业页面有"全班完成"按钮
- [x] 点击后有 toast 确认提示
- [x] 确认后所有学生状态更新
- [x] 单独修改例外学生正常
- [x] 小测页面有"全班已打卡"按钮
- [x] 小测页面有"全班优秀"按钮（正确率≥80%）

## 任务 4.3：一键家长群文案生成
- [x] 反馈页面有"生成家长群文案"按钮
- [x] 选中班级后按钮可用
- [x] 生成结果包含今日学习内容 + 课后作业 + 重点提醒
- [x] 不同课程类型文案风格不同
- [x] "一键复制"按钮工作正常
- [x] API 不可用时有本地模板降级

## 任务 4.4：侧边栏路由高亮修复
- [x] `/classes/123` 时"班级管理"高亮
- [x] `/dashboard` 时"工作台"高亮
- [x] 其他子路由高亮正确

## 任务 4.5：弹窗 Esc + 表单 Enter
- [x] BatchImportDialog 支持 Esc 关闭
- [x] KnowledgeImportDialog 支持 Esc 关闭
- [x] BindInviteCodeModal 支持 Esc 关闭
- [x] 知识库编辑表单支持 Enter 提交

## 任务 4.6：面包屑导航
- [x] PageContainer 顶部渲染面包屑
- [x] pathname 到中文名称映射正确
- [x] 动态段显示实际名称（如班级名）
- [x] 浅色/深色主题显示正常

## 任务 4.7：全局加载骨架屏
- [x] `app/(app)/loading.tsx` 文件存在
- [x] 骨架屏使用 animate-pulse
- [x] 布局与 PageContainer 一致

## 任务 4.8：数据一致性修复
- [x] FloatingChat 主题切换使用 `useTheme()`
- [x] Sidebar 主题切换使用 `useTheme()`
- [x] 聊天记录超 100 条截断时有 toast 提示

## 全局验证
- [x] `tsc --noEmit` 零错误
- [x] `localhost:3000` 各页面正常加载
- [x] 无控制台错误
- [x] 浅色/深色切换无异常
