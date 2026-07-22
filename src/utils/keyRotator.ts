export type Provider = 'gemini' | 'groq' | 'jules';

interface KeyConfig {
  key: string;
  cooldownUntil: number; // Timestamp (ms)
}

export class KeyRotator {
  private keys: Record<Provider, KeyConfig[]>;
  private currentIndex: Record<Provider, number>;

  // Cooldown duration: 1 minute (adjust as needed)
  private readonly COOLDOWN_DURATION = 60 * 1000;

  constructor() {
    this.keys = {
      gemini: this.loadKeysForProvider('GEMINI_API_KEY_ARIA'),
      groq: this.loadKeysForProvider('GROQ_API_KEY_ARIA'),
      jules: this.loadKeysForProvider('JULES_API_KEY_ARIA'),
    };

    this.currentIndex = {
      gemini: 0,
      groq: 0,
      jules: 0,
    };

    // TODO: The in-memory cooldown state will reset on serverless cold starts (e.g. Vercel).
    // In production, this state should live in a persistent store like Redis or Supabase
    // so the cooldown survives across instances.
  }

  private loadKeysForProvider(prefix: string): KeyConfig[] {
    const loadedKeys: KeyConfig[] = [];
    for (let i = 1; i <= 3; i++) {
      const envKey = `${prefix}_${i}`;
      const val = process.env[envKey];
      if (val) {
        loadedKeys.push({ key: val, cooldownUntil: 0 });
      }
    }
    return loadedKeys;
  }

  public getNextKey(provider: Provider): string {
    const providerKeys = this.keys[provider];
    if (providerKeys.length === 0) {
      throw new Error(`No server keys configured for provider ${provider}`);
    }

    const now = Date.now();
    let attempts = 0;
    const maxAttempts = providerKeys.length;

    while (attempts < maxAttempts) {
      const index = this.currentIndex[provider];
      const keyConfig = providerKeys[index];

      // Move to next index for round-robin
      this.currentIndex[provider] = (index + 1) % providerKeys.length;
      attempts++;

      // Return if not in cooldown
      if (keyConfig.cooldownUntil < now) {
        return keyConfig.key;
      }
    }

    // If we reach here, all keys are in cooldown
    throw new Error(`Rate limit exceeded: All keys for provider ${provider} are currently in cooldown.`);
  }

  public markKeyInCooldown(provider: Provider, keyStr: string): void {
    const providerKeys = this.keys[provider];
    const keyConfig = providerKeys.find(k => k.key === keyStr);
    if (keyConfig) {
      keyConfig.cooldownUntil = Date.now() + this.COOLDOWN_DURATION;
      console.warn(`[KeyRotator] Marked key for ${provider} in cooldown until ${new Date(keyConfig.cooldownUntil).toISOString()}`);
    }
  }
}

// Singleton instance
export const keyRotator = new KeyRotator();
