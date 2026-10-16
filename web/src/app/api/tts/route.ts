import { NextRequest, NextResponse } from 'next/server';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import https from 'node:https';

export type VoiceTone = 'sarcastic' | 'angry' | 'praise' | 'normal';
export type VoiceGender = 'female' | 'male';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Fetch speech audio from Google Vietnamese TTS for a single snippet (max ~180 chars)
 */
function fetchSingleGoogleChunk(text: string): Promise<Buffer> {
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=vi&client=tw-ob`;
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`Google TTS status code: ${res.statusCode}`));
            return;
          }
          const chunks: Buffer[] = [];
          res.on('data', (c: Buffer) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
          res.on('error', reject);
        }
      )
      .on('error', reject);
  });
}

/**
 * Split text at word boundaries and synthesize audio via Google TTS
 */
async function fetchGoogleTts(fullText: string): Promise<Buffer> {
  const words = fullText.split(/\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const w of words) {
    if ((current + ' ' + w).length > 150) {
      if (current.trim()) chunks.push(current.trim());
      current = w;
    } else {
      current = current ? `${current} ${w}` : w;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  if (chunks.length === 0) {
    return Buffer.alloc(0);
  }

  // Fetch all chunks in order
  const buffers: Buffer[] = [];
  for (const chunk of chunks) {
    const buf = await fetchSingleGoogleChunk(chunk);
    buffers.push(buf);
  }

  return Buffer.concat(buffers);
}

/**
 * Synthesize speech with Edge TTS, with a fallback to Google TTS if blocked or failed
 */
async function synthesizeWithEdgeTts(text: string, gender: VoiceGender): Promise<Buffer> {
  const voiceName = gender === 'male' ? 'vi-VN-NamMinhNeural' : 'vi-VN-HoaiMyNeural';
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  const { audioStream } = tts.toStream(text);
  const chunks: Buffer[] = [];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Edge TTS timeout'));
    }, 4000);

    audioStream.on('data', (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    });
    audioStream.on('end', () => {
      clearTimeout(timeout);
      resolve(Buffer.concat(chunks));
    });
    audioStream.on('error', (err: Error) => {
      clearTimeout(timeout);
      if (chunks.length > 0) {
        resolve(Buffer.concat(chunks));
      } else {
        reject(err);
      }
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = String(body.text || '').trim();
    const gender: VoiceGender = body.gender === 'male' ? 'male' : 'female';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    let audioBuffer: Buffer | null = null;

    // 1. Try Microsoft Edge Neural TTS first
    try {
      audioBuffer = await synthesizeWithEdgeTts(text, gender);
    } catch (edgeErr) {
      console.warn('[TTS] Edge TTS unviable (e.g. 403), falling back to Google Neural TTS:', edgeErr);
    }

    // 2. Fallback to Google Vietnamese TTS if Edge TTS failed or was blocked
    if (!audioBuffer || audioBuffer.length === 0) {
      audioBuffer = await fetchGoogleTts(text);
    }

    if (!audioBuffer || audioBuffer.length === 0) {
      return NextResponse.json({ error: 'Failed to synthesize speech audio' }, { status: 500 });
    }

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('[TTS] Synthesis error:', error);
    return NextResponse.json(
      { error: 'Failed to synthesize speech' },
      { status: 500 }
    );
  }
}
