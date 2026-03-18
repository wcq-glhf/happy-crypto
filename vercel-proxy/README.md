# Vercel Proxy 部署指南

## 快速部署

1. 安装 Vercel CLI：
```bash
npm i -g vercel
```

2. 部署：
```bash
cd vercel-proxy
vercel
```

3. 设置环境变量（在 Vercel Dashboard）：
- `UPSTREAM_URL`: 上游 API 地址
- `API_KEY`: 默认 API 密钥

## 本地测试

```bash
vercel dev
```

访问 http://localhost:3000
