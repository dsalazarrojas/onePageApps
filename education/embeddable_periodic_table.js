addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  const url = new URL(request.url);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders() });
  if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...corsHeaders() } });
  if (url.pathname === '/widget.js') return new Response(widgetJS(), { headers: jsHeaders() });
  return new Response(pageHTML(), { headers: htmlHeaders() });
}

function widgetJS() {
  return String.raw`(function(){
  var s = document.currentScript;
  var raw = (s && s.dataset && s.dataset.config) || '';
  var base = (s && s.src || '').replace(/\/widget\.js(?:\?.*)?$/, '');
  var frame = document.createElement('iframe');
  frame.src = base + '/?embed=1&config=' + raw;
  frame.loading = 'lazy';
  frame.style.cssText = 'width:100%;min-height:860px;border:none;border-radius:16px;display:block';
  frame.title = 'Periodic table';
  (s && s.parentNode ? s.parentNode : document.body).insertBefore(frame, s || null);
})();`;
}

function pageHTML() {
  return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Embeddable Periodic Table</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Inter, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
  .page { max-width: 1360px; margin: 0 auto; padding: 28px 18px 40px; }
  .hero h1 { margin: 0 0 10px; font-size: clamp(2rem, 4vw, 2.8rem); }
  .hero p { margin: 0 0 22px; max-width: 820px; color: #475569; line-height: 1.6; }
  .grid { display: grid; grid-template-columns: 320px 1fr; gap: 20px; align-items: start; }
  .card { background: white; border: 1px solid #e2e8f0; border-radius: 18px; box-shadow: 0 16px 36px rgba(15,23,42,.08); padding: 20px; }
  label { display: block; margin-bottom: 8px; font-weight: 700; color: #334155; }
  input, select { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; font: inherit; }
  .actions { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 16px; }
  button { border: none; border-radius: 12px; padding: 12px 16px; font: inherit; font-weight: 800; cursor: pointer; }
  button.primary { background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; }
  button.secondary { background: #e2e8f0; color: #0f172a; }
  pre.output { margin: 0; padding: 16px; background: #0f172a; color: #e2e8f0; border-radius: 14px; white-space: pre-wrap; overflow: auto; }
  .preview { width: 100%; min-height: 860px; border: 1px solid #cbd5e1; border-radius: 16px; background: white; }
  .hidden { display: none !important; }
  .widget-shell { display: grid; gap: 16px; }
  .toolbar { display: grid; grid-template-columns: 1.3fr 1fr; gap: 12px; }
  .table-grid { display: grid; grid-template-columns: repeat(18, minmax(46px, 1fr)); gap: 6px; }
  .element { min-height: 74px; border-radius: 14px; border: 1px solid #dbe3f0; padding: 8px; background: white; cursor: pointer; display: grid; align-content: start; transition: transform .15s ease, box-shadow .15s ease, opacity .15s ease; }
  .element:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(15,23,42,.1); }
  .element.faded { opacity: .22; }
  .num { font-size: 10px; color: #64748b; }
  .sym { font-size: 1.2rem; font-weight: 900; line-height: 1.1; margin-top: 3px; }
  .name { font-size: 10px; color: #475569; line-height: 1.2; margin-top: 4px; }
  .detail { border: 1px solid #dbe3f0; border-radius: 18px; padding: 18px; background: linear-gradient(180deg, #ffffff, #f8fbff); min-height: 180px; }
  .chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
  .chip { padding: 8px 10px; border-radius: 999px; background: #eff6ff; color: #1d4ed8; font-weight: 700; font-size: 12px; }
  .legend { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #475569; }
  .swatch { width: 14px; height: 14px; border-radius: 4px; display: inline-block; }
  @media (max-width: 1120px) { .grid { grid-template-columns: 1fr; } .toolbar { grid-template-columns: 1fr; } .table-grid { grid-template-columns: repeat(9, minmax(46px, 1fr)); } }
</style>
</head>
<body>
<div class="page" id="builderPage">
  <div class="hero">
    <h1>Embeddable Periodic Table</h1>
    <p>Create a searchable periodic-table widget with a classic grid layout, category colors, and click-to-view element details.</p>
  </div>
  <div class="grid">
    <div class="card">
      <label for="title">Widget title</label>
      <input id="title" value="Periodic table explorer">
      <div style="margin-top:14px;">
        <label for="accent">Accent color</label>
        <input id="accent" type="color" value="#2563eb">
      </div>
      <div class="actions">
        <button class="primary" id="generateBtn" type="button">Generate embed code</button>
        <button class="secondary" id="copyBtn" type="button">Copy code</button>
      </div>
      <div style="margin-top:14px;">
        <label>Embed snippet</label>
        <pre class="output" id="output"></pre>
      </div>
    </div>
    <div class="card">
      <label>Live preview</label>
      <iframe id="preview" class="preview" title="Periodic table preview"></iframe>
    </div>
  </div>
</div>
<div id="embedMount" class="hidden"></div>
<script>
(function() {
  const params = new URLSearchParams(location.search);
  const isEmbed = params.get('embed') === '1';
  const defaults = { title: 'Periodic table explorer', accent: '#2563eb' };
  const categories = {
    'alkali metal': '#fecaca',
    'alkaline earth metal': '#fed7aa',
    'transition metal': '#fef08a',
    'post-transition metal': '#bfdbfe',
    'metalloid': '#c7d2fe',
    'reactive nonmetal': '#bbf7d0',
    'noble gas': '#fbcfe8',
    'lanthanide': '#fde68a',
    'actinide': '#fdba74'
  };
  const elements = [
    [1,'H','Hydrogen',1,1,'reactive nonmetal'],[2,'He','Helium',1,18,'noble gas'],
    [3,'Li','Lithium',2,1,'alkali metal'],[4,'Be','Beryllium',2,2,'alkaline earth metal'],[5,'B','Boron',2,13,'metalloid'],[6,'C','Carbon',2,14,'reactive nonmetal'],[7,'N','Nitrogen',2,15,'reactive nonmetal'],[8,'O','Oxygen',2,16,'reactive nonmetal'],[9,'F','Fluorine',2,17,'reactive nonmetal'],[10,'Ne','Neon',2,18,'noble gas'],
    [11,'Na','Sodium',3,1,'alkali metal'],[12,'Mg','Magnesium',3,2,'alkaline earth metal'],[13,'Al','Aluminium',3,13,'post-transition metal'],[14,'Si','Silicon',3,14,'metalloid'],[15,'P','Phosphorus',3,15,'reactive nonmetal'],[16,'S','Sulfur',3,16,'reactive nonmetal'],[17,'Cl','Chlorine',3,17,'reactive nonmetal'],[18,'Ar','Argon',3,18,'noble gas'],
    [19,'K','Potassium',4,1,'alkali metal'],[20,'Ca','Calcium',4,2,'alkaline earth metal'],[21,'Sc','Scandium',4,3,'transition metal'],[22,'Ti','Titanium',4,4,'transition metal'],[23,'V','Vanadium',4,5,'transition metal'],[24,'Cr','Chromium',4,6,'transition metal'],[25,'Mn','Manganese',4,7,'transition metal'],[26,'Fe','Iron',4,8,'transition metal'],[27,'Co','Cobalt',4,9,'transition metal'],[28,'Ni','Nickel',4,10,'transition metal'],[29,'Cu','Copper',4,11,'transition metal'],[30,'Zn','Zinc',4,12,'transition metal'],[31,'Ga','Gallium',4,13,'post-transition metal'],[32,'Ge','Germanium',4,14,'metalloid'],[33,'As','Arsenic',4,15,'metalloid'],[34,'Se','Selenium',4,16,'reactive nonmetal'],[35,'Br','Bromine',4,17,'reactive nonmetal'],[36,'Kr','Krypton',4,18,'noble gas'],
    [37,'Rb','Rubidium',5,1,'alkali metal'],[38,'Sr','Strontium',5,2,'alkaline earth metal'],[39,'Y','Yttrium',5,3,'transition metal'],[40,'Zr','Zirconium',5,4,'transition metal'],[41,'Nb','Niobium',5,5,'transition metal'],[42,'Mo','Molybdenum',5,6,'transition metal'],[43,'Tc','Technetium',5,7,'transition metal'],[44,'Ru','Ruthenium',5,8,'transition metal'],[45,'Rh','Rhodium',5,9,'transition metal'],[46,'Pd','Palladium',5,10,'transition metal'],[47,'Ag','Silver',5,11,'transition metal'],[48,'Cd','Cadmium',5,12,'transition metal'],[49,'In','Indium',5,13,'post-transition metal'],[50,'Sn','Tin',5,14,'post-transition metal'],[51,'Sb','Antimony',5,15,'metalloid'],[52,'Te','Tellurium',5,16,'metalloid'],[53,'I','Iodine',5,17,'reactive nonmetal'],[54,'Xe','Xenon',5,18,'noble gas'],
    [55,'Cs','Caesium',6,1,'alkali metal'],[56,'Ba','Barium',6,2,'alkaline earth metal'],[57,'La','Lanthanum',8,4,'lanthanide'],[58,'Ce','Cerium',8,5,'lanthanide'],[59,'Pr','Praseodymium',8,6,'lanthanide'],[60,'Nd','Neodymium',8,7,'lanthanide'],[61,'Pm','Promethium',8,8,'lanthanide'],[62,'Sm','Samarium',8,9,'lanthanide'],[63,'Eu','Europium',8,10,'lanthanide'],[64,'Gd','Gadolinium',8,11,'lanthanide'],[65,'Tb','Terbium',8,12,'lanthanide'],[66,'Dy','Dysprosium',8,13,'lanthanide'],[67,'Ho','Holmium',8,14,'lanthanide'],[68,'Er','Erbium',8,15,'lanthanide'],[69,'Tm','Thulium',8,16,'lanthanide'],[70,'Yb','Ytterbium',8,17,'lanthanide'],[71,'Lu','Lutetium',8,18,'lanthanide'],
    [72,'Hf','Hafnium',6,4,'transition metal'],[73,'Ta','Tantalum',6,5,'transition metal'],[74,'W','Tungsten',6,6,'transition metal'],[75,'Re','Rhenium',6,7,'transition metal'],[76,'Os','Osmium',6,8,'transition metal'],[77,'Ir','Iridium',6,9,'transition metal'],[78,'Pt','Platinum',6,10,'transition metal'],[79,'Au','Gold',6,11,'transition metal'],[80,'Hg','Mercury',6,12,'transition metal'],[81,'Tl','Thallium',6,13,'post-transition metal'],[82,'Pb','Lead',6,14,'post-transition metal'],[83,'Bi','Bismuth',6,15,'post-transition metal'],[84,'Po','Polonium',6,16,'post-transition metal'],[85,'At','Astatine',6,17,'reactive nonmetal'],[86,'Rn','Radon',6,18,'noble gas'],
    [87,'Fr','Francium',7,1,'alkali metal'],[88,'Ra','Radium',7,2,'alkaline earth metal'],[89,'Ac','Actinium',9,4,'actinide'],[90,'Th','Thorium',9,5,'actinide'],[91,'Pa','Protactinium',9,6,'actinide'],[92,'U','Uranium',9,7,'actinide'],[93,'Np','Neptunium',9,8,'actinide'],[94,'Pu','Plutonium',9,9,'actinide'],[95,'Am','Americium',9,10,'actinide'],[96,'Cm','Curium',9,11,'actinide'],[97,'Bk','Berkelium',9,12,'actinide'],[98,'Cf','Californium',9,13,'actinide'],[99,'Es','Einsteinium',9,14,'actinide'],[100,'Fm','Fermium',9,15,'actinide'],[101,'Md','Mendelevium',9,16,'actinide'],[102,'No','Nobelium',9,17,'actinide'],[103,'Lr','Lawrencium',9,18,'actinide'],
    [104,'Rf','Rutherfordium',7,4,'transition metal'],[105,'Db','Dubnium',7,5,'transition metal'],[106,'Sg','Seaborgium',7,6,'transition metal'],[107,'Bh','Bohrium',7,7,'transition metal'],[108,'Hs','Hassium',7,8,'transition metal'],[109,'Mt','Meitnerium',7,9,'transition metal'],[110,'Ds','Darmstadtium',7,10,'transition metal'],[111,'Rg','Roentgenium',7,11,'transition metal'],[112,'Cn','Copernicium',7,12,'post-transition metal'],[113,'Nh','Nihonium',7,13,'post-transition metal'],[114,'Fl','Flerovium',7,14,'post-transition metal'],[115,'Mc','Moscovium',7,15,'post-transition metal'],[116,'Lv','Livermorium',7,16,'post-transition metal'],[117,'Ts','Tennessine',7,17,'reactive nonmetal'],[118,'Og','Oganesson',7,18,'noble gas']
  ].map(function(item) { return { number: item[0], symbol: item[1], name: item[2], period: item[3], group: item[4], category: item[5] }; });

  function readConfig() {
    if (!params.get('config')) return { ...defaults };
    try { return Object.assign({}, defaults, JSON.parse(params.get('config')) || {}); }
    catch (error) { return { ...defaults }; }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderTable(target, cfg) {
    target.innerHTML = '<div class="widget-shell"><div><h2 style="margin:0 0 8px 0;">' + escapeHtml(cfg.title) + '</h2><div class="toolbar"><input id="search" type="search" placeholder="Search by name, symbol, or atomic number"><select id="categoryFilter"><option value="">All categories</option>' + Object.keys(categories).map(function(name) { return '<option value="' + escapeHtml(name) + '">' + escapeHtml(name) + '</option>'; }).join('') + '</select></div><div class="legend">' + Object.keys(categories).map(function(name) { return '<span class="legend-item"><span class="swatch" style="background:' + categories[name] + '"></span>' + escapeHtml(name) + '</span>'; }).join('') + '</div></div><div class="table-grid" id="tableGrid"></div><div class="detail" id="detailBox">Select an element to inspect its details.</div></div>';
    const search = target.querySelector('#search');
    const filter = target.querySelector('#categoryFilter');
    const grid = target.querySelector('#tableGrid');
    const detail = target.querySelector('#detailBox');
    let selected = elements[0];
    function draw() {
      const query = search.value.trim().toLowerCase();
      const category = filter.value;
      grid.innerHTML = '';
      elements.forEach(function(element) {
        const match = (!query || [element.symbol, element.name, String(element.number)].join(' ').toLowerCase().indexOf(query) >= 0) &&
          (!category || element.category === category);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'element' + (match ? '' : ' faded');
        cell.style.gridColumn = element.group;
        cell.style.gridRow = element.period;
        cell.style.background = categories[element.category] || '#e2e8f0';
        cell.innerHTML = '<div class="num">' + element.number + '</div><div class="sym">' + element.symbol + '</div><div class="name">' + escapeHtml(element.name) + '</div>';
        cell.addEventListener('click', function() {
          selected = element;
          updateDetail();
        });
        grid.appendChild(cell);
      });
      updateDetail();
    }
    function updateDetail() {
      detail.innerHTML = '<div style="display:flex;justify-content:space-between;gap:14px;align-items:start;"><div><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:' + cfg.accent + ';">Atomic number</div><div style="font-size:3rem;font-weight:900;color:' + cfg.accent + ';">' + selected.number + '</div></div><div style="text-align:right;"><div style="font-size:3rem;font-weight:900;">' + selected.symbol + '</div><div style="font-size:1.1rem;font-weight:700;">' + escapeHtml(selected.name) + '</div></div></div><div class="chips"><span class="chip">Period ' + selected.period + '</span><span class="chip">Group ' + selected.group + '</span><span class="chip">' + escapeHtml(selected.category) + '</span></div>';
    }
    search.addEventListener('input', draw);
    filter.addEventListener('change', draw);
    draw();
  }

  if (isEmbed) {
    document.body.style.background = 'transparent';
    document.body.style.padding = '16px';
    document.getElementById('builderPage').remove();
    const mount = document.getElementById('embedMount');
    mount.classList.remove('hidden');
    renderTable(mount, readConfig());
    return;
  }

  function currentConfig() {
    return {
      title: document.getElementById('title').value.trim() || defaults.title,
      accent: document.getElementById('accent').value
    };
  }

  function update() {
    const cfg = currentConfig();
    const encoded = encodeURIComponent(JSON.stringify(cfg));
    const snippet = '<script src="' + location.origin + '/widget.js" data-config="' + encoded + '"><\\/script>';
    document.getElementById('output').textContent = snippet;
    document.getElementById('preview').src = '/?embed=1&config=' + encoded;
  }

  document.getElementById('generateBtn').addEventListener('click', update);
  document.getElementById('copyBtn').addEventListener('click', function() {
    const text = document.getElementById('output').textContent;
    if (navigator.clipboard && text) navigator.clipboard.writeText(text);
  });
  ['title', 'accent'].forEach(function(id) { document.getElementById(id).addEventListener('input', update); });
  update();
})();
</script>
</body>
</html>`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
function htmlHeaders() { return { 'Content-Type': 'text/html; charset=utf-8', ...corsHeaders() }; }
function jsHeaders() { return { 'Content-Type': 'application/javascript; charset=utf-8', ...corsHeaders() }; }
