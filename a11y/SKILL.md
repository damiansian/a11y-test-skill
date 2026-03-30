---
name: a11y
description: >
  Digital accessibility skill that generates Playwright test scripts and manual test checklists to verify
  accessibility on the RENDERED page — going far beyond what automated scanners catch. Covers the full
  interaction chain: keyboard navigation, focus indicators, live region announcements, zoom/reflow,
  sticky element occlusion, and more. Also provides framework-specific remediation, design review,
  and document accessibility guidance against WCAG 2.2 AA. Use this skill whenever the user mentions
  accessibility, a11y, WCAG, ADA, Section 508, screen reader, ARIA, assistive technology, keyboard
  navigation, color contrast, alt text, accessible design, inclusive design, accessibility audit,
  accessibility testing, or Playwright a11y tests. Also trigger when reviewing HTML/CSS/React/Vue/Angular
  components for accessibility, generating accessibility test scripts, checking if a design or page is
  accessible, or remediating accessibility issues. Even if the user just says "is this accessible?",
  "test this for a11y", or "generate accessibility tests" — use this skill. When in doubt about whether
  accessibility is relevant to a request involving UI, web components, or testing — trigger this skill.
---

# Digital Accessibility Skill

## Core Philosophy

Automated accessibility tools catch roughly 30% of real accessibility issues. The remaining 70% — confusing tab order, missing live region announcements after interactions, focus indicators that disappear at 200% zoom, controls obscured by sticky headers, state changes that screen readers never communicate — these are the barriers that actually block people with disabilities. And they only show up when you test the **rendered, painted UI**, not the source code.

This skill exists to close that gap. Its primary capability is **generating Playwright test scripts** that verify accessibility on the rendered page, combined with **structured manual test checklists** for what automation can't cover. Together, they test what automated scanners miss.

### The Interaction Chain

Every interactive control must pass the full interaction chain to be genuinely accessible. This is the mental model that underpins all testing this skill generates:

1. **Keyboard reachable** — Can you Tab to it? (WCAG 2.1.1)
2. **Accessible name correct** — Not just present, but meaningful (WCAG 4.1.2)
3. **Focus indicator visible** — Not suppressed by CSS (WCAG 2.4.7, 2.4.13)
4. **Focus indicator contrast** — 3:1 against adjacent colors (WCAG 2.4.13)
5. **In viewport, not obscured** — Not covered by sticky headers/footers
6. **Keyboard activatable** — Enter/Space/arrows work correctly for the control type
7. **State change announced** — Live region communicates what changed (WCAG 4.1.3)
8. **Announcement politeness** — `polite` for status updates, `assertive` for errors
9. **Works at 200%/400% zoom** — Reflow, focus, operability all hold (WCAG 1.4.10)
10. **Works in High Contrast Mode** — Doesn't rely solely on color/background

Most dev teams aren't trained to think through this chain. Most AI tools don't test it. This skill does.

### Guiding Principles

**Start from the rendered UI, not the source code.** Source code tells you what was intended. The rendered DOM, the computed accessibility tree, and the painted output tell you what users actually get.

**Framework context changes everything.** A `<button>` in vanilla HTML, a `<Button>` in React, a `v-btn` in Vuetify, and a `mat-button` in Angular Material all have different default behaviors, failure modes, and ARIA patterns. Always ask what stack is in use.

**Accessibility is about people.** WCAG 2.2 AA is the floor, not the ceiling. Connect every issue to its human impact: "A screen reader user will hear nothing after selecting a filter — they won't know the table updated."

## Primary Standard

WCAG 2.2 AA is the default compliance target.

## How This Skill Is Organized

### Primary Capability: Playwright Test Generation

When a user asks to test, audit, or verify accessibility, your first instinct should be to **generate Playwright tests** that exercise the rendered page. Read `references/playwright-testing.md` for the complete guide.

The skill includes a reusable test helper library at `scripts/a11y-test-helpers.ts` that provides functions for testing the full interaction chain. Generated tests should import from this library.

**Two input paths:**
- **Feature description** → User describes what they're building → Generate tests for the expected accessible behavior + manual test checklist
- **Live page / component** → User points at a URL or existing component → Generate exploratory tests that audit what's there + manual test checklist

Always generate both a Playwright test file AND a companion manual test checklist. The combination is what catches the full spectrum.

### Reference Files

| User Need | Reference File | When to Read |
|-----------|---------------|--------------|
| **Generating accessibility test scripts** | `references/playwright-testing.md` | **Primary reference.** Read for any test generation, audit, or verification request. |
| DOM, accessibility tree, name computation, roles, states | `references/core-concepts.md` | Read for technical accessibility work. Foundation for understanding. |
| Auditing a website, web app, or component | `references/web-audit.md` | User wants to manually audit web content |
| Reviewing a design for accessibility | `references/design-review.md` | User has a design artifact to review |
| Fixing a specific accessibility issue | `references/remediation.md` | User needs a fix, or issues found during testing |
| Making documents accessible | `references/doc-a11y.md` | PDF, Word, PowerPoint accessibility |
| Creating training materials | `references/training.md` | Educating others about accessibility |

### Scripts

| Script | Purpose |
|--------|---------|
| `scripts/a11y-test-helpers.ts` | Reusable Playwright helper functions for the interaction chain tests. Import this in generated tests. |

## Interaction Patterns

### When the user asks to test or audit (PRIMARY PATH):

1. Read `references/playwright-testing.md`
2. Determine the input path: feature description or live page
3. Ask about the tech stack if not known
4. Generate a Playwright test file covering the interaction chain
5. Generate a companion manual test checklist
6. Explain what the tests cover and what still needs human verification

### When the user asks for help fixing an issue:

1. Read `references/remediation.md` and `references/core-concepts.md`
2. Ask about the framework/stack
3. Provide framework-specific fix code
4. Explain the fix in terms of what changes in the accessibility tree
5. Suggest adding a Playwright test to prevent regression

### When the user asks about design accessibility:

1. Read `references/design-review.md`
2. Review for WCAG 2.2 AA compliance and usability
3. Flag issues early — cheaper to fix in design than code
4. Provide annotations developers can act on

### When the user asks for training content:

1. Read `references/training.md`
2. Tailor to the audience
3. Emphasize hands-on exercises and the interaction chain mental model

## What NOT to Do

- Don't stop at static code review. If you can generate a Playwright test that would catch the issue on the rendered page, do it.
- Don't give generic ARIA advice without framework context.
- Don't treat automated scanner results as a complete audit. Always note the 30% limitation.
- Don't forget the manual test checklist. Even the best Playwright tests miss ~50% of what a human tester catches.
