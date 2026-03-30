# Core Accessibility Concepts

## Table of Contents
1. The DOM and the Accessibility Tree
2. Accessible Name Computation
3. Roles, States, and Properties
4. Focus Management
5. Live Regions
6. Framework Considerations

---

## 1. The DOM and the Accessibility Tree

The browser builds two parallel representations of a page: the DOM (Document Object Model) that drives visual rendering, and the accessibility tree that assistive technologies consume. They're related but not identical.

The accessibility tree is a simplified version of the DOM. It strips out purely presentational elements (decorative images, layout dividers, CSS-only styling) and exposes what matters to assistive technology: the **role** of each element (button, link, heading, region), its **name** (the label a screen reader announces), its **state** (expanded, checked, disabled, selected), and its **relationships** (what labels what, what describes what, what controls what).

### Why this matters

When you write `<div onclick="submit()">Submit</div>`, the DOM sees a clickable div. The accessibility tree sees... a generic div with no role, no keyboard interaction, and text content "Submit" that has no semantic meaning. A screen reader user encounters something that looks interactive visually but is invisible or meaningless to their technology.

Compare with `<button type="submit">Submit</button>`: the accessibility tree sees a button role, the name "Submit", and the browser automatically provides keyboard interaction (Enter/Space to activate), focus indication, and proper state management.

### Inspecting the accessibility tree

- **Chrome DevTools**: Elements panel > Accessibility pane shows the computed accessibility tree for any element. The "Full accessibility tree" view (enabled in DevTools settings) replaces the DOM tree with the accessibility tree.
- **Firefox DevTools**: Accessibility Inspector provides a dedicated panel with the full accessibility tree, plus audit features for contrast and keyboard issues.
- **Safari**: Web Inspector > Elements > Node panel > Accessibility section.

Always verify fixes by checking the actual computed accessibility tree, not just the source code. The browser applies cascade rules, ARIA overrides, and name computation algorithms that can produce unexpected results.

---

## 2. Accessible Name Computation

Every interactive element needs an accessible name — the text a screen reader announces to identify it. The browser follows a specific algorithm (the Accessible Name and Description Computation spec) to determine what that name is, and the sources are checked in priority order:

1. **aria-labelledby** — references another element's content by ID. Highest priority, overrides everything else.
2. **aria-label** — a string attribute directly on the element. Overrides native labeling mechanisms.
3. **Native labeling** — depends on the element type:
   - `<label for="id">` or wrapping `<label>` for form inputs
   - `<caption>` for tables
   - `<legend>` for fieldsets
   - `<figcaption>` for figures
   - `alt` attribute for images
4. **Text content** — the element's visible text (for elements whose role allows name from content, like buttons, links, headings).
5. **title attribute** — last resort, and generally unreliable since it's tooltip-dependent.
6. **placeholder** — technically part of the algorithm but never sufficient as the sole label (it disappears when the user types).

### Common mistakes

- **Redundant aria-label on links/buttons that already have text content.** If a button says "Submit" visually, adding `aria-label="Submit"` is harmless but pointless. Adding `aria-label="Submit form"` creates a disconnect between what sighted users see and what screen reader users hear.
- **aria-label on non-interactive elements.** `aria-label` is only reliably supported on interactive elements and landmarks. Putting it on a `<div>` or `<span>` without a role generally does nothing.
- **Empty alt on informative images.** `alt=""` is correct for decorative images — it removes them from the accessibility tree. But on an image that conveys information, it hides that information from screen reader users.
- **Icon buttons without names.** A `<button>` containing only an SVG icon or icon font has no accessible name unless you provide one via `aria-label`, visually hidden text, or the SVG's `<title>`.

### Name computation in practice

When debugging "this element has no accessible name" or "the screen reader announces the wrong thing," trace through the algorithm step by step. Check what `aria-labelledby` points to (does the referenced element exist? does it have visible text?), then `aria-label`, then native labels, then text content. The DevTools accessibility pane shows the computed name and its source — use it.

