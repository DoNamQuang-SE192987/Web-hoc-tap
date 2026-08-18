/**
 * Utility phát âm thanh Đúng / Sai:
 * 1. Ưu tiên phát file MP3 trong thư mục `public/sounds/` (correct.mp3 / wrong.mp3).
 * 2. Hỗ trợ sự kiện onEnded để gọi hành động tiếp theo (đọc từ vựng) CHÍNH XÁC KHI file MP3 vừa phát xong.
 * 3. Tự động dừng âm thanh cũ và giọng đọc cũ nếu người dùng thao tác liên tục.
 */

let currentAudio: HTMLAudioElement | null = null;

export const playSound = (type: 'correct' | 'wrong', onEnded?: () => void) => {
  if (typeof window === 'undefined') {
    if (onEnded) onEnded();
    return;
  }

  // Dừng âm thanh hiệu ứng cũ nếu đang chạy
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }

  // Dừng giọng đọc Text-to-Speech cũ nếu đang nói dở
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  const mp3Path = type === 'correct' ? '/sounds/correct.mp3' : '/sounds/wrong.mp3';
  const audio = new Audio(mp3Path);
  audio.volume = 0.85;
  currentAudio = audio;

  let hasTriggeredEnd = false;
  const triggerEnd = () => {
    if (hasTriggeredEnd) return;
    hasTriggeredEnd = true;
    currentAudio = null;
    if (onEnded) {
      // Khoảng đệm 100ms sau khi nhạc tắt để đọc từ vựng tự nhiên nhất
      setTimeout(onEnded, 100);
    }
  };

  audio.addEventListener('ended', triggerEnd, { once: true });
  audio.addEventListener('error', () => {
    // Nếu không tải được file MP3 -> fallback sang Web Audio
    playSynthesizedSound(type, triggerEnd);
  }, { once: true });

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Trình duyệt chặn hoặc lỗi -> fallback sang Web Audio
      playSynthesizedSound(type, triggerEnd);
    });
  }
};

const playSynthesizedSound = (type: 'correct' | 'wrong', onEnded?: () => void) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      if (onEnded) onEnded();
      return;
    }

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

      if (onEnded) {
        setTimeout(onEnded, 500);
      }
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

      if (onEnded) {
        setTimeout(onEnded, 380);
      }
    }
  } catch (err) {
    console.error('Lỗi khi phát âm thanh:', err);
    if (onEnded) onEnded();
  }
};
