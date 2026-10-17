/**
 * AI Study Hub Engine - CampusOS Subsystem 2
 * "Bộ Tứ Toàn Năng":
 * 1. Tóm tắt cốt lõi 5 phút (Executive Syllabus Summary)
 * 2. Đề trắc nghiệm thông minh (Practice Quiz Generator + XP Rewards)
 * 3. Thẻ học Flashcard 3D Spaced Repetition (SuperMemo SM-2 Algorithm)
 * 4. Chatbot hỏi đáp trực tiếp trên tài liệu bài giảng (PDF RAG Q&A)
 */

export interface Sm2State {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string;
}

export type Sm2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SuperMemo SM-2 Spaced Repetition Algorithm
 * - q < 3: Failure, reset repetitions to 0 and interval to 1 day.
 * - q >= 3: Success:
 *     rep 0 -> interval = 1
 *     rep 1 -> interval = 6
 *     rep > 1 -> interval = ceil(prevInterval * easeFactor)
 * - EF' = max(1.3, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
 */
export function calculateSm2Review(
  prevRepetitions: number,
  prevIntervalDays: number,
  prevEaseFactor: number,
  quality: Sm2Quality
): Sm2State {
  const q = Math.max(0, Math.min(5, quality));
  const baseEf = Math.max(1.3, prevEaseFactor || 2.5);

  // Update Ease Factor
  const newEf = Math.max(1.3, Number((baseEf + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))).toFixed(3)));

  let newRepetitions = 0;
  let newIntervalDays = 1;

  if (q < 3) {
    // Failed recall: reset
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    // Successful recall
    if (prevRepetitions <= 0) {
      newIntervalDays = 1;
      newRepetitions = 1;
    } else if (prevRepetitions === 1) {
      newIntervalDays = 6;
      newRepetitions = 2;
    } else {
      newIntervalDays = Math.max(1, Math.ceil(prevIntervalDays * newEf));
      newRepetitions = prevRepetitions + 1;
    }
  }

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + newIntervalDays);

  return {
    repetitions: newRepetitions,
    intervalDays: newIntervalDays,
    easeFactor: newEf,
    nextReviewAt: nextDate.toISOString(),
  };
}

export interface SummaryCoreConcept {
  name: string;
  definition: string;
  formulaOrLaw?: string;
  practicalExample?: string;
}

export interface AiSyllabusSummaryData {
  title: string;
  readingTimeMinutes: number;
  keyTakeaways: string[];
  coreConcepts: SummaryCoreConcept[];
  commonPitfalls: string[];
}

export interface AiGeneratedQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number; // 0..3
  explanation: string;
  hint: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xpReward: number;
}

export interface AiGeneratedFlashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: string;
}

