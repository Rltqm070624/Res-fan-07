/* ==========================================================================
   ⭐️ AWARDS & AMBASSADOR 데이터 (awards.md / advertisements.md 전체 반영, 나무위키 링크 제외)
   ========================================================================== */

const AWARDS_LOGO_PATH = 'images/awards/';
// 파일명 매핑 — 없으면 null (JS에서 로고 대신 텍스트로 표시)
const AWARDS_LOGOS = {
    asiamodel: 'asiamodel.webp',
    firstbrand: 'firtst.webp',
    inkigayo: null, // 제공된 파일명이 불명확해서 텍스트로 대체
    kbs2: 'KBS2.svg',
    kexpo: 'kexpo.webp',
    mbcm: 'MBCM.svg',
    mcount: 'mcount.webp',
    mnet: 'mnet.svg',
    musicbank: 'musicbank.webp',
    sbs: 'SBS.svg',
    sbslife: 'sbslife.svg',
    showchampion: 'showchampion.webp',
    theshow: 'theshow.svg',
    umc: 'um.svg'
};

// 음악방송 1위 — 날짜별 상세 (2026년, 총 3관왕)
const MUSIC_SHOW_WINS = [
    { date: '2026-07-14', logo: 'theshow', program: '더 쇼', song: 'Pretty Girl', crown: '2관왕',
      notes: ['데뷔 첫 1위 (데뷔 841일 / 2년 3개월 19일 만)', '케이블 음악방송 첫 1위', '더 쇼 첫 1위'] },
    { date: '2026-07-25', logo: 'umc', program: '쇼! 음악중심', song: 'Pretty Girl', crown: '2관왕',
      notes: ['데뷔 첫 지상파 음악방송 1위 (데뷔 852일 / 2년 4개월 만)', '쇼! 음악중심 첫 1위'] },
    { date: '2026-07-26', logo: 'sbs', program: 'SBS 인기가요', song: 'LOVE ATTACK', crown: '1관왕',
      notes: ['SBS 인기가요 첫 1위 (발매 699일 / 1년 11개월 만)'] }
];

// 음악방송 1위 — 누적 (프로그램별)
const MUSIC_SHOW_CUMULATIVE = [
    { logo: 'sbslife', program: '더 쇼', wins: 1 },
    { logo: 'showchampion', program: '쇼챔피언', wins: 0 },
    { logo: 'mcount', program: '엠 카운트다운', wins: 0 },
    { logo: 'musicbank', program: '뮤직뱅크', wins: 0 },
    { logo: 'umc', program: '쇼! 음악중심', wins: 1 },
    { logo: 'sbs', program: 'SBS 인기가요', wins: 1 }
];

// 시상식
const CEREMONY_AWARDS = [
    { date: '2024-11-02', logo: null, name: '아시아 모델 어워즈', award: '라이징스타상', note: '기타 시상식/상으로 분류' },
    { date: '2025-08-28', logo: 'kexpo', name: '제7회 뉴시스 한류엑스포', award: '한류특별상', note: '' },
    { date: '2026-01-06', logo: 'firstbrand', name: '2026 대한민국 퍼스트브랜드 대상', award: '여자아이돌(라이징스타)', note: '' }
];

// 광고 · 콜라보 · 화보 · 홍보대사 타임라인 (advertisements.md 전체)
const AD_TIMELINE = [
    // 홍보대사
    { date: '2026-07-23', type: '홍보대사', title: 'MBC 2026 아이치·나고야 아시안게임 중계방송', note: '' },
    { date: '2026-07-21', type: '홍보대사', title: '전남광주통합특별시 섬의 날', note: '행정안전부 주최' },
    { date: '2026-07-14', type: '홍보대사', title: '저스트 메이크업 IN TOKYO 2027', note: '' },
    { date: '2026-07-02', type: '홍보대사', title: '경기도 고양시', note: '메이의 고향' },
    { date: '2026-06-29', type: '홍보대사', title: '경상북도 경주시', note: '제나의 고향' },
    { date: '2026-06-24', type: '홍보대사', title: '경기도 수원시', note: '리브의 고향' },
    { date: '2026-05-22', type: '홍보대사', title: '경상남도 거제시', note: '원이의 고향 (~2028.05.21)' },
    { date: '2026-01-01', type: '홍보대사', title: '2026 캐릭터 라이선싱 페어', note: '' },
    { date: '2025-02-11', type: '홍보대사', title: '한국청소년연맹', note: '~2025.12.31' },
    { date: '2025-01-01', type: '홍보대사', title: '2025 캐릭터 라이선싱 페어', note: '' },

    // 화보
    { date: '2026-07-27', type: '화보', title: '하퍼스 바자 코리아', note: '랑방 협찬' },
    { date: '2026-08-01', type: '화보', title: '하퍼스 바자 코리아 (8월호)', note: '디스커버리 협찬' },
    { date: '2026-06-04', type: '화보', title: 'MIIM · 원이, 미나미', note: '' },
    { date: '2026-06-01', type: '화보', title: '앳스타일 (6월호)', note: '헬씨올리고팝 협찬' },
    { date: '2025-05-01', type: '화보', title: 'BEAUTY+ (5월호)', note: '' },
    { date: '2024-05-01', type: '화보', title: '코스모폴리탄 코리아 (5월호)', note: 'Clean 협찬' },

    // 콜라보레이션
    { date: '2026-01-01', type: '콜라보', title: '티오더 (IT)', note: '' },
    { date: '2026-01-01', type: '콜라보', title: 'KREAM (굿즈)', note: '' },
    { date: '2026-01-01', type: '콜라보', title: '김씨네과일 (의류)', note: '' },
    { date: '2026-01-01', type: '콜라보', title: '서든어택 (게임)', note: '' },

    // 광고 — 2026년
    { date: '2026-01-01', type: '광고', title: '동아오츠카 · 나랑드 사이다 (음료)', note: '' },
    { date: '2026-01-01', type: '광고', title: '청오DPK · 도미노피자 (식품)', note: '' },
    { date: '2026-01-01', type: '광고', title: 'BGF리테일 · CU (편의점)', note: '업계 최초 전속 모델 제안 발탁' },
    { date: '2026-01-01', type: '광고', title: '형지엘리트 · 엘리트 (교복)', note: '' },
    { date: '2026-01-01', type: '광고', title: '그레인온 · 카사베르디 (식품)', note: '' },
    { date: '2026-01-01', type: '광고', title: '넥슨 · FC 모바일 (게임)', note: '' },
    { date: '2026-01-01', type: '광고', title: 'WINDANDSEA (의류)', note: '' },
    { date: '2026-01-01', type: '광고', title: 'I-SHA · Wish I-GIRL (렌즈)', note: '' },
    // 광고 — 2025년
    { date: '2025-01-01', type: '광고', title: '형지엘리트 · 엘리트 (교복)', note: '' },
    { date: '2025-01-01', type: '광고', title: '프리티스킨 (화장품)', note: '' }
];
