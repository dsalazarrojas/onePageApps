addEventListener('fetch',event=>event.respondWith(handleRequest(event.request)));
async function handleRequest(request){
  const url=new URL(request.url);
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:corsHeaders()});
  if(url.pathname==='/widget.js') return new Response(widgetJS(),{headers:jsH()});
  
  return new Response(pageHTML(),{headers:htmlH()});
}

function widgetJS(){
  return `(function(){var s=document.currentScript;var base=(s&&s.src||'').replace(/\\/widget\\.js.*/,'');var el=document.createElement('iframe');el.src=base+'/';el.style.cssText='width:100%;height:540px;border:none;border-radius:8px;';el.title='Readability Score';(s&&s.parentNode||document.body).appendChild(el);})()`  ;
}
function fleschScore(text){
  var sentences=(text.match(/[.!?]+/g)||[]).length||1;
  var words=text.trim().split(/\s+/).length||1;
  var syllables=countSyllables(text);
  return 206.835-(1.015*(words/sentences))-(84.6*(syllables/words));
}
function countSyllables(text){
  return (text.toLowerCase().match(/[aeiouy]+/g)||[]).length;
}
function gradeLevel(score){
  if(score>=90) return 'Very Easy (5th grade)';
  if(score>=80) return 'Easy (6th grade)';
  if(score>=70) return 'Fairly Easy (7th grade)';
  if(score>=60) return 'Standard (8-9th grade)';
  if(score>=50) return 'Fairly Difficult (10-12th grade)';
  if(score>=30) return 'Difficult (College)';
  return 'Very Difficult (College graduate)';
}
function pageHTML(){
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Readability Score</title>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;max-width:680px;margin:0 auto;padding:20px 16px;background:#f5f7fa}h1{font-size:1.35rem}textarea{width:100%;padding:10px;border:1px solid #ccc;border-radius:6px;font-size:.9rem;resize:vertical}button{margin-top:10px;padding:10px 22px;background:#1a73e8;color:#fff;border:none;border-radius:6px;cursor:pointer}.score-box{margin-top:16px;background:#fff;border-radius:10px;padding:20px;border:1px solid #e5e7eb;display:none}.big{font-size:3rem;font-weight:700;color:#1a73e8;display:block}.stat{font-size:.85rem;color:#555;margin:4px 0}.grade{font-size:1.1rem;font-weight:600;margin-top:8px;color:#374151}</style></head><body>
<h1>📖 Readability Score</h1>
<textarea id="txt" rows="8" placeholder="Paste your text here to analyse readability…"></textarea>
<button onclick="score()">Analyse</button>
<div class="score-box" id="box">
  <span class="big" id="fs">0</span>
  <div class="grade" id="grade"></div>
  <div class="stat" id="words"></div>
  <div class="stat" id="sents"></div>
  <div class="stat" id="syllables"></div>
  <div class="stat" id="avgws"></div>
</div>
<script>
function score(){
  var t=document.getElementById('txt').value.trim();
  if(!t)return;
  var words=t.split(/\s+/).length;
  var sentences=(t.match(/[.!?]+/g)||[]).length||1;
  var syllables=(t.toLowerCase().match(/[aeiouy]+/g)||[]).length;
  var fk=206.835-(1.015*(words/sentences))-(84.6*(syllables/words));
  fk=Math.max(0,Math.min(100,fk));
  function grade(s){if(s>=90)return'Very Easy (5th grade)';if(s>=80)return'Easy (6th grade)';if(s>=70)return'Fairly Easy (7th grade)';if(s>=60)return'Standard (8-9th grade)';if(s>=50)return'Fairly Difficult (10-12th grade)';if(s>=30)return'Difficult (College)';return'Very Difficult (College graduate)';}
  document.getElementById('fs').textContent=fk.toFixed(1);
  document.getElementById('grade').textContent=grade(fk);
  document.getElementById('words').textContent='Words: '+words;
  document.getElementById('sents').textContent='Sentences: '+sentences;
  document.getElementById('syllables').textContent='Syllables: '+syllables;
  document.getElementById('avgws').textContent='Avg words/sentence: '+(words/sentences).toFixed(1);
  document.getElementById('box').style.display='block';
}
</script></body></html>`;
}

function corsHeaders(){return{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'};}
function htmlH(){return{...corsHeaders(),'Content-Type':'text/html;charset=UTF-8'};}
function jsH(){return{...corsHeaders(),'Content-Type':'application/javascript;charset=UTF-8'};}
function jsonH(){return{...corsHeaders(),'Content-Type':'application/json'};}
