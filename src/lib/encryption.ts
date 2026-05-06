/**
 * Encryption utilities for sensitive data (multi-tenant ready)
 * Uses AES-256-GCM with AUTH_SECRET as master key
 * 
 * Usage for multi-tenant:
 * - Store encrypted in DB per-tenant: encrypt(value)
 * - Read from DB: decrypt(encryptedValue)
 * - Display masked: maskToken(value)
 * 
 * Applies to: YCloud API Key, Bot Tokens, API Keys, credentials
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(salt: Buffer): Buffer {
  const secret = process.env.AUTH_SECRET || "default-secret-change-me";
  return scryptSync(secret, salt, 32);
}

export function encrypt(text: string): string {
  if (!text) return "";
  
  const salt = randomBytes(16);
  const key = getKey(salt);
  const iv = randomBytes(12);
  
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  // Format: salt:iv:authTag:encrypted
  return `${salt.toString("hex")}:${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  
  try {
    const [saltHex, ivHex, authTagHex, encrypted] = encryptedText.split(":");
    
    const salt = Buffer.from(saltHex, "hex");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const key = getKey(salt);
    
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("[encryption] Decrypt error:", error);
    return "";
  }
}

export function maskToken(token: string): string {
  if (!token || token.length < 8) return "••••••••";
  return token.slice(0, 4) + "••••••••" + token.slice(-4);
}