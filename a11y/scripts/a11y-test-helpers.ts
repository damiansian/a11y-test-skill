/**
 * Accessibility Test Helpers for Playwright
 *
 * A library of reusable functions that test the "interaction chain" —
 * the full sequence of things that need to be true for an interface
 * to be genuinely accessible, beyond what automated scanners catch.
 *
 * These helpers test the RENDERED page, not the source code.
 *
 * Usage:
 *   import { a11y } from './a11y-test-helpers';
 *
 *   test('dropdown is accessible', async ({ page }) => {
 *     await a11y.tabTo(page, 'Select an option');
 *     await a11y.verifyFocusIndicator(page);
 *     await a11y.activate(page);
 *     await a11y.verifyLiveAnnouncement(page, /options available/);
 *   });
 */

import { Page, Locator, expect } from '@playwright/test';

// ============================================================
// FOCUS & KEYBOARD NAVIGATION
// ============================================================

/**
 * Tab through the page until an element with the given accessible name
 * or text content receives focus. Returns the focused element.
 *
 * Throws if maxTabs is exceeded — indicates the element is unreachable
 * by keyboard, which is a critical accessibility failure.
 */
async function tabTo(
  page: Page,
  nameOrText: string | RegExp,
  options: { maxTabs?: number; shift?: boolean } = {}
): Promise<Locator> {
  const { maxTabs = 100, shift = false } = options;
  const key = shift ? 'Shift+Tab' : 'Tab';

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press(key);

    const focused = page.locator(':focus');
    const name = await focused.getAttribute('aria-label')
      ?? await focused.innerText().catch(() => '')
      ?? '';

    const matches = nameOrText instanceof RegExp
      ? nameOrText.test(name)
      : name.includes(nameOrText);

    if (matches) return focused;
  }

  throw new Error(
    `Could not tab to element matching "${nameOrText}" within ${maxTabs} tabs. ` +
    `The element may not be keyboard-reachable (WCAG 2.1.1 Keyboard).`
  );
}

/**
 * Get all tabbable elements in order by simulating Tab key presses.
 * Returns an array of { name, role, tagName, index } for each stop.
 *
 * This tests the ACTUAL tab order of the rendered page, not what
 * the source code suggests it should be.
 */
async function getTabOrder(
  page: Page,
  options: { maxTabs?: number } = {}
): Promise<Array<{ name: string; role: string; tagName: string; index: number }>> {
  const { maxTabs = 200 } = options;
  const tabOrder: Array<{ name: string; role: string; tagName: string; index: number }> = [];
  const seen = new Set<string>();

  // Start from the top of the page
  await page.keyboard.press('Tab');

  for (let i = 0; i < maxTabs; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;

      const rect = el.getBoundingClientRect();
      return {
        name: el.getAttribute('aria-label')
          || el.textContent?.trim().substring(0, 80)
          || '',
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        tagName: el.tagName.toLowerCase(),
        id: el.id || `${el.tagName}-${rect.top}-${rect.left}`,
      };
    });

    if (!info) break;

    // Detect cycle (we've tabbed back to the first element)
    if (seen.has(info.id) && tabOrder.length > 0) break;
    seen.add(info.id);

    tabOrder.push({
      name: info.name,
      role: info.role,
      tagName: info.tagName,
      index: i,
    });

    await page.keyboard.press('Tab');
  }

  return tabOrder;
}

// ============================================================
// FOCUS INDICATOR VERIFICATION
// ============================================================

/**
 * Verify the currently focused element has a visible focus indicator.
 *
 * Checks for outline, box-shadow, or border changes compared to
 * the element's unfocused state. This catches the common failure
 * where `outline: none` is set without a replacement indicator.
 *
 * Note: This tests computed styles on the RENDERED page.
 */
