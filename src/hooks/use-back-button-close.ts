import { useEffect } from 'react';

/**
 * Closes a dialog/sheet when the user presses the device's back button (mobile).
 * Pushes a history entry when opened, and pops it on close.
 */
export function useBackButtonClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    // Push a state so the back button has something to pop
    window.history.pushState({ dialogOpen: true }, '');

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // If still on our pushed state when closing programmatically, remove it
      if (window.history.state?.dialogOpen) {
        window.history.back();
      }
    };
  }, [open, onClose]);
}
