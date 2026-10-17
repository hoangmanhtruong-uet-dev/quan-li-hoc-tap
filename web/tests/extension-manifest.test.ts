import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const extensionDir = path.resolve(__dirname, '../../extension');
const manifestPath = path.join(extensionDir, 'manifest.json');

describe('Chrome Extension Manifest V3 Schema & Security Suite (extension-manifest.test.ts)', () => {
  test('Manifest file exists and is valid JSON', () => {
    assert.ok(fs.existsSync(manifestPath), `manifest.json must exist at ${manifestPath}`);
    const rawContent = fs.readFileSync(manifestPath, 'utf8');
    assert.ok(rawContent.trim().length > 0, 'manifest.json must not be empty');
    assert.doesNotThrow(() => JSON.parse(rawContent), 'manifest.json must be valid JSON');
  });

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  test('Core Metadata: Complies with Manifest V3 and naming standard', () => {
    assert.equal(manifest.manifest_version, 3, 'Must specify manifest_version: 3');
    assert.ok(typeof manifest.name === 'string' && manifest.name.length > 0, 'name must be a non-empty string');
    assert.match(manifest.name, /CampusOS/i, 'name must contain CampusOS branding');
    assert.match(manifest.name, /Giám Sát|Supervisor/i, 'name must indicate supervisor function');
    assert.ok(typeof manifest.version === 'string', 'version must be a string');
    assert.match(manifest.version, /^\d+\.\d+\.\d+$/, 'version must follow semver format (X.Y.Z)');
    assert.ok(typeof manifest.description === 'string' && manifest.description.length > 10, 'description must be descriptive');
  });

  test('Permissions: All 5 required MV3 permissions are declared', () => {
    const requiredPermissions = ['tabs', 'storage', 'activeTab', 'scripting', 'declarativeNetRequest'];
    assert.ok(Array.isArray(manifest.permissions), 'permissions must be an array');

    for (const perm of requiredPermissions) {
      assert.ok(
        manifest.permissions.includes(perm),
        `Required permission "${perm}" must be present in permissions`
      );
    }

    // Security check: No dangerous or prohibited permissions
    const prohibitedPermissions = ['debugger', 'webRequestBlocking', 'management', 'proxy'];
    for (const prohibited of prohibitedPermissions) {
      assert.ok(
        !manifest.permissions.includes(prohibited),
        `Prohibited permission "${prohibited}" must NOT be requested`
      );
    }
  });

  test('Host Permissions: Contains broad URL matching for tab inspection', () => {
    assert.ok(Array.isArray(manifest.host_permissions), 'host_permissions must be an array');
    assert.ok(
      manifest.host_permissions.includes('<all_urls>') || manifest.host_permissions.includes('*://*/*'),
      'host_permissions must cover web URLs for distraction tab detection'
    );
  });

  test('externally_connectable: Allows two-way bridge with CampusOS origins only', () => {
    assert.ok(manifest.externally_connectable, 'externally_connectable must be defined');
    const matches = manifest.externally_connectable.matches;
    assert.ok(Array.isArray(matches), 'externally_connectable.matches must be an array');

    // Local dev origins
    assert.ok(
      matches.includes('http://localhost:3000/*'),
      'Must allow localhost:3000 for local development'
    );
    assert.ok(
      matches.includes('http://127.0.0.1:3000/*'),
      'Must allow 127.0.0.1:3000 for local development'
    );

    // Production origins
    const hasProdMatches = matches.some((m: string) => m.includes('campusos.vn'));
    assert.ok(hasProdMatches, 'Must allow campusos.vn domain in production');

    // Security check: Must NOT allow wildcard <all_urls> or *://*/* in externally_connectable
    assert.ok(
      !matches.includes('<all_urls>'),
      'externally_connectable must NOT permit <all_urls> wildcard'
    );
    assert.ok(
      !matches.includes('*://*/*'),
      'externally_connectable must NOT permit *://*/* wildcard'
    );
  });

  test('Background Service Worker: Configured as ES module and file exists', () => {
    assert.ok(manifest.background, 'background must be defined');
    assert.equal(manifest.background.service_worker, 'background.js', 'service_worker must be "background.js"');
    assert.equal(manifest.background.type, 'module', 'background worker must be type "module"');

    const workerPath = path.join(extensionDir, manifest.background.service_worker);
    assert.ok(fs.existsSync(workerPath), `Background worker file must exist at ${workerPath}`);
    const stat = fs.statSync(workerPath);
    assert.ok(stat.size > 500, `Background worker should have substantial implementation (>500 bytes), got ${stat.size}`);
  });

  test('Action Popup: Configured with popup.html and descriptive title', () => {
    assert.ok(manifest.action, 'action must be defined');
    assert.equal(manifest.action.default_popup, 'popup/popup.html', 'default_popup must point to "popup/popup.html"');
    assert.ok(typeof manifest.action.default_title === 'string', 'default_title must be defined');
    assert.ok(manifest.action.default_icon, 'default_icon must be defined');
    assert.ok(manifest.action.default_icon['16'], 'default_icon 16 must be defined');
    assert.ok(manifest.action.default_icon['48'], 'default_icon 48 must be defined');
    assert.ok(manifest.action.default_icon['128'], 'default_icon 128 must be defined');
  });

  test('Content Scripts: Injects content.js at document_end across pages', () => {
    assert.ok(Array.isArray(manifest.content_scripts), 'content_scripts must be an array');
    assert.ok(manifest.content_scripts.length >= 1, 'At least 1 content script configuration required');

    const mainScript = manifest.content_scripts[0];
    assert.ok(mainScript.matches.includes('<all_urls>'), 'Content script must match <all_urls>');
    assert.ok(mainScript.js.includes('content.js'), 'Content script must include "content.js"');
    assert.equal(mainScript.run_at, 'document_end', 'Content script must run at document_end');

    const contentJsPath = path.join(extensionDir, 'content.js');
    assert.ok(fs.existsSync(contentJsPath), `content.js must exist at ${contentJsPath}`);
  });

  test('Icons: All standard resolution icons are declared and physically exist', () => {
    assert.ok(manifest.icons, 'icons must be defined');
    const requiredSizes = ['16', '48', '128'];

    for (const size of requiredSizes) {
      const iconRelPath = manifest.icons[size];
      assert.ok(iconRelPath, `Icon size ${size} must be defined`);
      const iconFullPath = path.join(extensionDir, iconRelPath);
      assert.ok(fs.existsSync(iconFullPath), `Icon file for size ${size} must exist at ${iconFullPath}`);
    }
  });

  test('Web Accessible Resources: Exposes assets safely to all pages', () => {
    assert.ok(Array.isArray(manifest.web_accessible_resources), 'web_accessible_resources must be an array');
    assert.ok(manifest.web_accessible_resources.length >= 1, 'Must have at least 1 resource entry');

    const assetEntry = manifest.web_accessible_resources.find((entry: any) =>
      entry.resources.some((r: string) => r.includes('fat-orange-cat.png') || r.includes('assets/'))
    );
    assert.ok(assetEntry, 'Must expose mascot cat asset in web_accessible_resources');
    assert.ok(assetEntry.matches.includes('<all_urls>'), 'Resource matches must include <all_urls>');
  });

  test('MV3 Compliance & Anti-Deprecation Audit: No obsolete MV2 keys present', () => {
    assert.equal(manifest.browser_action, undefined, 'MV2 browser_action must not exist');
    assert.equal(manifest.page_action, undefined, 'MV2 page_action must not exist');
    assert.equal(manifest.background.scripts, undefined, 'MV2 background.scripts array must not exist');
    assert.notEqual(manifest.manifest_version, 2, 'Must not be Manifest V2');

    // CSP eval check
    if (manifest.content_security_policy) {
      const csp = typeof manifest.content_security_policy === 'string'
        ? manifest.content_security_policy
        : JSON.stringify(manifest.content_security_policy);
      assert.ok(!csp.includes("'unsafe-eval'"), "CSP must not include 'unsafe-eval'");
    }
  });
});
