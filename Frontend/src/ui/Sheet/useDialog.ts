import { RefObject, useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialogs can stack, such as a confirmation over a form. Only the top one responds to keys.
const openDialogs: symbol[] = [];

/**
 * The behavior every dialog needs: Escape closes it, Tab stays inside it, the page behind doesn't
 * scroll, and focus returns to where it was on close.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, isOpen: boolean, onClose: () => void): void {
  // Callers often pass a new function each render. Reading it through a ref stops that from
  // re-running the effect below, which would pull focus out of whatever you're typing in.
  const latestOnClose = useRef(onClose);
  useEffect(() => {
    latestOnClose.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;
    const id = Symbol('dialog');
    openDialogs.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const root = ref.current;
    if (root && !root.contains(document.activeElement)) {
      const target = root.querySelector<HTMLElement>('[autofocus]') ?? root.querySelector<HTMLElement>(FOCUSABLE);
      target?.focus();
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (openDialogs[openDialogs.length - 1] !== id || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        latestOnClose.current();
        return;
      }
      if (event.key !== 'Tab' || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !ref.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !ref.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      openDialogs.splice(openDialogs.indexOf(id), 1);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, ref]);
}
