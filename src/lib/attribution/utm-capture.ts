"use client";

import { COOKIE_NAME, COOKIE_EXPIRY_DAYS } from "./constants";

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ad_id?: string;
  campaign_id?: string;
  adset_id?: string;
  platform?: string;
}

const UTM_KEYS: (keyof UTMParams)[] = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "ad_id",
  "campaign_id",
  "adset_id",
  "platform",
];

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }

  return null;
}

/**
 * Reads UTM params from the current URL and saves them to a cookie.
 * Only writes the cookie if at least one UTM param is present.
 * Returns the captured params or null if none found.
 */
export function captureUTMFromURL(): UTMParams | null {
  const params = new URLSearchParams(window.location.search);
  const captured: UTMParams = {};

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      captured[key] = value;
    }
  }

  if (Object.keys(captured).length === 0) return null;

  setCookie(COOKIE_NAME, JSON.stringify(captured), COOKIE_EXPIRY_DAYS);

  return captured;
}

/**
 * Reads stored UTM params from the cookie.
 * Returns parsed params or null if no cookie is present or parsing fails.
 */
export function getStoredUTM(): UTMParams | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return parsed as UTMParams;
  } catch {
    return null;
  }
}

/**
 * Clears the UTM cookie by setting its expiry to the past.
 */
export function clearUTM(): void {
  document.cookie = `${COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
}
