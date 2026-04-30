# TABuddy - 新东方国际教育助教效率工具

![TABuddy Banner](https://img.shields.io/badge/TABuddy-助教效率工具-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC)

一个专为新东方国际教育助教设计的智能效率工具，帮助助教提升工作效率，让工作不再迷茫。

## ✨ 项目特色

- **🎯 清晰任务管理** - 全局进度条，实时掌握工作进度
- **📊 智能作业评估** - 自动生成个性化反馈和建议
- **📸 小测照片管理** - 批量上传，一键导出报告
- **💬 话术生成器** - 内置模板，个性化课程反馈
- **📚 资源容器** - 集中管理教学资料和链接
- **🎨 精美UI设计** - 互动性高，页面交互有趣

## 🚀 核心功能

### 1. 全局任务进度系统
- 始终可见的进度指示器
- 彩色编码任务类型
- 完成时的庆祝动画
- 快速任务切换

### 2. 智能作业评估系统
- 多维度评估（完成度、书写质量、正确率）
- AI辅助生成个性化评语
- 历史记录查看
- 批量操作支持

### 3. 小测照片管理系统
- 拖拽上传照片
- 批量标注完成情况
- OCR识别支持
- 一键导出Excel报告

### 4. 话术生成器
- 预设话术模板库
- 基于学生表现自动填充
- 个性化调整
- 一键复制到剪贴板

### 5. 课堂资源容器
- 链接收藏夹
- 文档管理
- 快速访问面板
- 分类标签系统

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + Framer Motion
- **组件库**: shadcn/ui + 自定义组件
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **图表**: Recharts
- **文件上传**: react-dropzone
- **通知**: Sonner

### 开发工具
- **代码质量**: ESLint + Prettier
- **类型检查**: TypeScript
- **包管理**: npm / yarn / pnpm

## 📁 项目结构

```
TABuddy/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 主页
│   └── (其他页面)
├── components/            # React组件
│   ├── ui/               # 基础UI组件
│   ├── layout/           # 布局组件
│   ├── dashboard/        # 仪表盘组件
│   ├── providers/        # Context提供者
│   └── (功能模块组件)
├── lib/                  # 工具函数
│   └── utils.ts          # 通用工具
├── hooks/                # 自定义Hooks
├── types/                # TypeScript类型定义
├── utils/                # 业务工具函数
├── styles/               # 全局样式
└── public/               # 静态资源
```

## 🚦 快速开始

### 环境要求
- Node.js 18+ 
- npm / yarn / pnpm

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发环境
```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本
```bash
npm run build
npm start
```

## 🎨 设计系统

### 颜色主题
- **主色调**: 教育蓝 (#3b82f6) + 活力橙 (#fb923c)
- **成功色**: 绿色 (#10b981)
- **警告色**: 琥珀色 (#f59e0b)
- **错误色**: 红色 (#ef4444)

### 交互设计
- **微交互**: 悬停效果、点击反馈、加载动画
- **页面过渡**: 淡入淡出、滑动效果
- **趣味元素**: 成就系统、季节性主题、庆祝动画

## 📱 响应式设计
- **桌面端**: 完整功能，多列布局
- **平板端**: 简化侧边栏，适应触摸
- **移动端**: 底部导航，简化操作

## 🔧 开发指南

### 添加新组件
1. 在 `components/` 目录下创建组件文件
2. 使用 `cn()` 工具函数组合Tailwind类名
3. 导出组件并在需要的地方导入使用

### 添加新页面
1. 在 `app/` 目录下创建页面文件或目录
2. 使用App Router约定
3. 更新侧边栏导航（如需要）

### 添加新类型
1. 在 `types/index.ts` 中添加类型定义
2. 在需要的地方导入使用

## 📈 项目进度

### 已完成
- ✅ 项目架构设计
- ✅ 技术栈选择
- ✅ 基础项目结构
- ✅ 核心类型定义
- ✅ 全局布局组件
- ✅ 仪表盘页面
- ✅ UI组件库基础

### 进行中
- 🔄 核心功能模块开发
- 🔄 数据库设计
- 🔄 API接口设计

### 待完成
- 📋 作业评估模块
- 📋 小测管理模块
- 📋 话术生成模块
- 📋 资源容器模块
- 📋 用户认证系统
- 📋 数据持久化

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢新东方国际教育助教团队的宝贵需求和反馈！

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目 Issues: [GitHub Issues](https://github.com/your-username/TABuddy/issues)
- 邮箱: your-email@example.com

---

**让助教工作更高效，让教育更美好！** 🚀