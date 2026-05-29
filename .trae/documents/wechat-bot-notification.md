# 微信个人号通知机器人 实施方案

## ⚠️ 风险声明

微信个人号自动化存在封号风险。本方案采用保守策略：

* 只在关键事件时发送（非频繁刷消息）

* 每条消息需人工确认发送场景，不搞全自动轰炸

* 建议使用**小号**而非主微信号

## 架构设计

```
TABuddy Web App                    WeChat Bot (独立进程)
┌─────────────────┐               ┌──────────────────────┐
│ 触发通知事件      │  HTTP POST   │  Express API 服务      │
│ POST /api/bot/   │ ──────────→  │  port: 9595           │
│    send-message  │               │                       │
│                 │               │  ↓ 调用 wxauto        │
│  通知管理页面    │               │  微信客户端发送消息     │
│  (配置推送场景)  │               │                       │
└─────────────────┘               └──────────────────────┘
```

* **TABuddy** 负责：触发通知 → 调用本地 API

* **WeChat Bot** 独立进程：接收 API 请求 → 通过微信客户端发送消息

## 实施步骤

### Step 1：创建 WeChat Bot 独立服务

**目录**: `wechat-bot/`

```
wechat-bot/
  ├── package.json
  ├── server.js          # Express HTTP API 服务
  ├── bot.js             # wxauto 微信自动化封装
  └── .env               # 存储微信好友白名单
```

**依赖**: `express`, `wxauto` (基于 Windows UI Automation 的微信自动化库)

**核心逻辑**:

* 启动时自动连接已登录的微信客户端

* 监听 HTTP `POST /send` 请求

* 根据白名单确认接收人

* 通过 wxauto 发送消息到指定好友/群

### Step 2：TABuddy 通知管理页面

**文件**: `app/(app)/notifications/page.tsx`（新建）

功能：

* 📋 **微信绑定管理**：配置哪些老师/家长对应哪个微信号（备注名）

* 🔔 **通知场景开关**：

  * ✅ 课前提醒（上课前 30 分钟）

  * ✅ AI 反馈生成完成

  * ✅ 学生异常预警（连续低分/缺勤）

  * ⬜ 每日教学总结

  * ⬜ 成绩变动通知

* 📝 **消息模板配置**：自定义每种场景的推送文案

* 📊 **发送日志**：查看历史推送记录

### Step 3：TABuddy 通知分发服务

**文件**: `lib/wechat-notify.ts`（新建）

```typescript
// 统一推送入口
export async function sendWeChatNotification(params: {
  toWeChatName: string       // 接收人微信备注名
  message: string            // 消息内容
  type: 'pre_class' | 'feedback_done' | 'alert' | 'summary'
}): Promise<{ success: boolean }>

// 场景触发函数
export function notifyPreClass(classId: string)
export function notifyFeedbackGenerated(classId: string, studentCount: number)
export function notifyStudentAlert(studentId: string, reason: string)
```

内部调用 `http://localhost:9595/send` 发送到 WeChat Bot。

### Step 4：集成到现有通知系统

修改 `lib/reminder-scheduler.ts` 和 `lib/notification-api.ts`：

* 在现有通知触发点加入微信通知调用

* 根据用户配置决定是否发送微信通知

修改文件：

* `lib/reminder-scheduler.ts` — 课前提醒阶段调用 `sendWeChatNotification`

* `app/api/feedback/generate/route.ts` — 生成完成后通知

* `lib/store/feedback.ts` — `addNotification` 时检测是否需要微信推送

### Step 5：Bot 管理侧边栏入口

在侧边栏添加「💬 微信通知」菜单项，链接到通知管理页面。

***

## 文件变更清单

| 操作     | 文件                                   | 说明              |
| ------ | ------------------------------------ | --------------- |
| **新建** | `wechat-bot/package.json`            | Bot 服务依赖        |
| **新建** | `wechat-bot/server.js`               | Express API 服务  |
| **新建** | `wechat-bot/bot.js`                  | wxauto 微信自动化    |
| **新建** | `wechat-bot/.env`                    | 配置/白名单          |
| **新建** | `lib/wechat-notify.ts`               | 微信通知客户端         |
| **新建** | `app/(app)/notifications/page.tsx`   | 通知管理页面          |
| **新建** | `app/api/bot/config/route.ts`        | Bot 配置 API      |
| **修改** | `lib/reminder-scheduler.ts`          | 集成微信通知          |
| **修改** | `app/api/feedback/generate/route.ts` | 反馈完成通知          |
| **修改** | `components/layout/sidebar.tsx`      | 添加微信通知入口        |
| **修改** | `types/index.ts`                     | 添加 BotConfig 类型 |

***

## 使用流程

1. 用户用 Windows 电脑登录微信小号
2. 运行 `cd wechat-bot && npm start` 启动 Bot 服务
3. 在 TABuddy「微信通知」页面配置通知规则
4. 当触发条件满足时，Bot 自动发送微信消息给配置的好友

***

## 降级/安全策略

| 场景      | 处理              |
| ------- | --------------- |
| Bot 未启动 | 通知降级为站内消息，不丢数据  |
| 发送失败    | 记录日志，支持手动重发     |
| 频繁发送    | 每日每场景有发送上限，防止骚扰 |

