/**
 * MV3 Service Worker — the central hub of the extension.
 *
 * Responsibilities:
 * 1. Cache scraped LinkedIn data from content scripts
 * 2. Relay API fetch calls from the popup (avoids CORS in popup context)
 * 3. Update the extension badge when jobs are saved
 *
 * Uses webextension-polyfill so the same code runs in Chrome and Firefox.
 */

import browser from '../shared/browser';
import { getToken, getApiBase } from '../shared/auth';
import type {
  ExtensionMessage,
  LinkedInScrapedProfile,
  LinkedInJobPayload,
  MessageResponse,
} from '../shared/types';

// In-memory cache (survives popup open/close, cleared on SW restart)
let cachedProfile: LinkedInScrapedProfile | null = null;
let cachedJob: LinkedInJobPayload | null = null;

// Badge counter (persisted across SW restarts via browser.storage)
async function getBadgeCount(): Promise<number> {
  const result = await browser.storage.local.get('hcv_badge_count');
  return (result['hcv_badge_count'] as number) ?? 0;
}

async function setBadgeCount(count: number): Promise<void> {
  await browser.storage.local.set({ hcv_badge_count: count });
  await browser.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  await browser.action.setBadgeBackgroundColor({ color: '#2563eb' });
}

// Restore badge on service worker restart
async function initBadge(): Promise<void> {
  const count = await getBadgeCount();
  if (count > 0) {
    await browser.action.setBadgeText({ text: String(count) });
    await browser.action.setBadgeBackgroundColor({ color: '#2563eb' });
  }
}

initBadge();

// ── Message handler ──────────────────────────────────────────────────────────
// With webextension-polyfill: returning a Promise from the listener keeps the
// channel open and resolves to the response value — no sendResponse callback needed.

browser.runtime.onMessage.addListener(
  (message: ExtensionMessage): Promise<MessageResponse> => {
    return handleMessage(message);
  },
);

async function handleMessage(message: ExtensionMessage): Promise<MessageResponse> {
  switch (message.type) {
    case 'PROFILE_READY': {
      cachedProfile = message.payload;
      return { data: null };
    }

    case 'JOB_READY': {
      cachedJob = message.payload;
      return { data: null };
    }

    case 'GET_CACHED_PROFILE': {
      return { data: cachedProfile };
    }

    case 'GET_CACHED_JOB': {
      return { data: cachedJob };
    }

    case 'API_FETCH': {
      try {
        const token = await getToken();
        const apiBase = await getApiBase();

        const res = await fetch(`${apiBase}${message.path}`, {
          method: message.method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: message.body != null ? JSON.stringify(message.body) : undefined,
        });

        const text = await res.text();
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }

        if (!res.ok) {
          const errorMsg =
            typeof data === 'object' && data !== null && 'error' in data
              ? (data as { error: string }).error
              : `HTTP ${res.status}`;
          return { error: errorMsg };
        }
        return { data };
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Network error' };
      }
    }

    case 'SET_BADGE': {
      await setBadgeCount(message.count);
      return { data: null };
    }

    default: {
      return { error: 'Unknown message type' };
    }
  }
}

// ── Tab navigation: re-inject content scripts if SPA navigation changes URL ──
// LinkedIn is a SPA; the content script fires once on hard load. For soft
// navigations we listen for tab updates and re-execute the appropriate script.

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const url = tab.url;

  if (url.includes('linkedin.com/in/')) {
    cachedProfile = null; // clear stale cache
    browser.scripting
      .executeScript({
        target: { tabId },
        files: ['content/linkedin-profile.js'],
      })
      .catch(() => {
        // Tab may not be accessible (e.g. about:// pages) — ignore
      });
  } else if (url.includes('linkedin.com/jobs/view/')) {
    cachedJob = null;
    browser.scripting
      .executeScript({
        target: { tabId },
        files: ['content/linkedin-job.js'],
      })
      .catch(() => {});
  }
});

export {};
