# AI Friend - AI 内容生成工具

这是一个基于 React + TypeScript + Vite 构建的 AI 内容生成工具，支持文生视频、图生视频和图片生成功能。

## 功能特性

- **文生视频**: 根据文本描述生成视频内容
- **图生视频**: 基于上传的图片和文本描述生成视频
- **图片生成**: 根据文本描述生成图片内容
- **智能优化**: 使用 DeepSeek 语言模型优化文本描述
- **实时状态**: 支持任务状态实时查询
- **文件下载**: 支持生成内容的本地下载

## 技术栈

- React 18 + TypeScript
- Vite 构建工具
- Ant Design UI 组件库
- Axios HTTP 客户端
- 即梦AI (字节跳动) - 图片和视频生成
- DeepSeek API - 文本优化

## 项目结构

```
src/
├── components/          # UI 组件
├── services/           # API 服务
├── utils/              # 工具函数
├── config/             # 配置文件
├── App.tsx             # 主应用组件
└── main.tsx            # 应用入口
```

## 快速开始

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，添加 API 密钥：
```
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_VOLCENGINE_ACCESS_KEY=your_volcengine_access_key_here
VITE_VOLCENGINE_SECRET_KEY=your_volcengine_secret_key_here
```

3. 启动开发服务器
```bash
npm run dev
```

## 重要说明

✅ **真实API实现**：项目已实现真实的即梦AI API调用，包括火山引擎签名认证。

⚠️ **需要配置认证信息**：使用前需要配置火山引擎的Access Key和Secret Key。

🔐 **获取认证信息**：
1. 登录火山引擎控制台：https://console.volcengine.com/
2. 开通视觉AI服务
3. 获取Access Key和Secret Key
4. 配置到.env文件中

🚨 **安全警告**：前端直接使用API密钥存在安全风险，生产环境请使用后端代理。详见：[安全说明](docs/security-notice.md)

## API 配置

### 即梦AI API
项目已按照官方文档实现API调用格式：

- **文生视频**: https://www.volcengine.com/docs/85621/1538636
  - 请求格式：`POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31`
  - req_key: `jimeng_vgfm_t2v_l20`
  - 支持参数：prompt, seed, aspect_ratio

- **图生视频**: https://www.volcengine.com/docs/85621/1544774
  - 请求格式：`POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31`
  - req_key: `jimeng_vgfm_i2v_l20`
  - 支持参数：prompt, image, seed, aspect_ratio

- **图片生成**: https://www.volcengine.com/docs/85621/1537648
  - 请求格式：`POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31`
  - req_key: 需要根据实际文档确定

### DeepSeek API
- 文本优化处理，提高生成质量
- API地址：https://api.deepseek.com/v1/chat/completions

## 使用说明

1. 选择生成模式（文生视频/图生视频/图片生成）
2. 根据模式上传图片文件（如需要）
3. 输入文本描述
4. 点击"开始生成"按钮
5. 等待生成完成（使用真实的即梦AI API）
6. 查看结果并下载

### 当前功能状态
- ✅ **UI界面**: 完整的用户界面和交互
- ✅ **文本优化**: DeepSeek API 集成用于提示词优化
- ✅ **API格式**: 按照官方文档正确实现API调用格式
- ✅ **真实API调用**: 实现了完整的火山引擎签名认证
- ✅ **文生视频**: 支持真实的文生视频API调用
- ✅ **图生视频**: 支持真实的图生视频API调用
- ✅ **任务状态查询**: 支持真实的任务状态查询
- ✅ **结果展示**: 支持图片和视频结果的展示与下载

### 技术实现
- 🔐 **火山引擎签名认证**: 完整实现AWS4-HMAC-SHA256签名算法
- 📡 **HTTP客户端**: 使用axios进行API请求
- 🔄 **异步任务处理**: 支持任务提交和状态轮询
- 🛡️ **错误处理**: 完善的错误处理和日志记录

### 开发者信息
在浏览器控制台中可以看到：
- API请求和响应的完整日志
- 火山引擎签名认证的详细信息
- 任务状态的实时更新

## 构建部署

```bash
npm run build
```

生成的文件位于 `dist/` 目录，可直接部署到静态文件服务器。
