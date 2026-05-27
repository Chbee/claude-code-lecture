export type FeedbackPayload = {
  conceptSlug: string;
  rating: number;
  comment?: string;
};

export async function postFeedback(payload: FeedbackPayload) {
  const res = await fetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`postFeedback failed: ${res.status}`);
  }
  try {
    return await res.json();
  } catch {
    throw new Error("postFeedback failed: invalid JSON response");
  }
}
