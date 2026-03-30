# Accessibility Remediation Guide

## Table of Contents
1. Approach to Remediation
2. Common Issues and Fixes
3. Framework-Specific Patterns
4. ARIA Widget Patterns
5. Testing Your Fix

---

## 1. Approach to Remediation

When fixing an accessibility issue, work through these questions:

1. **Can a native HTML element solve this?** Before reaching for ARIA, check if a semantic HTML element provides the behavior you need. `<button>` instead of `<div onclick>`, `<details>/<summary>` instead of a custom accordion, `<dialog>` instead of a custom modal (in supported browsers).

2. **What should the accessibility tree look like after the fix?** Define the expected role, name, state, and relationships before writing code. Then verify using the browser's accessibility tree inspector.

3. **Does the fix work with keyboard?** Every mouse interaction needs a keyboard equivalent. If you add `aria-expanded` to a trigger, make sure Enter/Space toggles it and the content is reachable by Tab or arrow keys as appropriate.

4. **Does the fix work with screen readers?** The only way to know is to test. Check at minimum with NVDA+Chrome (free) and VoiceOver+Safari if on macOS.

---

## 2. Common Issues and Fixes

### Missing alternative text

**Issue:** Image has no `alt` attribute, or `alt` is empty on an informative image.

**Informative image fix:**
```html
<!-- Describe what the image conveys, not what it looks like -->
<img src="chart.png" alt="Sales increased 40% from Q1 to Q4 2024, with the largest jump in Q3">

<!-- For linked images, describe where the link goes -->
<a href="/profile"><img src="avatar.jpg" alt="Your profile"></a>
```

**Decorative image fix:**
```html
<img src="divider.png" alt="">
<!-- OR use CSS background-image instead -->
```

**Icon button fix:**
```html
<!-- Option 1: aria-label -->
<button aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Option 2: visually hidden text -->
<button>
  <svg aria-hidden="true">...</svg>
  <span class="sr-only">Close dialog</span>
</button>
```

### Missing form labels

**Issue:** Input has no associated label, or only has placeholder text.

**Fix:**
```html
<!-- Visible label with explicit association -->
<label for="email">Email address</label>
<input type="email" id="email" autocomplete="email">

<!-- For inputs that truly can't have a visible label (search box with a search button): -->
<label for="search" class="sr-only">Search</label>
<input type="search" id="search">
<button type="submit">Search</button>
```

### Insufficient color contrast

**Issue:** Text doesn't meet minimum contrast ratio.

**Fix:** Adjust the foreground or background color. For text on variable backgrounds:
```css
/* Semi-transparent overlay to ensure contrast */
.hero-text {
  background-color: rgba(0, 0, 0, 0.7);
  padding: 1rem;
  color: white;
}
```

### Missing focus indicators

**Issue:** Interactive elements have no visible focus indicator, or the indicator doesn't meet WCAG 2.2 Focus Appearance requirements.

**Fix:**
```css
/* Remove default only if you replace it */
:focus-visible {
  outline: 3px solid #1a73e8;
  outline-offset: 2px;
}

/* For dark backgrounds */
.dark-section :focus-visible {
  outline: 3px solid #ffffff;
  outline-offset: 2px;
}
```

### Non-semantic interactive elements

**Issue:** `<div>` or `<span>` used as a button, link, or other interactive element.

**Preferred fix — use native HTML:**
```html
<!-- Before -->
<div class="btn" onclick="submit()">Submit</div>

<!-- After -->
<button type="submit" class="btn">Submit</button>
```

**If you truly can't change the element** (legacy constraints):
```html
<div role="button" tabindex="0" onclick="submit()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();submit()}">
  Submit
</div>
```
This is worse than a native button — it requires manually handling keyboard events, doesn't get native form submission behavior, and is more code for the same result. Always prefer the native element.

### Missing or broken heading hierarchy

**Issue:** Headings skip levels (h1 → h3), or headings are chosen for visual size rather than semantic level.

**Fix:** Use headings in sequential order. Adjust visual size with CSS, not heading level:
```html
<h1>Page Title</h1>
  <h2>Section</h2>
    <h3>Subsection</h3>
  <h2>Another Section</h2>

<style>
/* If you want h2 to look smaller */
h2.compact { font-size: 1.25rem; }
</style>
```

### Missing landmark regions

**Issue:** Page has no semantic structure (all `<div>` containers).

**Fix:**
```html
<header>
  <nav aria-label="Primary">...</nav>
</header>
<main>
  <h1>Page Title</h1>
  ...
</main>
<aside aria-label="Related articles">...</aside>
<footer>...</footer>
```

---

## 3. Framework-Specific Patterns

### React

