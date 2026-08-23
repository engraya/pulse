import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
import { toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

// jsdom lacks these; Fathom UI's Radix-backed components and virtualized lists
// probe for them. Provide inert polyfills so component tests don't crash.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

if (!("scrollIntoView" in Element.prototype)) {
  (Element.prototype as unknown as { scrollIntoView: () => void }).scrollIntoView = () => {};
}