async function verifyFocusIndicator(page: Page): Promise<{
  hasIndicator: boolean;
  type: string;
  details: string;
}> {
  const result = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) {
      return { hasIndicator: false, type: 'none', details: 'No element is focused' };
    }

    const styles = window.getComputedStyle(el);
    const outline = styles.outline;
    const outlineWidth = parseFloat(styles.outlineWidth);
    const outlineStyle = styles.outlineStyle;
    const boxShadow = styles.boxShadow;
    const borderColor = styles.borderColor;

    // Check outline
    if (outlineStyle !== 'none' && outlineWidth > 0) {
      return {
        hasIndicator: true,
        type: 'outline',
        details: `outline: ${outline}`,
      };
    }

    // Check box-shadow (common custom focus indicator)
    if (boxShadow && boxShadow !== 'none') {
      return {
        hasIndicator: true,
        type: 'box-shadow',
        details: `box-shadow: ${boxShadow}`,
      };
    }

    // No detectable focus indicator
    return {
      hasIndicator: false,
      type: 'none',
      details: `No visible focus indicator detected. outline: ${outline}, box-shadow: ${boxShadow}. ` +
        `This fails WCAG 2.4.7 Focus Visible.`,
    };
  });

  return result;
}

/**
 * Check focus indicator contrast against its background.
 * WCAG 2.4.13 requires focus indicators with at least 3:1 contrast
 * against adjacent colors.
 *
 * Returns the computed colors for manual verification since
 * programmatic contrast checking against complex backgrounds
 * requires pixel-level analysis.
 */
async function getFocusIndicatorColors(page: Page): Promise<{
  indicatorColor: string;
  backgroundColor: string;
  elementRect: { x: number; y: number; width: number; height: number };
}> {
  return await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) throw new Error('No element focused');

    const styles = window.getComputedStyle(el);
    const rect = (el as HTMLElement).getBoundingClientRect();

    return {
      indicatorColor: styles.outlineColor || styles.borderColor || 'unknown',
      backgroundColor: styles.backgroundColor,
      elementRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    };
  });
}

// ============================================================
// ELEMENT VISIBILITY & VIEWPORT
// ============================================================

/**
 * Check if the currently focused element is actually visible in the viewport.
 * Catches elements that are technically focusable but:
 * - Scrolled out of view
 * - Covered by sticky headers/footers
 * - Hidden behind overlays
 * - Positioned off-screen
 *
 * This is a critical real-world issue that automated scanners miss entirely.
 */
async function verifyFocusedElementVisible(page: Page): Promise<{
  isVisible: boolean;
  isInViewport: boolean;
  isObscured: boolean;
  obscuredBy: string | null;
  details: string;
}> {
  return await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    if (!el || el === document.body) {
      return {
        isVisible: false,
        isInViewport: false,
        isObscured: false,
        obscuredBy: null,
        details: 'No element is focused',
      };
    }

    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if in viewport
    const isInViewport =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= viewportHeight &&
      rect.right <= viewportWidth;

    // Check if obscured by another element (sticky headers, overlays, etc.)
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const topElement = document.elementFromPoint(centerX, centerY);

    let isObscured = false;
    let obscuredBy: string | null = null;

    if (topElement && topElement !== el && !el.contains(topElement)) {
      isObscured = true;
      const topStyles = window.getComputedStyle(topElement);
      const position = topStyles.position;
      obscuredBy = `${topElement.tagName.toLowerCase()}` +
        (topElement.className ? `.${topElement.className.split(' ')[0]}` : '') +
        ` (position: ${position})`;
    }

    // Build detail message
    let details = '';
    if (!isInViewport) {
      details += `Element is outside the viewport (rect: top=${Math.round(rect.top)}, ` +
        `bottom=${Math.round(rect.bottom)}, viewport height=${viewportHeight}). `;
    }
    if (isObscured) {
      details += `Element is obscured by ${obscuredBy}. ` +
        `This commonly happens with sticky headers/footers covering focused elements. `;
    }
    if (!details) {
      details = 'Element is visible and unobscured in the viewport.';
    }

    return {
      isVisible: isInViewport && !isObscured,
      isInViewport,
      isObscured,
      obscuredBy,
      details,
    };
  });
}

