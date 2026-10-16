/**
 * Audio Engine nâng cấp cho Pomodoro Cực Đoan (Sprint 3)
 * - Tích hợp Neural TTS Giọng Bắc (/api/tts)
 * - Phân tích biên độ âm thanh thời gian thực (AnalyserNode) để Mèo Tom 3D nhép miệng chuẩn 100%
 * - Cung cấp MediaStreamDestination để MediaRecorder ghi lại cả giọng mắng của Mèo vào clip TikTok
 */

export type SpeechTone = 'sarcastic' | 'angry' | 'praise' | 'normal';
export type SpeechGender = 'female' | 'male';

class PomodoroAudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private dataArray: Uint8Array | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlayingAudio: boolean = false;
  private voice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initVoice();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = () => {
          this.initVoice();
        };
      }
    }
  }

  private initVoice() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VN'));
    if (viVoice) {
      this.voice = viVoice;
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.6;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      try {
        this.streamDest = this.ctx.createMediaStreamDestination();
        this.analyser.connect(this.streamDest);
      } catch {
        // Ignore if MediaStreamDestination is not supported
      }
    }
    return this.ctx;
  }

  /**
   * Trả về Audio MediaStream để ghép với Video Stream của Canvas khi quay Clip TikTok
   */
  public getAudioStream(): MediaStream | null {
    this.ensureContext();
    return this.streamDest ? this.streamDest.stream : null;
  }

  /**
   * Mở khoá Web Audio ngay cú click đầu tiên
   */
  public async unlock(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const ctx = this.ensureContext();
      if (!ctx) return false;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
      return true;
    } catch (err) {
      console.warn('Lỗi mở khoá Web Audio:', err);
      return false;
    }
  }

  /**
   * Trả về độ mở miệng (0.0 -> 1.0) theo biên độ sóng âm thời gian thực để Mèo 3D nhép miệng
   */
  public getMouthOpenness(): number {
    if (!this.isPlayingAudio) return 0;

    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      const count = 38;
      for (let i = 2; i < 2 + count; i++) {
        sum += this.dataArray[i] || 0;
      }
      const avg = sum / count;
      return Math.min(1, Math.max(0, (avg - 12) / 105));
    }

    const t = Date.now() * 0.018;
    return Math.abs(Math.sin(t) * 0.6 + Math.cos(t * 2.3) * 0.4);
  }

  /**
   * Phát hiệu ứng âm thanh (còi cảnh cáo, tiếng mèo kêu quạo, tiếng gõ phím nhẹ, hoàn thành)
   */
  public playAlertSound(type: 'warning' | 'penalty' | 'start' | 'success' | 'poke' | 'tap') {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (this.streamDest) {
        gain.connect(this.streamDest);
      }

      if (type === 'tap') {
        // Tiếng gõ bàn Bongo Cat nhẹ nhàng
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === 'poke') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      } else if (type === 'start') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.setValueAtTime(260, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'penalty') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(640, now);
        osc.frequency.setValueAtTime(300, now + 0.18);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch (e) {
      console.warn('Không thể phát alert sound:', e);
    }
  }

  /**
   * Phát giọng nói Tiếng Việt miền Bắc (Neural TTS qua /api/tts kèm phân tích sóng âm Lip-sync)
   */
  public async speak(
    text: string,
    onEnd?: () => void,
    options?: { gender?: SpeechGender; tone?: SpeechTone }
  ) {
    if (typeof window === 'undefined') {
      onEnd?.();
      return;
    }

    this.stopSpeaking();
    const ctx = this.ensureContext();

    try {
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          gender: options?.gender || 'female',
          tone: options?.tone || 'sarcastic',
        }),
      });

      if (!res.ok || !ctx || !this.analyser) {
        throw new Error('Fallback to browser TTS');
      }

      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.analyser);
      this.analyser.connect(ctx.destination);

      this.currentSource = source;
      this.isPlayingAudio = true;

      source.onended = () => {
        this.isPlayingAudio = false;
        this.currentSource = null;
        onEnd?.();
      };

      source.start(0);
    } catch {
      this.speakFallback(text, onEnd);
    }
  }

  private speakFallback(text: string, onEnd?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      onEnd?.();
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.08;
      if (this.voice) utterance.voice = this.voice;

      this.isPlayingAudio = true;
      utterance.onend = () => {
        this.isPlayingAudio = false;
        onEnd?.();
      };
      utterance.onerror = () => {
        this.isPlayingAudio = false;
        onEnd?.();
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      this.isPlayingAudio = false;
      onEnd?.();
    }
  }

  public stopSpeaking() {
    this.isPlayingAudio = false;
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const pomodoroAudio = new PomodoroAudioEngine();
