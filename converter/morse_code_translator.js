addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {status:405});
  }
  return new Response('Not Found', {status:404});
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Morse Code Translator</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f0f2f5;
      color: #1f2937;
    }
    .container {
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
      margin-bottom: 20px;
    }
    h1, h2 { margin: 0 0 12px; color: #0f172a; }
    p { margin: 0 0 18px; line-height: 1.6; color: #475569; }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #1e293b;
    }
    textarea {
      width: 100%;
      min-height: 220px;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 14px;
      font: 1rem/1.5 Consolas, Monaco, monospace;
      resize: vertical;
      background: #f8fafc;
    }
    textarea:focus {
      outline: 2px solid rgba(0,123,255,.18);
      border-color: #007bff;
    }
    .actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 18px;
    }
    button {
      background: #007bff;
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 18px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.2s ease;
    }
    button:hover {
      background: #0056b3;
      transform: translateY(-1px);
    }
    button.secondary {
      background: #e2e8f0;
      color: #1e293b;
    }
    button.secondary:hover {
      background: #cbd5e1;
    }
    .status {
      display: inline-flex;
      padding: 10px 14px;
      border-radius: 999px;
      font-weight: 600;
      background: #dbeafe;
      color: #1d4ed8;
      margin-bottom: 18px;
    }
    .status.error {
      background: #fee2e2;
      color: #b91c1c;
    }
    .legend {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 10px;
      margin-top: 16px;
    }
    .legend-item {
      background: #f8fafc;
      border: 1px solid #dbe4f0;
      border-radius: 10px;
      padding: 10px 12px;
      font-family: Consolas, Monaco, monospace;
    }
    .hint { color: #64748b; font-size: 0.92rem; }
    @media (max-width: 720px) {
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Morse Code Translator</h1>
      <p>Translate between plain text and Morse code in both directions. Letters use spaces between symbols, while words can be separated with a slash or double spaces.</p>
      <div id="status" class="status">Ready to translate and play Morse audio</div>
      <div class="grid">
        <div>
          <label for="textInput">Text (A-Z and 0-9)</label>
          <textarea id="textInput" spellcheck="false" placeholder="Type text here..."></textarea>
        </div>
        <div>
          <label for="morseInput">Morse (. and -)</label>
          <textarea id="morseInput" spellcheck="false" placeholder=".... . .-.. .-.. --- / .---- ..--- ...--"></textarea>
        </div>
      </div>
      <div class="actions">
        <button id="textToMorseBtn">Text → Morse</button>
        <button id="morseToTextBtn">Morse → Text</button>
        <button id="playBtn">Play</button>
        <button id="sampleBtn" class="secondary">Load Sample</button>
      </div>
      <p class="hint" style="margin-top: 16px;">Timing: dot = 80ms, dash = 240ms, 80ms between symbols, 240ms between letters, 560ms between words.</p>
    </div>

    <div class="card">
      <h2>Supported examples</h2>
      <div class="legend">
        <div class="legend-item">S = ...</div>
        <div class="legend-item">O = ---</div>
        <div class="legend-item">1 = .----</div>
        <div class="legend-item">2 = ..---</div>
        <div class="legend-item">9 = ----.</div>
        <div class="legend-item">0 = -----</div>
      </div>
    </div>
  </div>

  <script>
    const MORSE_MAP = {
      A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
      K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
      U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
      0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
    };
    const REVERSE_MAP = Object.fromEntries(Object.entries(MORSE_MAP).map(([key, value]) => [value, key]));

    const textInput = document.getElementById('textInput');
    const morseInput = document.getElementById('morseInput');
    const statusEl = document.getElementById('status');
    let audioContext;

    document.getElementById('textToMorseBtn').addEventListener('click', translateTextToMorse);
    document.getElementById('morseToTextBtn').addEventListener('click', translateMorseToText);
    document.getElementById('playBtn').addEventListener('click', playMorse);
    document.getElementById('sampleBtn').addEventListener('click', loadSample);
    textInput.addEventListener('input', translateTextToMorse);
    morseInput.addEventListener('input', translateMorseToText);

    function setStatus(message, isError) {
      statusEl.textContent = message;
      statusEl.className = 'status' + (isError ? ' error' : '');
    }

    function textToMorse(text) {
      const unsupported = [];
      const words = text.toUpperCase().trim().split(/\s+/).filter(Boolean);
      const morseWords = words.map(word => {
        return word.split('').map(char => {
          if (!MORSE_MAP[char]) {
            unsupported.push(char);
            return '';
          }
          return MORSE_MAP[char];
        }).filter(Boolean).join(' ');
      }).filter(Boolean);

      return {
        output: morseWords.join(' / '),
        unsupported: [...new Set(unsupported)]
      };
    }

    function morseToText(morse) {
      const invalid = [];
      const normalized = morse
        .replace(/\r?\n/g, ' ')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s{2,}/g, ' / ')
        .trim();

      if (!normalized) {
        return { output: '', invalid: [] };
      }

      const words = normalized.split(' / ').filter(Boolean);
      const text = words.map(word => {
        return word.trim().split(/\s+/).map(token => {
          if (!REVERSE_MAP[token]) {
            invalid.push(token);
            return '?';
          }
          return REVERSE_MAP[token];
        }).join('');
      }).join(' ');

      return {
        output: text,
        invalid: [...new Set(invalid)]
      };
    }

    function translateTextToMorse() {
      const result = textToMorse(textInput.value);
      morseInput.value = result.output;
      if (result.unsupported.length) {
        setStatus('Skipped unsupported characters: ' + result.unsupported.join(', '), true);
      } else {
        setStatus('Translated text to Morse.', false);
      }
    }

    function translateMorseToText() {
      const result = morseToText(morseInput.value);
      textInput.value = result.output;
      if (result.invalid.length) {
        setStatus('Unknown Morse token(s): ' + result.invalid.join(', '), true);
      } else {
        setStatus('Translated Morse to text.', false);
      }
    }

    function scheduleTone(context, startTime, duration) {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 650;
      gainNode.gain.setValueAtTime(0.0001, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.2, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start(startTime);
      oscillator.stop(startTime + duration + 0.02);
    }

    async function playMorse() {
      const source = morseInput.value.trim() || textToMorse(textInput.value).output;
      if (!source) {
        setStatus('Enter text or Morse code before playing audio.', true);
        return;
      }

      const parsed = morseToText(source);
      if (parsed.invalid.length) {
        setStatus('Cannot play invalid Morse tokens: ' + parsed.invalid.join(', '), true);
        return;
      }

      const normalized = source
        .replace(/\r?\n/g, ' ')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s{2,}/g, ' / ')
        .trim();

      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      const unit = 0.08;
      let currentTime = audioContext.currentTime + 0.05;
      const words = normalized.split(' / ').filter(Boolean);

      words.forEach((word, wordIndex) => {
        const letters = word.trim().split(/\s+/).filter(Boolean);
        letters.forEach((letter, letterIndex) => {
          const symbols = letter.split('');
          symbols.forEach((symbol, symbolIndex) => {
            const duration = symbol === '.' ? unit : unit * 3;
            scheduleTone(audioContext, currentTime, duration);
            currentTime += duration;
            if (symbolIndex < symbols.length - 1) {
              currentTime += unit;
            }
          });
          if (letterIndex < letters.length - 1) {
            currentTime += unit * 3;
          }
        });
        if (wordIndex < words.length - 1) {
          currentTime += unit * 7;
        }
      });

      setStatus('Playing Morse audio...', false);
    }

    function loadSample() {
      textInput.value = 'SOS 2024';
      translateTextToMorse();
    }

    loadSample();
  </script>
</body>
</html>`;
  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
