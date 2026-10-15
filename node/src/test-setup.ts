import '@testing-library/jest-dom';

// jsdom ships no ResizeObserver — stub it as a no-op so components that measure their own layout
// with one (e.g. FormTable's row) don't throw in tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver =
  window.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
