/**
 * Content script — runs on linkedin.com/jobs/view/* pages (document_idle).
 *
 * Scrapes the job listing DOM and forwards the result to the service worker.
 */

import browser from '../shared/browser';
import type { LinkedInJobPayload } from '../shared/types';
import { JOB } from './selectors';

function qs(selector: string): string {
  return document.querySelector(selector)?.textContent?.trim() ?? '';
}

function scrapeJob(): LinkedInJobPayload {
  // Description: grab text content of the job details container
  const descEl = document.querySelector(JOB.description);
  const description = descEl ? descEl.textContent?.trim() ?? '' : '';

  return {
    jobTitle: qs(JOB.title),
    company: qs(JOB.company),
    location: qs(JOB.location),
    description,
    url: window.location.href,
  };
}

browser.runtime.sendMessage({ type: 'JOB_READY', payload: scrapeJob() }).catch(() => {
  // Service worker may not be ready yet — fire-and-forget
});
