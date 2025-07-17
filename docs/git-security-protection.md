# Git 安全保护说明

## 问题描述

在推送代码到 GitHub 时遇到了 `GH013: Repository rule violations found` 错误，这是因为 GitHub 的推送保护机制检测到了代码中包含敏感信息（API 密钥）。

## 错误信息

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - GITHUB PUSH PROTECTION
remote:   Push cannot contain secrets
remote:   —— VolcEngine Access Key ID ——————————————————————————
remote:    locations:
remote:      - commit: 885031de15ea8a207aca12fdb9a5c4eee6f1599b
remote:        path: .env:2
```

## 解决方案

### 1. 添加 .gitignore 规则

确保 `.env` 文件被 Git 忽略：

```gitignore
# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. 从 Git 跟踪中移除敏感文件

```bash
git rm --cached .env
```

### 3. 清理 .env 文件

移除真实的 API 密钥，只保留占位符：

```env
VITE_DEEPSEEK_API_KEY=sk-43fc565dd627428db42a1325b24886bd
VITE_VOLCENGINE_ACCESS_KEY=your_volcengine_access_key_here
VITE_VOLCENGINE_SECRET_KEY=your_volcengine_secret_key_here
```

### 4. 重写 Git 历史（如果需要）

如果历史提交中包含敏感信息，需要重写历史：

```bash
# 重置到问题提交之前
git reset --hard HEAD~1

# 重新提交干净的代码
git add .
git commit --amend -m "Clean commit message"
```

## 预防措施

### 1. 使用 .env.example 文件

创建示例配置文件：

```env
# .env.example
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
VITE_VOLCENGINE_ACCESS_KEY=your_volcengine_access_key_here
VITE_VOLCENGINE_SECRET_KEY=your_volcengine_secret_key_here
```

### 2. 本地开发配置

开发者应该：

1. 复制 `.env.example` 到 `.env`
2. 填入真实的 API 密钥
3. 确保 `.env` 在 `.gitignore` 中

### 3. 使用 Git Hooks

可以设置 pre-commit hooks 来检查敏感信息：

```bash
#!/bin/sh
# .git/hooks/pre-commit
if grep -r "AKLT" . --exclude-dir=.git; then
    echo "Error: Potential API key found!"
    exit 1
fi
```

## GitHub 推送保护

GitHub 的推送保护是一个安全功能，它会：

- 扫描提交中的敏感信息
- 阻止包含密钥的推送
- 提供解决方案链接
- 允许授权用户绕过保护（不推荐）

## 最佳实践

1. **永远不要提交真实的 API 密钥**
2. **使用环境变量管理敏感信息**
3. **定期审查 .gitignore 文件**
4. **使用 GitHub 的 Secret 功能存储 CI/CD 密钥**
5. **启用 GitHub 的依赖项漏洞扫描**

## 相关文档

- [GitHub Push Protection](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning)
- [Managing sensitive data in repositories](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Using environment variables](https://docs.github.com/en/actions/learn-github-actions/variables)