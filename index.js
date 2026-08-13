/* ============ 首页逻辑 ============ */

/* ---- 摸鱼日报 ---- */
async function loadMoyu(force) {
  const board = document.getElementById('dashBoard');
  let d;
  try { d = await api('/moyu?encoding=json', { ttl: 'moyu', force }); }
  catch { d = SAMPLE.moyu; }
  const lu = d.date.lunar || {};
  const today = d.today || {};
  document.getElementById('hsDate').textContent = `${d.date.gregorian} ${d.date.weekday}`;
  document.getElementById('hsLunar').textContent = `${lu.yearGanZhi || ''}年${lu.monthCN || ''}${lu.dayCN || ''}`;
  const tags = [];
  if (today.isHoliday) tags.push('<span class="tag tag-holiday">🎉 ' + (today.holidayName || '节假日') + '</span>');
  else if (today.isWeekend) tags.push('<span class="tag tag-rest">😎 周末</span>');
  else tags.push('<span class="tag tag-work">💼 工作日</span>');
  if (today.solarTerm) tags.push('<span class="tag tag-holiday">🌿 ' + today.solarTerm + '</span>');
  if (today.lunarFestivals && today.lunarFestivals.length) tags.push('<span class="tag tag-rest">🎊 ' + today.lunarFestivals[0] + '</span>');
  const cd = d.countdown || {};
  const nh = d.nextHoliday, nw = d.nextWeekend;
  board.innerHTML = `
    <div class="card">
      <div class="date-big">${esc(d.date.monthCN || d.date.gregorian)} ${esc(d.date.dayCN || '')}</div>
      <div class="date-lunar"><span>${esc(d.date.gregorian)} ${esc(d.date.weekday)}</span><span>·</span><span>${esc(lu.yearGanZhi || '')} ${esc(lu.monthGanZhi || '')}${esc(lu.dayGanZhi || '')}</span><span>·</span><span>属${esc(lu.zodiac || '')}</span>${tags.join('')}</div>
      <div class="progress">
        ${(['week','month','year']).map(k => {
          const p = d.progress[k] || {};
          return `<div class="prow"><span class="pname">${k === 'week' ? '本周' : k === 'month' ? '本月' : '今年'}</span>
            <div class="pbar"><div class="pfill" data-w="${p.percentage || 0}"></div></div>
            <span class="pval">${p.passed ?? '--'} / ${p.total ?? '--'} · ${p.percentage ?? 0}%</span></div>`;
        }).join('')}
      </div>
    </div>
    <div class="card">
      <div class="count-grid">
        ${nh ? `<div class="count-item"><span class="count-label">距 ${esc(nh.name)}</span><span class="count-num">${nh.until ?? '--'}<small> 天</small></span></div>` : ''}
        ${nw ? `<div class="count-item"><span class="count-label">距周末</span><span class="count-num">${nw.daysUntil ?? '--'}<small> 天</small></span></div>` : ''}
        <div class="count-item"><span class="count-label">距月底</span><span class="count-num">${cd.toMonthEnd ?? '--'}<small> 天</small></span></div>
        <div class="count-item"><span class="count-label">距年底</span><span class="count-num">${cd.toYearEnd ?? '--'}<small> 天</small></span></div>
        ${nh && nh.duration ? `<div class="count-item"><span class="count-label">${esc(nh.name)}假期</span><span class="count-num">${nh.duration}<small> 天</small></span></div>` : ''}
        <div class="count-item"><span class="count-label">本周剩余</span><span class="count-num">${(d.progress.week && d.progress.week.remaining) ?? '--'}<small> 天</small></span></div>
      </div>
      <div class="quote">${esc(d.moyuQuote || '摸鱼一时爽，一直摸鱼一直爽。')}</div>
    </div>`;
  requestAnimationFrame(() => document.querySelectorAll('.pfill').forEach(el => { el.style.width = el.dataset.w + '%'; }));
  document.getElementById('hsCountdown').textContent = nh ? `距${nh.name} ${nh.until}天` : `距月底 ${cd.toMonthEnd ?? '-'}天`;
}

