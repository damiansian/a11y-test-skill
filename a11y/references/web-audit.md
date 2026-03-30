# Web Accessibility Auditing

## Table of Contents
1. Choosing an Audit Approach
2. Automated Scanning
3. Manual Code and DOM Review
4. Keyboard Testing
5. Screen Reader Testing
6. Component-Level Auditing
7. User Journey Testing
8. Structuring Findings
9. Framework-Specific Audit Notes

---

## 1. Choosing an Audit Approach

There's no single right audit method — the right approach depends on context:

| Situation | Recommended Approach |
|-----------|---------------------|
| Quick sanity check on a live page | Automated scan + quick keyboard walkthrough |
| Pre-release QA on a feature | Component-level audit of new/changed components, then user journey test of the feature flow |
| Full-site compliance audit | All layers: automated scan → manual DOM review → keyboard testing → screen reader testing across key user journeys |
| Design handoff review | See `design-review.md` — audit the design before code exists |
| Investigating a specific reported issue | Targeted manual + AT testing focused on the reported component/flow |
| Evaluating a component library | Component-level audit of each pattern, testing with multiple AT combinations |

When a user asks for an audit, clarify scope and context before prescribing an approach. A startup checking their landing page needs different depth than an enterprise preparing for a compliance deadline.

---

## 2. Automated Scanning

### What automated tools catch

Automated tools reliably detect about 30% of WCAG issues. They're good at:

- Missing alt text on images
- Insufficient color contrast ratios (against WCAG AA thresholds: 4.5:1 for normal text, 3:1 for large text, 3:1 for UI components)
- Invalid ARIA attributes or roles
- Missing form labels
- Duplicate IDs (which break aria-labelledby/describedby references)
- Missing document language (`lang` attribute)
- Empty buttons and links
- Invalid heading hierarchy (skipped levels)

### What they miss

- Whether alt text is actually meaningful (they catch *missing* alt, not *bad* alt)
- Keyboard accessibility (focus order, focus traps, custom keyboard interactions)
- Whether ARIA patterns are correctly implemented (they catch invalid attributes but not misuse)
- Dynamic content accessibility (content that changes after page load)
- Screen reader experience (announcement order, context, verbosity)
- Cognitive accessibility (clear language, consistent navigation, error recovery)
- Touch target sizing on mobile
- Reflow and zoom behavior at 200-400%

### Recommended tools

- **axe-core** (via browser extension or CLI): Industry standard, low false-positive rate, integrates with CI/CD. The browser extension (axe DevTools) is the quickest way to scan.
- **Lighthouse** (built into Chrome DevTools): Runs axe-core plus additional checks. Good for a quick overview, but the accessibility score can be misleading — 100% doesn't mean accessible, it means the automated checks passed.
- **WAVE** (browser extension): Visual overlay showing issues in context on the page. Good for quick visual review of structure (headings, landmarks, alt text).
- **IBM Equal Access Checker**: Comprehensive ruleset that catches some issues other tools miss. Good as a second opinion.
- **Pa11y** (CLI): Useful for CI/CD integration and batch scanning.

### How to use automated scan results

1. Run the scan and export or review the results
2. Group issues by WCAG success criterion
3. Prioritize by severity: critical (blocks access entirely) > serious (significantly impairs access) > moderate (creates friction) > minor (suboptimal but workable)
4. Explicitly note what the automated scan cannot assess — this frames the scope of remaining manual testing

---

## 3. Manual Code and DOM Review

This is where you catch structural issues that automated tools miss. Inspect the rendered DOM and computed accessibility tree, not just the source code.

### What to check

**Document structure:**
- One `<main>` landmark per page
- Navigation in `<nav>` with accessible names if multiple nav elements exist
- Heading hierarchy is logical and doesn't skip levels (h1 → h2 → h3, not h1 → h3)
- Page title is descriptive and updates on SPA route changes
- Language is set (`<html lang="en">`) and changes are marked for inline foreign language content (`<span lang="fr">`)

