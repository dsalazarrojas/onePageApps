addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return serveMainPage();
  }

  try {
    const { query } = await request.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing required field: query (string)' }), { status: 400, headers: jsonHeaders() });
    }

    const q = query.toLowerCase().trim();
    const results = EMOJIS.filter(e =>
      e.name.includes(q) || e.tags.some(t => t.includes(q)) || e.emoji === q
    ).slice(0, 80);

    return new Response(JSON.stringify({ results, query, total: results.length }), { status: 200, headers: jsonHeaders() });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || 'Unknown error' }), { status: 500, headers: jsonHeaders() });
  }
}

// Emoji dataset: [emoji, name, tags[]]
const EMOJIS = [
  ['😀','grinning face',['happy','smile','joy','face']],
  ['😃','grinning face with big eyes',['happy','smile','face']],
  ['😄','grinning face with smiling eyes',['happy','smile','joy','face']],
  ['😁','beaming face with smiling eyes',['happy','grin','face']],
  ['😆','grinning squinting face',['laugh','funny','lol','face']],
  ['😅','grinning face with sweat',['nervous','sweat','smile','face']],
  ['🤣','rolling on the floor laughing',['laugh','lol','funny','rofl']],
  ['😂','face with tears of joy',['laugh','cry','funny','lol','face']],
  ['🙂','slightly smiling face',['smile','happy','face']],
  ['🙃','upside-down face',['silly','sarcasm','smile','face']],
  ['😉','winking face',['wink','flirt','face']],
  ['😊','smiling face with smiling eyes',['blush','happy','smile','face']],
  ['😇','smiling face with halo',['angel','innocent','good','face']],
  ['🥰','smiling face with hearts',['love','heart','happy','face']],
  ['😍','smiling face with heart-eyes',['love','heart','adore','face']],
  ['🤩','star-struck',['excited','star','wow','face']],
  ['😘','face blowing a kiss',['kiss','love','flirt','face']],
  ['😗','kissing face',['kiss','face']],
  ['😚','kissing face with closed eyes',['kiss','love','face']],
  ['😙','kissing face with smiling eyes',['kiss','smile','face']],
  ['🥲','smiling face with tear',['happy cry','moved','face']],
  ['😋','face savoring food',['yum','delicious','hungry','face']],
  ['😛','face with tongue',['silly','tongue','face']],
  ['😜','winking face with tongue',['silly','wink','tongue','playful','face']],
  ['🤪','zany face',['crazy','silly','playful','face']],
  ['😝','squinting face with tongue',['silly','tongue','face']],
  ['🤑','money-mouth face',['money','rich','greedy','face']],
  ['🤗','hugging face',['hug','warm','friendly','face']],
  ['🤭','face with hand over mouth',['oops','secret','giggle','face']],
  ['🤫','shushing face',['quiet','secret','hush','face']],
  ['🤔','thinking face',['think','hmm','wonder','face']],
  ['🤐','zipper-mouth face',['silent','secret','mouth','face']],
  ['🤨','face with raised eyebrow',['suspicious','skeptical','face']],
  ['😐','neutral face',['blank','meh','face']],
  ['😑','expressionless face',['blank','meh','face']],
  ['😶','face without mouth',['silent','quiet','face']],
  ['😏','smirking face',['smirk','sly','face']],
  ['😒','unamused face',['bored','meh','face']],
  ['🙄','face with rolling eyes',['eye roll','annoyed','face']],
  ['😬','grimacing face',['nervous','awkward','face']],
  ['😔','pensive face',['sad','thoughtful','face']],
  ['😪','sleepy face',['sleep','tired','face']],
  ['🤤','drooling face',['hungry','drool','face']],
  ['😴','sleeping face',['sleep','zzz','face']],
  ['😷','face with medical mask',['sick','mask','covid','face']],
  ['🤒','face with thermometer',['sick','fever','ill','face']],
  ['🤕','face with head-bandage',['hurt','injury','face']],
  ['🤢','nauseated face',['sick','gross','face']],
  ['🤮','face vomiting',['sick','gross','face']],
  ['🤧','sneezing face',['sick','sneeze','cold','face']],
  ['🥵','hot face',['hot','heat','sweat','face']],
  ['🥶','cold face',['cold','freeze','face']],
  ['🥴','woozy face',['drunk','dizzy','face']],
  ['😵','dizzy face',['dizzy','confused','face']],
  ['🤯','exploding head',['mind blown','shocked','face']],
  ['🤠','cowboy hat face',['cowboy','western','face']],
  ['🥳','partying face',['party','celebrate','birthday','face']],
  ['🥸','disguised face',['disguise','glasses','spy','face']],
  ['😎','smiling face with sunglasses',['cool','sunglasses','face']],
  ['🤓','nerd face',['nerd','glasses','geek','face']],
  ['🧐','face with monocle',['curious','fancy','smart','face']],
  ['😕','confused face',['confused','unsure','face']],
  ['😟','worried face',['worried','anxious','face']],
  ['🙁','slightly frowning face',['sad','unhappy','face']],
  ['☹️','frowning face',['sad','unhappy','face']],
  ['😮','face with open mouth',['surprised','wow','face']],
  ['😯','hushed face',['surprised','shocked','face']],
  ['😲','astonished face',['amazed','shocked','face']],
  ['😳','flushed face',['embarrassed','blush','face']],
  ['🥺','pleading face',['begging','puppy eyes','cute','face']],
  ['😦','frowning face with open mouth',['sad','surprised','face']],
  ['😧','anguished face',['pain','distress','face']],
  ['😨','fearful face',['scared','fear','face']],
  ['😰','anxious face with sweat',['scared','nervous','face']],
  ['😥','sad but relieved face',['sad','relieved','face']],
  ['😢','crying face',['cry','sad','tear','face']],
  ['😭','loudly crying face',['sob','cry','sad','face']],
  ['😱','face screaming in fear',['scream','fear','shocked','face']],
  ['😖','confounded face',['confused','troubled','face']],
  ['😣','persevering face',['struggle','face']],
  ['😞','disappointed face',['sad','face']],
  ['😓','downcast face with sweat',['sad','tired','face']],
  ['😩','weary face',['tired','frustrated','face']],
  ['😫','tired face',['tired','exhausted','face']],
  ['🥱','yawning face',['tired','bored','yawn','face']],
  ['😤','face with steam from nose',['angry','frustrated','face']],
  ['😡','pouting face',['angry','mad','face']],
  ['😠','angry face',['angry','mad','face']],
  ['🤬','face with symbols on mouth',['angry','swear','face']],
  ['😈','smiling face with horns',['devil','evil','naughty','face']],
  ['👿','angry face with horns',['devil','evil','angry','face']],
  ['💀','skull',['death','dead','danger']],
  ['☠️','skull and crossbones',['death','poison','danger']],
  ['💩','pile of poo',['poop','funny','poo']],
  ['🤡','clown face',['clown','funny','circus','face']],
  ['👹','ogre',['monster','scary','face']],
  ['👺','goblin',['monster','red','face']],
  ['👻','ghost',['halloween','spooky','ghost']],
  ['👽','alien',['space','ufo','extraterrestrial']],
  ['👾','alien monster',['game','space','pixel']],
  ['🤖','robot',['robot','tech','ai','face']],
  ['❤️','red heart',['love','heart','romance']],
  ['🧡','orange heart',['love','heart','orange']],
  ['💛','yellow heart',['love','heart','yellow']],
  ['💚','green heart',['love','heart','green']],
  ['💙','blue heart',['love','heart','blue']],
  ['💜','purple heart',['love','heart','purple']],
  ['🖤','black heart',['dark','heart','edgy']],
  ['🤍','white heart',['love','heart','pure']],
  ['🤎','brown heart',['love','heart','brown']],
  ['💔','broken heart',['sad','love','heartbreak']],
  ['❣️','heart exclamation',['love','heart']],
  ['💕','two hearts',['love','heart','romance']],
  ['💞','revolving hearts',['love','heart']],
  ['💓','beating heart',['love','heart','pulse']],
  ['💗','growing heart',['love','heart']],
  ['💖','sparkling heart',['love','heart','sparkle']],
  ['💘','heart with arrow',['love','cupid','romance']],
  ['💝','heart with ribbon',['love','gift','heart']],
  ['💟','heart decoration',['love','heart']],
  ['☮️','peace symbol',['peace','hippie']],
  ['✝️','latin cross',['christian','religion','cross']],
  ['☯️','yin yang',['balance','zen','tao']],
  ['🕉️','om',['hinduism','meditation','yoga']],
  ['✡️','star of david',['jewish','religion','judaism']],
  ['🌈','rainbow',['rainbow','colorful','pride']],
  ['⭐','star',['star','favorite','rating']],
  ['🌟','glowing star',['star','sparkle','shine']],
  ['💫','dizzy',['star','dizzy','spin']],
  ['✨','sparkles',['sparkle','magic','shine']],
  ['🎉','party popper',['party','celebrate','birthday','confetti']],
  ['🎊','confetti ball',['party','celebrate','confetti']],
  ['🎁','wrapped gift',['gift','present','birthday','christmas']],
  ['🎂','birthday cake',['birthday','cake','celebration']],
  ['🍕','pizza',['food','pizza','cheese','italian']],
  ['🍔','hamburger',['food','burger','fast food']],
  ['🍟','french fries',['food','fries','fast food']],
  ['🌭','hot dog',['food','hotdog','sausage']],
  ['🌮','taco',['food','taco','mexican']],
  ['🌯','burrito',['food','burrito','mexican']],
  ['🍣','sushi',['food','sushi','japanese']],
  ['🍜','steaming bowl',['food','noodles','ramen','soup']],
  ['🍦','soft ice cream',['food','ice cream','dessert']],
  ['🍰','shortcake',['food','cake','dessert','birthday']],
  ['🍩','doughnut',['food','donut','dessert']],
  ['🍪','cookie',['food','cookie','dessert','sweet']],
  ['🍫','chocolate bar',['food','chocolate','dessert','sweet']],
  ['🍬','candy',['food','candy','sweet']],
  ['☕','hot beverage',['coffee','tea','hot','drink']],
  ['🍵','teacup without handle',['tea','drink','calm']],
  ['🧋','bubble tea',['drink','boba','tea']],
  ['🍺','beer mug',['beer','drink','alcohol','pub']],
  ['🍷','wine glass',['wine','drink','alcohol']],
  ['🥂','clinking glasses',['toast','celebrate','wine','party']],
  ['🐶','dog face',['dog','pet','animal']],
  ['🐱','cat face',['cat','pet','animal','kitten']],
  ['🐭','mouse face',['mouse','animal']],
  ['🐹','hamster',['hamster','pet','animal','cute']],
  ['🐰','rabbit face',['rabbit','bunny','animal','cute']],
  ['🦊','fox',['fox','animal','clever']],
  ['🐻','bear',['bear','animal']],
  ['🐼','panda',['panda','china','animal','cute']],
  ['🐨','koala',['koala','australia','animal','cute']],
  ['🐯','tiger face',['tiger','animal','fierce']],
  ['🦁','lion',['lion','king','animal']],
  ['🐸','frog',['frog','amphibian','animal']],
  ['🐔','chicken',['chicken','bird','animal','farm']],
  ['🐧','penguin',['penguin','bird','animal','cold']],
  ['🐦','bird',['bird','animal','tweet']],
  ['🦋','butterfly',['butterfly','insect','beautiful']],
  ['🐝','honeybee',['bee','insect','honey']],
  ['🌸','cherry blossom',['flower','pink','spring','sakura']],
  ['🌺','hibiscus',['flower','tropical','hawaii']],
  ['🌻','sunflower',['flower','sun','yellow','summer']],
  ['🌹','rose',['flower','love','romance','red']],
  ['🍀','four leaf clover',['lucky','clover','green','nature']],
  ['🌴','palm tree',['beach','tropical','vacation','tree']],
  ['🌵','cactus',['desert','cactus','plant']],
  ['🍁','maple leaf',['autumn','canada','fall','leaf']],
  ['🌊','water wave',['ocean','water','sea','surf']],
  ['🔥','fire',['fire','hot','flame','lit']],
  ['💧','droplet',['water','drop','blue']],
  ['❄️','snowflake',['cold','winter','snow','ice']],
  ['⚡','high voltage',['lightning','electric','fast','energy']],
  ['🌙','crescent moon',['moon','night','sleep']],
  ['☀️','sun',['sun','sunny','day','hot']],
  ['🌍','globe showing europe-africa',['earth','world','global']],
  ['🌎','globe showing americas',['earth','world','usa','global']],
  ['🏠','house',['home','house','building']],
  ['🏡','house with garden',['home','house','garden','suburban']],
  ['🚀','rocket',['rocket','space','launch','fast']],
  ['✈️','airplane',['plane','travel','flight','airport']],
  ['🚗','automobile',['car','drive','road','vehicle']],
  ['🚕','taxi',['taxi','cab','vehicle','yellow']],
  ['🚌','bus',['bus','transit','transport','vehicle']],
  ['🚂','locomotive',['train','railway','transport']],
  ['⚽','soccer ball',['soccer','football','sport','ball']],
  ['🏀','basketball',['basketball','sport','ball','nba']],
  ['🏈','american football',['football','american','sport','nfl']],
  ['⚾','baseball',['baseball','sport','ball','mlb']],
  ['🎾','tennis',['tennis','sport','ball']],
  ['🏆','trophy',['trophy','winner','award','champion']],
  ['🥇','1st place medal',['gold','medal','first','winner']],
  ['💻','laptop',['computer','laptop','tech','work']],
  ['📱','mobile phone',['phone','mobile','smartphone','cell']],
  ['⌨️','keyboard',['keyboard','type','computer']],
  ['🖥️','desktop computer',['computer','desktop','tech']],
  ['🖨️','printer',['printer','print','office']],
  ['📷','camera',['camera','photo','picture']],
  ['📸','camera with flash',['camera','flash','photo','selfie']],
  ['🎵','musical note',['music','note','song']],
  ['🎶','musical notes',['music','notes','song','melody']],
  ['🎸','guitar',['guitar','music','rock','instrument']],
  ['🎹','musical keyboard',['piano','keyboard','music','instrument']],
  ['🥁','drum',['drum','music','beat','instrument']],
  ['🎤','microphone',['mic','sing','music','karaoke']],
  ['🎧','headphone',['headphones','music','listen','audio']],
  ['📚','books',['books','read','study','education']],
  ['📖','open book',['book','read','story','education']],
  ['✏️','pencil',['pencil','write','draw']],
  ['🖊️','pen',['pen','write','sign']],
  ['📝','memo',['note','write','memo','list']],
  ['💡','light bulb',['idea','light','bulb','bright']],
  ['🔍','magnifying glass tilted left',['search','find','zoom','investigate']],
  ['🔒','locked',['lock','secure','private','security']],
  ['🔓','unlocked',['unlock','open','security']],
  ['🔑','key',['key','access','lock','unlock']],
  ['🛒','shopping cart',['cart','shop','buy','retail']],
  ['💰','money bag',['money','rich','wealth','dollar']],
  ['💳','credit card',['credit card','pay','bank','money']],
  ['📊','bar chart',['chart','data','statistics','analytics']],
  ['📈','chart increasing',['chart','growth','up','profit']],
  ['📉','chart decreasing',['chart','down','loss','decline']],
  ['🗑️','wastebasket',['trash','delete','bin','garbage']],
  ['📌','pushpin',['pin','location','mark','important']],
  ['🚩','triangular flag',['flag','mark','warning','important']],
  ['⚠️','warning',['warning','caution','alert','danger']],
  ['❌','cross mark',['no','wrong','error','cancel','delete']],
  ['✅','check mark button',['yes','correct','done','ok','success']],
  ['❓','question mark',['question','help','unknown']],
  ['❗','exclamation mark',['exclamation','important','attention']],
  ['💯','hundred points',['100','perfect','score','all']],
  ['🆕','new button',['new','fresh','update']],
  ['🆒','cool button',['cool','neat','awesome']],
  ['🆓','free button',['free','gratis','no cost']],
  ['🔞','no one under eighteen',['adult','18','nsfw']],
  ['🚫','prohibited',['no','forbidden','banned','block']],
  ['♻️','recycling symbol',['recycle','green','environment','eco']],
  ['🏳️','white flag',['surrender','peace','flag']],
  ['🏴','black flag',['pirate','dark','flag']],
  ['🏁','chequered flag',['race','finish','checkered','flag']],
  ['🎯','bullseye',['target','aim','goal','dart']],
  ['🎲','game die',['dice','game','random','luck']],
  ['♟️','chess pawn',['chess','game','strategy']],
  ['🧩','puzzle piece',['puzzle','solution','fit','game']],
  ['🎭','performing arts',['theater','drama','performance','art']],
  ['🎨','artist palette',['art','paint','color','creative']],
  ['🧵','thread',['sew','thread','craft']],
  ['🧶','yarn',['knit','craft','wool']],
  ['👋','waving hand',['wave','hello','hi','bye','hand']],
  ['🤚','raised back of hand',['hand','stop','five']],
  ['✋','raised hand',['hand','stop','five','high five']],
  ['🤙','call me hand',['call','phone','hand','hang loose']],
  ['👌','ok hand',['ok','good','perfect','hand']],
  ['✌️','victory hand',['peace','victory','v','hand']],
  ['🤞','crossed fingers',['luck','hope','fingers','hand']],
  ['👍','thumbs up',['like','good','yes','thumbs up','approve']],
  ['👎','thumbs down',['dislike','bad','no','thumbs down']],
  ['👏','clapping hands',['clap','applause','bravo','hands']],
  ['🙌','raising hands',['celebrate','hooray','praise','hands']],
  ['🤝','handshake',['deal','agreement','shake','hands']],
  ['🙏','folded hands',['pray','please','thanks','namaste','hands']],
  ['💪','flexed biceps',['strong','muscle','bicep','arm','power']],
  ['🦾','mechanical arm',['robot','arm','prosthetic','cyborg']],
  ['🧠','brain',['brain','smart','think','mind']],
  ['👁️','eye',['eye','see','look','watch']],
  ['👀','eyes',['eyes','look','see','stare']],
  ['👂','ear',['ear','hear','listen']],
  ['👃','nose',['nose','smell']],
  ['👅','tongue',['tongue','taste','lick']],
  ['👄','mouth',['lips','mouth','speak','kiss']],
].map(([emoji, name, tags]) => ({ emoji, name, tags }));

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Emoji Search & Picker</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',sans-serif;background:linear-gradient(135deg,#fefce8,#fef9c3);min-height:100vh;padding:24px;color:#222}
  .wrap{max-width:680px;margin:0 auto}
  h1{text-align:center;color:#ca8a04;margin-bottom:6px;font-size:1.9em}
  .sub{text-align:center;color:#888;margin-bottom:20px}
  .search-bar{display:flex;gap:10px;margin-bottom:16px}
  input[type=text]{flex:1;padding:13px 18px;border:2px solid #e5e7eb;border-radius:30px;font-size:16px;outline:none;transition:border-color .2s}
  input[type=text]:focus{border-color:#ca8a04}
  .card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:14px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(52px,1fr));gap:4px}
  .emoji-btn{font-size:1.8em;padding:8px 4px;border:none;background:transparent;cursor:pointer;border-radius:8px;transition:background .15s;text-align:center;line-height:1;display:flex;flex-direction:column;align-items:center;gap:2px}
  .emoji-btn:hover{background:#fef9c3}
  .emoji-btn .ename{font-size:8px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;width:100%;text-align:center}
  .copy-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#ca8a04;color:#fff;padding:10px 24px;border-radius:30px;font-weight:700;display:none;z-index:9999;font-size:15px}
  .copied-area{background:#fff7d0;border:2px dashed #ca8a04;border-radius:12px;padding:14px 18px;font-size:1.1em;margin-bottom:14px;min-height:44px;color:#555;word-break:break-all}
  .copied-label{font-size:.8em;color:#888;margin-bottom:6px;font-weight:600}
  .count-bar{font-size:.85em;color:#888;margin-bottom:10px;font-weight:600}
  .clear-btn{background:none;border:none;cursor:pointer;color:#ca8a04;font-size:.85em;margin-left:8px;font-weight:700}
</style>
</head>
<body>
<div class="wrap">
  <h1>😄 Emoji Search & Picker</h1>
  <p class="sub">Click any emoji to copy it to your clipboard</p>

  <div class="search-bar">
    <input type="text" id="searchInput" placeholder="Search emojis… try 'love', 'food', 'happy'" oninput="search(this.value)" autofocus>
  </div>

  <div class="copied-label">Picked emojis:</div>
  <div class="copied-area" id="pickedArea">Click emojis below to add them here…</div>

  <div class="card">
    <div class="count-bar" id="countBar">Showing all emojis<button class="clear-btn" onclick="clearSearch()">✕ Clear</button></div>
    <div class="grid" id="emojiGrid"></div>
  </div>
</div>
<div class="copy-toast" id="toast"></div>
<script>
let picked='';
let allEmojis=[];
let debounceTimer;

async function loadAll(){
  const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:''})});
  const d=await res.json();
  // Fallback: show from local list injected in page
  renderGrid(d.results||[]);
  allEmojis=d.results||[];
}

async function search(q){
  clearTimeout(debounceTimer);
  debounceTimer=setTimeout(async()=>{
    if(!q.trim()){loadAll();document.getElementById('countBar').innerHTML='Showing all emojis<button class="clear-btn" onclick="clearSearch()">✕ Clear</button>';return;}
    const res=await fetch(location.href,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});
    const d=await res.json();
    renderGrid(d.results||[]);
    document.getElementById('countBar').innerHTML=(d.total||0)+' result'+(d.total===1?'':'s')+' for "'+q+'"<button class="clear-btn" onclick="clearSearch()">✕ Clear</button>';
  },180);
}

function renderGrid(emojis){
  const grid=document.getElementById('emojiGrid');
  if(!emojis.length){grid.innerHTML='<p style="color:#888;padding:20px;grid-column:1/-1">No emojis found.</p>';return;}
  grid.innerHTML=emojis.map(e=>\`<button class="emoji-btn" onclick="pick('\${e.emoji}')" title="\${e.name}">\${e.emoji}<span class="ename">\${e.name.split(' ').slice(0,2).join(' ')}</span></button>\`).join('');
}

function pick(emoji){
  picked+=emoji;
  const area=document.getElementById('pickedArea');
  area.textContent=picked||'Click emojis below to add them here…';
  navigator.clipboard.writeText(picked).catch(()=>{});
  const toast=document.getElementById('toast');
  toast.textContent=emoji+' copied!';
  toast.style.display='block';
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(()=>toast.style.display='none',1500);
}

function clearSearch(){
  document.getElementById('searchInput').value='';
  loadAll();
  document.getElementById('countBar').innerHTML='Showing all emojis<button class="clear-btn" onclick="clearSearch()">✕ Clear</button>';
}

loadAll();
</script>
</body>
</html>`;
  return new Response(html, { status: 200, headers: { 'Content-Type': 'text/html;charset=UTF-8', ...corsHeaders() } });
}

function jsonHeaders() { return { 'Content-Type': 'application/json', ...corsHeaders() }; }
function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}
