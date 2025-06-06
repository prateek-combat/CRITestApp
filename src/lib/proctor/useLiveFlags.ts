import { useEffect, useRef } from 'react';
import detect from 'devtools-detect';

// Global flag to stop all proctoring events immediately
let isProctoringStopped = false;

interface ProctorEvent {
  type: string;
  timestamp: number;
  extra?: Record<string, any>;
}

// Simple function to stop proctoring globally
export function stopProctoringGlobally() {
  isProctoringStopped = true;
}

export function useLiveFlags(attemptId: string) {
  const eventBuffer = useRef<ProctorEvent[]>([]);
  const lastActivityTime = useRef<number>(Date.now());

  // Send event to server
  const sendEvent = (type: string, extra?: Record<string, any>) => {
    // Don't send events if proctoring is stopped
    if (isProctoringStopped) {
      return;
    }

    // Only run on client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }

    const event: ProctorEvent = {
      type,
      timestamp: Date.now(),
      extra,
    };

    eventBuffer.current.push(event);

    // Send immediately via beacon (non-blocking)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/proctor/event',
        JSON.stringify({
          attemptId,
          events: [event],
        })
      );
    } else {
      // Fallback for browsers without beacon support
      fetch('/api/proctor/event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attemptId,
          events: [event],
        }),
      }).catch((error) => {
        console.warn('Failed to send proctor event:', error);
      });
    }
  };

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    // Don't set up event listeners if proctoring is already stopped
    if (isProctoringStopped) {
      return;
    }

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        sendEvent('TAB_HIDDEN');
      } else if (document.visibilityState === 'visible') {
        sendEvent('TAB_VISIBLE');
      }
    };

    // Track window focus/blur
    const handleWindowBlur = () => {
      sendEvent('WINDOW_BLUR');
    };

    const handleWindowFocus = () => {
      sendEvent('WINDOW_FOCUS');
    };

    // Track copy/paste events
    const handleCopy = (event: ClipboardEvent) => {
      sendEvent('COPY_DETECTED', {
        selection: window.getSelection()?.toString().substring(0, 100),
      });
    };

    const handlePaste = (event: ClipboardEvent) => {
      sendEvent('PASTE_DETECTED');
    };

    // Track right-click context menu
    const handleContextMenu = (event: MouseEvent) => {
      sendEvent('CONTEXT_MENU_DETECTED');
      // Don't prevent default to avoid breaking legitimate usage
    };

    // Track keyboard shortcuts (common cheating attempts)
    const handleKeyDown = (event: KeyboardEvent) => {
      // Detect common shortcuts
      if (event.ctrlKey || event.metaKey) {
        const shortcuts = [
          'c',
          'v',
          'a',
          'f',
          'h',
          'r',
          'w',
          't',
          'n',
          's',
          'u',
          'i',
          'j',
          'p',
        ];

        if (shortcuts.includes(event.key.toLowerCase())) {
          sendEvent('KEYBOARD_SHORTCUT', {
            key: event.key.toLowerCase(),
            ctrlKey: event.ctrlKey,
            metaKey: event.metaKey,
            altKey: event.altKey,
            shiftKey: event.shiftKey,
          });
        }
      }

      // Detect F12 (DevTools)
      if (event.key === 'F12') {
        sendEvent('F12_PRESSED');
      }

      // Detect Ctrl+Shift+I (DevTools)
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key.toLowerCase() === 'i'
      ) {
        sendEvent('DEVTOOLS_SHORTCUT');
      }
    };

    // Track mouse leaving window
    const handleMouseLeave = () => {
      sendEvent('MOUSE_LEFT_WINDOW');
    };

    // Track inactivity
    const handleActivity = () => {
      lastActivityTime.current = Date.now();
    };

    // Check for DevTools
    const checkDevTools = () => {
      if (detect.isOpen) {
        sendEvent('DEVTOOLS_DETECTED', {
          orientation: detect.orientation,
        });
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('click', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('mousemove', handleActivity);

    // Start DevTools detection
    const devToolsInterval = setInterval(checkDevTools, 1000);

    // Start inactivity detection (check every 30 seconds)
    const inactivityInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivityTime.current;
      if (inactiveTime > 30000) {
        // 30 seconds
        sendEvent('INACTIVITY_DETECTED', {
          inactiveSeconds: Math.floor(inactiveTime / 1000),
        });
      }
    }, 30000);

    // Send initial event
    sendEvent('PROCTORING_STARTED');

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('mousemove', handleActivity);
      clearInterval(devToolsInterval);
      clearInterval(inactivityInterval);

      sendEvent('PROCTORING_ENDED');
    };
  }, [attemptId]);

  // Return current buffer for debugging
  return eventBuffer.current;
}
