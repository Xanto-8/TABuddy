# TABuddy 全面优化计划

## 一、响应速度优化

### 1.1 Next.js 路由级 Loading 与 Suspense

**当前问题**: 项目中完全没有 `loading.tsx`、`Suspense` 边界，页面切换和首次加载时用户看到空白。
**建议**:

* 为 `app/(app)/` 根目录添加 `loading.tsx`（骨架屏），所有子路由自动继承

* 为数据密集型页面（dashboard, homework, quizzes, feedback, knowledge-base）添加 Suspense 包裹

* 对大型页面使用 Next.js `dynamic(() => import(...), { loading: ... })` 懒加载

### 1.2 API 数据加载优化

**当前问题**: `bulk API` 一次性加载 16 个表的全部数据，虽然用了 `Promise.all` 并行，但全量加载在数据量大时仍然很重。
**建议**:

* 按页面需要拆分数据加载，不同页面只加载该页面所需数据

* 引入 TanStack Query (React Query) 管理数据缓存和请求去重，替代手写的 `store.ts` 缓存

* 为列表类 API 添加 `take`/`skip` 分页参数，防御大数据量

### 1.3 减少高频轮询

**当前问题**: `bound-members` 页面 8 秒一次轮询，`admin/users` 8 秒一次轮询，`class-todo-center` 30 秒一次。
**建议**:

* 8 秒轮询改为 EventSource/SSE 或至少 30 秒间隔

* 使用 `visibilitychange` API，页面不可见时暂停轮询

### 1.4 Prisma 查询优化

**当前问题**: 多个查询未添加 `take` 分页，`HomeworkAssessment` 和 `QuizRecord` 用 `studentName` 而非 `studentId` 关联。
**建议**:

* 添加合理的 `take` 上限（如 `take: 500`）

* 为 `HomeworkAssessment` 和 `QuizRecord` 添加 `studentId` 字段建立关系，支持 JOIN 查询

### 1.5 Toast.loading 清理机制

**当前问题**: `toast.loading` 在某些失败场景下缺少 dismiss，可能导致永久加载状态。
**建议**: 在 catch/finally 块中统一 dismiss loading toast

***

## 二、功能实用化：删除无用，添加实用缺失

> **目标用户画像**：核心用户是**新东方少儿英语培训助教**，每天管理 2-10 个班级，完成：批改作业→作业反馈→小测批改→记录学情→撰写家长反馈→家长群发内容→同步小测→发布重测名单 的全流程。用户需要的是**省时、高效、减少重复操作**。

### 2.1 建议删除的无用组件/页面

| 文件/组件                                         | 原因                                             |
| --------------------------------------------- | ---------------------------------------------- |
| `components/feedback/BookmarkletSetup.tsx`     | 向第三方网站自动填写反馈的书签脚本，用户反馈不实用，确认删除       |
| `lib/auto-fill/` 整个目录                        | 含 `bookmarklet-source.js`、`bookmarklet-minified.js`、`data-utils.ts`，与 BookmarkletSetup 配套 |
| `components/feedback/AutoFillConfigPanel.tsx`  | CSS 选择器配置面板，也是自动填写相关功能，用户确认不需要         |
| `components/dashboard/quick-actions.tsx`      | 未被 dashboard 引用，功能与 `feature-shortcuts.tsx` 重叠 |
| `components/dashboard/recent-tasks.tsx`       | 未被引用，功能与 `class-todo-center.tsx` 重叠            |
| `components/dashboard/upcoming-deadlines.tsx` | 未被引用，与 dashboard 其他卡片功能重叠                      |
| `components/dashboard/stats.tsx`              | 未被引用，功能已集成到 `welcome-banner.tsx`               |
| `components/dashboard/my-class-dropdown.tsx`  | 未被引用                                           |
| `components/dashboard/performance-chart.tsx`  | 未被引用                                           |
| `components/layout/app-shell.tsx`             | 未被 layout.tsx 引用                               |
| `app/(app)/download/page.tsx`                 | 单独的文件下载页面，功能不明确                                |
| `lib/api/dashboard.service.ts`                | 未被使用                                           |
| `lib/api/schedule.service.ts`                 | 未被使用                                           |
| `lib/api/task.service.ts`                     | 未被使用                                           |
| `lib/api/user.service.ts`                     | 未被使用                                           |
| `lib/auth-guard.ts`                           | 重复，实际使用的是 `components/auth/auth-guard.tsx`     |
| `lib/account-store.ts`                        | 使用率极低，功能被 auth-store 替代                        |

> 删除后需同步修改 `app/(app)/feedback/page.tsx`，移除 `BookmarkletSetup` 和 `AutoFillConfigPanel` 的 import 和使用。

### 2.2 基于用户真实场景的建议添加功能

#### ⭐ 核心痛点功能（直接解决助教每日重复劳动）

