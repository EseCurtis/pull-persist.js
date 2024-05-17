# PullPersistor

`PullPersistor` is a utility class designed to persist the state of a `pullstate` store to either `localStorage` or `sessionStorage`. It helps in maintaining state across page reloads or browser sessions.

## Installation

You can install `PullPersistor` from npm:

```bash
npm install pull-persist
```

## Usage

### Importing the Class

First, import the `PullPersistor` class into your project:

```javascript
import PullPersistor from 'pull-persist';
```

### Initializing the Persistor

Create an instance of `PullPersistor` by passing your `pullstate` store, a unique key for storage, and optionally, the type of storage (`'LOCAL'` or `'SESSION'`). The default storage type is `'LOCAL'`.

```javascript
import { Store } from 'pullstate';
import PullPersistor from 'pull-persist';

// Define your store type
type CounterState = {
  count: number;
};

// Create a pullstate store
const counterStore = new Store<CounterState>({
  count: 0,
});

// Initialize PullPersistor with the store, a key, and storage type
const persistor = new PullPersistor<CounterState>(counterStore, 'counterState', 'LOCAL');

// Initialize the persistor to load state from storage and subscribe to changes
persistor.initialize();
```

### Handling Restored State

You can provide an optional callback to `initialize` that will be called with the restored state (if any) when the persistor is initialized:

```javascript
persistor.initialize((restoredState) => {
  if (restoredState) {
    console.log('State restored:', restoredState);
  } else {
    console.log('No state found in storage');
  }
});
```

## API

### `PullPersistor<T>`

#### Constructor

```typescript
constructor(
  store: Store<T extends object ? T : object>,
  key: string,
  storageType: 'LOCAL' | 'SESSION' = 'LOCAL',
  storePrefix: string = 'pullstate'
)
```

- **store**: The `pullstate` store to persist.
- **key**: A unique key to identify the storage entry.
- **storageType**: The type of storage to use ('LOCAL' for `localStorage` or 'SESSION' for `sessionStorage`). Defaults to 'LOCAL'.
- **storePrefix**: A prefix for the storage key. Defaults to 'pullstate'.

#### Methods

##### `initialize(onRestore?: (state: T | null) => any): void`

Initializes the persistor, loading the state from storage if available and subscribing to store changes.

- **onRestore**: An optional callback that receives the restored state (or `null` if no state was found).

## Example

```typescript
import { Store } from 'pullstate';
import PullPersistor from 'pull-persist';

type CounterState = {
  count: number;
};

const counterStore = new Store<CounterState>({ count: 0 });

const persistor = new PullPersistor<CounterState>(counterStore, 'counterState', 'LOCAL');

persistor.initialize((restoredState) => {
  if (restoredState) {
    console.log('State restored:', restoredState);
  } else {
    console.log('No state found in storage');
  }
});
```

In this example, `PullPersistor` is used to persist the state of a simple counter across page reloads using `localStorage`|`sessionStorage`. The restored state is logged to the console when the persistor is initialized.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.