# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

카카오톡 커뮤니티 채팅방 CSV 파일을 업로드하면 OpenAI GPT-4o-mini로 분석하여 요약, 액션 아이템, 주요 토픽, 활성 사용자/분위기를 대시보드로 표시하는 Next.js 앱.

## 환경 설정

`.env.local` 파일에 OpenAI API 키 필요:
```
OPENAI_API_KEY=sk-...
```

## 주요 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 아키텍처

[`architecture.md`](architecture.md) 참조.
