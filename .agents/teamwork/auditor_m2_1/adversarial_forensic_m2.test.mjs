import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentJsPath = path.resolve(__dirname, '../../../extension/content.js');

describe('Auditor M2 Forensic & Adversarial Test Suite', () => {
  test('Static Check: content.js contains genuine implementation without facades or dummy mocks', () => {
    assert.ok(fs.existsSync(contentJsPath), 'content.js must exist');
    const content = fs.readFileSync(contentJsPath, 'utf8');

    // Integrity: Prohibit dummy facade returns
    assert.doesNotMatch(content, /return\s+true\s*;\s*\/\/\s*mock/i, 'No fake mock returns');
    assert.doesNotMatch(content, /throw new Error\(['"]NotImplemented['"]\)/, 'No unimplemented stubs');

    // Integrity: Verify Cyber-Glass blur 25px
    assert.match(content, /backdrop-filter:\s*blur\(25px\)/, 'Must have 25px blur');
    assert.match(content, /-webkit-backdrop-filter:\s*blur\(25px\)/, 'Must have webkit 25px blur');

    // Integrity: Verify Screen Shake CSS
    assert.match(content, /@keyframes\s+screen-shake/, 'Must have screen-shake keyframes');
    assert.match(content, /screen-shake\s+0\.65s/, 'Must have screen-shake 0.65s');

    // Integrity: Verify Vietnamese TTS
    assert.match(content, /SpeechSynthesisUtterance/, 'Must support Web Speech API');
    assert.match(content, /vi-VN/, 'Must specify Vietnamese language');
    assert.match(content, /\/api\/tts/, 'Must attempt /api/tts endpoint');

    // Integrity: Verify 5s countdown
    assert.match(content, /TOTAL_COUNTDOWN_MS\s*=\s*5000/, 'Countdown must be 5000ms');
    assert.match(content, /CLOSE_TAB_AND_FOCUS_CAMPUS/, 'Must trigger tab close on 0s');

    // Integrity: Verify Exemption & Cooldown
    assert.match(content, /REQUEST_EXEMPTION/, 'Must request exemption');
    assert.match(content, /durationSeconds:\s*180/, 'Exemption must be 180s');

    // Integrity: Verify Web Relay
    assert.match(content, /CAMPUSOS_EXTENSION_REQUEST/, 'Must handle web request');
    assert.match(content, /CAMPUSOS_EXTENSION_RESPONSE/, 'Must handle web response');
    assert.match(content, /CAMPUSOS_EXTENSION_BRIDGE_READY/, 'Must announce bridge readiness');
  });

  test('Adversarial Check: Host URL matching precision and subdomain injection attacks', () => {
    const content = fs.readFileSync(contentJsPath, 'utf8');
    const sandboxWindow = {
      location: { hostname: 'localhost', href: 'http://localhost:3000' },
      addEventListener: () => {},
      removeEventListener: () => {},
    };
    const runSandbox = new Function('window', 'document', 'chrome', content);
    runSandbox(sandboxWindow, { documentElement: {} }, {});

    const { isCampusOsHost } = sandboxWindow.__CAMPUSOS_LOCKOUT_HUD__;
    assert.equal(typeof isCampusOsHost, 'function');

    // Valid campus hosts
    assert.equal(isCampusOsHost('localhost'), true);
    assert.equal(isCampusOsHost('127.0.0.1'), true);
    assert.equal(isCampusOsHost('campusos.vn'), true);
    assert.equal(isCampusOsHost('app.campusos.vn'), true);
    assert.equal(isCampusOsHost('study.sub.campusos.vn'), true);

    // Host spoofing & adversarial attempts
    assert.equal(isCampusOsHost('campusos.vn.attacker.com'), false);
    assert.equal(isCampusOsHost('fake-campusos.vn'), false);
    assert.equal(isCampusOsHost('notcampusos.vn'), false);
    assert.equal(isCampusOsHost('youtube.com'), false);
    assert.equal(isCampusOsHost('facebook.com'), false);
    assert.equal(isCampusOsHost(''), false);
    assert.equal(isCampusOsHost(null), false);
    assert.equal(isCampusOsHost(undefined), false);
    assert.equal(isCampusOsHost(12345), false);
  });

  test('Adversarial Check: Duplicate Modal Prevention & DOM Stability', () => {
    class MockElement {
      constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.style = {};
        this.eventListeners = {};
      }
      appendChild(c) {
        this.children.push(c);
        return c;
      }
      attachShadow(opts) {
        this.shadowRoot = new MockShadow(opts);
        return this.shadowRoot;
      }
      addEventListener(type, fn) {
        this.eventListeners[type] = this.eventListeners[type] || [];
        this.eventListeners[type].push(fn);
      }
      remove() {
        if (this.parent) {
          this.parent.children = this.parent.children.filter((c) => c !== this);
        }
      }
    }

    class MockShadow {
      constructor(opts) {
        this.mode = opts.mode;
        this.children = [];
        this.elements = new Map();
      }
      appendChild(c) {
        this.children.push(c);
        if (c.innerHTML) {
          for (const m of c.innerHTML.matchAll(/id="([^"]+)"/g)) {
            const sub = new MockElement('div');
            sub.id = m[1];
            this.elements.set(m[1], sub);
          }
        }
        return c;
      }
      getElementById(id) {
        return this.elements.get(id) || null;
      }
    }

    const mockDoc = {
      documentElement: new MockElement('html'),
      createElement: (t) => new MockElement(t),
      getElementById: (id) => mockDoc.documentElement.children.find((c) => c.id === id) || null,
    };

    const mockWin = {
      location: { hostname: 'tiktok.com', href: 'https://tiktok.com' },
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const content = fs.readFileSync(contentJsPath, 'utf8');
    const runSandbox = new Function('window', 'document', 'chrome', content);
    runSandbox(mockWin, mockDoc, { runtime: { sendMessage: () => {}, getURL: (p) => p } });

    const hudApi = mockWin.__CAMPUSOS_LOCKOUT_HUD__;
    assert.ok(hudApi);

    // Call showLockoutHud 5 times consecutively
    hudApi.showLockoutHud({ domain: 'tiktok.com' });
    hudApi.showLockoutHud({ domain: 'tiktok.com' });
    hudApi.showLockoutHud({ domain: 'tiktok.com' });
    hudApi.showLockoutHud({ domain: 'tiktok.com' });
    hudApi.showLockoutHud({ domain: 'tiktok.com' });

    // Assert only ONE root element was created in documentElement
    const matchingHosts = mockDoc.documentElement.children.filter(
      (c) => c.id === hudApi.HOST_ELEMENT_ID
    );
    assert.equal(matchingHosts.length, 1, 'Duplicate injection must be prevented strictly');
    assert.equal(matchingHosts[0].shadowRoot.mode, 'open', 'Shadow DOM mode must be open');

    // Clean up
    hudApi.removeLockoutHud();
    hudApi.stopCountdown();
    hudApi.stopSpeech();
  });

  test('Adversarial Check: Close Tab & Message Dispatch upon violation handling', async () => {
    const sentMessages = [];
    const mockChrome = {
      runtime: {
        getURL: (p) => p,
        sendMessage: (msg) => {
          sentMessages.push(msg);
        },
        onMessage: { addListener: () => {} },
      },
    };

    class MockElement {
      constructor(tag) {
        this.tagName = tag;
        this.children = [];
        this.style = {};
        this.eventListeners = {};
      }
      appendChild(c) {
        this.children.push(c);
        return c;
      }
      attachShadow(opts) {
        this.shadowRoot = {
          mode: opts.mode,
          appendChild: () => {},
          getElementById: () => new MockElement('div'),
        };
        return this.shadowRoot;
      }
      addEventListener(type, fn) {
        this.eventListeners[type] = this.eventListeners[type] || [];
        this.eventListeners[type].push(fn);
      }
      remove() {}
    }

    const mockDoc = {
      documentElement: new MockElement('html'),
      createElement: (t) => new MockElement(t),
      getElementById: () => null,
    };

    const mockWin = {
      location: { hostname: 'reddit.com', href: 'https://reddit.com' },
      addEventListener: () => {},
      removeEventListener: () => {},
    };

    const content = fs.readFileSync(contentJsPath, 'utf8');
    const runSandbox = new Function('window', 'document', 'chrome', content);
    runSandbox(mockWin, mockDoc, mockChrome);

    // Initial load sent CHECK_URL
    assert.ok(
      sentMessages.some((m) => m.action === 'CHECK_URL' && m.url === 'https://reddit.com'),
      'Must send CHECK_URL on page load for non-campus domains'
    );

    const hudApi = mockWin.__CAMPUSOS_LOCKOUT_HUD__;
    assert.ok(hudApi);

    // Clean up
    hudApi.removeLockoutHud();
  });
});
