# Design Accessibility Review

## Table of Contents
1. Why Review Designs for Accessibility
2. What to Evaluate
3. Color and Contrast
4. Typography and Readability
5. Interactive Element Design
6. Layout and Navigation
7. Content and Information Architecture
8. Motion and Animation
9. Responsive and Adaptive Design
10. Annotating Designs for Developers

---

## 1. Why Review Designs for Accessibility

Fixing accessibility in design is dramatically cheaper than fixing it in code. A color contrast issue caught in a mockup is a 5-minute palette adjustment. The same issue caught in production might mean updating a design token, rebuilding components across a system, and re-testing everything downstream.

Design review isn't about applying a checklist to a mockup — it's about ensuring the design can be experienced by people with diverse abilities. A beautiful interface that a blind user can't navigate, a low-vision user can't read, or a motor-impaired user can't operate has failed at its fundamental purpose.

---

## 2. What to Evaluate

When reviewing a design for accessibility, assess these areas:

- **Color and contrast**: Can all text, icons, and interactive elements be perceived?
- **Typography**: Is text readable at different sizes? Does the design accommodate zoom?
- **Interactive elements**: Are controls clearly identifiable, large enough, and obviously interactive?
- **Layout and navigation**: Is the structure logical? Is it clear how to navigate?
- **Content**: Is information hierarchy clear? Are instructions understandable?
- **Motion**: Does the design rely on animation for understanding? Can motion be paused?
- **Responsiveness**: How does the design adapt to zoom, different viewports, and user preferences?

---

## 3. Color and Contrast

### WCAG 2.2 AA contrast requirements

- **Normal text** (under 18pt or under 14pt bold): **4.5:1** contrast ratio against its background
- **Large text** (18pt+ or 14pt+ bold): **3:1** contrast ratio
- **UI components and graphical objects**: **3:1** contrast ratio for elements that convey information (icons, form field borders, chart elements, focus indicators)

### Beyond the ratios

Contrast ratios are necessary but not sufficient. Also check:

- **Color is not the only indicator.** If error states are shown only by turning a field border red, users who can't perceive red won't know there's an error. Add an icon, text message, or pattern change alongside color.
- **Adjacent color differentiation.** In charts, graphs, and data visualizations, adjacent colors need to be distinguishable not just by hue but by value (lightness/darkness). Test with a color blindness simulator (e.g., Sim Daltonism, Chrome DevTools vision emulation).
- **Text over images or gradients.** When text appears over variable backgrounds (hero images, gradient overlays), verify contrast at the worst-case point — the lightest part of the background for dark text, the darkest for light text. A semi-transparent overlay can help, but check the math.
- **Disabled state contrast.** WCAG doesn't require contrast on disabled controls, but they still need to be perceivable as present. If a disabled button is nearly invisible, users won't understand the interface state.
- **Dark mode.** Check contrast in all color modes. A palette that passes in light mode may fail in dark mode or vice versa.

### Tools for design review

- Figma: Stark plugin, A11y - Color Contrast Checker plugin
- Sketch: Stark plugin
- Adobe XD: Color Contrast Analyzer
- General: WebAIM Contrast Checker (paste hex values), Colour Contrast Analyser (desktop app with eyedropper)

---

## 4. Typography and Readability

- **Base font size**: 16px minimum for body text on the web. Smaller sizes can be used for captions, footnotes, or secondary information, but the primary reading experience should be 16px+.
- **Line height**: 1.5× the font size for body text (WCAG 1.4.12 Text Spacing). This also applies to paragraphs — cramped text is harder to read for everyone, especially users with dyslexia or cognitive disabilities.
- **Line length**: 45-80 characters per line for readability. Extremely long lines cause tracking errors.
- **Font choice**: Choose typefaces with clear letter differentiation. Watch for fonts where `I` (uppercase i), `l` (lowercase L), and `1` (one) look identical, or `O` (uppercase o) and `0` (zero) are indistinguishable.
- **Text spacing flexibility**: The design should accommodate users overriding line height to 1.5×, paragraph spacing to 2× font size, letter spacing to 0.12× font size, and word spacing to 0.16× font size without loss of content (WCAG 1.4.12). Designs with fixed-height containers that clip text will fail this.
- **Reflow at 400% zoom**: Content should reflow to a single column at 400% zoom (WCAG 1.4.10) without horizontal scrolling (except for content like data tables, images, or maps that inherently require two-dimensional layout).

---

## 5. Interactive Element Design

### Touch and click targets

WCAG 2.2 requires a minimum **24×24 CSS pixel** target size (Success Criterion 2.5.8 Target Size Minimum), with limited exceptions for inline text links, elements whose size is essential, and browser-default controls.

Design targets at **44×44 pixels** or larger for comfortable use — 24×24 is the minimum, not the recommendation. Include adequate spacing between adjacent targets to prevent accidental activation.

### Making interactive elements identifiable

