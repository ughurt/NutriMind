import React, { useCallback, useRef } from 'react';

// Replacement for useLatestCallback which is causing the error
export function useLatestCallback<T extends (...args: any[]) => any>(callback: T): T {
  const callbackRef = useRef(callback);
  
  // Keep the callback reference updated
  callbackRef.current = callback;
  
  // Create a stable callback that calls the latest callback
  return useCallback(
    ((...args) => {
      return callbackRef.current?.(...args);
    }) as T,
    []
  );
} 