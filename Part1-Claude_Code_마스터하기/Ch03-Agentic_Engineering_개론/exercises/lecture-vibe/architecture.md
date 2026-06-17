# Architecture

## 기술 스택

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- PapaParse — CSV 파싱
- OpenAI SDK v6 — GPT-4o-mini `json_object` 모드 사용

## 데이터 흐름

```
[파일 업로드]
     │
     ▼
parseKakaoCSV()          ← src/lib/kakao-parser.ts
  시스템 메시지 필터링
  이모티콘/사진/동영상 제거
     │
     ▼
prepareForAnalysis()     ← src/lib/kakao-parser.ts
  80,000자 한도로 최신 메시지부터 역순 트림
     │
     ▼
POST /api/analyze        ← src/app/page.tsx (클라이언트 컴포넌트)
     │
     ▼
OpenAI gpt-4o-mini       ← src/app/api/analyze/route.ts
  JSON 구조화 출력
     │
     ▼
대시보드 렌더링           ← src/app/page.tsx
  요약 / 액션 아이템 / 토픽 / 활성 사용자
```

## 주요 모듈

| 경로 | 역할 |
|------|------|
| `src/lib/kakao-parser.ts` | CSV 파싱 및 전처리. `parseKakaoCSV()` / `prepareForAnalysis()` 노출 |
| `src/app/page.tsx` | 단일 클라이언트 컴포넌트. 파일 업로드 UI + 분석 결과 대시보드 |
| `src/app/api/analyze/route.ts` | Next.js Route Handler. OpenAI 호출 및 `AnalysisResult` 반환 |

## 카카오톡 CSV 형식

열 헤더가 `Date`, `User`, `Message`인 CSV. 영문 헤더 기준으로 파싱하므로 다른 로케일의 내보내기 파일은 별도 처리 필요.

API 라우트 상세는 [`src/app/api/CLAUDE.md`](src/app/api/CLAUDE.md) 참조.
