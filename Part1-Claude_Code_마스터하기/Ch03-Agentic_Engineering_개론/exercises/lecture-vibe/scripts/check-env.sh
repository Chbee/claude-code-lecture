#!/bin/bash
VIBE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$VIBE_DIR"

echo "=== 환경 변수 ==="
if [ -f .env.local ]; then
  echo "✓ .env.local 존재"
  grep -q "OPENAI_API_KEY=sk-" .env.local 2>/dev/null && echo "✓ OPENAI_API_KEY 설정됨" || echo "✗ OPENAI_API_KEY 없음 또는 형식 오류"
else
  echo "✗ .env.local 없음"
fi

echo ""
echo "=== Dev 서버 ==="
if pgrep -f "next dev" > /dev/null; then
  echo "✓ 실행 중 → http://localhost:3000"
else
  echo "✗ 꺼져 있음 (npm run dev 로 시작)"
fi

echo ""
echo "=== Git 상태 ==="
git status --short | head -8
echo ""
git log --oneline -3
