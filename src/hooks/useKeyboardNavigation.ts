import { useEffect, useCallback } from 'react';

export const useKeyboardNavigation = (
  containerRef: React.RefObject<HTMLElement>,
  onEscape?: () => void,
  onEnter?: () => void,
  trapFocus: boolean = false
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case 'Enter':
        if (onEnter && event.target === containerRef.current) {
          event.preventDefault();
          onEnter();
        }
        break;
      case 'Tab':
        if (trapFocus && containerRef.current) {
          const focusableElements = containerRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement?.focus();
            }
          }
        }
        break;
    }
  }, [containerRef, onEscape, onEnter, trapFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
      return () => container.removeEventListener('keydown', handleKeyDown);
    }
  }, [containerRef, handleKeyDown]);
};

export const useFocusManagement = (isOpen: boolean, initialFocusRef?: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      const previouslyFocused = document.activeElement as HTMLElement;
      
      // Focus the initial element or first focusable element
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const firstFocusable = document.querySelector(
            '[role="dialog"] button, [role="dialog"] [href], [role="dialog"] input, [role="dialog"] select, [role="dialog"] textarea, [role="dialog"] [tabindex]:not([tabindex="-1"])'
          ) as HTMLElement;
          firstFocusable?.focus();
        }
      }, 50);

      // Return focus when modal closes
      return () => {
        if (previouslyFocused) {
          previouslyFocused.focus();
        }
      };
    }
  }, [isOpen, initialFocusRef]);
};