**Semantic HTML usage:**
- Lists use `<ul>`, `<ol>`, `<dl>` — not divs with bullet characters
- Tables use `<table>` with `<th>` headers and appropriate `scope` attributes — not `<div>` grids styled to look like tables
- Buttons are `<button>` or `<input type="button">`, not `<div onclick>`
- Links are `<a href>`, not `<span onclick>`

**Forms:**
- Every input has a visible, associated label (not just placeholder text)
- Required fields are programmatically indicated (`aria-required="true"` or the `required` attribute) — not just visually (red asterisk alone is insufficient)
- Error messages are associated with their inputs via `aria-describedby` or `aria-errormessage`
- Form groups use `<fieldset>` and `<legend>` (especially for radio button groups and checkbox groups)
- Autocomplete attributes are set for common personal data fields (name, email, address, phone)

**Images and media:**
- Informative images have meaningful alt text (not filenames, not "image of...")
- Decorative images have `alt=""` or are applied via CSS background
- Complex images (charts, diagrams, infographics) have detailed text alternatives (either as alt + long description, or a visible text alternative nearby)
- Videos have captions and audio descriptions where applicable
- SVGs used as images have `role="img"` and an accessible name

**ARIA usage:**
- ARIA roles match the actual behavior of the element
- Required ARIA attributes are present (e.g., `aria-expanded` on disclosure triggers, `aria-selected` on tabs)
- `aria-hidden="true"` is not applied to interactive or important content
- ID references in `aria-labelledby`, `aria-describedby`, `aria-controls` actually point to existing elements

---

## 4. Keyboard Testing

Test the entire interface using only the keyboard. No mouse, no trackpad.

### How to test

1. Start at the top of the page. Press Tab to move through interactive elements.
2. For each element you reach:
   - Can you see where focus is? (visible focus indicator)
   - Does the focus order make logical sense?
   - Can you activate it? (Enter for links/buttons, Space for buttons/checkboxes, arrow keys for radio groups/tabs/menus)
   - If it opens something (dropdown, modal, submenu), can you navigate within it and close it (Escape)?
3. Can you reach all interactive content? Or are there elements you can only reach with a mouse?
4. Are there focus traps — places where Tab cycles endlessly within a section and you can't escape? (Focus traps are correct only inside modal dialogs.)
5. Does focus get lost? (Focus moves to `<body>` or an invisible element after an action.)

### Common keyboard failures

- **Custom dropdowns/selects** that open on mouse click but not on keyboard activation
- **Modal dialogs** that don't trap focus (you can tab behind the dialog) or don't return focus when closed
- **Hover-only interactions** (tooltips, preview cards, mega menus) that have no keyboard equivalent
- **Drag-and-drop** with no keyboard alternative
- **Infinite scroll** that prevents keyboard users from reaching footer content
- **SPA route changes** that don't manage focus (after clicking a nav link, focus stays on the link instead of moving to the new content)
- **Skip navigation links** that are missing or broken

---

## 5. Screen Reader Testing

Screen reader testing reveals the actual experience assistive technology users have. Behavior varies across screen reader + browser combinations.

### Recommended testing combinations

- **NVDA + Chrome** (Windows) — free, widely used, represents a large portion of screen reader users
- **JAWS + Chrome/Edge** (Windows) — the other major desktop screen reader
- **VoiceOver + Safari** (macOS/iOS) — the default for Apple users. Test on both desktop and mobile since behavior differs.
- **TalkBack + Chrome** (Android) — for mobile Android testing

At minimum, test with one Windows screen reader (NVDA is free) and VoiceOver on macOS or iOS.

### What to listen for

- **Page load**: Does the page title get announced? Does the screen reader land in a sensible place?
- **Navigation**: Can you navigate by headings (H key)? By landmarks (D key in NVDA, rotor in VoiceOver)? Do these structural aids reflect the page content?
- **Interactive elements**: Are buttons announced as buttons? Links as links? Are their names correct and descriptive?
- **Forms**: Are labels announced when you focus each input? Are required fields indicated? Are error messages associated and announced?
- **Dynamic content**: When content changes (new items load, a notification appears, a live region updates), is the change announced?
- **Images**: Are informative images described? Are decorative images silent?
- **Tables**: In data tables, are headers announced as you navigate between cells?