| 功能                      | 描述                                                                                                | 价值                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **📋 一键家长群文案生成**        | 基于当日课堂内容+作业+小测结果，AI 自动生成可直接复制到微信家长群的文案（今日学习内容、课后作业、重点提醒、优秀表扬），支持不同课程类型模板（GY/KET/PET/FCE）          | 工作流第 6、7 步的"家长群发送"目前全靠手动编写，这是助教每天最耗时的重复劳动之一 |
| **📊 学生个人成长档案**         | 每个学生一个时间轴视图，聚合：历次作业评估+小测成绩折线图+出勤记录+收到的反馈，支持一键导出为"家长报告"PDF                                         | 家长会/续报时需要展示学生进步，目前只能手动翻历史记录拼凑               |
| **🔢 批量成绩录入表格**         | 作业和小测页面支持"表格模式"：以学生为行、评估维度为列的网格视图，支持键盘导航（Tab 切换单元格、Enter 换行），一次批量录入全班数据                           | 现在需要逐个学生点击录入，一个 20 人班级录入时间超过 10 分钟          |
| **🚨 智能重测名单**           | 小测成绩录入后自动标红正确率<80%的学生，一键生成"XX班需重测名单：张三、李四...以上孩子可课后留下重测"文案，同时自动添加到 dashboard 的"风险学生面板"            | 工作流第 9 步目前需要人工筛选和手动组合文案                     |
| **📅 今日工作总览**           | Dashboard 新增"今日待办"卡片：列出今天有课的所有班级，每个班级显示工作流 9 步的完成进度条（3/9 已完成），点击可直接跳转到对应操作页面                      | 助教管理多个班级时，经常忘记哪些班级的反馈/小测还没完成                |
| **💬 智能话术推荐**           | 写反馈时，根据输入的关键词/学生成绩数据，自动从 `feedback-templates.json` 和 `feedback-phrases.json` 中推荐匹配度最高的 3 条话术，一键插入 | 已有的 200+ 条话术模板利用率极低，助教不知道有哪些可用              |
| **🏠 Dashboard 班级对比卡片** | 在 dashboard 展示本周/本月各班级的平均正确率柱状图、出勤率对比，校区主管可快速定位需要关注的班级                                            | 目前没有任何班级级别的数据聚合视图                           |
| **🤖 一键自动填写反馈到目标网站** | 生成反馈后，点击"自动填写"，系统启动一个受控浏览器窗口，自动导航到目标反馈网站（如新东方 LMS），按配置好的班级→学生映射关系，逐个找到对应字段填入反馈内容并提交。助教只需在一旁监督确认即可，全程无需手动复制粘贴 | 替代已删除的 Bookmarklet 方案，真正实现 end-to-end 自动化。一个班 20 个学生从原来的逐个复制粘贴 40 分钟 → 监督确认 5 分钟 |

#### ⭐ 效率提升功能

| 功能             | 描述                                                         | 优先级 |
| -------------- | ---------------------------------------------------------- | --- |
| **全局搜索增强**     | 支持搜索学生（跳转到该学生的作业/小测/反馈记录）、搜索班级、搜索知识库文件，添加快捷键 `Ctrl+K` 统一入口 | 高   |
| **学生列表实时搜索过滤** | 作业/小测/反馈页面的学生列表顶部添加搜索输入框，输入即过滤                             | 高   |
| **数据导出格式扩展**   | 小测/作业成绩支持导出 CSV（可用 Excel 打开）、反馈支持批量导出为单个 DOCX              | 中   |
| **撤销删除**       | 删除学生/班级/评估记录后，底部弹出 toast "已删除，5秒内可撤销"，点击撤销恢复数据             | 中   |
| **键盘快捷键提示面板**  | 按 `?` 键弹出全局面板，展示所有可用快捷键（班级切换、学生导航、快速操作等）                   | 低   |
| **课表冲突检测**     | 创建/编辑班级上课时间时，检测同一助教是否有时间段重叠的班级                             | 低   |
| **批量操作**       | 学生管理：批量添加到班级、批量标记重点关注；作业/小测：批量设为已完成                        | 中   |

### 2.3 工作流自动化增强

当前 9 步工作流全部依赖手动操作，以下是可自动化的环节：

| 步骤         | 现状         | 可优化为                    |
| ---------- | ---------- | ----------------------- |
| 1. 批改作业    | 手动逐个学生录入   | 批量表格模式一次录入全班            |
| 5. 撰写反馈    | 逐个学生 AI 生成 | 基于模板+成绩数据，一键批量生成全班反馈    |
| 6. 家长群发送内容 | 手动编写文案     | AI 根据课堂内容+课程类型自动生成文案    |
| 7. 家长群发送作业 | 手动编写文案     | 同上，自动附带作业清单             |
| 8. 同步小测情况  | 无自动化       | 自动汇总班级平均分、最高分、最低分、正确率分布 |
| 9. 发布重测名单  | 手动筛选       | 根据阈值自动筛选并生成名单文案         |

### 2.4 🔥 效率性深度提升方案（解决"打字累"核心痛点）

> **用户真实反馈**：不同老师有不同工作流习惯，有些需要拍照上传，打字输入非常累。以下是基于"减少键盘输入、增加自然交互"的效率提升方案。

#### 🎤 语音输入方案（最大效率提升）

| 功能          | 描述                                                                                       | 典型场景                                         |
| ----------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| **语音转反馈**   | 反馈页面增加录音按钮，助教口述反馈内容（如："王小明这周听力进步很大，单词听写从60%提高到了85%，但是书写还需要注意卷面整洁"），自动转文字 + AI 润色格式后填入反馈框 | 一个班 20 个学生，口述每人 15 秒，5 分钟完成全班反馈（原来需要 1 小时打字） |
| **语音快捷指令**  | 在任意页面通过语音下达指令，如："开始专注计时"、"切换到KET周末班"、"查看张三的作业记录"、"全班标记已打卡"                               | 手上在批改作业时，无需放下笔操作电脑                           |
| **语音录入成绩**  | 小测/作业页面支持语音批量报分："张三 85、李四 92、王五 78..."，系统自动识别姓名+分数并填入对应单元格                               | 批改试卷时直接念出分数，不用逐个打字                           |
| **语音写课堂内容** | 反馈页面的课堂内容填写支持语音输入，下课后口述："今天讲了Unit3的被动语态和情态动词，课上做了一篇完形填空和两篇阅读理解，重点讲解了不定式..."              | 课后 1 分钟回顾即可完成填写                              |

