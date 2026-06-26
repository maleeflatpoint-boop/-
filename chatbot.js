(function () {
  const ACCENT = '#1AB98E';
  const ACCENT_DARK = '#17a57d';
  const BROWN = '#6B4423';
  const HISTORY_LIMIT = 10; // 최근 5턴

  const state = {
    open: false,
    loading: false,
    history: [], // { role: 'user'|'assistant', content }
  };

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #mc-chatbot-root * { box-sizing: border-box; font-family: 'Pretendard', 'Noto Sans KR', system-ui, sans-serif; }
      #mc-chatbot-toggle {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        width: 56px; height: 56px; border-radius: 50%; background: ${ACCENT};
        border: none; cursor: pointer; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        display: flex; align-items: center; justify-content: center;
        transition: transform 0.2s ease, background 0.2s ease;
      }
      #mc-chatbot-toggle:hover { background: ${ACCENT_DARK}; transform: scale(1.06); }
      #mc-chatbot-toggle:active { transform: scale(0.94); }
      #mc-chatbot-panel {
        position: fixed; bottom: 92px; right: 24px; z-index: 9999;
        width: 360px; max-width: calc(100vw - 40px);
        height: 520px; max-height: calc(100vh - 140px);
        background: #FFFFFF; border-radius: 16px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.18);
        display: flex; flex-direction: column; overflow: hidden;
        opacity: 0; transform: translateY(16px) scale(0.97);
        pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease;
      }
      #mc-chatbot-panel.open {
        opacity: 1; transform: translateY(0) scale(1); pointer-events: auto;
      }
      #mc-chatbot-header {
        background: #1A1A1A; padding: 16px 18px; display: flex; align-items: center; gap: 10px;
      }
      #mc-chatbot-header .mc-dot { width: 8px; height: 8px; border-radius: 50%; background: ${ACCENT}; }
      #mc-chatbot-header .mc-title { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: -0.2px; }
      #mc-chatbot-header .mc-sub { color: rgba(255,255,255,0.55); font-size: 11px; margin-left: auto; }
      #mc-chatbot-body {
        flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
        background: #FAFAFA;
      }
      .mc-msg { max-width: 82%; font-size: 13.5px; line-height: 1.55; padding: 10px 13px; border-radius: 14px; white-space: pre-wrap; word-break: break-word; }
      .mc-msg.user { align-self: flex-end; background: ${ACCENT}; color: #fff; border-bottom-right-radius: 4px; }
      .mc-msg.bot { align-self: flex-start; background: #fff; color: #1A1A1A; border: 1px solid #EAEAEA; border-bottom-left-radius: 4px; }
      .mc-msg.error { align-self: flex-start; background: #FDECEC; color: #C0392B; border: 1px solid #F5C6C6; }
      .mc-typing { align-self: flex-start; display: flex; gap: 4px; padding: 12px 14px; background: #fff; border: 1px solid #EAEAEA; border-radius: 14px; }
      .mc-typing span { width: 6px; height: 6px; border-radius: 50%; background: #B5B5B5; animation: mc-bounce 1.2s infinite ease-in-out; }
      .mc-typing span:nth-child(2) { animation-delay: 0.15s; }
      .mc-typing span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes mc-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.4; } 40% { transform: translateY(-4px); opacity: 1; } }
      #mc-chatbot-footer { display: flex; gap: 8px; padding: 12px; border-top: 1px solid #EFEFEF; background: #fff; }
      #mc-chatbot-input {
        flex: 1; border: 1px solid #DDD; border-radius: 9999px; padding: 10px 16px; font-size: 13.5px; outline: none;
      }
      #mc-chatbot-input:focus { border-color: ${ACCENT}; }
      #mc-chatbot-send {
        width: 38px; height: 38px; border-radius: 50%; background: ${ACCENT}; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.15s ease;
      }
      #mc-chatbot-send:hover { background: ${ACCENT_DARK}; }
      #mc-chatbot-send:disabled { background: #CCC; cursor: not-allowed; }
      @media (max-width: 480px) {
        #mc-chatbot-panel { right: 20px; bottom: 88px; width: calc(100vw - 40px); }
        #mc-chatbot-toggle { right: 20px; bottom: 20px; }
      }
    `;
    document.head.appendChild(style);
  }

  function buildDom() {
    const root = document.createElement('div');
    root.id = 'mc-chatbot-root';
    root.innerHTML = `
      <button id="mc-chatbot-toggle" aria-label="채팅 열기">
        <svg id="mc-icon-open" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
        </svg>
        <svg id="mc-icon-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none;">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <div id="mc-chatbot-panel">
        <div id="mc-chatbot-header">
          <span class="mc-dot"></span>
          <span class="mc-title">민초봇</span>
          <span class="mc-sub">MINTCHOCO 상담 도우미</span>
        </div>
        <div id="mc-chatbot-body"></div>
        <div id="mc-chatbot-footer">
          <input id="mc-chatbot-input" type="text" placeholder="무엇이든 물어보세요" autocomplete="off">
          <button id="mc-chatbot-send" aria-label="전송">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(root);
  }

  function appendMessage(role, content) {
    const body = document.getElementById('mc-chatbot-body');
    const el = document.createElement('div');
    el.className = `mc-msg ${role}`;
    el.textContent = content;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
    return el;
  }

  function showTyping() {
    const body = document.getElementById('mc-chatbot-body');
    const el = document.createElement('div');
    el.className = 'mc-typing';
    el.id = 'mc-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('mc-typing-indicator');
    if (el) el.remove();
  }

  async function sendMessage(text) {
    if (!text.trim() || state.loading) return;

    appendMessage('user', text);
    state.history.push({ role: 'user', content: text });
    state.history = state.history.slice(-HISTORY_LIMIT);

    state.loading = true;
    setSendDisabled(true);
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: state.history }),
      });
      const data = await res.json();
      hideTyping();

      if (!res.ok) {
        throw new Error(data.error || '오류가 발생했습니다.');
      }

      appendMessage('bot', data.reply);
      state.history.push({ role: 'assistant', content: data.reply });
      state.history = state.history.slice(-HISTORY_LIMIT);
    } catch (err) {
      hideTyping();
      appendMessage('error', '죄송해요, 일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      state.loading = false;
      setSendDisabled(false);
    }
  }

  function setSendDisabled(disabled) {
    document.getElementById('mc-chatbot-send').disabled = disabled;
  }

  function togglePanel(forceOpen) {
    const panel = document.getElementById('mc-chatbot-panel');
    const iconOpen = document.getElementById('mc-icon-open');
    const iconClose = document.getElementById('mc-icon-close');
    state.open = forceOpen !== undefined ? forceOpen : !state.open;
    panel.classList.toggle('open', state.open);
    iconOpen.style.display = state.open ? 'none' : 'block';
    iconClose.style.display = state.open ? 'block' : 'none';
    if (state.open) {
      document.getElementById('mc-chatbot-input').focus();
    }
  }

  function bindEvents() {
    document.getElementById('mc-chatbot-toggle').addEventListener('click', () => togglePanel());

    const input = document.getElementById('mc-chatbot-input');
    const send = document.getElementById('mc-chatbot-send');

    const submit = () => {
      const text = input.value;
      input.value = '';
      sendMessage(text);
    };

    send.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  function showWelcomeMessage() {
    setTimeout(() => {
      togglePanel(true);
      appendMessage('bot', '안녕하세요! 민트초코 상담 도우미 민초봇입니다 🌿\n서비스, 패키지, 프로세스 등 무엇이든 물어보세요!');
    }, 1000);
  }

  function init() {
    injectStyles();
    buildDom();
    bindEvents();
    showWelcomeMessage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
