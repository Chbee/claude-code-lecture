import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export interface TemplateResult {
  file: string;
  completed: boolean;
}

export function checkCompletion(content: string): boolean {
  if (!content.trim()) return false;

  const lines = content.split("\n");
  const valueLines = lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("<!--")) {
      return false;
    }
    return /^-\s/.test(trimmed);
  });

  if (valueLines.length === 0) return false;

  const filledLines = valueLines.filter((line) => {
    const match = line.match(/^-\s*(?:\[.\])?\s*(.+?):\s*(.+)/);
    return match !== null && match[2].trim().length > 0;
  });

  return filledLines.length > 0;
}

export function calculateProgress(results: TemplateResult[]): number {
  if (results.length === 0) return 0;
  const completed = results.filter((r) => r.completed).length;
  return Math.round((completed / results.length) * 100);
}

export function formatReport(results: TemplateResult[]): string {
  if (results.length === 0) {
    return "템플릿 파일을 찾을 수 없습니다.";
  }

  const groups = new Map<string, TemplateResult[]>();
  for (const result of results) {
    const parts = result.file.split("/");
    const chapter = parts.slice(0, 2).join("/");
    if (!groups.has(chapter)) groups.set(chapter, []);
    groups.get(chapter)!.push(result);
  }

  const lines: string[] = ["📊 학습 진행률 리포트", ""];

  for (const [chapter, items] of groups) {
    const done = items.filter((i) => i.completed).length;
    const bar = items.map((i) => (i.completed ? "✅" : "⬜")).join("");
    lines.push(`  ${chapter}  ${bar}  (${done}/${items.length})`);
  }

  const total = results.filter((r) => r.completed).length;
  lines.push("");
  lines.push(`  전체: ${total}/${results.length} 완료 (${calculateProgress(results)}%)`);

  return lines.join("\n");
}

export function scanTemplates(rootDir: string): TemplateResult[] {
  const results: TemplateResult[] = [];

  function walk(dir: string) {
    for (const entry of readdirSync(dir)) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry.endsWith(".md") && dir.includes("templates")) {
        const content = readFileSync(fullPath, "utf-8");
        results.push({
          file: relative(rootDir, fullPath),
          completed: checkCompletion(content),
        });
      }
    }
  }

  walk(rootDir);
  return results;
}

const isMain = fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const rootDir = process.argv[2] || process.cwd();
  const results = scanTemplates(rootDir);
  console.log(formatReport(results));
}
