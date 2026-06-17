# API Routes

## POST /api/analyze

카카오톡 채팅 텍스트를 받아 OpenAI로 분석하고 구조화된 JSON을 반환.

**요청 바디:**
```json
{
  "chatText": "포맷된 채팅 텍스트",
  "messageCount": 1234,
  "dateRange": { "start": "2024-01-01 00:00:00", "end": "2024-03-31 23:59:59" }
}
```

**응답 (`AnalysisResult`):**
```json
{
  "summary": "3~5문장 요약",
  "actionItems": [{ "user": "이름", "question": "질문 내용", "context": "맥락" }],
  "topics": [{ "title": "토픽명", "description": "설명", "messageCount": 42 }],
  "activity": {
    "topUsers": [{ "name": "이름", "count": 100 }],
    "mood": "활발하고 긍정적",
    "moodScore": 8
  }
}
```

**모델:** `gpt-4o-mini`, `temperature: 0.3`, `response_format: json_object`

**시스템 프롬프트 방향:** 방장 관점에서 미답변 질문/요청을 `actionItems`로 추출하는 데 집중. `topics` 최대 5개, `topUsers` 상위 5명.

**환경변수:** `OPENAI_API_KEY` 필수 (`.env.local`).