**技术实现路径**：使用浏览器原生 `Web Speech API` (SpeechRecognition)，无需后端，离线可用，支持中文识别。降级方案：录制音频 → 调用 DeepSeek/OpenAI Whisper 转文字。

#### 📸 拍照/图片方案

| 功能           | 描述                                                           |
| ------------ | ------------------------------------------------------------ |
| **拍照自动关联学生** | 作业/小测页面支持用摄像头或手机拍照上传试卷图片，OCR 识别学生姓名后自动关联到对应学生记录，图片与成绩绑定留存    |
| **批量拍照模式**   | 打开"批量拍照"模式，连续拍摄试卷照片，系统按拍摄顺序自动匹配学生列表（第一个学生第一张照片），效率等同于"扫一叠试卷" |
| **拍照打卡签到**   | 课堂签到页面支持拍照，一键生成"XX班 XX月XX日 出勤确认"带时间水印的图片，方便发送家长群             |
| **知识库拍照导入**  | 黑板上写的重点知识点，拍照后自动存入知识库，OCR 提取文字可搜索                            |

#### ⚡ 一键快捷操作方案

| 功能           | 描述                                                                       |
| ------------ | ------------------------------------------------------------------------ |
| **全班快速标记**   | 作业/小测页面增加"全班完成"、"全班优秀"、"全班已打卡"一键按钮，先批量设置默认值，再单独修改少数例外学生（20 个学生只需改 2-3 个） |
| **模板快捷填充**   | 创建"我的快捷模板"：助教预设常用评估话术（如"作业完成优秀，字迹工整，正确率高"），录入时一键选择填充                     |
| **剪贴板智能监控**  | 从微信/Excel 复制学生名单或成绩表格，粘贴到系统时自动解析行列结构，自动填入对应字段（大幅减少从微信家长群转录数据的时间）         |
| **最近操作用户记忆** | 记住助教上次操作的班级和最后操作的学生，下次打开页面自动定位到那个位置，无需重新选择                               |

#### 🔧 工作流个性化方案（智能生成 + 自由定制）

| 功能                | 描述                                                                                                                                                          | <br /> |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | :----- |
| **🤖 AI 智能生成工作流** | 助教用自然语言描述需求，AI 自动生成完整工作流。例如输入"我教KET周末班，每次课后需要：批改作业本、拍照上传优秀作业到家长群、给正确率低于70%的学生一对一私聊家长、发布下次课的预习内容"，AI 自动拆解为多个节点并生成模板。基于 DeepSeek API，每个节点自动匹配类型、设置默认提醒时间和关联页面 | <br /> |
| **自定义工作流节点**      | 当前工作流按课程类型（GY/KET/PET/FCE）预设，允许助教手动增删节点（如添加"拍照上传试卷"、"学习情况一对一私聊"等自定步骤）                                                                                       | <br /> |
| **工作流节点类型扩展**     | 支持新节点类型：`take_photo`（拍照上传）、`voice_reminder`（语音提醒）、`private_chat`（私聊家长）、`check_homework_photo`（检查作业照片）、`send_voice_message`（发送语音消息给家长）                       | <br /> |
| **工作流快捷操作栏**      | 在 Dashboard 或顶部导航栏固定显示"当前班级工作流进度"，点击任意步骤直接跳转到对应操作页面并预选当前班级                                                                                                  | <br /> |
| **跨班级批量操作**       | 工作流完成后支持"一键应用到今日所有班级"（如：今天 4 个班都是同样的课后作业，只需编辑一次作业文案，一键复制到其他 3 个班）                                                                                           | <br /> |
| **AI 工作流优化建议**    | 根据助教历史操作数据（完成速度、跳过频率、增删节点习惯），AI 自动推荐工作流优化："建议将'拍照上传'步骤放在批改作业之后，这样更符合你的操作习惯"                                                                                 | <br /> |

### 2.5 重复代码抽取

| 重复内容                                  | 出现位置                                                     | 建议                                                          |
| ------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------- |
| `getLocalDateString()`                | homework, quizzes, feedback 各定义一次                        | 移到 `lib/utils.ts`                                           |
| 班级-学生左右分栏布局                           | homework, quizzes, feedback 几乎相同                         | 提取为 `ClassStudentLayout` 组件                                 |
| `completionLabels`/`completionColors` | homework, quizzes 重复定义                                   | 提取到 `lib/constants.ts`                                      |
| Enter 键跳转下一字段模式                       | homework (AddAssessmentModal), quizzes (UploadQuizModal) | 提取为 `useEnterToNext` hook                                   |
| 班级下拉选择器 + 点击外部关闭                      | homework, quizzes, feedback, resources 重复                | 提取为 `ClassSelector` 组件                                      |
| `getTypeIcon`/`getTypeLabel`          | resources/page.tsx 和 store.ts 各一套                        | 统一使用 store.ts 中的 `getResourceTypeIcon/getResourceTypeLabel` |

