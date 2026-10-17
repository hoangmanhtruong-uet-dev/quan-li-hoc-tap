/**
 * AI Giám Sát Học Tập Cực Đoan (CampusOS)
 * Content Script - Manifest V3
 *
 * Responsibilities:
 * - Shadow DOM Injection with mode "open" into document.documentElement (duplicate-safe)
 * - Complete CSS isolation from host web pages
 * - Cyber-Glass visual styling: full-screen blur 25px overlay, 1px neon border, frosted modal card, tilted sticker badge
 * - Screen shake CSS animation (@keyframes screen-shake 0.65s)
 * - Supervisor character (Fat Orange Cat) and Vietnamese TTS scolding phrases
 * - High-contrast visual speech bubble ensuring readability if autoplay is blocked
 * - Live 5-second countdown progress bar with auto tab closure & CampusOS focus
 * - Exemption button ("Tôi đang tra tài liệu") with 180s cooldown enforcement
 * - Background message listener (SHOW_LOCKOUT_HUD < 200ms latency)
 * - Web Relay bridge for localhost:3000 and campusos.vn web applications
 */

(() => {
  if (typeof window === 'undefined') return;

  const HOST_ELEMENT_ID = 'campusos-lockout-hud-root';
  const TOTAL_COUNTDOWN_MS = 5000;

  const SCOLD_QUOTES = [
    'Lại lướt web giải trí đấy à? Đang trong giờ Pomodoro mà dám mở web này! Tắt ngay!',
    'Này thì lướt mạng này! Tôi bấm số gọi cho phụ huynh ngay bây giờ!',
    'Gan to bằng trời rồi! Đang chạy deadline mà dám trốn việc! Trừ ngay 50 XP!',
    'Định làm biếng đến bao giờ? Tắt tab này quay lại CampusOS học bài ngay lập tức!',
    'Tôi đang ngồi lườm bạn đấy nhé! Đóng tab trong năm giây không là ăn đòn!'
  ];

  let countdownInterval = null;
  let currentRemainingMs = TOTAL_COUNTDOWN_MS;
  let currentUtterance = null;
  let currentAudio = null;
  let activeQuote = '';

  /**
   * Helper: Check whether current origin belongs to CampusOS Web App
   */
  function isCampusOsHost(hostname) {
    if (!hostname || typeof hostname !== 'string') return false;
    const h = hostname.toLowerCase();
    return (
      h === 'localhost' ||
      h === '127.0.0.1' ||
      h === 'campusos.vn' ||
      h.endsWith('.campusos.vn')
    );
  }

  /**
   * Helper: Get asset URL with fallback
   */
  function getCatImageUrl() {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
        return chrome.runtime.getURL('assets/fat-orange-cat.png');
      }
    } catch {
      // Fallback
    }
    return '';
  }

  /**
   * Helper: Select scolding quote, customized with domain if available
   */
  function getScoldQuote(domain) {
    if (domain && typeof domain === 'string' && domain !== 'Trang web giải trí') {
      const domainQuotes = [
        `Lại lướt ${domain} đấy à? Đang trong giờ Pomodoro mà dám mở trang này! Trừ ngay 50 XP!`,
        `Đang chạy deadline mà dám mò vào ${domain}! Tắt ngay cái tab này đi cho tôi!`,
        `Này thì ${domain} này! Tôi bấm số gọi cho phụ huynh ngay bây giờ!`,
        `Tôi đang ngồi lườm bạn đấy nhé! Đóng tab ${domain} trong năm giây không là ăn đòn!`
      ];
      return domainQuotes[Math.floor(Math.random() * domainQuotes.length)];
    }
    return SCOLD_QUOTES[Math.floor(Math.random() * SCOLD_QUOTES.length)];
  }

  /**
   * Helper: Safe chrome.runtime.sendMessage with Promise and callback handling
   */
  function safeSendMessage(payload, callback) {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return;
    try {
      if (typeof callback === 'function') {
        chrome.runtime.sendMessage(payload, callback);
      } else {
        const res = chrome.runtime.sendMessage(payload);
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      }
    } catch {
      // Ignore background communication errors
    }
  }

  /**
   * Voice audio playback: Attempts /api/tts endpoint or Web Speech API fallback
   */
  function stopSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    if (currentAudio) {
      try {
        currentAudio.pause();
        currentAudio = null;
      } catch {}
    }
    currentUtterance = null;
  }

  function speakScold(quote, catImg) {
    stopSpeech();
    activeQuote = quote;

    if (catImg?.classList) catImg.classList.add('talking');

    let audioPlayed = false;

    const playBrowserFallback = () => {
      if (audioPlayed) return;
      audioPlayed = true;

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(quote);
          utter.lang = 'vi-VN';
          utter.rate = 1.12;
          utter.pitch = 1.05;

          const voices = window.speechSynthesis.getVoices();
          const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VN'));
          if (viVoice) utter.voice = viVoice;

          utter.onend = () => {
            if (catImg?.classList) catImg.classList.remove('talking');
          };
          utter.onerror = () => {
            if (catImg?.classList) catImg.classList.remove('talking');
          };

          currentUtterance = utter;
          window.speechSynthesis.speak(utter);
        } catch {
          if (catImg?.classList) catImg.classList.remove('talking');
        }
      } else {
        setTimeout(() => {
          if (catImg?.classList) catImg.classList.remove('talking');
        }, 2500);
      }
    };

    // Attempt /api/tts endpoint
    try {
      const isCampusOrigin = isCampusOsHost(window.location.hostname);
      const ttsEndpoint = isCampusOrigin ? '/api/tts' : 'http://localhost:3000/api/tts';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);

      fetch(ttsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: quote,
          gender: 'female',
          tone: 'sarcastic'
        }),
        signal: controller.signal
      })
        .then((res) => {
          clearTimeout(timeoutId);
          if (!res.ok) throw new Error('TTS API not OK');
          return res.blob();
        })
        .then((blob) => {
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          currentAudio = audio;
          audio.onended = () => {
            if (catImg?.classList) catImg.classList.remove('talking');
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
          };
          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            currentAudio = null;
            playBrowserFallback();
          };
          audioPlayed = true;
          audio.play().catch(() => {
            // Browser autoplay policy prevented playback
            playBrowserFallback();
          });
        })
        .catch(() => {
          clearTimeout(timeoutId);
          playBrowserFallback();
        });
    } catch {
      playBrowserFallback();
    }
  }

  /**
   * Countdown timer management
   */
  function startCountdown(onTick, onComplete) {
    stopCountdown();
    currentRemainingMs = TOTAL_COUNTDOWN_MS;
    const startTime = Date.now();

    onTick(currentRemainingMs, 100);

    countdownInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      currentRemainingMs = Math.max(0, TOTAL_COUNTDOWN_MS - elapsed);
      const progressPercent = Math.max(0, (currentRemainingMs / TOTAL_COUNTDOWN_MS) * 100);

      onTick(currentRemainingMs, progressPercent);

      if (currentRemainingMs <= 0) {
        stopCountdown();
        onComplete();
      }
    }, 50);
  }

  function stopCountdown() {
    if (countdownInterval) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  /**
   * Close Tab dispatch
   */
  function triggerCloseTab() {
    stopCountdown();
    stopSpeech();
    safeSendMessage({ action: 'CLOSE_TAB_AND_FOCUS_CAMPUS' });
  }

  /**
   * Remove Lockout HUD from DOM cleanly
   */
  function removeLockoutHud() {
    stopCountdown();
    stopSpeech();
    const existing = document.getElementById(HOST_ELEMENT_ID);
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Main: Build and show the Cyber-Glass Lockout HUD
   */
  function showLockoutHud(options = {}) {
    const domain = options.domain || 'Trang web giải trí';

    // Duplicate injection guard
    let host = document.getElementById(HOST_ELEMENT_ID);
    if (host && host.shadowRoot) {
      // If already displayed, update scolding and domain
      const speechBubble = host.shadowRoot.getElementById('campusos-speech-bubble');
      const domainEl = host.shadowRoot.getElementById('campusos-violation-domain');
      const catImg = host.shadowRoot.getElementById('campusos-cat-img');
      const quote = getScoldQuote(domain);
      if (speechBubble) speechBubble.textContent = quote;
      if (domainEl) domainEl.textContent = domain;
      speakScold(quote, catImg);
      return;
    }

    // Create host element with high z-index and initial styles
    host = document.createElement('div');
    host.id = HOST_ELEMENT_ID;
    host.style.cssText =
      'all:initial !important; position:fixed !important; inset:0 !important; width:100vw !important; height:100vh !important; z-index:2147483647 !important; pointer-events:auto !important; display:block !important;';

    const rootTarget = document.documentElement || document.body;
    if (!rootTarget) {
      window.addEventListener('DOMContentLoaded', () => showLockoutHud(options));
      return;
    }
    rootTarget.appendChild(host);

    // Attach open Shadow DOM for complete CSS isolation
    const shadow = host.attachShadow({ mode: 'open' });

    // Stylesheet definition
    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        pointer-events: auto !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Be Vietnam Pro', Helvetica, Arial, sans-serif !important;
        color: #ffffff !important;
        display: block !important;
      }
      * {
        box-sizing: border-box !important;
        margin: 0;
        padding: 0;
      }
      .overlay {
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: rgba(10, 10, 18, 0.88) !important;
        backdrop-filter: blur(25px) !important;
        -webkit-backdrop-filter: blur(25px) !important;
        z-index: 2147483647 !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        padding: 20px !important;
        overflow-y: auto !important;
        pointer-events: auto !important;
      }
      .ambient-glow {
        position: absolute;
        width: 520px;
        height: 520px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255, 61, 110, 0.28) 0%, rgba(124, 92, 255, 0.16) 50%, transparent 70%);
        filter: blur(65px);
        pointer-events: none;
        z-index: 0;
      }
      .hud-card {
        position: relative;
        z-index: 1;
        width: min(94vw, 620px);
        background: linear-gradient(135deg, rgba(25, 20, 35, 0.95), rgba(10, 10, 18, 0.98));
        border: 1px solid rgba(255, 61, 110, 0.4);
        border-radius: 28px;
        box-shadow: 0 0 60px rgba(255, 61, 110, 0.25), 0 30px 80px rgba(0, 0, 0, 0.9);
        padding: 32px 30px 26px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        animation: screen-shake 0.65s cubic-bezier(.36, .07, .19, .97) both;
      }
      @keyframes screen-shake {
        0%, 100% { transform: translate(0, 0) rotate(0deg); }
        10%, 30%, 50%, 70%, 90% { transform: translate(-8px, 4px) rotate(-1.5deg); }
        20%, 40%, 60%, 80% { transform: translate(8px, -4px) rotate(1.5deg); }
      }
      @media (prefers-reduced-motion: reduce) {
        .hud-card {
          animation: none !important;
        }
        .cat-img {
          animation: none !important;
        }
      }
      .sticker-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #ff3d6e, #ff8a3d);
        color: #0a0a12;
        font-weight: 900;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 6px 18px;
        border-radius: 9999px;
        border: 2px solid #ffffff;
        transform: rotate(-2deg);
        box-shadow: 0 4px 16px rgba(255, 61, 110, 0.5);
        margin-bottom: 16px;
      }
      .violation-details {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 700;
        color: #ff8a3d;
        margin-bottom: 14px;
        flex-wrap: wrap;
      }
      .domain-name {
        color: #ffffff;
        background: rgba(255, 255, 255, 0.1);
        padding: 3px 10px;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-family: monospace;
      }
      .penalty-pill {
        background: rgba(255, 61, 110, 0.22);
        color: #ff3d6e;
        border: 1px solid rgba(255, 61, 110, 0.5);
        padding: 3px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.04em;
      }
      .speech-bubble {
        position: relative;
        background: rgba(255, 255, 255, 0.98);
        color: #0f172a;
        border: 2px solid #ff3d6e;
        border-radius: 18px;
        padding: 14px 20px;
        font-size: 15px;
        font-weight: 700;
        line-height: 1.45;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        max-width: 500px;
        margin: 0 auto 16px;
        word-break: break-word;
      }
      .speech-bubble::after {
        content: '';
        position: absolute;
        bottom: -10px;
        left: 50%;
        transform: translateX(-50%);
        border-width: 10px 10px 0;
        border-style: solid;
        border-color: #ff3d6e transparent transparent;
        display: block;
        width: 0;
      }
      .cat-container {
        position: relative;
        width: 170px;
        height: 170px;
        margin: 0 auto 16px;
        cursor: pointer;
        user-select: none;
      }
      .cat-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter: drop-shadow(0 14px 24px rgba(0, 0, 0, 0.7));
        animation: cat-breathe 3.2s ease-in-out infinite;
        transform-origin: bottom center;
      }
      .cat-img.talking {
        animation: cat-talk 0.2s ease-in-out infinite alternate;
      }
      @keyframes cat-breathe {
        0%, 100% { transform: scale(1) translateY(0); }
        50% { transform: scale(1.02, 0.98) translateY(3px); }
      }
      @keyframes cat-talk {
        0% { transform: scale(1.03) translateY(-4px) rotate(-1.5deg); }
        100% { transform: scale(1.05) translateY(2px) rotate(1.5deg); }
      }
      .countdown-container {
        width: 100%;
        margin: 8px 0 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }
      .countdown-label {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .countdown-digits {
        font-size: 44px;
        font-weight: 900;
        color: #ff3d6e;
        line-height: 1;
        letter-spacing: -0.02em;
        font-variant-numeric: tabular-nums;
        text-shadow: 0 0 24px rgba(255, 61, 110, 0.55);
      }
      .progress-track {
        width: 100%;
        height: 8px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 9999px;
        overflow: hidden;
        margin-top: 4px;
      }
      .progress-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ff3d6e, #ff8a3d);
        border-radius: 9999px;
        box-shadow: 0 0 10px rgba(255, 61, 110, 0.7);
        transition: width 0.05s linear;
      }
      .actions-container {
        display: flex;
        gap: 12px;
        width: 100%;
        justify-content: center;
        flex-wrap: wrap;
      }
      .btn-exemption {
        flex: 1;
        min-width: 220px;
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.22);
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      .btn-exemption:hover:not(:disabled) {
        background: rgba(61, 232, 255, 0.15);
        border-color: #3de8ff;
        color: #3de8ff;
        box-shadow: 0 0 20px rgba(61, 232, 255, 0.3);
        transform: translateY(-1px);
      }
      .btn-exemption:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        border-color: rgba(255, 61, 110, 0.4);
        color: #fca5a5;
      }
      .btn-close-now {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        border: 1px solid #f87171;
        color: #ffffff;
        padding: 12px 22px;
        border-radius: 14px;
        font-size: 14px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .btn-close-now:hover {
        background: #b91c1c;
        box-shadow: 0 0 20px rgba(239, 68, 68, 0.5);
        transform: translateY(-1px);
      }
      .exemption-warning {
        margin-top: 10px;
        font-size: 12px;
        color: #fca5a5;
        font-weight: 600;
        display: none;
      }
      .audio-hint {
        font-size: 11px;
        color: #64748b;
        margin-top: 8px;
        cursor: pointer;
      }
      .audio-hint:hover {
        color: #94a3b8;
        text-decoration: underline;
      }
    `;

    // Markup definition
    const catImgUrl = getCatImageUrl();
    const initialQuote = getScoldQuote(domain);

    const container = document.createElement('div');
    container.className = 'overlay';
    container.innerHTML = `
      <div class="ambient-glow"></div>
      <div class="hud-card" id="campusos-hud-card">
        <div class="sticker-badge">⚠️ PHÁT HIỆN VI PHẠM KỶ LUẬT</div>
        
        <div class="violation-details">
          <span>Đang truy cập:</span>
          <span class="domain-name" id="campusos-violation-domain">${domain}</span>
          <span class="penalty-pill">-50 XP</span>
        </div>

        <div class="speech-bubble" id="campusos-speech-bubble">
          ${initialQuote}
        </div>

        <div class="cat-container" id="campusos-cat-container" title="Bấm vào Mèo Mập để nghe giọng mắng!">
          ${
            catImgUrl
              ? `<img class="cat-img" id="campusos-cat-img" src="${catImgUrl}" alt="Fat Orange Cat Supervisor" />`
              : `<div class="cat-img talking" id="campusos-cat-img" style="font-size:80px;display:flex;align-items:center;justify-content:center;">😾</div>`
          }
        </div>

        <div class="countdown-container">
          <div class="countdown-label">Tự động đóng tab sau</div>
          <div class="countdown-digits" id="campusos-countdown-digits">5s</div>
          <div class="progress-track">
            <div class="progress-fill" id="campusos-progress-fill"></div>
          </div>
        </div>

        <div class="actions-container">
          <button class="btn-exemption" id="campusos-btn-exemption" title="Ân hạn 3 phút (tối đa 1 lần mỗi phiên Pomodoro)">
            <span>📖</span>
            <span>Tôi đang tra tài liệu</span>
          </button>
          <button class="btn-close-now" id="campusos-btn-close-now">
            Tắt tab ngay
          </button>
        </div>

        <div class="exemption-warning" id="campusos-exemption-warning"></div>
        <div class="audio-hint" id="campusos-audio-hint">🔊 Bấm vào Mèo Cam để nghe mắng nếu trình duyệt tắt tiếng</div>
      </div>
    `;

    shadow.appendChild(style);
    shadow.appendChild(container);

    // References
    const speechBubble = shadow.getElementById('campusos-speech-bubble');
    const catContainer = shadow.getElementById('campusos-cat-container');
    const catImg = shadow.getElementById('campusos-cat-img');
    const countdownDigits = shadow.getElementById('campusos-countdown-digits');
    const progressFill = shadow.getElementById('campusos-progress-fill');
    const btnExemption = shadow.getElementById('campusos-btn-exemption');
    const btnCloseNow = shadow.getElementById('campusos-btn-close-now');
    const exemptionWarning = shadow.getElementById('campusos-exemption-warning');
    const audioHint = shadow.getElementById('campusos-audio-hint');

    // Start Vietnamese TTS scolding immediately (< 200ms)
    speakScold(initialQuote, catImg);

    // Start 5-second countdown & progress bar
    startCountdown(
      (remainingMs, percent) => {
        const sec = Math.ceil(remainingMs / 1000);
        if (countdownDigits) countdownDigits.textContent = `${sec}s`;
        if (progressFill) progressFill.style.width = `${percent}%`;
      },
      () => {
        if (countdownDigits) countdownDigits.textContent = '0s';
        if (progressFill) progressFill.style.width = '0%';
        triggerCloseTab();
      }
    );

    // Exemption button handler ("Tôi đang tra tài liệu")
    if (btnExemption) {
      btnExemption.addEventListener('click', (e) => {
        e.stopPropagation();
        btnExemption.disabled = true;
        btnExemption.innerHTML = '<span>⏳</span><span>Đang kiểm tra...</span>';

        if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
          btnExemption.textContent = 'Lỗi kết nối extension';
          return;
        }

        safeSendMessage(
          { action: 'REQUEST_EXEMPTION', durationSeconds: 180 },
          (response) => {
            const err = chrome.runtime?.lastError;
            if (err) {
              btnExemption.disabled = false;
              btnExemption.innerHTML = '<span>📖</span><span>Tôi đang tra tài liệu</span>';
              return;
            }

            if (response && (response.status === 'EXEMPTION_GRANTED' || response.success === true)) {
              // Grace period granted: unlock and dismiss HUD
              removeLockoutHud();
            } else {
              // Denied: show remaining cooldown wait seconds and scold
              const waitSec = response?.waitSeconds || 180;
              btnExemption.disabled = true;
              btnExemption.innerHTML = `<span>🚫</span><span>Đang hồi phục (${waitSec}s)</span>`;

              const errorMsg =
                response?.error ||
                `Hết lượt ân hạn rồi! Đừng có viện cớ tra tài liệu! Vui lòng đợi ${waitSec} giây.`;

              if (exemptionWarning) {
                exemptionWarning.style.display = 'block';
                exemptionWarning.textContent = errorMsg;
              }

              const scoldText = 'Hết lượt ân hạn rồi! Đừng có viện cớ tra tài liệu!';
              if (speechBubble) {
                speechBubble.textContent = scoldText;
              }
              speakScold(scoldText, catImg);
            }
          }
        );
      });
    }

    // Manual immediate close tab button
    if (btnCloseNow) {
      btnCloseNow.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerCloseTab();
      });
    }

    // Mascot click handler to re-speak or unlock audio
    if (catContainer) {
      catContainer.addEventListener('click', () => {
        speakScold(activeQuote || initialQuote, catImg);
      });
    }

    if (audioHint) {
      audioHint.addEventListener('click', () => {
        speakScold(activeQuote || initialQuote, catImg);
      });
    }
  }

  /**
   * Setup Web Relay for CampusOS Web App (localhost:3000 / campusos.vn)
   */
  function setupCampusOsWebRelay() {
    // 1. Listen for window.postMessage from Web App
    window.addEventListener('message', (event) => {
      if (event.source !== window || !event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'CAMPUSOS_EXTENSION_REQUEST') {
        const { id, payload } = event.data;
        if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
          chrome.runtime.sendMessage(payload, (response) => {
            const err = chrome.runtime?.lastError;
            window.postMessage(
              {
                type: 'CAMPUSOS_EXTENSION_RESPONSE',
                id,
                response: err ? { status: 'ERROR', error: err.message } : response
              },
              '*'
            );
          });
        }
      }
    });

    // 2. Listen for custom DOM events from Web App
    const forwardCustomEvent = (eventName, defaultAction) => {
      window.addEventListener(eventName, (e) => {
        const detail = e.detail || {};
        const payload = { action: defaultAction, ...detail };
        safeSendMessage(payload);
      });
    };

    forwardCustomEvent('campusos:pomodoro-start', 'START_FOCUS');
    forwardCustomEvent('campusos:pomodoro-pause', 'PAUSE_FOCUS');
    forwardCustomEvent('campusos:pomodoro-stop', 'STOP_FOCUS');
    forwardCustomEvent('campusos:request-exemption', 'REQUEST_EXEMPTION');

    // 3. Relay background messages (e.g. EXTENSION_VIOLATION) to Web App
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'EXTENSION_VIOLATION') {
          window.postMessage({ type: 'CAMPUSOS_EXTENSION_EVENT', payload: message }, '*');
          window.dispatchEvent(new CustomEvent('campusos:extension-violation', { detail: message }));
          window.dispatchEvent(new CustomEvent('campusos:store-update', { detail: message }));
        }
        sendResponse?.({ received: true });
        return false;
      });
    }

    // 4. Announce bridge readiness to Web App
    try {
      window.postMessage({ type: 'CAMPUSOS_EXTENSION_BRIDGE_READY', version: '1.0.0' }, '*');
      window.__CAMPUSOS_EXTENSION_INSTALLED__ = true;
    } catch {}
  }

  /**
   * Content Script Lifecycle Entry
   */
  const isCampus = isCampusOsHost(window.location.hostname);

  if (isCampus) {
    // On CampusOS web app, setup bidirectional Web Relay
    setupCampusOsWebRelay();
  } else {
    // On external/distraction pages:
    // A. Listen for SHOW_LOCKOUT_HUD dispatched from background.js
    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.action === 'SHOW_LOCKOUT_HUD') {
          showLockoutHud({
            domain: message.domain || 'Trang web giải trí',
            url: message.url || window.location.href,
            remainingSeconds: message.remainingSeconds,
            violationCount: message.violationCount
          });
          sendResponse?.({ status: 'OK' });
          return true;
        }
      });
    }

    // B. Check URL on page load in case background has active focus session
    safeSendMessage(
      { action: 'CHECK_URL', url: window.location.href },
      (response) => {
        if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) return;
        if (response && response.isBlacklisted && response.isFocusing && !response.isExempt) {
          showLockoutHud({
            domain: response.domain,
            url: window.location.href,
            remainingSeconds: response.remainingSeconds
          });
        }
      }
    );
  }

  // Export helpers onto window for unit test inspection and verification
  window.__CAMPUSOS_LOCKOUT_HUD__ = {
    HOST_ELEMENT_ID,
    TOTAL_COUNTDOWN_MS,
    SCOLD_QUOTES,
    isCampusOsHost,
    getScoldQuote,
    showLockoutHud,
    removeLockoutHud,
    stopCountdown,
    stopSpeech
  };
})();
