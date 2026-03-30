/**
 * Story 16.6: Accessibility — Skip to Content Link
 *
 * Visually hidden link that appears on first Tab press.
 * Allows keyboard users to bypass sidebar navigation.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-[13px] focus:font-semibold focus:text-white focus:shadow-lg"
    >
      Skip to main content
    </a>
  );
}
