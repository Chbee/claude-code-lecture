"use client";

import { useState, useCallback } from "react";
import {
  parseKakaoCSV,
  prepareForAnalysis,
  type ParseResult,
} from "@/lib/kakao-parser";

interface ActionItem {
  user: string;
  question: string;
  context: string;
}

interface Topic {
  title: string;
  description: string;
  messageCount: number;
}

interface Activity {
  topUsers: { name: string; count: number }[];
  mood: string;
  moodScore: number;
}

interface AnalysisResult {
  summary: string;
  actionItems: ActionItem[];
  topics: Topic[];
  activity: Activity;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    setAnalysis(null);
    setError(null);
    setCheckedItems(new Set());

    const text = await f.text();
    const result = parseKakaoCSV(text);
    setParseResult(result);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleAnalyze = async () => {
    if (!parseResult) return;
    setLoading(true);
    setError(null);

    try {
      const chatText = prepareForAnalysis(parseResult.messages);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatText,
          messageCount: parseResult.filteredCount,
          dateRange: parseResult.dateRange,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "분석 실패");
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const moodColor = (score: number) => {
    if (score >= 7) return "text-green-600 bg-green-50 border-green-200";
    if (score >= 4) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          KakaoTalk Chat Analyzer
        </h1>
        <p className="text-sm text-gray-500">
          커뮤니티 채팅방 분석 대시보드
        </p>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {/* Upload Area */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
          onClick={() => document.getElementById("fileInput")?.click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-600 font-medium">
            카카오톡 내보내기 파일을 드래그하거나 클릭하여 업로드
          </p>
          <p className="text-sm text-gray-400 mt-1">CSV 또는 TXT 파일</p>
        </div>

        {/* File Info */}
        {parseResult && file && (
          <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">📄</span>
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  메시지 {parseResult.filteredCount.toLocaleString()}개 (전체{" "}
                  {parseResult.totalCount.toLocaleString()}개) · 참여자{" "}
                  {parseResult.uniqueUsers}명
                  {parseResult.dateRange &&
                    ` · ${parseResult.dateRange.start.split(" ")[0]} ~ ${parseResult.dateRange.end.split(" ")[0]}`}
                </p>
              </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  분석 중...
                </span>
              ) : (
                "분석 시작"
              )}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Dashboard */}
        {analysis && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">📋</span> 전체 대화 요약
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {analysis.summary}
              </p>
            </div>

            {/* Action Items Card */}
            <div className="bg-white rounded-xl border-2 border-orange-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-orange-500">❗</span> 답변/대응 필요
                <span className="ml-auto text-sm font-normal text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  {analysis.actionItems.length}건
                </span>
              </h2>
              {analysis.actionItems.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  답변이 필요한 항목이 없습니다.
                </p>
              ) : (
                <ul className="space-y-3">
                  {analysis.actionItems.map((item, idx) => (
                    <li
                      key={idx}
                      className={`flex gap-3 p-3 rounded-lg transition-colors ${checkedItems.has(idx) ? "bg-gray-50 opacity-60" : "bg-orange-50/50"}`}
                    >
                      <input
                        type="checkbox"
                        checked={checkedItems.has(idx)}
                        onChange={() => toggleCheck(idx)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-medium text-sm ${checkedItems.has(idx) ? "line-through text-gray-400" : "text-gray-900"}`}
                        >
                          <span className="text-orange-600">{item.user}</span>:{" "}
                          {item.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.context}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Topics Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-purple-500">🏷️</span> 주요 토픽/이슈
              </h2>
              <div className="space-y-3">
                {analysis.topics.map((topic, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="shrink-0 mt-0.5 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {topic.messageCount}건
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {topic.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {topic.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-500">👥</span> 활성 사용자/분위기
              </h2>

              {/* Mood */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium mb-4 ${moodColor(analysis.activity.moodScore)}`}
              >
                <span>
                  {analysis.activity.moodScore >= 7
                    ? "😊"
                    : analysis.activity.moodScore >= 4
                      ? "😐"
                      : "😟"}
                </span>
                {analysis.activity.mood} ({analysis.activity.moodScore}/10)
              </div>

              {/* Top Users */}
              <div className="space-y-2">
                {analysis.activity.topUsers.map((user, idx) => {
                  const maxCount = analysis.activity.topUsers[0]?.count || 1;
                  const width = Math.max(
                    (user.count / maxCount) * 100,
                    8
                  );
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 w-32 truncate shrink-0">
                        {user.name}
                      </span>
                      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                        <div
                          className="bg-green-400 h-full rounded-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${width}%` }}
                        >
                          <span className="text-[10px] font-medium text-green-900">
                            {user.count}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
