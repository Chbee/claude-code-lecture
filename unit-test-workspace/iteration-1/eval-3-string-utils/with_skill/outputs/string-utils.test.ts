import { describe, it, expect } from "vitest";
import { slugify, truncate, parseQueryString } from "../string-utils";

describe("slugify", () => {
  it("converts text to lowercase hyphenated slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces multiple spaces and underscores with single hyphen", () => {
    expect(slugify("foo   bar__baz")).toBe("foo-bar-baz");
  });

  it("removes special characters", () => {
    expect(slugify("Hello, World! #2024")).toBe("hello-world-2024");
  });

  it("trims surrounding whitespace and hyphens", () => {
    expect(slugify("  --hello--  ")).toBe("hello");
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("truncate", () => {
  it("returns original text when within maxLength", () => {
    expect(truncate("short", 10)).toBe("short");
  });

  it("truncates and appends default suffix", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("uses custom suffix", () => {
    expect(truncate("hello world", 9, "~")).toBe("hello wo~");
  });

  it("returns original text when length equals maxLength", () => {
    expect(truncate("exact", 5)).toBe("exact");
  });
});

describe("parseQueryString", () => {
  it("parses key=value pairs", () => {
    expect(parseQueryString("foo=bar&baz=qux")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("handles leading question mark", () => {
    expect(parseQueryString("?name=alice&age=30")).toEqual({
      name: "alice",
      age: "30",
    });
  });

  it("decodes URI-encoded keys and values", () => {
    expect(parseQueryString("hello%20world=foo%26bar")).toEqual({
      "hello world": "foo&bar",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseQueryString("")).toEqual({});
  });

  it("returns empty object for lone question mark", () => {
    expect(parseQueryString("?")).toEqual({});
  });

  it("treats missing value as empty string", () => {
    expect(parseQueryString("key=&other")).toEqual({
      key: "",
      other: "",
    });
  });
});