---

## 3. Roles, States, and Properties

### Implicit vs. explicit roles

Native HTML elements carry implicit roles: `<button>` has role `button`, `<a href>` has role `link`, `<nav>` has role `navigation`, `<h2>` has role `heading` with `aria-level="2"`. These come with built-in keyboard behavior, state management, and screen reader announcements — for free.

ARIA roles (`role="button"`, `role="dialog"`, `role="tablist"`) override the implicit role. They change what assistive technology thinks the element is, but they don't change its behavior. `<div role="button">` is announced as a button but doesn't respond to Enter/Space, doesn't appear in the tab order, and doesn't have button styling. You have to add all of that yourself.

**First rule of ARIA: don't use ARIA if a native HTML element does the job.** Native elements are more robust, require less code, and are less likely to break across assistive technology combinations.

### When ARIA is necessary

- **Custom widgets** that have no native HTML equivalent: tabs, tree views, comboboxes with custom filtering, drag-and-drop interfaces.
- **Dynamic content updates** that assistive technology needs to know about (live regions).
- **Relationships** between elements that aren't expressed by DOM structure: `aria-describedby`, `aria-controls`, `aria-owns`.
- **States** that native HTML doesn't express: `aria-expanded`, `aria-current`, `aria-pressed`.

### ARIA patterns by widget type

The WAI-ARIA Authoring Practices Guide (APG) documents expected keyboard interaction and ARIA patterns for common widgets. When implementing a custom widget, the APG is the authoritative reference for what roles, states, properties, and keyboard behavior to implement. Key patterns include:

- **Disclosure** (show/hide): `aria-expanded` on the trigger, `aria-controls` pointing to the content
- **Dialog (modal)**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title, focus trap within the dialog
- **Tabs**: `role="tablist"` > `role="tab"` + `role="tabpanel"`, `aria-selected`, arrow key navigation between tabs
- **Menu**: `role="menu"` > `role="menuitem"`, arrow key navigation, type-ahead, Escape to close
- **Combobox**: `role="combobox"` + `aria-expanded` + `aria-activedescendant` or focus management in the listbox

---

## 4. Focus Management

Focus determines where keyboard events go. Proper focus management is the backbone of keyboard accessibility.

### The tab order

By default, the tab order follows the DOM order for interactive elements (links, buttons, inputs, selects, textareas, elements with `tabindex="0"`). `tabindex` modifies this:

- **`tabindex="0"`** — adds the element to the natural tab order at its DOM position. Use this to make custom interactive elements focusable.
- **`tabindex="-1"`** — makes the element programmatically focusable (via `element.focus()`) but removes it from the tab order. Use this for elements that should receive focus only in specific situations (e.g., moving focus to an error message, focusing the first element in a newly opened dialog).
- **Positive `tabindex`** (1, 2, 3...) — avoid. It creates a parallel tab order that's confusing and fragile. Almost always a sign that the DOM order needs to be fixed instead.

### Focus management patterns

- **Modal dialogs**: On open, move focus to the first focusable element (or the dialog itself). Trap focus inside the dialog (Tab from the last element goes to the first, Shift+Tab from the first goes to the last). On close, return focus to the element that triggered the dialog.
- **Dynamic content**: When new content appears (a new section, an error message, a notification), decide whether focus should move to it. Error messages usually should receive focus. Supplementary content usually shouldn't — use a live region instead.
- **Single-page app navigation**: When a route change occurs without a full page load, move focus to the new content's heading or main landmark, or announce the page change via a live region. Without this, screen reader users don't know the page changed.
- **Delete/remove actions**: When an item in a list is deleted, move focus to a logical place — the next item, the previous item, or the list container. Don't leave focus on an element that no longer exists.

### The `:focus-visible` pseudo-class

CSS `:focus-visible` lets you show focus indicators for keyboard users while hiding them for mouse users. Always ensure a visible focus indicator exists for keyboard navigation — WCAG 2.2 requires minimum contrast and size for focus indicators (Success Criterion 2.4.13 Focus Appearance).

