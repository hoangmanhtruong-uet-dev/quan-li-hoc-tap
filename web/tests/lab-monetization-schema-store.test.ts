import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  TIER_CONFIGS,
  VIETQR_BANK_CONFIG,
  TIER_RANKS,
  formatTransferSyntax,
  generateVietQrUrl,
  getTierConfig,
  isTierSufficient,
  formatVnd,
  formatUsd,
  type LabTier,
} from '../src/lib/monetization-matrix.ts';
import {
  createDefaultSharedState,
  getSharedState,
  upgradeLabTier,
  setByokKeys,
  resetSharedState,
} from '../src/lib/campus-store.ts';
import { recordLabTransactionToSupabase } from '../src/lib/supabase-sync.ts';
import { sidebarSections } from '../src/config/nav.ts';
import type {
  ProfileRow,
  ProfileInsert,
  ProfileUpdate,
  LabTransactionRow,
  LabTransactionInsert,
  LabTransactionUpdate,
} from '../src/types/database.ts';

describe('Milestone 1 — 4-Tier Monetization Matrix, VietQR & Tier Gating Suite', () => {
  const rootDir = path.resolve(process.cwd(), '..');
  const migration008Path = path.join(rootDir, 'supabase', 'migrations', '008_campus_lab_vip_monetization.sql');

  // ---------------------------------------------------------------------------
  // 1. Database Schema & Migration Verification
  // ---------------------------------------------------------------------------
  describe('Database Schema: 008_campus_lab_vip_monetization.sql', () => {
    test('008 migration file exists and is comprehensive (>1.5KB)', () => {
      assert.ok(fs.existsSync(migration008Path), `Migration file must exist at ${migration008Path}`);
      const stat = fs.statSync(migration008Path);
      assert.ok(stat.size > 1500, `Migration file should be comprehensive (>1.5KB), got ${stat.size} bytes`);
    });

    const sql008 = fs.readFileSync(migration008Path, 'utf8');

    test('Alters public.profiles with is_lab_vip, tier, and byok_keys', () => {
      assert.ok(
        sql008.includes('ADD COLUMN IF NOT EXISTS is_lab_vip BOOLEAN NOT NULL DEFAULT false'),
        'Must add is_lab_vip column to profiles'
      );
      assert.ok(
        sql008.includes("ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'"),
        'Must add tier column to profiles'
      );
      assert.ok(
        sql008.includes("ADD COLUMN IF NOT EXISTS byok_keys JSONB NOT NULL DEFAULT '{}'::jsonb"),
        'Must add byok_keys column to profiles'
      );
      assert.ok(
        sql008.includes("CHECK (tier IN ('free', 'plus', 'pro', 'ultra'))"),
        'Must enforce tier CHECK constraint'
      );
    });

    test('Defines public.lab_transactions table with correct constraints and indexes', () => {
      assert.match(
        sql008,
        /CREATE TABLE IF NOT EXISTS public\.lab_transactions\s*\(/i,
        'Must create public.lab_transactions table'
      );
      assert.ok(sql008.includes("status TEXT NOT NULL DEFAULT 'pending'"));
      assert.ok(sql008.includes("payment_method TEXT NOT NULL DEFAULT 'vietqr'"));
      assert.ok(sql008.includes('idx_lab_transactions_user_id'));
      assert.ok(sql008.includes('idx_lab_transactions_status'));
      assert.ok(sql008.includes('idx_lab_transactions_tx_code'));
    });

    test('Configures cached InitPlan RLS subqueries (SELECT auth.uid()) and Realtime publication', () => {
      assert.ok(
        sql008.includes('user_id = (SELECT auth.uid())'),
        'RLS policies must use cached (SELECT auth.uid()) pattern per Supabase Postgres best practices'
      );
      assert.ok(
        sql008.includes('ALTER TABLE public.lab_transactions REPLICA IDENTITY FULL;'),
        'Must set full replica identity'
      );
      assert.ok(
        sql008.includes('ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_transactions;'),
        'Must safely add lab_transactions to supabase_realtime publication'
      );
    });
  });

  // ---------------------------------------------------------------------------
  // 2. TypeScript Types Verification
  // ---------------------------------------------------------------------------
  describe('TypeScript Database Contracts: database.ts', () => {
    test('Type check ProfileRow and LabTransactionRow contract compatibility', () => {
      const mockProfileRow: Partial<ProfileRow> = {
        id: 'user-001',
        is_lab_vip: true,
        tier: 'ultra',
        byok_keys: { gemini: 'ai-key-123' },
      };
      assert.equal(mockProfileRow.is_lab_vip, true);
      assert.equal(mockProfileRow.tier, 'ultra');

      const mockTxRow: Partial<LabTransactionRow> = {
        id: 'tx-001',
        user_id: 'user-001',
        tier: 'ultra',
        amount: 500000,
        currency: 'VND',
        status: 'completed',
        payment_method: 'dev_simulation',
      };
      assert.equal(mockTxRow.amount, 500000);
      assert.equal(mockTxRow.payment_method, 'dev_simulation');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Monetization Matrix Constants & VietQR Engine
  // ---------------------------------------------------------------------------
  describe('Monetization Matrix: monetization-matrix.ts', () => {
    test('All 4 tiers defined with exact pricing ($0, $2/50k, $7/175k, $20/500k)', () => {
      assert.equal(TIER_CONFIGS.free.priceVnd, 0);
      assert.equal(TIER_CONFIGS.free.priceUsd, 0);

      assert.equal(TIER_CONFIGS.plus.priceVnd, 50_000);
      assert.equal(TIER_CONFIGS.plus.priceUsd, 2);

      assert.equal(TIER_CONFIGS.pro.priceVnd, 175_000);
      assert.equal(TIER_CONFIGS.pro.priceUsd, 7);

      assert.equal(TIER_CONFIGS.ultra.priceVnd, 500_000);
      assert.equal(TIER_CONFIGS.ultra.priceUsd, 20);
    });

    test('Tier badge titles match specifications', () => {
      assert.equal(TIER_CONFIGS.free.badgeTitle, 'Free');
      assert.equal(TIER_CONFIGS.plus.badgeTitle, 'VIP Neo');
      assert.equal(TIER_CONFIGS.pro.badgeTitle, 'Pro Researcher');
      assert.equal(TIER_CONFIGS.ultra.badgeTitle, 'Ultra Scholar');
    });

    test('Progressive capability limits and quotas per tier', () => {
      // Free
      assert.equal(TIER_CONFIGS.free.limits.aiRequestsPerDay, 5);
      assert.equal(TIER_CONFIGS.free.limits.paperVaultLimit, 5);
      assert.equal(TIER_CONFIGS.free.limits.hasMultiAiPipeline, false);
      assert.equal(TIER_CONFIGS.free.limits.hasUltraDefense, false);

      // Plus
      assert.equal(TIER_CONFIGS.plus.limits.aiRequestsPerDay, 50);
      assert.equal(TIER_CONFIGS.plus.limits.paperVaultLimit, 50);
      assert.equal(TIER_CONFIGS.plus.limits.hasMultiAiPipeline, false);

      // Pro
      assert.equal(TIER_CONFIGS.pro.limits.aiRequestsPerDay, 200);
      assert.equal(TIER_CONFIGS.pro.limits.paperVaultLimit, 250);
      assert.equal(TIER_CONFIGS.pro.limits.hasMultiAiPipeline, true);
      assert.equal(TIER_CONFIGS.pro.limits.hasMcpHub, true);
      assert.equal(TIER_CONFIGS.pro.limits.hasUltraDefense, false);

      // Ultra
      assert.equal(TIER_CONFIGS.ultra.limits.aiRequestsPerDay, 1000);
      assert.equal(TIER_CONFIGS.ultra.limits.paperVaultLimit, 1000);
      assert.equal(TIER_CONFIGS.ultra.limits.hasMultiAiPipeline, true);
      assert.equal(TIER_CONFIGS.ultra.limits.hasUltraDefense, true);
      assert.equal(TIER_CONFIGS.ultra.limits.hasMcpHub, true);
    });

    test('formatTransferSyntax sanitizes input, strips special characters, uppercases', () => {
      assert.equal(formatTransferSyntax('student-123_abc!'), 'CAMPUSLAB STUDENT123ABC');
      assert.equal(formatTransferSyntax('8cbb56da-482a-44dd-917c'), 'CAMPUSLAB 8CBB56DA482A44DD');
      assert.equal(formatTransferSyntax(''), 'CAMPUSLAB STUDENT');
      assert.equal(formatTransferSyntax('   '), 'CAMPUSLAB STUDENT');
    });

    test('generateVietQrUrl produces valid Napas 247 QuickLink with MBBank BIN 970422 and account 0338866999', () => {
      const qrData = generateVietQrUrl({
        amount: 500_000,
        userId: 'student123',
        tier: 'ultra',
      });

      assert.equal(qrData.bin, '970422');
      assert.equal(qrData.bankAccount, '0338866999');
      assert.equal(qrData.accountName, 'CAMPUSOS LAB RESEARCH');
      assert.equal(qrData.amount, 500_000);
      assert.equal(qrData.syntax, 'CAMPUSLAB STUDENT123');
      assert.ok(qrData.qrUrl.startsWith('https://img.vietqr.io/image/970422-0338866999-compact2.png'));
      assert.ok(qrData.qrUrl.includes('amount=500000'));
      assert.ok(qrData.qrUrl.includes('addInfo=CAMPUSLAB%20STUDENT123'));
    });

    test('isTierSufficient ranks tier privileges hierarchically', () => {
      assert.equal(isTierSufficient('free', 'free'), true);
      assert.equal(isTierSufficient('free', 'plus'), false);
      assert.equal(isTierSufficient('plus', 'free'), true);
      assert.equal(isTierSufficient('plus', 'pro'), false);
      assert.equal(isTierSufficient('pro', 'plus'), true);
      assert.equal(isTierSufficient('pro', 'ultra'), false);
      assert.equal(isTierSufficient('ultra', 'ultra'), true);
      assert.equal(isTierSufficient('ultra', 'free'), true);
    });

    test('formatVnd and formatUsd formatting helpers', () => {
      assert.equal(formatUsd(20), '$20');
      assert.ok(formatVnd(500_000).includes('500.000'));
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Store State & Reactivity
  // ---------------------------------------------------------------------------
  describe('Campus Store Lab State & upgradeLabTier Action: campus-store.ts', () => {
    test('createDefaultSharedState defaults to Free tier with isLabVip: false', () => {
      const defaultState = createDefaultSharedState();
      assert.equal(defaultState.isLabVip, false);
      assert.equal(defaultState.tier, 'free');
      assert.deepEqual(defaultState.byokKeys, {});
    });

    test('upgradeLabTier correctly upgrades to plus and awards vip-neo badge', () => {
      resetSharedState();
      const result = upgradeLabTier('plus');
      assert.equal(result.isLabVip, true);
      assert.equal(result.tier, 'plus');
      assert.equal(result.badgeAwarded, 'vip-neo');

      const current = getSharedState();
      assert.equal(current.isLabVip, true);
      assert.equal(current.tier, 'plus');
      assert.ok(current.badges.includes('vip-neo'));
    });

    test('upgradeLabTier correctly upgrades to pro and awards pro-researcher badge', () => {
      resetSharedState();
      const result = upgradeLabTier('pro', { gemini: 'gemini-key-val' });
      assert.equal(result.isLabVip, true);
      assert.equal(result.tier, 'pro');
      assert.equal(result.badgeAwarded, 'pro-researcher');

      const current = getSharedState();
      assert.equal(current.isLabVip, true);
      assert.equal(current.tier, 'pro');
      assert.ok(current.badges.includes('pro-researcher'));
      assert.equal(current.byokKeys?.gemini, 'gemini-key-val');
    });

    test('upgradeLabTier correctly upgrades to ultra and awards ultra-scholar badge', () => {
      resetSharedState();
      const result = upgradeLabTier('ultra');
      assert.equal(result.isLabVip, true);
      assert.equal(result.tier, 'ultra');
      assert.equal(result.badgeAwarded, 'ultra-scholar');

      const current = getSharedState();
      assert.equal(current.isLabVip, true);
      assert.equal(current.tier, 'ultra');
      assert.ok(current.badges.includes('ultra-scholar'));
    });

    test('setByokKeys merges keys into shared store', () => {
      resetSharedState();
      setByokKeys({ anthropic: 'sk-ant-test' });
      let state = getSharedState();
      assert.equal(state.byokKeys?.anthropic, 'sk-ant-test');

      setByokKeys({ perplexity: 'pplx-test' });
      state = getSharedState();
      assert.equal(state.byokKeys?.anthropic, 'sk-ant-test');
      assert.equal(state.byokKeys?.perplexity, 'pplx-test');
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Supabase Sync Engine Integration
  // ---------------------------------------------------------------------------
  describe('Supabase Sync Engine: recordLabTransactionToSupabase', () => {
    test('recordLabTransactionToSupabase generates valid offline transaction payload', async () => {
      const res = await recordLabTransactionToSupabase({
        tier: 'ultra',
        amount: 500000,
        currency: 'VND',
        status: 'completed',
        payment_method: 'dev_simulation',
        metadata: { source: 'unit_test' },
      });

      assert.equal(res.success, true);
      assert.ok(res.data);
      assert.equal(res.data.tier, 'ultra');
      assert.equal(res.data.amount, 500000);
      assert.equal(res.data.payment_method, 'dev_simulation');
      assert.ok(res.data.transaction_code.startsWith('CAMPUSLAB_'));
      assert.ok(res.data.id);
    });
  });

  // ---------------------------------------------------------------------------
  // 6. Navigation Configuration
  // ---------------------------------------------------------------------------
  describe('Navigation: nav.ts', () => {
    test('nav.ts registers /lab under Học tập with VIP badge and flask-conical icon', () => {
      const studySection = sidebarSections.find((s) => s.label === 'Học tập');
      assert.ok(studySection, 'Học tập section must exist in sidebar');
      const labItem = studySection.items.find((i) => i.href === '/lab');
      assert.ok(labItem, 'Campus LAB (/lab) must be registered under Học tập');
      assert.equal(labItem.badge, 'VIP');
      assert.equal(labItem.icon, 'flask-conical');
      assert.equal(labItem.segment, 'lab');
    });
  });
});
