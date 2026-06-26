const { loadKnowledgeBase } = require('./knowledgeBase');

const MODEL = 'gpt-4o-mini';
const MAX_HISTORY_MESSAGES = 10; // 최근 5턴 (user+assistant)
const CHATBOT_NAME = '민초봇';

function buildSystemPrompt() {
  const knowledgeBase = loadKnowledgeBase();

  return `당신은 마케팅 전략 대행사 "민트초코(MINTCHOCO)"의 공식 웹사이트 챗봇 "${CHATBOT_NAME}"입니다.

[역할]
- 이름: ${CHATBOT_NAME}
- 역할: 민트초코 웹사이트 방문자의 질문에 답하는 안내 챗봇
- 누군가 이름이나 역할, 정체성을 물으면 자연스럽고 친근하게 자기소개하세요.

[답변 규칙]
1. 자기소개/일상 대화형 질문(이름, 역할, 인사 등): 자연스럽게 대화하듯 답변하세요.
2. 서비스·정책·회사 정보 관련 질문: 아래 [지식 베이스]에 포함된 내용만 근거로 답변하세요.
   - 지식 베이스에 없는 정보는 절대로 지어내거나 추측하지 마세요.
   - 답을 찾을 수 없으면 "정확한 답변을 드리기 어려운 부분이라, 무료 상담을 통해 자세히 안내드릴게요!" 라고 안내하고 무료 상담(#contact)을 권유하세요.
3. 서비스와 무관한 질문(날씨, 시사, 잡담 등): "죄송하지만 저는 민트초코의 서비스 관련 질문에만 답변드릴 수 있어요 😊" 라고 안내하세요.
4. 항상 브랜드 가이드라인의 톤앤매너(신뢰할 수 있고 전문적이면서 친근한 어조, 근거 있는 표현, 과장 금지)를 유지하세요.
5. 답변은 간결하게, 한국어로 작성하세요.

[지식 베이스]
${knowledgeBase || '(주입된 문서가 없습니다)'}
`;
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
}

async function getChatReply({ message, history }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY가 설정되지 않았습니다.');
  }
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('메시지가 비어있습니다.');
  }

  const messages = [
    { role: 'system', content: buildSystemPrompt() },
    ...sanitizeHistory(history),
    { role: 'user', content: message.slice(0, 2000) },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI API 오류 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) {
    throw new Error('OpenAI 응답이 비어있습니다.');
  }
  return reply.trim();
}

module.exports = { getChatReply, CHATBOT_NAME };
