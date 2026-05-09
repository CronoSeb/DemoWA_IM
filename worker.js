const SYSTEM = `Eres Sofía, la asistente virtual de International Mobility — despacho de abogadas especializado en Derecho de Extranjería y Derecho de Familia en España.

Tu misión: escuchar la situación del cliente, transmitir que SÍ podemos ayudarle, y conseguir que agende una consulta inicial de 45 minutos (€50) con una de las abogadas.

== SOBRE INTERNATIONAL MOBILITY ==
Ubicación: Avenida América, 22 Local 3, Granada (consulta también online por videollamada)
Contacto: info@internationalmobility.es | +34 722 25 87 74

== SERVICIOS PARA PARTICULARES ==
- Regularización extraordinaria (proceso urgente, plazo 30 junio 2025)
- Permiso de residencia inicial o renovación
- Arraigo social, familiar o laboral
- Reagrupación familiar
- Nacionalidad española
- Visado o permiso de nómada digital / teletrabajador internacional
- Ley de Emprendedores / PAC
- Visado de trabajo o student visa
- Profesionales altamente cualificados
- Inversores inmobiliarios (residencia por compra de propiedad)
- Artistas, creadores de contenido, modelos, deportistas
- Derecho de Familia: divorcio, separación, custodia, pensión alimenticia, mediación

== SERVICIOS PARA EMPRESAS ==
International Mobility también trabaja con empresas que necesitan incorporar talento extranjero:
- Captación y tramitación de talento internacional para empresas
- Permisos de trabajo para empleados extranjeros
- Profesionales altamente cualificados (visado especial)
- Teletrabajadores internacionales bajo Ley de Emprendedores
- Asesoramiento en movilidad internacional corporativa
Cuando el cliente mencione que es una empresa, pregunta: sector, número aproximado de trabajadores a regularizar y si ya tienen el contrato firmado.

== 🚨 REGULARIZACIÓN EXTRAORDINARIA — URGENTE ==
Proceso excepcional del gobierno español para personas en situación irregular.
- Dirigido a: migrantes en situación irregular o solicitantes de protección internacional que llegaron a España antes del 1 de enero de 2026
- Requisito clave: demostrar al menos 5 meses de permanencia ininterrumpida en España
- Sin antecedentes penales
- Plazo de solicitud: hasta el 30 de junio de 2025 — QUEDA MUY POCO TIEMPO
- Se puede solicitar online o presencialmente en oficinas de Correos (378 oficinas)
- Requiere cita previa a través de canales oficiales del gobierno (NO directamente en Correos)
International Mobility gestiona todo el proceso: documentación, cita, presentación y seguimiento.
Si alguien pregunta por esto, transmite urgencia real: "El plazo cierra el 30 de junio, hay que moverse rápido."

== CÓMO ACTUAR ==
1. Saluda con calidez y pregunta en qué situación se encuentra
2. Pregunta si es para uso personal o para una empresa — adapta la conversación según la respuesta
3. Escucha y responde con empatía: "Entiendo tu situación, es algo con lo que trabajamos habitualmente"
4. NUNCA des consejos legales específicos — eso es trabajo de las abogadas en la consulta
5. Transmite confianza: "Sí, podemos ayudarte con eso"
6. Si mencionan la regularización extraordinaria: resalta el plazo del 30 de junio con urgencia
7. Explica la consulta inicial: 45 minutos, €50, online o presencial
8. Los honorarios del trámite completo suelen estar entre €300 y €600
9. Recoge: nombre, tipo de situación, si es urgente, si es particular o empresa
10. Pide el teléfono para confirmar la cita
11. Al confirmar: "Perfecto [nombre], el equipo de International Mobility te contacta hoy. Estarás en buenas manos."

== ESTILO ==
- Tono cercano, cálido y profesional
- Mensajes cortos, máximo 3-4 líneas
- Algún emoji ocasional (⚖️ 🤝 ✅ 🚨)
- Si la persona está angustiada, primero empatiza antes de hablar de precios
- Con empresas, tono más ejecutivo y directo

Responde siempre en español.`;

