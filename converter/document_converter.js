addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Use POST with { markdown, outputFormat }' }), { status: 400, headers: jsonHeaders() });
  }
  try {
    const { markdown, outputFormat = 'html' } = await request.json();
    
    if (!markdown) {
      return new Response(JSON.stringify({ error: 'Missing markdown' }), { status: 400, headers: jsonHeaders() });
    }

    if (outputFormat === 'html') {
      const html = convertMarkdownToHTML(markdown);
      return new Response(JSON.stringify({ 
        result: html,
        format: 'html',
        contentType: 'text/html'
      }), { status: 200, headers: jsonHeaders() });
    } else if (outputFormat === 'pdf') {
      // For PDF conversion, we'd need to use external services
      // For now, return the HTML with PDF generation instructions
      const html = convertMarkdownToHTML(markdown);
      return new Response(JSON.stringify({ 
        result: `PDF conversion would be handled by an external service. HTML preview:\n\n${html}`,
        format: 'pdf_info',
        contentType: 'text/plain'
      }), { status: 200, headers: jsonHeaders() });
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported outputFormat. Use "html" or "pdf"' }), { status: 400, headers: jsonHeaders() });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

function convertMarkdownToHTML(markdown) {
  let html = markdown;
  
  // Convert headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Convert bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
  
  // Convert italic
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
  html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
  
  // Convert inline code
  html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
  
  // Convert code blocks
  html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
  
  // Convert links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2">$1</a>');
  
  // Convert unordered lists
  html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/gims, '<ul>$&</ul>');
  
  // Convert ordered lists
  html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\s*)+/gims, '<ol>$&</ol>');
  
  // Convert paragraphs
  html = html.replace(/\n\n/gim, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/gim, '');
  html = html.replace(/<p>(<h[1-6]>)/gim, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/gim, '$1');
  html = html.replace(/<p>(<pre>)/gim, '$1');
  html = html.replace(/(<\/pre>)<\/p>/gim, '$1');
  
  return html;
}

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