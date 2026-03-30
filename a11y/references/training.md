# Creating Accessibility Training Content

## Table of Contents
1. Training Principles
2. Audience-Specific Approaches
3. Content Formats
4. Common Training Topics
5. Exercises and Activities

---

## 1. Training Principles

Effective accessibility training changes behavior, not just awareness. To achieve this:

**Lead with empathy, not compliance.** "This is required by WCAG 2.2 SC 1.1.1" is far less motivating than "when this image loads for a screen reader user, they hear silence — they don't know it exists, and it contains the instructions they need to complete their task." Start with the human experience, then connect it to the standard.

**Make it hands-on.** People retain accessibility knowledge when they experience it. Have developers navigate their own interface with a screen reader. Have designers use a color blindness simulator on their own mockups. Theory that stays theoretical doesn't change practice.

**Teach the underlying model, not a checklist.** Checklists get outdated, forgotten, and applied mindlessly. Understanding the accessibility tree, how screen readers traverse it, and how keyboard focus works gives people the mental model to solve novel problems they haven't seen on any checklist.

**Meet people where they are.** A design team, a frontend engineering team, a QA team, and a product leadership group all need different training. Tailor examples, vocabulary, and depth to the audience.

**Acknowledge the 30% problem.** Be upfront that automated tools catch about 30% of issues. This sets realistic expectations and motivates people to learn manual testing techniques. If someone thinks a green Lighthouse score means their site is accessible, they need this framing first.

---

## 2. Audience-Specific Approaches

### Developers

**Focus on:** The DOM and accessibility tree, semantic HTML, ARIA patterns, keyboard interaction, focus management, framework-specific patterns, and testing with browser DevTools.

**Key messages:**
- Native HTML elements are your most powerful accessibility tool — they come with free keyboard handling, screen reader support, and state management
- ARIA is an override mechanism, not a substitute for semantic HTML
- Test in the browser's accessibility tree view, not just the DOM
- Focus management in SPAs is the #1 thing you're probably missing

**Exercises:**
- Navigate your team's product using only the keyboard. Document what breaks.
- Turn on a screen reader and complete a core user flow. Note what's confusing.
- Look at a component in the accessibility tree inspector. Is the role, name, and state correct?

### Designers

**Focus on:** Color contrast, touch/click target sizing, state indicators, heading hierarchy, reading order, annotations for developers, inclusive design patterns.

**Key messages:**
- If you design it right, developers can build it right. If you don't specify accessible behavior, developers will guess (and often guess wrong)
- Color contrast is measurable — use tools, don't eyeball it
- Every interactive element needs clearly designed states: default, hover, focus, active, disabled, error
- Think about how someone using magnification at 400% experiences your layout

**Exercises:**
- Run a contrast check on your current design system palette
- Try your design with a color blindness simulator
- Write the accessibility annotations for one of your screens (heading levels, reading order, alt text, focus behavior)

### QA / Testers

**Focus on:** Keyboard testing methodology, screen reader basics (enough to verify, not to become an expert), automated testing integration, bug reporting for accessibility issues.

**Key messages:**
- Add keyboard testing to your standard test runs — it catches a huge category of issues quickly
- Automated accessibility testing can run in CI/CD and catch regressions
- When reporting accessibility bugs, include: the WCAG success criterion, who's affected, how to reproduce, and expected behavior

**Exercises:**
- Run an axe-core scan on a test environment and triage the results
- Keyboard-test a form flow and document findings using the suggested bug report template
- Test one feature with NVDA or VoiceOver and report what was announced vs. what was expected

### Product Managers / Leadership

**Focus on:** Business case for accessibility, legal risk landscape, how to scope accessibility work, how to integrate accessibility into sprint planning and acceptance criteria.

