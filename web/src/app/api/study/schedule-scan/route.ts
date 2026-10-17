import { NextRequest, NextResponse } from 'next/server.js';
import {
  scanScheduleImage,
  getSampleScheduleCourses,
  type ScheduleScanResponse,
} from '../../../../lib/schedule-ocr-engine.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const contentType = req.headers.get('content-type') || '';
    let imageBase64: string | null = null;
    let mimeType: string = 'image/jpeg';
    let customApiKey: string | undefined = undefined;
    let useSample = false;

    // Header API key override
    const headerApiKey = req.headers.get('x-gemini-api-key') || undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      useSample = formData.get('useSample') === 'true' || formData.get('sample') === 'true';
      customApiKey =
        (formData.get('customApiKey') as string) ||
        (formData.get('apiKey') as string) ||
        headerApiKey;

      const fileField = formData.get('file') || formData.get('image');
      if (fileField && typeof fileField === 'object' && 'arrayBuffer' in fileField) {
        const file = fileField as File;
        const arrayBuffer = await file.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString('base64');
        if (file.type) {
          mimeType = file.type;
        }
      } else if (typeof fileField === 'string' && fileField.trim().length > 0) {
        imageBase64 = fileField.trim();
      }
    } else {
      // JSON payload
      const body = await req.json().catch(() => ({}));
      useSample = Boolean(body.useSample || body.sample);
      customApiKey = body.customApiKey || body.apiKey || headerApiKey;
      if (body.image && typeof body.image === 'string') {
        imageBase64 = body.image.trim();
        if (body.mimeType) {
          mimeType = String(body.mimeType);
        }
      }
    }

    // Fast-path: 1-click sample timetable preview
    if (useSample) {
      // Small simulated latency (300ms) for UI laser scanner satisfaction (< 1.5s target)
      await new Promise((resolve) => setTimeout(resolve, 300));
      const courses = getSampleScheduleCourses();
      return NextResponse.json<ScheduleScanResponse>({
        success: true,
        source: 'sample',
        courses,
        totalExtracted: courses.length,
        metadata: {
          university: 'Trường Đại học Công nghệ Thông tin - ĐHQG TP.HCM (TKB Mẫu)',
          semester: 'Học kỳ 1',
          academicYear: '2024-2025',
        },
        processingTimeMs: Date.now() - startTime,
      });
    }

    // Validation: Image payload must be present when not using sample
    if (!imageBase64 || imageBase64.length === 0) {
      return NextResponse.json<ScheduleScanResponse>(
        {
          success: false,
          source: 'fallback',
          courses: [],
          totalExtracted: 0,
          error: 'Vui lòng tải lên ảnh thời khóa biểu hợp lệ (PNG, JPG, WEBP) hoặc chọn TKB mẫu.',
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // Call OCR engine (handles Gemini REST + automatic fallback)
    const result = await scanScheduleImage(imageBase64, {
      customApiKey,
      mimeType,
      timeoutMs: 20000,
    });

    return NextResponse.json<ScheduleScanResponse>({
      ...result,
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('[API /api/study/schedule-scan] Unhandled error:', error);
    // Even in case of unhandled error, provide resilient response with fallback
    const courses = getSampleScheduleCourses();
    return NextResponse.json<ScheduleScanResponse>(
      {
        success: true,
        source: 'fallback',
        courses,
        totalExtracted: courses.length,
        metadata: {
          university: 'Đại học Quốc gia (Mẫu dự phòng khẩn cấp)',
          semester: 'Học kỳ 1',
        },
        error: error?.message || 'Có lỗi xảy ra khi xử lý ảnh, hệ thống kích hoạt dữ liệu mẫu.',
        processingTimeMs: Date.now() - startTime,
      },
      { status: 200 }
    );
  }
}
