addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method === 'GET' && url.pathname === '/') {
    return serveMainPage();
  }
  const status = request.method === 'GET' ? 404 : 405;
  return new Response(status === 404 ? 'Not found' : 'Method not allowed', { status, headers: textHeaders() });
}

function serveMainPage() {
  const html = String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>QR Code with Logo</title>
<style>
  :root {
    --bg: #f4f7fb;
    --panel: #ffffff;
    --line: #d9e2f0;
    --ink: #142033;
    --muted: #667085;
    --accent: #2563eb;
    --accent-soft: #dbeafe;
    --shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    color: var(--ink);
    background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 28%, #f8fafc 100%);
  }
  .shell {
    width: min(1260px, calc(100vw - 28px));
    margin: 24px auto 34px;
    display: grid;
    gap: 18px;
  }
  .panel {
    background: var(--panel);
    border: 1px solid rgba(37, 99, 235, 0.08);
    border-radius: 24px;
    box-shadow: var(--shadow);
    padding: 22px;
  }
  .hero h1 {
    margin: 10px 0 10px;
    font-size: clamp(2rem, 4vw, 2.8rem);
  }
  .hero p {
    margin: 0;
    max-width: 780px;
    line-height: 1.65;
    color: var(--muted);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    padding: 6px 10px;
    font-size: 0.76rem;
    font-weight: 700;
    background: var(--accent-soft);
    color: #1d4ed8;
  }
  .layout {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 18px;
  }
  .stack {
    display: grid;
    gap: 16px;
  }
  .field {
    display: grid;
    gap: 8px;
  }
  .field label {
    font-weight: 700;
    font-size: 0.94rem;
  }
  textarea,
  select,
  input[type="number"],
  input[type="text"] {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 12px 14px;
    font-size: 0.98rem;
    font-family: inherit;
    background: #fff;
  }
  textarea {
    min-height: 140px;
    resize: vertical;
    line-height: 1.5;
  }
  input[type="color"] {
    width: 100%;
    height: 46px;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: #fff;
    padding: 4px;
  }
  input[type="range"] {
    width: 100%;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
  .button-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  button {
    appearance: none;
    border: 0;
    border-radius: 999px;
    padding: 11px 17px;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  button.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 10px 20px rgba(37, 99, 235, 0.18);
  }
  button.secondary {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
  }
  button.ghost {
    background: #fff;
    color: var(--ink);
    border: 1px solid var(--line);
  }
  button:hover {
    transform: translateY(-1px);
  }
  button:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  .status {
    padding: 12px 14px;
    border-radius: 14px;
    border: 1px solid var(--line);
    background: #f8fafc;
    color: var(--muted);
    line-height: 1.45;
    min-height: 48px;
  }
  .status.error {
    background: #fff7ed;
    border-color: #fdba74;
    color: #c2410c;
  }
  .preview-wrap {
    display: grid;
    gap: 16px;
    justify-items: center;
  }
  .canvas-wrap {
    width: 100%;
    min-height: 520px;
    display: grid;
    place-items: center;
    border: 1px solid var(--line);
    border-radius: 22px;
    background: linear-gradient(45deg, #eef2f7 25%, transparent 25%, transparent 75%, #eef2f7 75%, #eef2f7), linear-gradient(45deg, #eef2f7 25%, transparent 25%, transparent 75%, #eef2f7 75%, #eef2f7);
    background-position: 0 0, 12px 12px;
    background-size: 24px 24px;
    padding: 18px;
    overflow: auto;
  }
  #qrCanvas {
    display: block;
    max-width: 100%;
    border-radius: 18px;
    box-shadow: 0 16px 34px rgba(15, 23, 42, 0.12);
  }
  .meta-cards {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
  }
  .meta-card {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 14px;
    background: #fff;
  }
  .meta-card strong {
    display: block;
    color: var(--muted);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 6px;
  }
  .meta-card span {
    font-size: 1rem;
    font-weight: 700;
  }
  .hint {
    color: var(--muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }
  .logo-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border-radius: 999px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 0.82rem;
    font-weight: 700;
  }
  @media (max-width: 1060px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .meta-cards {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 560px) {
    .grid-2,
    .meta-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
</head>
<body>
  <div class="shell">
    <section class="panel hero">
      <span class="badge">Pure browser-side encoding</span>
      <h1>QR Code with Logo</h1>
      <p>Generate scannable QR codes locally using byte-mode encoding, Reed-Solomon error correction, all eight mask patterns, and canvas rendering. Add a centered logo when needed, then download the final PNG without sending anything to an external service.</p>
    </section>

    <section class="layout">
      <aside class="panel stack">
        <div class="field">
          <label for="contentInput">Text or URL</label>
          <textarea id="contentInput" placeholder="Enter text or a URL">https://example.com</textarea>
        </div>

        <div class="field">
          <label for="sizeSlider">Output size <span id="sizeLabel">320 px</span></label>
          <input id="sizeSlider" type="range" min="100" max="800" step="10" value="320">
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="levelSelect">Error correction</label>
            <select id="levelSelect">
              <option value="L">L · Low</option>
              <option value="M" selected>M · Medium</option>
              <option value="Q">Q · Quartile</option>
              <option value="H">H · High</option>
            </select>
          </div>
          <div class="field">
            <label for="logoInput">Optional logo</label>
            <input id="logoInput" type="file" accept="image/*">
          </div>
        </div>

        <div class="grid-2">
          <div class="field">
            <label for="foregroundPicker">Foreground color</label>
            <input id="foregroundPicker" type="color" value="#000000">
          </div>
          <div class="field">
            <label for="backgroundPicker">Background color</label>
            <input id="backgroundPicker" type="color" value="#ffffff">
          </div>
        </div>

        <div class="button-row">
          <button id="generateButton" class="primary">Generate</button>
          <button id="downloadButton" class="secondary" disabled>Download PNG</button>
          <button id="clearLogoButton" class="ghost" type="button">Remove logo</button>
        </div>

        <div id="logoStatus" class="logo-chip">No logo loaded</div>
        <div id="statusBox" class="status">Adjust the options and generate a QR code. Preview updates live after the first render.</div>
        <div class="hint">Tip: keep the logo near 20% of the QR width. Larger logos work better with higher error correction levels, especially H.</div>
      </aside>

      <section class="panel preview-wrap">
        <div class="button-row" style="justify-content:space-between;align-items:center;width:100%;">
          <h2 style="margin:0;">Live preview</h2>
          <span class="badge">Versions 1–10</span>
        </div>
        <div class="canvas-wrap">
          <canvas id="qrCanvas" width="320" height="320"></canvas>
        </div>
        <div class="meta-cards">
          <div class="meta-card"><strong>Version</strong><span id="versionValue">—</span></div>
          <div class="meta-card"><strong>Mask</strong><span id="maskValue">—</span></div>
          <div class="meta-card"><strong>Modules</strong><span id="modulesValue">—</span></div>
          <div class="meta-card"><strong>UTF-8 bytes</strong><span id="bytesValue">—</span></div>
        </div>
      </section>
    </section>
  </div>

  <script>
    const QRCore = (function() {
      const RS_BLOCK_TABLE = [
        [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
        [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
        [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
        [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
        [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
        [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
        [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
        [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
        [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
        [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]
      ];
      const ALIGNMENT_POSITIONS = [
        [],
        [6, 18],
        [6, 22],
        [6, 26],
        [6, 30],
        [6, 34],
        [6, 22, 38],
        [6, 24, 42],
        [6, 26, 46],
        [6, 28, 50]
      ];
      const LEVEL_INDEX = { L: 0, M: 1, Q: 2, H: 3 };
      const LEVEL_FORMAT_BITS = { L: 1, M: 0, Q: 3, H: 2 };
      const GF_EXP = new Array(512);
      const GF_LOG = new Array(256);
      const GENERATOR_CACHE = {};

      initGaloisTables();

      function initGaloisTables() {
        let value = 1;
        for (let index = 0; index < 255; index += 1) {
          GF_EXP[index] = value;
          GF_LOG[value] = index;
          value <<= 1;
          if (value & 0x100) {
            value ^= 0x11D;
          }
        }
        for (let index = 255; index < 512; index += 1) {
          GF_EXP[index] = GF_EXP[index - 255];
        }
        GF_LOG[0] = 0;
      }

      function gfMultiply(left, right) {
        if (left === 0 || right === 0) {
          return 0;
        }
        return GF_EXP[GF_LOG[left] + GF_LOG[right]];
      }

      function polyMultiply(left, right) {
        const output = new Array(left.length + right.length - 1).fill(0);
        for (let i = 0; i < left.length; i += 1) {
          for (let j = 0; j < right.length; j += 1) {
            output[i + j] ^= gfMultiply(left[i], right[j]);
          }
        }
        return output;
      }

      function getGeneratorPolynomial(degree) {
        if (GENERATOR_CACHE[degree]) {
          return GENERATOR_CACHE[degree];
        }
        let polynomial = [1];
        for (let index = 0; index < degree; index += 1) {
          polynomial = polyMultiply(polynomial, [1, GF_EXP[index]]);
        }
        GENERATOR_CACHE[degree] = polynomial;
        return polynomial;
      }

      function rsEncodeBlock(dataBlock, ecCount) {
        const generator = getGeneratorPolynomial(ecCount);
        const message = dataBlock.slice();
        for (let i = 0; i < ecCount; i += 1) {
          message.push(0);
        }
        for (let i = 0; i < dataBlock.length; i += 1) {
          const factor = message[i];
          if (factor === 0) {
            continue;
          }
          for (let j = 0; j < generator.length; j += 1) {
            message[i + j] ^= gfMultiply(generator[j], factor);
          }
        }
        return message.slice(message.length - ecCount);
      }

      function getBlocks(version, level) {
        const spec = RS_BLOCK_TABLE[(version - 1) * 4 + LEVEL_INDEX[level]];
        const blocks = [];
        for (let i = 0; i < spec.length; i += 3) {
          const count = spec[i];
          const totalCount = spec[i + 1];
          const dataCount = spec[i + 2];
          for (let j = 0; j < count; j += 1) {
            blocks.push({ totalCount: totalCount, dataCount: dataCount });
          }
        }
        return blocks;
      }

      function appendBits(bitBuffer, value, length) {
        for (let bit = length - 1; bit >= 0; bit -= 1) {
          bitBuffer.push((value >>> bit) & 1);
        }
      }

      function bitsToBytes(bitBuffer) {
        const output = [];
        for (let index = 0; index < bitBuffer.length; index += 8) {
          let value = 0;
          for (let bit = 0; bit < 8; bit += 1) {
            value = (value << 1) | (bitBuffer[index + bit] || 0);
          }
          output.push(value);
        }
        return output;
      }

      function chooseVersion(byteLength, level) {
        for (let version = 1; version <= 10; version += 1) {
          const blocks = getBlocks(version, level);
          const dataCapacityBytes = blocks.reduce(function(sum, block) {
            return sum + block.dataCount;
          }, 0);
          const characterCountBits = version <= 9 ? 8 : 16;
          const neededBits = 4 + characterCountBits + byteLength * 8;
          if (neededBits <= dataCapacityBytes * 8) {
            return version;
          }
        }
        throw new Error('Content is too long for QR versions 1–10 at level ' + level + '.');
      }

      function createDataCodewords(bytes, version, level) {
        const blocks = getBlocks(version, level);
        const capacityBytes = blocks.reduce(function(sum, block) {
          return sum + block.dataCount;
        }, 0);
        const totalBits = capacityBytes * 8;
        const bitBuffer = [];
        appendBits(bitBuffer, 0b0100, 4);
        appendBits(bitBuffer, bytes.length, version <= 9 ? 8 : 16);
        bytes.forEach(function(byte) {
          appendBits(bitBuffer, byte, 8);
        });
        if (bitBuffer.length > totalBits) {
          throw new Error('Input does not fit in the chosen QR version.');
        }
        appendBits(bitBuffer, 0, Math.min(4, totalBits - bitBuffer.length));
        while (bitBuffer.length % 8 !== 0) {
          bitBuffer.push(0);
        }
        const pads = [0xEC, 0x11];
        let padIndex = 0;
        while (bitBuffer.length < totalBits) {
          appendBits(bitBuffer, pads[padIndex % 2], 8);
          padIndex += 1;
        }
        return bitsToBytes(bitBuffer);
      }

      function createFinalCodewords(bytes, version, level) {
        const blocks = getBlocks(version, level);
        const dataCodewords = createDataCodewords(bytes, version, level);
        const dataBlocks = [];
        const ecBlocks = [];
        let offset = 0;
        let maxDataLength = 0;
        let maxEcLength = 0;

        blocks.forEach(function(block) {
          const dataBlock = dataCodewords.slice(offset, offset + block.dataCount);
          const ecCount = block.totalCount - block.dataCount;
          offset += block.dataCount;
          dataBlocks.push(dataBlock);
          ecBlocks.push(rsEncodeBlock(dataBlock, ecCount));
          maxDataLength = Math.max(maxDataLength, dataBlock.length);
          maxEcLength = Math.max(maxEcLength, ecCount);
        });

        const finalCodewords = [];
        for (let i = 0; i < maxDataLength; i += 1) {
          dataBlocks.forEach(function(block) {
            if (i < block.length) {
              finalCodewords.push(block[i]);
            }
          });
        }
        for (let i = 0; i < maxEcLength; i += 1) {
          ecBlocks.forEach(function(block) {
            if (i < block.length) {
              finalCodewords.push(block[i]);
            }
          });
        }
        return finalCodewords;
      }

      function createMatrix(size) {
        return Array.from({ length: size }, function() {
          return new Array(size).fill(false);
        });
      }

      function placeFinderPattern(modules, reserved, row, col) {
        const size = modules.length;
        for (let r = -1; r <= 7; r += 1) {
          for (let c = -1; c <= 7; c += 1) {
            const rr = row + r;
            const cc = col + c;
            if (rr < 0 || rr >= size || cc < 0 || cc >= size) {
              continue;
            }
            const isSeparator = r === -1 || r === 7 || c === -1 || c === 7;
            const isOuter = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            modules[rr][cc] = !isSeparator && (isOuter || isInner);
            reserved[rr][cc] = true;
          }
        }
      }

      function placeAlignmentPattern(modules, reserved, row, col) {
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            modules[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
            reserved[row + r][col + c] = true;
          }
        }
      }

      function placeAlignmentPatterns(modules, reserved, version) {
        const positions = ALIGNMENT_POSITIONS[version - 1];
        if (!positions.length) {
          return;
        }
        positions.forEach(function(row) {
          positions.forEach(function(col) {
            if (reserved[row][col]) {
              return;
            }
            placeAlignmentPattern(modules, reserved, row, col);
          });
        });
      }

      function placeTimingPatterns(modules, reserved) {
        const size = modules.length;
        for (let index = 8; index < size - 8; index += 1) {
          if (!reserved[6][index]) {
            modules[6][index] = index % 2 === 0;
            reserved[6][index] = true;
          }
          if (!reserved[index][6]) {
            modules[index][6] = index % 2 === 0;
            reserved[index][6] = true;
          }
        }
      }

      function reserveFormatAreas(reserved) {
        const size = reserved.length;
        for (let index = 0; index < 9; index += 1) {
          if (index !== 6) {
            reserved[8][index] = true;
            reserved[index][8] = true;
          }
        }
        for (let index = 0; index < 8; index += 1) {
          reserved[8][size - 1 - index] = true;
          reserved[size - 1 - index][8] = true;
        }
      }

      function reserveVersionAreas(reserved, version) {
        if (version < 7) {
          return;
        }
        const size = reserved.length;
        for (let row = 0; row < 6; row += 1) {
          for (let col = 0; col < 3; col += 1) {
            reserved[row][size - 11 + col] = true;
            reserved[size - 11 + col][row] = true;
          }
        }
      }

      function placeDarkModule(modules, reserved) {
        const row = modules.length - 8;
        modules[row][8] = true;
        reserved[row][8] = true;
      }

      function placeDataBits(modules, reserved, codewords) {
        const size = modules.length;
        const bits = [];
        codewords.forEach(function(codeword) {
          for (let bit = 7; bit >= 0; bit -= 1) {
            bits.push((codeword >>> bit) & 1);
          }
        });
        let bitIndex = 0;
        let upward = true;

        for (let col = size - 1; col > 0; col -= 2) {
          if (col === 6) {
            col -= 1;
          }
          for (let i = 0; i < size; i += 1) {
            const row = upward ? size - 1 - i : i;
            for (let pair = 0; pair < 2; pair += 1) {
              const currentCol = col - pair;
              if (reserved[row][currentCol]) {
                continue;
              }
              const bit = bitIndex < bits.length ? bits[bitIndex] : 0;
              modules[row][currentCol] = bit === 1;
              bitIndex += 1;
            }
          }
          upward = !upward;
        }
      }

      function buildBaseMatrix(version, codewords) {
        const size = version * 4 + 17;
        const modules = createMatrix(size);
        const reserved = Array.from({ length: size }, function() {
          return new Array(size).fill(false);
        });

        placeFinderPattern(modules, reserved, 0, 0);
        placeFinderPattern(modules, reserved, size - 7, 0);
        placeFinderPattern(modules, reserved, 0, size - 7);
        placeAlignmentPatterns(modules, reserved, version);
        placeTimingPatterns(modules, reserved);
        reserveFormatAreas(reserved);
        reserveVersionAreas(reserved, version);
        placeDarkModule(modules, reserved);
        placeDataBits(modules, reserved, codewords);

        return { modules: modules, reserved: reserved };
      }

      function shouldMask(maskPattern, row, col) {
        switch (maskPattern) {
          case 0: return (row + col) % 2 === 0;
          case 1: return row % 2 === 0;
          case 2: return col % 3 === 0;
          case 3: return (row + col) % 3 === 0;
          case 4: return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
          case 5: return ((row * col) % 2) + ((row * col) % 3) === 0;
          case 6: return ((((row * col) % 2) + ((row * col) % 3)) % 2) === 0;
          case 7: return ((((row + col) % 2) + ((row * col) % 3)) % 2) === 0;
          default: return false;
        }
      }

      function cloneMatrix(modules) {
        return modules.map(function(row) { return row.slice(); });
      }

      function bitLength(value) {
        let length = 0;
        let current = value;
        while (current > 0) {
          length += 1;
          current >>>= 1;
        }
        return length;
      }

      function computeBch(data, polynomial, polynomialLength) {
        let value = data << (polynomialLength - 1);
        while (bitLength(value) >= polynomialLength) {
          value ^= polynomial << (bitLength(value) - polynomialLength);
        }
        return value;
      }

      function getFormatBits(level, maskPattern) {
        const formatData = (LEVEL_FORMAT_BITS[level] << 3) | maskPattern;
        return ((formatData << 10) | computeBch(formatData, 0x537, 11)) ^ 0x5412;
      }

      function getVersionBits(version) {
        return (version << 12) | computeBch(version, 0x1F25, 13);
      }

      function addFormatInfo(modules, level, maskPattern) {
        const bits = getFormatBits(level, maskPattern);
        const size = modules.length;
        for (let i = 0; i < 15; i += 1) {
          const bit = ((bits >>> i) & 1) === 1;
          if (i < 6) {
            modules[i][8] = bit;
          } else if (i < 8) {
            modules[i + 1][8] = bit;
          } else {
            modules[size - 15 + i][8] = bit;
          }

          if (i < 8) {
            modules[8][size - i - 1] = bit;
          } else if (i < 9) {
            modules[8][7] = bit;
          } else {
            modules[8][15 - i - 1] = bit;
          }
        }
      }

      function addVersionInfo(modules, version) {
        if (version < 7) {
          return;
        }
        const bits = getVersionBits(version);
        const size = modules.length;
        for (let i = 0; i < 18; i += 1) {
          const bit = ((bits >>> i) & 1) === 1;
          const row = Math.floor(i / 3);
          const col = size - 11 + (i % 3);
          modules[row][col] = bit;
          modules[col][row] = bit;
        }
      }

      function applyMask(modules, reserved, maskPattern) {
        const output = cloneMatrix(modules);
        for (let row = 0; row < output.length; row += 1) {
          for (let col = 0; col < output.length; col += 1) {
            if (!reserved[row][col] && shouldMask(maskPattern, row, col)) {
              output[row][col] = !output[row][col];
            }
          }
        }
        return output;
      }

      function scoreRuns(line) {
        let penalty = 0;
        let runColor = line[0];
        let runLength = 1;
        for (let i = 1; i < line.length; i += 1) {
          if (line[i] === runColor) {
            runLength += 1;
          } else {
            if (runLength >= 5) {
              penalty += 3 + (runLength - 5);
            }
            runColor = line[i];
            runLength = 1;
          }
        }
        if (runLength >= 5) {
          penalty += 3 + (runLength - 5);
        }
        return penalty;
      }

      function scorePattern(line) {
        const lineString = line.map(function(bit) { return bit ? '1' : '0'; }).join('');
        let penalty = 0;
        for (let index = 0; index <= lineString.length - 11; index += 1) {
          const slice = lineString.slice(index, index + 11);
          if (slice === '10111010000' || slice === '00001011101') {
            penalty += 40;
          }
        }
        return penalty;
      }

      function getPenaltyScore(modules) {
        const size = modules.length;
        let penalty = 0;
        let darkCount = 0;

        for (let row = 0; row < size; row += 1) {
          penalty += scoreRuns(modules[row]);
          penalty += scorePattern(modules[row]);
        }

        for (let col = 0; col < size; col += 1) {
          const column = [];
          for (let row = 0; row < size; row += 1) {
            column.push(modules[row][col]);
          }
          penalty += scoreRuns(column);
          penalty += scorePattern(column);
        }

        for (let row = 0; row < size - 1; row += 1) {
          for (let col = 0; col < size - 1; col += 1) {
            const color = modules[row][col];
            if (modules[row][col + 1] === color && modules[row + 1][col] === color && modules[row + 1][col + 1] === color) {
              penalty += 3;
            }
          }
        }

        for (let row = 0; row < size; row += 1) {
          for (let col = 0; col < size; col += 1) {
            if (modules[row][col]) {
              darkCount += 1;
            }
          }
        }

        const percentDark = (darkCount / (size * size)) * 100;
        penalty += Math.floor(Math.abs(percentDark - 50) / 5) * 10;
        return penalty;
      }

      function pickBestMatrix(baseMatrix, reserved, version, level) {
        let bestMatrix = null;
        let bestMask = 0;
        let bestPenalty = Infinity;

        for (let mask = 0; mask < 8; mask += 1) {
          const candidate = applyMask(baseMatrix, reserved, mask);
          addFormatInfo(candidate, level, mask);
          addVersionInfo(candidate, version);
          const penalty = getPenaltyScore(candidate);
          if (penalty < bestPenalty) {
            bestPenalty = penalty;
            bestMask = mask;
            bestMatrix = candidate;
          }
        }

        return { matrix: bestMatrix, mask: bestMask };
      }

      function encodeText(text, level) {
        const bytes = Array.from(new TextEncoder().encode(text));
        if (!bytes.length) {
          throw new Error('Enter some text or a URL to encode.');
        }
        const version = chooseVersion(bytes.length, level);
        const codewords = createFinalCodewords(bytes, version, level);
        const base = buildBaseMatrix(version, codewords);
        const best = pickBestMatrix(base.modules, base.reserved, version, level);
        return {
          matrix: best.matrix,
          version: version,
          mask: best.mask,
          moduleCount: best.matrix.length,
          byteLength: bytes.length
        };
      }

      function roundRectPath(ctx, x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
      }

      function drawModule(ctx, row, col, quietZone, moduleSize, color) {
        const x = Math.round((col + quietZone) * moduleSize);
        const y = Math.round((row + quietZone) * moduleSize);
        const nextX = Math.round((col + quietZone + 1) * moduleSize);
        const nextY = Math.round((row + quietZone + 1) * moduleSize);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, Math.max(1, nextX - x), Math.max(1, nextY - y));
      }

      function redrawCentralAlignmentIfNeeded(ctx, matrix, foreground, background, quietZone, moduleSize) {
        const version = Math.round((matrix.length - 17) / 4);
        const positions = ALIGNMENT_POSITIONS[version - 1] || [];
        if (positions.length < 3) {
          return;
        }
        const center = positions[Math.floor(positions.length / 2)];
        for (let row = center - 3; row <= center + 3; row += 1) {
          for (let col = center - 3; col <= center + 3; col += 1) {
            if (row < 0 || row >= matrix.length || col < 0 || col >= matrix.length) {
              continue;
            }
            drawModule(ctx, row, col, quietZone, moduleSize, matrix[row][col] ? foreground : background);
          }
        }
      }

      function renderToCanvas(canvas, matrix, size, foreground, background, logoImage, logoScale) {
        const pixelRatio = window.devicePixelRatio || 1;
        const ctx = canvas.getContext('2d');
        canvas.width = Math.round(size * pixelRatio);
        canvas.height = Math.round(size * pixelRatio);
        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, size, size);

        const quietZone = 4;
        const totalModules = matrix.length + quietZone * 2;
        const moduleSize = size / totalModules;

        ctx.fillStyle = foreground;
        for (let row = 0; row < matrix.length; row += 1) {
          for (let col = 0; col < matrix.length; col += 1) {
            if (!matrix[row][col]) {
              continue;
            }
            drawModule(ctx, row, col, quietZone, moduleSize, foreground);
          }
        }

        if (logoImage) {
          const safeScale = Math.max(0.1, Math.min(0.2, Number(logoScale) || 0.16));
          const logoTarget = size * safeScale;
          const logoBox = logoTarget * 1.22;
          const boxX = (size - logoBox) / 2;
          const boxY = (size - logoBox) / 2;
          ctx.fillStyle = 'rgba(255,255,255,0.96)';
          roundRectPath(ctx, boxX, boxY, logoBox, logoBox, Math.max(12, logoBox * 0.14));
          ctx.fill();

          const scale = Math.min(logoTarget / logoImage.width, logoTarget / logoImage.height, 1);
          const drawWidth = logoImage.width * scale;
          const drawHeight = logoImage.height * scale;
          ctx.drawImage(logoImage, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);
          redrawCentralAlignmentIfNeeded(ctx, matrix, foreground, background, quietZone, moduleSize);
        }
      }

      return {
        encodeText: encodeText,
        renderToCanvas: renderToCanvas
      };
    })();

    const contentInput = document.getElementById('contentInput');
    const sizeSlider = document.getElementById('sizeSlider');
    const sizeLabel = document.getElementById('sizeLabel');
    const levelSelect = document.getElementById('levelSelect');
    const logoInput = document.getElementById('logoInput');
    const foregroundPicker = document.getElementById('foregroundPicker');
    const backgroundPicker = document.getElementById('backgroundPicker');
    const generateButton = document.getElementById('generateButton');
    const downloadButton = document.getElementById('downloadButton');
    const clearLogoButton = document.getElementById('clearLogoButton');
    const statusBox = document.getElementById('statusBox');
    const logoStatus = document.getElementById('logoStatus');
    const qrCanvas = document.getElementById('qrCanvas');
    const versionValue = document.getElementById('versionValue');
    const maskValue = document.getElementById('maskValue');
    const modulesValue = document.getElementById('modulesValue');
    const bytesValue = document.getElementById('bytesValue');

    const state = {
      logoImage: null,
      hasRendered: false,
      currentName: 'qr-code.png'
    };

    function setStatus(message, isError) {
      statusBox.textContent = message;
      statusBox.className = isError ? 'status error' : 'status';
    }

    function updateSizeLabel() {
      sizeLabel.textContent = sizeSlider.value + ' px';
    }

    function slugifyFileName(text) {
      const slug = String(text || 'qr-code')
        .trim()
        .toLowerCase()
        .replace(/https?:\/\//g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
      return (slug || 'qr-code') + '.png';
    }

    function recommendedLogoScale(level, moduleCount) {
      const baseByLevel = { L: 0.12, M: 0.14, Q: 0.16, H: 0.18 };
      let scale = baseByLevel[level] || 0.14;
      if (moduleCount >= 33) {
        scale += 0.02;
      } else if (moduleCount >= 25) {
        scale += 0.01;
      }
      if (moduleCount <= 21) {
        scale = Math.min(scale, 0.13);
      } else if (moduleCount <= 25) {
        scale = Math.min(scale, 0.15);
      }
      return Math.max(0.1, Math.min(0.2, scale));
    }

    function loadLogoFile(file) {
      return new Promise(function(resolve, reject) {
        const reader = new FileReader();
        reader.onload = function() {
          const image = new Image();
          image.onload = function() { resolve(image); };
          image.onerror = function() { reject(new Error('The logo image could not be loaded.')); };
          image.src = reader.result;
        };
        reader.onerror = function() {
          reject(new Error('The logo file could not be read.'));
        };
        reader.readAsDataURL(file);
      });
    }

    async function renderQr(fromLivePreview) {
      const text = contentInput.value.trim();
      if (!text) {
        setStatus('Enter some text or a URL to encode.', true);
        return;
      }
      try {
        const result = QRCore.encodeText(text, levelSelect.value);
        const size = Number(sizeSlider.value);
        const logoScale = state.logoImage ? recommendedLogoScale(levelSelect.value, result.moduleCount) : 0;
        QRCore.renderToCanvas(qrCanvas, result.matrix, size, foregroundPicker.value, backgroundPicker.value, state.logoImage, logoScale);
        versionValue.textContent = 'V' + result.version;
        maskValue.textContent = 'Mask ' + result.mask;
        modulesValue.textContent = result.moduleCount + ' × ' + result.moduleCount;
        bytesValue.textContent = String(result.byteLength);
        downloadButton.disabled = false;
        state.hasRendered = true;
        state.currentName = slugifyFileName(text);
        let message = (fromLivePreview ? 'Preview updated. ' : 'QR code generated. ') + 'Version ' + result.version + ' with mask pattern ' + result.mask + '.';
        if (state.logoImage) {
          message += ' Logo scaled to ' + Math.round(logoScale * 100) + '% for this QR density.';
        }
        setStatus(message, false);
      } catch (error) {
        console.error(error);
        downloadButton.disabled = true;
        setStatus(error && error.message ? error.message : 'Could not generate that QR code.', true);
      }
    }

    function maybeLivePreview() {
      if (state.hasRendered || contentInput.value.trim()) {
        renderQr(true);
      }
    }

    sizeSlider.addEventListener('input', function() {
      updateSizeLabel();
      maybeLivePreview();
    });

    [contentInput, levelSelect, foregroundPicker, backgroundPicker].forEach(function(element) {
      element.addEventListener('input', maybeLivePreview);
      element.addEventListener('change', maybeLivePreview);
    });

    generateButton.addEventListener('click', function() {
      renderQr(false);
    });

    downloadButton.addEventListener('click', function() {
      const anchor = document.createElement('a');
      anchor.href = qrCanvas.toDataURL('image/png');
      anchor.download = state.currentName;
      anchor.click();
    });

    clearLogoButton.addEventListener('click', function() {
      state.logoImage = null;
      logoInput.value = '';
      logoStatus.textContent = 'No logo loaded';
      maybeLivePreview();
    });

    logoInput.addEventListener('change', async function(event) {
      const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
      if (!file) {
        return;
      }
      try {
        state.logoImage = await loadLogoFile(file);
        logoStatus.textContent = 'Logo loaded: ' + file.name;
        maybeLivePreview();
      } catch (error) {
        console.error(error);
        state.logoImage = null;
        logoStatus.textContent = 'No logo loaded';
        setStatus(error && error.message ? error.message : 'Could not load the logo image.', true);
      }
    });

    updateSizeLabel();
    renderQr(false);
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() }
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function textHeaders() {
  return { 'Content-Type': 'text/plain;charset=UTF-8', ...corsHeaders() };
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json;charset=UTF-8', ...corsHeaders() };
}
