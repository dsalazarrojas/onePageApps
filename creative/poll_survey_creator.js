addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Route handling
  if (path === '/') {
    return serveSurveyForm();
  } else if (path === '/submit' && request.method === 'POST') {
    return handleSurveySubmission(request);
  } else if (path === '/results' && request.method === 'GET') {
    return serveSurveyResults();
  } else {
    return new Response('Not Found', { status: 404, headers: textHeaders() });
  }
}

async function serveSurveyForm() {
  try {
    const surveyConfig = SURVEY_CONFIG ? JSON.parse(SURVEY_CONFIG) : null;
    
    if (!surveyConfig) {
      return new Response(`
        <html>
        <body>
          <h1>Survey Not Found</h1>
          <p>This survey has expired or doesn't exist.</p>
        </body>
        </html>
      `, { status: 404, headers: textHeaders() });
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${surveyConfig.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .question {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
        }
        .option {
            margin: 10px 0;
        }
        button {
            background: #007bff;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${surveyConfig.title}</h1>
        <p>${surveyConfig.description || ''}</p>
        <form id="surveyForm">
            ${surveyConfig.questions.map((q, qIndex) => `
                <div class="question">
                    <h3>${qIndex + 1}. ${q.text}</h3>
                    ${q.type === 'single' ? q.options.map((option, oIndex) => `
                        <div class="option">
                            <input type="radio" name="q${qIndex}" value="${option}" id="q${qIndex}o${oIndex}">
                            <label for="q${qIndex}o${oIndex}">${option}</label>
                        </div>
                    `).join('') : q.type === 'multiple' ? q.options.map((option, oIndex) => `
                        <div class="option">
                            <input type="checkbox" name="q${qIndex}" value="${option}" id="q${qIndex}o${oIndex}">
                            <label for="q${qIndex}o${oIndex}">${option}</label>
                        </div>
                    `).join('') : `
                        <textarea name="q${qIndex}" rows="4" style="width: 100%;"></textarea>
                    `}
                </div>
            `).join('')}
            <button type="submit">Submit Survey</button>
        </form>
        <div id="result" style="margin-top: 20px; padding: 15px; background: #d4edda; border-radius: 5px; display: none;">
            <strong>Thank you!</strong> Your response has been recorded.
            <br><a href="/results">View Results</a>
        </div>
    </div>

    <script>
        document.getElementById('surveyForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const responses = {};
            
            ${surveyConfig.questions.map((q, qIndex) => `
                if ('${q.type}' === 'multiple') {
                    responses['${qIndex}'] = Array.from(formData.getAll('q${qIndex}'));
                } else {
                    responses['${qIndex}'] = formData.get('q${qIndex}');
                }
            `).join('\n            ')}

            try {
                const response = await fetch('/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ responses })
                });
                
                if (response.ok) {
                    this.style.display = 'none';
                    document.getElementById('result').style.display = 'block';
                }
            } catch (error) {
                alert('Error submitting survey');
            }
        });
    </script>
</body>
</html>`;

    return new Response(html, { status: 200, headers: textHeaders() });
  } catch (e) {
    return new Response('Error loading survey', { status: 500, headers: textHeaders() });
  }
}

async function handleSurveySubmission(request) {
  try {
    const { responses } = await request.json();
    const surveyId = SURVEY_ID || 'default';
    
    // Store response in KV
    await SURVEY_KV.put(`response_${surveyId}_${Date.now()}`, JSON.stringify({
      responses,
      timestamp: Date.now()
    }));

    // Update response count
    const responseCount = await SURVEY_KV.get(`response_count_${surveyId}`) || '0';
    await SURVEY_KV.put(`response_count_${surveyId}`, String(parseInt(responseCount) + 1));

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, 
      headers: jsonHeaders() 
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { 
      status: 500, 
      headers: jsonHeaders() 
    });
  }
}

async function serveSurveyResults() {
  try {
    const surveyConfig = SURVEY_CONFIG ? JSON.parse(SURVEY_CONFIG) : null;
    const surveyId = SURVEY_ID || 'default';
    
    if (!surveyConfig) {
      return new Response('Survey not found', { status: 404, headers: textHeaders() });
    }

    // Get all responses from KV
    const responses = await SURVEY_KV.list({ prefix: `response_${surveyId}_` });
    const responseCount = await SURVEY_KV.get(`response_count_${surveyId}`) || '0';
    
    const allResponses = await Promise.all(
      responses.keys.map(async key => {
        const data = await SURVEY_KV.get(key.name);
        return JSON.parse(data);
      })
    );

    // Calculate results
    let results = {};
    allResponses.forEach(response => {
      surveyConfig.questions.forEach((q, qIndex) => {
        if (!results[qIndex]) {
          results[qIndex] = {};
        }
        
        const userResponse = response.responses[qIndex.toString()];
        if (Array.isArray(userResponse)) {
          userResponse.forEach(ans => {
            results[qIndex][ans] = (results[qIndex][ans] || 0) + 1;
          });
        } else if (userResponse) {
          results[qIndex][userResponse] = (results[qIndex][userResponse] || 0) + 1;
        }
      });
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Survey Results - ${surveyConfig.title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; text-align: center; }
        .summary {
            text-align: center;
            margin: 20px 0;
            padding: 15px;
            background: #e9ecef;
            border-radius: 5px;
        }
        .question-result {
            margin: 30px 0;
            padding: 20px;
            border: 1px solid #dee2e6;
            border-radius: 5px;
        }
        .option-bar {
            margin: 10px 0;
            display: flex;
            align-items: center;
        }
        .option-text {
            width: 200px;
            font-weight: bold;
        }
        .bar {
            height: 25px;
            background: #007bff;
            color: white;
            text-align: center;
            line-height: 25px;
            margin-right: 10px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Survey Results</h1>
        <div class="summary">
            <h3>${responseCount} Total Responses</h3>
        </div>
        
        ${surveyConfig.questions.map((q, qIndex) => `
            <div class="question-result">
                <h3>${qIndex + 1}. ${q.text}</h3>
                ${Object.entries(results[qIndex] || {}).map(([option, count]) => {
                  const percentage = responseCount > 0 ? Math.round((count / responseCount) * 100) : 0;
                  return `
                    <div class="option-bar">
                        <div class="option-text">${option}</div>
                        <div class="bar" style="width: ${percentage}%;">${count} (${percentage}%)</div>
                    </div>
                  `;
                }).join('')}
            </div>
        `).join('')}
    </div>
</body>
</html>`;

    return new Response(html, { status: 200, headers: textHeaders() });
  } catch (e) {
    return new Response('Error loading results', { status: 500, headers: textHeaders() });
  }
}

function jsonHeaders() {
  return { 'Content-Type': 'application/json', ...corsHeaders() };
}

function textHeaders() {
  return { 'Content-Type': 'text/html', ...corsHeaders() };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}