#!/usr/bin/env python3
import requests
import sys
import json

API_BASE = "http://localhost:8317/v1"
API_KEY = "sk-proxy-demo-key-001"

def chat(message, model="gpt-5.2"):
    response = requests.post(
        f"{API_BASE}/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        },
        json={
            "model": model,
            "messages": [{"role": "user", "content": message}],
            "stream": False
        }
    )
    
    if response.status_code == 200:
        data = response.json()
        return data["choices"][0]["message"]["content"]
    else:
        return f"Error: {response.status_code} - {response.text}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python gpt52_proxy.py 'your question'")
        sys.exit(1)
    
    question = " ".join(sys.argv[1:])
    answer = chat(question)
    print(answer)
