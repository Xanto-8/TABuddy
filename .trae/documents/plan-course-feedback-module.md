# 作业评估模块实施计划

## 一、背景分析

### 已存在的基础设施

* **类型定义已就绪**: `HomeworkAssessment`、`HomeworkAssessmentForm`、`CompletionStatus`、`HandwritingQuality`（`types/index.ts`）

* **工具函数已就绪**: `generateHomeworkFeedback()` 可根据完成度、字迹、正确率自动生成反馈文本（`utils/index.ts`）

* **侧边栏已就绪**: 已有 `ClipboardCheck` + `'作业评估'` 链接指向 `/homework`（`components/layout/sidebar.tsx`）

* **存储层有基础**: `ClassRecord` 支持 `type='homework'`，但字段不足以承载 `HomeworkAssessment` 的丰富数据

### 需要补充的内容

* 专用存储函数（`HomeworkAssessment` 的 CRUD）

* 页面文件：`app/homework/page.tsx`

* 可能需要的子组件

***

## 二、实现步骤

### Step 1：在 store 中添加作业评估专用存储函数

**目标**：为 `HomeworkAssessment` 类型提供独立的 localStorage 存储，不与通用的 `ClassRecord` 混用。

**具体改动**（`lib/store.ts`）：

1. 新增 `HOMEWORK_ASSESSMENTS_KEY = 'tabuddy_homework_assessments'`
2. 新增函数：

   * `getHomeworkAssessments(): HomeworkAssessment[]` — 获取全部评估记录

   * `getHomeworkAssessmentsByClass(classId: string): HomeworkAssessment[]` — 通过 studentId 关联班级

   * `getHomeworkAssessmentsByStudent(studentId: string): HomeworkAssessment[]` — 获取某学生的所有评估

   * `saveHomeworkAssessment(data: Omit<HomeworkAssessment, 'id' | 'assessedAt'>): HomeworkAssessment` — 创建评估（自动填充 id、assessedAt）

   * `updateHomeworkAssessment(id: string, data: Partial<Omit<HomeworkAssessment, 'id'>>): HomeworkAssessment | null` — 更新评估

   * `deleteHomeworkAssessment(id: string): boolean` — 删除评估
3. `getHomeworkAssessmentsByClass()` 的实现：获取全部 assessments → 根据 classId 找到该班级的所有学生 → 过滤出这些学生的 assessments

### Step 2：创建作业评估页面 `app/homework/page.tsx`

**目标**：实现完整的作业评估页面，遵循现有页面的 UI 风格（Framer Motion 动画、Tailwind 深色模式、表格/卡片布局）。

#### 页面布局

```
┌──────────────────────────────────────────────────────┐
│  Header: "作业评估"                                   │
├──────────────────────────────────────────────────────┤
│  班级选择器 (下拉)  │  日期筛选  │  搜索框             │
├──────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────────────────────┐│
│  │ 学生列表      │  │ 评估区域                         ││
│  │ (左侧面板)    │  │ - 当前选中学生的评估历史           ││
│  │             │  │ - "新增评估" 按钮                 ││
│  │             │  │ - 评估卡片/表格列表                ││
│  └─────────────┘  └──────────────────────────────────┘│
└──────────────────────────────────────────────────────┘
```

#### 核心交互流程

1. **选择班级** → 左侧显示该班级学生列表
2. **选择学生** → 右侧显示该学生的历史评估记录
3. **点击"新增评估"** → 弹出评估模态框
4. **填写评估表单** → 自动生成反馈 → 保存

#### 模态框表单内容

```
┌─────────────────────────────────────┐
│  新增作业评估                        │
├─────────────────────────────────────┤
│  学生: [张三] (只读显示)              │
│  完成度: [下拉: 已完成/部分完成/未完成] │
│  字迹质量: [下拉: 优秀/良好/一般/需改进] │
│  正确率: [滑块 0-100]               │
│  教师反馈: [textarea]                │
│  ─────────────────────────────────  │
│  自动生成反馈:                        │
│  "作业完成，书写清晰，正确率不错。继续努力" │
│  [重新生成] 按钮                     │
│  ─────────────────────────────────  │
│  [取消]  [保存]                      │
└─────────────────────────────────────┘
```

#### 页面功能拆解

1. **数据获取与状态管理**

   * 班级列表 → `getClasses()`

   * 学生列表 → `getStudentsByClass(classId)`

   * 评估记录 → `getHomeworkAssessmentsByStudent(studentId)`

   * 本地状态：`selectedClassId`, `selectedStudentId`, `assessments`, `showModal`

