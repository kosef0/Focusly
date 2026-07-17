/* ---------- Sound Generation (Web Audio API) ---------- */
function createNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Resume context on user interaction (required by browsers)
    function ensureContext() {
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }
    document.addEventListener('click', ensureContext, { once: true });
    document.addEventListener('keydown', ensureContext, { once: true });

    /* --- Helper: play a single tone with envelope --- */
    function playTone(freq, startTime, duration, type, volume = 0.3) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    /* --- Helper: create noise burst (for click/tick texture) --- */
    function playNoiseBurst(startTime, duration, volume = 0.08) {
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 8);
      }

      const source = audioCtx.createBufferSource();
      source.buffer = buffer;

      const bandpass = audioCtx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 3500;
      bandpass.Q.value = 2;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      source.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(audioCtx.destination);
      source.start(startTime);
      source.stop(startTime + duration);
    }

    return {
      /* ========================================
         TICK SOUND — Classic clock tick-tock
         Plays during last 5 seconds countdown
         secondsLeft: 5, 4, 3, 2, 1
         ======================================== */
      playCountdownTick(secondsLeft) {
        ensureContext();
        const now = audioCtx.currentTime;

        // Urgency increases as time runs out
        // secondsLeft 5 → calm, 1 → intense
        const urgency = 1 - (secondsLeft - 1) / 4; // 0.0 to 1.0
        const baseVolume = 0.12 + urgency * 0.20;  // 0.12 → 0.32
        const basePitch = 800 + urgency * 600;      // 800Hz → 1400Hz

        // --- TICK (sharp mechanical click) ---
        // Woody click body
        playTone(basePitch, now, 0.04, 'square', baseVolume * 0.5);
        // High harmonic shimmer
        playTone(basePitch * 2, now, 0.025, 'sine', baseVolume * 0.3);
        // Mechanical click noise
        playNoiseBurst(now, 0.03, baseVolume * 0.4);

        // --- TOCK (lower resonance, slightly delayed) ---
        const tockDelay = 0.06;
        const tockPitch = basePitch * 0.65;
        playTone(tockPitch, now + tockDelay, 0.06, 'triangle', baseVolume * 0.6);
        playTone(tockPitch * 1.5, now + tockDelay, 0.03, 'sine', baseVolume * 0.2);
        playNoiseBurst(now + tockDelay, 0.025, baseVolume * 0.25);

        // At 2 and 1 seconds: add a subtle warning bell undertone
        if (secondsLeft <= 2) {
          playTone(1200, now + 0.02, 0.15, 'sine', 0.08);
          playTone(1800, now + 0.02, 0.10, 'sine', 0.04);
        }
      },

      /* ========================================
         COMPLETION SOUND — Triumphant chime
         Rich, layered, satisfying "done!" sound
         ======================================== */
      playComplete() {
        ensureContext();
        const now = audioCtx.currentTime;

        // --- Layer 1: Rising major arpeggio (bright & satisfying) ---
        const notes = [
          { freq: 523.25, time: 0,    dur: 0.18, type: 'sine',     vol: 0.25 }, // C5
          { freq: 659.25, time: 0.10, dur: 0.18, type: 'sine',     vol: 0.25 }, // E5
          { freq: 783.99, time: 0.20, dur: 0.20, type: 'sine',     vol: 0.28 }, // G5
          { freq: 1046.5, time: 0.30, dur: 0.45, type: 'sine',     vol: 0.30 }, // C6 (sustained)
        ];

        notes.forEach(n => {
          playTone(n.freq, now + n.time, n.dur, n.type, n.vol);
          // Octave shimmer for richness
          playTone(n.freq * 2, now + n.time, n.dur * 0.6, 'sine', n.vol * 0.12);
        });

        // --- Layer 2: Warm pad underneath ---
        playTone(261.63, now + 0.05, 0.6, 'triangle', 0.08); // C4 pad
        playTone(329.63, now + 0.15, 0.5, 'triangle', 0.06); // E4 pad

        // --- Layer 3: Sparkle/bell transient ---
        playTone(2093, now + 0.32, 0.12, 'sine', 0.06);    // C7 sparkle
        playTone(2637, now + 0.35, 0.08, 'sine', 0.04);    // E7 fairy dust

        // --- Layer 4: Soft "gong" resonance ---
        const gong = audioCtx.createOscillator();
        const gongGain = audioCtx.createGain();
        gong.type = 'sine';
        gong.frequency.setValueAtTime(523.25, now + 0.30);
        gong.frequency.exponentialRampToValueAtTime(480, now + 1.0);
        gongGain.gain.setValueAtTime(0, now + 0.30);
        gongGain.gain.linearRampToValueAtTime(0.06, now + 0.35);
        gongGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        gong.connect(gongGain);
        gongGain.connect(audioCtx.destination);
        gong.start(now + 0.30);
        gong.stop(now + 1.2);
      },

      /* ========================================
         TASK DONE — Satisfying "tring!" chime
         When marking a task as completed
         ======================================== */
      playTaskDone() {
        ensureContext();
        const now = audioCtx.currentTime;

        // Bright bell strike
        playTone(1318.5, now, 0.12, 'sine', 0.22);       // E6
        playTone(1568,   now + 0.06, 0.14, 'sine', 0.18); // G6
        playTone(2093,   now + 0.12, 0.20, 'sine', 0.15); // C7 (sparkle)

        // Warm undertone
        playTone(659.25, now, 0.18, 'triangle', 0.08);    // E5 body

        // Tiny metallic ring
        playNoiseBurst(now, 0.02, 0.05);
      },

      /* ========================================
         SIMPLE TICK — Minimal UI feedback tick
         For general interactions
         ======================================== */
      playTick() {
        ensureContext();
        const now = audioCtx.currentTime;
        playTone(900, now, 0.04, 'sine', 0.15);
        playNoiseBurst(now, 0.02, 0.06);
      },
    };
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return {
      playComplete() {},
      playTick() {},
      playCountdownTick() {},
      playTaskDone() {},
    };
  }
}
