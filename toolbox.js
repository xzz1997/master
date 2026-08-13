/* ============ 工具箱逻辑 ============ */

/* ---- 金价 ---- */
async function loadGold(force) {
  let d;
  try { d = await api('/gold-price', { ttl: 'tool', force }); }
  catch { d = SAMPLE.gold; }
  const metals = (Array.isArray(d) ? d : (d.metals || d.list || [])).slice(0, 8);
  const stores = (d.stores || []).slice(0, 8);
  const banks = (d.banks || []).slice(0, 6);
  const recycle = (d.recycle || []).slice(0, 6);
  const el = document.getElementById('goldMetals');
  el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">
    ${metals.map(m => `
      <div class="metric">
        <div class="metric-label">${esc(m.name || '')}</div>
        <div class="metric-val" style="font-size:17px;color:var(--accent-3)">${esc(m.sell_price ?? m.price ?? '--')}</div>
        <div style="font-size:11px;color:var(--text-3);margin-top:3px">
          ${m.today_price != null ? '今开 ' + esc(m.today_price) + ' · ' : ''}${m.high_price != null ? '高 ' + esc(m.high_price) : ''}${m.low_price != null ? ' / 低 ' + esc(m.low_price) : ''}
        </div>
        <div style="font-size:10.5px;color:var(--text-3)">${esc(m.unit || '')}</div>
      </div>`).join('')}
  </div>`;
  document.getElementById('goldStores').innerHTML = stores.map(s => `<tr><td class="strong">${esc(s.brand || s.name || '')}</td><td>${esc(s.product || '')}</td><td class="strong">${esc(s.price ?? '--')}</td><td>${esc(s.unit || '')}</td></tr>`).join('');
  document.getElementById('goldBanks').innerHTML = banks.map(s => `<tr><td class="strong">${esc(s.bank || s.name || '')}</td><td class="strong">${esc(s.price ?? '--')} ${esc(s.unit || '')}</td></tr>`).join('');
  document.getElementById('goldRecycle').innerHTML = recycle.map(s => `<tr><td class="strong">${esc(s.brand || s.name || '')}</td><td class="strong">${esc(s.price ?? '--')} ${esc(s.unit || '')}</td></tr>`).join('');
  document.getElementById('goldMeta').textContent = '更新于 ' + (d.date || (d.updated || ''));
}

/* ---- 天气 ---- */
const CITY_PRESETS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安', '重庆', '苏州'];
function initWeather() {
  const row = document.getElementById('cityChips');
  row.innerHTML = CITY_PRESETS.map(c => `<span class="city-chip ${c === '北京' ? 'active' : ''}" data-city="${c}">${c}</span>`).join('');
  row.querySelectorAll('.city-chip').forEach(ch => ch.addEventListener('click', () => {
    row.querySelectorAll('.city-chip').forEach(x => x.classList.toggle('active', x === ch));
    document.getElementById('cityInput').value = ch.dataset.city;
    doWeather();
  }));
}
async function doWeather(force) {
  const city = (document.getElementById('cityInput').value || '北京').trim();
  const box = document.getElementById('weatherBox');
  box.innerHTML = '<div class="skel" style="height:120px;width:100%"></div>';
  let d;
  try { d = await api('/weather?query=' + encodeURIComponent(city), { ttl: 'tool', force }); }
  catch { d = SAMPLE.weather; }
  const w = d.weather || {};
  const aq = d.air_quality || {};
  const sun = d.sunrise || {};
  const loc = d.location || {};
  const indices = (d.life_indices || []).slice(0, 12);
  const alerts = d.alerts || [];
  const icon = w.weather_icon ? `<img class="w-icon" src="${esc(w.weather_icon)}" alt="weather" onerror="this.style.display='none'">` : `<div class="w-icon" style="font-size:56px;display:grid;place-items:center">${weatherEmoji(w.condition_code)}</div>`;
  box.innerHTML = `
    <div class="card" style="background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 14%,transparent),color-mix(in srgb,var(--accent-2) 10%,transparent));box-shadow:none;padding:20px 22px">
      <div style="font-size:13px;color:var(--text-2);margin-bottom:10px">📍 ${esc(loc.city || loc.name || city)} <span style="color:var(--text-3)">${esc(loc.province || '')}</span></div>
      <div class="weather-main">
        ${icon}
        <div>
          <div class="w-temp">${w.temperature ?? '--'}°C</div>
          <div class="w-cond">${esc(w.condition || '')} · ${esc(w.wind_direction || '')}${esc(w.wind_power || '')}级</div>
        </div>
      </div>
      <div class="w-metrics">
        <div class="metric"><div class="metric-label">湿度</div><div class="metric-val">${w.humidity ?? '--'}%</div></div>
        <div class="metric"><div class="metric-label">气压</div><div class="metric-val">${w.pressure ?? '--'} hPa</div></div>
        <div class="metric"><div class="metric-label">降水</div><div class="metric-val">${w.precipitation ?? '--'} mm</div></div>
        <div class="metric"><div class="metric-label">空气质量</div><div class="metric-val">${aq.quality || '--'} <span style="font-size:11px;color:var(--text-3)">AQI ${aq.aqi ?? ''}</span></div></div>
        <div class="metric"><div class="metric-label">PM2.5</div><div class="metric-val">${aq.pm25 ?? '--'}</div></div>
        <div class="metric"><div class="metric-label">日出 / 日落</div><div class="metric-val" style="font-size:13px">${sun.sunrise_desc || '--'} / ${sun.sunset_desc || '--'}</div></div>
      </div>
    </div>
    ${alerts && alerts.length ? `<div class="alert-box">⚠️ ${alerts.slice(0, 3).map(a => esc(a.title || a.type || '') + (a.level ? '（' + esc(a.level) + '）' : '') + (a.description ? '：' + esc(a.description) : '')).join('<br>')}</div>` : ''}
    <div style="font-size:13.5px;font-weight:700;color:var(--text-2);margin:16px 0 4px">生活指数</div>
    <div class="indices">
      ${indices.map(i => `<div class="index-item"><b>${esc(i.name || '')}</b><span class="lv">${esc(i.level || '')}</span><p>${esc(i.description || '')}</p></div>`).join('')}
    </div>`;
}
function weatherEmoji(code) {
  const map = { '00': '☀️', '01': '🌤️', '02': '⛅', '03': '☁️', '04': '☁️', '05': '🌧️', '06': '🌧️', '07': '🌧️', '08': '⛈️', '09': '🌦️', '10': '🌦️', '11': '🌧️', '12': '🌧️', '13': '🌨️', '14': '🌨️', '15': '❄️', '16': '❄️', '17': '🌨️', '18': '🌫️', '19': '🌫️', '20': '🌫️', '21': '🌫️', '22': '🌫️', '23': '🌪️', '24': '🌪️', '25': '🌪️', '26': '🌫️', '27': '🌙', '28': '🌙', '29': '🌙', '30': '🌙', '31': '🌙', '32': '🌙', '33': '🌙', '34': '🌙', '35': '🌙', '36': '🌙', '37': '🌙', '38': '🌙', '39': '🌙', '40': '🌙', '41': '🌧️', '42': '🌧️', '43': '🌧️', '44': '🌧️', '45': '🌧️', '46': '🌧️', '47': '🌧️', '48': '🌧️', '49': '🌧️', '50': '🌧️', '51': '🌧️', '52': '🌧️', '53': '🌧️', '54': '🌧️', '55': '🌧️', '56': '🌧️', '57': '🌧️', '58': '🌧️', '59': '🌧️', '60': '🌧️', '61': '🌧️', '62': '🌧️', '63': '🌧️', '64': '🌧️', '65': '🌧️', '66': '🌧️', '67': '🌧️', '68': '🌧️', '69': '🌧️', '70': '🌧️', '71': '🌧️', '72': '🌧️', '73': '🌧️', '74': '🌧️', '75': '🌧️', '76': '🌧️', '77': '🌧️', '78': '🌧️', '79': '🌧️', '80': '🌧️', '81': '🌧️', '82': '🌧️', '83': '🌧️', '84': '🌧️', '85': '🌧️', '86': '🌧️', '87': '🌧️', '88': '🌧️', '89': '🌧️', '90': '🌧️', '91': '🌧️', '92': '🌧️', '93': '🌧️', '94': '🌧️', '95': '🌧️', '96': '🌧️', '97': '🌧️', '98': '🌧️', '99': '⛈️' };
  return map[String(code)] || '🌡️';
}

/* ---- 翻译 ---- */
let FY_LANGS = [];
async function initFanyi() {
  try { FY_LANGS = await api('/fanyi/langs', { ttl: 'tool' }); }
  catch { FY_LANGS = [{ code: 'zh-CHS', label: '中文' }, { code: 'en', label: '英语' }, { code: 'ja', label: '日语' }, { code: 'ko', label: '韩语' }, { code: 'fr', label: '法语' }, { code: 'de', label: '德语' }, { code: 'ru', label: '俄语' }, { code: 'es', label: '西班牙语' }, { code: 'zh-CHT', label: '中文(繁体)' }]; }
  const list = Array.isArray(FY_LANGS) ? FY_LANGS : (FY_LANGS.list || FY_LANGS.data || []);
  const from = document.getElementById('fyFrom');
  const to = document.getElementById('fyTo');
  from.innerHTML = `<option value="auto">🌐 自动检测</option>` + list.map(l => `<option value="${esc(l.code)}">${esc(l.label)}</option>`).join('');
  to.innerHTML = list.map(l => `<option value="${esc(l.code)}" ${l.code === 'zh-CHS' ? 'selected' : ''}>${esc(l.label)}</option>`).join('');
  document.getElementById('fySwap').addEventListener('click', () => {
    const a = from.value, b = to.value;
    if (a !== 'auto') { from.value = b; to.value = a; }
    if (document.getElementById('fyText').value) doFanyi();
  });
}
async function doFanyi() {
  const text = document.getElementById('fyText').value.trim();
  const box = document.getElementById('fyResult');
  if (!text) { box.innerHTML = '<div style="color:var(--text-3);font-size:13px;margin-top:10px">请输入要翻译的文字</div>'; return; }
  const from = document.getElementById('fyFrom').value;
  const to = document.getElementById('fyTo').value;
  box.innerHTML = '<div class="skel" style="height:80px;width:100%;margin-top:10px"></div>';
  let d;
  try { d = await api('/fanyi?text=' + encodeURIComponent(text) + '&from=' + from + '&to=' + to, { ttl: 'random' }); }
  catch { box.innerHTML = '<div style="color:var(--red);font-size:13px;margin-top:10px">翻译接口暂不可用，请稍后再试</div>'; return; }
  const src = d.source || {}, tgt = d.target || {};
  box.innerHTML = `
    <div class="fy-result">
      <div class="fy-block">
        <div class="fy-label">原文 · ${esc(src.type_desc || src.type || '')}</div>
        <div class="fy-text">${esc(src.text || '')}</div>
        ${src.pronounce ? `<div class="fy-pronounce">[${esc(src.pronounce)}]</div>` : ''}
      </div>
      <div class="fy-block" style="border-color:color-mix(in srgb,var(--accent) 40%,var(--border))">
        <div class="fy-label">译文 · ${esc(tgt.type_desc || tgt.type || '')}</div>
        <div class="fy-text" style="font-size:18px;font-weight:600">${esc(tgt.text || '')}</div>
        ${tgt.pronounce ? `<div class="fy-pronounce">[${esc(tgt.pronounce)}]</div>` : ''}
      </div>
    </div>`;
}

/* ---- 汇率 ---- */
async function loadExchange(force) {
  const box = document.getElementById('fxTable');
  const meta = document.getElementById('fxMeta');
  let d;
  try { d = await api('/exchange-rate', { ttl: 'tool', force }); }
  catch { d = SAMPLE.exchange; }
  const rates = (d.rates || d.list || d.data || []);
  const list = Array.isArray(rates) ? rates : Object.entries(rates).map(([k, v]) => ({ code: k, rate: v }));
  box.innerHTML = list.slice(0, 20).map(r => {
    const code = r.code || r.currency || r.name || r.abbr || '';
    const nm = r.name || r.currency_name || '';
    const rate = r.rate ?? r.price ?? r.value ?? r.exchange_rate ?? r.cny_rate ?? r.sell ?? '--';
    const up = (r.change ?? r.change_rate) != null && Number(r.change || r.change_rate) > 0;
    const down = (r.change ?? r.change_rate) != null && Number(r.change || r.change_rate) < 0;
    return `<tr><td class="strong">${esc(code)}</td><td>${esc(nm)}</td><td class="strong ${up ? 'up' : down ? 'down' : ''}">${esc(rate)}</td></tr>`;
  }).join('');
  meta.textContent = '更新于 ' + (d.date || (d.updated || ''));
}

/* ---- 初始化 ---- */
function init() {
  initClock(); initTheme(); initScrollUI(); initMusic(); initWeather();
  loadGold(); doWeather(); initFanyi(); loadExchange();
  const rescan = observeReveals();
  const t = setInterval(() => rescan(), 1200);
  setTimeout(() => clearInterval(t), 15000);
}
document.addEventListener('DOMContentLoaded', init);