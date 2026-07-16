/* ---------- Sound Generation (Web Audio API) ---------- */
function createNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(freq, startTime, duration, type) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    }

    return {
      playComplete() {
        const now = audioCtx.currentTime;
        playTone(523.25, now, 0.15, 'sine');         // C5
        playTone(659.25, now + 0.12, 0.15, 'sine');  // E5
        playTone(783.99, now + 0.24, 0.25, 'sine');  // G5
        playTone(1046.50, now + 0.36, 0.4, 'sine');  // C6
      },
      playTick() {
        const now = audioCtx.currentTime;
        playTone(800, now, 0.05, 'sine');
      },
    };
  } catch (e) {
    console.warn('Web Audio API not supported:', e);
    return { playComplete() {}, playTick() {} };
  }
}
