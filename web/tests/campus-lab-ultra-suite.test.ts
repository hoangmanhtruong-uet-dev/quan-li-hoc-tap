import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  orchestrateResearchPipeline, 
  MOCK_RESEARCH_PAPERS 
} from '../src/lib/multi-ai-orchestrator.ts';
import { 
  generateMockDefenseQuestions, 
  generateSlideDeck, 
  scanTurnitinSimilarity 
} from '../src/lib/ultra-defense-suite.ts';
import { DEFAULT_MCP_SERVERS } from '../src/lib/mcp-client-engine.ts';

test('Task 3: Campus LAB Multi-AI & Ultra Defense Suite Contracts', async (t) => {
  await t.test('Multi-AI Orchestrator Pipeline', async () => {
    const result = await orchestrateResearchPipeline({
      topic: 'Nghiên cứu ứng dụng Multi-AI trong học tập',
      field: 'Công nghệ thông tin',
    });

    assert.ok(result.papers.length >= 3, 'Returns at least 3 research papers');
    assert.ok(result.draftMarkdown.includes('ĐẶT VẤN ĐỀ'), 'Draft contains academic introduction');
    assert.ok(result.bibtexBundle.includes('@article'), 'Contains BibTeX citation bundle');
    assert.ok(result.keyFindings.length >= 3, 'Contains key research findings');
  });

  await t.test('AI Mock Defense Panel Questions & Evaluation', () => {
    const questions = generateMockDefenseQuestions('Hệ thống quản lý học tập CampusOS');
    assert.strictEqual(questions.length, 5, 'Generates 5 tailored defense questions');
    assert.ok(questions[0].modelAnswer.length > 20, 'Each question has a detailed 10-point model answer');
    assert.ok(['practical', 'methodology', 'technical'].includes(questions[0].category));
  });

  await t.test('1-Click Slide Deck Generator Structure', () => {
    const deck = generateSlideDeck('Đồ án tốt nghiệp');
    assert.strictEqual(deck.slides.length, 6, 'Generates 6 comprehensive presentation slides');
    assert.ok(deck.slides[0].bulletPoints.length > 0, 'First slide has presenter points');
    assert.ok(deck.slides[0].speakerNotes.length > 0, 'Includes speaker notes for presentation');
  });

  await t.test('Turnitin-Safe Pre-checker & Paraphraser', () => {
    const scan = scanTurnitinSimilarity('Hệ thống học tập');
    assert.ok(scan.similarityScore < 10, 'Similarity score is in the safe zone (< 10%)');
    assert.strictEqual(scan.isSafe, true, 'isSafe flag is true');
    assert.ok(scan.flaggedSegments.length > 0, 'Contains flagged segments');
    assert.ok(scan.flaggedSegments[0].paraphrasedText.length > 0, 'Provides academic paraphrased text');
  });

  await t.test('MCP Expansion Hub Configuration', () => {
    assert.ok(DEFAULT_MCP_SERVERS.length >= 3, 'Has at least 3 preconfigured MCP servers');
    assert.ok(DEFAULT_MCP_SERVERS.some(s => s.type === 'zotero'), 'Includes Zotero MCP');
    assert.ok(DEFAULT_MCP_SERVERS.some(s => s.type === 'arxiv'), 'Includes ArXiv MCP');
  });
});
