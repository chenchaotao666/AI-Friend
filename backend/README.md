# VolcEngine API Backend Service

这是一个用于处理VolcEngine API调用的Python Flask后端服务。

## 安装依赖

```bash
pip install -r requirements.txt
```

## 配置环境变量

在 `.env` 文件中配置你的VolcEngine API密钥：

```
VOLCENGINE_ACCESS_KEY=your_access_key_here
VOLCENGINE_SECRET_KEY=your_secret_key_here
```

## 运行服务

```bash
python app.py
```

服务将在 `http://localhost:5000` 启动。

## API端点

### 1. 文本生成视频
- **URL**: `/api/text-to-video`
- **方法**: POST
- **请求体**:
```json
{
  "prompt": "一个美丽的日落",
  "seed": -1,
  "aspect_ratio": "16:9"
}
```

### 2. 图像生成视频
- **URL**: `/api/image-to-video`
- **方法**: POST
- **请求体**:
```json
{
  "prompt": "描述文本",
  "imageBase64": "base64编码的图像",
  "seed": -1,
  "aspect_ratio": "16:9"
}
```

### 3. 检查任务状态
- **URL**: `/api/check-status`
- **方法**: POST
- **请求体**:
```json
{
  "task_id": "任务ID"
}
```

### 4. 生成图像
- **URL**: `/api/generate-image`
- **方法**: POST
- **请求体**:
```json
{
  "prompt": "一个美丽的风景"
}
```

### 5. VolcEngine API代理
- **URL**: `/api/volcengine`
- **方法**: POST
- **查询参数**: 原始API查询参数
- **请求体**: 原始API请求体

## 健康检查
- **URL**: `/health`
- **方法**: GET