/* =====================================================
   International Mobility — Chat Widget
   Pegar en la web antes de </body>:
   <script src="https://TU-CDN/widget.js"></script>
   ===================================================== */
(function () {
  var WORKER_URL = 'https://intmobility-bot.TU-SUBDOMINIO.workers.dev';
  var ACCENT     = '#1B3A6B';   // azul marino IM
  var ACCENT2    = '#E85D1A';   // naranja IM

  // ── ESTILOS ──────────────────────────────────────
  var css = [
    '@keyframes im-td{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}',
    '@keyframes im-pulse{0%,100%{opacity:1}50%{opacity:.3}}',
    '#im-bubble{transition:transform .2s;}',
    '#im-bubble:hover{transform:scale(1.1);}',
    '#im-win{display:none;position:absolute;bottom:72px;right:0;width:340px;height:510px;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.28);flex-direction:column;background:#fff;}',
    '#im-msgs{flex:1;overflow-y:auto;padding:12px;background:#f0f4f8;display:flex;flex-direction:column;gap:6px;scroll-behavior:smooth;}',
    '#im-typing{display:none;padding:0 12px 6px;background:#f0f4f8;}',
    '@media(max-width:400px){#im-win{width:calc(100vw - 32px);right:-8px;}}'
  ].join('');
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // ── HTML ─────────────────────────────────────────
  var wrap = document.createElement('div');
  wrap.id = 'im-widget';
  wrap.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;';

  wrap.innerHTML = [
    // Botón flotante
    '<div id="im-bubble" onclick="imToggle()" style="width:60px;height:60px;border-radius:50%;background:' + ACCENT + ';display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 4px 24px rgba(27,58,107,.45);position:relative;">',
      '<svg id="im-ico-chat" width="27" height="27" viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>',
      '<svg id="im-ico-close" width="22" height="22" viewBox="0 0 24 24" fill="white" style="display:none;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
      '<div style="position:absolute;top:-1px;right:-1px;width:15px;height:15px;border-radius:50%;background:#25d366;border:2px solid #fff;animation:im-pulse 1.8s infinite;"></div>',
    '</div>',

    // Ventana de chat
    '<div id="im-win">',

      // Header
      '<div style="background:' + ACCENT + ';padding:13px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;">',
        '<div style="width:40px;height:40px;border-radius:50%;background:' + ACCENT2 + ';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">⚖️</div>',
        '<div style="flex:1;">',
          '<div style="color:#fff;font-size:14px;font-weight:700;letter-spacing:-.01em;">Sofía · International Mobility</div>',
          '<div style="color:rgba(255,255,255,.75);font-size:11.5px;display:flex;align-items:center;gap:4px;">',
            '<div style="width:6px;height:6px;border-radius:50%;background:#25d366;"></div>',
            'Disponible ahora',
          '</div>',
        '</div>',
        '<div onclick="imToggle()" style="color:rgba(255,255,255,.65);cursor:pointer;font-size:20px;line-height:1;padding:4px;">✕</div>',
      '</div>',

      // Aviso legal breve
      '<div style="background:#e8eef5;padding:8px 14px;font-size:11px;color:#5a6a80;text-align:center;border-bottom:1px solid #d0dae6;flex-shrink:0;">',
        'Este chat es orientativo. No constituye asesoramiento legal.',
      '</div>',

      // Mensajes
      '<div id="im-msgs"></div>',

      // Typing indicator
      '<div id="im-typing">',
        '<div style="background:#fff;border-radius:0 8px 8px 8px;padding:8px 12px;display:inline-flex;gap:4px;align-items:center;box-shadow:0 1px 2px rgba(0,0,0,.08);">',
          '<div style="width:7px;height:7px;background:#8696a0;border-radius:50%;animation:im-td 1.2s infinite;"></div>',
          '<div style="width:7px;height:7px;background:#8696a0;border-radius:50%;animation:im-td 1.2s .2s infinite;"></div>',
          '<div style="width:7px;height:7px;background:#8696a0;border-radius:50%;animation:im-td 1.2s .4s infinite;"></div>',
        '</div>',
      '</div>',

      // Input
      '<div style="background:#eef1f5;padding:8px 10px;display:flex;align-items:center;gap:8px;flex-shrink:0;border-top:1px solid #dce3ec;">',
        '<div style="flex:1;background:#fff;border-radius:22px;display:flex;align-items:center;padding:8px 14px;border:1px solid #d0dae6;">',
          '<textarea id="im-input" placeholder="Cuéntame tu situación..." rows="1" style="flex:1;border:none;outline:none;font-size:13.5px;font-family:inherit;color:#111;background:transparent;resize:none;max-height:80px;line-height:1.4;" onkeydown="imKey(event)" oninput="imResize(this)"></textarea>',
        '</div>',
        '<button onclick="imSend()" style="width:42px;height:42px;border-radius:50%;background:' + ACCENT + ';border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 2px 8px rgba(27,58,107,.3);">',
          '<svg width="19" height="19" viewBox="0 0 24 24" fill="white" style="margin-left:2px;"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
        '</button>',
      '</div>',

    '</div>'  // #im-win
  ].join('');

  document.body.appendChild(wrap);

  // ── LÓGICA ───────────────────────────────────────
  var imOpen    = false;
  var imHistory = [];
  var imStarted = false;

  window.imToggle = function () {
    imOpen = !imOpen;
    var win   = document.getElementById('im-win');
    var iChat = document.getElementById('im-ico-chat');
    var iClose= document.getElementById('im-ico-close');
    win.style.display   = imOpen ? 'flex' : 'none';
    iChat.style.display = imOpen ? 'none' : 'block';
    iClose.style.display= imOpen ? 'block' : 'none';
    if (imOpen && !imStarted) {
      imStarted = true;
      setTimeout(imGreet, 700);
    }
    if (imOpen) {
      setTimeout(function () { document.getElementById('im-input').focus(); }, 300);
    }
  };

  function imGreet() {
    imAddMsg('bot', '¡Hola! Soy Sofía, asistente de International Mobility ⚖️\n\n¿En qué situación te encuentras? Cuéntame con confianza — nuestras abogadas pueden ayudarte.');
  }

  function imAddMsg(role, text) {
    var msgs  = document.getElementById('im-msgs');
    var isBot = role === 'bot';
    var now   = new Date();
    var time  = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
    var div   = document.createElement('div');
    div.style.cssText = 'display:flex;' + (isBot ? 'justify-content:flex-start;' : 'justify-content:flex-end;');
    var bg     = isBot ? '#fff' : ACCENT;
    var txtCol = isBot ? '#111' : '#fff';
    var radius = isBot ? '0 10px 10px 10px' : '10px 10px 0 10px';
    div.innerHTML =
      '<div style="max-width:82%;background:' + bg + ';border-radius:' + radius + ';padding:9px 12px 5px;box-shadow:0 1px 3px rgba(0,0,0,.1);">' +
        '<div style="font-size:13.5px;color:' + txtCol + ';line-height:1.55;white-space:pre-wrap;word-break:break-word;">' +
          text.replace(/</g, '&lt;').replace(/>/g, '&gt;') +
        '</div>' +
        '<div style="font-size:11px;color:' + (isBot ? '#8696a0' : 'rgba(255,255,255,.6)') + ';text-align:right;margin-top:3px;">' + time + '</div>' +
      '</div>';
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  window.imKey = function (e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); imSend(); }
  };

  window.imResize = function (el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  };

  window.imSend = async function () {
    var input = document.getElementById('im-input');
    var text  = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = 'auto';
    imAddMsg('user', text);
    imHistory.push({ role: 'user', content: text });

    var typing = document.getElementById('im-typing');
    typing.style.display = 'block';
    document.getElementById('im-msgs').scrollTop = 99999;

    try {
      var res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: imHistory })
      });
      var data  = await res.json();
      var reply = data.content && data.content[0] ? data.content[0].text : 'Ups, algo salió mal. Inténtalo de nuevo.';
      imHistory.push({ role: 'assistant', content: reply });
      typing.style.display = 'none';
      imAddMsg('bot', reply);
    } catch (err) {
      typing.style.display = 'none';
      imAddMsg('bot', 'Lo siento, hubo un problema de conexión. Puedes escribirnos directamente a info@internationalmobility.es ✉️');
    }
  };
})();
