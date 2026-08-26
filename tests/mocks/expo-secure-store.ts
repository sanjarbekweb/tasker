const storage = new Map<string, string>();

export const AFTER_FIRST_UNLOCK = "AFTER_FIRST_UNLOCK";
export const ALWAYS = "ALWAYS";
export const WHEN_UNLOCKED = "WHEN_UNLOCKED";

export async function setItemAsync(key: string, value: string, options?: unknown): Promise<void> {
  storage.set(key, value);
}

export async function getItemAsync(key: string, options?: unknown): Promise<string | null> {
  return storage.get(key) ?? null;
}

export async function deleteItemAsync(key: string, options?: unknown): Promise<void> {
  storage.delete(key);
}

export async function isAvailableAsync(): Promise<boolean> {
  return true;
}
