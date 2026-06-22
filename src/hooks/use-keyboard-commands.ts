/**
 * F-KEY COMMAND INTERCEPTOR
 * Zero-touch workflow for cashiers
 */

import { useEffect } from 'react';

export interface KeyboardCommand {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
}

export function useKeyboardCommands(commands: KeyboardCommand[], enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      for (const command of commands) {
        const keyMatch = e.key === command.key || e.code === command.key;
        const ctrlMatch = command.ctrl ? e.ctrlKey : true;
        const shiftMatch = command.shift ? e.shiftKey : true;
        const altMatch = command.alt ? e.altKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          // Check if modifiers that shouldn't be pressed aren't
          const noExtraCtrl = command.ctrl || !e.ctrlKey;
          const noExtraShift = command.shift || !e.shiftKey;
          const noExtraAlt = command.alt || !e.altKey;

          if (noExtraCtrl && noExtraShift && noExtraAlt) {
            e.preventDefault();
            e.stopPropagation();
            command.handler(e);
            break;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commands, enabled]);
}

// Barcode Scanner Input Trap
export function useBarcodeScanner(
  onScan: (barcode: string) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    let buffer = '';
    let timeout: NodeJS.Timeout;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field (except our scan input)
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        if (!target.classList.contains('barcode-input')) {
          return;
        }
      }

      clearTimeout(timeout);

      if (e.key === 'Enter') {
        if (buffer.length > 0) {
          onScan(buffer);
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
        
        // Auto-clear buffer after 100ms of no input
        timeout = setTimeout(() => {
          buffer = '';
        }, 100);
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      clearTimeout(timeout);
    };
  }, [onScan, enabled]);
}
