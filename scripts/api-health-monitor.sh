#!/bin/bash
# API Health Monitor - 监控 CLIProxyAPI 状态并记录

LOG_FILE="/home/ubuntu/.openclaw/workspace/logs/api-health.log"
API_BASE="http://localhost:8317"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始健康检查" >> "$LOG_FILE"

# 检查 API 服务状态
if curl -s -f "$API_BASE/management.html" > /dev/null 2>&1; then
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ API 服务正常" >> "$LOG_FILE"
else
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ API 服务异常，尝试重启" >> "$LOG_FILE"
    cd /home/ubuntu/.openclaw/workspace/CLIProxyAPI
    pkill -f cliproxyapi
    nohup ./cliproxyapi > cliproxyapi.log 2>&1 &
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🔄 重启命令已执行" >> "$LOG_FILE"
fi

# 统计当前可用账号数
AUTH_COUNT=$(ls -1 /home/ubuntu/.cli-proxy-api/*.json 2>/dev/null | grep -v ".tmp" | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📊 当前可用账号数: $AUTH_COUNT" >> "$LOG_FILE"
