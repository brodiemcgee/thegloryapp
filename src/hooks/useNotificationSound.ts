// Hook for playing notification sounds using Web Audio API

'use client';

import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playChirp = useCallback(() => {
    try {
      // Create or reuse AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // Resume context if suspended (required for iOS)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Create a pleasant two-tone chirp
      const oscillator1 = ctx.createOscillator();
      const oscillator2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // First tone - higher pitch
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(880, now); // A5
      oscillator1.frequency.setValueAtTime(1047, now + 0.1); // C6

      // Second tone - harmony
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(659, now); // E5
      oscillator2.frequency.setValueAtTime(784, now + 0.1); // G5

      // Volume envelope - quick fade in/out
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, now + 0.3);

      // Connect nodes
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Play
      oscillator1.start(now);
      oscillator2.start(now);
      oscillator1.stop(now + 0.3);
      oscillator2.stop(now + 0.3);
    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }, []);

  return { playChirp };
}
