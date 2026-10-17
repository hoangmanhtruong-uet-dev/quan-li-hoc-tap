/**
 * AI Giám Sát Học Tập Cực Đoan (CampusOS)
 * Background Service Worker - Manifest V3
 *
 * Responsibilities:
 * - Session lifecycle FSM: 'idle' | 'focusing' | 'break'
 * - Storage synchronization for blacklist domains and session state
 * - Tab monitoring via chrome.tabs.onActivated and chrome.tabs.onUpdated
 * - Clean URL matching with subdomains support and CampusOS exemption
 * - Lockout coordination, tab closure, and focus redirection to CampusOS
 * - Exemption management with 180s cooldown enforcement
 * - Two-way messaging with CampusOS Web App and internal extension components
 */

export const DEFAULT_BLACKLIST_DOMAINS = [
  'facebook.com',
  'youtube.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'netflix.com',
  'bilibili.com',
  'shopee.vn',
  'reddit.com',
  'threads.net',
  'twitch.tv',
  'discord.com',
  'lazada.vn'
];

export const STORAGE_KEYS = {
  BLACKLIST: 'campusos_blacklist_domains',
  SESSION: 'campusos_session_state',
  WEBCAM_ENABLED: 'campusos_webcam_enabled'
};

export const EXEMPTION_COOLDOWN_SECONDS = 180; // 3 minutes cooldown
export const DEFAULT_EXEMPTION_DURATION_SECONDS = 180; // 3 minutes grace period

/**
 * Normalizes a user-entered or raw domain string into a clean hostname format
 * (e.g. "https://m.facebook.com/path?query" -> "m.facebook.com")
 */