/* ---- 每日60秒 ---- */
async function loadNews(force) {
  const grid = document.getElementById('newsGrid');
  const tip = document.getElementById('tipBox');
  renderSkels(grid, 8, '64px');
  let d;
  try { d = await api('/60s', { ttl: '60s', force }); }
  catch { d = SAMPLE.news; }
  const news = d.news || [];
  grid.innerHTML = news.map((n, i) => `
    <div class="news-item reveal">
      <div class="n-num">${i + 1}</div>
      <div class="n-text">${esc(n)}</div>
    </div>`).join('');
  if (d.tip) { tip.style.display = 'flex'; tip.innerHTML = `<span>💡</span><span>${esc(d.tip)}</span>`; }
  else tip.style.display = 'none';
  document.getElementById('tickerText').textContent = '【' + (d.date || '') + '】 ' + news.slice(0, 10).join('　·　');
}

/* ---- 今日壁纸 ---- */
async function loadWallpaper(force) {
  const img = document.getElementById('wpImg');
  const t = document.getElementById('wpTitle');
  const c = document.getElementById('wpCopy');
  img.className = 'wp-img skel';
  let d;
  try { d = await api('/bing', { ttl: 'bing', force }); }
  catch { d = { title: '今日壁纸（示例）', headline: '数据源不可用时显示示例占位图', copyright: '© 60s API' }; }
  t.textContent = d.title || d.headline || '';
  c.textContent = d.copyright || '';
  const src = d.cover || d.image || d.cover_4k || '';
  if (src) {
    const probe = new Image();
    probe.onload = () => { img.src = src; img.className = 'wp-img'; };
    probe.onerror = () => { img.className = 'wp-img'; img.style.background = 'linear-gradient(120deg,#1c2440,#3a2c54)'; };
    probe.src = src;
    img.alt = t.textContent;
  }
}

/* ---- 热搜榜单（含网易云子榜单） ---- */
const RANK_TABS = [
  { id: 'weibo', name: '微博', path: '/weibo', label: '热搜' },
  { id: 'bili', name: 'B站', path: '/bili', label: '热门' },
  { id: 'zhihu', name: '知乎', path: '/zhihu', label: '热榜' },
  { id: 'douyin', name: '抖音', path: '/douyin', label: '热点' },
  { id: 'baidu', name: '百度', path: '/baidu/hot', label: '热搜' },
  { id: 'rednote', name: '小红书', path: '/rednote', label: '热门' },
  { id: 'ncm', name: '网易云', path: null, label: '榜单' },
];
let curRank = 'weibo';
let ncmCharts = [];
let curNcm = null;

function initRankTabs() {
  const tabs = document.getElementById('rankTabs');
  tabs.innerHTML = RANK_TABS.map(t => `<button class="tab ${t.id === curRank ? 'active' : ''}" data-id="${t.id}">${t.name}</button>`).join('');
  tabs.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
    curRank = b.dataset.id;
    tabs.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === b));
    loadRank();
  }));
}

function extractRankItems(d) {
  const list = Array.isArray(d) ? d : (d.list || d.data || []);
  return list.map(it => {
    if (typeof it === 'string') return { title: it, hot: null, tag: null, url: null };
    return {
      title: it.title || it.name || it.word || it.hotword || it.question || it.keyword || it.content || JSON.stringify(it).slice(0, 40),
      hot: it.hot || it.hotValue || it.hot_value || it.heat || it.num || it.hot_num || it.viewCount || it.readCount || null,
      tag: it.label || it.tag || it.icon || null,
      url: it.url || it.link || it.mobileUrl || null
    };
  }).filter(x => x.title).slice(0, 15);
}

async function loadNcmCharts() {
  const sub = document.getElementById('rankSubTabs');
  try { ncmCharts = await api('/ncm-rank/list', { ttl: 'rank' }); }
  catch { ncmCharts = SAMPLE.ncmCharts; }
  const list = (Array.isArray(ncmCharts) ? ncmCharts : (ncmCharts.list || ncmCharts.data || [])).slice(0, 6);
  curNcm = curNcm && list.find(c => c.id === curNcm.id) ? curNcm : list[0];
  sub.innerHTML = `<div class="sub-tabs">${list.map(c => `<button class="sub-tab ${c.id === curNcm.id ? 'active' : ''}" data-id="${c.id}">${esc(c.name)}</button>`).join('')}</div>`;
  sub.querySelectorAll('.sub-tab').forEach(b => b.addEventListener('click', () => {
    curNcm = list.find(c => c.id === Number(b.dataset.id));
    sub.querySelectorAll('.sub-tab').forEach(x => x.classList.toggle('active', x === b));
    loadNcmSongs();
  }));
  loadNcmSongs();
}

