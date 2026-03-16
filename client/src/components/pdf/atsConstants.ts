// ATS-safe font stack. @react-pdf/renderer ships these by default.
export const ATS_FONTS = {
  primary: 'Helvetica',
  bold: 'Helvetica-Bold',
  italic: 'Helvetica-Oblique',
  boldItalic: 'Helvetica-BoldOblique',
} as const;

// Minimum readable sizes
export const ATS_SIZES = {
  name: 18,
  sectionTitle: 12,
  body: 10,
  small: 9,
} as const;

// Printable margins (in pt, 1 inch = 72pt)
export const ATS_MARGINS = {
  page: 36, // 0.5 inch
  sectionGap: 10,
  itemGap: 6,
} as const;

// Canonical section headings recognised by Taleo / Workday / iCIMS keyword lookup tables.
// Classical ATS systems do not use NLP — they scan for exact known keywords.
export const ATS_SECTION_TITLES: Record<string, string> = {
  experience:     'Work Experience',
  education:      'Education',
  skills:         'Skills',
  projects:       'Projects',
  certifications: 'Certifications',
  languages:      'Languages',
  custom:         '', // falls back to user-supplied title
};

// Classical ATS expected parse order (sequential top → bottom).
// Parsers associate body lines with the most-recently-seen section header,
// so canonical order prevents mis-categorisation.
export const ATS_SECTION_ORDER = [
  'experience',
  'education',
  'skills',
  'certifications',
  'projects',
  'languages',
  'custom',
] as const;

/**
 * Return the ATS-canonical section heading.
 * Falls back to the user-supplied title for unknown / custom types.
 */
export function getAtsSectionTitle(type: string, userTitle: string): string {
  return ATS_SECTION_TITLES[type] || userTitle;
}

/**
 * Re-order sections to the canonical ATS parse order.
 * Relative order within the same type is preserved.
 */
export function atsOrderSections<T extends { type: string }>(sections: T[]): T[] {
  const orderMap = Object.fromEntries(
    (ATS_SECTION_ORDER as readonly string[]).map((t, i) => [t, i])
  );
  return [...sections].sort((a, b) => {
    const ai = orderMap[a.type] ?? ATS_SECTION_ORDER.length;
    const bi = orderMap[b.type] ?? ATS_SECTION_ORDER.length;
    return ai - bi;
  });
}
