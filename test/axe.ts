import axe from "axe-core";
import { expect } from "vitest";

/** Fails with the list of axe rule ids when the rendered DOM has accessibility violations. */
export async function expectNoAxeViolations(container: Element): Promise<void> {
  const results = await axe.run(container, {
    rules: {
      // jsdom does not compute layout or colours; contrast is covered by the token review.
      "color-contrast": { enabled: false },
    },
  });
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
}