**Focus management after state change:**
```jsx
function Modal({ isOpen, onClose, title, children }) {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      closeButtonRef.current?.focus();
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">{title}</h2>
      <button ref={closeButtonRef} onClick={onClose}>Close</button>
      {children}
    </div>
  );
}
```

**Live region for status updates:**
```jsx
function SearchResults({ results, isLoading }) {
  return (
    <>
      {/* Live region exists before content changes */}
      <div role="status" aria-live="polite" className="sr-only">
        {isLoading ? 'Loading results...' : `${results.length} results found`}
      </div>
      <ul>
        {results.map(r => <li key={r.id}>{r.title}</li>)}
      </ul>
    </>
  );
}
```

**Accessible routing (React Router):**
```jsx
function RouteAnnouncer() {
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    // Update the announcement when route changes
    setAnnouncement(document.title);
    // Move focus to main content
    const main = document.querySelector('main');
    if (main) {
      main.tabIndex = -1;
      main.focus();
    }
  }, [location]);

  return (
    <div role="status" aria-live="assertive" className="sr-only">
      {announcement}
    </div>
  );
}
```

### Vue

**Focus management in Vue 3:**
```vue
<template>
  <div v-if="isOpen" role="dialog" aria-modal="true" :aria-labelledby="titleId">
    <h2 :id="titleId">{{ title }}</h2>
    <button ref="closeButton" @click="close">Close</button>
    <slot />
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const closeButton = ref(null);
let previousFocus = null;

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    previousFocus = document.activeElement;
    await nextTick();
    closeButton.value?.focus();
  } else if (previousFocus) {
    previousFocus.focus();
  }
});
</script>
```

### Angular

**Using CDK FocusTrap:**
```typescript
import { A11yModule } from '@angular/cdk/a11y';

@Component({
  template: `
    <div cdkTrapFocus [cdkTrapFocusAutoCapture]="true"
         role="dialog" aria-modal="true"
         [attr.aria-labelledby]="titleId">
      <h2 [id]="titleId">{{ title }}</h2>
      <button (click)="close()">Close</button>
      <ng-content></ng-content>
    </div>
  `
})
```

**Using LiveAnnouncer:**
```typescript
import { LiveAnnouncer } from '@angular/cdk/a11y';

constructor(private liveAnnouncer: LiveAnnouncer) {}

async onSearchComplete(count: number) {
  await this.liveAnnouncer.announce(`${count} results found`, 'polite');
}
```

---

## 4. ARIA Widget Patterns

For custom widgets, follow the WAI-ARIA Authoring Practices Guide (APG) patterns. Here are the most commonly needed patterns:

### Disclosure (show/hide)

```html
<button aria-expanded="false" aria-controls="content-1" onclick="toggle()">
  Show details
</button>
<div id="content-1" hidden>
  Content that can be shown or hidden.
</div>

<script>
function toggle() {
  const button = event.target;
  const content = document.getElementById(button.getAttribute('aria-controls'));
  const expanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', !expanded);
  content.hidden = expanded;
}
</script>
```

### Tabs

```html
<div role="tablist" aria-label="Account settings">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">
    Profile
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2" tabindex="-1">
    Security
  </button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">
  Profile content...
</div>
<div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden>
  Security content...
</div>
```

Keyboard: Arrow keys move between tabs. Tab key moves into the panel. The selected tab has `tabindex="0"`, unselected tabs have `tabindex="-1"`.

### Accordion

An accordion is a series of disclosure widgets. Each header toggles its own panel. Optionally, only one panel is open at a time.

```html
<div class="accordion">
  <h3>
    <button aria-expanded="true" aria-controls="section-1">
      Section 1
    </button>
  </h3>
  <div id="section-1" role="region" aria-labelledby="...">
    Content for section 1.
  </div>

  <h3>
    <button aria-expanded="false" aria-controls="section-2">
      Section 2
    </button>
  </h3>
  <div id="section-2" role="region" aria-labelledby="..." hidden>
    Content for section 2.
  </div>
</div>
```

---

## 5. Testing Your Fix

After applying a fix:

1. **Check the accessibility tree.** Open browser DevTools, inspect the element, check the Accessibility pane. Verify the role, name, and state are what you expect.
2. **Keyboard test.** Tab to the element. Can you reach it? Can you activate it? Does the focus indicator appear?
3. **Screen reader test.** Navigate to the element with a screen reader. What is announced? Is the role, name, and state communicated correctly? After interacting (expanding, selecting, toggling), is the state change announced?
4. **Automated scan.** Run axe-core on the page to verify the fix resolved the flagged issue and didn't introduce new ones.
5. **Context check.** Does the fix work in the broader page context? Does it affect other elements' focus order or announcement?
