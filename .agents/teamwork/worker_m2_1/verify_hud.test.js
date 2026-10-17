import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentJsPath = path.resolve(__dirname, '../../../extension/content.js');

describe('Milestone 2: Cyber-Glass Lockout HUD & Vietnamese TTS Verification Suite', () => {
  test('Requirement 1 & Source Code Verification: content.js exists and contains core MV3 HUD logic', () => {
    assert.ok(fs.existsSync(contentJsPath), 'content.js must exist');
    const content = fs.readFileSync(contentJsPath, 'utf8');

    // 1. Shadow DOM injection
    assert.match(content, /campusos-lockout-hud-root/, 'Must declare root host element ID');
    assert.match(content, /attachShadow\(\s*\{\s*mode:\s*['"]open['"]\s*\}\s*\)/, 'Must attach open Shadow DOM');

    // 2. Cyber-Glass visual styling
    assert.match(content, /backdrop-filter:\s*blur\(25px\)/, 'Must apply 25px blur backdrop filter');
    assert.match(content, /rgba\(10,\s*10,\s*18,\s*0\.88\)/, 'Must specify exact rgba(10, 10, 18, 0.88) overlay');
    assert.match(content, /2147483647/, 'Must specify maximum z-index 2147483647');
    assert.match(content, /rgba\(255,\s*61,\s*110,\s*0\.4\)/, 'Must specify neon pink/red border rgba(255, 61, 110, 0.4)');
    assert.match(content, /PHÁT HIỆN VI PHẠM KỶ LUẬT/, 'Must display tilted sticker badge text');

    // 3. Screen shake animation
    assert.match(content, /@keyframes\s+screen-shake/, 'Must define @keyframes screen-shake');
    assert.match(content, /screen-shake\s+0\.65s/, 'Must animate screen-shake over 0.65s');

    // 4. Mascot & Vietnamese TTS
    assert.match(content, /assets\/fat-orange-cat\.png/, 'Must reference mascot asset');
    assert.match(content, /speechBubble|campusos-speech-bubble/, 'Must render speech bubble');
    assert.match(content, /vi-VN/, 'Must specify Vietnamese TTS language');
    assert.match(content, /\/api\/tts/, 'Must attempt /api/tts endpoint');

    // 5. 5-Second Countdown
    assert.match(content, /5000/, 'Must define 5-second countdown duration');
    assert.match(content, /CLOSE_TAB_AND_FOCUS_CAMPUS/, 'Must dispatch CLOSE_TAB_AND_FOCUS_CAMPUS');

    // 6. Exemption ("Tôi đang tra tài liệu")
    assert.match(content, /Tôi đang tra tài liệu/, 'Must have exemption button text');
    assert.match(content, /REQUEST_EXEMPTION/, 'Must dispatch REQUEST_EXEMPTION action');
    assert.match(content, /180/, 'Must request 180s exemption');

    // 7. Background listener & Web relay
    assert.match(content, /SHOW_LOCKOUT_HUD/, 'Must listen for SHOW_LOCKOUT_HUD action');
    assert.match(content, /CAMPUSOS_EXTENSION_REQUEST/, 'Must handle CAMPUSOS_EXTENSION_REQUEST relay');
    assert.match(content, /CAMPUSOS_EXTENSION_RESPONSE/, 'Must respond with CAMPUSOS_EXTENSION_RESPONSE');
  });

  test('Mock DOM Simulation: Full Execution on Distraction Page (youtube.com)', async () => {
    const sentMessages = [];
    let removedRoot = false;

    class MockElement {
      constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.id = '';
        this.className = '';
        this.style = {};
        this.classList = {
          classes: new Set(),
          add: (c) => this.classList.classes.add(c),
          remove: (c) => this.classList.classes.delete(c),
          contains: (c) => this.classList.classes.has(c),
        };
        this.children = [];
        this.shadowRoot = null;
        this.innerHTML = '';
        this.textContent = '';
        this.eventListeners = {};
        this.disabled = false;
      }
      appendChild(child) {
        this.children.push(child);
        return child;
      }
      attachShadow(options) {
        this.shadowRoot = new MockShadowRoot(options);
        return this.shadowRoot;
      }
      addEventListener(type, listener) {
        if (!this.eventListeners[type]) this.eventListeners[type] = [];
        this.eventListeners[type].push(listener);
      }
      dispatchEvent(event) {
        const listeners = this.eventListeners[event.type] || [];
        listeners.forEach((fn) => fn(event));
      }
      remove() {
        removedRoot = true;
      }
      getElementById(id) {
        if (this.id === id) return this;
        for (const child of this.children) {
          if (child.getElementById) {
            const found = child.getElementById(id);
            if (found) return found;
          }
        }
        return null;
      }
    }

    class MockShadowRoot {
      constructor(options) {
        this.mode = options.mode;
        this.children = [];
        this.elementsById = new Map();
      }
      appendChild(child) {
        this.children.push(child);
        if (child.id) this.elementsById.set(child.id, child);
        this._indexChildren(child);
        return child;
      }
      _indexChildren(el) {
        if (el.innerHTML) {
          const idMatches = el.innerHTML.matchAll(/id="([^"]+)"/g);
          for (const m of idMatches) {
            const subEl = new MockElement('div');
            subEl.id = m[1];
            this.elementsById.set(m[1], subEl);
          }
        }
      }
      getElementById(id) {
        return this.elementsById.get(id) || null;
      }
    }

    const mockDocument = {
      documentElement: new MockElement('HTML'),
      body: new MockElement('BODY'),
      createElement(tag) {
        return new MockElement(tag);
      },
      getElementById(id) {
        if (id === 'campusos-lockout-hud-root') {
          return mockDocument.documentElement.children.find((c) => c.id === id) || null;
        }
        return null;
      },
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const mockWindow = {
      location: {
        hostname: 'youtube.com',
        href: 'https://youtube.com/watch?v=12345',
        origin: 'https://youtube.com',
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      postMessage: (data) => sentMessages.push(data),
      dispatchEvent: () => {},
    };

    let onMessageCallback = null;

    const mockChrome = {
      runtime: {
        getURL: (path) => `chrome-extension://mock-id/${path}`,
        sendMessage: (msg, cb) => {
          sentMessages.push(msg);
          if (cb) {
            if (msg.action === 'REQUEST_EXEMPTION') {
              cb({ status: 'EXEMPTION_GRANTED', success: true, exemptUntil: Date.now() + 180000 });
            } else if (msg.action === 'CHECK_URL') {
              cb({ isBlacklisted: true, isFocusing: true, isExempt: false, domain: 'youtube.com' });
            } else {
              cb({ status: 'OK' });
            }
          }
        },
        onMessage: {
          addListener: (fn) => {
            onMessageCallback = fn;
          },
        },
      },
    };

    const contentCode = fs.readFileSync(contentJsPath, 'utf8');
    const runSandbox = new Function('window', 'document', 'chrome', 'Audio', 'fetch', contentCode);
    runSandbox(mockWindow, mockDocument, mockChrome, null, async () => ({ ok: false }));

    const lockoutApi = mockWindow.__CAMPUSOS_LOCKOUT_HUD__;
    assert.ok(lockoutApi);

    // Initial check on load must have triggered CHECK_URL
    assert.ok(
      sentMessages.some((m) => m.action === 'CHECK_URL' && m.url.includes('youtube.com')),
      'Must check URL on load'
    );

    // Test SHOW_LOCKOUT_HUD background event
    assert.ok(typeof onMessageCallback === 'function', 'Must register chrome.runtime.onMessage listener');
    let messageResponse = null;
    onMessageCallback(
      { action: 'SHOW_LOCKOUT_HUD', domain: 'youtube.com', remainingSeconds: 1200 },
      {},
      (res) => {
        messageResponse = res;
      }
    );
    assert.deepEqual(messageResponse, { status: 'OK' });

    // Verify injected host element in documentElement
    const hostEl = mockDocument.getElementById('campusos-lockout-hud-root');
    assert.ok(hostEl, 'Host element must exist in documentElement');
    assert.ok(hostEl.shadowRoot, 'Host must attach shadow root');

    // Verify exemption button click
    const btnExemption = hostEl.shadowRoot.getElementById('campusos-btn-exemption');
    assert.ok(btnExemption);
    btnExemption.eventListeners['click'][0]({ stopPropagation: () => {} });
    assert.ok(
      sentMessages.some((m) => m.action === 'REQUEST_EXEMPTION' && m.durationSeconds === 180),
      'Exemption click dispatches REQUEST_EXEMPTION 180s'
    );
    assert.equal(removedRoot, true, 'Exemption grant clears HUD from DOM');

    // Test immediate close button
    const btnCloseNow = hostEl.shadowRoot.getElementById('campusos-btn-close-now');
    assert.ok(btnCloseNow);
    btnCloseNow.eventListeners['click'][0]({ stopPropagation: () => {} });
    assert.ok(
      sentMessages.some((m) => m.action === 'CLOSE_TAB_AND_FOCUS_CAMPUS'),
      'Must send CLOSE_TAB_AND_FOCUS_CAMPUS on close now click'
    );
    lockoutApi.removeLockoutHud();
  });

  test('Mock DOM Simulation: Exemption Denied Cooldown Enforcement', async () => {
    class MockElement {
      constructor(tagName) {
        this.tagName = tagName.toUpperCase();
        this.id = '';
        this.className = '';
        this.style = {};
        this.classList = {
          classes: new Set(),
          add: (c) => this.classList.classes.add(c),
          remove: (c) => this.classList.classes.delete(c),
        };
        this.children = [];
        this.shadowRoot = null;
        this.innerHTML = '';
        this.textContent = '';
        this.eventListeners = {};
        this.disabled = false;
      }
      appendChild(child) {
        this.children.push(child);
        return child;
      }
      attachShadow(options) {
        this.shadowRoot = new MockShadowRoot(options);
        return this.shadowRoot;
      }
      addEventListener(type, listener) {
        if (!this.eventListeners[type]) this.eventListeners[type] = [];
        this.eventListeners[type].push(listener);
      }
      remove() {}
      getElementById(id) {
        if (this.id === id) return this;
        for (const child of this.children) {
          if (child.getElementById) {
            const found = child.getElementById(id);
            if (found) return found;
          }
        }
        return null;
      }
    }

    class MockShadowRoot {
      constructor(options) {
        this.mode = options.mode;
        this.children = [];
        this.elementsById = new Map();
      }
      appendChild(child) {
        this.children.push(child);
        if (child.id) this.elementsById.set(child.id, child);
        if (child.innerHTML) {
          const idMatches = child.innerHTML.matchAll(/id="([^"]+)"/g);
          for (const m of idMatches) {
            const subEl = new MockElement('div');
            subEl.id = m[1];
            this.elementsById.set(m[1], subEl);
          }
        }
        return child;
      }
      getElementById(id) {
        return this.elementsById.get(id) || null;
      }
    }

    const mockDocument = {
      documentElement: new MockElement('HTML'),
      createElement(tag) {
        return new MockElement(tag);
      },
      getElementById(id) {
        if (id === 'campusos-lockout-hud-root') {
          return mockDocument.documentElement.children.find((c) => c.id === id) || null;
        }
        return null;
      },
    };

    const mockWindow = {
      location: {
        hostname: 'facebook.com',
        href: 'https://facebook.com',
        origin: 'https://facebook.com',
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      postMessage: () => {},
      dispatchEvent: () => {},
    };

    const mockChrome = {
      runtime: {
        getURL: (path) => `chrome-extension://mock-id/${path}`,
        sendMessage: (msg, cb) => {
          if (msg.action === 'REQUEST_EXEMPTION' && cb) {
            cb({
              status: 'EXEMPTION_DENIED',
              success: false,
              waitSeconds: 125,
              error: 'Ân hạn đang trong thời gian hồi phục (cooldown). Vui lòng đợi 125 giây.',
            });
          }
        },
        onMessage: { addListener: () => {} },
      },
    };

    const contentCode = fs.readFileSync(contentJsPath, 'utf8');
    const runSandbox = new Function('window', 'document', 'chrome', 'Audio', 'fetch', contentCode);
    runSandbox(mockWindow, mockDocument, mockChrome, null, async () => ({ ok: false }));

    const lockoutApi = mockWindow.__CAMPUSOS_LOCKOUT_HUD__;
    lockoutApi.showLockoutHud({ domain: 'facebook.com' });

    const hostEl = mockDocument.getElementById('campusos-lockout-hud-root');
    const btnExemption = hostEl.shadowRoot.getElementById('campusos-btn-exemption');
    const warningEl = hostEl.shadowRoot.getElementById('campusos-exemption-warning');

    // Trigger click on exemption button
    btnExemption.eventListeners['click'][0]({ stopPropagation: () => {} });

    // Button should be disabled and warning shown
    assert.equal(btnExemption.disabled, true);
    assert.match(btnExemption.innerHTML, /125s/);
    assert.equal(warningEl.style.display, 'block');
    assert.match(warningEl.textContent, /125 giây/);
    lockoutApi.removeLockoutHud();
  });

  test('Mock DOM Simulation: Web Relay Bridge on CampusOS Origin (localhost:3000)', async () => {
    const windowEventListeners = {};
    const postedWindowMessages = [];
    const sentExtensionMessages = [];

    const mockWindow = {
      location: {
        hostname: 'localhost',
        href: 'http://localhost:3000/dashboard',
        origin: 'http://localhost:3000',
      },
      addEventListener: (type, fn) => {
        if (!windowEventListeners[type]) windowEventListeners[type] = [];
        windowEventListeners[type].push(fn);
      },
      removeEventListener: () => {},
      postMessage: (data) => {
        postedWindowMessages.push(data);
      },
      dispatchEvent: (event) => {
        const listeners = windowEventListeners[event.type] || [];
        listeners.forEach((fn) => fn(event));
      },
    };

    const mockDocument = {
      documentElement: { appendChild: () => {} },
      createElement: () => ({ appendChild: () => {}, attachShadow: () => ({ appendChild: () => {} }) }),
      getElementById: () => null,
    };

    let backgroundMessageListener = null;

    const mockChrome = {
      runtime: {
        getURL: (p) => p,
        sendMessage: (payload, cb) => {
          sentExtensionMessages.push(payload);
          if (cb) cb({ status: 'OK', state: 'focusing' });
          return Promise.resolve({ status: 'OK' });
        },
        onMessage: {
          addListener: (fn) => {
            backgroundMessageListener = fn;
          },
        },
      },
    };

    const contentCode = fs.readFileSync(contentJsPath, 'utf8');
    const runSandbox = new Function('window', 'document', 'chrome', 'Audio', 'fetch', contentCode);
    runSandbox(mockWindow, mockDocument, mockChrome, null, async () => ({ ok: false }));

    // 1. Check bridge readiness handshake announcement
    assert.ok(
      postedWindowMessages.some((m) => m.type === 'CAMPUSOS_EXTENSION_BRIDGE_READY'),
      'Must announce CAMPUSOS_EXTENSION_BRIDGE_READY'
    );
    assert.equal(mockWindow.__CAMPUSOS_EXTENSION_INSTALLED__, true);

    // 2. Test CAMPUSOS_EXTENSION_REQUEST postMessage relay
    const messageListeners = windowEventListeners['message'] || [];
    assert.ok(messageListeners.length >= 1, 'Must register message listener');

    messageListeners[0]({
      source: mockWindow,
      data: {
        type: 'CAMPUSOS_EXTENSION_REQUEST',
        id: 'req-42',
        payload: { action: 'START_FOCUS', durationSeconds: 1500 },
      },
    });

    assert.ok(
      sentExtensionMessages.some((m) => m.action === 'START_FOCUS' && m.durationSeconds === 1500),
      'Must relay START_FOCUS to chrome.runtime.sendMessage'
    );

    assert.ok(
      postedWindowMessages.some(
        (m) => m.type === 'CAMPUSOS_EXTENSION_RESPONSE' && m.id === 'req-42' && m.response.status === 'OK'
      ),
      'Must relay response back to window via CAMPUSOS_EXTENSION_RESPONSE'
    );

    // 3. Test background EXTENSION_VIOLATION event relay to Web App window
    assert.ok(typeof backgroundMessageListener === 'function');
    let customEventFired = false;
    windowEventListeners['campusos:extension-violation'] = [
      () => {
        customEventFired = true;
      },
    ];

    backgroundMessageListener(
      { action: 'EXTENSION_VIOLATION', domain: 'facebook.com', penaltyXp: 50 },
      {},
      () => {}
    );

    assert.ok(
      postedWindowMessages.some(
        (m) => m.type === 'CAMPUSOS_EXTENSION_EVENT' && m.payload.domain === 'facebook.com'
      ),
      'Must relay EXTENSION_VIOLATION to window via CAMPUSOS_EXTENSION_EVENT'
    );
    assert.equal(customEventFired, true, 'Must fire custom DOM event campusos:extension-violation');
  });
});
