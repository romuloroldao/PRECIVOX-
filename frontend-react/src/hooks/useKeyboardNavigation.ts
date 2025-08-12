// src/hooks/useKeyboardNavigation.ts - Hook para navegação por teclado
import { useState, useEffect, useCallback, useRef } from 'react';

// Interfaces
interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
  callback: () => void;
}

interface NavigationCallbacks {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onBackspace?: () => void;
  onDelete?: () => void;
  onTab?: () => void;
  onHome?: () => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
}

interface KeyboardNavigationState {
  selectedIndex: number;
  isActive: boolean;
  lastInteraction: 'keyboard' | 'mouse' | null;
  shortcuts: KeyboardShortcut[];
  focusVisible: boolean;
}

export const useKeyboardNavigation = (
  items: any[] = [],
  onSelect: (index: number) => void = () => {},
  isActive: boolean = true
) => {
  const [state, setState] = useState<KeyboardNavigationState>({
    selectedIndex: -1,
    isActive,
    lastInteraction: null,
    shortcuts: [],
    focusVisible: false,
  });

  const listenersRef = useRef<(() => void)[]>([]);
  const callbacksRef = useRef<NavigationCallbacks>({});

  const setupKeyboardListeners = useCallback((callbacks: NavigationCallbacks) => {
    callbacksRef.current = callbacks;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.isActive) return;

      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (
          activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          activeElement.tagName === 'SELECT' ||
          activeElement.getAttribute('contenteditable') === 'true'
        );

      setState(prev => ({ ...prev, lastInteraction: 'keyboard', focusVisible: true }));

      const globalShortcuts = ['Escape', 'F1', 'F2', 'F3', 'F4', 'F5'];

      if (!isInputFocused || globalShortcuts.includes(event.key)) {
        switch (event.key) {
          case 'Escape':
            event.preventDefault();
            callbacksRef.current.onEscape?.();
            break;
          case 'Enter':
            if (!isInputFocused) {
              event.preventDefault();
              if (state.selectedIndex >= 0 && state.selectedIndex < items.length) {
                onSelect(state.selectedIndex);
              }
              callbacksRef.current.onEnter?.();
            }
            break;
          case 'ArrowUp':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({
                ...prev,
                selectedIndex: prev.selectedIndex > 0
                  ? prev.selectedIndex - 1
                  : items.length - 1,
              }));
              callbacksRef.current.onArrowUp?.();
            }
            break;
          case 'ArrowDown':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({
                ...prev,
                selectedIndex: prev.selectedIndex < items.length - 1
                  ? prev.selectedIndex + 1
                  : 0,
              }));
              callbacksRef.current.onArrowDown?.();
            }
            break;
          case 'ArrowLeft':
            if (!isInputFocused) {
              event.preventDefault();
              callbacksRef.current.onArrowLeft?.();
            }
            break;
          case 'ArrowRight':
            if (!isInputFocused) {
              event.preventDefault();
              callbacksRef.current.onArrowRight?.();
            }
            break;
          case 'Home':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({ ...prev, selectedIndex: 0 }));
              callbacksRef.current.onHome?.();
            }
            break;
          case 'End':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({ ...prev, selectedIndex: items.length - 1 }));
              callbacksRef.current.onEnd?.();
            }
            break;
          case 'PageUp':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({
                ...prev,
                selectedIndex: Math.max(0, prev.selectedIndex - 10),
              }));
              callbacksRef.current.onPageUp?.();
            }
            break;
          case 'PageDown':
            if (!isInputFocused) {
              event.preventDefault();
              setState(prev => ({
                ...prev,
                selectedIndex: Math.min(items.length - 1, prev.selectedIndex + 10),
              }));
              callbacksRef.current.onPageDown?.();
            }
            break;
          case 'Backspace':
            if (!isInputFocused) {
              event.preventDefault();
              callbacksRef.current.onBackspace?.();
            }
            break;
          case 'Delete':
            if (!isInputFocused) {
              event.preventDefault();
              callbacksRef.current.onDelete?.();
            }
            break;
          case 'Tab':
            if (!isInputFocused) {
              event.preventDefault();
              callbacksRef.current.onTab?.();
            }
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    listenersRef.current.push(() => window.removeEventListener('keydown', handleKeyDown));
  }, [items.length, onSelect, state.isActive, state.selectedIndex]);

  // Cleanup listeners ao desmontar
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(unsubscribe => unsubscribe());
    };
  }, []);

  return {
    selectedIndex: state.selectedIndex,
    isActive: state.isActive,
    focusVisible: state.focusVisible,
    lastInteraction: state.lastInteraction,
    setSelectedIndex: (index: number) =>
      setState(prev => ({ ...prev, selectedIndex: index })),
    setupKeyboardListeners,
    setActive: (active: boolean) =>
      setState(prev => ({ ...prev, isActive: active })),
    setFocusVisible: (visible: boolean) =>
      setState(prev => ({ ...prev, focusVisible: visible })),
    reset: () =>
      setState(prev => ({ ...prev, selectedIndex: -1, lastInteraction: null, focusVisible: false }))
  };
};
