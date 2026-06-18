import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

export async function generateComment({ title, content, keyword, type }) {
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
