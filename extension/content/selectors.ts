/**
 * All LinkedIn DOM selectors live here.
 * When LinkedIn updates their UI, only this file needs to change.
 *
 * Strategy:
 * - Prefer `data-field` attributes (set by LinkedIn's own rendering layer, more stable)
 * - Fall back to semantic class names only when data-field is not present
 * - Each selector is documented with what it captures
 */

export const PROFILE = {
  // Full name — <h1> in the top card
  name: 'h1.text-heading-xlarge',

  // Headline / job title below the name
  headline: 'div.text-body-medium.break-words',

  // Location text chip
  location: 'span.text-body-small.inline.t-black--light.break-words',

  // "About" / summary section — the expanded <span> inside the section
  about: '#about ~ div div span[aria-hidden="true"]',

  // ── Experience ──────────────────────────────────────────────────────────────
  // Each experience entry is a <li> directly under #experience's following div
  expItems: '#experience ~ div ul > li',
  // Within each <li>:
  expTitle: 'div[data-field="experience_component_title"] span[aria-hidden="true"]',
  expCompany: 'span[data-field="experience_component_subtitle"] span[aria-hidden="true"]',
  expDates: 'span[data-field="experience_component_date_range"] span[aria-hidden="true"]',
  expDesc: 'div[data-field="experience_component_description"] span[aria-hidden="true"]',

  // ── Education ───────────────────────────────────────────────────────────────
  eduItems: '#education ~ div ul > li',
  eduSchool: 'div[data-field="education_component_school_name"] span[aria-hidden="true"]',
  eduDegree: 'div[data-field="education_component_degree_name"] span[aria-hidden="true"]',
  eduDates: 'span[data-field="education_component_date_range"] span[aria-hidden="true"]',

  // ── Skills ───────────────────────────────────────────────────────────────────
  // Skill name within each skill <li>
  skillItems: '#skills ~ div ul > li span[aria-hidden="true"]',
} as const;

export const JOB = {
  // Job title in the unified top card
  title: 'h1.t-24',

  // Company name link
  company: '.job-details-jobs-unified-top-card__company-name a',

  // Location / workplace type
  location: '.job-details-jobs-unified-top-card__bullet',

  // Full job description HTML container
  description: '#job-details',
} as const;