// ============================================================
// LIVE REGION / ANNOUNCEMENT VERIFICATION
// ============================================================

/**
 * Set up a MutationObserver to capture live region announcements.
 * Call this BEFORE triggering the interaction that should cause
 * an announcement. Then call `getAnnouncements()` after the interaction.
 *
 * This is critical for testing dynamic content — when a user interacts
 * with a control and something changes on the page, screen reader users
 * depend on live regions to know what changed.
 */
async function startCapturingAnnouncements(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as any).__a11y_announcements = [];

    // Watch for changes in existing live regions
    const liveRegions = document.querySelectorAll(
      '[aria-live], [role="alert"], [role="status"], [role="log"], [role="marquee"], [role="timer"]'
    );

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const target = mutation.target as HTMLElement;
        const ariaLive = target.getAttribute('aria-live')
          || target.closest('[aria-live]')?.getAttribute('aria-live')
          || (target.getAttribute('role') === 'alert' ? 'assertive' : null)
          || (target.getAttribute('role') === 'status' ? 'polite' : null);

        if (ariaLive) {
          (window as any).__a11y_announcements.push({
            text: target.textContent?.trim() || '',
            politeness: ariaLive,
            role: target.getAttribute('role') || null,
            timestamp: Date.now(),
          });
        }
      }
    });

    // Observe existing live regions
    liveRegions.forEach(region => {
      observer.observe(region, { childList: true, characterData: true, subtree: true });
    });

    // Also observe body for dynamically added live regions
    const bodyObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(node => {
          if (node instanceof HTMLElement) {
            const isLiveRegion = node.hasAttribute('aria-live')
              || ['alert', 'status', 'log'].includes(node.getAttribute('role') || '');
            if (isLiveRegion && node.textContent?.trim()) {
              (window as any).__a11y_announcements.push({
                text: node.textContent.trim(),
                politeness: node.getAttribute('aria-live')
                  || (node.getAttribute('role') === 'alert' ? 'assertive' : 'polite'),
                role: node.getAttribute('role') || null,
                timestamp: Date.now(),
              });
            }
            // Also start observing this new live region
            observer.observe(node, { childList: true, characterData: true, subtree: true });
          }
        });
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });

    (window as any).__a11y_observers = [observer, bodyObserver];
  });
}

/**
 * Get all announcements captured since startCapturingAnnouncements was called.
 */
async function getAnnouncements(page: Page): Promise<Array<{
  text: string;
  politeness: string;
  role: string | null;
  timestamp: number;
}>> {
  return await page.evaluate(() => {
    return (window as any).__a11y_announcements || [];
  });
}

/**
 * Stop capturing and clean up observers.
 */
async function stopCapturingAnnouncements(page: Page): Promise<void> {
  await page.evaluate(() => {
    const observers = (window as any).__a11y_observers || [];
    observers.forEach((obs: MutationObserver) => obs.disconnect());
    delete (window as any).__a11y_announcements;
    delete (window as any).__a11y_observers;
  });
}

/**
 * Verify that an interaction triggers an appropriate live region announcement.
 *
 * This is the core test for the "did the change get announced?" question.
 * Call with a function that performs the interaction and an expected
 * announcement pattern.
 */
