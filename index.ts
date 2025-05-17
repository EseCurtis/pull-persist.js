import { Store } from 'pullstate';

export enum StorageType {
  LOCAL = "LOCAL",
  SESSION = "SESSION"
}

class PullPersistor<T extends object> {
  private store: Store<T>;
  private key: string;
  private storage: Storage;
  private encryptionKey: CryptoKey | null = null;

  constructor(
    store: Store<T>,
    key: string,
    storageType: StorageType = StorageType.LOCAL,
    storePrefix: string = 'pullstate',
    encryptionKey?: string
  ) {
    this.store = store;
    this.key = `${storePrefix}@${key}`;
    this.storage = storageType === StorageType.SESSION ? sessionStorage : localStorage;
    
    
    if (encryptionKey) {
      this.setupEncryption(encryptionKey).catch(err => console.error('Encryption setup failed:', err));
    }
  }

  private async setupEncryption(key: string): Promise<void> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(key),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('pullstate-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async encrypt(data: string): Promise<string> {
    if (!this.encryptionKey) return data;

    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      this.encryptionKey,
      encoder.encode(data)
    );

    const ivAndData = new Uint8Array(iv.length + encrypted.byteLength);
    ivAndData.set(iv);
    ivAndData.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...ivAndData));
  }

  private async decrypt(data: string): Promise<string | null> {
    if (!this.encryptionKey) return data;

    try {
      const dataArray = Uint8Array.from(atob(data), c => c.charCodeAt(0));
      const iv = dataArray.slice(0, 12);
      const encryptedData = dataArray.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedData
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error('Decryption failed:', err);
      return null;
    }
  }

  private async saveState(): Promise<void> {
    const state = JSON.stringify(this.store.getRawState());
    const data = await this.encrypt(state);
    this.storage.setItem(this.key, data);
  }

  private async loadState(): Promise<T | null> {
    const data = this.storage.getItem(this.key);
    if (!data) return null;

    const decrypted = await this.decrypt(data);
    if (!decrypted) return null;

    try {
      const state = JSON.parse(decrypted) as T;
      this.store.update(() => state);
      return state;
    } catch (err) {
      console.error('State parsing failed:', err);
      return null;
    }
  }

  private subscribe(): void {
    this.store.subscribe(() => this.store.getRawState(), () => {
      this.saveState().catch(err => console.error('Save state failed:', err));
    });
  }

  public async initialize(onRestore?: (state: T | null) => void): Promise<void> {
    const state = await this.loadState();
    this.subscribe();
    onRestore?.(state);
  }
}

export default PullPersistor;