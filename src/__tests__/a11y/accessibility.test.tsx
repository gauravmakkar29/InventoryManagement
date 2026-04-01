import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";

/**
 * Accessibility smoke tests — axe-core scans for WCAG violations.
 * Run: npm test
 *
 * Note: color-contrast rule disabled in jsdom (no canvas support).
 * Contrast is validated via manual audit + WebAIM checker.
 */

const axeOptions = {
  rules: {
    "color-contrast": { enabled: false },
  },
};

describe("Accessibility (axe-core)", () => {
  it("PageLoader skeleton has no a11y violations", async () => {
    const { PageLoader } = await import("../../app/components/page-loader");
    const { container } = render(<PageLoader />);
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it("Skeleton component has no a11y violations", async () => {
    const { Skeleton } = await import("../../components/skeleton");
    const { container } = render(
      <div>
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-40" />
      </div>,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it("properly labeled form has no a11y violations", async () => {
    const { container } = render(
      <form aria-label="Test form">
        <label htmlFor="test-email">Email</label>
        <input id="test-email" type="email" />
        <button type="submit">Submit</button>
      </form>,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it("table with caption and th has no a11y violations", async () => {
    const { container } = render(
      <table>
        <caption>Test table</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Row 1</td>
            <td>Data 1</td>
          </tr>
        </tbody>
      </table>,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it("detects missing image alt text", async () => {
    const { container } = render(
      // eslint-disable-next-line jsx-a11y/alt-text
      <img src="test.jpg" />,
    );
    const results = await axe(container, axeOptions);
    expect(results.violations.length).toBeGreaterThan(0);
    expect(results.violations.some((v) => v.id === "image-alt")).toBe(true);
  });
});
