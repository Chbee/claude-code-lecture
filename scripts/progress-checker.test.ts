import { describe, it, expect } from "vitest";
import { checkCompletion, calculateProgress, formatReport } from "./progress-checker";

describe("checkCompletion", () => {
  it("returns incomplete for template with only placeholders", () => {
    const content = `# My Level
<!-- 아래에 본인의 레벨을 적어주세요 -->

- 현재 레벨:
- 목표 레벨:
`;
    expect(checkCompletion(content)).toBe(false);
  });

  it("returns complete when placeholders are filled", () => {
    const content = `# My Level

- 현재 레벨: 중급
- 목표 레벨: 고급
`;
    expect(checkCompletion(content)).toBe(true);
  });

  it("returns incomplete for empty content", () => {
    expect(checkCompletion("")).toBe(false);
  });

  it("returns incomplete when list items have no values", () => {
    const content = `# Habit Tracker

- [ ] 습관 1:
- [ ] 습관 2:
`;
    expect(checkCompletion(content)).toBe(false);
  });
});

describe("calculateProgress", () => {
  it("returns 0% when no files are completed", () => {
    const results = [
      { file: "a.md", completed: false },
      { file: "b.md", completed: false },
    ];
    expect(calculateProgress(results)).toBe(0);
  });

  it("returns 100% when all files are completed", () => {
    const results = [
      { file: "a.md", completed: true },
      { file: "b.md", completed: true },
    ];
    expect(calculateProgress(results)).toBe(100);
  });

  it("returns correct percentage for partial completion", () => {
    const results = [
      { file: "a.md", completed: true },
      { file: "b.md", completed: false },
      { file: "c.md", completed: true },
      { file: "d.md", completed: false },
    ];
    expect(calculateProgress(results)).toBe(50);
  });

  it("returns 0 for empty results", () => {
    expect(calculateProgress([])).toBe(0);
  });
});

describe("formatReport", () => {
  it("formats a progress report with chapter grouping", () => {
    const results = [
      { file: "Part0/Ch01/templates/my-level.md", completed: true },
      { file: "Part0/Ch02/templates/my-workflow.md", completed: false },
      { file: "Part0/Ch02/templates/habit-tracker.md", completed: true },
    ];

    const report = formatReport(results);

    expect(report).toContain("Part0/Ch01");
    expect(report).toContain("Part0/Ch02");
    expect(report).toContain("2/3");
  });

  it("returns a no-files message for empty results", () => {
    const report = formatReport([]);
    expect(report).toContain("템플릿 파일을 찾을 수 없습니다");
  });
});
