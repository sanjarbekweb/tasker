export const Platform = {
  OS: "ios" as const,
  select: <T>(obj: { ios?: T; android?: T; default?: T }): T | undefined =>
    obj.ios ?? obj.default,
};

export type AppStateStatus = "active" | "background" | "inactive" | "unknown" | "extension";

type AppStateListener = (state: AppStateStatus) => void;

class MockAppState {
  private listeners: Set<AppStateListener> = new Set();
  currentState: AppStateStatus = "active";

  addEventListener(type: string, listener: AppStateListener) {
    this.listeners.add(listener);
    return {
      remove: () => {
        this.listeners.delete(listener);
      },
    };
  }

  // Helper for tests to simulate app state change
  emit(state: AppStateStatus) {
    this.currentState = state;
    this.listeners.forEach((l) => l(state));
  }
}

export const AppState = new MockAppState();
