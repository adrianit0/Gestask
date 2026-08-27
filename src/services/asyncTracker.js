const operations = new Map();
const listeners = new Set();
let sequence = 0;

export function startAsyncOperation(label) {
  const id = `async-${++sequence}`;
  operations.set(id, { id, label, startedAt: Date.now() });
  notifyListeners();
  return id;
}

export function finishAsyncOperation(id) {
  if (operations.delete(id)) notifyListeners();
}

export async function trackAsyncOperation(label, action) {
  const id = startAsyncOperation(label);
  try {
    return await action();
  } finally {
    finishAsyncOperation(id);
  }
}

export function getAsyncOperations() {
  return [...operations.values()].sort((first, second) => first.startedAt - second.startedAt);
}

export function subscribeAsyncOperations(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener(getAsyncOperations()));
}