export function normalizeDomain(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  let cleaned = rawInput.trim().toLowerCase();
  // Strip protocol
  cleaned = cleaned.replace(/^[a-z]+:\/\//i, '');
  // Strip path & query parameters
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  // Strip port
  cleaned = cleaned.split(':')[0];
  // Strip wildcard prefix
  cleaned = cleaned.replace(/^\*\./, '');
  // Strip leading dot
  cleaned = cleaned.replace(/^\.+/, '');
  // Strip trailing dot
  cleaned = cleaned.replace(/\.+$/, '');
  return cleaned;
}

/**
 * Tests whether a given URL is on the blacklist.
 * Supports exact domain and subdomains (e.g. m.facebook.com, www.youtube.com).
 * Exempts internal schemes and localhost/127.0.0.1/campusos.vn.
 */
export function isUrlBlacklisted(rawUrl, blacklist = DEFAULT_BLACKLIST_DOMAINS) {
  return getMatchedBlacklistDomain(rawUrl, blacklist) !== null;
}

/**
 * Returns the matched blacklist domain if blacklisted, or null if exempt/safe.
 */
export function getMatchedBlacklistDomain(rawUrl, blacklist = DEFAULT_BLACKLIST_DOMAINS) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  try {
    const parsed = new URL(rawUrl);
    // Ignore non-web protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    let hostname = parsed.hostname.toLowerCase();
    if (hostname.endsWith('.')) {
      hostname = hostname.slice(0, -1);
    }

    // Exempt localhost, 127.0.0.1, and CampusOS domains
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === 'campusos.vn' ||
      hostname.endsWith('.campusos.vn')
    ) {
      return null;
    }

    const list = Array.isArray(blacklist) ? blacklist : DEFAULT_BLACKLIST_DOMAINS;

    for (const item of list) {
      const targetDomain = normalizeDomain(item);
      if (!targetDomain) continue;

      if (hostname === targetDomain || hostname.endsWith('.' + targetDomain)) {
        return targetDomain;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Supervisor Session Finite State Machine (FSM)
 */
export class SupervisorSessionFSM {
  constructor(initialState = {}) {
    this.state = initialState.state || 'idle'; // 'idle' | 'focusing' | 'break'
    this.startedAt = initialState.startedAt || null;
    this.durationSeconds = initialState.durationSeconds || 1500; // 25 mins default
    this.remainingSeconds = initialState.remainingSeconds ?? this.durationSeconds;
    this.characterSlug = initialState.characterSlug || 'cat';
    this.mode = initialState.mode || 'extreme';
    this.violationCount = initialState.violationCount || 0;
    this.lastExemptionAt = initialState.lastExemptionAt || 0;
    this.exemptUntil = initialState.exemptUntil || 0;
    this.webcamEnabled = initialState.webcamEnabled ?? true;
  }

  toJSON() {
    return {
      state: this.state,
      startedAt: this.startedAt,
      durationSeconds: this.durationSeconds,
      remainingSeconds: this.getRemainingSeconds(),
      characterSlug: this.characterSlug,
      mode: this.mode,
      violationCount: this.violationCount,
      lastExemptionAt: this.lastExemptionAt,
      exemptUntil: this.exemptUntil,
      webcamEnabled: this.webcamEnabled
    };
  }

  getRemainingSeconds() {
    if (this.state !== 'focusing' || !this.startedAt) {
      return this.remainingSeconds;
    }
    const elapsed = Math.floor((Date.now() - this.startedAt) / 1000);
    const rem = Math.max(0, this.durationSeconds - elapsed);
    return rem;
  }

  isFocusing() {
    return this.state === 'focusing';
  }

  isExempt(currentTime = Date.now()) {
    return currentTime < this.exemptUntil;
  }

  startFocus({ durationSeconds = 1500, characterSlug = 'cat', mode = 'extreme' } = {}) {
    this.state = 'focusing';
    this.startedAt = Date.now();
    this.durationSeconds = durationSeconds;
    this.remainingSeconds = durationSeconds;
    this.characterSlug = characterSlug;
    this.mode = mode;
    this.violationCount = 0;
    this.exemptUntil = 0;
    return this.toJSON();
  }

  pauseFocus() {
    if (this.state === 'focusing') {
      this.remainingSeconds = this.getRemainingSeconds();
      this.state = 'idle';
      this.startedAt = null;
    }
    return this.toJSON();
  }

  stopFocus() {
    this.state = 'idle';
    this.startedAt = null;
    this.remainingSeconds = this.durationSeconds;
    return this.toJSON();
  }

  startBreak({ durationSeconds = 300 } = {}) {
    this.state = 'break';
    this.startedAt = Date.now();
    this.durationSeconds = durationSeconds;
    this.remainingSeconds = durationSeconds;
    return this.toJSON();
  }

  registerViolation() {
    this.violationCount += 1;
    return this.violationCount;
  }

  requestExemption(durationSeconds = DEFAULT_EXEMPTION_DURATION_SECONDS, currentTime = Date.now()) {
    const cooldownMs = EXEMPTION_COOLDOWN_SECONDS * 1000;
    const timeSinceLast = currentTime - this.lastExemptionAt;

    if (this.lastExemptionAt > 0 && timeSinceLast < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - timeSinceLast) / 1000);
      return {
        status: 'EXEMPTION_DENIED',
        success: false,
        waitSeconds,
        error: `Ân hạn đang trong thời gian hồi phục (cooldown). Vui lòng đợi ${waitSeconds} giây.`
      };
    }

    this.lastExemptionAt = currentTime;
    this.exemptUntil = currentTime + durationSeconds * 1000;

    return {
      status: 'EXEMPTION_GRANTED',
      success: true,
      exemptUntil: this.exemptUntil,
      remainingSec: durationSeconds
    };
  }

  setWebcamEnabled(enabled) {
    this.webcamEnabled = Boolean(enabled);
    return this.webcamEnabled;
  }
}

// Global in-memory instance for service worker lifetime
export const sessionFsm = new SupervisorSessionFSM();
export let currentBlacklist = [...DEFAULT_BLACKLIST_DOMAINS];

/**
 * Storage helpers with sync and local fallback
 */
export async function getStorageData(keys) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve({});
      return;
    }
    const area = chrome.storage.sync || chrome.storage.local;
    area.get(keys, (res) => {
      if (chrome.runtime?.lastError && chrome.storage.local && area !== chrome.storage.local) {
        chrome.storage.local.get(keys, (localRes) => resolve(localRes || {}));
      } else {
        resolve(res || {});
      }
    });
  });
}

export async function setStorageData(items) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    const area = chrome.storage.sync || chrome.storage.local;
    area.set(items, () => {
      if (chrome.runtime?.lastError && chrome.storage.local && area !== chrome.storage.local) {
        chrome.storage.local.set(items, () => resolve());
      } else {
        resolve();
      }
    });
  });
}

/**
 * Synchronize state to persistent storage
 */
export async function persistCurrentState() {
  await setStorageData({
    [STORAGE_KEYS.SESSION]: sessionFsm.toJSON(),
    [STORAGE_KEYS.BLACKLIST]: currentBlacklist,
    [STORAGE_KEYS.WEBCAM_ENABLED]: sessionFsm.webcamEnabled
  });
}

let initPromise = null;

/**
 * Ensures extension storage and in-memory FSM state are restored from persistent storage.
 * Handles Chrome Manifest V3 service worker dormancy rehydration.
 */
