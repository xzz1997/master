/* ============ 60s 娱乐站 · 公共层：API + 工具 + 音乐 ============ */
const API_BASE = 'https://60s.viki.moe/v2';
const MIRRORS = ['https://60s-api.viki.moe/v2', 'https://60s.crystelf.top/v2', 'https://60s.7se.cn/v2'];
const TTL = { '60s': 30 * 60 * 1000, 'moyu': 30 * 60 * 1000, 'bing': 6 * 60 * 60 * 1000, 'history': 6 * 60 * 60 * 1000, 'rank': 10 * 60 * 1000, 'tool': 20 * 60 * 1000, 'random': 0 };
let rateLimited = false;

/* ---- 请求队列：串行 + 间隔，避免触发 60s API 限流(1015) ---- */
let queue = Promise.resolve();
function enqueue(fn) {
  const p = queue.then(fn, fn);
  queue = p.catch(() => {});
  return p;
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function getCache(key) {
  try {
    const raw = localStorage.getItem('60s_site_' + key);
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (Date.now() - o.t > TTL[key]) return null;
    return o.data;
  } catch { return null; }
}
function setCache(key, data) {
  try { localStorage.setItem('60s_site_' + key, JSON.stringify({ t: Date.now(), data })); } catch {}
}

async function fetchJSON(url, timeout = 8000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const j = await res.json();
    if (j.code !== 200) throw new Error('code ' + j.code);
    return j.data;
  } finally { clearTimeout(timer); }
}

async function api(path, { ttl = '60s', force = false, timeout = 6000, queued = true } = {}) {
  if (!force) { const c = getCache(ttl); if (c) return c; }
  if (rateLimited) throw new Error('rate limited');
  const bases = [API_BASE, ...MIRRORS.slice(0, 1)];
  let lastErr = null;
  for (let i = 0; i < bases.length; i++) {
    const attempt = async () => {
      await sleep(i === 0 ? 0 : 200);
      if (rateLimited) throw new Error('rate limited');
      const t0 = Date.now();
      try { return await fetchJSON(bases[i] + path, timeout); }
      catch (e) { if (Date.now() - t0 < 1200) rateLimited = true; throw e; }
    };
    try {
      const data = queued ? await enqueue(attempt) : await attempt();
      if (ttl && TTL[ttl]) setCache(ttl, data);
      return data;
    } catch (e) { lastErr = e; if (rateLimited) break; }
  }
  throw lastErr || new Error('fetch failed');
}

/* ---- 通用工具 ---- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
function numFmt(n) {
  if (n == null || isNaN(n)) return '';
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '亿';
  if (n >= 10000) return (n / 10000).toFixed(1) + '万';
  return String(n);
}
function openExternal(url) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  window.open(url, '_blank', 'noopener');
}
function renderSkels(container, n, h = '54px') {
  container.innerHTML = Array.from({ length: n }, () => `<div class="skel" style="height:${h};width:100%"></div>`).join('');
}
function observeReveals() {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } }), { threshold: .06 });
  const scan = () => document.querySelectorAll('.reveal:not(.show)').forEach(el => io.observe(el));
  scan();
  return scan;
}
function initClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => { const d = new Date(); el.textContent = [d.getHours(), d.getMinutes(), d.getSeconds()].map(x => String(x).padStart(2, '0')).join(':'); };
  tick(); setInterval(tick, 1000);
}
function initTheme() {
  const btn = document.getElementById('themeBtn');
  if (!btn) return;
  const apply = () => { btn.textContent = document.documentElement.dataset.theme === 'dark' ? '🌙' : '☀️'; };
  btn.addEventListener('click', () => {
    document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    apply();
  });
  apply();
}
function initScrollUI() {
  const bar = document.getElementById('progressBar');
  const toTop = document.getElementById('toTop');
  if (bar) window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max * 100) : 0) + '%';
    if (toTop) toTop.classList.toggle('show', h.scrollTop > 600);
  }, { passive: true });
  if (toTop) toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---- 网易云音乐面板（右下角外链播放器） ---- */
