import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `당신은 카카오톡 커뮤니티 채팅방의 대화를 분석하는 전문가입니다.
방장의 관점에서 채팅 내용을 분석하여 아래 4가지 항목을 JSON으로 반환하세요.

반드시 아래 JSON 형식으로만 응답하세요:

{
  "summary": "전체 대화 요약 (3-5문장으로 핵심 논의 사항 정리)",
  "actionItems": [
    {
      "user": "질문/요청한 사용자 이름",
      "question": "질문이나 요청 내용 요약",
      "context": "관련 맥락 한 줄"
    }
  ],
  "topics": [
    {
      "title": "토픽 제목",
      "description": "토픽에 대한 간단 설명",
      "messageCount": 대략적인_관련_메시지_수
    }
  ],
  "activity": {
    "topUsers": [
      { "name": "사용자 이름", "count": 메시지_수 }
    ],
    "mood": "전반적 분위기 설명 (예: 활발하고 긍정적)",
    "moodScore": 1에서10사이_숫자
  }
}

주의사항:
- actionItems는 답변이 없거나 후속 조치가 필요한 질문/요청에 집중하세요
- topics는 최대 5개까지만 추출하세요
- topUsers는 메시지 수 기준 상위 5명만 포함하세요
- moodScore는 1(매우 부정적)~10(매우 긍정적) 사이 숫자입니다`;

export async function POST(request: NextRequest) {
  try {
    const { chatText, messageCount, dateRange } = await request.json();

    if (!chatText) {
      return NextResponse.json(
        { error: "채팅 데이터가 없습니다." },
        { status: 400 }
      );
    }

    const userPrompt = `다음은 카카오톡 커뮤니티 채팅방의 대화 내용입니다.
총 ${messageCount}개의 메시지가 있으며, 기간은 ${dateRange?.start || "알 수 없음"} ~ ${dateRange?.end || "알 수 없음"} 입니다.

--- 대화 내용 ---
${chatText}
--- 대화 끝 ---

위 대화를 분석하여 JSON으로 응답해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "AI 응답이 비어있습니다." },
        { status: 500 }
      );
    }

    const analysis = JSON.parse(content);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
