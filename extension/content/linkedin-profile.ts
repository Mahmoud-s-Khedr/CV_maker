/**
 * Content script — runs on linkedin.com/in/* pages (document_idle).
 *
 * Scrapes the profile DOM and forwards the result to the service worker.
 * No direct API calls are made here; all fetches go through the service worker
 * to avoid CORS complications in content script context.
 */

import browser from '../shared/browser';
import type { LinkedInScrapedProfile } from '../shared/types';
import { PROFILE } from './selectors';

function qs(root: Element | Document, selector: string): string {
  return root.querySelector(selector)?.textContent?.trim() ?? '';
}

function qsAll(root: Element | Document, selector: string): Element[] {
  return Array.from(root.querySelectorAll(selector));
}

function scrapeProfile(): LinkedInScrapedProfile {
  const experience = qsAll(document, PROFILE.expItems).map((li) => ({
    title: qs(li, PROFILE.expTitle),
    company: qs(li, PROFILE.expCompany),
    dateRange: qs(li, PROFILE.expDates),
    description: qs(li, PROFILE.expDesc),
  }));

  const education = qsAll(document, PROFILE.eduItems).map((li) => ({
    school: qs(li, PROFILE.eduSchool),
    degree: qs(li, PROFILE.eduDegree),
    dateRange: qs(li, PROFILE.eduDates),
  }));

  // Skills: deduplicate and filter empty strings
  const skills = qsAll(document, PROFILE.skillItems)
    .map((el) => el.textContent?.trim() ?? '')
    .filter((s) => s.length > 0)
    .filter((s, i, arr) => arr.indexOf(s) === i);

  return {
    fullName: qs(document, PROFILE.name),
    headline: qs(document, PROFILE.headline),
    location: qs(document, PROFILE.location),
    summary: qs(document, PROFILE.about),
    experience: experience.filter((e) => e.title || e.company),
    education: education.filter((e) => e.school),
    skills,
  };
}

// Send scraped data to the service worker so it can cache it
// The popup will retrieve it on demand via GET_CACHED_PROFILE
browser.runtime.sendMessage({ type: 'PROFILE_READY', payload: scrapeProfile() }).catch(() => {
  // Service worker may not be ready yet — content scripts are fire-and-forget here
});
