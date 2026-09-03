import confetti from 'canvas-confetti';

// Play a cheerful star chime using Web Audio API (offline, instant, zero latency)
export function playChime(type: 'star' | 'unstar' | 'reward' = 'star') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'star') {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Arpeggio notes
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08); // A5
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.16); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.36);
    } else if (type === 'reward') {
      // Fanfare notes
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = ctx.currentTime + idx * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.31);
      });
    } else {
      // Unstar subtle tap
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.19);
    }
  } catch {
    // Ignore audio failures in case browser policy restricts audio before user gesture
  }
}

// Trigger Star Burst Confetti
export function triggerStarBurst(origin?: { x: number; y: number }) {
  playChime('star');

  const x = origin ? origin.x / window.innerWidth : 0.5;
  const y = origin ? origin.y / window.innerHeight : 0.5;

  // Gold, amber, purple star confetti burst
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { x, y },
    colors: ['#FBBF24', '#F59E0B', '#FDE68A', '#A855F7', '#EC4899'],
    shapes: ['star', 'circle'],
    scalar: 1.2,
    ticks: 120,
    zIndex: 9999,
  });
}

export function triggerBigCelebration() {
  playChime('reward');

  const duration = 2000;
  const end = Date.now() + duration;

  (function frame() {
    confetti({
      particleCount: 7,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ['#FBBF24', '#9333EA', '#10B981', '#F43F5E', '#3B82F6'],
      shapes: ['star', 'circle'],
      zIndex: 9999,
    });
    confetti({
      particleCount: 7,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ['#FBBF24', '#9333EA', '#10B981', '#F43F5E', '#3B82F6'],
      shapes: ['star', 'circle'],
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
