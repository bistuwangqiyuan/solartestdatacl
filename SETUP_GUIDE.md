# Solar PV Testing System - Setup Guide

## 系统概述

这是一个用于管理光伏断开装置测试数据的工业级Web应用系统。系统提供了完整的测试数据管理功能，包括设备管理、测试会话、Excel数据导入、实时仪表板和合规报告生成。

## 技术栈

- **前端**: Next.js 15.5.0, React 18.3.1, Tailwind CSS
- **后端**: Supabase (PostgreSQL数据库 + 认证 + 存储)
- **部署**: Netlify
- **其他**: Recharts (图表), xlsx (Excel处理), jsPDF (PDF生成)

## 快速开始

### 1. 环境准备

确保您已安装：
- Node.js 18+ 
- npm 或 pnpm
- Git

### 2. 克隆项目

```bash
git clone <repository-url>
cd solartestdatacl
```

### 3. 安装依赖

```bash
npm install
# 或
pnpm install
```

### 4. 配置环境变量

复制 `.env.local` 文件并填写您的Supabase凭据：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 5. 设置Supabase数据库

1. 登录到您的Supabase项目
2. 进入SQL编辑器
3. 运行 `scripts/database-schema.sql` 中的所有SQL语句
4. 运行 `scripts/setup-database.sql` 中的设置脚本

### 6. 创建存储桶

在Supabase Storage中创建以下存储桶：
- `excel-imports` - 用于存储导入的Excel文件
- `excel-files` - 用于存储处理后的文件

### 7. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 功能说明

### 用户角色

系统支持4种用户角色：
- **Admin** - 完全权限
- **Manager** - 管理权限，可以审批和生成报告
- **Engineer** - 工程师权限，可以创建和管理测试
- **Viewer** - 只读权限

### 主要功能

1. **设备管理**
   - 添加、编辑、删除PV断开装置
   - 支持多种设备类型
   - 跟踪设备规格和标准合规性

2. **测试会话**
   - 创建和管理测试会话
   - 实时状态跟踪
   - 测试条件和参数配置

3. **Excel数据导入**
   - 支持.xlsx和.xls格式
   - 自动数据验证
   - 批量导入测量数据

4. **实时仪表板**
   - 系统概览统计
   - 测试数据可视化
   - 实时活动跟踪

5. **合规报告**
   - 自动生成IEC 60947-3和UL 98B合规报告
   - 支持多种报告格式
   - PDF导出功能

### 数据格式

Excel导入文件应包含以下列：
- `timestamp` - 测量时间戳
- `voltage` - 电压值 (V)
- `current` - 电流值 (A)
- `resistance` - 电阻值 (Ω) [可选]
- `power` - 功率值 (W) [可选]
- `temperature` - 温度 (°C) [可选]
- `humidity` - 湿度 (%) [可选]

## 部署说明

### Netlify部署

1. 将代码推送到GitHub
2. 在Netlify中连接您的GitHub仓库
3. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `.next`
4. 添加环境变量
5. 部署

### 环境变量配置

在Netlify中设置以下环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` (设置为您的Netlify URL)

## 故障排除

### 常见问题

1. **数据库连接错误**
   - 检查Supabase凭据是否正确
   - 确保数据库表已创建
   - 检查RLS策略是否正确配置

2. **Excel导入失败**
   - 确保文件格式正确
   - 检查列名是否匹配
   - 文件大小不超过10MB

3. **认证问题**
   - 清除浏览器缓存
   - 检查Supabase Auth设置
   - 确保用户已在users表中创建记录

## 开发指南

### 项目结构

```
/app              # Next.js页面和API路由
/components       # React组件
/contexts         # React上下文
/lib             # 工具库和配置
/public          # 静态资源
/scripts         # 数据库脚本
/styles          # 全局样式
```

### 代码规范

- 使用TypeScript进行类型安全
- 遵循React最佳实践
- 使用Tailwind CSS进行样式设计
- 保持组件小而专注

### 测试

运行测试：
```bash
npm run test
```

运行linting：
```bash
npm run lint
```

## 许可证

本项目仅供授权使用。详情请联系系统管理员。

## 支持

如需技术支持或功能请求，请联系开发团队。