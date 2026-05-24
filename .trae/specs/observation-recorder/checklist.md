# 随堂记录浮窗 Checklist

## 任务 1：数据层
- [x] `ObservationRecord` 接口定义完整
- [x] `getObservationRecords()` 支持班级/学生过滤
- [x] `saveObservationRecord()` 保存并持久化
- [x] `deleteObservationRecord()` 删除并持久化
- [x] localStorage 读写正常

## 任务 2：浮窗 UI
- [x] 📝 悬浮按钮右下角可见
- [x] 点击展开浮窗面板
- [x] 显示当前上课班级名称
- [x] 学生列表可搜索过滤
- [x] 选中学生显示已有记录
- [x] 输入文字 + Enter 保存
- [x] 记录可删除
- [x] 无班级时显示提示
- [x] 浮窗可拖拽移动
- [x] 最小化/展开切换
- [x] 动画流畅

## 任务 3：全局集成
- [x] `app/layout.tsx` 已挂载组件
- [x] `feedback-generator.ts` 注入随堂记录
- [x] `batch-generate` 前端附带记录
- [x] AI 反馈包含个性化上下文

## 全局验证
- [x] `tsc --noEmit` 零错误
- [x] 浮窗不遮挡其他 UI
- [x] 浅色/深色切换显示正常