### 2.6 🤖 自动填写反馈 Agent 实现方案

> **背景**：用户希望生成反馈后，能像 Agent 一样自动打开目标反馈网站（如新东方 LMS 系统），找到对应班级和学生的位置，自动填入反馈内容。替代之前被删除的 Bookmarklet 方案。

#### 业务流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  TABuddy      │    │  目标网站     │    │              │    │              │
│  生成全班反馈  │───▶│  自动登录     │───▶│  查找班级     │───▶│  逐个学生     │
│               │    │  (配置密码)   │    │  下拉选择     │    │  填入反馈     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                                  │                   │
                                                  ▼                   ▼
                                          ┌──────────────┐    ┌──────────────┐
                                          │  下一个学生    │◀───│  提交反馈     │
                                          │  循环执行     │    │  确认提交     │
                                          └──────────────┘    └──────────────┘
```

#### 📐 完整操作流程（分两步：先配置一次，以后一键执行）

```
【第一步：一次性配置】（每个网站只需配置一次，5分钟）

  你打开目标网站 → 打开 TABuddy 的"站点配置助手"
  → 可视化点击页面元素来标记"这是什么字段"
  → 配置保存到数据库，以后不需要再配

【第二步：每次一键执行】

  在 TABuddy 生成完反馈 → 点击"自动填写"
  → 系统按配置好的步骤自动执行
  → 你在旁边看着就行，遇到问题会暂停提示你
```

---

#### 🔑 登录问题解决方案（目标是扫码登录的网站）

目标网站使用**微信/钉钉扫码登录**，这种情况反而比密码登录更安全简单：

```
┌─────────────────────────────────────────────────────────┐
│  第1次使用时（扫码登录，只需做一次）：                       │
│                                                         │
│  1. 系统打开 Chrome 浏览器，导航到目标网站                   │
│  2. 页面上显示二维码                                       │
│  3. 你用手机扫一下码 → 手机上点确认                          │
│  4. 网页自动跳转进入系统后台                                │
│  5. 系统检测到登录成功（URL 变了）                           │
│  6. 自动保存整个浏览器的登录状态到本地文件                    │
│     → 保存了 cookies、session、localStorage 等             │
│                                                         │
│  以后每次用（自动复用，无需扫码）：                           │
│  1. 系统打开浏览器，加载上次保存的登录状态                    │
│  2. 直接就是已登录状态，跳过登录页                           │
│  3. 开始自动填写反馈                                       │
│                                                         │
│  登录状态过期时（可能几小时或几天后）：                        │
│  系统发现跳转到了登录页 → 暂停，弹出提示                     │
│  "登录已过期，请扫码重新登录" → 你扫一下码 → 继续自动填写     │
└─────────────────────────────────────────────────────────┘
```

**Playwright 实现代码**：

```typescript
// 首次：扫码登录 + 保存状态
async function loginViaQRScan(siteConfig: AutoFillSiteConfig): Promise<BrowserContext> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(siteConfig.url)

  // 等待用户扫码完成（检测登录成功后的 URL 或页面元素）
  // 比如：登录成功后 URL 会从 /login 变成 /dashboard
  await page.waitForURL(
    (url) => !url.href.includes('/login') && !url.href.includes('/auth'),
    { timeout: 180000 }  // 给 3 分钟时间扫码
  )

  // 扫码成功，保存状态
  await context.storageState({
    path: `auth-states/${siteConfig.id}.json`
  })

  return context
}

// 后续：加载保存的状态
async function loadOrReLogin(siteConfig: AutoFillSiteConfig): Promise<{ page: Page; context: BrowserContext }> {
  const statePath = `auth-states/${siteConfig.id}.json`
  const hasState = fs.existsSync(statePath)

  const context = hasState
    ? await browser.newContext({ storageState: statePath })
    : await loginViaQRScan(siteConfig)

  const page = await context.newPage()
  await page.goto(siteConfig.url)

  // 检测是否需要重新登录（被重定向到登录页了）
  const currentUrl = page.url()
  if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
    // 登录态过期，删除旧状态，重新扫码
    if (hasState) fs.unlinkSync(statePath)
    await context.close()
    const newContext = await loginViaQRScan(siteConfig)
    const newPage = await newContext.newPage()
    await newPage.goto(siteConfig.url)
    return { page: newPage, context: newContext }
  }

  return { page, context }
}
```

**整个流程对用户来说极简**：
- 第1次：扫一次码 → 搞定
- 以后每天：点"自动填写" → 自动干活，什么都不用管
- 偶尔过期：弹窗提示"请扫码" → 扫一下 → 继续自动干活

---

#### 🎯 可视化配置：点击元素自动识别（你不用懂 CSS 选择器）

这是整个系统最关键的设计——**让普通助教不需要懂任何代码，点几下鼠标就能配置好**：

```
┌─────────────────────────────────────────────────────────┐
│              可视化站点配置助手                            │
│                                                         │
│  左侧：嵌入的目标网站 iframe/预览                          │
│  ┌───────────────────────────────────────┐              │
│  │                                       │              │
│  │   新东方 LMS 反馈系统                   │              │
│  │   ┌─────────────────────────┐         │              │
│  │   │ 班级: [下拉选择框 ▼]     │ ← 鼠标悬停│              │
│  │   │ 学生: 张三               │   时高亮   │              │
│  │   │ 反馈: [                ] │           │              │
│  │   │       [大段文字输入框]   │           │              │
│  │   │                        │           │              │
│  │   └─────────────────────────┘         │              │
│  │                                       │              │
│  │   [提交按钮]                            │              │
│  └───────────────────────────────────────┘              │
│                                                         │
│  右侧：配置面板                                          │
│  ┌───────────────────────────────────────┐              │
│  │  模式：🔍 拾取模式（点击页面元素标记）    │              │
│  │                                       │              │
│  │  ✅ 班级下拉框                          │              │
│  │     selector: select.class-picker      │              │
│  │     [测试定位] [重新拾取]               │              │
│  │                                       │              │
│  │  ✅ 反馈输入框                          │              │
│  │     selector: textarea#feedback        │              │
│  │     [测试定位] [重新拾取]               │              │
│  │                                       │              │
│  │  ✅ 提交按钮                            │              │
│  │     selector: button:has-text("提交")   │              │
│  │     [测试定位] [重新拾取]               │              │
│  │                                       │              │
│  │  还要标记：☐ 学生姓名  ☐ 下一个学生按钮   │              │
│  │                                       │              │
│  │  [测试自动填写一个学生] [保存配置]        │              │
│  └───────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

