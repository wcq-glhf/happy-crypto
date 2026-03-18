const express = require('express');
const axios = require('axios');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

// 读取配置
const configPath = path.join(__dirname, '../CLIProxyAPI-new/config.yaml');
let config;
try {
  config = yaml.load(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Config loaded');
} catch (e) {
  console.error('❌ Config load failed:', e.message);
  process.exit(1);
}

const ADMIN_KEY = config['remote-management']?.['secret-key'] || 'admin123';
console.log('🔑 Admin key:', ADMIN_KEY);

// 静态文件
app.use(express.static(path.join(__dirname, '../Cli-Proxy-API-PLUS-Management-Center-new/dist')));

// 管理 API 验证
app.use('/v0/management', (req, res, next) => {
  const key = req.headers['x-management-key'];
  if (key === ADMIN_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// 管理 API 路由
app.get('/v0/management/config', (req, res) => {
  res.json(config);
});

app.put('/v0/management/config', (req, res) => {
  res.json({ success: true });
});

// OpenAI 代理
app.use('/v1', async (req, res) => {
  res.json({ error: 'Proxy not implemented yet' });
});

const PORT = config.port || 8317;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
