import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatBytes,
  inferFileType,
  STORAGE_BUCKET,
  type StoredFile,
} from '../src/lib/storage-engine.ts';

test('Storage Engine (1/4): formatBytes formats byte sizes accurately', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(-100), '0 B');
  assert.equal(formatBytes(500), '500 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(2500000), '2.4 MB');
  assert.equal(formatBytes(1073741824), '1 GB');
});

test('Storage Engine (2/4): inferFileType correctly classifies PDF, slide, doc, and image types', () => {
  assert.equal(inferFileType('BaiGiang_Tuan1.pdf'), 'pdf');
  assert.equal(inferFileType('document.PDF'), 'pdf');
  assert.equal(inferFileType('lecture.pptx'), 'slide');
  assert.equal(inferFileType('presentation.ppt'), 'slide');
  assert.equal(inferFileType('de_cuong.docx'), 'doc');
  assert.equal(inferFileType('de_cuong.doc'), 'doc');
  assert.equal(inferFileType('diagram.png'), 'image');
  assert.equal(inferFileType('screenshot.jpg'), 'image');
  assert.equal(inferFileType('source_code.zip'), 'other');
});

test('Storage Engine (3/4): STORAGE_BUCKET is configured as academic-vault', () => {
  assert.equal(STORAGE_BUCKET, 'academic-vault');
});

test('Storage Engine (4/4): StoredFile conforms to attachment specifications', () => {
  const sampleMaterial: StoredFile = {
    id: 'mat-test-1',
    name: 'GiaoTrinh_MangMayTinh.pdf',
    url: 'https://example.com/vault/GiaoTrinh.pdf',
    sizeBytes: 2500000,
    type: 'pdf',
    uploadedAt: new Date().toISOString(),
    isLocalFallback: false,
  };

  assert.equal(sampleMaterial.type, 'pdf');
  assert.equal(sampleMaterial.name, 'GiaoTrinh_MangMayTinh.pdf');
  assert.equal(sampleMaterial.sizeBytes, 2500000);
  assert.equal(sampleMaterial.isLocalFallback, false);
});