async function loadNcmSongs() {
  const el = document.getElementById('rankList');
  renderSkels(el, 10, '58px');
  let songs;
  try { songs = await api('/ncm-rank/' + curNcm.id, { ttl: 'rank' }); }
  catch { songs = SAMPLE.ncmSongs.map((s, i) => ({ rank: i + 1, title: s[0], artist: [{ name: s[1] }], album: { name: s[2] } })); }
  const list = Array.isArray(songs) ? songs : (songs.list || songs.data || []);
  el.innerHTML = list.slice(0, 15).map((s, i) => {
    const no = i < 3 ? `<span class="song-no top3">${s.rank || i + 1}</span>` : `<span class="song-no">${s.rank || i + 1}</span>`;
    const artist = (Array.isArray(s.artist) ? s.artist.map(a => a.name).join(' / ') : s.artist || s.singer || '') ;
    return `<div class="song-item" onclick="openExternal('${esc((s.link || '').replace(/'/g, "\\'"))}')">
      ${no}
      <div class="song-info">
        <div class="song-title">${esc(s.title || s.name || '')}</div>
        <div class="song-artist">${esc(artist)} · ${esc((s.album && s.album.name) || '')}</div>
      </div>
      <div class="song-meta">${esc(s.duration_desc || '')}</div>
    </div>`;
  }).join('');
}

async function loadRank() {
  const sub = document.getElementById('rankSubTabs');
  if (curRank === 'ncm') { sub.style.display = ''; loadNcmCharts(); return; }
  sub.style.display = 'none';
  const tab = RANK_TABS.find(t => t.id === curRank);
  const listEl = document.getElementById('rankList');
  renderSkels(listEl, 10, '58px');
  let items;
  try { items = extractRankItems(await api(tab.path, { ttl: 'rank' })); }
  catch { items = (SAMPLE.rank[curRank] || []).map(([title, hot, tag]) => ({ title, hot, tag, url: null })); }
  listEl.innerHTML = items.map((it, i) => {
    const no = i < 3 ? `<span class="rank-no top3">${i + 1}</span>` : `<span class="rank-no n">${i + 1}</span>`;
    const hot = it.hot != null ? `<span class="rank-hot">🔥 ${numFmt(it.hot)}</span>` : '';
    const tag = it.tag ? `<span class="rank-tag">${esc(String(it.tag))}</span>` : '';
    return `<a class="rank-item" ${it.url ? `href="${esc(it.url)}" target="_blank" rel="noopener"` : ''}>
      ${no}<span class="rank-title">${esc(it.title)}</span>${hot}${tag}</a>`;
  }).join('');
}

/* ---- 娱乐百宝箱 ---- */
const ENT_CARDS = [
  { id: 'hitokoto', icon: '💬', name: '一言', desc: '随机一句治愈/扎心的话', path: '/hitokoto', pick: d => d.hitokoto || d.text || d.content || '' },
  { id: 'duanzi', icon: '😂', name: '段子', desc: '随机沙雕段子', path: '/duanzi', pick: d => d.content || d.text || d.title || d.duanzi || '' },
  { id: 'dad', icon: '🧊', name: '冷笑话', desc: '冻到你发抖', path: '/dad-joke', pick: d => d.content || d.text || d.joke || '' },
  { id: 'kfc', icon: '🍗', name: '疯狂星期四', desc: 'V我50文学', path: '/kfc', pick: d => d.text || d.content || d.title || '' },
  { id: 'answer', icon: '📖', name: '答案之书', desc: '帮你做决定', path: '/answer', pick: d => d.answer || d.text || d.content || '' },
  { id: 'fabing', icon: '🤒', name: '发病文学', desc: '输入名字定制', path: '/fabing', pick: d => d.text || d.content || d.article || '', custom: true },
  { id: 'luck', icon: '🍀', name: '今日运势', desc: '测测今天手气', path: '/luck', pick: d => { const lv = d.level || d.lucky || d.grade || ''; const msg = d.message || d.tip || d.content || d.text || ''; return (lv ? '【' + lv + '】' : '') + (msg || '运势不错！'); } },
  { id: 'changya', icon: '🎤', name: '随机唱歌', desc: 'AI 唱给你听', path: '/changya', pick: d => (d.user ? d.user + ' - ' : '') + (d.song || ''), audio: d => d.audio && (d.audio.url || d.audio) },
];
let entState = {}, entLoading = {};

