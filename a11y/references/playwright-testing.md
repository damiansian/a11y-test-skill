# Generating Playwright Accessibility Tests

## Table of Contents
1. When and How This Reference Is Used
2. The Interaction Chain
3. Two Input Paths
4. Test Structure
5. Using the Helper Library
6. Example: Feature Description → Test
7. Example: Live Page → Test
8. Manual Test Companion
9. What Playwright Can and Cannot Test

---

## 1. When and How This Reference Is Used

This reference guides you in generating Playwright test scripts that verify accessibility on the **rendered page**. This is the primary capability of this skill — going beyond static code review and automated scanning to test what users actually experience.

The test helper library at `scripts/a11y-test-helpers.ts` provides reusable functions. When generating tests, import from this library rather than writing low-level browser automation from scratch.

---

## 2. The Interaction Chain

Every interactive control needs to pass the full interaction chain to be genuinely accessible. This is the expert mental model that automated scanners miss:

1. **Keyboard reachable** — Can you Tab to it? (WCAG 2.1.1)
2. **Accessible name correct** — Not just present, but *meaningful* and matching intent (WCAG 4.1.2)
3. **Focus indicator visible** — Obvious visual focus ring, not suppressed (WCAG 2.4.7, 2.4.13)
4. **Focus indicator contrast** — Indicator meets 3:1 against adjacent colors (WCAG 2.4.13)
5. **In viewport, not obscured** — Not covered by sticky headers, footers, or overlays
6. **Keyboard activatable** — Enter/Space/arrow keys work as expected for the control type
7. **State change announced** — If the interaction changes something, is it communicated via live region? (WCAG 4.1.3)
8. **Announcement politeness** — Is it `polite` (status updates) or `assertive` (errors/critical)? Using assertive for non-critical updates interrupts users.
9. **Works at 200%/400% zoom** — Focus indicators, visibility, and operability hold up under zoom (WCAG 1.4.10)
10. **Works in High Contrast Mode** — Indicators don't rely solely on color/background (forced colors support)

When generating tests, cover as many of these as apply to the control being tested. Not every control needs all 10 — a static heading doesn't need interaction chain testing, but a dropdown, modal trigger, accordion, or form submit button does.

---

## 3. Two Input Paths

### Path A: Feature Description

The user describes a new feature they're building. Your job:
1. Identify every interactive control in the feature
2. Determine what ARIA pattern each control should follow (from WAI-ARIA APG)
3. Generate a Playwright test that verifies the expected accessible behavior
4. Generate a companion manual test checklist for things Playwright can't test

Example input: "We're building a filter bar with dropdowns that filter a data table. Each dropdown shows options on click, selecting an option filters the table and updates a result count."

### Path B: Live Page / Component

The user points at a URL or describes an existing component. Your job:
1. Generate a Playwright test that audits the rendered page
2. Tab through all interactive elements and report the tab order
3. Test each interactive element against the interaction chain
4. Report findings with WCAG criterion references

Example input: "Can you generate tests for our checkout flow at staging.example.com/checkout?"

---

## 4. Test Structure

Always structure generated tests like this:

```typescript
import { test, expect } from '@playwright/test';
import { a11y } from './a11y-test-helpers';

test.describe('Feature Name - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('URL_OR_PATH');
    // Any setup needed
  });

  test('keyboard navigation: all controls reachable via Tab', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);

    // Verify expected controls appear in the tab order
    expect(tabOrder.some(el => el.name.includes('Expected Control'))).toBe(true);

    // Verify logical order (customize based on the feature)
    // tabOrder[0] should be..., tabOrder[1] should be...
  });

  test('interaction chain: [specific control]', async ({ page }) => {
    const result = await a11y.testInteractionChain(page, {
      name: 'Control accessible name',
      expectedRole: 'button',
      activationKey: 'Enter',
      expectedAnnouncement: /expected announcement pattern/,
      announcementPoliteness: 'polite',
    });

    for (const check of result.results) {
      expect(check.passed, check.details).toBe(true);
    }
  });

  test('focus indicator visible on all interactive elements', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);

    for (const element of tabOrder) {
      await a11y.tabTo(page, element.name);
      const indicator = await a11y.verifyFocusIndicator(page);
      expect(indicator.hasIndicator, `No focus indicator on: ${element.name}`).toBe(true);
    }
  });

  test('focused elements not obscured by sticky elements', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);

    for (const element of tabOrder) {
      await a11y.tabTo(page, element.name);
      const visibility = await a11y.verifyFocusedElementVisible(page);
      expect(visibility.isObscured, `${element.name}: ${visibility.details}`).toBe(false);
    }
  });

  test('content reflows at 200% zoom', async ({ page }) => {
    const result = await a11y.testAtZoomLevel(page, 200, {
      noHorizontalScroll: true,
      focusIndicatorStillVisible: true,
    });
    expect(result.passed, result.details.join('\n')).toBe(true);
  });

  test('content reflows at 400% zoom', async ({ page }) => {
    const result = await a11y.testAtZoomLevel(page, 400, {
      noHorizontalScroll: true,
    });
    expect(result.passed, result.details.join('\n')).toBe(true);
  });
});
```

### Naming conventions

- Test files: `[feature-name].a11y.spec.ts`
- Test descriptions: Start with what's being tested: "keyboard navigation:", "interaction chain:", "live region:", "zoom reflow:"
- Assertion messages: Always include which WCAG criterion fails and a human-readable explanation

---

## 5. Using the Helper Library

The `a11y-test-helpers.ts` library provides these key functions:

### Keyboard navigation
- `a11y.tabTo(page, nameOrText)` — Tab until reaching an element with given name. Throws if unreachable.
- `a11y.getTabOrder(page)` — Returns full tab order as an array of {name, role, tagName, index}.
- `a11y.activate(page, key)` — Press Enter, Space, or both on the focused element.

### Focus indicators
- `a11y.verifyFocusIndicator(page)` — Checks the focused element has a visible focus ring.
- `a11y.getFocusIndicatorColors(page)` — Returns indicator and background colors for contrast checking.

### Visibility
- `a11y.verifyFocusedElementVisible(page)` — Checks element is in viewport AND not obscured by sticky elements.

### Live region announcements
- `a11y.verifyAnnouncementAfterAction(page, action, expected)` — The key test: perform an action, verify a live region announces the result.
- `a11y.startCapturingAnnouncements(page)` / `a11y.getAnnouncements(page)` — Lower-level: set up capture, perform actions, then check what was captured.

### Zoom testing
- `a11y.testAtZoomLevel(page, 200|300|400, checks)` — Test reflow, element visibility, and focus indicators at zoom.

### Dialogs and overlays
- `a11y.verifyFocusTrap(page, dialogSelector)` — Verify focus stays trapped in a modal dialog.
- `a11y.verifyEscapeCloses(page, triggerSelector)` — Verify Escape closes context and returns focus.

### Composite
- `a11y.testInteractionChain(page, control)` — Runs the full interaction chain test on a single control.

---

## 6. Example: Feature Description → Test

**User says:** "We're building a notification bell icon in the header. Clicking it opens a dropdown panel of notifications. Each notification can be dismissed with an X button. There's a 'Mark all as read' button."

**Generated test:**