export function ensureInitialized(forceRefresh = false) {
  if (!initPromise || forceRefresh) {
    initPromise = initializeExtension().catch((err) => {
      console.error('[CampusOS Background] Initialization failed:', err);
      initPromise = null; // Allow retry on next event if initialization failed
    });
  }
  return initPromise;
}

/**
 * Initialize extension storage and state
 */
export async function initializeExtension() {
  const data = await getStorageData([
    STORAGE_KEYS.BLACKLIST,
    STORAGE_KEYS.SESSION,
    STORAGE_KEYS.WEBCAM_ENABLED
  ]);

  if (Array.isArray(data[STORAGE_KEYS.BLACKLIST]) && data[STORAGE_KEYS.BLACKLIST].length > 0) {
    currentBlacklist = data[STORAGE_KEYS.BLACKLIST];
  } else {
    currentBlacklist = [...DEFAULT_BLACKLIST_DOMAINS];
    await setStorageData({ [STORAGE_KEYS.BLACKLIST]: currentBlacklist });
  }

  if (data[STORAGE_KEYS.SESSION]) {
    const saved = data[STORAGE_KEYS.SESSION];
    sessionFsm.state = saved.state || 'idle';
    sessionFsm.startedAt = saved.startedAt || null;
    sessionFsm.durationSeconds = saved.durationSeconds || 1500;
    sessionFsm.remainingSeconds = saved.remainingSeconds ?? 1500;
    sessionFsm.characterSlug = saved.characterSlug || 'cat';
    sessionFsm.mode = saved.mode || 'extreme';
    sessionFsm.violationCount = saved.violationCount || 0;
    sessionFsm.lastExemptionAt = saved.lastExemptionAt || 0;
    sessionFsm.exemptUntil = saved.exemptUntil || 0;
    sessionFsm.webcamEnabled = saved.webcamEnabled ?? true;
  }

  if (data[STORAGE_KEYS.WEBCAM_ENABLED] !== undefined) {
    sessionFsm.webcamEnabled = Boolean(data[STORAGE_KEYS.WEBCAM_ENABLED]);
  }

  initPromise = Promise.resolve();
}

/**
 * Queries all tabs matching CampusOS web application
 */
export async function queryCampusOsTabs() {
  if (typeof chrome === 'undefined' || !chrome.tabs?.query) return [];

  const patterns = [
    'http://localhost:3000/*',
    'http://127.0.0.1:3000/*',
    'https://*.campusos.vn/*',
    'https://campusos.vn/*'
  ];

  const matchedTabs = [];
  for (const urlPattern of patterns) {
    try {
      const tabs = await chrome.tabs.query({ url: urlPattern });
      if (tabs && tabs.length > 0) {
        matchedTabs.push(...tabs);
      }
    } catch {
      // Ignore pattern query errors
    }
  }

  const seenIds = new Set();
  return matchedTabs.filter((t) => {
    if (!t.id || seenIds.has(t.id)) return false;
    seenIds.add(t.id);
    return true;
  });
}

/**
 * Notifies CampusOS tabs of an extension violation event
 */
export async function broadcastViolationToCampusOs(payload) {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;

  const campusTabs = await queryCampusOsTabs();
  for (const tab of campusTabs) {
    if (tab.id) {
      try {
        chrome.tabs.sendMessage(tab.id, payload).catch(() => {});
      } catch {
        // Tab might be unresponsive or reloading
      }
    }
  }
}

/**
 * Handles tab closure and focus switching to CampusOS
 */
export async function handleCloseTabAndFocusCampus(senderTabId) {
  if (typeof chrome === 'undefined' || !chrome.tabs) return;

  try {
    const campusTabs = await queryCampusOsTabs();
    if (campusTabs && campusTabs.length > 0) {
      const targetTab = campusTabs[0];
      await chrome.tabs.update(targetTab.id, { active: true });
      if (targetTab.windowId && chrome.windows) {
        await chrome.windows.update(targetTab.windowId, { focused: true }).catch(() => {});
      }
    } else {
      // Open CampusOS dashboard if not already open
      await chrome.tabs.create({ url: 'http://localhost:3000/dashboard', active: true });
    }
  } catch (err) {
    console.error('[CampusOS Background] Error switching to CampusOS tab:', err);
  } finally {
    if (senderTabId) {
      try {
        await chrome.tabs.remove(senderTabId);
      } catch (removeErr) {
        console.warn('[CampusOS Background] Could not close violating tab:', senderTabId, removeErr);
      }
    }
  }
}

export const VIOLATION_DEBOUNCE_MS = 2000; // 2 seconds debounce per tab
export const lastViolationTimeByTab = new Map();

