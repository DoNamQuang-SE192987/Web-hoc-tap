/**
 * Utility phát âm thanh Đúng / Sai:
 * 1. Ưu tiên phát file MP3 bên ngoài trong thư mục `public/sounds/` (nếu bạn thêm file vào).
 * 2. Tự động chuyển sang âm thanh tổng hợp Web Audio nếu không tìm thấy file MP3.
 */

export const playSound = (type: 'correct' | 'wrong') => {
  if (typeof window === 'undefined') return;

  const mp3Path = type === 'correct' ? '/sounds/correct.mp3' : '/sounds/wrong.mp3';

  // 1. Thử phát file MP3 từ thư mục public/sounds/
  const audio = new Audio(mp3Path);
  audio.volume = 0.8;

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // 2. Nếu chưa có file MP3 -> Tự động phát âm thanh Web Audio mặc định
      playSynthesizedSound(type);
    });
  }
};

const playSynthesizedSound = (type: 'correct' | 'wrong') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    if (type === 'correct') {
      const now = ctx.currentTime;

      // Nốt 1 (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Nốt 2 (A5)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.1);
      gain2.gain.setValueAtTime(0.25, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } else {
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.linearRampToValueAtTime(160, now + 0.28);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch (err) {
    console.error('Lỗi khi phát âm thanh:', err);
  }
};