```typescript
import { test, expect } from '@playwright/test';
import { a11y } from './a11y-test-helpers';

test.describe('Notification Bell - Accessibility', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
  });

  test('notification bell is keyboard reachable and properly labeled', async ({ page }) => {
    // Bell should be a button with an accessible name including notification count
    const bell = await a11y.tabTo(page, /notification/i);
    const props = await a11y.getAccessibleProperties(page, '[data-testid="notification-bell"]');
    expect(props.role).toBe('button');
    expect(props.name).toMatch(/notification/i);
    // Name should include count if there are unread notifications
    // e.g., "3 unread notifications" not just a bell icon
  });

  test('opening notifications announces panel to screen readers', async ({ page }) => {
    const result = await a11y.verifyAnnouncementAfterAction(
      page,
      async () => {
        await a11y.tabTo(page, /notification/i);
        await a11y.activate(page);
      },
      {
        text: /notification/i,
        politeness: 'polite', // Opening a panel is not critical — polite is correct
      }
    );
    expect(result.announced, result.details).toBe(true);
  });

  test('notification panel traps focus when open', async ({ page }) => {
    await a11y.tabTo(page, /notification/i);
    await a11y.activate(page);
    await page.waitForTimeout(300);

    const trap = await a11y.verifyFocusTrap(page, '[role="dialog"], .notification-panel');
    // Note: if this is a non-modal popover, focus trapping may not be required.
    // But focus should still be managed — first item in the panel should receive focus.
  });

  test('Escape closes notification panel and returns focus to bell', async ({ page }) => {
    await a11y.tabTo(page, /notification/i);
    await a11y.activate(page);
    await page.waitForTimeout(300);

    const escape = await a11y.verifyEscapeCloses(page, '[data-testid="notification-bell"]');
    expect(escape.focusReturned, escape.details).toBe(true);
  });

  test('dismissing a notification announces the action', async ({ page }) => {
    // Open the panel
    await a11y.tabTo(page, /notification/i);
    await a11y.activate(page);
    await page.waitForTimeout(300);

    // Tab to a dismiss button
    const result = await a11y.verifyAnnouncementAfterAction(
      page,
      async () => {
        await a11y.tabTo(page, /dismiss|close|remove/i);
        await a11y.activate(page);
      },
      {
        text: /dismissed|removed/i,
        politeness: 'polite',
      }
    );
    expect(result.announced, result.details).toBe(true);
  });

  test('notification bell not obscured by sticky header at scroll positions', async ({ page }) => {
    // Scroll down the page, then tab to the bell
    await page.evaluate(() => window.scrollTo(0, 500));
    await a11y.tabTo(page, /notification/i);
    const visibility = await a11y.verifyFocusedElementVisible(page);
    // Bell is likely IN the sticky header, so it should always be visible
    // But verify it's not covered by another sticky element
    expect(visibility.isObscured, visibility.details).toBe(false);
  });

  test('notification panel works at 200% zoom', async ({ page }) => {
    await a11y.tabTo(page, /notification/i);
    await a11y.activate(page);

    const result = await a11y.testAtZoomLevel(page, 200, {
      noHorizontalScroll: true,
      elementStillVisible: '.notification-panel',
    });
    expect(result.passed, result.details.join('\n')).toBe(true);
  });
});
```

---

## 7. Example: Live Page → Test

**User says:** "Can you generate accessibility tests for our login page?"

For this path, generate an exploratory test that maps the page and checks each element:

