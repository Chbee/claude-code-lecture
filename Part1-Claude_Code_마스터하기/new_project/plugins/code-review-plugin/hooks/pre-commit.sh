#!/bin/bash
# Claude Code pre-commit hook
# git commit 명령 감지 시 lint / build / test 자동 실행

set -uo pipefail

# ── stdin에서 tool 입력 파싱 ────────────────────────────────
INPUT=$(cat)
BASH_CMD=$(echo "$INPUT" | python3 -c \
  "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" \
  2>/dev/null || echo "")

# git commit / push 가 아니면 통과
if ! echo "$BASH_CMD" | grep -qE "git (commit|push)"; then
  exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Pre-commit 검사 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
FAILED=0

# ── Lint ────────────────────────────────────────────────────
echo ""
echo "▶ Lint"
if [ -f package.json ] && python3 -c "import json,sys; d=json.load(open('package.json')); sys.exit(0 if 'lint' in d.get('scripts',{}) else 1)" 2>/dev/null; then
  npm run lint && echo "  ✅ lint 통과" || { echo "  ❌ lint 실패"; FAILED=1; }
elif command -v htmlhint &>/dev/null && ls ./*.html &>/dev/null; then
  htmlhint ./*.html && echo "  ✅ htmlhint 통과" || { echo "  ❌ htmlhint 실패"; FAILED=1; }
else
  echo "  ⏭  lint 설정 없음 — 건너뜀"
fi

# ── Build ───────────────────────────────────────────────────
echo ""
echo "▶ Build"
if [ -f package.json ] && python3 -c "import json,sys; d=json.load(open('package.json')); sys.exit(0 if 'build' in d.get('scripts',{}) else 1)" 2>/dev/null; then
  npm run build && echo "  ✅ build 통과" || { echo "  ❌ build 실패"; FAILED=1; }
else
  echo "  ⏭  build 설정 없음 — 건너뜀"
fi

# ── Test ────────────────────────────────────────────────────
echo ""
echo "▶ Test"
if [ -f package.json ] && python3 -c "import json,sys; d=json.load(open('package.json')); sys.exit(0 if 'test' in d.get('scripts',{}) else 1)" 2>/dev/null; then
  npm test && echo "  ✅ test 통과" || { echo "  ❌ test 실패"; FAILED=1; }
else
  echo "  ⏭  test 설정 없음 — 건너뜀"
fi

# ── 결과 ────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$FAILED" -ne 0 ]; then
  echo "❌ 커밋 전 검사 실패 — 위 오류를 수정 후 다시 커밋하세요."
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  exit 2   # exit 2 = Claude Code가 tool 실행을 차단
fi

echo "✅ 모든 검사 통과 — 커밋 진행"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
exit 0