**拾取模式的工作方式**：
1. 打开目标网站（用户已手动登录）
2. 用户点击"拾取班级下拉框" → 鼠标移到页面上 → 元素自动高亮
3. 用户点击目标下拉框 → 系统自动生成 CSS 选择器并保存
4. 同样方式拾取：反馈输入框、提交按钮、学生姓名位置、下一个学生按钮
5. **测试**：点击"测试填写一个学生" → 系统尝试用拾取的选择器填入一条测试数据 → 成功则绿色勾，失败则红色提示

---

#### 🏗️ 技术架构（最终方案：Electron 本地客户端 + Playwright）

**为什么不用纯 Web API**：目标网站通常有 CORS 限制、登录态隔离，服务端 Playwright 无法直接操作用户电脑上已登录的浏览器。

**推荐架构**：利用项目已有的 Electron 桌面端（`electron/main.js`），在客户端本地执行 Playwright：

```
┌─────────────────────────────────────────────────────────┐
│                   用户电脑上的 Electron 桌面端             │
│                                                         │
│  ┌─────────────────────┐   ┌──────────────────────┐    │
│  │  TABuddy Web UI     │   │  Playwright 控制器     │    │
│  │  (Next.js 前端)      │   │  (本地 Node.js 进程)   │    │
│  │                     │   │                      │    │
│  │  "一键自动填写"按钮   │──▶│  1. 打开 Chrome 浏览器  │    │
│  │  显示实时进度         │◀──│  2. 加载已保存登录态    │    │
│  │                     │   │  3. 逐个学生填写反馈    │    │
│  └─────────────────────┘   │  4. 推送进度给 UI      │    │
│                            └──────────────────────┘    │
│                                      │                  │
│                                      ▼                  │
│                            ┌──────────────────────┐    │
│                            │  受控 Chrome 浏览器    │    │
│                            │  打开目标 LMS 网站     │    │
│                            │  (你已登录的状态)      │    │
│                            │  自动执行填写操作      │    │
│                            └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

**这样做的好处**：
- **登录不是问题**：你正常用 Chrome 登录一次目标网站，登录态保存在本地，之后自动填写直接复用
- **不需要服务器**：所有操作在你自己的电脑上完成
- **安全**：你的账号密码不需要传给任何服务器
- **可视化**：你可以亲眼看到浏览器自动操作的过程
- **已有基础**：项目已经配置了 Electron，只需新增 Playwright 集成

---

#### 📋 配置数据结构（完整版）

```typescript
interface AutoFillSiteConfig {
  id: string
  name: string                              // "新东方LMS反馈系统"
  url: string                               // "https://il.xdf.cn/feedback/..."
  
  // ====== 字段映射（通过可视化拾取自动生成）======

  // 班级选择
  classPicker: {
    selector: string                         // 自动拾取的选择器，如 "select.class-dropdown"
    matchBy: 'text' | 'value' | 'index'     // 按文本/值/序号匹配
    // 如何映射：TABuddy 班级名 → 目标网站班级名
    mapping: Record<string, string>          // { "KET周末班": "KET-Weekend-2025" }
  }

  // 学生定位（在目标网站上如何找到"张三"）
  studentLocator: {
    mode: 'click_row' | 'search_box'        // 点击列表中的行 / 搜索框输入
    listItemSelector: string                 // ".student-table tr"
    nameCellSelector: string                 // "td:nth-child(2)"  学生名在第几列
    searchBoxSelector?: string               // 如果有搜索框
  }

  // 反馈内容填写
  feedbackField: {
    contentSelector: string                  // "textarea#feedback-content"
    // TABuddy 的 feedback.content → 填入这个输入框
  }

  // 提交
  submitButton: {
    selector: string                         // "button.submit-btn"
    waitAfterSubmit: number                  // 提交后等多少毫秒（2000）
  }

  // 切换到下一个学生
  nextStudent: {
    selector?: string                        // "button.next-student" 
    // 如果是列表形式，填完后自动找下一行
  }

