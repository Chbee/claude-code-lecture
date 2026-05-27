import { describe, it, expect, vi, beforeEach } from "vitest";
import { postFeedback } from "@/lib/api/axios-client";

describe("postFeedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("성공 응답 시 JSON 데이터를 반환하고 올바른 요청을 보낸다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "abc", savedAt: "2026-01-01" }),
    }));

    const result = await postFeedback({ conceptSlug: "agent-loop", rating: 5 });

    expect(fetch).toHaveBeenCalledWith("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conceptSlug: "agent-loop", rating: 5 }),
    });
    expect(result).toEqual({ id: "abc", savedAt: "2026-01-01" });
  });

  it("comment가 있을 때 요청 body에 포함된다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "xyz", savedAt: "2026-01-01" }),
    }));

    await postFeedback({ conceptSlug: "agent-loop", rating: 4, comment: "좋아요" });

    expect(fetch).toHaveBeenCalledWith("/api/feedback", expect.objectContaining({
      body: JSON.stringify({ conceptSlug: "agent-loop", rating: 4, comment: "좋아요" }),
    }));
  });

  it("4xx 응답 시 Error를 throw한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    }));

    await expect(
      postFeedback({ conceptSlug: "agent-loop", rating: 3 })
    ).rejects.toThrow("postFeedback failed: 400");
  });

  it("5xx 응답 시 Error를 throw한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }));

    await expect(
      postFeedback({ conceptSlug: "agent-loop", rating: 3 })
    ).rejects.toThrow("postFeedback failed: 500");
  });

  it("응답 body가 유효하지 않은 JSON이면 Error를 throw한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => { throw new SyntaxError("Unexpected token"); },
    }));

    await expect(
      postFeedback({ conceptSlug: "agent-loop", rating: 3 })
    ).rejects.toThrow("postFeedback failed: invalid JSON response");
  });

  it("네트워크 오류 시 에러가 그대로 전파된다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(
      postFeedback({ conceptSlug: "agent-loop", rating: 3 })
    ).rejects.toThrow("Failed to fetch");
  });
});
