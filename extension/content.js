(() => {
  if (document.getElementById("campusos-fat-cat-supervisor-root")) return;

  const catImgUrl = chrome.runtime.getURL("assets/fat-orange-cat.png");

  const SCOLD_QUOTES = [
    "Lại lướt web giải trí đấy à? Tắt ngay cái tab này đi quay lại học cho tôi!",
    "Nhìn cái gì mà nhìn! Còn chưa tới 1 phút nữa là tôi khóa sổ đấy nhé!",
    "Định làm biếng đến bao giờ? Tắt ngay Reddit, Facebook, YouTube đi!",
    "Tôi đang ngồi lườm bạn đấy! Đừng tưởng mở tab mới mà qua mặt được tôi!"
  ];

  // Create Shadow DOM so website styles don't break our overlay
  const host = document.createElement("div");
  host.id = "campusos-fat-cat-supervisor-root";
  host.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:2147483647;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;";
  document.documentElement.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    .timer-box {
      position: fixed;
      left: 5%;
      bottom: 16%;
      background: rgba(145, 145, 145, 0.88);
      border-radius: 18px;
      padding: 20px 38px;
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
      pointer-events: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid rgba(255, 255, 255, 0.22);
      transition: transform 0.2s ease, background 0.2s ease;
    }
    .timer-box.urgent {
      background: rgba(185, 28, 28, 0.9);
      animation: pulse-urgent 0.9s infinite alternate;
    }
    @keyframes pulse-urgent {
      from { transform: scale(1); }
      to { transform: scale(1.04); }
    }
    .timer-digits {
      font-size: 96px;
      font-weight: 800;
      color: #111111;
      line-height: 1;
      letter-spacing: -0.03em;
      font-variant-numeric: tabular-nums;
      user-select: none;
    }
    .timer-sub {
      margin-top: 8px;
      font-size: 12px;
      font-weight: 700;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn-action {
      cursor: pointer;
      background: #111827;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 700;
    }
    .btn-action:hover {
      background: #dc2626;
    }
    .cat-wrapper {
      position: fixed;
      right: -10px;
      bottom: -14px;
      width: min(44vw, 500px);
      pointer-events: auto;
      cursor: pointer;
      user-select: none;
      transform-origin: bottom right;
      animation: cat-breathe 3.2s ease-in-out infinite;
    }
    .cat-wrapper.talking {
      animation: cat-talk 0.22s ease-in-out infinite alternate;
    }
    @keyframes cat-breathe {
      0%, 100% { transform: scale(1) translateY(0px); }
      50% { transform: scale(1.012, 0.99) translateY(3px); }
    }
    @keyframes cat-talk {
      from { transform: scale(1.02) translateY(-4px) rotate(-0.8deg); }
      to { transform: scale(1.04) translateY(2px) rotate(0.8deg); }
    }
    .cat-img {
      width: 100%;
      height: auto;
      display: block;
      filter: drop-shadow(-10px 10px 28px rgba(0, 0, 0, 0.5));
    }
    .speech-bubble {
      position: absolute;
      top: -62px;
      right: 45px;
      max-width: 320px;
      background: rgba(255, 255, 255, 0.96);
      color: #111827;
      border: 2px solid #ef4444;
      border-radius: 16px;
      padding: 10px 14px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
      line-height: 1.4;
    }
  `;

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="timer-box" id="timer-box">
      <div class="timer-digits" id="timer-digits">0:52</div>
      <div class="timer-sub">
        <span>Mèo Giám Thị Đang Lườm</span>
        <button class="btn-action" id="btn-scold">🔊 Mắng ngay</button>
        <button class="btn-action" id="btn-hide">Ẩn 5p</button>
      </div>
    </div>
    <div class="cat-wrapper" id="cat-wrapper" title="Bấm vào Mèo Mập để nghe mắng!">
      <div class="speech-bubble" id="speech-bubble">
        Lại lướt web giải trí đấy à? Còn 52 giây nữa không tắt tab này là ăn đòn nhé! 😾
      </div>
      <img class="cat-img" src="${catImgUrl}" alt="Fat Orange Cat Supervisor" />
    </div>
  `;

  shadow.appendChild(style);
  shadow.appendChild(container);

  const timerDigits = shadow.getElementById("timer-digits");
  const timerBox = shadow.getElementById("timer-box");
  const catWrapper = shadow.getElementById("cat-wrapper");
  const speechBubble = shadow.getElementById("speech-bubble");
  const btnScold = shadow.getElementById("btn-scold");
  const btnHide = shadow.getElementById("btn-hide");

  let remainingSeconds = 52;

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  function speakScold(customText) {
    const quote =
      customText ||
      SCOLD_QUOTES[Math.floor(Math.random() * SCOLD_QUOTES.length)];
    speechBubble.textContent = quote;
    catWrapper.classList.add("talking");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(quote);
      utter.lang = "vi-VN";
      utter.rate = 1.15;
      utter.pitch = 1.1;
      utter.onend = () => catWrapper.classList.remove("talking");
      utter.onerror = () => catWrapper.classList.remove("talking");
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => catWrapper.classList.remove("talking"), 2500);
    }
  }

  const interval = setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    timerDigits.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 10) {
      timerBox.classList.add("urgent");
    }
    if (remainingSeconds === 0) {
      speakScold(
        "Hết 52 giây rồi! Tắt ngay cái trang này đi và quay lại học bài khẩn cấp!"
      );
      remainingSeconds = 52;
    }
  }, 1000);

  catWrapper.addEventListener("click", () => {
    speakScold();
  });

  btnScold.addEventListener("click", (e) => {
    e.stopPropagation();
    speakScold();
  });

  btnHide.addEventListener("click", (e) => {
    e.stopPropagation();
    clearInterval(interval);
    host.remove();
  });
})();
