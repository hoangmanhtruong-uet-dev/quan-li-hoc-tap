/**
 * AI Giám Sát Học Tập Cực Đoan (CampusOS)
 * Extension Popup Controller
 *
 * Responsibilities:
 * - Real-time Pomodoro status & MM:SS countdown synchronization with background FSM
 * - Controls: Start, Pause, Stop focus sessions
 * - Customizable Blacklist Manager: add, remove, reset 14 default domains
 * - AI Webcam Face Tracking toggle switch
 * - CampusOS Web App launch & focus coordination
 */

(() => {
  'use strict';

  // DOM Elements
  const timerDisplay = document.getElementById('timer-display');
  const timerProgressBar = document.getElementById('timer-progress-bar');
  const sessionStatusBadge = document.getElementById('session-status-badge');
  const statusText = document.getElementById('status-text');
  const violationCountElem = document.getElementById('violation-count');
  const toggleWebcam = document.getElementById('toggle-webcam');
  const blacklistCount = document.getElementById('blacklist-count');
  const blacklistContainer = document.getElementById('blacklist-list');
  const addDomainForm = document.getElementById('add-domain-form');
  const inputNewDomain = document.getElementById('input-new-domain');
  const btnStartFocus = document.getElementById('btn-start-focus');
  const btnPauseFocus = document.getElementById('btn-pause-focus');
  const btnStopFocus = document.getElementById('btn-stop-focus');
  const btnResetBlacklist = document.getElementById('btn-reset-blacklist');
  const btnOpenCampus = document.getElementById('btn-open-campus');

  // Local State
  let currentSession = {
    state: 'idle',
    startedAt: null,
    durationSeconds: 1500,
    remainingSeconds: 1500,
    violationCount: 0,
    webcamEnabled: true
  };
  let currentBlacklist = [];
  let timerInterval = null;

  /**
   * Safe sendMessage wrapper with mock fallback
   */
  function sendBackgroundMessage(message) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime?.lastError) {
            resolve(null);
          } else {
            resolve(response);
          }
        });
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Sanitizes domain input: removes protocol, www, port, paths, query params
   */
  function cleanDomainInput(raw) {
    if (!raw || typeof raw !== 'string') return '';
    let cleaned = raw.trim().toLowerCase();
    cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');
    cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
    cleaned = cleaned.split(':')[0];
    cleaned = cleaned.replace(/^\*\./, '');
    cleaned = cleaned.replace(/^\.+/, '');
    cleaned = cleaned.replace(/\.+$/, '');
    return cleaned;
  }

  /**
   * Formats seconds into MM:SS string
   */
  function formatTime(totalSeconds) {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  /**
   * Updates Timer UI display and progress bar
   */
  function renderTimer() {
    let remaining = currentSession.remainingSeconds ?? 1500;

    if (currentSession.state === 'focusing' && currentSession.startedAt) {
      const elapsed = Math.floor((Date.now() - currentSession.startedAt) / 1000);
      remaining = Math.max(0, (currentSession.durationSeconds || 1500) - elapsed);
    }

    timerDisplay.textContent = formatTime(remaining);

    const total = currentSession.durationSeconds || 1500;
    const pct = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 100;
    timerProgressBar.style.width = `${pct}%`;
  }

  /**
   * Updates Status badge and button enabled/disabled states
   */
  function renderStatus() {
    const state = currentSession.state || 'idle';

    sessionStatusBadge.className = 'status-pill';
    if (state === 'focusing') {
      sessionStatusBadge.classList.add('status-focusing');
      statusText.textContent = 'FOCUSING 🔥';
      btnStartFocus.disabled = true;
      btnPauseFocus.disabled = false;
      btnStopFocus.disabled = false;
    } else if (state === 'break') {
      sessionStatusBadge.classList.add('status-break');
      statusText.textContent = 'BREAK ☕';
      btnStartFocus.disabled = true;
      btnPauseFocus.disabled = false;
      btnStopFocus.disabled = false;
    } else {
      statusText.textContent = 'IDLE';
      btnStartFocus.disabled = false;
      btnPauseFocus.disabled = true;
      btnStopFocus.disabled = true;
    }

    violationCountElem.textContent = `${currentSession.violationCount || 0} lần`;
    toggleWebcam.checked = Boolean(currentSession.webcamEnabled);
  }

  /**
   * Renders the scrollable blacklist domains
   */
  function renderBlacklist(blacklist = []) {
    currentBlacklist = blacklist;
    blacklistCount.textContent = blacklist.length;
    blacklistContainer.innerHTML = '';

    if (!blacklist || blacklist.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.cssText = 'color:#606075;font-size:10px;text-align:center;padding:12px;';
      emptyDiv.textContent = 'Chưa có tên miền nào trong blacklist';
      blacklistContainer.appendChild(emptyDiv);
      return;
    }

    blacklist.forEach((domain) => {
      const item = document.createElement('div');
      item.className = 'blacklist-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'blacklist-domain-name';
      nameSpan.textContent = domain;
      nameSpan.title = domain;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-remove-domain';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Xóa ${domain}`;
      removeBtn.addEventListener('click', () => removeDomain(domain));

      item.appendChild(nameSpan);
      item.appendChild(removeBtn);
      blacklistContainer.appendChild(item);
    });
  }

  /**
   * Refresh all popup data from background worker
   */
  async function refreshData() {
    const res = await sendBackgroundMessage({ action: 'GET_POPUP_DATA' });
    if (res && res.status === 'OK') {
      currentSession.state = res.state || 'idle';
      if (res.session) {
        currentSession.startedAt = res.session.startedAt;
        currentSession.durationSeconds = res.session.durationSeconds || 1500;
        currentSession.remainingSeconds = res.session.remainingSeconds ?? 1500;
      }
      currentSession.violationCount = res.violationCount || 0;
      currentSession.webcamEnabled = res.webcamEnabled ?? true;

      renderStatus();
      renderTimer();
      renderBlacklist(res.blacklist || []);
    }
  }

  /**
   * Adds domain to blacklist
   */
  async function addDomain(domain) {
    const cleaned = cleanDomainInput(domain);
    if (!cleaned) return;
    if (currentBlacklist.includes(cleaned)) return;

    const res = await sendBackgroundMessage({
      action: 'ADD_BLACKLIST_DOMAIN',
      domain: cleaned
    });
    if (res && res.status === 'OK') {
      renderBlacklist(res.blacklist);
      inputNewDomain.value = '';
    }
  }

  /**
   * Removes domain from blacklist
   */
  async function removeDomain(domain) {
    const res = await sendBackgroundMessage({
      action: 'REMOVE_BLACKLIST_DOMAIN',
      domain
    });
    if (res && res.status === 'OK') {
      renderBlacklist(res.blacklist);
    }
  }

  /**
   * Resets blacklist to 14 default domains
   */
  async function resetBlacklist() {
    const res = await sendBackgroundMessage({ action: 'RESET_BLACKLIST' });
    if (res && res.status === 'OK') {
      renderBlacklist(res.blacklist);
    }
  }

  /**
   * Sets up periodic tick for smooth UI countdown
   */
  function startTicker() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      if (currentSession.state === 'focusing') {
        renderTimer();
      }
    }, 1000);
  }

  // Event Listeners
  btnStartFocus.addEventListener('click', async () => {
    btnStartFocus.disabled = true;
    const res = await sendBackgroundMessage({
      action: 'START_FOCUS',
      durationSeconds: 1500,
      characterSlug: 'cat',
      mode: 'extreme'
    });
    if (res && res.status === 'OK') {
      await refreshData();
    }
  });

  btnPauseFocus.addEventListener('click', async () => {
    btnPauseFocus.disabled = true;
    const res = await sendBackgroundMessage({ action: 'PAUSE_FOCUS' });
    if (res && res.status === 'OK') {
      await refreshData();
    }
  });

  btnStopFocus.addEventListener('click', async () => {
    btnStopFocus.disabled = true;
    const res = await sendBackgroundMessage({ action: 'STOP_FOCUS' });
    if (res && res.status === 'OK') {
      await refreshData();
    }
  });

  toggleWebcam.addEventListener('change', async () => {
    const isChecked = toggleWebcam.checked;
    await sendBackgroundMessage({
      action: 'TOGGLE_WEBCAM',
      enabled: isChecked
    });
    currentSession.webcamEnabled = isChecked;
  });

  btnResetBlacklist.addEventListener('click', () => {
    resetBlacklist();
  });

  addDomainForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addDomain(inputNewDomain.value);
  });

  btnOpenCampus.addEventListener('click', async () => {
    await sendBackgroundMessage({ action: 'CLOSE_TAB_AND_FOCUS_CAMPUS' });
    window.close?.();
  });

  // Listen for storage changes if available
  if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener(() => {
      refreshData();
    });
  }

  // Initialize
  refreshData();
  startTicker();

  // Export for testing
  if (typeof window !== 'undefined') {
    window.__CAMPUSOS_POPUP__ = {
      cleanDomainInput,
      formatTime,
      getCurrentSession: () => currentSession,
      getCurrentBlacklist: () => currentBlacklist,
      refreshData,
      addDomain,
      removeDomain,
      resetBlacklist
    };
  }
})();