const MUSIC_PRESETS = [
  { id: 186016, name: '晴天', artist: '周杰伦' },
  { id: 186020, name: '稻香', artist: '周杰伦' },
  { id: 186021, name: '七里香', artist: '周杰伦' },
  { id: 28815250, name: '起风了', artist: '买辣椒也用券' },
  { id: 1330348068, name: '孤勇者', artist: '陈奕迅' },
  { id: 167876, name: '夜曲', artist: '周杰伦' },
];
let musicState = { open: false, cur: 0 };
function initMusic() {
  const fab = document.getElementById('musicFab');
  const panel = document.getElementById('musicPanel');
  if (!fab || !panel) return;
  const renderList = () => {
    const list = panel.querySelector('.music-list');
    list.innerHTML = MUSIC_PRESETS.map((s, i) => `
      <div class="music-item ${i === musicState.cur ? 'active' : ''}" data-i="${i}">
        <span class="mi-num">${i + 1}</span>
        <span class="mi-name">${esc(s.name)}</span>
        <span class="mi-artist">${esc(s.artist)}</span>
      </div>`).join('');
    list.querySelectorAll('.music-item').forEach(el => el.addEventListener('click', () => {
      musicState.cur = Number(el.dataset.i);
      setSong();
      renderList();
    }));
  };
  const setSong = () => {
    const s = MUSIC_PRESETS[musicState.cur];
    const frame = panel.querySelector('.music-frame');
    frame.src = 'https://music.163.com/outchain/player?type=2&id=' + s.id + '&auto=1&height=66';
    panel.querySelector('.music-title').textContent = '🎵 ' + s.name + ' - ' + s.artist;
    fab.classList.add('playing');
  };
  fab.addEventListener('click', () => {
    musicState.open = !musicState.open;
    panel.classList.toggle('show', musicState.open);
    if (musicState.open) { renderList(); setSong(); }
  });
  // 点击面板外关闭
  document.addEventListener('click', (e) => {
    if (musicState.open && !panel.contains(e.target) && e.target !== fab) {
      musicState.open = false;
      panel.classList.remove('show');
    }
  });
}