2. **顶部筛选栏**

   * 班级选择器（复用 `tasks/page.tsx` 的 `select` 风格）

   * 日期筛选（可选，用于查看历史评估）

   * 搜索框（按学生姓名筛选）

3. **左侧学生列表**

   * 卡片式列表，显示学生姓名、头像（首字母）、最近评估时间

   * 选中态高亮（`bg-primary/10` + `border-primary`），与 `classes/page.tsx` 风格一致

   * 空状态提示："请先选择一个班级"

4. **右侧评估区域**

   * 未选学生时：居中提示"请选择一名学生"

   * 已选学生时：

     * 顶部统计卡片：总评估次数、平均正确率、最近评估日期

     * 评估记录列表（表格或卡片形式）：

       * 列：评估日期、完成度（带颜色标签）、字迹（带颜色标签）、正确率（进度条）、反馈摘要、操作（编辑/删除）

     * "新增评估" 按钮（浮动或固定位置）

   * 无评估记录时：空状态提示"暂无评估记录" + "新增评估" 按钮

5. **评估模态框（AddAssessmentModal）**

   * 完成度选择器：三个选项按钮或下拉（参考现有下拉模式）

   * 字迹质量选择器：四个选项按钮或下拉

   * 正确率滑块：`input[type="range"]` 或数字输入框（0-100）

   * 教师反馈：`textarea` 行内编辑

   * 自动生成反馈区域：

     * 当完成度/字迹/正确率变化时，自动调用 `generateHomeworkFeedback()` 更新

     * 显示在独立区域，与教师反馈区分

   * 必填校验：completion、handwriting、accuracy 为必填

6. **编辑与删除**

   * 编辑：打开模态框预填数据，保存时调用 `updateHomeworkAssessment()`

   * 删除：确认对话框 → 调用 `deleteHomeworkAssessment()`

7. **数据同步**

   * 每次新增/编辑/删除后，同时调用 `saveRecord()` 在通用记录中创建一条 `type='homework'` 的记录，保持两个系统数据一致（**可选，简化版本可暂不实现**）

### Step 3：样式与交互细节

* 所有表格行 hover 时应用 `hover:bg-muted/50` 背景

* 状态标签使用 Tailwind 颜色类（如 `bg-green-100 text-green-700`）

* 使用 `motion.div` 包裹页面内容，用 `AnimatePresence` 实现模态框动画

* 使用 `toast`（sonner）显示保存/删除成功提示

* 完整支持深色模式（`dark:` 前缀）

* 所有交互操作（保存、删除、切换）都应有即时反馈

### Step 4：验证测试

* 确保 `npm run dev` 能正常编译运行

* 检查 VS Code 诊断，无 TypeScript 错误

* 手动测试完整流程：选择班级 → 选择学生 → 新增评估 → 编辑评估 → 删除评估

***

## 三、文件变更清单

| 操作 | 文件                      | 说明                                     |
| -- | ----------------------- | -------------------------------------- |
| 修改 | `lib/store.ts`          | 新增 HomeworkAssessment 的 CRUD 函数（\~60行） |
| 新增 | `app/homework/page.tsx` | 完整作业评估页面（\~600-800行）                   |

无需新建其他文件，所有代码集中在现有文件结构中。

***

## 四、关键设计决策

1. **独立存储而非复用 ClassRecord**：`HomeworkAssessment` 包含 `completion`、`handwriting`、`accuracy`、`generatedFeedback` 等专有字段，不适合放入通用的 `ClassRecord` 结构。
2. **不拆分组件文件**：参考 `tasks/page.tsx`（\~1096行）和 `classes/[id]/page.tsx`（\~1688行）的模式，将页面和模态框写在同一个文件中，保持代码集中。
3. **通过 studentId 关联班级**：`HomeworkAssessment` 只存 `studentId`，按班级查询时先获取该班所有学生 ID，再过滤评估记录。
4. **使用** **`generateHomeworkFeedback()`**：利用已有的工具函数实现自动反馈生成，减少重复代码。

***

## 五、实施步骤 timeline

1. **Step 1** — 修改 `lib/store.ts` 添加存储函数
2. **Step 2** — 创建 `app/homework/page.tsx`，实现完整的页面
3. **Step 3** — 编译检查，修复类型错误
4. **Step 4** — 启动开发服务器，手动测试

