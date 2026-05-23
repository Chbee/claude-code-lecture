import { describe, it, expect } from "vitest";
import { slugify, truncate, parseQueryString } from "../../../../../.claude/skills/unit-test/evals/files/string-utils";

describe("slugify", () => {
  it("should convert text to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should replace spaces with hyphens", () => {
    expect(slugify("foo bar baz")).toBe("foo-bar-baz");
  });

  it("should replace underscores with hyphens", () => {
    expect(slugify("foo_bar_baz")).toBe("foo-bar-baz");
  });

  it("should remove special characters", () => {
    expect(slugify("hello! @world# $test")).toBe("hello-world-test");
  });

  it("should trim leading and trailing whitespace", () => {
    expect(slugify("  hello world  ")).toBe("hello-world");
  });

  it("should remove leading and trailing hyphens", () => {
    expect(slugify("--hello-world--")).toBe("hello-world");
  });

  it("should collapse multiple spaces into a single hyphen", () => {
    expect(slugify("hello   world")).toBe("hello-world");
  });

  it("should collapse mixed whitespace and underscores into a single hyphen", () => {
    expect(slugify("hello _ _ world")).toBe("hello-world");
  });

  it("should return empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("should return empty string for input with only special characters", () => {
    expect(slugify("!@#$%^&*()")).toBe("");
  });

  it("should handle a typical blog post title", () => {
    expect(slugify("My Blog Post: A Great Read!")).toBe(
      "my-blog-post-a-great-read"
    );
  });

  it("should handle already-slugified text", () => {
    expect(slugify("already-slugified")).toBe("already-slugified");
  });

  it("should handle single word", () => {
    expect(slugify("Hello")).toBe("hello");
  });

  it("should handle mixed case with numbers", () => {
    expect(slugify("Product 2024 Launch")).toBe("product-2024-launch");
  });
});

describe("truncate", () => {
  it("should return the original text if it is shorter than maxLength", () => {
    expect(truncate("hello", 10)).toBe("hello");
  });

  it("should return the original text if length equals maxLength", () => {
    expect(truncate("hello", 5)).toBe("hello");
  });

  it("should truncate text and append default suffix when text exceeds maxLength", () => {
    expect(truncate("hello world", 8)).toBe("hello...");
  });

  it("should truncate text and append custom suffix", () => {
    expect(truncate("hello world", 8, "--")).toBe("hello --");
  });

  it("should handle empty suffix", () => {
    expect(truncate("hello world", 5, "")).toBe("hello");
  });

  it("should handle maxLength equal to suffix length", () => {
    expect(truncate("hello world", 3)).toBe("...");
  });

  it("should handle empty string", () => {
    expect(truncate("", 5)).toBe("");
  });

  it("should handle single character suffix", () => {
    expect(truncate("abcdef", 4, "~")).toBe("abc~");
  });

  it("should handle long text with default suffix", () => {
    const longText = "a".repeat(100);
    const result = truncate(longText, 10);
    expect(result).toBe("aaaaaaa...");
    expect(result.length).toBe(10);
  });

  it("should preserve the total length as maxLength when truncated", () => {
    const result = truncate("this is a long sentence", 15);
    expect(result.length).toBe(15);
  });
});

describe("parseQueryString", () => {
  it("should parse a simple query string", () => {
    expect(parseQueryString("foo=bar&baz=qux")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("should parse a query string with leading question mark", () => {
    expect(parseQueryString("?foo=bar&baz=qux")).toEqual({
      foo: "bar",
      baz: "qux",
    });
  });

  it("should return empty object for empty string", () => {
    expect(parseQueryString("")).toEqual({});
  });

  it("should return empty object for lone question mark", () => {
    expect(parseQueryString("?")).toEqual({});
  });

  it("should handle keys without values", () => {
    expect(parseQueryString("foo&bar")).toEqual({
      foo: "",
      bar: "",
    });
  });

  it("should handle a single key-value pair", () => {
    expect(parseQueryString("key=value")).toEqual({ key: "value" });
  });

  it("should decode URI-encoded keys and values", () => {
    expect(parseQueryString("hello%20world=foo%20bar")).toEqual({
      "hello world": "foo bar",
    });
  });

  it("should handle key with empty value (key=)", () => {
    expect(parseQueryString("key=")).toEqual({ key: "" });
  });

  it("should handle multiple parameters with some missing values", () => {
    expect(parseQueryString("a=1&b&c=3")).toEqual({
      a: "1",
      b: "",
      c: "3",
    });
  });

  it("should handle encoded special characters", () => {
    expect(parseQueryString("q=%26%3D%3F")).toEqual({
      q: "&=?",
    });
  });

  it("should use the first value when a key contains an equals sign in value", () => {
    // "key=a=b" splits into ["key", "a=b"] but .split("=") only splits on first =
    // Actually, .split("=") splits on ALL = signs, so pair.split("=") gives ["key", "a", "b"]
    // Destructuring [key, value] = ["key", "a", "b"] gives key="key", value="a"
    expect(parseQueryString("key=a=b")).toEqual({ key: "a" });
  });

  it("should overwrite duplicate keys with the last value", () => {
    expect(parseQueryString("key=first&key=second")).toEqual({
      key: "second",
    });
  });

  it("should ignore empty segments from double ampersands", () => {
    // "a=1&&b=2" splits to ["a=1", "", "b=2"]; empty string has no key, so it's skipped
    expect(parseQueryString("a=1&&b=2")).toEqual({
      a: "1",
      b: "2",
    });
  });
});