  // ====== 登录（扫码登录，无需存储账号密码）======
   loginUrl?: string                          // 如果登录页和业务页不同，单独指定
   loginSuccessIndicator: {
     // 怎么判断扫码成功了（URL 变化 / 特定元素出现）
     mode: 'url_change' | 'element_appear'
     urlPattern?: string                       // 成功后 URL 包含的关键词，如 "/dashboard"
     elementSelector?: string                  // 成功后出现的元素，如 ".user-avatar"
   }
   stateStoragePath: string                   // 登录状态保存路径，如 "auth-states/xdf.json"
}
```

---

#### 🎬 完整执行流程（用户视角）

```
第1次使用：
  ① 打开 TABuddy → 反馈页面 → 生成全班反馈
  ② 点击"自动填写" → 提示"首次使用需要配置目标网站"
  ③ 打开配置助手 → 目标网站已加载（你在这网站已登录）
  ④ 点击"拾取班级下拉框" → 鼠标移到页面上 → 点击下拉框 → ✓已标记
  ⑤ 点击"拾取反馈输入框" → 点击输入框 → ✓已标记
  ⑥ 点击"拾取提交按钮" → 点击按钮 → ✓已标记
  ⑦ 点击"拾取学生姓名" → 点击列表中某个学生名 → ✓已标记
  ⑧ 点击"测试填写" → 系统自动填入一条测试数据 → 成功！
  ⑨ 保存配置 → 命名为"新东方LMS"

第2次及以后使用：
  ① 在 TABuddy 生成全班反馈
  ② 点击"自动填写" → 选择"新东方LMS"
  ③ 确认学生列表（可取消个别学生）
  ④ 点击"开始" → 浏览器自动弹出
  ⑤ 实时看到进度：⏳ 正在填写张三 (3/20)...
  ⑥ 5分钟后 → ✅ 完成！20个学生全部填写成功
  ⑦ 如果某个学生失败（如名字不匹配）→ ⚠️ 暂停提示你手动处理
```

---

#### 📡 前端与 Electron 通信方式

```typescript
// Electron 主进程暴露 API 给渲染进程（Next.js 前端）
// preload.ts
contextBridge.exposeInMainWorld('autoFill', {
  // 触发自动填写
  start: (config: AutoFillSiteConfig, feedbacks: Feedback[]) => { ... },
  // 获取实时进度（回调方式）
  onProgress: (callback: (event: AutoFillEvent) => void) => { ... },
  // 暂停/继续/取消
  pause: () => { ... },
  resume: () => { ... },
  cancel: () => { ... },
  // 测试单个选择器是否有效
  testSelector: (selector: string) => Promise<boolean>,
})
```

---

#### 🔄 降级方案（非 Electron 环境 / Web 版）

如果用户用的是纯 Web 版（没有安装桌面端）：

| 方案 | 描述 |
|------|------|
| **复制引导模式** | 系统逐个显示 "当前学生：张三 → 反馈内容：xxx" + "📋 一键复制"，你手动粘贴到目标网站，然后按 → 箭头切换到下一个学生 |
| **浏览器扩展** | 开发一个轻量 Chrome 扩展，在目标网站的页面上读取 TABuddy 生成的反馈数据，自动填入（无需服务端，直接在浏览器里跑脚本） |

### 2.7 交互逻辑优化

> 经过对所有页面和组件的全面审查，发现以下交互逻辑问题需要修复。

#### 🚨 高危交互问题

| 问题 | 位置 | 修复方案 |
|------|------|---------|
| **反馈记录删除无二次确认** | [feedback/page.tsx:L173-L177](file:///c:/Users/21449/Desktop/TABuddy/app/(app)/feedback/page.tsx#L173-L177) | 添加确认弹窗再执行删除 |
| **Dashboard 绑定成功全页刷新** | [dashboard/page.tsx:L264](file:///c:/Users/21449/Desktop/TABuddy/app/(app)/dashboard/page.tsx#L264) | 使用 `window.location.reload()` 改为数据刷新 + 事件通知 |

#### 📝 确认/弹窗统一化

| 问题 | 涉及文件 | 修复方案 |
|------|---------|---------|
| `window.confirm()` 原生弹窗风格不统一 | classes/page.tsx、students/page.tsx、classes/[id]/page.tsx、knowledge-base/page.tsx、workflow/page.tsx | 统一替换为自定义 `ConfirmDialog` 组件，使用 toast 或 Modal 实现 |
| `alert()` 代替 toast | classes/page.tsx、classes/[id]/page.tsx | 全部改为 `toast.success` / `toast.error` |
| Esc 键无法关闭弹窗 | 所有 Modal 弹窗 | 添加全局 Esc 键监听关闭弹窗 |

#### 🔍 导航与定位

| 问题 | 修复方案 |
|------|---------|
| 侧边栏当前页精确匹配，子路由不高亮（如 `/classes/123` 不亮） | `pathname === item.href` 改为 `pathname.startsWith(item.href)` |
| 所有页面缺少面包屑导航 | 在 Header 或 PageContainer 中添加面包屑 |
| 完成操作后没有引导下一步（如保存评估后不自动切换学生） | toast 中添加"下一个学生"操作按钮 |

#### ✏️ 表单交互增强

| 问题 | 修复方案 |
|------|---------|
| 自定义下拉框不支持键盘导航（方向键） | 添加 `onKeyDown` 处理方向键选择 |
| 部分表单 Enter 键不能提交 | 统一添加 `onSubmit` + `onKeyDown` Enter 处理 |
| 删除成功/失败后无 toast 反馈（多处） | 统一添加 `toast.success` / `toast.error` |

#### 🔄 数据一致性

| 问题 | 修复方案 |
|------|---------|
| 侧边栏桌面版和移动版是两个独立 `<aside>`，重复渲染 | 合并为一个，用 CSS class 控制显示 |
| FloatingChat 和 Sidebar 各自管理主题切换，可能冲突 | 统一通过 `next-themes` 的 `useTheme` 管理 |
| 悬浮聊天 100 条消息上限静默截断 | 截断时 toast 提示"已清理早期消息" |

### 2.8 store.ts 拆分方案

**当前问题**: `store.ts` 1519 行，管理 20+ 种数据类型，极难维护。
**建议方案**: 按数据域拆分为独立文件：

```
lib/store/
  index.ts           # 导出所有
  cache.ts           # DataCache 接口 + 全局 cache 实例
  class-store.ts     # 班级 CRUD + 课表
  student-store.ts   # 学生 CRUD
  task-store.ts      # 课程任务 CRUD
  assessment-store.ts # 作业评估 CRUD
  quiz-store.ts      # 小测 CRUD
  feedback-store.ts  # 反馈 CRUD
  knowledge-store.ts # 知识库 CRUD
  sync.ts            # 同步到 API 的逻辑
