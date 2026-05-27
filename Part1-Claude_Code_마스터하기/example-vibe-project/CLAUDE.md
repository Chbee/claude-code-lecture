# CLAUDE.md — 실습 프로젝트(example-vibe-project)

> 이 문서는 매 Claude 세션 시작 시 자동으로 로드됩니다.
> **목표 길이**: 100~200줄. 200줄을 넘으면 잘라낼 것을 우선 고려하세요.
> **원칙**: Claude가 코드를 읽으면 알 수 있는 정보는 적지 마세요 (예: 함수 시그니처 X, 인터페이스 정의 X).

마지막 업데이트: 2026-05-26

---

## 1. 절대 규칙 (3~5개)

- `console.log`와 같이 로그 출력 코드를 production 코드에 두지 말것
- 로깅은 `logger.ts`만 사용
- 수정 필요한 범위 외에 마음대로 수정 금지. 수정이 필요하다면 사용자에게 계획과 함께 승인 요청할것
- 새 의존성 추가 전에 `package.json`의 deny list 확인


---

## 2. 명령어 치트시트

```bash
# 빌드 / 개발 서버
npm run dev
npm run build

# 테스트
npm test                    # 전체
npm test -- --watch         # watch 모드
npm test path/to/file       # 단일 파일

# Lint / 타입체크
npm run lint
npm run typecheck
```

---

## 3. 아키텍처 한눈에

```
app/
  page.tsx                  # 홈: 개념 카드 그리드 + LiveConceptList
  layout.tsx                # 루트 레이아웃 (메타데이터, globals.css 임포트)
  globals.css               # CSS 변수(color, surface) + Tailwind 기반
  agent-loop/page.tsx       # /agent-loop — LoopDiagram + FeedbackForm
  memory-hierarchy/page.tsx # /memory-hierarchy — HierarchyStack
  api/
    concepts/route.ts       # GET /api/concepts → listConcepts()
    concepts/[slug]/route.ts# GET /api/concepts/:slug → findConcept()
    feedback/route.ts       # POST /api/feedback (stub, IDEAS.md #3에서 완성)
components/
  Card.tsx                  # 개념 페이지 링크 카드 (Server)
  LiveConceptList.tsx       # /api/concepts 목록 렌더링 (Client)
  FeedbackForm.tsx          # /api/feedback POST 폼 (Client, axios 사용)
  LoopDiagram.tsx           # 에이전트 루프 시각 다이어그램
  HierarchyStack.tsx        # CLAUDE.md 계층 시각 다이어그램
lib/
  concepts.ts               # listConcepts() / findConcept() — 개념 조회 진입점
  data/concepts.json        # 개념 정적 데이터 (slug·title·summary·tags)
  errors.ts                 # AppError { status, code } — API 라우트 에러 표준
  logger.ts                 # JSON 구조화 로거 { info / warn / error }
  api/
    fetch-client.ts         # fetchConcepts() — native fetch, 클라이언트용
    axios-client.ts         # postFeedback() — axios, 클라이언트용
tests/
  concepts.test.ts          # lib/concepts 단위 테스트 (vitest)
  errors.test.ts            # AppError 단위 테스트
```

**핵심 데이터 흐름**:
- 개념 목록: `concepts.json` → `lib/concepts.ts` → `api/concepts/` → `fetch-client.ts` → `LiveConceptList`
- 피드백: `FeedbackForm` → `axios-client.ts` → `api/feedback/` (현재 stub, 501 반환)

**핵심 모듈 3개**:
- `lib/concepts.ts` — 개념 조회 유일한 진입점. `concepts.json`을 직접 임포트하지 말 것.
- `lib/errors.ts` — API 라우트 에러는 반드시 `AppError`로 던질 것 (`[slug]/route.ts`가 아직 미준수 — 수정 대상).
- `lib/logger.ts` — 서버 로깅은 여기서만. `console.log` 직접 사용 금지.

---

## 4. 컨벤션

### 네이밍
- 파일: `kebab-case.ts`
- 컴포넌트: `PascalCase.tsx`
- hook: `useXxx.ts`
- 테스트: `<원본>.test.ts`

### 테스트
- 단위 테스트는 mocking OK
- 통합 테스트는 실제 DB (sqlite in-memory) — mocking 금지
- 모든 테스트는 `tests/` 아래, 절대 `src/` 안에 두지 않음

### 에러 처리
- API 라우트는 `lib/errors.ts`의 `AppError` 던지기
- catch 블록에서 무의미한 `console.log` 금지 — `logger.error`만

### 코드 스타일
- 주석 금지 — why가 명백히 비자명할 때만 한 줄 예외
- 타입 정의는 `interface` 대신 `type` 사용
- export는 named export만 (`export default` 금지, Next.js page 컴포넌트 제외)

---

## 5. 지금 진행 중 (TODO)

- [ ] `/agent-loop` 페이지에 단계별 호버 툴팁 추가
- [ ] `/memory-hierarchy` 페이지에 다크/라이트 토글

---

## 6. 참고 자료 (선택)

- 상세 아키텍처 도큐먼트: `@.claude/docs/architecture.md`
- 결제 모듈 deep dive: `@.claude/docs/payment.md`
- 온보딩 가이드: `@docs/onboarding.md`

> `@` 참조는 Claude가 필요할 때만 로드합니다 (lazy load). 이것이 CLAUDE.md를 짧게 유지하는 비결.