---

## 5. Live Regions

Live regions tell assistive technology about dynamic content changes without moving focus. They're essential for any UI that updates content on the page — notifications, status messages, chat, live search results, progress indicators.

### The attributes

- **`aria-live="polite"`** — announces the change after the screen reader finishes what it's currently saying. Use for most status updates.
- **`aria-live="assertive"`** — interrupts to announce immediately. Use sparingly — only for critical, time-sensitive messages (errors that block progress, session timeouts).
- **`role="status"`** — implicit `aria-live="polite"`. Semantic, preferred for status messages.
- **`role="alert"`** — implicit `aria-live="assertive"`. Use for error messages that need immediate attention.
- **`aria-atomic="true"`** — re-announces the entire region when any part changes (vs. just the changed text).

### Critical implementation detail

The live region element must exist in the DOM *before* the content changes. If you dynamically create an element with `aria-live` and immediately inject text, most screen readers won't announce it. The pattern is: render an empty live region in the initial HTML, then inject text into it when needed.

### Common mistakes

- Using `aria-live="assertive"` for routine updates (interrupts the user constantly).
- Adding `aria-live` to a container with lots of changing content (the screen reader announces every change, creating noise).
- Removing and re-adding the live region element instead of updating its content.
- Not testing with an actual screen reader — live region behavior varies across screen reader / browser combinations.

---

## 6. Framework Considerations

### React

- JSX uses `htmlFor` instead of `for` on labels, `className` instead of `class`, and camelCase for ARIA attributes: `aria-label`, `aria-labelledby`, `aria-describedby` (these are the exception — they're lowercase with hyphens, same as HTML).
- `React.Fragment` (`<>...</>`) doesn't render a DOM element, so it can't hold ARIA attributes or roles. If you need a semantic wrapper, use an actual element.
- State-driven rendering means focus management is a common pain point. When a component re-renders and the focused element is removed from the DOM, focus falls to `<body>`. Use `useRef` and `useEffect` to manage focus after state changes.
- Component libraries (Material UI, Chakra, Radix, Headless UI) vary widely in accessibility quality. Headless UI and Radix are designed with accessibility as a primary concern. Others may need additional ARIA attributes or keyboard handling.

### Vue

- Vue's template syntax uses standard HTML attributes, so `for`, `class`, and ARIA attributes work as expected.
- `v-if` vs. `v-show` matters for accessibility: `v-if` removes the element from the DOM (and the accessibility tree), `v-show` hides it visually but keeps it in the DOM. For content that should be completely hidden from all users including screen readers, use `v-if`. For content that's visually hidden but should remain accessible, neither is correct — use a visually-hidden CSS class.
- Vuetify and other component libraries often handle ARIA automatically but may need manual intervention for complex patterns.

### Angular

- Angular Material has dedicated `a11y` modules and CDK (Component Dev Kit) utilities: `FocusTrap`, `LiveAnnouncer`, `FocusMonitor`. Use them.
- Template-driven forms vs. reactive forms both need explicit labeling — Angular doesn't auto-associate labels with form controls.
- `*ngIf` behavior is similar to Vue's `v-if` — elements are removed from the DOM and accessibility tree.

### Vanilla HTML/CSS

- Semantic HTML is your best tool. Use `<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<section>` with accessible names, `<h1>`-`<h6>` for hierarchy.
- CSS can create accessibility issues: `display: none` removes from the accessibility tree, `visibility: hidden` removes from the accessibility tree, `opacity: 0` is visually hidden but remains in the accessibility tree, `clip-path` and the visually-hidden pattern (`.sr-only`) hide visually while keeping content accessible.
- CSS `content` property in `::before`/`::after` pseudo-elements is exposed to some screen readers. Don't put meaningful content there unless you verify it's announced, and don't put decorative content there without `aria-hidden` on the parent or ensuring the generated content doesn't interfere.