```

***

## 三、UI 设计审美配色：清新风格

### 3.1 现状分析

**当前配色**:

* 浅色模式：以暖白色 (`hsl(35,20%,96%)`) 为背景，蓝灰色 (`hsl(210,20%,55%)`) 为主色，暖橙色 (`hsl(10,25%,65%)`) 为辅色

* 深色模式：统一为橙色系暖暗色 (`dark:bg-orange-900/xx`)

* 整体色调偏向"成熟/稳重"，不够清新活泼

**问题**:

1. 浅色模式背景偏黄（`35 20% 96%`），不够清新
2. 主色蓝灰 `210 20% 55%` 饱和度偏低，显得昏暗
3. 深色模式全部统一为橙色系，缺乏层次感
4. 部分页面使用了硬编码的 `stone`、`slate`、`gray` 混合，视觉不统一
5. 0.28s 全局过渡动画 `!important` 可能导致性能问题

### 3.2 "清新"配色方案建议

#### 浅色模式（清新柔和）

```css
:root {
  --background: 200 30% 97%;        /* 淡蓝白背景 - 比现在的暖白更清新 */
  --foreground: 215 25% 25%;        /* 深蓝灰文字 */
  --card: 0 0% 100%;                /* 纯白卡片 */
  --card-foreground: 215 25% 25%;
  
  --primary: 195 75% 45%;           /* 天蓝色主色 - 清新活泼 */
  --primary-foreground: 0 0% 100%;
  
  --secondary: 170 60% 42%;         /* 青绿色辅色 - 自然清新 */
  --secondary-foreground: 0 0% 100%;
  
  --accent: 200 30% 94%;            /* 淡蓝强调背景 */
  --accent-foreground: 215 25% 25%;
  
  --muted: 200 20% 94%;             /* 柔和背景 */
  --muted-foreground: 215 15% 50%;
  
  --border: 195 20% 88%;            /* 淡蓝灰色边框 */
  --input: 195 20% 88%;
  --ring: 195 75% 45%;              /* 聚焦环与主色一致 */
  
  --destructive: 0 55% 55%;
  --destructive-foreground: 0 0% 100%;
  
  --radius: 0.75rem;                /* 保持 */
}
```

#### 深色模式（清爽暗色）

```css
.dark {
  --background: 215 25% 10%;        /* 深蓝灰背景 */
  --foreground: 195 20% 92%;
  --card: 215 25% 14%;
  --card-foreground: 195 20% 92%;
  
  --primary: 195 65% 52%;           /* 天蓝色稍亮 */
  --primary-foreground: 0 0% 100%;
  
  --secondary: 170 50% 48%;
  --secondary-foreground: 0 0% 100%;
  
  --accent: 215 20% 20%;
  --accent-foreground: 195 20% 92%;
  
  --muted: 215 20% 18%;
  --muted-foreground: 195 15% 60%;
  
  --border: 215 20% 22%;
  --input: 215 20% 22%;
  --ring: 195 65% 52%;
  
  --destructive: 0 50% 50%;
  --destructive-foreground: 0 0% 100%;
}
```

### 3.3 组件级 UI 优化点

#### Sidebar 侧边栏

* 当前选中项高亮色应与新主色一致

* 折叠状态下的图标提示使用更柔和的阴影

* 菜单图标统一使用 `h-5 w-5` 尺寸

#### Dashboard 仪表盘

* 卡片统一使用 `rounded-2xl` 大圆角，增加呼吸感

* 卡片间距统一（当前部分使用 `gap-4`，部分 `gap-6`）

* "正在上课"徽章统一使用主色系（天蓝渐变），而不是各页面颜色不一致

#### 班级-学生左右分栏（Homework/Quizzes/Feedback）

* 学生列表项 hover 和选中状态统一

* 学生头像统一使用 `avatar` 组件而非手动拼接

* 过渡动画时长统一（当前 0.2s/0.3s 混用）

#### 按钮体系

* 主要操作按钮：`bg-primary`（天蓝）

* 次要操作：`bg-secondary`（青绿）

* 危险操作：`bg-destructive`

* 文字按钮：`text-muted-foreground hover:text-foreground`

### 3.4 全局样式优化

#### 删除/优化项

1. **0.28s 全局过渡**: 移除 `!important` 和 `will-change`，改用按需添加 `transition` 类
2. **大量** **`.dark`** **CSS 覆盖规则**: 统一切换到 CSS 变量方案，删除 globals.css 中 200+ 行的 `.dark` 覆盖
3. **自定义 class 精简**: `.flex-card-container`, `.btn-nowrap` 等可用 Tailwind 工具类替代的，删除自定义类
4. **TA 水印**: 深色模式下的 TA 水印保留，但降低频率

#### 添加/优化项

1. 添加 `skeleton` 骨架屏动画（用于 loading 状态）
2. 添加 `focus-ring` 聚焦环样式，统一键盘导航体验
3. 添加微妙的背景纹理或渐变，增加页面层次感

### 3.5 色彩统一策略

**原则**: 所有组件使用 semantic token，不再直接使用原始 Tailwind 颜色类（如 `bg-stone-100`）。

迁移清单：

* `bg-stone-100` → `bg-muted`

* `bg-slate-100` → `bg-muted`

* `bg-gray-100` → `bg-muted`

* `text-stone-600` → `text-muted-foreground`

* `border-stone-200` → `border-border`

* `bg-orange-100 dark:bg-orange-900/30` → `bg-secondary/15`（统一使用辅色透明背景）

***

## 四、执行优先级

### 🔴 第一优先级：立即见效（核心痛点 + 代码清理）

> 目标：先在最短时间内让助教感受到明显效率提升

1. **删除 18 个无用组件/文件** — 减小打包体积，清理维护负担
2. **提取重复代码** — `getLocalDateString`、`completionLabels`/`completionColors`、班级-学生布局组件
3. **🐛 反馈删除添加二次确认** — [feedback/page.tsx:L173](file:///c:/Users/21449/Desktop/TABuddy/app/(app)/feedback/page.tsx#L173) 当前直接删除无确认，高危
4. **🐛 Dashboard 全页刷新改为数据刷新** — [dashboard/page.tsx:L264](file:///c:/Users/21449/Desktop/TABuddy/app/(app)/dashboard/page.tsx#L264) 移除 `window.location.reload()`
5. **🐛 统一弹窗风格** — 替换所有 `window.confirm()` 和 `alert()` 为自定义 toast
6. **📅 今日工作总览** — Dashboard 新增今日待办卡片，显示每个班级的工作流完成进度
7. **🚨 智能重测名单** — 小测正确率 <80% 自动标红+一键生成文案
8. **修复 Toast.loading 清理机制** — 防止永久加载状态
9. **降低 8 秒轮询频率到 30 秒** — 减少服务器/客户端负载

### 🟡 第二优先级：效率大幅提升（语音 + Agent 自动化 + AI 辅助）
7. **🤖 一键自动填写反馈 Agent** — Playwright 自动化，打开网页→登录→选班级→逐学生填写，全流程可视化监督
8. **🎤 语音转反馈** — 口述→自动转文字+AI润色，5分钟完成全班反馈
9. **🤖 AI 智能生成工作流** — 自然语言描述需求，自动拆分节点生成工作流模板
10. **🔢 批量成绩录入表格** — 作业/小测表格模式，一次录入全班
11. **📋 一键家长群文案生成** — AI 根据课堂内容自动生成微信文案
12. **⚡ 全班快速标记** — "全班完成"一键按钮，批量设置后单独修改例外
13. **CSS 变量配色调整为清新风格** — 天蓝+青绿主色调
14. **全局样式清理** — 移除 `!important`、精简 `.dark` 覆盖、色彩统一为 semantic token
15. **添加全局 loading.tsx 骨架屏** — 页面切换不再空白

### 🟢 第三优先级：锦上添花（分析 + 体验）

16. **💬 智能话术推荐** — 写反馈时推荐匹配话术，一键插入
17. **📊 学生个人成长档案** — 时间轴+趋势图+导出PDF
18. **🏠 Dashboard 班级对比卡片** — 柱状图/出勤率对比
19. **🎤 语音快捷指令 + 语音录入成绩** — 解放双手操控系统
20. **📸 拍照自动关联学生** — OCR+图片绑定
21. **剪贴板智能监控** — 粘贴即自动解析
22. **全局搜索增强** — Ctrl+K 统一搜索入口
23. **自定义工作流节点 + 快捷操作栏** — 个性化工作流
24. **数据导出 CSV** — 小测/作业成绩可 Excel 打开
25. **🔍 侧边栏路由高亮修复** — 子路由正确高亮、面包屑导航
26. **✏️ 表单交互增强** — Esc 关闭弹窗、Enter 提交、键盘导航下拉框

### 🔵 第四优先级：架构升级（需要更多规划）

25. **store.ts 按数据域拆分** — 当前 1519 行巨型文件拆为 8 个独立模块
26. **引入 TanStack Query** — 替代手写缓存层
27. **React Suspense 边界 + 懒加载** — 大型页面代码分割
28. **Prisma 查询添加 take 分页 + studentId 关系**
29. **班级选择器组件提取** — 减少 homework/quizzes/feedback/resources 四页面重复代码
30. **撤销删除 + AI 工作流优化建议** — 锦上添花的细节体验

