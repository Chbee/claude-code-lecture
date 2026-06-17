import Papa from "papaparse";

export interface ChatMessage {
  date: string;
  user: string;
  message: string;
}

export interface ParseResult {
  messages: ChatMessage[];
  totalCount: number;
  filteredCount: number;
  dateRange: { start: string; end: string } | null;
  uniqueUsers: number;
}

const SYSTEM_PATTERNS = [
  "님이 들어왔습니다",
  "님이 나갔습니다",
  "님을 초대했습니다",
  "채팅방 관리자가 메시지를 가렸습니다",
  "삭제된 메시지입니다",
];

const SKIP_MESSAGES = ["이모티콘", "사진", "동영상", "파일"];

function isSystemMessage(message: string): boolean {
  return SYSTEM_PATTERNS.some((p) => message.includes(p));
}

function isSkippableMessage(message: string): boolean {
  return SKIP_MESSAGES.some((s) => message.trim() === s);
}

export function parseKakaoCSV(csvText: string): ParseResult {
  const parsed = Papa.parse<{ Date: string; User: string; Message: string }>(
    csvText,
    {
      header: true,
      skipEmptyLines: true,
    }
  );

  const totalCount = parsed.data.length;

  const messages: ChatMessage[] = parsed.data
    .filter((row) => row.Date && row.User && row.Message)
    .filter((row) => !isSystemMessage(row.Message))
    .filter((row) => !isSkippableMessage(row.Message))
    .map((row) => ({
      date: row.Date,
      user: row.User,
      message: row.Message,
    }));

  const uniqueUsers = new Set(messages.map((m) => m.user)).size;

  const dateRange =
    messages.length > 0
      ? { start: messages[0].date, end: messages[messages.length - 1].date }
      : null;

  return {
    messages,
    totalCount,
    filteredCount: messages.length,
    dateRange,
    uniqueUsers,
  };
}

const MAX_CHARS = 80000;

export function prepareForAnalysis(messages: ChatMessage[]): string {
  const lines = messages.map(
    (m) => `[${m.date}] ${m.user}: ${m.message}`
  );

  let result = lines.join("\n");

  if (result.length > MAX_CHARS) {
    const truncated: string[] = [];
    let charCount = 0;

    for (let i = lines.length - 1; i >= 0; i--) {
      if (charCount + lines[i].length + 1 > MAX_CHARS) break;
      truncated.unshift(lines[i]);
      charCount += lines[i].length + 1;
    }

    result = truncated.join("\n");
  }

  return result;
}
