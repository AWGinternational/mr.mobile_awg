/**
 * Custom hook for enhanced form keyboard navigation
 * Provides Enter key to move to next field, and improved UX
 */

import { KeyboardEvent } from 'react';

export function useFormNavigation() {
  /**
   * Handle Enter key press to move to next form field
   * Usage: onKeyDown={handleEnterKey}
   */
  const handleEnterKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Find all focusable form elements
      const form = e.currentTarget.form;
      if (!form) return;
      
      const focusableElements = Array.from(
        form.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]'
        )
      );
      
      const currentIndex = focusableElements.indexOf(e.currentTarget as Element);
      
      if (currentIndex === -1) return;
      
      // Move to next element
      const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
      
      if (nextElement) {
        nextElement.focus();
        
        // If it's a select, open it
        if (nextElement.tagName === 'SELECT') {
          nextElement.click();
        }
        
        // If it's a submit button, don't focus (will be handled by form submit)
        if (nextElement.getAttribute('type') === 'submit') {
          nextElement.click();
        }
      }
    }
  };

  /**
   * Handle Enter+Shift to move to previous field
   */
  const handleShiftEnterKey = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      
      const form = e.currentTarget.form;
      if (!form) return;
      
      const focusableElements = Array.from(
        form.querySelectorAll(
          'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
        )
      );
      
      const currentIndex = focusableElements.indexOf(e.currentTarget as Element);
      
      if (currentIndex > 0) {
        const prevElement = focusableElements[currentIndex - 1] as HTMLElement;
        prevElement?.focus();
      }
    }
  };

  /**
   * Combined handler for both Enter and Shift+Enter
   */
  const handleNavigationKeys = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        handleShiftEnterKey(e);
      } else {
        handleEnterKey(e);
      }
    }
  };

  /**
   * Focus first input in a form
   */
  const focusFirstInput = (formRef: HTMLFormElement | null) => {
    if (!formRef) return;
    
    const firstInput = formRef.querySelector(
      'input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])'
    ) as HTMLElement;
    
    firstInput?.focus();
  };

  return {
    handleEnterKey,
    handleShiftEnterKey,
    handleNavigationKeys,
    focusFirstInput
  };
}