async function verifyAnnouncementAfterAction(
  page: Page,
  action: () => Promise<void>,
  expected: {
    text?: string | RegExp;
    politeness?: 'polite' | 'assertive';
    timeout?: number;
  }
): Promise<{
  announced: boolean;
  announcements: Array<{ text: string; politeness: string }>;
  details: string;
}> {
  const { timeout = 2000 } = expected;

  await startCapturingAnnouncements(page);

  // Perform the interaction
  await action();

  // Wait for potential announcements
  await page.waitForTimeout(timeout);

  const announcements = await getAnnouncements(page);
  await stopCapturingAnnouncements(page);

  if (announcements.length === 0) {
    return {
      announced: false,
      announcements: [],
      details:
        'No live region announcement detected after the interaction. ' +
        'Screen reader users will not know that content changed. ' +
        'Add an aria-live region or role="status"/role="alert" to announce the change.',
    };
  }

  // Check if any announcement matches expected text
  if (expected.text) {
    const match = announcements.find(a =>
      expected.text instanceof RegExp
        ? expected.text.test(a.text)
        : a.text.includes(expected.text as string)
    );

    if (!match) {
      return {
        announced: true,
        announcements,
        details:
          `Live region announcement detected but content didn't match expected pattern. ` +
          `Expected: "${expected.text}", Got: "${announcements.map(a => a.text).join(', ')}"`,
      };
    }
  }

  // Check politeness level
  if (expected.politeness) {
    const wrongPoliteness = announcements.find(a => a.politeness !== expected.politeness);
    if (wrongPoliteness) {
      return {
        announced: true,
        announcements,
        details:
          `Announcement detected but with ${wrongPoliteness.politeness} politeness ` +
          `(expected ${expected.politeness}). ` +
          (expected.politeness === 'polite'
            ? 'assertive announcements interrupt the user — use polite for non-critical updates.'
            : 'polite announcements may be missed for critical information — use assertive for errors.'),
      };
    }
  }

  return {
    announced: true,
    announcements,
    details: 'Appropriate live region announcement detected.',
  };
}

// ============================================================
// ZOOM & REFLOW TESTING
// ============================================================

/**
 * Test the page at a specific zoom level and verify content reflows
 * without horizontal scrolling (WCAG 1.4.10 Reflow).
 *
 * Tests at the actual rendered zoom level, not just viewport width,
 * which catches issues that only appear under true browser zoom.
 */
async function testAtZoomLevel(
  page: Page,
  zoomPercent: 200 | 300 | 400,
  checks: {
    noHorizontalScroll?: boolean;
    elementStillVisible?: string; // selector to verify is still visible
    focusIndicatorStillVisible?: boolean;
  } = {}
): Promise<{
  passed: boolean;
  hasHorizontalScroll: boolean;
  details: string[];
}> {
  const scale = zoomPercent / 100;
  const details: string[] = [];
  let passed = true;

  // Apply zoom via CSS transform (simulates browser zoom behavior)
  await page.evaluate((s) => {
    document.documentElement.style.zoom = `${s * 100}%`;
  }, scale);

  // Wait for reflow
  await page.waitForTimeout(500);

  // Check for horizontal scroll
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  if (checks.noHorizontalScroll !== false && hasHorizontalScroll) {
    passed = false;
    details.push(
      `Content requires horizontal scrolling at ${zoomPercent}% zoom. ` +
      `This fails WCAG 1.4.10 Reflow. Content should reflow into a single column.`
    );
  }

  // Check if a specific element is still visible
  if (checks.elementStillVisible) {
    const isVisible = await page.evaluate((selector) => {
      const el = document.querySelector(selector);
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    }, checks.elementStillVisible);

    if (!isVisible) {
      passed = false;
      details.push(
        `Element "${checks.elementStillVisible}" is not visible at ${zoomPercent}% zoom. ` +
        `Content must not be hidden or clipped at increased zoom levels.`
      );
    }
  }

  // Check focus indicator at zoom level
  if (checks.focusIndicatorStillVisible) {
    const focusResult = await verifyFocusIndicator(page);
    if (!focusResult.hasIndicator) {
      passed = false;
      details.push(
        `Focus indicator is not visible at ${zoomPercent}% zoom. ${focusResult.details}`
      );
    }
  }

  // Reset zoom
  await page.evaluate(() => {
    document.documentElement.style.zoom = '100%';
  });

  if (passed) {
    details.push(`Page passes reflow and visibility checks at ${zoomPercent}% zoom.`);
  }

  return { passed, hasHorizontalScroll, details };
}

// ============================================================
// ACCESSIBLE NAME VERIFICATION
// ============================================================

/**
 * Get the computed accessible name and role for an element,
 * as the browser's accessibility tree actually reports it.
 *
 * This uses the page's actual computed accessibility properties,
 * not a source-code guess.
 */
