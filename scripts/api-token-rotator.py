#!/usr/bin/env python3
"""
API Token 智能轮换器
监控 token 过期时间，自动禁用即将过期的账号
"""
import json
import os
from datetime import datetime, timedelta
from pathlib import Path

AUTH_DIR = Path("/home/ubuntu/.cli-proxy-api")
LOG_FILE = Path("/home/ubuntu/.openclaw/workspace/logs/token-rotation.log")
WARN_DAYS = 2  # 提前2天警告

def log(msg):
    LOG_FILE.parent.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOG_FILE, "a") as f:
        f.write(f"[{timestamp}] {msg}\n")
    print(f"[{timestamp}] {msg}")

def check_and_rotate():
    now = datetime.now()
    accounts = []
    
    for json_file in AUTH_DIR.glob("*.json"):
        if json_file.name.endswith(".tmp"):
            continue
        
        try:
            with open(json_file) as f:
                data = json.load(f)
            
            expired_str = data.get("expired", "")
            disabled = data.get("disabled", False)
            email = data.get("email", json_file.stem)
            
            # 解析过期时间
            expired_dt = datetime.strptime(expired_str.split("+")[0], "%Y-%m-%dT%H:%M:%S")
            days_left = (expired_dt - now).days
            
            accounts.append({
                "file": json_file,
                "email": email,
                "expired": expired_dt,
                "days_left": days_left,
                "disabled": disabled
            })
        except Exception as e:
            log(f"❌ 解析失败 {json_file.name}: {e}")
    
    # 按剩余天数排序
    accounts.sort(key=lambda x: x["days_left"], reverse=True)
    
    active_count = sum(1 for a in accounts if not a["disabled"] and a["days_left"] > 0)
    log(f"📊 总账号: {len(accounts)} | 可用: {active_count}")
    
    for acc in accounts:
        status = "🔴 已禁用" if acc["disabled"] else "🟢 活跃"
        if acc["days_left"] < 0:
            status = "⚫ 已过期"
        elif acc["days_left"] <= WARN_DAYS:
            status = "🟡 即将过期"
        
        log(f"  {status} {acc['email'][:20]:20s} | 剩余 {acc['days_left']:3d} 天")
        
        # 自动禁用过期账号
        if acc["days_left"] < 0 and not acc["disabled"]:
            acc["disabled"] = True
            with open(acc["file"]) as f:
                data = json.load(f)
            data["disabled"] = True
            with open(acc["file"], "w") as f:
                json.dump(data, f, indent=2)
            log(f"  ⚠️  已自动禁用过期账号: {acc['email']}")

if __name__ == "__main__":
    check_and_rotate()