- **Buttons should look like buttons.** They need a visual border, background, or other non-color indicator that distinguishes them from non-interactive text. An underline-free colored text link that looks identical to non-linked text is a barrier.
- **Links within text** should be distinguishable from surrounding text by more than just color. Underlines are the safest convention. If you must remove underlines, combine color with another indicator (bold weight, icon, different typeface) and ensure the link color has 3:1 contrast against surrounding text.
- **Focus indicators** must be visible and meet WCAG 2.2 Focus Appearance requirements: at minimum 2px thick, with sufficient contrast. Design a custom focus indicator rather than relying on browser defaults — browser defaults vary and may not meet requirements.
- **State indicators**: Clearly differentiate default, hover, active, focus, disabled, selected, and error states through multiple visual cues (not color alone).

### Forms

- Every input needs a visible label positioned consistently (above or to the left for LTR languages). Placeholder text is not a label — it disappears when the user starts typing.
- Required fields should be indicated before the form (e.g., "fields marked with * are required") and each required field should be visually marked.
- Error messages should appear close to the relevant field with a clear visual connection (proximity, lines, icons).
- Group related inputs visually and structurally (radio buttons, checkboxes, address fields).

---

## 6. Layout and Navigation

### Heading hierarchy

Design should establish a clear visual heading hierarchy that maps to a logical HTML heading structure (h1 → h2 → h3). The visual size, weight, and position of headings should indicate their level. Each page should have one h1 (the primary page title).

### Landmarks and regions

Identify the major regions of the page in the design: header, primary navigation, main content, sidebar/complementary content, footer. These will map to HTML landmark elements. Multiple navigations or sections need distinct labels.

### Reading order

The visual layout must have a logical reading order that can be linearized for screen readers. Multi-column layouts, z-pattern layouts, and card grids need to have a clear order when read sequentially top-to-bottom, left-to-right. Verify by asking: if this content were read aloud in order, would it make sense?

### Skip navigation

Include a "skip to main content" link as the first focusable element on each page. This lets keyboard users bypass repetitive navigation on every page load. The design should account for its visual appearance when focused.

---

## 7. Content and Information Architecture

- **Clear language**: Write instructions, labels, and error messages in plain language. Jargon, abbreviations, and idioms create barriers for users with cognitive disabilities and non-native language speakers.
- **Consistent navigation**: Keep navigation in the same relative position across pages. Don't rearrange nav items between pages.
- **Predictable patterns**: Interactive elements that look the same should behave the same throughout the interface.
- **Error recovery**: Design error states that identify the error, explain what went wrong in plain language, and suggest how to fix it. Form validation should indicate which fields have errors and what's expected.
- **Redundant cues**: Don't rely on a single sensory channel. If a chart conveys meaning through color, add labels, patterns, or annotations. If a video conveys information through audio, provide captions. If an alert uses an icon, add text.

---

## 8. Motion and Animation

- **Prefers-reduced-motion**: The design should specify a reduced-motion alternative for all animations. Users who set `prefers-reduced-motion: reduce` in their OS should get a static or simplified experience.
- **No flashing content**: Nothing should flash more than 3 times per second (WCAG 2.3.1). This is a seizure risk and a hard requirement.
- **Auto-playing content**: Any content that auto-plays, scrolls, moves, or blinks for more than 5 seconds must have a pause, stop, or hide mechanism (WCAG 2.2.2).
- **Parallax and scroll-triggered animation**: These should be opt-in or have reduced-motion alternatives. They can cause vestibular discomfort for some users.

---

## 9. Responsive and Adaptive Design

- **Orientation**: Content should work in both portrait and landscape (WCAG 1.3.4) unless a specific orientation is essential.
- **Zoom**: Test the design at 200% and 400% zoom. Content should reflow rather than requiring horizontal scrolling.
- **Spacing override**: Designs should not break when users apply custom text spacing (line height 1.5, paragraph spacing 2×, letter spacing 0.12×, word spacing 0.16×).
- **High contrast mode**: The design should be usable in Windows High Contrast Mode (forced colors). Elements that rely on background colors for meaning (status badges, progress bars) need alternative indicators like borders, icons, or text.

---

## 10. Annotating Designs for Developers

Accessibility annotations bridge the gap between design and code. Include these annotations in your design handoff:

- **Heading levels**: Mark each heading with its level (h1, h2, h3...)
- **Landmark regions**: Label main, nav, aside, header, footer regions
- **Reading order**: Number elements in the intended reading order where it's not obvious from layout
- **Focus order**: For complex interactions (modals, tab panels, dynamic content), annotate where focus should go and when
- **Alternative text**: Write alt text directly in the design annotations — don't leave it to developers to guess
- **ARIA patterns**: For custom widgets, specify the expected ARIA pattern (e.g., "this is a disclosure pattern: button with aria-expanded, content panel")
- **Live regions**: Mark areas where dynamic updates should be announced to screen readers
- **Error states**: Include the error message text, where it should appear, and how it should be associated with the input