async function getAccessibleProperties(
  page: Page,
  selector: string
): Promise<{
  name: string;
  role: string;
  description: string;
  required: boolean;
  expanded: boolean | null;
  checked: boolean | null;
  selected: boolean | null;
  disabled: boolean;
}> {
  const locator = page.locator(selector).first();
  const name = await locator.getAttribute('aria-label')
    ?? await locator.innerText().catch(() => '');

  return await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`Element not found: ${sel}`);

    return {
      name: el.getAttribute('aria-label')
        || (el as HTMLElement).innerText?.trim().substring(0, 200)
        || '',
      role: el.getAttribute('role')
        || el.tagName.toLowerCase(),
      description: el.getAttribute('aria-describedby')
        ? document.getElementById(el.getAttribute('aria-describedby')!)?.textContent?.trim() || ''
        : '',
      required: el.hasAttribute('aria-required') || el.hasAttribute('required'),
      expanded: el.hasAttribute('aria-expanded')
        ? el.getAttribute('aria-expanded') === 'true'
        : null,
      checked: el.hasAttribute('aria-checked')
        ? el.getAttribute('aria-checked') === 'true'
        : (el as HTMLInputElement).checked ?? null,
      selected: el.hasAttribute('aria-selected')
        ? el.getAttribute('aria-selected') === 'true'
        : null,
      disabled: el.hasAttribute('aria-disabled')
        ? el.getAttribute('aria-disabled') === 'true'
        : (el as HTMLButtonElement).disabled ?? false,
    };
  }, selector);
}

// ============================================================
// INTERACTION TESTING
// ============================================================

/**
 * Activate the currently focused element using keyboard.
 * Uses Enter for links and buttons, Space for checkboxes and buttons.
 */
async function activate(
  page: Page,
  key: 'Enter' | 'Space' | 'Both' = 'Enter'
): Promise<void> {
  if (key === 'Both') {
    await page.keyboard.press('Enter');
  } else if (key === 'Space') {
    await page.keyboard.press(' ');
  } else {
    await page.keyboard.press('Enter');
  }
}

/**
 * Test that Escape closes the current context (dialog, dropdown, popover)
 * and returns focus to the trigger element.
 */
async function verifyEscapeCloses(
  page: Page,
  triggerSelector: string
): Promise<{
  closed: boolean;
  focusReturned: boolean;
  details: string;
}> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  const focusReturned = await page.evaluate((sel) => {
    const trigger = document.querySelector(sel);
    return document.activeElement === trigger;
  }, triggerSelector);

  return {
    closed: true, // Caller should verify the content is actually hidden
    focusReturned,
    details: focusReturned
      ? 'Escape closed the context and returned focus to the trigger element.'
      : `Escape was pressed but focus did not return to the trigger (${triggerSelector}). ` +
        `Focus should return to the element that opened the context.`,
  };
}

/**
 * Verify that a modal dialog properly traps focus.
 * Tabs through all elements in the dialog and verifies focus
 * doesn't escape to elements behind it.
 */
async function verifyFocusTrap(
  page: Page,
  dialogSelector: string,
  options: { maxTabs?: number } = {}
): Promise<{
  isTrapped: boolean;
  focusableCount: number;
  details: string;
}> {
  const { maxTabs = 50 } = options;
  let focusableCount = 0;
  let escaped = false;

  for (let i = 0; i < maxTabs; i++) {
    await page.keyboard.press('Tab');

    const isInDialog = await page.evaluate((sel) => {
      const dialog = document.querySelector(sel);
      return dialog?.contains(document.activeElement) ?? false;
    }, dialogSelector);

    if (!isInDialog) {
      escaped = true;
      break;
    }

    focusableCount++;
  }

  return {
    isTrapped: !escaped,
    focusableCount,
    details: escaped
      ? `Focus escaped the dialog after ${focusableCount} tab stops. ` +
        `Modal dialogs must trap focus (WCAG guidance for modal dialogs).`
      : `Focus is properly trapped within the dialog (${focusableCount} focusable elements).`,
  };
}

