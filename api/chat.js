const { getChatReply } = require('../lib/chatHandler');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { message, history } = req.body || {};
    const reply = await getChatReply({ message, history });
    res.status(200).json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message || '서버 오류가 발생했습니다.' });
  }
};
