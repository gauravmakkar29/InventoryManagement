import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { renderHighlight } from "@/app/components/search/search-result-item";

/**
 * Unit tests for renderHighlight — safe replacement for dangerouslySetInnerHTML.
 * Enforces NIST SI-3 (Malicious Code Protection): ensures injected HTML/script
 * tags are rendered as escaped text, not executable markup.
 */
describe("renderHighlight", () => {
  it("renders text with <mark> tags as highlighted React elements", () => {
    const result = renderHighlight("Hello <mark>world</mark> test");
    const { container } = render(<span>{result}</span>);

    const mark = container.querySelector("mark");
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe("world");
    expect(mark?.className).toContain("bg-warning-bg");
    expect(mark?.className).toContain("px-0.5");
    expect(mark?.className).toContain("rounded-sm");
    expect(container.textContent).toBe("Hello world test");
  });

  it("renders multiple <mark> tags correctly", () => {
    const result = renderHighlight("<mark>one</mark> and <mark>two</mark>");
    const { container } = render(<span>{result}</span>);

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks[0]?.textContent).toBe("one");
    expect(marks[1]?.textContent).toBe("two");
    expect(container.textContent).toBe("one and two");
  });

  it("returns plain text when no <mark> tags are present", () => {
    const result = renderHighlight("plain text with no highlights");
    expect(result).toBe("plain text with no highlights");
  });

  it("escapes malicious <script> tags as text (XSS prevention)", () => {
    const malicious = "<script>alert(1)</script><mark>safe</mark>";
    const result = renderHighlight(malicious);
    const { container } = render(<span>{result}</span>);

    // The script tag must NOT be in the DOM as an element
    expect(container.querySelector("script")).toBeNull();
    // The script tag text should appear as visible escaped text
    expect(container.textContent).toContain("<script>alert(1)</script>");
    // The <mark> content should still render as a mark element
    expect(container.querySelector("mark")?.textContent).toBe("safe");
  });

  it("escapes injected HTML inside <mark> content as text", () => {
    // OpenSearch shouldn't do this, but if it did, inner HTML must be escaped
    const result = renderHighlight('<mark><img onerror="alert(1)"></mark>');
    const { container } = render(<span>{result}</span>);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("mark")?.textContent).toContain("<img");
  });

  it("escapes arbitrary HTML tags outside marks", () => {
    const result = renderHighlight('<b>bold</b> <mark>match</mark> <a href="x">link</a>');
    const { container } = render(<span>{result}</span>);

    expect(container.querySelector("b")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(container.textContent).toContain("<b>bold</b>");
    expect(container.textContent).toContain('<a href="x">link</a>');
    expect(container.querySelector("mark")?.textContent).toBe("match");
  });

  it("handles empty string input", () => {
    const result = renderHighlight("");
    expect(result).toBe("");
  });

  it("handles <mark> with empty content", () => {
    const result = renderHighlight("before<mark></mark>after");
    const { container } = render(<span>{result}</span>);

    expect(container.querySelector("mark")).not.toBeNull();
    expect(container.querySelector("mark")?.textContent).toBe("");
    expect(container.textContent).toBe("beforeafter");
  });
});