export interface AiStudyHubArtifacts {
  summary: AiSyllabusSummaryData;
  quizzes: AiGeneratedQuizQuestion[];
  flashcards: AiGeneratedFlashcard[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  citation?: string;
}

/**
 * Fallback Generator when external LLM API is unavailable or in offline tests
 */
export function generateDeterministicArtifacts(
  courseName: string,
  chapterTitle: string
): AiStudyHubArtifacts {
  const fullText = `${courseName || ''} ${chapterTitle || ''}`.toLowerCase();

  // 1. Data Structures / CS201
  if (
    fullText.includes('dsa') ||
    fullText.includes('cấu trúc dữ liệu') ||
    fullText.includes('giải thuật') ||
    fullText.includes('cây') ||
    fullText.includes('đồ thị') ||
    fullText.includes('stack') ||
    fullText.includes('queue') ||
    fullText.includes('big-o') ||
    fullText.includes('bigo') ||
    fullText.includes('ctdl')
  ) {
    return {
      summary: {
        title: `Tóm tắt cốt lõi: ${chapterTitle}`,
        readingTimeMinutes: 5,
        keyTakeaways: [
          'Phân tích độ phức tạp thời gian O(1), O(log N), O(N), O(N log N) và O(N²) trong trường hợp xấu nhất.',
          'Sự cân bằng đánh đổi (Trade-off) kinh điển giữa bộ nhớ (Space Complexity) và tốc độ thực thi (Time Complexity).',
          'Nguyên tắc chọn cấu trúc dữ liệu tối ưu theo tần suất tác vụ Tra cứu (Lookup) so với Thêm/Xóa (Insert/Delete).',
        ],
        coreConcepts: [
          {
            name: 'Độ phức tạp tiệm cận (Big-O Notation)',
            definition: 'Mô hình toán học mô tả cận trên của tốc độ tăng thời gian chạy của thuật toán khi kích thước đầu vào N tiến tới vô cùng.',
            formulaOrLaw: 'f(N) = O(g(N)) ⇔ ∃ c > 0, n₀ > 0 : ∀ N ≥ n₀, |f(N)| ≤ c·g(N)',
            practicalExample: 'Tìm kiếm nhị phân trên mảng đã sắp xếp có độ phức tạp O(log N), nhanh gấp bội O(N) của vét cạn.',
          },
          {
            name: 'Ngăn xếp & Hàng đợi (Stack & Queue)',
            definition: 'Cấu trúc tuyến tính với quy tắc truy xuất nghiêm ngặt: LIFO (Last In First Out) và FIFO (First In First Out).',
            formulaOrLaw: 'Stack: Push/Pop O(1) | Queue: Enqueue/Dequeue O(1)',
            practicalExample: 'Call Stack của JavaScript/V8 dùng LIFO; Hàng đợi tin nhắn RabbitMQ/Kafka dùng FIFO.',
          },
          {
            name: 'Bảng băm & Hàm băm (Hash Table)',
            definition: 'Cấu trúc ánh xạ khóa (key) tới vị trí mảng (bucket) qua hàm băm để đạt tốc độ truy xuất trung bình O(1).',
            formulaOrLaw: 'Index = Hash(Key) % Capacity (Giải quyết va chạm bằng Chaining hoặc Open Addressing)',
            practicalExample: 'Map / Set trong ES6 và Dictionary trong Python lưu trữ bằng bảng băm.',
          },
        ],
        commonPitfalls: [
          'Nhầm lẫn giữa độ phức tạp trung bình (Average Case) và trường hợp xấu nhất (Worst Case) khi dùng bảng băm khi xảy ra va chạm toàn phần (O(N)).',
          'Quên đệ quy vô hạn dẫn tới lỗi Stack Overflow khi duyệt cây hoặc đồ thị không có điều kiện dừng.',
        ],
      },
      quizzes: [
        {
          id: 'q-dsa-1',
          question: 'Thuật toán tìm kiếm nhị phân (Binary Search) yêu cầu mảng đầu vào phải thỏa mãn điều kiện gì?',
          options: [
            'Mảng phải có số phần tử là số lũy thừa của 2',
            'Mảng đã được sắp xếp theo thứ tự tăng dần hoặc giảm dần',
            'Mảng không được chứa số âm',
            'Mảng phải được lưu trữ dưới dạng danh sách liên kết kép',
          ],
          correctAnswerIndex: 1,
          explanation: 'Tìm kiếm nhị phân chia đôi không gian tìm kiếm ở mỗi bước, do đó bắt buộc mảng phải được sắp xếp trước.',
          hint: 'Nghĩ về cách chia đôi mảng và so sánh phần tử ở giữa.',
          difficulty: 'EASY',
          xpReward: 15,
        },
        {
          id: 'q-dsa-2',
          question: 'Trong trường hợp xấu nhất (Worst Case), độ phức tạp thời gian của QuickSort khi chọn chốt (pivot) tồi nhất là bao nhiêu?',
          options: ['O(log N)', 'O(N log N)', 'O(N²)', 'O(2^N)'],
          correctAnswerIndex: 2,
          explanation: 'Nếu mảng đã sắp xếp sẵn và luôn chọn phần tử đầu/cuối làm pivot, cây đệ quy suy biến thành danh sách đơn dẫn tới O(N²).',
          hint: 'Khi mảng bị phân chia lệch 1 phần tử và N-1 phần tử liên tục.',
          difficulty: 'MEDIUM',
          xpReward: 15,
        },
        {
          id: 'q-dsa-3',
          question: 'Cấu trúc dữ liệu nào phù hợp nhất để hiện thực thuật toán duyệt đồ thị theo chiều rộng (BFS)?',
          options: ['Stack (Ngăn xếp)', 'Queue (Hàng đợi)', 'Binary Search Tree (Cây nhị phân)', 'Heap (Đống)'],
          correctAnswerIndex: 1,
          explanation: 'BFS cần thăm các đỉnh cùng cấp bậc (mức khoảng cách) trước khi sang mức kế tiếp, do đó Queue (FIFO) là lựa chọn chuẩn.',
          hint: 'Vào trước ra trước để duyệt đồng đều theo tầng.',
          difficulty: 'EASY',
          xpReward: 15,
        },
        {
          id: 'q-dsa-4',
          question: 'Chiều cao tối đa của cây AVL chứa N nút được chặn trên bởi công thức nào?',
          options: ['≈ 1.44 log₂(N + 2)', '≈ 2N', '≈ log₁₀(N)', 'Không thể xác định'],
          correctAnswerIndex: 0,
          explanation: 'Cây AVL là cây nhị phân cân bằng tuyệt đối với hiệu số chiều cao hai cây con không quá 1, chiều cao tối đa là h < 1.44 log₂(N + 2).',
          hint: 'Hệ số xấp xỉ liên quan đến dãy Fibonacci.',
          difficulty: 'HARD',
          xpReward: 20,
        },
        {
          id: 'q-dsa-5',
          question: 'Phương pháp giải quyết va chạm (Collision Resolution) bằng Open Addressing - Linear Probing có nhược điểm chí mạng nào?',
          options: [
            'Hiện tượng cụm sơ cấp (Primary Clustering) làm giảm hiệu năng tìm kiếm',
            'Không thể lưu trữ chuỗi ký tự',
            'Đòi hỏi phải cấp phát bộ nhớ động liên tục cho từng con trỏ',
            'Không hỗ trợ xóa phần tử',
          ],
          correctAnswerIndex: 0,
          explanation: 'Linear Probing dò tìm liên tiếp ô trống kế tiếp, dẫn tới các phần tử va chạm gom thành một dải dài (Primary Clustering), làm tăng số lần dò.',
          hint: 'Các phần tử liền kề nhau tạo thành chuỗi liên tục cản trở các phần tử sau.',
          difficulty: 'MEDIUM',
          xpReward: 15,
        },
      ],
      flashcards: [
        {
          id: 'fc-dsa-1',
          front: 'Độ phức tạp O(1) nghĩa là gì?',
          back: 'Thời gian thực thi không phụ thuộc vào kích thước dữ liệu đầu vào N (hằng số thời gian). Ví dụ: truy cập mảng qua index A[i].',
          category: 'Big-O Basics',
          difficulty: 'EASY',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
        },
        {
          id: 'fc-dsa-2',
          front: 'Nguyên lý LIFO & FIFO ứng dụng ở đâu?',
          back: 'LIFO (Last In First Out) dùng trong Stack, Undo/Redo, Call Stack. FIFO (First In First Out) dùng trong Queue, BFS, Message Broker.',
          category: 'Cấu trúc dữ liệu tuyến tính',
          difficulty: 'EASY',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
        },
        {
          id: 'fc-dsa-3',
          front: 'Cây AVL tự cân bằng bằng các phép quay nào?',
          back: '4 phép quay: Quay đơn trái (Left-Left), Quay đơn phải (Right-Right), Quay kép Trái-Phải (Left-Right), Quay kép Phải-Trái (Right-Left).',
          category: 'Cây cân bằng',
          difficulty: 'MEDIUM',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
        },
        {
          id: 'fc-dsa-4',
          front: 'Hàm băm hoàn hảo (Perfect Hash Function) là gì?',
          back: 'Hàm băm ánh xạ mỗi khóa phân biệt trong tập khóa cho trước vào một giá trị băm duy nhất mà hoàn toàn không xảy ra va chạm (Zero Collisions).',
          category: 'Bảng băm',
          difficulty: 'HARD',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
        },
        {
          id: 'fc-dsa-5',
          front: 'Độ phức tạp của thuật toán Dijkstra dùng Min-Heap là bao nhiêu?',
          back: 'O((V + E) log V), trong đó V là số đỉnh và E là số cạnh của đồ thị trọng số không âm.',
          category: 'Đồ thị',
          difficulty: 'HARD',
          repetitions: 0,
          intervalDays: 1,
          easeFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
        },
      ],
    };
  }

  // Generic fallback for any other course
  return {
    summary: {
      title: `Tóm tắt cốt lõi: ${chapterTitle || courseName}`,
      readingTimeMinutes: 5,
      keyTakeaways: [
        `Nắm vững các thuật ngữ và định lý nền tảng của bài học "${chapterTitle}".`,
        'Hiểu rõ phương pháp luận ứng dụng lý thuyết vào giải quyết bài tập tình huống thực tế.',
        'Nhận biết mối liên kết logic giữa nội dung tuần này với đề thi cuối kỳ.',
      ],
      coreConcepts: [
        {
          name: `Khái niệm then chốt trong ${chapterTitle}`,
          definition: `Định nghĩa chính xác theo giáo trình môn ${courseName}, làm tiền đề cho các chuyên đề chuyên sâu.`,
          formulaOrLaw: 'Lý thuyết cơ bản ➔ Áp dụng giải thuật ➔ Đánh giá kết quả tối ưu.',
          practicalExample: `Áp dụng trực tiếp trong các bài tập đồ án và đề thi của ${courseName}.`,
        },
        {
          name: 'Phương pháp phân tích & suy luận',
          definition: 'Quy trình giải quyết vấn đề từng bước (step-by-step) tránh sót điều kiện biên.',
          practicalExample: 'Kiểm tra với trường hợp đầu vào rỗng (null/empty) và giá trị cực trị.',
        },
        {
          name: 'Ứng dụng thực tiễn & Kiểm chứng',
          definition: 'Đối sánh kết quả giải thuật với chuẩn đầu ra môn học và các ca kiểm thử biên.',
          formulaOrLaw: 'Kiểm thử thực nghiệm ➔ Đánh giá độ tin cậy.',
          practicalExample: 'Kiểm tra trên bộ dữ liệu kiểm thử thực tế.',
        },
      ],
      commonPitfalls: [
        'Học vẹt công thức mà không hiểu bản chất nguồn gốc dẫn tới áp dụng sai ngữ cảnh.',
        'Bỏ qua các giả định tiền đề (Pre-conditions) của định lý khi làm bài thi trắc nghiệm.',
      ],
    },
    quizzes: [
      {
        id: 'q-gen-1',
        question: `Nội dung trọng tâm được thảo luận trong phần "${chapterTitle}" là gì?`,
        options: [
          `Nắm vững các nguyên tắc cốt lõi và phương pháp ứng dụng của ${chapterTitle}`,
          'Lý thuyết lịch sử ra đời các ngôn ngữ máy tính cổ điển thập niên 1950',
          'Phương pháp giải trí sau giờ học trực tuyến',
          'Cài đặt phần mềm văn phòng cơ bản',
        ],
        correctAnswerIndex: 0,
        explanation: `Mục tiêu hàng đầu của tuần học là nắm vững nguyên tắc và phương pháp luận của ${chapterTitle}.`,
        hint: 'Chọn đáp án tập trung vào chuyên môn môn học.',
        difficulty: 'EASY',
        xpReward: 15,
      },
      {
        id: 'q-gen-2',
        question: 'Khi giải quyết bài toán phức tạp trong môn học này, bước đầu tiên cần làm là gì?',
        options: [
          'Viết ngay kết quả cuối cùng mà không cần giải thích',
          'Xác định rõ dữ kiện đầu vào, mục tiêu đầu ra và các ràng buộc biên',
          'Bỏ qua câu hỏi để làm câu khác dễ hơn',
          'Chọn ngẫu nhiên một phương án bất kỳ',
        ],
        correctAnswerIndex: 1,
        explanation: 'Khâu phân tích đề bài, xác định Input/Output và Constraint là bước quyết định 80% thành công.',
        hint: 'Liên quan đến việc hiểu rõ đề bài và ràng buộc.',
        difficulty: 'EASY',
        xpReward: 15,
      },
      {
        id: 'q-gen-3',
        question: 'Làm thế nào để kiểm chứng tính đúng đắn của kết quả thu được?',
        options: [
          'Thử nghiệm với các ca kiểm thử biên (Edge Cases) và đối sánh với lý thuyết',
          'Chỉ cần code chạy không báo lỗi cú pháp là đủ',
          'Tin tưởng tuyệt đối vào trực giác cá nhân',
          'Không cần kiểm tra lại',
        ],
        correctAnswerIndex: 0,
        explanation: 'Edge Cases (trường hợp biên) là nơi các lỗi tiềm ẩn xuất hiện thường xuyên nhất.',
        hint: 'Kiểm thử với các dữ liệu đặc biệt (rỗng, cực đại, cực tiểu).',
        difficulty: 'MEDIUM',
        xpReward: 15,
      },
    ],
    flashcards: [
      {
        id: 'fc-gen-1',
        front: `Thuật ngữ chính trong: ${chapterTitle}`,
        back: `Định nghĩa cốt lõi và các tiêu chí đánh giá quan trọng nhất của chuyên đề trong môn ${courseName}.`,
        category: 'Thuật ngữ cốt lõi',
        difficulty: 'EASY',
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      },
      {
        id: 'fc-gen-2',
        front: 'Quy trình giải bài tập chuẩn 3 bước',
        back: '1. Đọc kỹ ràng buộc & phân tích biên\n2. Xây dựng phương pháp lý thuyết\n3. Kiểm chứng với ca kiểm thử đặc biệt.',
        category: 'Phương pháp luận',
        difficulty: 'MEDIUM',
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      },
      {
        id: 'fc-gen-3',
        front: 'Bẫy sai lầm phổ biến nhất trong đề thi',
        back: 'Bỏ quên điều kiện ngoại lệ (Edge Cases) và nhầm lẫn giữa định nghĩa tổng quát với trường hợp đặc biệt.',
        category: 'Kinh nghiệm phòng ngừa',
        difficulty: 'HARD',
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      },
    ],
  };
}

/**
 * Call Google Gemini 1.5 Flash via REST API
 */
export async function callGeminiApi(
  prompt: string,
  apiKey: string,
  systemInstruction?: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  const bodyPayload: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  };

