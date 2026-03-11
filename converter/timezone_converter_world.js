addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method === 'GET') {
    return serveMainPage();
  }
  return new Response('Method Not Allowed', {status:405});
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>World Timezone Converter</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f0f2f5;
      color: #1f2937;
      padding: 20px;
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
      margin-bottom: 22px;
    }
    h1, h2 {
      margin: 0 0 12px;
    }
    .subtitle {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    .controls {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 16px;
      align-items: end;
      margin-bottom: 18px;
    }
    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #374151;
    }
    input, select {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 12px 14px;
      font-size: 15px;
      background: white;
      color: #111827;
    }
    input:focus, select:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.15);
    }
    button {
      border: none;
      background: #007bff;
      color: white;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background .2s ease, transform .15s ease;
      min-width: 110px;
    }
    button:hover {
      background: #0056b3;
    }
    button:active {
      transform: translateY(1px);
    }
    .status {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 18px;
      color: #4b5563;
      font-size: 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 999px;
      background: #eef6ff;
      color: #007bff;
      font-weight: 700;
    }
    .table-wrap {
      overflow-x: auto;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 700px;
    }
    th, td {
      padding: 12px 14px;
      border-bottom: 1px solid #e5e7eb;
      text-align: left;
      white-space: nowrap;
    }
    th {
      background: #eef6ff;
      color: #1f2937;
    }
    tr:nth-child(even) td {
      background: #fafafa;
    }
    .muted {
      color: #6b7280;
    }
    @media (max-width: 760px) {
      .controls {
        grid-template-columns: 1fr;
      }
      .container {
        padding: 14px;
      }
      .card {
        padding: 22px;
      }
      button {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>World Timezone Converter</h1>
      <p class="subtitle">Pick a source date and time, choose the origin timezone, and instantly compare the matching local time across major world regions using built-in browser timezone support.</p>
      <div class="controls">
        <div>
          <label for="sourceTime">Source date and time</label>
          <input id="sourceTime" type="datetime-local">
        </div>
        <div>
          <label for="sourceZone">Source timezone</label>
          <select id="sourceZone"></select>
        </div>
        <div>
          <button id="convertButton">Convert</button>
        </div>
      </div>
      <div class="status">
        <span class="badge" id="statusBadge">Live update enabled</span>
        <span id="statusText">Update the controls to refresh every listed timezone.</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>City</th>
              <th>Timezone</th>
              <th>Local time</th>
              <th>UTC offset</th>
            </tr>
          </thead>
          <tbody id="resultsBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    var zones = [
      { city: 'New York', zone: 'America/New_York' },
      { city: 'Chicago', zone: 'America/Chicago' },
      { city: 'Denver', zone: 'America/Denver' },
      { city: 'Los Angeles', zone: 'America/Los_Angeles' },
      { city: 'São Paulo', zone: 'America/Sao_Paulo' },
      { city: 'London', zone: 'Europe/London' },
      { city: 'Paris', zone: 'Europe/Paris' },
      { city: 'Berlin', zone: 'Europe/Berlin' },
      { city: 'Moscow', zone: 'Europe/Moscow' },
      { city: 'Cairo', zone: 'Africa/Cairo' },
      { city: 'Dubai', zone: 'Asia/Dubai' },
      { city: 'Kolkata', zone: 'Asia/Kolkata' },
      { city: 'Bangkok', zone: 'Asia/Bangkok' },
      { city: 'Singapore', zone: 'Asia/Singapore' },
      { city: 'Tokyo', zone: 'Asia/Tokyo' },
      { city: 'Shanghai', zone: 'Asia/Shanghai' },
      { city: 'Sydney', zone: 'Australia/Sydney' },
      { city: 'Auckland', zone: 'Pacific/Auckland' },
      { city: 'UTC', zone: 'UTC' }
    ];

    var sourceTime = document.getElementById('sourceTime');
    var sourceZone = document.getElementById('sourceZone');
    var resultsBody = document.getElementById('resultsBody');
    var statusText = document.getElementById('statusText');
    var debounceTimer = null;
    var formatterCache = {};

    function getDateTimeFormatter(timeZone) {
      var key = 'parts:' + timeZone;
      if (!formatterCache[key]) {
        formatterCache[key] = new Intl.DateTimeFormat('en-CA', {
          timeZone: timeZone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          hourCycle: 'h23'
        });
      }
      return formatterCache[key];
    }

    function getDisplayFormatter(timeZone) {
      var key = 'display:' + timeZone;
      if (!formatterCache[key]) {
        formatterCache[key] = new Intl.DateTimeFormat('en-US', {
          timeZone: timeZone,
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          hourCycle: 'h23'
        });
      }
      return formatterCache[key];
    }

    function getPartsForZone(date, timeZone) {
      var parts = getDateTimeFormatter(timeZone).formatToParts(date);
      var mapped = {};
      parts.forEach(function(part) {
        if (part.type !== 'literal') {
          mapped[part.type] = part.value;
        }
      });
      return {
        year: parseInt(mapped.year, 10),
        month: parseInt(mapped.month, 10),
        day: parseInt(mapped.day, 10),
        hour: parseInt(mapped.hour, 10),
        minute: parseInt(mapped.minute, 10),
        second: parseInt(mapped.second, 10)
      };
    }

    function makeInputValue(date, timeZone) {
      var parts = getPartsForZone(date, timeZone);
      return String(parts.year).padStart(4, '0') + '-' + String(parts.month).padStart(2, '0') + '-' + String(parts.day).padStart(2, '0') + 'T' + String(parts.hour).padStart(2, '0') + ':' + String(parts.minute).padStart(2, '0');
    }

    function parseInputValue(value) {
      if (!value || value.indexOf('T') === -1) {
        return null;
      }
      var halves = value.split('T');
      var dateBits = halves[0].split('-');
      var timeBits = halves[1].split(':');
      return {
        year: parseInt(dateBits[0], 10),
        month: parseInt(dateBits[1], 10),
        day: parseInt(dateBits[2], 10),
        hour: parseInt(timeBits[0], 10),
        minute: parseInt(timeBits[1], 10),
        second: 0
      };
    }

    function localDateTimeToUtcMillis(localValue, timeZone) {
      var desired = parseInputValue(localValue);
      if (!desired) {
        return null;
      }
      var targetClock = Date.UTC(desired.year, desired.month - 1, desired.day, desired.hour, desired.minute, desired.second);
      var guess = targetClock;
      for (var i = 0; i < 6; i += 1) {
        var guessParts = getPartsForZone(new Date(guess), timeZone);
        var guessClock = Date.UTC(guessParts.year, guessParts.month - 1, guessParts.day, guessParts.hour, guessParts.minute, guessParts.second);
        var difference = targetClock - guessClock;
        guess += difference;
        if (Math.abs(difference) < 1000) {
          break;
        }
      }
      return guess;
    }

    function formatOffsetFromMinutes(totalMinutes) {
      var sign = totalMinutes >= 0 ? '+' : '-';
      var absolute = Math.abs(totalMinutes);
      var hours = Math.floor(absolute / 60);
      var minutes = absolute % 60;
      return 'UTC' + sign + String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
    }

    function getOffsetLabel(date, timeZone) {
      try {
        var parts = new Intl.DateTimeFormat('en-US', {
          timeZone: timeZone,
          timeZoneName: 'shortOffset',
          hour: '2-digit',
          minute: '2-digit'
        }).formatToParts(date);
        var timeZoneName = parts.find(function(part) {
          return part.type === 'timeZoneName';
        });
        if (timeZoneName && timeZoneName.value) {
          return timeZoneName.value.replace('GMT', 'UTC');
        }
      } catch (error) {
      }
      var zoned = getPartsForZone(date, timeZone);
      var zonedClock = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
      var offsetMinutes = Math.round((zonedClock - date.getTime()) / 60000);
      return formatOffsetFromMinutes(offsetMinutes);
    }

    function renderTable() {
      var sourceValue = sourceTime.value;
      if (!sourceValue) {
        resultsBody.innerHTML = '<tr><td colspan="4" class="muted">Choose a source date and time to see conversions.</td></tr>';
        statusText.textContent = 'Choose a time to populate all world timezone rows.';
        return;
      }

      var utcMillis = localDateTimeToUtcMillis(sourceValue, sourceZone.value);
      var instant = new Date(utcMillis);
      var rows = zones.map(function(entry) {
        return '<tr>' +
          '<td>' + entry.city + '</td>' +
          '<td>' + entry.zone + '</td>' +
          '<td>' + getDisplayFormatter(entry.zone).format(instant) + '</td>' +
          '<td>' + getOffsetLabel(instant, entry.zone) + '</td>' +
          '</tr>';
      });
      resultsBody.innerHTML = rows.join('');
      statusText.textContent = 'Source instant in UTC: ' + instant.toISOString().replace('.000Z', 'Z') + ' • Showing ' + zones.length + ' timezones.';
    }

    function scheduleRender() {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(renderTable, 80);
    }

    zones.forEach(function(entry) {
      var option = document.createElement('option');
      option.value = entry.zone;
      option.textContent = entry.city + ' (' + entry.zone + ')';
      sourceZone.appendChild(option);
    });

    var resolvedZone = 'UTC';
    try {
      resolvedZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch (error) {
      resolvedZone = 'UTC';
    }
    var knownZone = zones.some(function(entry) { return entry.zone === resolvedZone; });
    sourceZone.value = knownZone ? resolvedZone : 'UTC';
    sourceTime.value = makeInputValue(new Date(), sourceZone.value);

    document.getElementById('convertButton').addEventListener('click', renderTable);
    sourceTime.addEventListener('input', scheduleRender);
    sourceZone.addEventListener('change', scheduleRender);

    renderTable();
  </script>
</body>
</html>`;

  return new Response(html, {status:200, headers:{'Content-Type':'text/html','Access-Control-Allow-Origin':'*'}});
}
