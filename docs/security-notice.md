# 安全说明

⚠️ **重要安全提醒**

## 前端API密钥安全风险

本项目在前端直接使用火山引擎的Access Key和Secret Key进行API调用。这种实现方式存在**严重的安全风险**：

### 风险说明
1. **密钥暴露**: 前端代码会被用户浏览器完全访问，API密钥可能被提取
2. **滥用风险**: 恶意用户可能获取密钥并滥用您的API配额
3. **费用损失**: 可能导致意外的API调用费用

### 生产环境建议

#### 1. 使用后端代理
```javascript
// 推荐的后端API代理实现
app.post('/api/text-to-video', async (req, res) => {
    // 在后端处理火山引擎认证
    const result = await callJimengAPI(req.body);
    res.json(result);
});
```

#### 2. 环境变量保护
```bash
# 仅在开发环境使用
VITE_VOLCENGINE_ACCESS_KEY=development_key_only
VITE_VOLCENGINE_SECRET_KEY=development_secret_only
```

#### 3. 访问控制
- 限制API调用来源
- 实现用户认证和授权
- 设置API调用限额

#### 4. 监控和告警
- 监控API调用频率
- 设置异常调用告警
- 定期轮换API密钥

## 当前实现说明

本项目的前端直接调用实现**仅用于开发和演示目的**。在生产环境中，必须：

1. 将API调用逻辑移至后端
2. 使用环境变量管理敏感信息
3. 实现适当的访问控制
4. 进行安全审计

## 替代方案

### 方案1: 完全后端化
```
Frontend → Backend API → 火山引擎API
```

### 方案2: 使用临时凭证
```
Frontend → 认证服务 → 获取临时Token → 火山引擎API
```

### 方案3: 服务端代理
```
Frontend → 代理服务 → 火山引擎API
```

## 开发环境使用指南

如果仅用于开发和测试：

1. 使用测试用的API密钥
2. 限制API调用配额
3. 定期更换密钥
4. 不要在公共环境中部署

## 联系方式

如有安全相关问题，请联系开发团队。