// Re-exports from legacy attribution.ts (backward compat)
export {
  buildRefCode,
  appendRefToMessage,
  extractRefCode,
  parseRefCode,
  parseUTMParams,
} from "../attribution";
export type { RefCodeParams } from "../attribution";
// Note: legacy UTMParams exported as LegacyUTMParams to avoid conflict with
// the new UTMParams interface in utm-capture.ts (different shape).
export type { UTMParams as LegacyUTMParams } from "../attribution";

// Phase 1 — server-safe sub-modules
export * from "./constants";
export * from "./ref-code";

// Phase 1 — browser-only UTM capture (use client boundary lives in the module)
// Import directly from "@/lib/attribution/utm-capture" in client components.
// Re-exported here for convenience — only import in "use client" files.
export type { UTMParams } from "./utm-capture";
export { captureUTMFromURL, getStoredUTM, clearUTM } from "./utm-capture";
