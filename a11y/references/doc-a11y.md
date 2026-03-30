# Document Accessibility

## Table of Contents
1. Universal Principles
2. PDF Accessibility
3. Word Document Accessibility
4. Presentation (PowerPoint) Accessibility
5. Spreadsheet Accessibility
6. Testing Document Accessibility

---

## 1. Universal Principles

Regardless of format, accessible documents share these characteristics:

- **Semantic structure**: Headings, lists, and tables are marked up structurally (not just styled to look like headings/lists/tables). This lets assistive technology navigate by structure.
- **Reading order**: The logical reading order matches the visual order. In multi-column layouts, the reading order should flow as a human would read it, not jump randomly between columns.
- **Alternative text**: Images, charts, and non-text content have text alternatives that convey the same information.
- **Color independence**: Information is not conveyed by color alone. Charts, status indicators, and highlighted text all need a non-color cue.
- **Contrast**: Text meets minimum contrast ratios (4.5:1 for normal text, 3:1 for large text) against its background.
- **Language**: The document language is set, and passages in different languages are marked.
- **Meaningful link text**: Hyperlinks describe their destination ("View the Q4 report") rather than using generic text ("Click here", "Read more").

---

## 2. PDF Accessibility

### Tagged PDF

An accessible PDF is a **tagged PDF** — it contains a tag tree that defines the document structure (headings, paragraphs, lists, tables, figures). Without tags, a PDF is essentially a picture of text — screen readers can extract the raw text but can't navigate by headings, understand table structure, or skip decorative elements.

### Key requirements

- **Tags**: Every element should have an appropriate tag: `<H1>`-`<H6>` for headings, `<P>` for paragraphs, `<L>`/`<LI>` for lists, `<Table>`/`<TR>`/`<TH>`/`<TD>` for tables, `<Figure>` for images.
- **Reading order**: The tag tree order determines the reading order. Verify it matches the intended flow, especially in multi-column layouts where the visual order may differ from the tag order.
- **Alternative text**: Figures need alt text set on the `<Figure>` tag. Decorative images should be marked as artifacts (background/presentation) so screen readers skip them.
- **Table structure**: Data tables need header cells marked as `<TH>` with proper scope. Complex tables (merged cells, multi-level headers) need `Headers` attributes on `<TD>` cells pointing to their `<TH>` cells.
- **Form fields**: Interactive form fields need labels, tab order, and appropriate field types.
- **Document properties**: Title, language, and bookmarks should be set.

### Creating accessible PDFs

The best approach is to create an accessible source document (Word, InDesign, HTML) and export to PDF with accessibility settings enabled:

- **From Word**: Use Word's built-in styles and accessibility features → Export as PDF with "Document structure tags for accessibility" checked
- **From InDesign**: Use paragraph styles, set export tags, add alt text, set articles panel order → Export as tagged PDF
- **From HTML**: Use semantic HTML → Print or export to PDF (results vary by tool — purpose-built HTML-to-PDF libraries handle tags better than browser print)

### Remediating existing PDFs

For PDFs that weren't created accessibly, remediation is possible but labor-intensive:

- **Adobe Acrobat Pro**: Accessibility tools panel includes Auto Tag, Reading Order tool, Tag editor, and accessibility checker. The Reading Order tool is the primary way to assign tags visually.
- **PAC (PDF Accessibility Checker)**: Free tool that performs detailed accessibility checking against PDF/UA standard. Use it to verify fixes.
- **axesPDF**: Professional PDF remediation tool with a visual tag editor.

---

## 3. Word Document Accessibility

### Structure

- Use built-in heading styles (Heading 1, Heading 2, etc.) — don't just bold and enlarge text. Screen readers use heading styles for navigation.
- Use built-in list styles for bulleted and numbered lists.
- Use the Table tool for tables, with a designated header row. Avoid using tabs or spaces to create visual tables.
- Don't use text boxes for main content — text box reading order is unreliable across assistive technologies.

