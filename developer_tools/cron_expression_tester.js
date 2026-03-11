addEventListener('fetch', event => event.respondWith(handleRequest(event.request)));

async function handleRequest(request) {
  if (request.method !== 'GET') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
  return serveMainPage();
}

function serveMainPage() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cron Expression Tester</title>
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
    h1 {
      margin: 0 0 10px;
      color: #007bff;
      font-size: 2rem;
    }
    .lead {
      margin: 0 0 22px;
      color: #4b5563;
      line-height: 1.6;
    }
    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #374151;
    }
    input, button, textarea {
      font: inherit;
    }
    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      outline: none;
    }
    input:focus {
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0,123,255,.12);
    }
    .button-row {
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
      cursor: pointer;
      font-weight: 600;
      transition: background .2s ease;
    }
    button:hover {
      background: #0056b3;
    }
    .preset-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 16px;
    }
    .preset-btn {
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: .92rem;
      cursor: pointer;
    }
    .preset-btn:hover {
      background: #dbeafe;
    }
    .status {
      display: none;
      margin-top: 18px;
      padding: 14px;
      border-radius: 10px;
    }
    .status.error { display: block; background: #fee2e2; color: #991b1b; }
    .status.success { display: block; background: #dcfce7; color: #166534; }
    .status.info { display: block; background: #dbeafe; color: #1d4ed8; }
    .result-box {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 18px;
      margin-top: 18px;
    }
    .description {
      font-size: 1.05rem;
      line-height: 1.6;
      color: #111827;
    }
    .table-wrap {
      overflow-x: auto;
      margin-top: 12px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px 10px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: top;
    }
    th {
      background: #f8fafc;
      color: #374151;
      font-size: .95rem;
    }
    .muted {
      color: #6b7280;
      font-size: .95rem;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      background: #eef2ff;
      color: #3730a3;
      padding: 2px 6px;
      border-radius: 6px;
    }
    @media (max-width: 640px) {
      .card { padding: 22px; }
      h1 { font-size: 1.7rem; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1>Cron Expression Tester</h1>
      <p class="lead">Parse 5-field or 6-field cron expressions, explain them in plain English, and calculate the next 10 run times from now. Supported field syntax: <code>*</code>, <code>*/n</code>, <code>n</code>, <code>n-m</code>, and comma-separated lists.</p>

      <label for="cronInput">Cron expression</label>
      <input id="cronInput" type="text" value="0 3 * * *" placeholder="Examples: */15 * * * * or */30 * * * * *">

      <div class="button-row">
        <button type="button" id="parseButton">Parse</button>
      </div>

      <div class="preset-bar">
        <button type="button" class="preset-btn" data-expression="* * * * *">Every minute</button>
        <button type="button" class="preset-btn" data-expression="0 * * * *">Every hour</button>
        <button type="button" class="preset-btn" data-expression="0 0 * * *">Daily at midnight</button>
        <button type="button" class="preset-btn" data-expression="0 9 * * 1-5">Weekdays at 9 AM</button>
        <button type="button" class="preset-btn" data-expression="*/15 * * * *">Every 15 minutes</button>
        <button type="button" class="preset-btn" data-expression="*/30 * * * * *">Every 30 seconds</button>
      </div>

      <div id="status" class="status"></div>
    </div>

    <div class="card" id="resultsCard" style="display:none;">
      <h2 style="margin:0 0 10px; color:#111827;">Description</h2>
      <div class="result-box description" id="descriptionBox"></div>

      <h2 style="margin:24px 0 10px; color:#111827;">Next 10 run times</h2>
      <p class="muted" style="margin:0 0 8px;">Times are calculated in your current browser timezone.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:70px;">#</th>
              <th>Run time</th>
            </tr>
          </thead>
          <tbody id="runsBody"></tbody>
        </table>
      </div>

      <h2 style="margin:24px 0 10px; color:#111827;">Field breakdown</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width:130px;">Field</th>
              <th style="width:120px;">Token</th>
              <th>Allowed values</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody id="breakdownBody"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    var FIELD_DEFS = [
      { key: 'second', label: 'Second', min: 0, max: 59, meaning: 'Second of the minute' },
      { key: 'minute', label: 'Minute', min: 0, max: 59, meaning: 'Minute of the hour' },
      { key: 'hour', label: 'Hour', min: 0, max: 23, meaning: 'Hour of the day' },
      { key: 'dayOfMonth', label: 'Day of month', min: 1, max: 31, meaning: 'Calendar day number' },
      { key: 'month', label: 'Month', min: 1, max: 12, meaning: 'Month number' },
      { key: 'dayOfWeek', label: 'Day of week', min: 0, max: 7, meaning: '0 or 7 is Sunday, 1 is Monday' }
    ];
    var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    var MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    window.addEventListener('DOMContentLoaded', function () {
      document.getElementById('parseButton').addEventListener('click', parseCron);
      document.getElementById('cronInput').addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          parseCron();
        }
      });
      Array.from(document.querySelectorAll('.preset-btn')).forEach(function (button) {
        button.addEventListener('click', function () {
          document.getElementById('cronInput').value = button.getAttribute('data-expression');
          parseCron();
        });
      });
      parseCron();
    });

    function parseCron() {
      var expression = document.getElementById('cronInput').value.trim();
      if (!expression) {
        showMessage('Enter a cron expression to parse.', 'error');
        return;
      }

      try {
        var schedule = parseExpression(expression);
        var runs = calculateNextRuns(schedule, 10);
        renderDescription(schedule);
        renderRuns(runs, schedule.hasSeconds);
        renderBreakdown(schedule);
        document.getElementById('resultsCard').style.display = 'block';
        showMessage('Cron expression parsed successfully.', 'success');
      } catch (error) {
        document.getElementById('resultsCard').style.display = 'none';
        showMessage(error && error.message ? error.message : 'Unable to parse the cron expression.', 'error');
      }
    }

    function parseExpression(expression) {
      var parts = expression.split(/\s+/).filter(Boolean);
      if (parts.length !== 5 && parts.length !== 6) {
        throw new Error('Cron expression must contain 5 fields or 6 fields (with optional seconds).');
      }

      var hasSeconds = parts.length === 6;
      var defs = hasSeconds ? FIELD_DEFS : FIELD_DEFS.slice(1);
      var fields = {};

      defs.forEach(function (def, index) {
        fields[def.key] = parseField(parts[index], def);
      });

      if (!hasSeconds) {
        fields.second = {
          token: '—',
          any: false,
          values: [0],
          valueSet: new Set([0]),
          summary: 'Not used in 5-field expressions',
          description: 'Optional seconds field omitted'
        };
      }

      return {
        expression: expression,
        hasSeconds: hasSeconds,
        fields: fields,
        rawParts: parts
      };
    }

    function parseField(token, def) {
      var trimmed = token.trim();
      if (!trimmed) {
        throw new Error(def.label + ' field is empty.');
      }

      if (trimmed === '*') {
        var allValues = buildRange(def.min, normalizeMax(def));
        return {
          token: trimmed,
          any: true,
          values: allValues,
          valueSet: new Set(allValues),
          summary: 'Any value in ' + def.min + '-' + normalizeMax(def),
          description: 'Matches every ' + def.label.toLowerCase()
        };
      }

      var values = [];
      trimmed.split(',').forEach(function (segment) {
        var part = segment.trim();
        if (!part) {
          throw new Error('Invalid empty segment in ' + def.label.toLowerCase() + ' field.');
        }

        if (/^\*\/\d+$/.test(part)) {
          var step = parseInt(part.slice(2), 10);
          if (!step || step < 1) {
            throw new Error('Step values must be greater than zero in the ' + def.label.toLowerCase() + ' field.');
          }
          for (var stepValue = def.min; stepValue <= normalizeMax(def); stepValue += step) {
            values.push(normalizeValue(stepValue, def));
          }
          return;
        }

        if (/^\d+-\d+$/.test(part)) {
          var bounds = part.split('-').map(function (value) { return parseInt(value, 10); });
          if (bounds[0] > bounds[1]) {
            throw new Error('Ranges must be ascending in the ' + def.label.toLowerCase() + ' field.');
          }
          for (var rangeValue = bounds[0]; rangeValue <= bounds[1]; rangeValue += 1) {
            validateValue(rangeValue, def);
            values.push(normalizeValue(rangeValue, def));
          }
          return;
        }

        if (/^\d+$/.test(part)) {
          var singleValue = parseInt(part, 10);
          validateValue(singleValue, def);
          values.push(normalizeValue(singleValue, def));
          return;
        }

        throw new Error('Unsupported token "' + part + '" in the ' + def.label.toLowerCase() + ' field.');
      });

      var unique = Array.from(new Set(values)).sort(function (a, b) { return a - b; });
      return {
        token: trimmed,
        any: false,
        values: unique,
        valueSet: new Set(unique),
        summary: summarizeValues(unique, def),
        description: describeFieldToken(trimmed, def)
      };
    }

    function validateValue(value, def) {
      if (value < def.min || value > normalizeMax(def)) {
        throw new Error(def.label + ' values must be between ' + def.min + ' and ' + normalizeMax(def) + '.');
      }
    }

    function normalizeMax(def) {
      return def.key === 'dayOfWeek' ? 7 : def.max;
    }

    function normalizeValue(value, def) {
      if (def.key === 'dayOfWeek' && value === 7) {
        return 0;
      }
      return value;
    }

    function buildRange(min, max) {
      var list = [];
      for (var value = min; value <= max; value += 1) {
        list.push(value === 7 ? 0 : value);
      }
      return Array.from(new Set(list)).sort(function (a, b) { return a - b; });
    }

    function summarizeValues(values, def) {
      if (def.key === 'dayOfWeek') {
        return values.map(function (value) { return DAY_NAMES[value]; }).join(', ');
      }
      if (def.key === 'month') {
        return values.map(function (value) { return MONTH_NAMES[value - 1]; }).join(', ');
      }
      if (values.length > 10) {
        return values.slice(0, 10).join(', ') + ' …';
      }
      return values.join(', ');
    }

    function describeFieldToken(token, def) {
      if (token === '*') {
        return 'Every ' + def.label.toLowerCase();
      }
      if (/^\*\/\d+$/.test(token)) {
        return 'Every ' + token.slice(2) + ' ' + def.label.toLowerCase() + (token.slice(2) === '1' ? '' : 's');
      }
      if (/^\d+$/.test(token)) {
        return 'Only value ' + token;
      }
      if (/^\d+-\d+$/.test(token)) {
        return 'Inclusive range from ' + token.replace('-', ' to ');
      }
      if (token.indexOf(',') !== -1) {
        return 'Explicit list of allowed values';
      }
      return 'Custom token';
    }

    function calculateNextRuns(schedule, count) {
      var runs = [];
      var now = new Date();
      var horizon = new Date(now.getTime());
      horizon.setFullYear(horizon.getFullYear() + 5);

      if (schedule.hasSeconds) {
        var cursor = new Date(now.getTime() + 1000);
        cursor.setMilliseconds(0);

        while (runs.length < count && cursor.getTime() <= horizon.getTime()) {
          var minutePoint = new Date(cursor.getTime());
          minutePoint.setSeconds(0, 0);

          if (matchesMinuteWindow(minutePoint, schedule)) {
            var seconds = schedule.fields.second.values;
            for (var secondIndex = 0; secondIndex < seconds.length && runs.length < count; secondIndex += 1) {
              var candidate = new Date(minutePoint.getTime());
              candidate.setSeconds(seconds[secondIndex], 0);
              if (candidate.getTime() >= cursor.getTime() && matchesFullSchedule(candidate, schedule)) {
                runs.push(candidate);
              }
            }
          }

          minutePoint.setMinutes(minutePoint.getMinutes() + 1, 0, 0);
          cursor = minutePoint;
        }
      } else {
        var minuteCursor = new Date(now.getTime());
        minuteCursor.setSeconds(0, 0);
        minuteCursor.setMinutes(minuteCursor.getMinutes() + 1);

        while (runs.length < count && minuteCursor.getTime() <= horizon.getTime()) {
          if (matchesFullSchedule(minuteCursor, schedule)) {
            runs.push(new Date(minuteCursor.getTime()));
          }
          minuteCursor.setMinutes(minuteCursor.getMinutes() + 1, 0, 0);
        }
      }

      if (runs.length < count) {
        throw new Error('Could not find 10 matching run times within the search window. Try a broader schedule.');
      }

      return runs;
    }

    function matchesMinuteWindow(date, schedule) {
      return fieldMatches(schedule.fields.minute, date.getMinutes()) &&
        fieldMatches(schedule.fields.hour, date.getHours()) &&
        fieldMatches(schedule.fields.month, date.getMonth() + 1) &&
        dayMatches(date, schedule);
    }

    function matchesFullSchedule(date, schedule) {
      return fieldMatches(schedule.fields.second, date.getSeconds()) &&
        fieldMatches(schedule.fields.minute, date.getMinutes()) &&
        fieldMatches(schedule.fields.hour, date.getHours()) &&
        fieldMatches(schedule.fields.month, date.getMonth() + 1) &&
        dayMatches(date, schedule);
    }

    function dayMatches(date, schedule) {
      var domField = schedule.fields.dayOfMonth;
      var dowField = schedule.fields.dayOfWeek;
      var domMatch = fieldMatches(domField, date.getDate());
      var dowMatch = fieldMatches(dowField, date.getDay());

      if (domField.any && dowField.any) {
        return true;
      }
      if (domField.any) {
        return dowMatch;
      }
      if (dowField.any) {
        return domMatch;
      }
      return domMatch || dowMatch;
    }

    function fieldMatches(field, value) {
      return field.any || field.valueSet.has(value);
    }

    function renderDescription(schedule) {
      document.getElementById('descriptionBox').textContent = describeExpression(schedule);
    }

    function describeExpression(schedule) {
      var second = schedule.fields.second;
      var minute = schedule.fields.minute;
      var hour = schedule.fields.hour;
      var dayOfMonth = schedule.fields.dayOfMonth;
      var month = schedule.fields.month;
      var dayOfWeek = schedule.fields.dayOfWeek;

      if (schedule.hasSeconds && second.any && minute.any && hour.any && dayOfMonth.any && month.any && dayOfWeek.any) {
        return 'Every second.';
      }
      if (!schedule.hasSeconds && minute.any && hour.any && dayOfMonth.any && month.any && dayOfWeek.any) {
        return 'Every minute.';
      }
      if (!schedule.hasSeconds && /^\*\/\d+$/.test(minute.token) && hour.any && dayOfMonth.any && month.any && dayOfWeek.any) {
        return 'Every ' + minute.token.slice(2) + ' minutes.';
      }
      if (schedule.hasSeconds && /^\*\/\d+$/.test(second.token) && minute.any && hour.any && dayOfMonth.any && month.any && dayOfWeek.any) {
        return 'Every ' + second.token.slice(2) + ' seconds.';
      }
      if (isSingle(hour) && isSingle(minute) && (!schedule.hasSeconds || isSingle(second) || second.token === '—') && dayOfMonth.any && month.any && dayOfWeek.any) {
        return 'Every day at ' + formatClock(hour.values[0], minute.values[0], schedule.hasSeconds ? second.values[0] : 0, schedule.hasSeconds) + '.';
      }
      if (hour.any && isSingle(minute) && dayOfMonth.any && month.any && dayOfWeek.any && (!schedule.hasSeconds || isSingle(second) || second.token === '—')) {
        return 'Every hour at minute ' + pad(minute.values[0]) + (schedule.hasSeconds ? (' and second ' + pad(second.values[0])) : '') + '.';
      }
      if (!dayOfWeek.any && isSingle(hour) && isSingle(minute) && dayOfMonth.any && month.any) {
        return 'Every ' + dayOfWeek.values.map(function (value) { return DAY_NAMES[value]; }).join(', ') + ' at ' + formatClock(hour.values[0], minute.values[0], schedule.hasSeconds ? second.values[0] : 0, schedule.hasSeconds) + '.';
      }
      if (!dayOfMonth.any && isSingle(hour) && isSingle(minute) && month.any && dayOfWeek.any) {
        return 'Every month on day ' + dayOfMonth.values.join(', ') + ' at ' + formatClock(hour.values[0], minute.values[0], schedule.hasSeconds ? second.values[0] : 0, schedule.hasSeconds) + '.';
      }
      if (!month.any && !dayOfMonth.any && isSingle(hour) && isSingle(minute) && dayOfWeek.any) {
        return 'Every year in ' + month.values.map(function (value) { return MONTH_NAMES[value - 1]; }).join(', ') + ' on day ' + dayOfMonth.values.join(', ') + ' at ' + formatClock(hour.values[0], minute.values[0], schedule.hasSeconds ? second.values[0] : 0, schedule.hasSeconds) + '.';
      }

      var parts = [];
      if (schedule.hasSeconds) {
        parts.push('seconds: ' + describeFieldForSentence(second, 'second'));
      }
      parts.push('minutes: ' + describeFieldForSentence(minute, 'minute'));
      parts.push('hours: ' + describeFieldForSentence(hour, 'hour'));
      parts.push('day-of-month: ' + describeFieldForSentence(dayOfMonth, 'day'));
      parts.push('month: ' + describeFieldForSentence(month, 'month'));
      parts.push('day-of-week: ' + describeFieldForSentence(dayOfWeek, 'weekday'));
      return 'Runs when ' + parts.join('; ') + '.';
    }

    function describeFieldForSentence(field, unit) {
      if (field.any) {
        return 'every ' + unit;
      }
      if (/^\*\/\d+$/.test(field.token)) {
        return 'every ' + field.token.slice(2) + ' ' + unit + (field.token.slice(2) === '1' ? '' : 's');
      }
      if (field.values.length === 1) {
        return 'only ' + field.values[0];
      }
      return 'allowed values ' + field.token;
    }

    function isSingle(field) {
      return !field.any && field.values.length === 1;
    }

    function pad(value) {
      return String(value).padStart(2, '0');
    }

    function formatClock(hour, minute, second, includeSeconds) {
      var suffix = hour >= 12 ? 'PM' : 'AM';
      var displayHour = hour % 12;
      if (displayHour === 0) {
        displayHour = 12;
      }
      return displayHour + ':' + pad(minute) + (includeSeconds ? (':' + pad(second)) : '') + ' ' + suffix;
    }

    function renderRuns(runs, includeSeconds) {
      var body = document.getElementById('runsBody');
      body.innerHTML = runs.map(function (run, index) {
        return '<tr><td>' + (index + 1) + '</td><td>' + formatRun(run, includeSeconds) + '</td></tr>';
      }).join('');
    }

    function formatRun(date, includeSeconds) {
      return date.toLocaleString([], {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: includeSeconds ? '2-digit' : undefined
      });
    }

    function renderBreakdown(schedule) {
      var body = document.getElementById('breakdownBody');
      var rows = FIELD_DEFS.map(function (def) {
        var field = schedule.fields[def.key];
        if (!schedule.hasSeconds && def.key === 'second') {
          return {
            label: def.label,
            token: '—',
            summary: 'Not used in this 5-field expression',
            meaning: 'Optional seconds field omitted; matches on the minute.'
          };
        }
        return {
          label: def.label,
          token: field.token,
          summary: field.summary,
          meaning: def.meaning + '. ' + field.description + '.'
        };
      });

      body.innerHTML = rows.map(function (row) {
        return '<tr>' +
          '<td><strong>' + escapeHtml(row.label) + '</strong></td>' +
          '<td><code>' + escapeHtml(row.token) + '</code></td>' +
          '<td>' + escapeHtml(row.summary) + '</td>' +
          '<td>' + escapeHtml(row.meaning) + '</td>' +
        '</tr>';
      }).join('');
    }

    function showMessage(message, type) {
      var status = document.getElementById('status');
      status.className = 'status ' + type;
      status.textContent = message;
      status.style.display = 'block';
    }

    function escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
