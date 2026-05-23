#!/bin/bash

# TDD Guard Hook
# Edit/Write 전에 테스트가 먼저 작성/수정되었는지 확인합니다.

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

is_source_file() {
  local file="$1"
  case "$file" in
    *.ts|*.tsx|*.js|*.jsx|*.py|*.go|*.rs|*.java)
      case "$file" in
        *.test.*|*.spec.*|*_test.*|*_spec.*|*/test_*|*/__tests__/*) return 1 ;;
        *) return 0 ;;
      esac
      ;;
    *) return 1 ;;
  esac
}

if is_source_file "$FILE_PATH"; then
  BASE_NAME="${FILE_PATH%.*}"
  EXT="${FILE_PATH##*.}"
  DIR=$(dirname "$FILE_PATH")
  FILENAME=$(basename "$FILE_PATH" ".$EXT")

  TEST_PATTERNS=(
    "${BASE_NAME}.test.${EXT}"
    "${BASE_NAME}.spec.${EXT}"
    "${BASE_NAME}_test.${EXT}"
    "${DIR}/__tests__/${FILENAME}.test.${EXT}"
    "${DIR}/__tests__/${FILENAME}.spec.${EXT}"
    "${DIR}/test_${FILENAME}.${EXT}"
  )

  FOUND_TEST=false
  for pattern in "${TEST_PATTERNS[@]}"; do
    if [ -f "$pattern" ]; then
      FOUND_TEST=true
      break
    fi
  done

  if [ "$FOUND_TEST" = false ]; then
    REASON="TDD Guard: 소스 파일(${FILE_PATH})을 수정하려면 먼저 테스트 파일을 작성하세요!"
    echo "⚠️  $REASON" >&2
    jq -n --arg reason "$REASON" '{
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: $reason
      }
    }'
    exit 0
  fi
fi

exit 0
