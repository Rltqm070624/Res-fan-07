/* ==========================================================================
   ⭐️ 멤버 프로필 데이터
   - birthday / position 은 기존 member.html에 있던 값을 그대로 유지
   - mbti / hobby / specialty / intro 는 팬 페이지용 소개 문구 (자유롭게 수정 가능)
   - 사진 경로: images/profile/{key}/{era}.webp, 서명: images/profile/{key}/sign.svg
   ========================================================================== */
const MEMBER_DATA = [
    {
        key: 'woni', nameKo: '원이', nameEn: 'WONI', color: '#f4c95d',
        birthday: '2004.05.25', position: '리더 · 보컬',
        mbti: 'ENFJ', hobby: '식물 가꾸기', specialty: '작사 · 작곡',
        intro: '팀을 다정하게 이끄는 리더. 안정적인 음색으로 무대의 중심을 잡아줘요.'
    },
    {
        key: 'liv', nameKo: '리브', nameEn: 'LIV', color: '#6ec6ff',
        birthday: '2006.10.11', position: '보컬',
        mbti: 'INFP', hobby: '필름 사진', specialty: '피아노 연주',
        intro: '감성적인 음색을 지닌 무드메이커. 조용히 팀의 분위기를 채워줘요.'
    },
    {
        key: 'minami', nameKo: '미나미', nameEn: 'MINAMI', color: '#2b99c4',
        birthday: '2006.11.29', position: '보컬 · 댄스 · 랩',
        mbti: 'ENFP', hobby: '아사이볼 만들기', specialty: '안무 창작 · 스티치 성대모사',
        intro: '보컬, 댄스, 랩까지 다 되는 올라운더. 아사이볼 사랑이 남다른 미식가이기도 해요.'
    },
    {
        key: 'may', nameKo: '메이', nameEn: 'MAY', color: '#ecd25b',
        birthday: '2008.08.19', position: '보컬',
        mbti: 'INTP', hobby: '모동숲', specialty: '킬링파트 보컬',
        intro: '가늘고 여린 음색으로 인트로 · 프리코러스의 킬링파트를 책임져요. 웃을 때 드러나는 토끼 앞니가 매력 포인트.'
    },
    {
        key: 'zena', nameKo: '제나', nameEn: 'ZENA', color: '#ff6b6b',
        birthday: '2008.11.27', position: '보컬 · 댄스',
        mbti: 'ISFP', hobby: '그림 그리기', specialty: '왁킹',
        intro: '리센느의 황금막내. 어린 나이에도 무대를 압도하는 존재감을 가졌어요.'
    }
];

const MEMBER_ERAS = [
    { key: 'debut', label: 'DEBUT' },
    { key: 'yoyo', label: 'YoYo' },
    { key: 'rescene', label: "Re:Scene" },
    { key: 'scenedrome', label: 'SceneDrome' },
    { key: 'glowup', label: 'Glow Up' },
    { key: 'dearest', label: 'Dearest' },
    { key: 'heartdrop', label: 'Heart Drop' },
    { key: 'lipbomb', label: 'lip bomb' },
    { key: 'runaway', label: 'Runaway' },
    { key: 'prettygirl', label: 'Pretty Girl' }
];