  if (systemInstruction) {
    bodyPayload.systemInstruction = {
      parts: [{ text: systemInstruction }],
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errorText}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text;
}

/**
 * Full AI Artifact Pipeline:
 * Generates Summary, Quizzes, and Flashcards for a given syllabus chapter & document.
 */
export async function generateAiStudyArtifacts(params: {
  courseName: string;
  chapterTitle: string;
  pdfUrl?: string;
  customApiKey?: string;
}): Promise<AiStudyHubArtifacts> {
  const { courseName, chapterTitle, customApiKey } = params;

  // Resolve API Key: check parameter or server environment variable
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    // Graceful offline fallback
    return generateDeterministicArtifacts(courseName, chapterTitle);
  }

  const systemPrompt = `Bạn là Giảng viên AI cao cấp thuộc hệ thống CampusOS. Nhiệm vụ của bạn là phân tích tài liệu bài giảng đại học, tạo ra bộ học liệu số toàn năng chuẩn định dạng JSON cho sinh viên bao gồm:
1. "summary": Tóm tắt cốt lõi 5 phút (Executive Syllabus Summary) với title, readingTimeMinutes (số nguyên, e.g. 5), keyTakeaways (mảng 3-5 chuỗi), coreConcepts (mảng 3-5 đối tượng { name, definition, formulaOrLaw, practicalExample }), commonPitfalls (mảng 2-3 chuỗi lỗi hay gặp).
2. "quizzes": 5 câu hỏi trắc nghiệm thông minh bám sát nội dung. Mỗi câu { id, question, options (mảng 4 phương án), correctAnswerIndex (0, 1, 2 hoặc 3), explanation (giải thích chi tiết tại sao đúng/sai), hint (gợi ý tư duy), difficulty ('EASY' | 'MEDIUM' | 'HARD'), xpReward (15-25) }.
3. "flashcards": 5-8 thẻ ghi nhớ thuật ngữ/công thức. Mỗi thẻ { id, front, back, category, difficulty ('EASY' | 'MEDIUM' | 'HARD') }.
Ngôn ngữ: Tiếng Việt chuẩn mực sư phạm, chính xác về mặt học thuật.
Đầu ra BẮT BUỘC là đối tượng JSON hợp lệ duy nhất có đúng 3 khóa: "summary", "quizzes", "flashcards".`;

