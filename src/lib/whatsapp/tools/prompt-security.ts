"use client";

// Pattern detection for prompt injection attacks
// Based on ClinicForge's prompt_security.py

const INJECTION_PATTERNS_SPANISH = [
  /ignora.*instrucciones/i,
  /olvida.*reglas/i,
  /sos.*nuevo.*agente/i,
  /actuar.*como.*nuevo/i,
  /nuevo.*prompt/i,
  /cambiar.*personalidad/i,
  /ignorar.*reglas/i,
  /desactivar.*filtros/i,
  / режим.*разработчик/i, // russian dev mode
];

const INJECTION_PATTERNS_ENGLISH = [
  /ignore.*previous.*instructions/i,
  /new.*prompt/i,
  /jailbreak/i,
  /developer.*mode/i,
  /act as.*different/i,
  /you.*are.*now/i,
  /pretend.*to.*be/i,
  /override.*rules/i,
  /bypass.*safeguards/i,
];

const INJECTION_PATTERNS_CODE = [
  /```/,
  /`[^`]+`/,
  /respond as if/i,
  /respond in the following format/i,
];

export interface InjectionResult {
  detected: boolean;
  sanitizedMessage: string;
  pattern?: string;
}

export function sanitizeInput(message: string): string {
  // Remove code blocks and backticks
  let sanitized = message
    .replace(/```[\s\S]*?```/g, "[code removed]")
    .replace(/`[^`]+`/g, "[code removed]")
    .trim();
  
  return sanitized;
}

export function detectInjection(message: string): InjectionResult {
  const sanitized = sanitizeInput(message);
  
  // Check Spanish patterns
  for (const pattern of INJECTION_PATTERNS_SPANISH) {
    if (pattern.test(message)) {
      return {
        detected: true,
        sanitizedMessage: sanitized,
        pattern: pattern.source,
      };
    }
  }
  
  // Check English patterns
  for (const pattern of INJECTION_PATTERNS_ENGLISH) {
    if (pattern.test(message)) {
      return {
        detected: true,
        sanitizedMessage: sanitized,
        pattern: pattern.source,
      };
    }
  }
  
  // Check code patterns
  for (const pattern of INJECTION_PATTERNS_CODE) {
    if (pattern.test(message)) {
      return {
        detected: true,
        sanitizedMessage: sanitized,
        pattern: pattern.source,
      };
    }
  }
  
  return {
    detected: false,
    sanitizedMessage: sanitized,
  };
}

// Server-side version for agent
export function createPromptSecurityServer() {
  return {
    sanitizeInput,
    detectInjection,
  };
}