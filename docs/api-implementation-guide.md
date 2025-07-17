# 即梦AI API 实现指南

## 概述

本项目集成了即梦AI的文生视频API，但由于需要火山引擎签名认证，当前实现为模拟版本。在生产环境中，需要后端服务来处理API认证和调用。

## 即梦AI API 格式

### 1. 文生视频 API

**提交任务**
```
POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31

Request Body:
{
    "req_key": "jimeng_vgfm_t2v_l20",
    "prompt": "视频描述文本",
    "seed": -1,
    "aspect_ratio": "16:9"
}
```

**查询任务状态**
```
POST https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31

Request Body:
{
    "req_key": "jimeng_vgfm_t2v_l20", 
    "task_id": "任务ID"
}
```

### 2. 图生视频 API

**提交任务**
```
POST https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31

Request Body:
{
    "req_key": "jimeng_vgfm_i2v_l20",
    "prompt": "视频描述文本",
    "image": "base64编码的图片",
    "seed": -1,
    "aspect_ratio": "16:9"
}
```

## 火山引擎签名认证

即梦AI API需要使用火山引擎的签名认证，主要包括：

### 必需的Header参数
- `Authorization`: 签名认证信息
- `X-Date`: 请求时间戳
- `X-Content-Sha256`: 请求内容的SHA256哈希值
- `Content-Type`: application/json

### 签名计算步骤
1. 创建规范请求(Canonical Request)
2. 创建待签名字符串(String to Sign)
3. 计算签名(Calculate Signature)
4. 构建Authorization Header

## 生产环境实现建议

### 后端API代理

创建后端API服务来代理即梦AI的调用：

```javascript
// 后端API示例 (Node.js)
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

const app = express();

// 文生视频API
app.post('/api/text-to-video/submit', async (req, res) => {
    try {
        const { prompt, seed, aspect_ratio } = req.body;
        
        const requestBody = {
            req_key: "jimeng_vgfm_t2v_l20",
            prompt,
            seed: seed || -1,
            aspect_ratio: aspect_ratio || '16:9'
        };
        
        const headers = generateVolcengineHeaders(requestBody);
        
        const response = await axios.post(
            'https://visual.volcengineapi.com?Action=CVSync2AsyncSubmitTask&Version=2022-08-31',
            requestBody,
            { headers }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 查询任务状态API
app.post('/api/task/status', async (req, res) => {
    try {
        const { task_id } = req.body;
        
        const requestBody = {
            req_key: "jimeng_vgfm_t2v_l20",
            task_id
        };
        
        const headers = generateVolcengineHeaders(requestBody);
        
        const response = await axios.post(
            'https://visual.volcengineapi.com?Action=CVSync2AsyncGetResult&Version=2022-08-31',
            requestBody,
            { headers }
        );
        
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function generateVolcengineHeaders(requestBody) {
    // 实现火山引擎签名认证逻辑
    // 参考：https://www.volcengine.com/docs/6348/65775
    
    const accessKey = process.env.VOLCENGINE_ACCESS_KEY;
    const secretKey = process.env.VOLCENGINE_SECRET_KEY;
    const region = 'cn-north-1';
    const service = 'cv';
    
    // 签名计算逻辑...
    
    return {
        'Content-Type': 'application/json',
        'Authorization': `AWS4-HMAC-SHA256 Credential=${accessKey}/${dateStamp}/${region}/${service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`,
        'X-Date': isoDate,
        'X-Content-Sha256': contentSha256
    };
}
```

### 前端调用更新

更新前端代码调用后端API：

```typescript
// 更新 src/services/api.ts
export const jimengApi = {
  async generateTextToVideo(request: TextToVideoRequest): Promise<GenerationResponse> {
    try {
      const response = await axios.post('/api/text-to-video/submit', {
        prompt: request.prompt,
        seed: request.seed || -1,
        aspect_ratio: request.aspect_ratio || '16:9'
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },

  async checkStatus(task_id: string): Promise<GenerationResponse> {
    try {
      const response = await axios.post('/api/task/status', {
        task_id
      });
      
      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
};
```

## 环境变量配置

在生产环境中需要配置：

```bash
# 火山引擎认证
VOLCENGINE_ACCESS_KEY=your_access_key
VOLCENGINE_SECRET_KEY=your_secret_key

# 即梦AI API Key (如果需要)
JIMENG_API_KEY=your_api_key
```

## 注意事项

1. **安全性**: 绝不要在前端代码中暴露API密钥
2. **CORS**: 配置正确的CORS策略
3. **错误处理**: 实现完整的错误处理和重试机制
4. **日志记录**: 记录API调用日志用于调试
5. **限流**: 实现合理的API调用限流

## 相关文档

- [即梦AI API 文档](https://www.volcengine.com/docs/85621/1538636)
- [火山引擎签名认证](https://www.volcengine.com/docs/6348/65775)
- [HTTP 请求示例](https://www.volcengine.com/docs/6348/65776)