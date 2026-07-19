/**
 * useCommandPalette — Global Cmd+K / Ctrl+K shortcut handler.
 * Fixes Issue #23.
 *
 * Usage:
 *   const { open, setOpen } = useCommandPalette();
 *   <CommandPalette open={open} onClose={() => setOpen(false)} />
 */
import { useState, useEffect } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return { open, setOpen };
}
