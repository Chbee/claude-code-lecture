# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 실행

```bash
open index.html   # 브라우저에서 직접 열기 (빌드 불필요)
```

빌드·번들러·패키지 매니저 없음. `index.html` 더블클릭만으로 실행된다.

## 아키텍처

단일 파일 앱: `index.html` 하나에 HTML·CSS·JS가 인라인으로 모두 포함된다.

### JS 구조 (index.html `<script>` 블록)

| 영역 | 핵심 함수 |
|------|-----------|
| 상태 | `filter` (선택된 카테고리 배열), `history` (최근 10건), `angle` (누적 회전 라디안) |
| 데이터 | `MENUS` 객체 — 4개 카테고리 × 6~8개 하드코딩 메뉴 |
| localStorage | `load(key, fallback)` / `persist(key, val)` — try-catch 방어 포함 |
| 렌더링 | `draw()` — Canvas 전체 재그리기, `drawPointer()` — 12시 방향 포인터 |
| 스핀 | `spinRoulette()` — `requestAnimationFrame` + easeOutQuart 감속 |
| 후보 계산 | `getCandidates()` — 필터 + 직전 3개 제외, 후보 0개 시 전체 풀 fallback |

### Canvas 회전 수학

섹터는 `-π/2`(12시)부터 그려진다. 특정 섹터 `ti`를 12시에 맞추는 finalAngle:

```
finalAngle = currentAngle + delta + extraSpins
delta      = (targetNorm - curNorm + 2π) % 2π   // 항상 양수
targetNorm = (-((ti + 0.5) * sectorAngle)) % 2π
```

결과 섹터가 12시에 오면 해당 텍스트의 canvas 회전값이 자동으로 0이 되어 수평으로 읽힌다.

### localStorage 키

| 키 | 값 |
|----|-----|
| `roulette_filter` | `string[]` — 선택된 카테고리 |
| `roulette_history` | `{name, cat, time}[]` — 최대 10건, 오래된 것 shift |

## Claude Code 설정

### 훅 (`.claude/settings.json`)

`git commit` 또는 `git push` Bash 명령 실행 전 `.claude/hooks/pre-commit.sh`가 자동 실행된다.
순서: lint → build → test. 각 단계는 `package.json` 스크립트 유무를 확인 후 없으면 건너뜀.
실패 시 `exit 2`로 Claude의 커밋 실행을 차단한다.

### 커스텀 스킬 (`.claude/commands/`)

- `/code-review [파일]` — 버그·보안·성능·품질 4개 축으로 구조화된 리뷰 리포트 생성

### 서브 에이전트 (`.claude/agents/`)

- `code-reviewer` — Bash·Read 도구만 사용하는 코드 리뷰 전용 에이전트. 코드 변경 후 리뷰가 필요할 때 proactively 실행.
