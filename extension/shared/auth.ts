import browser from './browser';

const TOKEN_KEY = 'hcv_token';
const API_BASE_KEY = 'hcv_api_base';

export const DEFAULT_API_BASE = 'https://api.handiscv.com';

export async function getToken(): Promise<string | null> {
  const result = await browser.storage.local.get(TOKEN_KEY);
  return (result[TOKEN_KEY] as string) ?? null;
}

export async function setToken(token: string): Promise<void> {
  await browser.storage.local.set({ [TOKEN_KEY]: token });
}

export async function clearToken(): Promise<void> {
  await browser.storage.local.remove(TOKEN_KEY);
}

export async function getApiBase(): Promise<string> {
  const result = await browser.storage.local.get(API_BASE_KEY);
  return (result[API_BASE_KEY] as string) ?? DEFAULT_API_BASE;
}

export async function setApiBase(base: string): Promise<void> {
  await browser.storage.local.set({ [API_BASE_KEY]: base });
}