```typescript
import { test, expect } from '@playwright/test';
import { a11y } from './a11y-test-helpers';

test.describe('Login Page - Accessibility Audit', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('document tab order is logical and complete', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);

    console.log('Tab order:');
    tabOrder.forEach((el, i) => {
      console.log(`  ${i + 1}. [${el.role}] "${el.name}"`);
    });

    // Verify all expected interactive elements are in the tab order
    const names = tabOrder.map(el => el.name.toLowerCase());
    expect(names.some(n => n.includes('email') || n.includes('username'))).toBe(true);
    expect(names.some(n => n.includes('password'))).toBe(true);
    expect(names.some(n => n.includes('sign in') || n.includes('log in'))).toBe(true);
  });

  test('all interactive elements have visible focus indicators', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);
    const failures: string[] = [];

    for (const el of tabOrder) {
      // Tab to this element
      await page.keyboard.press('Tab');
      const result = await a11y.verifyFocusIndicator(page);
      if (!result.hasIndicator) {
        failures.push(`"${el.name}" (${el.role}): ${result.details}`);
      }
    }

    expect(failures, `Focus indicator missing on:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('no elements obscured by sticky elements during tab navigation', async ({ page }) => {
    const tabOrder = await a11y.getTabOrder(page);
    const obscured: string[] = [];

    for (const el of tabOrder) {
      await page.keyboard.press('Tab');
      const vis = await a11y.verifyFocusedElementVisible(page);
      if (vis.isObscured) {
        obscured.push(`"${el.name}": obscured by ${vis.obscuredBy}`);
      }
    }

    expect(obscured, `Obscured elements:\n${obscured.join('\n')}`).toHaveLength(0);
  });

  test('form error handling announces errors to screen readers', async ({ page }) => {
    // Submit an empty form to trigger validation
    const result = await a11y.verifyAnnouncementAfterAction(
      page,
      async () => {
        await a11y.tabTo(page, /sign in|log in|submit/i);
        await a11y.activate(page);
      },
      {
        text: /error|required|invalid/i,
        politeness: 'assertive', // Errors should be assertive
      }
    );

    expect(result.announced, result.details).toBe(true);
  });

  test('page functions at 400% zoom', async ({ page }) => {
    const result = await a11y.testAtZoomLevel(page, 400, {
      noHorizontalScroll: true,
      elementStillVisible: 'form, [role="form"]',
    });
    expect(result.passed, result.details.join('\n')).toBe(true);
  });
});
```

---

## 8. Manual Test Companion

For every generated Playwright test, also produce a companion manual test checklist covering what automation cannot verify:

```markdown
## Manual Accessibility Test Checklist: [Feature Name]

### Screen Reader Testing (NVDA + Chrome or VoiceOver + Safari)
- [ ] Navigate to [control]. What is announced? Is the name accurate and sufficient?
- [ ] Activate [control]. Is the result announced? Does the announcement make sense in context?
- [ ] Is the reading order logical when navigating by headings (H key) and landmarks (D key)?

### Cognitive Assessment
- [ ] Are error messages clear and actionable? (not just "invalid input" but "Email address must include @")
- [ ] Is the flow predictable? Does it match similar patterns elsewhere in the app?
- [ ] Are instructions provided before the form, not just after an error?

### Windows High Contrast Mode
- [ ] Turn on Windows High Contrast Mode. Are all interactive elements still visible?
- [ ] Are focus indicators visible? (they should use borders or outlines, not just color/background)
- [ ] Are status indicators (success, error, selected) distinguishable without background colors?

### Visual Assessment
- [ ] At 200% zoom: Is all content readable? No overlapping text or clipped controls?
- [ ] At 400% zoom: Does content reflow to a single column? Can you still complete the task?
- [ ] Are touch/click targets at least 24×24px? (ideally 44×44px)
```

Always generate this alongside the Playwright test. The combination of automated + manual is what catches the full spectrum of issues.

---

## 9. What Playwright Can and Cannot Test

### Playwright CAN test:
- Tab order (actual, rendered)
- Focus indicator presence (computed styles)
- Element visibility and obstruction by sticky elements
- ARIA attribute presence and values on the rendered DOM
- Live region text changes after interactions
- Zoom/reflow behavior
- Keyboard activation of controls
- Focus trap behavior in dialogs
- Focus return after closing overlays
- Accessible name existence (though not *quality*)

### Playwright CANNOT test:
- Whether an accessible name is *meaningful* (it can verify "Submit" exists but not whether "Submit" is the right label for this specific context)
- Actual screen reader announcement experience (live region observers approximate this but don't capture the full screen reader output including role and state announcements)
- Cognitive clarity of content
- Whether an animation is problematic for vestibular disorders
- High Contrast Mode rendering (requires Windows-specific testing)
- Actual color contrast of rendered pixels (computed styles give you the values, but overlapping backgrounds, gradients, and transparency require pixel-level analysis)
- Whether the experience "makes sense" to a human navigating nonvisually

This is why the manual test companion is non-negotiable — it covers the 50%+ that even sophisticated automation misses.