/**
 * Checks whether a violation check for a specific tab should be debounced.
 * Prevents multiple duplicate penalties within 2000ms on the same tab.
 */
export function isTabDebounced(tabId, currentTime = Date.now(), debounceMs = VIOLATION_DEBOUNCE_MS) {
  if (!tabId) return false;
  const lastTime = lastViolationTimeByTab.get(tabId);
  return typeof lastTime === 'number' && (currentTime - lastTime) < debounceMs;
}

/**
 * Records the timestamp of a violation on a specific tab.
 */
export function recordTabViolationTime(tabId, currentTime = Date.now()) {
  if (tabId) {
    lastViolationTimeByTab.set(tabId, currentTime);
  }
}

/**
 * Checks a tab URL and triggers lockout HUD if blacklisted during focus mode
 */
export async function checkAndHandleTabViolation(tab) {
  await ensureInitialized();
  if (!tab || !tab.url || !sessionFsm.isFocusing()) return;
  if (sessionFsm.isExempt()) return;

  const matchedDomain = getMatchedBlacklistDomain(tab.url, currentBlacklist);
  if (!matchedDomain) return;

  const tabId = tab.id;
  const now = Date.now();
  if (tabId && isTabDebounced(tabId, now)) {
    return;
  }

  if (tabId) {
    recordTabViolationTime(tabId, now);
  }

  // Register violation count
  sessionFsm.registerViolation();
  await persistCurrentState();

  const violationPayload = {
    action: 'EXTENSION_VIOLATION',
    domain: matchedDomain,
    reason: 'blacklist_url',
    penaltyXp: 50,
    timestamp: now,
    violationCount: sessionFsm.violationCount
  };

  // Broadcast to CampusOS web application
  await broadcastViolationToCampusOs(violationPayload);

  // Send HUD trigger to the violating tab
  if (tab.id && typeof chrome !== 'undefined' && chrome.tabs?.sendMessage) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'SHOW_LOCKOUT_HUD',
      domain: matchedDomain,
      url: tab.url,
      remainingSeconds: sessionFsm.getRemainingSeconds(),
      violationCount: sessionFsm.violationCount
    }).catch(() => {
      // If content script not yet injected or loaded, ignore
    });
  }
}

/**
 * Core message processor handling both internal and external requests
 */