**Key messages:**
- Accessibility failures are increasingly a legal liability (ADA lawsuits, DOJ enforcement, EU directives)
- Accessibility benefits everyone — captions help in noisy environments, keyboard navigation helps power users, clear design helps people in a hurry
- The cheapest time to fix accessibility is in design; the most expensive is after launch
- Accessibility isn't a separate project — it's a quality dimension, like performance or security

---

## 3. Content Formats

### Checklists

Useful as quick references, not as the sole training material. Structure checklists by role or phase:

- **Design checklist**: Contrast, target sizing, heading hierarchy, state indicators, color independence
- **Development checklist**: Semantic HTML, ARIA, keyboard handling, focus management, labels, alt text, live regions
- **QA checklist**: Keyboard testing, automated scan, screen reader spot-check, zoom/reflow check
- **Content checklist**: Clear language, meaningful link text, alt text quality, heading hierarchy in content

### Reference guides

Deeper than checklists, covering the *why* and *how*. Organized by topic (forms, navigation, images, dynamic content) or by WCAG principle (Perceivable, Operable, Understandable, Robust).

### Workshop materials

Structured sessions with slides, demos, and hands-on exercises. Plan for 60-90 minutes per workshop, with at least 30% of time for hands-on exercises. Provide a sandbox or test environment so participants can practice without risk.

### Quick-reference cards

One-page cards that developers or designers can pin up or bookmark. Focused on a single topic: keyboard shortcuts for screen reader testing, common ARIA patterns, contrast ratio quick reference, alt text decision tree.

---

## 4. Common Training Topics

### "Introduction to Digital Accessibility"
For any audience. Covers: what accessibility is and why it matters, the range of disabilities and assistive technologies, WCAG at a high level, and a live demo of screen reader usage. Duration: 45-60 minutes.

### "Accessible HTML and ARIA"
For developers. Covers: semantic HTML, the accessibility tree, when to use ARIA, common ARIA patterns (disclosure, dialog, tabs), name computation, keyboard interaction. Duration: 90 minutes with exercises.

### "Keyboard and Screen Reader Testing"
For developers and QA. Covers: keyboard testing methodology, screen reader basics (NVDA navigation, VoiceOver rotor), what to listen for, how to report findings. Duration: 60-90 minutes with hands-on testing.

### "Accessible Design Patterns"
For designers. Covers: contrast and color, typography, target sizing, state design, annotation practices, inclusive design thinking. Duration: 60-90 minutes with design critique exercise.

### "Accessibility in Your Sprint"
For product teams. Covers: writing accessible acceptance criteria, scoping accessibility in user stories, integrating automated testing in CI/CD, triaging accessibility bugs. Duration: 45-60 minutes.

---

## 5. Exercises and Activities

### The keyboard challenge
Ask participants to unplug (or cover) their mouse and complete a specific task on their own product. Provide a task card with 3-5 steps (e.g., "Sign up for an account, find the settings page, change your display name, log out"). Have them document where they got stuck.

### Screen reader first impressions
Have participants turn on NVDA (Windows) or VoiceOver (Mac) and navigate to their own product. Give them exactly 5 minutes. Then discuss: What was announced first? Could you find the main navigation? What surprised you?

### Alt text workshop
Show 10-15 images from the team's own product with the alt text hidden. Have participants write alt text for each one. Then reveal the current alt text and discuss: Is it meaningful? Too long? Too short? Does it convey the same information as the visual image?

### Contrast audit
Give each participant a screen or component to check. They use a contrast checker tool and flag every text/background combination that fails. Then discuss: Which failures are easy fixes (just change a shade) and which require design rethinking?

### Accessibility tree exploration
Walk through inspecting a component in Chrome/Firefox DevTools accessibility tree. Show the role, name, state, and relationships. Then have participants inspect a component from their own codebase and report what they find — is the name correct? Is the role right? Are states communicated?

### Bug bash
Run a focused accessibility bug bash: 30-60 minutes where the team tests a specific feature or page using keyboard, screen reader, and automated tools. Use a shared template for reporting. Review and triage findings together at the end.