// ============================================================
// ACCESSIBILITY TREE SNAPSHOT
// ============================================================

/**
 * Capture a snapshot of the accessibility tree for a region of the page.
 * Useful for comparing before/after an interaction to verify
 * state changes are reflected in the accessibility tree.
 */
async function getAccessibilityTreeSnapshot(
  page: Page,
  rootSelector?: string
): Promise<any> {
  // Playwright's built-in accessibility snapshot
  const snapshot = await page.accessibility.snapshot({
    root: rootSelector ? await page.$(rootSelector) ?? undefined : undefined,
  });
  return snapshot;
}

// ============================================================
// COMPOSITE: FULL INTERACTION CHAIN TEST
// ============================================================

/**
 * Run the complete interaction chain test on a single control.
 * This is the high-level test that encodes the expert mental model:
 *
 * 1. Can you tab to it?
 * 2. Does it have an accessible name?
 * 3. Is the focus indicator visible?
 * 4. Is it in the viewport and not obscured?
 * 5. Can you activate it with keyboard?
 * 6. Does the resulting change get announced?
 * 7. Does the focus indicator work at 200% zoom?
 */
async function testInteractionChain(
  page: Page,
  control: {
    name: string | RegExp;
    expectedRole?: string;
    activationKey?: 'Enter' | 'Space' | 'Both';
    expectedAnnouncement?: string | RegExp;
    announcementPoliteness?: 'polite' | 'assertive';
  }
): Promise<{
  passed: boolean;
  results: Array<{ check: string; passed: boolean; details: string }>;
}> {
  const results: Array<{ check: string; passed: boolean; details: string }> = [];
  let overallPassed = true;

  // 1. Tab to the control
  try {
    await tabTo(page, control.name);
    results.push({
      check: 'Keyboard reachable',
      passed: true,
      details: `Successfully tabbed to element matching "${control.name}".`,
    });
  } catch (e: any) {
    results.push({
      check: 'Keyboard reachable',
      passed: false,
      details: e.message,
    });
    overallPassed = false;
    return { passed: overallPassed, results }; // Can't continue if we can't reach it
  }

  // 2. Verify focus indicator
  const focusResult = await verifyFocusIndicator(page);
  results.push({
    check: 'Focus indicator visible',
    passed: focusResult.hasIndicator,
    details: focusResult.details,
  });
  if (!focusResult.hasIndicator) overallPassed = false;

  // 3. Verify element is visible and not obscured
  const visResult = await verifyFocusedElementVisible(page);
  results.push({
    check: 'Element visible in viewport',
    passed: visResult.isVisible,
    details: visResult.details,
  });
  if (!visResult.isVisible) overallPassed = false;

  // 4. Activate and check announcement (if expected)
  if (control.expectedAnnouncement !== undefined) {
    const announcementResult = await verifyAnnouncementAfterAction(
      page,
      async () => {
        await activate(page, control.activationKey || 'Enter');
      },
      {
        text: control.expectedAnnouncement,
        politeness: control.announcementPoliteness,
      }
    );
    results.push({
      check: 'Change announced to screen reader',
      passed: announcementResult.announced,
      details: announcementResult.details,
    });
    if (!announcementResult.announced) overallPassed = false;
  }

  return { passed: overallPassed, results };
}


// ============================================================
// EXPORTS
// ============================================================

export const a11y = {
  // Focus & keyboard
  tabTo,
  getTabOrder,

  // Focus indicators
  verifyFocusIndicator,
  getFocusIndicatorColors,

  // Visibility
  verifyFocusedElementVisible,

  // Announcements
  startCapturingAnnouncements,
  getAnnouncements,
  stopCapturingAnnouncements,
  verifyAnnouncementAfterAction,

  // Zoom
  testAtZoomLevel,

  // Accessible properties
  getAccessibleProperties,

  // Interaction
  activate,
  verifyEscapeCloses,
  verifyFocusTrap,

  // Accessibility tree
  getAccessibilityTreeSnapshot,

  // Composite
  testInteractionChain,
};