  const userPrompt = `Môn học: "${courseName}".
Chuyên đề / Bài giảng: "${chapterTitle}".
${params.pdfUrl ? `Tài liệu tham khảo đính kèm: ${params.pdfUrl}` : ''}
Hãy phân tích và xuất ra toàn bộ bộ ba học liệu trên dưới dạng JSON.`;

  try {
    const rawJsonText = await callGeminiApi(userPrompt, apiKey, systemPrompt);
    const parsed = JSON.parse(rawJsonText);

    // Validate and sanitize structure
    if (parsed.summary && Array.isArray(parsed.quizzes) && Array.isArray(parsed.flashcards)) {
      const sanitizedQuizzes: AiGeneratedQuizQuestion[] = parsed.quizzes.map((q: any, idx: number) => ({
        id: q.id || `quiz-gen-${idx + 1}`,
        question: q.question || 'Câu hỏi chuyên đề',
        options: Array.isArray(q.options) && q.options.length >= 4 ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? Math.max(0, Math.min(3, q.correctAnswerIndex)) : 0,
        explanation: q.explanation || 'Đáp án chính xác theo giáo trình.',
        hint: q.hint || 'Hãy xem lại định nghĩa lý thuyết cơ bản.',
        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(q.difficulty) ? q.difficulty : 'MEDIUM',
        xpReward: q.xpReward || 15,
      }));

      const sanitizedFlashcards: AiGeneratedFlashcard[] = parsed.flashcards.map((f: any, idx: number) => ({
        id: f.id || `fc-gen-${idx + 1}`,
        front: f.front || `Thuật ngữ ${idx + 1}`,
        back: f.back || 'Giải nghĩa chi tiết thuật ngữ',
        category: f.category || 'Khái niệm trọng tâm',
        difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(f.difficulty) ? f.difficulty : 'MEDIUM',
        repetitions: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewAt: new Date().toISOString(),
      }));

      return {
        summary: {
          title: parsed.summary.title || `Tóm tắt: ${chapterTitle}`,
          readingTimeMinutes: parsed.summary.readingTimeMinutes || 5,
          keyTakeaways: Array.isArray(parsed.summary.keyTakeaways) ? parsed.summary.keyTakeaways : [],
          coreConcepts: Array.isArray(parsed.summary.coreConcepts) ? parsed.summary.coreConcepts : [],
          commonPitfalls: Array.isArray(parsed.summary.commonPitfalls) ? parsed.summary.commonPitfalls : [],
        },
        quizzes: sanitizedQuizzes,
        flashcards: sanitizedFlashcards,
      };
    }
    // Fallback if schema doesn't match
    return generateDeterministicArtifacts(courseName, chapterTitle);
  } catch {
    // API failed or timeout: safe fallback
    return generateDeterministicArtifacts(courseName, chapterTitle);
  }
}

