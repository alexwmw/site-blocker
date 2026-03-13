import { vi } from 'vitest';

export type Listener<TArgs extends unknown[]> = (...args: TArgs) => void;

export function createEvent<TArgs extends unknown[]>() {
  const listeners = new Set<Listener<TArgs>>();
  return {
    addListener: vi.fn((listener: Listener<TArgs>) => listeners.add(listener)),
    removeListener: vi.fn((listener: Listener<TArgs>) => listeners.delete(listener)),
    emit: (...args: TArgs) => {
      for (const listener of listeners) {
        listener(...args);
      }
    },
  };
}
