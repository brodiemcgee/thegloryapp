// Hook for playing notification sounds using Web Audio API

'use client';

import { useCallback, useRef } from 'react';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playHeartbeat = useCallback(() => {
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

      // Create a realistic heartbeat: lub-dub pattern
      const createBeat = (startTime: number, intensity: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // Low frequency for deep thump
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(60, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);

        // Low-pass filter for warmth
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(150, startTime);

        // Quick attack, medium decay - like a real heartbeat
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(intensity, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      };

      // Lub-dub pattern (two beats close together, then pause)
      // First heartbeat
      createBeat(now, 0.6);           // lub
      createBeat(now + 0.12, 0.4);    // dub

      // Second heartbeat (slightly softer echo)
      createBeat(now + 0.5, 0.5);     // lub
      createBeat(now + 0.62, 0.35);   // dub

    } catch (err) {
      console.error('Failed to play notification sound:', err);
    }
  }, []);

  return { playHeartbeat };
}