---

## 6. Component-Level Auditing

For design systems or component libraries, audit each component pattern in isolation before testing them in context. This catches issues at the pattern level where they're cheapest to fix — a fix to the button component fixes every button instance.

### Process

1. Identify all unique interactive component patterns (buttons, inputs, dropdowns, modals, tabs, accordions, cards, navigation, etc.)
2. For each component:
   - Check the rendered DOM and accessibility tree
   - Verify keyboard interaction matches the expected APG pattern
   - Test with a screen reader
   - Test in different states (disabled, loading, error, expanded/collapsed)
   - Verify across supported browsers
3. Document the expected accessible behavior for each component (role, name source, keyboard interaction, states) — this becomes the component's accessibility spec

---

## 7. User Journey Testing

Once components are solid, test complete user journeys to catch issues that only appear in context.

### Selecting journeys

Pick the most common and most critical user journeys. For an e-commerce site: browse products → add to cart → checkout → confirmation. For a SaaS app: sign up → onboard → complete a core task → manage settings.

### What to test

- Does the page title update to reflect the current step?
- Is focus managed correctly through the flow? (After form submission, does focus move to the result or next step?)
- If errors occur, can the user perceive them, understand them, and recover?
- Are loading states communicated to screen readers?
- Does the flow work entirely by keyboard?
- Are timeout-sensitive steps accessible? (Session timeouts, timed forms)

---

## 8. Structuring Findings

### Issue format

For each finding, document:

1. **Summary**: One-line description of the issue
2. **WCAG criterion**: The specific success criterion that's not met (e.g., 1.1.1 Non-text Content, 2.1.1 Keyboard)
3. **Severity**: Critical / Serious / Moderate / Minor
4. **Location**: Where on the page or in the component the issue occurs
5. **Impact**: Who is affected and how — connect to real user experience
6. **How to reproduce**: Steps to encounter the issue
7. **Recommendation**: Specific fix, ideally with code or design guidance

### Severity definitions

- **Critical**: Blocks access entirely. A keyboard user cannot complete a task. A screen reader user cannot perceive content that's essential to the page purpose. No workaround exists.
- **Serious**: Significantly impairs access. The user can eventually accomplish the task but with major difficulty or confusion. May require a workaround.
- **Moderate**: Creates noticeable friction but doesn't block access. The user can accomplish the task with some extra effort.
- **Minor**: Technically non-conformant or suboptimal but minimal impact on user experience. Best practice improvements.

---

## 9. Framework-Specific Audit Notes

### React

- Check that `key` props in lists are stable (not array indices) — unstable keys cause components to remount, which can lose focus state.
- Portals (`ReactDOM.createPortal`) can cause accessibility tree order to diverge from visual order. Modal dialogs using portals need extra care with focus management and `aria-modal`.
- Check custom hooks for focus management — a common pattern is `useFocusTrap()` or `useFocusReturn()`.
- Verify that `useEffect` cleanup restores focus correctly when components unmount.

### Vue

- Check `$nextTick()` usage for focus management after DOM updates — focus calls before the DOM updates won't work.
- Verify that `v-if` transitions don't leave orphaned ARIA references (an element referenced by `aria-describedby` gets removed by `v-if`).
- Check that router navigation triggers focus management or a live region announcement.

### Angular

- Check that `cdkFocusTrap` is used correctly in dialogs and that focus returns on close.
- Verify that `LiveAnnouncer` is used for dynamic content updates rather than raw `aria-live` attributes.
- Check that route changes trigger the `TitleStrategy` or a custom focus management solution.
- Material components often need `mat-label` for form fields — verify these are present.

### Static/vanilla HTML

- Check that JavaScript progressive enhancement doesn't break the base accessible experience (if JS fails to load, is the content still accessible?).
- Verify that CSS-only interactive patterns (`:hover` to reveal content, `:target` for navigation) have keyboard equivalents.