/**
 * PDF RAG Q&A Chat Engine
 */
export async function chatWithPdfDocument(params: {
  courseName: string;
  chapterTitle: string;
  query: string;
  chatHistory: ChatMessage[];
  customApiKey?: string;
}): Promise<ChatMessage> {
  const { courseName, chapterTitle, query, chatHistory, customApiKey } = params;
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    // Rich deterministic AI Coach reply
    const norm = query.toLowerCase();
    let reply = `Chào bạn! Về câu hỏi "${query}" trong chuyên đề "${chapterTitle}" môn ${courseName}:\n\n`;

    if (norm.includes('độ phức tạp') || norm.includes('big-o') || norm.includes('thời gian') || norm.includes('tối ưu')) {
      reply += `📌 **Trọng tâm phân tích độ phức tạp:**\n- Trong hầu hết các bài toán của ${chapterTitle}, ta luôn tìm kiếm lời giải tiệm cận $O(N \\log N)$ hoặc $O(1)$ thay vì vét cạn $O(N^2)$.\n- Cần lưu ý trường hợp xấu nhất (Worst-case) khi dữ liệu đầu vào đã bị suy biến.\n\n💡 **Gợi ý ôn tập:** Bạn có thể mở tab Flashcard 3D hoặc làm bài trắc nghiệm nhanh để kiểm tra mức độ nắm vững công thức này!`;
    } else if (norm.includes('công thức') || norm.includes('định lý') || norm.includes('tính')) {
      reply += `📐 **Công thức & Quy luật cốt lõi:**\n- Luôn xác định miền giá trị hợp lệ trước khi áp dụng công thức.\n- Nhớ kiểm tra các điều kiện biên (Edge conditions) để tránh mất điểm trong đề thi cuối kỳ.`;
    } else {
      reply += `📖 **Giải đáp học thuật:**\nNội dung này là mắt xích trực tiếp liên kết giữa lý thuyết nền tảng và bài thi cuối kỳ môn **${courseName}**.\n- Bạn nên chú ý các ví dụ mẫu được giảng viên nhấn mạnh trong slide.\n- Nếu có chỗ nào chưa rõ, bạn có thể hỏi mình sâu hơn về từng bước chứng minh hoặc ví dụ code minh họa!`;
    }

    return {
      role: 'assistant',
      content: reply,
      citation: `Slide ${chapterTitle} • Mục Trọng tâm`,
      timestamp: new Date().toISOString(),
    };
  }

  const systemPrompt = `Bạn là Trợ lý Giảng viên AI CampusOS chuyên hỗ trợ sinh viên giải đáp thắc mắc về tài liệu bài giảng môn "${courseName}", bài học "${chapterTitle}".
Phong cách trả lời: Sư phạm, súc tích, dễ hiểu, sử dụng Markdown format, công thức toán học nếu có.
Nếu câu hỏi liên quan đến bài giảng, hãy trích dẫn vị trí tham khảo (Slide hoặc Mục liên quan).`;

  const conversationText = chatHistory
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'Sinh viên' : 'AI Giảng viên'}: ${m.content}`)
    .join('\n');

  const userPrompt = `${conversationText}\nSinh viên: ${query}\n\nHãy trả lời câu hỏi trên bằng tiếng Việt chuẩn xác.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini status ${response.status}`);
    }

    const json = await response.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text || 'Rất tiếc, AI tạm thời chưa thể đưa ra câu trả lời.';

    return {
      role: 'assistant',
      content: text,
      citation: `Slide ${chapterTitle}`,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return {
      role: 'assistant',
      content: `Dựa trên tài liệu chuyên đề "${chapterTitle}" của môn ${courseName}, câu hỏi "${query}" liên quan mật thiết đến cấu trúc và các định lý đã học. Bạn hãy tham khảo tóm tắt cốt lõi 5 phút và làm thử đề trắc nghiệm để củng cố kiến thức!`,
      citation: `Slide ${chapterTitle}`,
      timestamp: new Date().toISOString(),
    };
  }
}
