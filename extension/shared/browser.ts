/**
 * Cross-browser API shim.
 *
 * Import `browser` from this module instead of using the `chrome` global.
 * webextension-polyfill provides a unified Promise-based `browser.*` API that
 * works identically in Chrome (MV3) and Firefox (MV3, Gecko 109+).
 */
import browser from 'webextension-polyfill';

export default browser;