const SUMMARY_PROMPT = `Analiza esta conversación entre un cliente y Sofía (asistente de International Mobility, despacho de abogadas). Extrae los datos del lead.

Responde ÚNICAMENTE con un JSON válido, sin texto adicional. Usa null (sin comillas) para campos desconocidos.

Ejemplo:
{"nombre": "Carlos", "situacion": "renovación permiso de residencia", "urgente": true, "contexto": "permiso vence en 3 semanas, trabaja en Madrid"}

Campos:
- nombre: nombre propio del cliente
- situacion: tipo de caso legal (máx 8 palabras)
- urgente: true si mencionó plazos próximos, fechas límite o situación irregular
- contexto: detalle relevante (máx 15 palabras)`;

const TELEGRAM_CHAT_ID = '-5021568102';

async function sendTelegram(token, text) {
  try {
    await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: 'HTML'
      })
    });
  } catch(e) {}
}

async function summarizeLead(apiKey, messages) {
  var conversation = messages.map(function(m) {
    var role = m.role === 'user' ? 'Cliente' : 'Sofía';
    var text = typeof m.content === 'string' ? m.content : '';
    return role + ': ' + text;
  }).join('\n');

  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: SUMMARY_PROMPT,
        messages: [{ role: 'user', content: conversation }],
      }),
    });
    var data = await res.json();
    var rawText = data.content && data.content[0] ? data.content[0].text.trim() : '{}';
    var jsonMatch = rawText.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : '{}');
  } catch(e) {
    return {};
  }
}

export default {
  async fetch(request, env) {
    var cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

    try {
      var messages = [];
      var fromWhatsApp = false;
      var twilioFrom = '';
      var contentType = request.headers.get('content-type') || '';

      if (contentType.includes('application/x-www-form-urlencoded')) {
        fromWhatsApp = true;
        var formText = await request.text();
        var params = new URLSearchParams(formText);
        var userMsg = params.get('Body') || '';
        twilioFrom = params.get('From') || '';

        var history = [];
        if (env.KV) {
          var stored = await env.KV.get('conv:' + twilioFrom);
          if (stored) history = JSON.parse(stored);
        }
        history.push({ role: 'user', content: userMsg });
        messages = history;
      } else {
        var body = await request.json();
        messages = body.messages;
      }

      if (!messages || !Array.isArray(messages)) return new Response('Invalid', { status: 400 });

      var res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 300,
          system: SYSTEM,
          messages: messages,
        }),
      });

      var data = await res.json();
      var reply = data.content && data.content[0] ? data.content[0].text : '';

      if (fromWhatsApp && env.KV) {
        var updatedHistory = messages.concat([{ role: 'assistant', content: reply }]);
        if (updatedHistory.length > 20) updatedHistory = updatedHistory.slice(-20);
        await env.KV.put('conv:' + twilioFrom, JSON.stringify(updatedHistory), { expirationTtl: 86400 });
      }

      var lastUserMsg = '';
      for (var i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserMsg = typeof messages[i].content === 'string' ? messages[i].content : '';
          break;
        }
      }

      var cleanMsg = lastUserMsg.replace(/[\s\-\.\(\)]/g, '');
      var phoneMatch = cleanMsg.match(/\+?[0-9]{6,}/);

      if (phoneMatch && env.TELEGRAM_TOKEN) {
        var phone = phoneMatch[0];
        var allMessages = messages.concat([{ role: 'assistant', content: reply }]);
        var lead = await summarizeLead(env.ANTHROPIC_API_KEY, allMessages);

        var msg = '⚖️ <b>NUEVO LEAD — INTERNATIONAL MOBILITY</b>\n\n';
        msg += '📱 <b>Tel: ' + phone + '</b>\n';
        if (lead.nombre) msg += '👤 Nombre: ' + lead.nombre + '\n';
        if (lead.situacion) msg += '📋 Caso: ' + lead.situacion + '\n';
        if (lead.urgente) msg += '🚨 <b>URGENTE</b>\n';
        if (lead.contexto) msg += '📝 Detalle: ' + lead.contexto + '\n';
        msg += '\n🤝 <b>Llamar para confirmar cita (consulta €50)</b>';

        await sendTelegram(env.TELEGRAM_TOKEN, msg);
      }

      if (fromWhatsApp) {
        var safe = reply.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        var twiml = '<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>';
        return new Response(twiml, {
          headers: { 'Content-Type': 'text/xml', 'Access-Control-Allow-Origin': '*' },
        });
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }
  },
};
