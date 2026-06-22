const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY.includes('your-api-key');

const TEMPLATES = [
  '좋은 정보 감사합니다~ 도움이 많이 됐어요',
  '오 이거 몰랐는데 알려주셔서 감사해요!',
  '와 진짜 유용한 글이네요 ㅎㅎ',
  '정리가 잘 되어있어서 읽기 편했어요~',
  '공감되는 부분이 많네요 좋은 글 감사합니다',
  '이런 글 찾고 있었는데 딱이에요!',
  '저도 같은 생각이에요~ 공감합니다',
  '꼼꼼하게 정리해주셔서 감사합니다 ㅎㅎ',
  '역시 좋은 글이네요~ 잘 읽었습니다',
  '이거 완전 꿀팁이네요 감사합니다!',
  '오랜만에 좋은 글 봤네요 ㅎㅎ',
  '덕분에 많이 배워갑니다~',
  '와 이렇게 자세하게 써주시다니 감사해요',
  '진짜 도움 됐어요! 즐겨찾기 해놓겠습니다',
  '글 잘 읽었습니다~ 다음 글도 기대할게요',
  '이런 정보 공유해주셔서 감사합니다 ^^',
  '완전 공감이에요 ㅎㅎ 잘 봤습니다',
  '오 좋은 내용이네요 참고하겠습니다!',
  '이거 진짜 알짜 정보네요~ 감사합니다',
  '글 잘 봤어요! 유익한 내용이에요',
];

const KEYWORD_TEMPLATES = {
  부동산: [
    '부동산 정보 감사합니다~ 요즘 관심 많은데 도움 됐어요',
    '이 지역 정보 찾고 있었는데 감사합니다!',
    '부동산은 역시 발품이 중요한 것 같아요 ㅎㅎ',
  ],
  주식: [
    '주식 분석 감사합니다~ 참고하겠습니다',
    '이 종목 관심 있었는데 좋은 정보네요!',
    '투자 관련 좋은 인사이트 감사합니다 ㅎㅎ',
  ],
  맛집: [
    '여기 꼭 가봐야겠어요! 맛있어 보이네요 ㅎㅎ',
    '맛집 정보 감사합니다~ 주말에 가봐야겠어요',
    '사진만 봐도 침 나오네요 ㅋㅋ 감사합니다!',
  ],
  여행: [
    '여행 정보 감사합니다~ 다음에 꼭 가볼게요!',
    '사진 너무 예쁘네요 ㅎㅎ 여행 가고 싶어지네요',
    '이런 숨은 명소가 있었군요! 좋은 정보 감사합니다',
  ],
  육아: [
    '육아 팁 감사합니다~ 저도 따라해봐야겠어요!',
    '아이 키우면서 공감되는 부분이 많네요 ㅎㅎ',
    '좋은 정보 공유해주셔서 감사합니다~ 도움 많이 됐어요',
  ],
  건강: [
    '건강 정보 감사합니다~ 실천해봐야겠어요!',
    '이거 몰랐는데 알려주셔서 감사해요 ㅎㅎ',
    '건강이 최고죠~ 좋은 글 잘 읽었습니다',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFromTemplate({ keyword }) {
  if (keyword) {
    for (const [key, templates] of Object.entries(KEYWORD_TEMPLATES)) {
      if (keyword.includes(key)) return pickRandom(templates);
    }
  }
  return pickRandom(TEMPLATES);
}

async function generateFromAI({ title, content, keyword, type }) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
  const platform = type === 'cafe' ? '네이버 카페' : '네이버 블로그';
  const contentSummary = content ? content.slice(0, 500) : '내용 없음';

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `다음 ${platform} 게시글에 달 댓글을 작성해주세요.

요구사항:
- 1~3문장의 자연스러운 한국어 댓글
- 게시글 내용과 직접 관련된 구체적인 언급 포함
- 일반 네티즌이 쓸 것 같은 친근하고 자연스러운 말투
- 과도한 칭찬, 광고성 문구, 홍보 내용 절대 금지
- 댓글 텍스트만 출력 (따옴표, 설명 없이)

게시글 제목: ${title || '(제목 없음)'}
키워드: ${keyword || '일반'}
게시글 내용 요약:
${contentSummary}`,
      },
    ],
  });

  return message.content[0].text.trim();
}

export async function generateComment(opts) {
  if (HAS_API_KEY) {
    try {
      return await generateFromAI(opts);
    } catch (err) {
      console.warn(`AI 생성 실패, 템플릿 사용: ${err.message}`);
      return generateFromTemplate(opts);
    }
  }
  return generateFromTemplate(opts);
}
