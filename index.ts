import { Store } from 'pullstate';

type StorageType = 'LOCAL' | 'SESSION';

class PullPersistor<T> {
  private store: Store<T extends object ? T: object>;
  private key: string;
  private storage: Storage

  constructor(store: Store<T extends object ? T: object>, key: string, storageType: StorageType = 'LOCAL', storePrefix: string = 'pullstate') {
    this.store = store;
    this.key = `${storePrefix}@${key}`;
    this.storage = storageType === 'SESSION' ? sessionStorage : localStorage;
  }

  private saveState(): void {
    this.storage.setItem(this.key, JSON.stringify(this.store.getRawState()));
  }

  private loadState(): T | null {
    const serializedState = this.storage.getItem(this.key);
    if (serializedState !== null) {
      const state = JSON.parse(serializedState);
      this.store.update(_ => state);
      return  state;
    }

    return null;
  }

  private subscribe(): void {
    this.store.subscribe(s=>s, () => {
      this.saveState();
    });
  }

  public initialize(onRestore?: (state: T | null)=> any): void {
    const restoredState = this.loadState();
    this.subscribe();
    if(onRestore) {
        onRestore(restoredState)
    }
  }
}

export default PullPersistor;

