import { describe, it, expect, beforeEach } from "vitest";
import { SecurityService, generateEncryptionKey } from "../src/services/security";

describe("SecurityService & Key Management", () => {
  beforeEach(async () => {
    await SecurityService.clearDatabaseKey();
  });

  it("generates a valid 256-bit (64 hex character) key", () => {
    const key = generateEncryptionKey();
    expect(key).toBeDefined();
    expect(key.length).toBe(64);
    expect(/^[0-9a-fA-F]{64}$/.test(key)).toBe(true);
  });

  it("retrieves or creates a secure database encryption key", async () => {
    expect(await SecurityService.hasDatabaseKey()).toBe(false);
    const key1 = await SecurityService.getOrCreateDatabaseKey();
    expect(key1).toBeDefined();
    expect(key1.length).toBe(64);

    expect(await SecurityService.hasDatabaseKey()).toBe(true);
    const key2 = await SecurityService.getOrCreateDatabaseKey();
    expect(key2).toBe(key1);
  });

  it("allows setting and clearing the database key", async () => {
    const customKey = "a".repeat(64);
    await SecurityService.setDatabaseKey(customKey);
    expect(await SecurityService.getDatabaseKey()).toBe(customKey);

    await SecurityService.clearDatabaseKey();
    expect(await SecurityService.getDatabaseKey()).toBeNull();
    expect(await SecurityService.hasDatabaseKey()).toBe(false);
  });
});
