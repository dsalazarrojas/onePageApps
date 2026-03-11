addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { 
      length = 16, 
      includeUppercase = true, 
      includeLowercase = true, 
      includeNumbers = true, 
      includeSymbols = true,
      excludeSimilar = false,
      count = 1
    } = await request.json();

    if (length < 4 || length > 128) {
      return new Response(JSON.stringify({ error: 'Length must be between 4 and 128' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    if (count < 1 || count > 100) {
      return new Response(JSON.stringify({ error: 'Count must be between 1 and 100' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
      return new Response(JSON.stringify({ error: 'At least one character type must be selected' }), { 
        status: 400, 
        headers: jsonHeaders() 
      });
    }

    const passwords = [];
    
    for (let i = 0; i < count; i++) {
      const password = generatePassword({
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar
      });
      passwords.push(password);
    }

    const strength = calculatePasswordStrength(passwords[0]);
    
    return new Response(JSON.stringify({ 
      passwords,
      strength,
      options: {
        length,
        includeUppercase,
        includeLowercase,
        includeNumbers,
        includeSymbols,
        excludeSimilar,
        count
      },
      timestamp: new Date().toISOString()
    }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

function generatePassword(options) {
  const {
    length,
    includeUppercase,
    includeLowercase,
    includeNumbers,
    includeSymbols,
    excludeSimilar
  } = options;

  let charset = '';
  
  if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeNumbers) charset += '0123456789';
  if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (excludeSimilar) {
    // Remove similar looking characters to avoid confusion
    charset = charset.replace(/[il1Lo0O]/g, '');
  }

  let password = '';
  
  // Ensure at least one character from each selected type
  const guaranteedChars = [];
  
  if (includeLowercase) guaranteedChars.push(getRandomChar('abcdefghijklmnopqrstuvwxyz'));
  if (includeUppercase) guaranteedChars.push(getRandomChar('ABCDEFGHIJKLMNOPQRSTUVWXYZ'));
  if (includeNumbers) guaranteedChars.push(getRandomChar('0123456789'));
  if (includeSymbols) guaranteedChars.push(getRandomChar('!@#$%^&*()_+-=[]{}|;:,.<>?'));

  // Fill the rest randomly
  while (password.length < length) {
    password += getRandomChar(charset);
  }

  // Shuffle and ensure guaranteed characters are included
  const allChars = password.split('');
  guaranteedChars.forEach(char => {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    allChars[randomIndex] = char;
  });

  // Shuffle the final password
  for (let i = allChars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allChars[i], allChars[j]] = [allChars[j], allChars[i]];
  }

  return allChars.slice(0, length).join('');
}

function getRandomChar(charset) {
  return charset.charAt(Math.floor(Math.random() * charset.length));
}

function calculatePasswordStrength(password) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSymbols: /[^A-Za-z0-9]/.test(password),
    longLength: password.length >= 12,
    veryLongLength: password.length >= 16
  };

  // Base scoring
  if (checks.length) score += 1;
  if (checks.hasLower) score += 1;
  if (checks.hasUpper) score += 1;
  if (checks.hasNumbers) score += 1;
  if (checks.hasSymbols) score += 1;
  
  // Bonus points
  if (checks.longLength) score += 1;
  if (checks.veryLongLength) score += 2;

  let strength = 'Very Weak';
  if (score >= 6) strength = 'Strong';
  else if (score >= 4) strength = 'Medium';
  else if (score >= 3) strength = 'Fair';

  return {
    score,
    strength,
    checks,
    tips: generatePasswordTips(checks)
  };
}

function generatePasswordTips(checks) {
  const tips = [];
  
  if (!checks.length) tips.push('Use at least 8 characters');
  if (!checks.hasLower) tips.push('Include lowercase letters');
  if (!checks.hasUpper) tips.push('Include uppercase letters');
  if (!checks.hasNumbers) tips.push('Include numbers');
  if (!checks.hasSymbols) tips.push('Include special characters');
  if (!checks.longLength) tips.push('Use 12+ characters for better security');
  
  return tips;
}

async function serveMainPage() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Generator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }

        .header p {
            font-size: 1.1em;
            opacity: 0.9;
        }

        .content {
            padding: 40px;
        }

        .form-section {
            margin-bottom: 30px;
        }

        .form-section h3 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.3em;
        }

        .form-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 0;
            border-bottom: 1px solid #eee;
        }

        .form-row:last-child {
            border-bottom: none;
        }

        .form-row label {
            font-weight: 600;
            color: #555;
        }

        .form-row input[type="number"] {
            width: 100px;
            padding: 8px 12px;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            font-size: 16px;
        }

        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
        }

        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .checkbox-item input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #667eea;
        }

        .checkbox-item label {
            font-weight: 500;
            cursor: pointer;
        }

        .generate-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 18px 40px;
            border-radius: 12px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
            margin: 20px 0;
            transition: transform 0.2s ease;
        }

        .generate-btn:hover {
            transform: translateY(-2px);
        }

        .result-section {
            margin-top: 30px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 12px;
            display: none;
        }

        .password-item {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 10px;
            border-left: 4px solid #667eea;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }

        .password-text {
            font-family: 'Courier New', monospace;
            font-size: 1.2em;
            color: #333;
            word-break: break-all;
            flex: 1;
            margin-right: 15px;
        }

        .password-actions {
            display: flex;
            gap: 10px;
        }

        .action-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s ease;
        }

        .action-btn:hover {
            background: #5a6fd8;
        }

        .copy-btn {
            background: #28a745;
        }

        .copy-btn:hover {
            background: #218838;
        }

        .strength-indicator {
            margin: 20px 0;
            padding: 15px;
            background: white;
            border-radius: 8px;
            border-left: 4px solid #28a745;
        }

        .strength-bar {
            height: 8px;
            background: #e9ecef;
            border-radius: 4px;
            overflow: hidden;
            margin: 10px 0;
        }

        .strength-fill {
            height: 100%;
            background: linear-gradient(90deg, #dc3545, #ffc107, #28a745);
            transition: width 0.3s ease;
            border-radius: 4px;
        }

        .strength-text {
            font-weight: 600;
            color: #333;
        }

        .tips {
            margin-top: 15px;
            padding: 10px;
            background: #fff3cd;
            border-radius: 6px;
            border-left: 4px solid #ffc107;
        }

        .tips ul {
            margin-left: 20px;
            color: #856404;
        }

        .tips li {
            margin: 5px 0;
        }

        @media (max-width: 768px) {
            .container {
                margin: 10px;
            }
            
            .header, .content {
                padding: 20px;
            }
            
            .password-item {
                flex-direction: column;
                align-items: stretch;
                gap: 15px;
            }
            
            .password-actions {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Generator</h1>
            <p>Generate secure, random passwords with customizable options</p>
        </div>

        <div class="content">
            <div class="form-section">
                <h3>Password Settings</h3>
                
                <div class="form-row">
                    <label for="length">Length:</label>
                    <input type="number" id="length" min="4" max="128" value="16">
                </div>

                <div class="form-row">
                    <label for="count">How many passwords:</label>
                    <input type="number" id="count" min="1" max="100" value="1">
                </div>

                <div class="form-row">
                    <label>Character Types:</label>
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="uppercase" checked>
                            <label for="uppercase">Uppercase (A-Z)</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="lowercase" checked>
                            <label for="lowercase">Lowercase (a-z)</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="numbers" checked>
                            <label for="numbers">Numbers (0-9)</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="symbols" checked>
                            <label for="symbols">Symbols (!@#$...)</label>
                        </div>
                    </div>
                </div>

                <div class="form-row">
                    <div class="checkbox-item">
                        <input type="checkbox" id="excludeSimilar">
                        <label for="excludeSimilar">Exclude similar characters (i, l, 1, L, o, 0, O)</label>
                    </div>
                </div>
            </div>

            <button class="generate-btn" onclick="generatePasswords()">
                🎲 Generate Secure Passwords
            </button>

            <div id="resultSection" class="result-section">
                <div id="strengthIndicator" class="strength-indicator"></div>
                <div id="passwordList"></div>
            </div>
        </div>
    </div>

    <script>
        async function generatePasswords() {
            const options = {
                length: parseInt(document.getElementById('length').value),
                count: parseInt(document.getElementById('count').value),
                includeUppercase: document.getElementById('uppercase').checked,
                includeLowercase: document.getElementById('lowercase').checked,
                includeNumbers: document.getElementById('numbers').checked,
                includeSymbols: document.getElementById('symbols').checked,
                excludeSimilar: document.getElementById('excludeSimilar').checked
            };

            try {
                const response = await fetch('/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(options)
                });

                const data = await response.json();

                if (response.ok) {
                    displayResults(data);
                } else {
                    alert('Error: ' + data.error);
                }
            } catch (error) {
                alert('Error generating passwords: ' + error.message);
            }
        }

        function displayResults(data) {
            const resultSection = document.getElementById('resultSection');
            const strengthIndicator = document.getElementById('strengthIndicator');
            const passwordList = document.getElementById('passwordList');

            // Display strength indicator
            const strength = data.strength;
            const percentage = (strength.score / 8) * 100;
            
            strengthIndicator.innerHTML = \`
                <div class="strength-text">Password Strength: \${strength.strength}</div>
                <div class="strength-bar">
                    <div class="strength-fill" style="width: \${percentage}%"></div>
                </div>
                \${strength.tips.length > 0 ? \`
                    <div class="tips">
                        <strong>Improvement tips:</strong>
                        <ul>
                            \${strength.tips.map(tip => \`<li>\${tip}</li>\`).join('')}
                        </ul>
                    </div>
                \` : ''}
            \`;

            // Display passwords
            passwordList.innerHTML = data.passwords.map((password, index) => \`
                <div class="password-item">
                    <div class="password-text">\${password}</div>
                    <div class="password-actions">
                        <button class="action-btn copy-btn" onclick="copyPassword('\${password}')">Copy</button>
                        <button class="action-btn" onclick="togglePassword('\${password}', this)">Hide</button>
                    </div>
                </div>
            \`).join('');

            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }

        function copyPassword(password) {
            navigator.clipboard.writeText(password).then(() => {
                // Show temporary feedback
                const buttons = document.querySelectorAll('.copy-btn');
                buttons.forEach(btn => {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    btn.style.background = '#28a745';
                    
                    setTimeout(() => {
                        btn.textContent = originalText;
                        btn.style.background = '#667eea';
                    }, 2000);
                });
            });
        }

        function togglePassword(password, button) {
            const passwordText = button.parentElement.previousElementSibling;
            
            if (button.textContent === 'Hide') {
                passwordText.textContent = '*'.repeat(password.length);
                button.textContent = 'Show';
            } else {
                passwordText.textContent = password;
                button.textContent = 'Hide';
            }
        }

        // Generate passwords on page load for demonstration
        generatePasswords();
    </script>
</body>
</html>`;

  return new Response(html, { status: 200, headers: textHeaders() });
}

        function displayResults(data) {
            const resultSection = document.getElementById('resultSection');
            const strengthIndicator = document.getElementById('strengthIndicator');
            const passwordList = document.getElementById('passwordList');

            // Display strength indicator (use textContent for safety)
            const strength = data.strength;
            const percentage = (strength.score / 8) * 100;

            // Clear and set strength content safely
            strengthIndicator.innerHTML = '';
            const strengthText = document.createElement('div');
            strengthText.className = 'strength-text';
            strengthText.textContent = `Password Strength: ${strength.strength}`;

            const strengthBar = document.createElement('div');
            strengthBar.className = 'strength-bar';
            const strengthFill = document.createElement('div');
            strengthFill.className = 'strength-fill';
            strengthFill.style.width = `${percentage}%`;
            strengthBar.appendChild(strengthFill);

            strengthIndicator.appendChild(strengthText);
            strengthIndicator.appendChild(strengthBar);

            if (strength.tips && strength.tips.length > 0) {
                const tipsWrap = document.createElement('div');
                tipsWrap.className = 'tips';
                const strong = document.createElement('strong');
                strong.textContent = 'Improvement tips:';
                const ul = document.createElement('ul');
                strength.tips.forEach(tip => {
                    const li = document.createElement('li');
                    li.textContent = tip;
                    ul.appendChild(li);
                });
                tipsWrap.appendChild(strong);
                tipsWrap.appendChild(ul);
                strengthIndicator.appendChild(tipsWrap);
            }

            // Build password items using DOM APIs to avoid inserting raw HTML
            passwordList.innerHTML = '';

            data.passwords.forEach((password) => {
                const item = document.createElement('div');
                item.className = 'password-item';

                const textDiv = document.createElement('div');
                textDiv.className = 'password-text';
                // Use textContent to avoid HTML injection (e.g. < or > in passwords)
                textDiv.textContent = password;

                const actions = document.createElement('div');
                actions.className = 'password-actions';

                const copyBtn = document.createElement('button');
                copyBtn.className = 'action-btn copy-btn';
                copyBtn.type = 'button';
                copyBtn.textContent = 'Copy';
                copyBtn.addEventListener('click', () => {
                    navigator.clipboard.writeText(password).then(() => {
                        const original = copyBtn.textContent;
                        copyBtn.textContent = 'Copied!';
                        copyBtn.style.background = '#28a745';
                        setTimeout(() => {
                            copyBtn.textContent = original;
                            copyBtn.style.background = '';
                        }, 2000);
                    }).catch(() => {
                        alert('Clipboard not available');
                    });
                });

                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'action-btn';
                toggleBtn.type = 'button';
                toggleBtn.textContent = 'Hide';
                toggleBtn.addEventListener('click', () => {
                    if (toggleBtn.textContent === 'Hide') {
                        textDiv.textContent = '*'.repeat(password.length);
                        toggleBtn.textContent = 'Show';
                    } else {
                        textDiv.textContent = password;
                        toggleBtn.textContent = 'Hide';
                    }
                });

                actions.appendChild(copyBtn);
                actions.appendChild(toggleBtn);

                item.appendChild(textDiv);
                item.appendChild(actions);

                passwordList.appendChild(item);
            });

            resultSection.style.display = 'block';
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Note: copy and toggle behavior is now attached directly to buttons created above.