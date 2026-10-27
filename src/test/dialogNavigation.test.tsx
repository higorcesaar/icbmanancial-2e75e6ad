// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Dialog } from '@/components/ui/dialog';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState({}, '', '/');
});

describe('Dialog navigation stability', () => {
  it('does not add history entries or go back on unrelated rerenders', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const push = vi.spyOn(window.history, 'pushState');
    const { rerender, unmount } = render(<Dialog open onOpenChange={() => {}} />);
    expect(push).toHaveBeenCalledTimes(1);

    // Simulate unrelated state updates in each page, including fresh callbacks.
    rerender(<Dialog open onOpenChange={() => {}} />);
    rerender(<Dialog open onOpenChange={() => {}} />);
    expect(push).toHaveBeenCalledTimes(1);
    expect(back).not.toHaveBeenCalled();

    unmount();
    expect(back).toHaveBeenCalledTimes(1);
  });
});
