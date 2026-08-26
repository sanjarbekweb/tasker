/**
 * Security Service for Database Encryption Key Management
 * Uses Expo SecureStore to securely isolate keys from source code, .env, and backups.
 */

import * as SecureStore from "expo-secure-store";
import { logger } from "../../utils/logger";

const DB_KEY_STORAGE_KEY = "numo_db_encryption_key_v1";

/**
 * Generates a cryptographically random 256-bit hex key (64 hex characters).
 */
export function generateEncryptionKey(): string {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Fallback for environments where crypto.getRandomValues might not be available
  let result = "";
  for (let i = 0; i < 64; i++) {
    result += Math.floor(Math.random() * 16).toString(16);
  }
  return result;
}

export class SecurityService {
  private static inMemoryFallback: Map<string, string> = new Map();

  /**
   * Retrieves the stored database encryption key or generates and stores a new one.
   */
  public static async getOrCreateDatabaseKey(): Promise<string> {
    try {
      const existingKey = await this.getDatabaseKey();
      if (existingKey) {
        return existingKey;
      }

      const newKey = generateEncryptionKey();
      await this.setDatabaseKey(newKey);
      logger.info("SecurityService", "Generated and securely stored new database encryption key");
      return newKey;
    } catch (err) {
      logger.error("SecurityService", "Failed to get or create database encryption key", err);
      throw err;
    }
  }

  /**
   * Retrieves the stored encryption key from SecureStore.
   */
  public static async getDatabaseKey(): Promise<string | null> {
    try {
      if (typeof SecureStore.getItemAsync === "function") {
        const key = await SecureStore.getItemAsync(DB_KEY_STORAGE_KEY);
        return key;
      }
    } catch (err) {
      logger.warn("SecurityService", "SecureStore getItemAsync failed, falling back", err);
    }
    return this.inMemoryFallback.get(DB_KEY_STORAGE_KEY) ?? null;
  }

  /**
   * Securely saves an encryption key to SecureStore.
   */
  public static async setDatabaseKey(key: string): Promise<void> {
    try {
      if (typeof SecureStore.setItemAsync === "function") {
        await SecureStore.setItemAsync(DB_KEY_STORAGE_KEY, key, {
          keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
        });
        return;
      }
    } catch (err) {
      logger.warn("SecurityService", "SecureStore setItemAsync failed, falling back", err);
    }
    this.inMemoryFallback.set(DB_KEY_STORAGE_KEY, key);
  }

  /**
   * Deletes the stored encryption key.
   */
  public static async clearDatabaseKey(): Promise<void> {
    try {
      if (typeof SecureStore.deleteItemAsync === "function") {
        await SecureStore.deleteItemAsync(DB_KEY_STORAGE_KEY);
      }
    } catch (err) {
      logger.warn("SecurityService", "SecureStore deleteItemAsync failed", err);
    }
    this.inMemoryFallback.delete(DB_KEY_STORAGE_KEY);
  }

  /**
   * Checks if an encryption key exists.
   */
  public static async hasDatabaseKey(): Promise<boolean> {
    const key = await this.getDatabaseKey();
    return key !== null && key.length > 0;
  }
}
