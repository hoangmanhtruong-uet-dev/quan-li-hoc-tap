export type CatSkinType = 'teacher' | 'boss' | 'ceo' | 'tsundere';

export interface CharacterConfig {
  id: string;
  slug: string;
  name: string;
  role: string;
  tagline: string;
  isFree: boolean;
  voiceGender: 'female' | 'male';
  skinType: CatSkinType;
  furColor: string;
  avatarColor: string;
  quotes: {
    start: string[];
    tab_switch_warning: string[];
    tab_switch_extreme: string[];
    poke: string[];
    idle: string[];
    face_away: string[];
    sleep: string[];
    completed: string[];
  };
}

export const CHARACTERS: Record<string, CharacterConfig> = {
  'co-giao-chu-nhiem': {
    id: 'co-giao',
    slug: 'co-giao-chu-nhiem',
    name: 'Mèo Cô Giáo Chủ Nhiệm',
    role: 'Giọng Nữ Bắc · Kính tròn & Thước kẻ',
    tagline: 'Ngồi thẳng lưng lên! Đừng để tôi phải gọi điện về cho phụ huynh!',
    isFree: true,
    voiceGender: 'female',
    skinType: 'teacher',
    furColor: '#f59e0b', // Mèo vàng cam tri thức
    avatarColor: 'from-amber-500 to-rose-500',
    quotes: {
      start: [
        'Nào, trật tự ngay! Mở sách vở ra, bắt đầu hai mươi lăm phút học tập nghiêm túc nghe chưa!',
        'Ngồi thẳng lưng lên xem nào! Tôi đang nhìn chằm chằm vào màn hình của em đấy nhé!',
      ],
      tab_switch_warning: [
        'Ối giời ơi! Vừa mới học được mấy phút đã lén bấm sang tab nào đấy hả? Quay lại bài học ngay!',
        'Gớm mặt chưa kìa! Tưởng cô không để ý mà dám lướt sang trang khác à? Mở lại bài tập mau!',
        'Ấy chết, tay nhanh hơn não rồi đấy! Ai cho phép chuyển tab trong giờ tự học hả?',
      ],
      tab_switch_extreme: [
        'Này thì Facebook này, này thì TikTok này! Học hành kiểu đấy à? Tôi bấm số gọi thẳng cho mẹ em bây giờ đấy nhé!',
        'Giỏi nhỉ, gan to bằng trời rồi! Chuyển tab lần nữa là hôm nay chép phạt một trăm lần không nói nhiều!',
      ],
      poke: [
        'Ơ hay cái cô cậu này! Học không lo học, lại thò tay chọc ngoáy vào mặt giáo viên thế hả?',
        'Bỏ cái chuột ra khỏi người tôi ngay! Nhìn vào đề bài kia kìa, định ăn cây thước kẻ vào tay à?',
      ],
      idle: [
        'Đừng có ngồi đờ đẫn ra như tượng thế kia, cầm bút lên giải tiếp bài tập đi!',
      ],
      face_away: [
        'Mặt mũi lại nghếch đi đâu rồi đấy? Nhìn thẳng vào màn hình học bài mau lên!',
      ],
      sleep: [
        'Ối giời đất ơi! Chưa học xong được chữ nào đã ngáp ngắn ngáp dài gục xuống bàn thế kia à? Tỉnh dậy ngay!',
      ],
      completed: [
        'Đấy, cố gắng tập trung vào là làm được ngay! Rất đáng khen, cho phép xả hơi năm phút nhé!',
        'Giỏi lắm, hôm nay học hành rất ra dáng! Nghỉ ngơi uống cốc nước đi rồi lát học tiếp!',
      ],
    },
  },
  'sep-kho-tinh': {
    id: 'sep-kho-tinh',
    slug: 'sep-kho-tinh',
    name: 'Mèo Sếp Khó Tính',
    role: 'Giọng Nam Bắc · Cà vạt đỏ KPI',
    tagline: 'Chưa xong việc mà dám lướt web à? Trừ 20% KPI tháng này!',
    isFree: true,
    voiceGender: 'male',
    skinType: 'boss',
    furColor: '#64748b', // Mèo xám công sở
    avatarColor: 'from-blue-600 to-indigo-700',
    quotes: {
      start: [
        'Tập trung vào việc ngay! Hôm nay không hoàn thành KPI học tập thì đừng có mong được nghỉ sớm!',
        'Bắt đầu bấm giờ! Tôi trả lương bằng điểm số cho cậu đấy, làm việc cho tử tế vào!',
      ],
      tab_switch_warning: [
        'Ối giời, tưởng thế nào! Mới ngồi được một tí đã nhảy sang tab giải trí rồi à? Quay về làm việc ngay!',
        'Này cậu kia! Đang trong giờ chạy deadline mà dám lén lút mở tab khác à? Tôi ghi vào sổ đen rồi đấy nhé!',
      ],
      tab_switch_extreme: [
        'Cậu coi phòng làm việc của tôi là cái chợ đấy à? Trừ ngay năm mươi phần trăm điểm kỷ luật! Quay lại màn hình chính ngay lập tức!',
        'Quá lắm rồi đấy nhé! Lướt web thêm một giây nữa là viết đơn xin nghỉ học luôn đi cho nhanh!',
      ],
      poke: [
        'Làm cái trò gì đấy hả? Bấm bấm vào người sếp thế à? Quay ra gõ phím làm bài tập ngay!',
        'Này! Thừa thời gian quá đúng không? Tôi giao thêm cho gấp đôi bài tập bây giờ chứ lại chọc với ngoáy!',
      ],
      idle: [
        'Sao bàn phím im phăng phắc thế kia? Ngồi ngắm màn hình chờ sung rụng đấy à?',
      ],
      face_away: [
        'Ngó nghiêng đi đâu đấy? Tập trung một trăm phần trăm vào công việc trước mắt đi!',
      ],
      sleep: [
        'Hay thật đấy, đến giờ làm việc lại ngồi gật gù ngủ gật! Rửa mặt tỉnh táo lại ngay cho tôi!',
      ],
      completed: [
        'Khá lắm! Đúng tiến độ, làm việc có năng suất thế này tôi rất ưng. Cho nghỉ giải lao năm phút!',
        'Tốt! Hoàn thành xuất sắc mục tiêu ca này, cứ giữ phong độ như thế nhé!',
      ],
    },
  },
  'tong-tai-lanh-lung': {
    id: 'tong-tai',
    slug: 'tong-tai-lanh-lung',
    name: 'Mèo Tổng Tài Bá Đạo',
    role: 'Giọng Nam Trầm · Kính râm đen VIP',
    tagline: 'Em nghĩ em có thể lơ là trước mắt tôi sao? Tập trung vào, đồ ngốc!',
    isFree: false,
    voiceGender: 'male',
    skinType: 'ceo',
    furColor: '#1e293b', // Mèo đen tuyền
    avatarColor: 'from-slate-700 to-slate-900',
    quotes: {
      start: [
        'Ngồi ngoan đó và học cho tử tế. Hai mươi lăm phút này, ánh mắt của tôi chỉ nhìn một mình em thôi đấy.',
      ],
      tab_switch_warning: [
        'Chậc, gan của em dạo này lớn nhỉ? Trước mặt tôi mà dám lén mở trang khác xem à? Quay lại đây ngay!',
        'Tưởng tôi đeo kính râm mà không thấy em vừa chuyển tab sao? Ngoan ngoãn quay về học bài đi!',
      ],
      tab_switch_extreme: [
        'Em đang thử thách sự kiên nhẫn của tôi đấy à? Đừng để tôi phải khoá sạch mọi tài khoản mạng xã hội của em. Học ngay!',
      ],
      poke: [
        'Đồ ngốc này, đang trong giờ học mà lại muốn trêu chọc tôi sao? Học xong đi rồi muốn chạm bao nhiêu thì chạm!',
      ],
      idle: [
        'Lại ngồi thẫn thờ nghĩ đến tôi đấy à? Tập trung giải xong bài tập trước mặt đi đã.',
      ],
      face_away: [
        'Trong giờ của tôi, em không được phép nhìn đi bất kỳ nơi nào khác ngoài bài học!',
      ],
      sleep: [
        'Mới thế đã buồn ngủ rồi sao? Ráng hoàn thành nốt phiên này đi rồi tôi cho nghỉ ngơi.',
      ],
      completed: [
        'Làm tốt lắm. Không hổ danh là người do đích thân tôi giám sát, thưởng cho em năm phút nghỉ ngơi đấy.',
      ],
    },
  },
  'anime-tsundere': {
    id: 'tsundere',
    slug: 'anime-tsundere',
    name: 'Mèo Senpai Đanh Đá',
    role: 'Giọng Nữ Bắc · Nơ chuông vàng VIP',
    tagline: 'Không phải tớ muốn nhắc cậu đâu nhé! Mau học đi đồ ngốc!',
    isFree: false,
    voiceGender: 'female',
    skinType: 'tsundere',
    furColor: '#f472b6', // Mèo hồng trắng
    avatarColor: 'from-pink-500 to-rose-500',
    quotes: {
      start: [
        'Này nhé! Không phải vì tớ lo cho điểm số của cậu nên mới ngồi canh đâu! Mau mở bài ra học ngay đi!',
      ],
      tab_switch_warning: [
        'Á à! Bắt quả tang vừa lén nhảy sang tab khác nhé! Học hành chểnh mảng thế mà coi được à?',
        'Gớm chưa kìa, quyết tâm được đúng ba phút đồng hồ! Quay lại trang học tập ngay cho tớ!',
      ],
      tab_switch_extreme: [
        'Đồ ngốc không thuốc chữa này! Cứ mở tab linh tinh thế thì bao giờ mới giỏi được hả? Tắt ngay đi cho tớ!',
      ],
      poke: [
        'Á! Này, ai cho phép cậu chọc vào mặt tớ thế hả? Đồ bất lịch sự, quay lại làm bài tập mau!',
      ],
      idle: [
        'Ngồi đơ ra đấy làm gì thế? Bài tập có tự giải được đâu mà nhìn!',
      ],
      face_away: [
        'Này! Nhìn đi đâu thế hả? Bài vở ở ngay trước mặt cơ mà!',
      ],
      sleep: [
        'Dậy ngay đi đồ heo lười! Đang giờ học mà dám gục mặt xuống bàn thế à?',
      ],
      completed: [
        'Hừm, thì cũng gọi là tạm được đấy! Nghỉ năm phút đi, đừng có mà tự kiêu sớm nhé!',
      ],
    },
  },
};
