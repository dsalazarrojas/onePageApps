addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST with JSON { action, format, input }' }), { status: 400, headers: jsonHeaders() });
    }

    const payload = await request.json();
    const { action, format, input } = payload || {};

    if (!action || !format || typeof input !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required fields: action, format, input' }), { status: 400, headers: jsonHeaders() });
    }

    let output;
    switch (format.toLowerCase()) {
      case 'base64':
        output = action === 'encode' ? base64EncodeUnicode(input) : base64DecodeUnicode(input);
        break;
      case 'base64url':
        output = action === 'encode' ? base64UrlEncode(input) : base64UrlDecode(input);
        break;
      case 'hex':
      case 'hexadecimal':
        output = action === 'encode' ? hexEncode(input) : hexDecode(input);
        break;
      case 'url':
      case 'urlencode':
        output = action === 'encode' ? encodeURIComponent(input) : decodeURIComponentSafe(input);
        break;
      case 'uuencode':
        output = action === 'encode' ? uuencode(input) : uudecode(input);
        break;
      case 'quoted-printable':
      case 'quoted_printable':
        output = action === 'encode' ? quotedPrintableEncode(input) : quotedPrintableDecode(input);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unsupported format: ${format}` }), { status: 400, headers: jsonHeaders() });
    }

    return new Response(JSON.stringify({ output }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// ----------------- Helpers -----------------
function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

// Base64 (Unicode safe)
function base64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function base64DecodeUnicode(b64) {
  try {
    return decodeURIComponent(escape(atob(b64)));
  } catch (e) {
    throw new Error('Invalid base64 input');
  }
}

function base64UrlEncode(str) {
  return base64EncodeUnicode(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function base64UrlDecode(b64url) {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  // Pad
  while (b64.length % 4) b64 += '=';
  return base64DecodeUnicode(b64);
}

// Hex
function hexEncode(str) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexDecode(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex string');
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substr(i, 2), 16);
  }
  return new TextDecoder().decode(bytes);
}

// URL decode safe
function decodeURIComponentSafe(s) {
  try { return decodeURIComponent(s); } catch (e) { throw new Error('Invalid URL-encoded string'); }
}

// Quoted-printable (simple implementation)
function quotedPrintableEncode(str) {
  return Array.from(new TextEncoder().encode(str)).map(b => {
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) return String.fromCharCode(b);
    if (b === 32) return ' ';
    return '=' + b.toString(16).toUpperCase().padStart(2, '0');
  }).join('');
}
function quotedPrintableDecode(s) {
  return s.replace(/=([0-9A-Fa-f]{2})/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// UUEncode / UUDecode (basic implementation)
function uuencode(input) {
  const bytes = new TextEncoder().encode(input);
  let out = '';
  for (let i = 0; i < bytes.length; i += 45) {
    const chunk = bytes.subarray(i, i + 45);
    out += String.fromCharCode(32 + chunk.length);
    for (let j = 0; j < chunk.length; j += 3) {
      const a = chunk[j];
      const b = j + 1 < chunk.length ? chunk[j + 1] : 0;
      const c = j + 2 < chunk.length ? chunk[j + 2] : 0;
      const c1 = (a >> 2) & 0x3f;
      const c2 = ((a << 4) & 0x30) | ((b >> 4) & 0x0f);
      const c3 = ((b << 2) & 0x3c) | ((c >> 6) & 0x03);
      const c4 = c & 0x3f;
      out += String.fromCharCode(c1 + 32, c2 + 32, (j + 1 < chunk.length ? c3 + 32 : 32), (j + 2 < chunk.length ? c4 + 32 : 32));
    }
    out += '\n';
  }
  out += '`\nend\n';
  return out;
}

function uudecode(input) {
  const lines = input.replace(/\r/g, '').split('\n');
  const outBytes = [];
  for (const line of lines) {
    if (!line) continue;
    if (line === 'end') break;
    let lenChar = line.charCodeAt(0) - 32;
    if (lenChar <= 0) continue;
    let idx = 1;
    while (idx < line.length) {
      const c1 = line.charCodeAt(idx++) - 32;
      const c2 = line.charCodeAt(idx++) - 32;
      const c3 = line.charCodeAt(idx++) - 32;
      const c4 = line.charCodeAt(idx++) - 32;
      const a = ((c1 & 0x3f) << 2) | ((c2 & 0x30) >> 4);
      const b = ((c2 & 0x0f) << 4) | ((c3 & 0x3c) >> 2);
      const c = ((c3 & 0x03) << 6) | (c4 & 0x3f);
      outBytes.push(a);
      if (outBytes.length % 45 <= lenChar - 1) outBytes.push(b);
      if (outBytes.length % 45 <= lenChar - 2) outBytes.push(c);
    }
  }
  return new TextDecoder().decode(new Uint8Array(outBytes));
}

// ----------------- End Helpers -----------------
