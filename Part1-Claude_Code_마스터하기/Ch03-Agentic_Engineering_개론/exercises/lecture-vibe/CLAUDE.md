# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

카카오톡 커뮤니티 채팅방 CSV 파일을 업로드하면 OpenAI GPT-4o-mini로 분석하여 요약, 액션 아이템, 주요 토픽, 활성 사용자/분위기를 대시보드로 표시하는 Next.js 앱.

## 환경 설정

`.env.local` 파일에 OpenAI API 키 필요:
```
OPENAI_API_KEY=sk-...
```

환경 상태 빠른 확인: `npm run info`

## 주요 명령어

```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run dev:restart  # 기존 서버 종료 후 재시작
npm run build        # 프로덕션 빌드
npm run lint         # ESLint 검사
npm run test         # Vitest 테스트
npm run check        # 타입체크 + 린트 동시
npm run info         # 환경변수·서버 상태·git 현황 한눈에 확인
```

### dev 서버 실행 시 주의
`npm run dev`는 blocking 명령이므로 Bash 도구 사용 시 반드시 `run_in_background: true` 옵션을 설정해야 함.

## 핵심 소스 파일

| 경로 | 역할 |
|------|------|
| `src/lib/kakao-parser.ts` | CSV 파싱 (`parseKakaoCSV`) 및 전처리 (`prepareForAnalysis`) |
| `src/app/page.tsx` | 단일 클라이언트 컴포넌트 — 파일 업로드 UI + 결과 대시보드 |
| `src/app/api/analyze/route.ts` | Next.js Route Handler — OpenAI 호출, `AnalysisResult` 반환 |
| `src/lib/kakao-parser.test.ts` | Vitest 테스트 |

## 아키텍처

[`architecture.md`](architecture.md) 참조.