### Images and objects

- Add alt text to every informative image (right-click → Edit Alt Text). Mark decorative images as "Mark as decorative."
- For complex images (charts, diagrams), provide a detailed text description either as alt text or as visible text near the image.
- Avoid using images of text — use actual text styled as needed.

### Navigation and links

- Use a table of contents generated from heading styles.
- Use descriptive hyperlink text. The display text should describe the destination, not show the raw URL.
- Avoid "Click here" or "Read more" — screen reader users often navigate by links out of context.

### Accessibility Checker

Word's built-in Accessibility Checker (Review → Check Accessibility) catches common issues: missing alt text, missing table headers, blank table cells, merged/split cells that confuse reading order. Run it before finalizing.

---

## 4. Presentation (PowerPoint) Accessibility

### Slide structure

- Use built-in slide layouts rather than freeform text boxes. Built-in layouts define the reading order automatically.
- Set the reading order for each slide (Home → Arrange → Selection Pane). Items at the bottom of the selection pane are read first.
- Every slide should have a unique title — screen readers use slide titles for navigation.

### Content

- Add alt text to all non-decorative images, charts, and SmartArt.
- Ensure sufficient contrast between text and background.
- Don't rely on animations to convey information — the content should make sense without animation.
- For embedded videos, include captions.
- Limit the amount of text per slide — dense slides are harder for everyone, especially users of magnification.

### Tables

- Use simple table structures (no merged cells, no nested tables).
- Designate a header row (Table Design → check "Header Row").

### Distribution

- If distributing as a file, keep it in .pptx format (accessible) rather than converting to PDF (which often loses accessibility structure).
- If presenting live, make materials available in advance for attendees who use screen readers or magnification.

---

## 5. Spreadsheet Accessibility

### Structure

- Name each worksheet descriptively (not "Sheet1", "Sheet2").
- Use headers in the first row and first column where applicable.
- Avoid blank rows and columns within data ranges — they break table navigation for screen readers.
- Format data as an Excel Table (Insert → Table) for proper structure.
- Avoid merged cells — they confuse screen reader navigation within tables.

### Content

- Add alt text to charts and images.
- Use cell comments or notes to provide context where needed (but don't over-rely on them — they can be missed).
- Use meaningful cell formatting (number formats, date formats) rather than text-based workarounds.
- If using color coding, add a text-based indicator in an adjacent column.

### Navigation

- Keep navigation simple. Avoid overly complex multi-sheet structures with cross-references that require extensive jumping.
- Provide a summary sheet or table of contents for complex workbooks.

---

## 6. Testing Document Accessibility

### PDF

- **PAC (PDF Accessibility Checker)**: Free. Checks against PDF/UA and WCAG. The most thorough automated checker for PDF.
- **Adobe Acrobat Accessibility Checker**: Built into Acrobat Pro. Full Check runs through a comprehensive list.
- **Screen reader test**: Open the PDF in a screen reader. Can you navigate by headings? Do tables announce headers as you move between cells? Are form fields labeled? Is the reading order correct?

### Word

- **Built-in Accessibility Checker**: Catches structural issues, missing alt text, reading order problems.
- **Screen reader test**: Open in Word with a screen reader. Navigate by headings (NVDA: H key in browse mode). Do headings exist and follow a logical order?

### PowerPoint

- **Built-in Accessibility Checker**: Checks reading order, missing titles, missing alt text.
- **Reading order check**: Review each slide's selection pane to verify reading order.
- **Screen reader test**: Navigate through slides and check that content is announced in the correct order.

### General tips

- Always test with a screen reader, not just automated checkers. Automated tools can tell you if a heading tag exists but not if the heading level is semantically correct for the content hierarchy.
- Test navigation: Can a user of assistive technology find specific content in the document without reading the entire thing linearly?
- Test alternative text: Are descriptions meaningful? Do they convey the same information as the visual content, or are they generic ("chart" instead of "chart showing 40% increase in sales")?