export async function handleMessageRequest(message, sender) {
  await ensureInitialized();
  if (!message || typeof message !== 'object') {
    return { status: 'ERROR', error: 'Invalid message payload' };
  }

  const action = message.action;

  switch (action) {
    case 'PING':
      return {
        status: 'PONG',
        installed: true,
        version: '1.0.0',
        state: sessionFsm.state,
        session: sessionFsm.toJSON()
      };

    case 'START_FOCUS': {
      const session = sessionFsm.startFocus({
        durationSeconds: message.durationSeconds || 1500,
        characterSlug: message.characterSlug || 'cat',
        mode: message.mode || 'extreme'
      });
      await persistCurrentState();
      return { status: 'OK', state: sessionFsm.state, session };
    }

    case 'PAUSE_FOCUS': {
      const session = sessionFsm.pauseFocus();
      await persistCurrentState();
      return { status: 'OK', state: sessionFsm.state, session };
    }

    case 'STOP_FOCUS': {
      const session = sessionFsm.stopFocus();
      await persistCurrentState();
      return { status: 'OK', state: sessionFsm.state, session };
    }

    case 'START_BREAK': {
      const session = sessionFsm.startBreak({
        durationSeconds: message.durationSeconds || 300
      });
      await persistCurrentState();
      return { status: 'OK', state: sessionFsm.state, session };
    }

    case 'REQUEST_EXEMPTION': {
      const result = sessionFsm.requestExemption(
        message.durationSeconds || DEFAULT_EXEMPTION_DURATION_SECONDS
      );
      if (result.success) {
        await persistCurrentState();
      }
      return result;
    }

    case 'SYNC_STATE':
    case 'GET_STATE':
    case 'GET_POPUP_DATA':
      return {
        status: 'OK',
        state: sessionFsm.state,
        session: sessionFsm.toJSON(),
        blacklist: currentBlacklist,
        violationCount: sessionFsm.violationCount,
        webcamEnabled: sessionFsm.webcamEnabled
      };

    case 'CHECK_URL': {
      const checkUrl = message.url;
      const matched = getMatchedBlacklistDomain(checkUrl, currentBlacklist);
      return {
        status: 'OK',
        isBlacklisted: matched !== null,
        domain: matched,
        isFocusing: sessionFsm.isFocusing(),
        isExempt: sessionFsm.isExempt()
      };
    }

    case 'LOCKOUT_VIOLATION': {
      sessionFsm.registerViolation();
      await persistCurrentState();

      const payload = {
        action: 'EXTENSION_VIOLATION',
        domain: message.domain || 'unknown',
        reason: message.reason || 'blacklist_url',
        penaltyXp: 50,
        timestamp: Date.now(),
        violationCount: sessionFsm.violationCount
      };
      await broadcastViolationToCampusOs(payload);
      return { status: 'OK', violationCount: sessionFsm.violationCount };
    }

    case 'CLOSE_TAB_AND_FOCUS_CAMPUS': {
      const tabIdToClose = message.tabId || sender?.tab?.id;
      await handleCloseTabAndFocusCampus(tabIdToClose);
      return { status: 'OK' };
    }

    case 'UPDATE_BLACKLIST': {
      if (Array.isArray(message.blacklist)) {
        currentBlacklist = message.blacklist
          .map(normalizeDomain)
          .filter(Boolean);
        await persistCurrentState();
      }
      return { status: 'OK', blacklist: currentBlacklist };
    }

    case 'ADD_BLACKLIST_DOMAIN': {
      const toAdd = normalizeDomain(message.domain);
      if (toAdd && !currentBlacklist.includes(toAdd)) {
        currentBlacklist.push(toAdd);
        await persistCurrentState();
      }
      return { status: 'OK', blacklist: currentBlacklist };
    }

    case 'REMOVE_BLACKLIST_DOMAIN': {
      const toRemove = normalizeDomain(message.domain);
      currentBlacklist = currentBlacklist.filter((d) => d !== toRemove);
      await persistCurrentState();
      return { status: 'OK', blacklist: currentBlacklist };
    }

    case 'RESET_BLACKLIST': {
      currentBlacklist = [...DEFAULT_BLACKLIST_DOMAINS];
      await persistCurrentState();
      return { status: 'OK', blacklist: currentBlacklist };
    }

    case 'TOGGLE_WEBCAM': {
      const enabled = sessionFsm.setWebcamEnabled(message.enabled);
      await persistCurrentState();
      return { status: 'OK', webcamEnabled: enabled };
    }

    default:
      return { status: 'UNKNOWN_ACTION', action };
  }
}

/**
 * Event Listeners Registration (Chrome Runtime)
 */
if (typeof chrome !== 'undefined' && chrome.runtime) {
  // Top-level automatic rehydration for Manifest V3 Service Worker wakeup
  ensureInitialized().catch((err) => {
    console.error('[CampusOS Background] Wakeup rehydration failed:', err);
  });

  // Lifecycle Initialization
  chrome.runtime.onInstalled?.addListener(() => {
    ensureInitialized(true).catch(console.error);
  });

  chrome.runtime.onStartup?.addListener(() => {
    ensureInitialized(true).catch(console.error);
  });

  // External message router (Web App)
  chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
    handleMessageRequest(message, sender)
      .then(sendResponse)
      .catch((err) => sendResponse({ status: 'ERROR', error: String(err) }));
    return true; // Keep message channel open for async response
  });

  // Internal message router (Content script & Popup)
  chrome.runtime.onMessage?.addListener((message, sender, sendResponse) => {
    handleMessageRequest(message, sender)
      .then(sendResponse)
      .catch((err) => sendResponse({ status: 'ERROR', error: String(err) }));
    return true; // Keep message channel open for async response
  });

  // Tab Activation Listener
  if (chrome.tabs?.onActivated) {
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      try {
        await ensureInitialized();
        if (!chrome.tabs?.get) return;
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab && tab.url) {
          await checkAndHandleTabViolation(tab);
        }
      } catch (err) {
        console.warn('[CampusOS Background] onActivated handler warning:', err);
      }
    });
  }

  // Tab URL Update Listener
  if (chrome.tabs?.onUpdated) {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      try {
        // Only inspect URL transitions to prevent duplicate penalties on title/status/favicon changes
        if (!changeInfo.url) return;
        await ensureInitialized();
        await checkAndHandleTabViolation({
          id: tabId,
          url: changeInfo.url,
          windowId: tab?.windowId
        });
      } catch (err) {
        console.warn('[CampusOS Background] onUpdated handler warning:', err);
      }
    });
  }

  // Clean up debounce cache when tab is closed
  if (chrome.tabs?.onRemoved) {
    chrome.tabs.onRemoved.addListener((tabId) => {
      lastViolationTimeByTab.delete(tabId);
    });
  }
}
