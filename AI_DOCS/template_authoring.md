# Dynamic CV Templates — Authoring Guide

This project supports **dynamic PDF templates** stored in the database (`Template.config` JSON) and rendered via `DynamicTemplateRenderer`.

## Where templates live
- Database table: `Template`
  - `id`: UUID
  - `name`: display name
  - `isPremium`: gate in UI
  - `config`: JSON template configuration

## How templates are used
1. Admin creates a template from the Admin Dashboard (Templates tab) or via `POST /api/admin/templates`.
2. The resume stores a selected template ID in `resume.content.meta.templateId`.
   - If `templateId` is one of the built-in templates (`standard`, `modern`, `minimalist`, `professional`, `executive`, `creative`), the built-in renderer is used.
   - Otherwise, the client fetches `GET /api/templates/:id` and passes `template.config` into the PDF renderer.
3. Rendering path:
   - `ResumeDocument` chooses built-in vs dynamic.
   - Dynamic templates render via `DynamicTemplateRenderer`.

## Template JSON overview
The JSON you store in `Template.config` is a **layout and style contract** for the renderer.

At a high level:
- `theme`: fonts, colors, margins
- `header`: how the top header is laid out
- `sections`: per-section rendering rules (title styles, item styles)
- optional layout blocks like a sidebar

The Admin Dashboard ships with a **starter JSON** you can edit.

## Resume data model (what templates receive)
The PDF renderer receives the full resume JSON (`ResumeSchema`):
- `profile`: name, contact, summary, links
- `sections`: array of sections (experience, education, skills, projects, custom…)
  - each section contains items; item fields vary by section type

If you add a custom section type, the renderer will still receive its raw items.

## Authoring rules
### 1) Be defensive
Real user data is messy.
- Treat fields as optional.
- Use safe defaults for missing strings.
- Avoid hard dependencies on a single section existing.

### 2) Use consistent typography
Recommended baseline:
- Body font size: 10–11
- Header name: 18–22
- Section title: 12–14
- Line height: ~1.4–1.6

### 3) Keep margins printable
A4/Letter printers will clip near edges.
- Prefer margins >= 24pt.

### 4) Section mapping strategy
The renderer looks at **section types** (e.g., `experience`, `education`, `skills`) and applies the corresponding config.
- Ensure `sections` contains keys for common types.
- For unknown/custom types, define a generic section style in your config if supported by your renderer.

## Recommended workflow
1. Create a template in Admin UI.
2. Copy the returned template ID.
3. In the editor, select the template from the dropdown.
4. Preview in the editor and on a public link (`/cv/:shareKey`).

## Testing checklist
- Empty resume (no items)
- Long text (wrapping)
- Many items (page breaks)
- Non-English characters
- Very long names/companies/links

## Notes / next improvements
- Consider adding a JSON schema validator (client-side) before allowing template save.
- Consider versioning templates if you expect frequent changes.