/* ---- 开屏欢迎弹窗：每日运势 + 一言 ---- */
function initWelcome() {
  const overlay = document.getElementById('welcomeOverlay');
  if (!overlay) return;
  const render = async (force) => {
    let luck, hitokoto;
    try { luck = await api('/luck', { ttl: 'random', force, queued: false }); } catch { luck = SAMPLE.luck; }
    try { hitokoto = await api('/hitokoto', { ttl: 'random', force, queued: false }); } catch { hitokoto = SAMPLE.hitokoto; }
    const lv = luck.level || luck.lucky || luck.grade || '';
    const msg = luck.message || luck.tip || luck.content || luck.text || '运势不错！';
    document.getElementById('wfLevel').textContent = lv || '上上签';
    document.getElementById('wfMsg').textContent = msg;
    document.getElementById('whText').textContent = hitokoto.hitokoto || hitokoto.text || hitokoto.content || '…';
  };
  const close = () => {
    overlay.classList.remove('show');
    setTimeout(() => overlay.remove(), 600);
  };
  setTimeout(() => { overlay.classList.add('show'); render(); }, 500);
  const reroll = document.getElementById('welcomeReroll');
  const start = document.getElementById('welcomeStart');
  if (reroll) reroll.addEventListener('click', () => render(true));
  if (start) start.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

/* ---- 示例数据（接口限流/不可用时降级） ---- */
const SAMPLE = {
  moyu: { date: { gregorian: '2026-08-13', weekday: '星期四', lunar: { yearCN: '二零二六', monthCN: '七月', dayCN: '初一', yearGanZhi: '丙午', monthGanZhi: '丙申', dayGanZhi: '己未', zodiac: '马' } }, today: { isWorkday: true, isWeekend: false, isHoliday: false, holidayName: null }, progress: { week: { passed: 4, total: 7, remaining: 3, percentage: 57 }, month: { passed: 13, total: 31, remaining: 18, percentage: 42 }, year: { passed: 225, total: 365, remaining: 140, percentage: 62 } }, nextHoliday: { name: '中秋', date: '2026-09-25', until: 43, duration: 3 }, nextWeekend: { date: '2026-08-15', weekday: '星期六', daysUntil: 2 }, countdown: { toWeekEnd: 2, toFriday: 1, toMonthEnd: 18, toYearEnd: 140 }, moyuQuote: '我的座右铭：能坐着绝不站着，能躺着绝不坐着，能摸鱼绝不工作。' },
  news: { date: '2026-08-13', news: ['今年上半年全国结婚登记 327.5 万对，较去年同期减少 26.4 万对；离婚登记 138.3 万对，较去年同期增加 5.2 万对','银行能办结婚证了：天津首家银行内结婚登记点启用，领证还能定制银行卡','31 省上半年财政收入出炉：广东以 7421 亿元连续 35 年蝉联榜首','中汽协：7 月新能源汽车新车销量占比首超 60%','我国成功攻克锂云母提锂多项重大技术难题','我国主导的国际学术期刊《Vita》纸质刊首期发布','苏州：新就业群体台风中受伤最高可获 10000 元救助','美国撤销联邦政府设备使用 TikTok 禁令','世界气象组织：今年全球 7 月气温为有记录以来第二高','澳大利亚给外卖员定最低工资','NBA 洛杉矶湖人队被 125 亿美元出售','美国 7 月 CPI 同比涨幅回落至 3.4%','特朗普宣称完全控制霍尔木兹海峡','日本东京股市日经指数收盘上涨 0.8%','某地发布高温橙色预警'], tip: '不必害怕起步太晚，停下观望才是对时光最大的辜负' },
  hitokoto: { hitokoto: '在这个熟悉而陌生的城市中，无助地寻找一个陌生而熟悉的身影' },
  duanzi: { content: '老板问我为什么上班总看手机，我说我在学习，他说学习什么，我说学习怎么在老板眼皮底下摸鱼不被发现。' },
  dad: { content: '为什么程序员总分不清万圣节和圣诞节？因为 Oct 31 等于 Dec 25。' },
  kfc: { text: '疯狂星期四，V我50，我请你吃肯德基！' },
  answer: { answer: '与其犹豫，不如先去吃顿好的，吃饱了再做决定。' },
  fabing: { text: '我得了绝症，这个病叫“一天不摸鱼就会死”，医生说我命里缺你，V你50让我快乐一下。' },
  luck: { level: '上上签', message: '今天适合摸鱼，运气值爆棚，午饭加鸡腿！' },
  rank: {
    weibo: [['# 新歌 官方微博', 3684000, '热'],['夏日高温持续 多地发布橙色预警', 2651000, '热'],['某地暴雨 多部门联动抢险', 1987000, '热'],['电影暑期档票房突破百亿', 1753000, '新'],['奥运冠军回母校分享心路历程', 1542000, '热'],['新能源车销量占比创新高', 1329000, '热'],['晚霞刷屏 网友直呼浪漫', 1108000, '新'],['全民健身日 运动热情高涨', 987000, '热'],['某高校食堂推出创新菜品', 854000, '新'],['天文奇观即将上演', 723000, '热']],
    bili: [['【4K】夏日城市延时摄影', 985000, '热门'],['一口气看完年度科技大事件', 872000, '热门'],['挑战用100元在便利店吃一天', 764000, '热门'],['程序员爆肝24小时写代码', 655000, '热门'],['国风舞蹈 绝美古风演绎', 598000, '热门'],['硬核科普：黑洞到底长什么样', 534000, '热门'],['萌宠日常 治愈系合集', 487000, '热门'],['用Excel做了一款小游戏', 432000, '热门'],['宿舍整活大赛 笑不活了', 398000, '热门'],['旅行Vlog：一个人的川西环线', 356000, '热门']],
    zhihu: [['如何看待年轻人选择“躺平”式生活？', 1520000, 892],['2026 年最值得关注的科技趋势有哪些？', 1280000, 741],['工作三年后你明白了哪些道理？', 1130000, 658],['如何评价最近的国产电影？', 986000, 573],['有哪些相见恨晚的办公效率工具？', 854000, 502],['程序员 35 岁危机真的存在吗？', 791000, 466],['一个人如何高质量独处？', 723000, 421],['你见过哪些惊艳的代码技巧？', 654000, 385],['如何开始学一门新语言？', 598000, 352],['今年暑假有哪些值得一去的旅行地？', 543000, 318]],
    douyin: [['city不city啊', 2865000, '热'],['夏日清凉穿搭挑战', 2450000, '热'],['跟着美食博主吃遍夜市', 2130000, '热'],['狗狗的迷惑行为', 1980000, '热'],['手工耿新发明', 1750000, '热'],['明星街拍生图', 1560000, '热'],['健身打卡第100天', 1340000, '热'],['高考志愿填报指南', 1120000, '新'],['雨天城市漫步', 980000, '热'],['小众宝藏歌曲推荐', 865000, '新']],
    baidu: [['台风最新路径发布', 3240000, '热'],['全国多地开启高温模式', 2870000, '热'],['油价调整窗口即将开启', 2540000, '热'],['教育部发布新政策解读', 2210000, '热'],['某明星官宣新专辑', 1980000, '热'],['航天任务取得圆满成功', 1760000, '热'],['高校录取通知书陆续送达', 1540000, '热'],['暑期旅游热门目的地', 1320000, '热'],['新能源汽车下乡政策', 1100000, '热'],['世界杯预选赛赛程公布', 987000, '热']],
    rednote: [['一人食的快乐你懂吗', 986000, '热门'],['夏日冰饮自制教程', 875000, '热门'],['平价好物开箱', 764000, '热门'],['旅行拍照姿势合集', 653000, '热门'],['宿舍改造计划', 542000, '热门'],['健身餐一周不重样', 498000, '热门'],['宠物日常治愈系', 432000, '热门'],['手账排版灵感', 387000, '热门'],['护肤避雷指南', 356000, '热门'],['城市漫步打卡点', 321000, '热门']]
  },
  ncmCharts: [{ id: 19723756, name: '飙升榜' }, { id: 3779629, name: '新歌榜' }, { id: 3778678, name: '热歌榜' }, { id: 2884035, name: '原创榜' }],
  ncmSongs: [['背叛', '曹格', 'Superman'],['给我一个理由忘记', '黄丽玲', '寂寞不痛'],['稻香', '周杰伦', '魔杰座'],['晴天', '周杰伦', '叶惠美'],['起风了', '买辣椒也用券', '起风了'],['孤勇者', '陈奕迅', '孤勇者'],['夜曲', '周杰伦', '十一月的萧邦'],['七里香', '周杰伦', '七里香'],['光年之外', '邓紫棋', '光年之外'],['平凡之路', '朴树', '猎户星座']],
  gold: { metals: [{ name: '今日金价', sell_price: '946.92', today_price: '948.92', high_price: '963.54', low_price: '948.43', unit: '元/克' }, { name: '黄金9999', sell_price: '950.60', today_price: '950.90', high_price: '963.00', low_price: '950.00', unit: '元/克' }, { name: '伦敦金(现货黄金)', sell_price: '4382.01', today_price: '4382.36', high_price: '4449.59', low_price: '4380.48', unit: '美元/盎司' }, { name: '纽约黄金(美国)', sell_price: '4439.00', today_price: '4439.40', high_price: '4509.10', low_price: '4437.20', unit: '美元/盎司' }, { name: '白银价格', sell_price: '14.485', today_price: '14.585', high_price: '14.767', low_price: '14.502', unit: '元/克' }, { name: '铂金价格', sell_price: '371.80', today_price: '373.30', high_price: '378.90', low_price: '372.70', unit: '元/克' }], stores: [{ brand: '周大福', product: '黄金', price: '1340', unit: '元/克' }, { brand: '老凤祥', product: '黄金', price: '1338', unit: '元/克' }, { brand: '老庙黄金', product: '黄金', price: '1338', unit: '元/克' }, { brand: '周生生', product: '黄金', price: '1336', unit: '元/克' }, { brand: '六福珠宝', product: '黄金', price: '1338', unit: '元/克' }, { brand: '潮宏基', product: '黄金', price: '1340', unit: '元/克' }], banks: [{ bank: '工商银行', product: '金条', price: '950.0', unit: '元/克' }, { bank: '建设银行', product: '金条', price: '951.2', unit: '元/克' }, { bank: '农业银行', product: '金条', price: '948.5', unit: '元/克' }, { bank: '中国银行', product: '金条', price: '952.8', unit: '元/克' }], recycle: [{ brand: '周大福', price: '931' }, { brand: '老凤祥', price: '930' }, { brand: '老庙黄金', price: '929' }, { brand: '周生生', price: '928' }] },
  weather: { location: { name: '上海上海', city: '上海市', province: '上海' }, weather: { condition: '晴', condition_code: '02', temperature: 29, humidity: 75, pressure: 1000, precipitation: 0, wind_direction: '北风', wind_power: '3-4', weather_icon: 'https://mat1.gtimg.com/qqcdn/xw/tianqi/bigIcon/baitian/02.png' }, air_quality: { aqi: 20, level: 1, quality: '优', pm25: 7, pm10: 9, co: 0.4, no2: 8, o3: 63, so2: 6, rank: 55, total_cities: 375 }, sunrise: { sunrise_desc: '05:17', sunset_desc: '18:39' }, life_indices: [{ name: '穿衣', level: '热', description: '天气热，建议穿短袖、短裤、短薄外套等夏装。' }, { name: '运动', level: '较不宜', description: '有降水，推荐室内进行低强度运动。' }, { name: '防晒', level: '强', description: '属强紫外线天气，建议涂抹 SPF15-25 的防晒护肤品。' }, { name: '洗车', level: '不宜', description: '有雨，雨水和泥水会弄脏爱车，至少1天后再洗车。' }, { name: '钓鱼', level: '较适宜', description: '较适合垂钓，但天气稍热，会产生一定影响。' }, { name: '感冒', level: '较易发', description: '空气湿度较大，较易发生感冒，体质较弱的朋友注意防护。' }], alerts: [] },
  exchange: { date: '2026-08-13', rates: [{ code: 'USD', name: '美元', rate: 7.16 }, { code: 'EUR', name: '欧元', rate: 7.85 }, { code: 'JPY', name: '日元', rate: 0.048 }, { code: 'GBP', name: '英镑', rate: 9.21 }, { code: 'HKD', name: '港币', rate: 0.92 }, { code: 'KRW', name: '韩元', rate: 0.0052 }, { code: 'AUD', name: '澳元', rate: 4.75 }, { code: 'CAD', name: '加元', rate: 5.23 }, { code: 'SGD', name: '新加坡元', rate: 5.46 }, { code: 'THB', name: '泰铢', rate: 0.21 }] }
};