function initEnt() {
  const grid = document.getElementById('entGrid');
  grid.innerHTML = ENT_CARDS.map(c => `
    <div class="card ent-card reveal" data-id="${c.id}">
      <div class="ent-icon">${c.icon}</div>
      <div class="ent-name">${c.name}</div>
      <div class="ent-desc" style="font-size:12.5px;color:var(--text-3)">${c.desc}</div>
      ${c.custom ? '<div style="font-size:13px"><input id="fabingName" value="张三" placeholder="你的名字" style="width:100%;background:var(--bg-soft);border:1px solid var(--border);color:var(--text);border-radius:10px;padding:8px 12px;font-size:13px;outline:none"></div>' : ''}
      <div class="ent-content" id="ent-${c.id}"><span style="color:var(--text-3)">滚动到这里自动加载</span></div>
      <div class="ent-meta" id="meta-${c.id}"></div>
      <div class="ent-foot">
        <button class="btn ghost" data-act="${c.id}">🎲 换一条</button>
        ${c.id === 'changya' ? '<button class="btn ghost" data-play="changya">▶ 播放</button>' : ''}
      </div>
    </div>`).join('');
  grid.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); loadEnt(b.dataset.act, true); }));
  grid.querySelectorAll('[data-play]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); playChangya(); }));
  ENT_CARDS.slice(0, 2).forEach(c => loadEnt(c.id));
  const io = new IntersectionObserver(es => es.forEach(x => { if (x.isIntersecting) { const id = x.target.dataset.id; if (!entState[id] && !entLoading[id]) loadEnt(id); io.unobserve(x.target); } }), { rootMargin: '120px' });
  ENT_CARDS.slice(4).forEach(c => io.observe(document.querySelector('[data-id="' + c.id + '"]')));
}

async function loadEnt(id, force) {
  const c = ENT_CARDS.find(x => x.id === id);
  const el = document.getElementById('ent-' + id);
  const meta = document.getElementById('meta-' + id);
  if (entLoading[id] && !force) return;
  entLoading[id] = true;
  el.innerHTML = '<span style="color:var(--text-3)">加载中…</span>';
  let text = '', isSample = false;
  try {
    let path = c.path;
    if (c.custom) { const name = (document.getElementById('fabingName') && document.getElementById('fabingName').value.trim()) || '张三'; path += '?name=' + encodeURIComponent(name); }
    const d = await api(path, { ttl: 'random', force });
    entState[id] = d;
    text = c.pick(d) || '(返回数据为空)';
  } catch { isSample = true; text = (SAMPLE[id] && (SAMPLE[id].content || SAMPLE[id].text || SAMPLE[id].answer || SAMPLE[id].hitokoto)) || '接口暂时不可用，稍后再试'; }
  el.innerHTML = esc(text);
  meta.textContent = isSample ? '示例数据 · 接口限流中' : '实时获取 · 点击换一条';
  entLoading[id] = false;
}

function playChangya() {
  const d = entState['changya'];
  const a = d && ENT_CARDS.find(x => x.id === 'changya').audio(d);
  const meta = document.getElementById('meta-changya');
  if (!a) { if (meta) meta.textContent = '请先点「换一条」获取歌曲再播放'; return; }
  let audioEl = document.getElementById('changyaAudio');
  if (!audioEl) {
    audioEl = document.createElement('audio');
    audioEl.id = 'changyaAudio';
    audioEl.controls = true;
    audioEl.style.width = '100%';
    document.querySelector('[data-id="changya"] .ent-foot').appendChild(audioEl);
  }
  audioEl.src = a.url || a;
  audioEl.play().catch(() => {});
}


/* ---- 初始化 ---- */
function init() {
  initClock(); initTheme(); initScrollUI(); initMusic(); initRankTabs(); initEnt();
  loadMoyu(); loadNews(); loadWallpaper(); loadRank(); initWelcome();
  const rescan = observeReveals();
  const t = setInterval(() => rescan(), 1200);
  setTimeout(() => clearInterval(t), 15000);
}
document.addEventListener('DOMContentLoaded', init);