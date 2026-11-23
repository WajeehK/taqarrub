/* Taqarrub tq-v1 */
const VER = '1';
const QAPI = 'https://api.quran.com/api/v4';
const AAPI = 'https://api.aladhan.com/v1';
const LONDON = { lat: 51.5074, lng: -0.1278, label: 'London' };
const TRANSLATION = 20;
const TAFSIR_ID = 169;
const METHODS = [
  [3, 'Muslim World League'],
  [15, 'Moonsighting Committee'],
  [12, 'UOIF (France)'],
  [13, 'Diyanet (Turkey)'],
  [2, 'ISNA'],
  [4, 'Umm al-Qura, Makkah'],
  [5, 'Egyptian Authority'],
  [1, 'University of Karachi'],
  [8, 'Gulf Region']
];
const PRAY_MAIN = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAY_HOME = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const DAILY_KEYS = [
  '2:152','2:186','2:201','2:286','3:31','3:139','3:159','13:28','14:7','16:18',
  '17:23','17:80','21:87','25:74','39:53','40:60','49:10','49:13','51:56','65:3',
  '94:5','94:6','2:255','20:114','7:23','18:10','55:13','67:2','103:2','1:6'
];
const JUZ_START = [
  [1,1],[2,142],[2,253],[3,93],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,46],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('tq_' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem('tq_' + k, JSON.stringify(v)); } catch {} }
};
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function strip(s) {
  return String(s ?? '')
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
function pad(n) { return String(n).padStart(2, '0'); }
function dateKey(d) { return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`; }
function nextDateKey(k) {
  const [d, m, y] = k.split('-').map(Number);
  const dt = new Date(y, m - 1, d); dt.setDate(dt.getDate() + 1);
  return dateKey(dt);
}
function fmtT(hhmm) {
  const m = String(hhmm || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return hhmm || '—';
  let h = +m[1]; const min = m[2], ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${min} ${ap}`;
}
function atDate(day, hhmm) {
  const m = String(hhmm || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate(), +m[1], +m[2], 0, 0);
  return d;
}
function fmtCd(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}
async function getJSON(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error('Could not load');
  return r.json();
}

const ICO = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6L21 9.3l-4.5 4.2L17.6 21 12 17.8 6.4 21l1.1-7.5L3 9.3l6.4-.7z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3V4z"/><path d="M5 4a3 3 0 00-3 3v13a3 3 0 013-3h14"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5L10 10l-.5 4.5 4.5-.5z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/></svg>'
};

const state = {
  loc: null,
  times: null,
  timesErr: null,
  qibla: null,
  heading: null,
  chapters: null,
  duas: null,
  names: null,
  recitations: null,
  verseCache: {},
  playing: null,
  wbwKey: null,
  route: { name: 'home' }
};

function applyTheme() {
  const t = store.get('theme', 'system');
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = $('#themeColor');
  if (meta) meta.content = dark ? '#0d1210' : '#f4efe6';
}

function parseRoute() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!p.length || p[0] === 'home') return { name: 'home' };
  const a = p[0];
  if (a === 'quran' && p[1] === 'juz') return { name: 'juz', n: +p[2] || 1 };
  if (a === 'quran' && p[1]) return { name: 'surah', n: +p[1], v: p[2] ? +p[2] : null };
  if (a === 'quran') return { name: 'quran' };
  if (a === 'prayer' && p[1] === 'qibla') return { name: 'qibla' };
  if (a === 'prayer') return { name: 'prayer' };
  if (a === 'duas') return { name: 'duas', cat: p[1] || 'morning' };
  if (a === 'names') return { name: 'names', n: p[1] ? +p[1] : null };
  if (a === 'bookmarks') return { name: 'bookmarks' };
  if (a === 'settings') return { name: 'settings' };
  if (a === 'more') return { name: 'more' };
  return { name: 'home' };
}
function tabOf(r) {
  if (r.name === 'home') return 'home';
  if (r.name === 'quran' || r.name === 'surah' || r.name === 'juz') return 'quran';
  if (r.name === 'prayer' || r.name === 'qibla') return 'prayer';
  if (r.name === 'duas') return 'duas';
  return 'more';
}
function go(hash) { location.hash = hash.startsWith('#') ? hash : '#/' + hash.replace(/^\/?/, ''); }

async function tryGetLoc() {
  const saved = store.get('loc');
  if (saved && saved.manual) { state.loc = saved; return saved; }
  if (!navigator.geolocation) { state.loc = saved || LONDON; return state.loc; }
  try {
    const pos = await new Promise((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 7000, maximumAge: 15 * 60 * 1000, enableHighAccuracy: false })
    );
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude, label: 'Your location', manual: false };
    store.set('loc', loc);
    state.loc = loc;
    return loc;
  } catch {
    state.loc = saved || LONDON;
    if (!saved) store.set('loc', { ...LONDON, manual: false, fallback: true });
    return state.loc;
  }
}

function todayStart() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

async function loadTimes(force) {
  const loc = state.loc || LONDON;
  const method = store.get('method', 3);
  const school = store.get('school', 0);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/London';
  const today = dateKey(new Date());
  const cacheKey = `${today}|${loc.lat.toFixed(3)}|${loc.lng.toFixed(3)}|${method}|${school}|${tz}`;
  if (!force && state.times && state.times.cacheKey === cacheKey) return state.times;
  const cached = store.get('timesCache');
  if (!force && cached && cached.cacheKey === cacheKey) { state.times = cached; return cached; }
  const url = d => `${AAPI}/timings/${d}?latitude=${loc.lat}&longitude=${loc.lng}&method=${method}&school=${school}&timezonestring=${encodeURIComponent(tz)}`;
  try {
    const [a, b] = await Promise.all([getJSON(url(today)), getJSON(url(nextDateKey(today)))]);
    const pack = { cacheKey, today: a.data, tomorrow: b.data, loc };
    state.times = pack;
    state.timesErr = null;
    store.set('timesCache', pack);
    return pack;
  } catch (e) {
    if (cached) { state.times = cached; return cached; }
    state.timesErr = true;
    throw e;
  }
}

function nextPrayer(pack) {
  if (!pack) return null;
  const now = new Date();
  const day = todayStart();
  for (const name of PRAY_MAIN) {
    const t = atDate(day, pack.today.timings[name]);
    if (t && t > now) return { name, at: t, tomorrow: false };
  }
  const tom = new Date(day); tom.setDate(tom.getDate() + 1);
  const t = atDate(tom, pack.tomorrow.timings.Fajr);
  return { name: 'Fajr', at: t, tomorrow: true };
}

async function chapters() {
  if (state.chapters) return state.chapters;
  const cached = store.get('chapters');
  if (cached && cached.length === 114) { state.chapters = cached; return cached; }
  const d = await getJSON(`${QAPI}/chapters?language=en`);
  state.chapters = d.chapters;
  store.set('chapters', state.chapters);
  return state.chapters;
}
async function recitations() {
  if (state.recitations) return state.recitations;
  const cached = store.get('recitations');
  if (cached && cached.length) { state.recitations = cached; return cached; }
  const d = await getJSON(`${QAPI}/resources/recitations?language=en`);
  state.recitations = d.recitations || [];
  store.set('recitations', state.recitations);
  return state.recitations;
}
async function loadVerses(kind, n) {
  const key = kind + ':' + n;
  if (state.verseCache[key]) return state.verseCache[key];
  const all = [];
  let page = 1, total = 1;
  const path = kind === 'juz' ? `verses/by_juz/${n}` : `verses/by_chapter/${n}`;
  while (page <= total) {
    const url = `${QAPI}/${path}?language=en&words=true&translations=${TRANSLATION}&fields=text_uthmani,verse_key,verse_number,chapter_id&word_fields=text_uthmani,translation,transliteration&per_page=50&page=${page}`;
    const d = await getJSON(url);
    all.push(...(d.verses || []));
    total = d.pagination?.total_pages || 1;
    page++;
  }
  state.verseCache[key] = all;
  return all;
}
async function dailyVerse() {
  const today = dateKey(new Date());
  const cached = store.get('daily_v2');
  if (cached && cached.date === today) return cached;
  const now = new Date();
  const doy = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
  const key = DAILY_KEYS[doy % DAILY_KEYS.length];
  const d = await getJSON(`${QAPI}/verses/by_key/${key}?language=en&translations=${TRANSLATION}&fields=text_uthmani`);
  const v = d.verse;
  const item = { date: today, key, ar: v.text_uthmani, en: strip((v.translations || [])[0]?.text) };
  store.set('daily_v2', item);
  return item;
}
async function loadDuas() {
  if (state.duas) return state.duas;
  state.duas = await getJSON('./data/duas.json');
  return state.duas;
}
async function loadNames() {
  if (state.names) return state.names;
  state.names = await getJSON('./data/names.json');
  return state.names;
}
async function loadQibla() {
  const loc = state.loc || LONDON;
  const d = await getJSON(`${AAPI}/qibla/${loc.lat}/${loc.lng}`);
  state.qibla = d.data.direction;
  return state.qibla;
}

function isBookmarked(key) { return store.get('bookmarks', []).some(b => b.key === key); }
function toggleBookmark(key) {
  let b = store.get('bookmarks', []);
  if (b.some(x => x.key === key)) b = b.filter(x => x.key !== key);
  else b.unshift({ key, ts: Date.now() });
  store.set('bookmarks', b);
}
function setLastRead(chapter, verse, name) {
  store.set('lastRead', { chapter, verse, name, ts: Date.now() });
}

function hijriLine(pack) {
  const h = pack?.today?.date?.hijri;
  if (!h) return '';
  const wd = h.weekday?.en || '';
  return `${wd ? wd + ' · ' : ''}${h.day} ${h.month?.en || ''} ${h.year}`.replace(/^ · /, '');
}

function renderTabs() {
  const tabs = [
    ['home', 'Home', '<svg viewBox="0 0 24 24"><path d="M4 11l8-7 8 7"/><path d="M6 10.5V20h5v-5h2v5h5v-9.5"/></svg>'],
    ['quran', 'Quran', '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3V4z"/><path d="M5 4a3 3 0 00-3 3v13a3 3 0 013-3h3"/></svg>'],
    ['prayer', 'Prayer', '<svg viewBox="0 0 24 24"><path d="M12 3v3M8 6.5c2 3 8 3 8 0"/><path d="M9 21h6M12 9v9"/><path d="M7 13c2.5 1 7.5 1 10 0"/></svg>'],
    ['duas', 'Duas', '<svg viewBox="0 0 24 24"><path d="M8 11c0-3 1.5-6 4-6s4 3 4 6c0 4-4 5-4 8"/><path d="M9 22h6"/><path d="M8 11H6m12 0h-2"/></svg>'],
    ['more', 'More', '<svg viewBox="0 0 24 24"><circle cx="6" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="18" cy="12" r="1.4"/></svg>']
  ];
  const on = tabOf(state.route);
  $('#tabs').innerHTML = '<div class="pill" id="tabPill"></div>' + tabs.map(([id, lab, svg]) =>
    `<button type="button" data-tab="${id}" class="${id === on ? 'on' : ''}" aria-current="${id === on ? 'page' : 'false'}">${svg}<span>${lab}</span></button>`
  ).join('');
  requestAnimationFrame(placePill);
}
function placePill() {
  const pill = $('#tabPill');
  const btn = $('#tabs button.on');
  if (!pill || !btn) return;
  pill.style.left = btn.offsetLeft + 'px';
  pill.style.width = btn.offsetWidth + 'px';
}

function renderTop() {
  const r = state.route;
  const back = (to) => `<button class="icon-btn" data-go="${to}" aria-label="Back">${ICO.back}</button>`;
  let left = '', title = 'Taqarrub', sub = '', right = '';
  if (r.name === 'home') {
    left = `<div class="brand-mark"><img src="./icons/icon-192.png" alt=""></div>`;
    title = 'Taqarrub';
    sub = hijriLine(state.times) || 'تقرب';
  } else if (r.name === 'quran') {
    title = 'Quran';
    sub = 'The Noble Quran';
  } else if (r.name === 'surah') {
    const ch = (state.chapters || []).find(c => c.id === r.n);
    left = back('#/quran');
    title = ch ? ch.name_simple : ('Surah ' + r.n);
    sub = ch ? ch.name_arabic : '';
    right = readerTools();
  } else if (r.name === 'juz') {
    left = back('#/quran');
    title = 'Juz ' + r.n;
    right = readerTools();
  } else if (r.name === 'prayer') {
    title = 'Prayer';
    sub = (state.loc || LONDON).label;
    right = `<button class="icon-btn" data-go="#/prayer/qibla" aria-label="Qibla">${ICO.compass}</button>`;
  } else if (r.name === 'qibla') {
    left = back('#/prayer');
    title = 'Qibla';
    sub = (state.loc || LONDON).label;
  } else if (r.name === 'duas') {
    title = 'Duas & adhkar';
    sub = 'With sources';
  } else if (r.name === 'more') {
    title = 'More';
  } else if (r.name === 'names') {
    left = back('#/more');
    title = '99 Names';
    sub = 'Asma ul Husna';
  } else if (r.name === 'bookmarks') {
    left = back('#/more');
    title = 'Bookmarks';
  } else if (r.name === 'settings') {
    left = back('#/more');
    title = 'Settings';
  }
  const subH = sub ? `<div class="sub ${/[\u0600-\u06FF]/.test(sub) ? 'ar' : ''}">${esc(sub)}</div>` : '';
  $('#top').innerHTML = `<div class="top-in">${left}<div><h1>${esc(title)}</h1>${subH}</div><div class="top-r">${right}</div></div>`;
}
function readerTools() {
  const wbw = store.get('wbw', false);
  return `<button class="icon-btn ${wbw ? 'on' : ''}" data-act="toggle-wbw" aria-pressed="${wbw}" title="Word by word" style="${wbw ? 'color:var(--accent);background:var(--accent-s)' : ''}"><svg viewBox="0 0 24 24"><path d="M4 7h7M4 12h7M4 17h7M15 7h5M15 12h5M15 17h5"/></svg></button>
    <button class="icon-btn" data-act="qsize-down" aria-label="Smaller text">A−</button>
    <button class="icon-btn" data-act="qsize-up" aria-label="Larger text">A+</button>`;
}

function render() {
  state.route = parseRoute();
  if (state.route.name !== 'qibla') stopCompass();
  renderTabs();
  renderTop();
  const r = state.route;
  if (r.name === 'home') viewHome();
  else if (r.name === 'quran') viewQuranIndex();
  else if (r.name === 'surah') viewReader('chapter', r.n, r.v);
  else if (r.name === 'juz') viewReader('juz', r.n);
  else if (r.name === 'prayer') viewPrayer();
  else if (r.name === 'qibla') viewQibla();
  else if (r.name === 'duas') viewDuas();
  else if (r.name === 'more') viewMore();
  else if (r.name === 'names') viewNames();
  else if (r.name === 'bookmarks') viewBookmarks();
  else if (r.name === 'settings') viewSettings();
  else viewHome();
  renderPlayer();
  document.body.classList.toggle('has-player', !!(state.playing && !$('#player').paused));
}

function setView(html) { $('#view').innerHTML = `<div class="view-in">${html}</div>`; }

function viewHome() {
  const pack = state.times;
  const nxt = nextPrayer(pack);
  const nowName = (() => {
    if (!pack || !nxt) return null;
    if (nxt.tomorrow) return 'Isha';
    const i = PRAY_MAIN.indexOf(nxt.name);
    return i <= 0 ? null : PRAY_MAIN[i - 1];
  })();
  const times = pack ? PRAY_HOME.map(n => {
    const on = (nxt && n === nxt.name && !nxt.tomorrow) || n === nowName && n !== 'Sunrise';
    return `<div class="time ${n === nxt?.name && !nxt.tomorrow ? 'on' : ''}"><div class="n">${n}</div><div class="t">${fmtT(pack.today.timings[n])}</div></div>`;
  }).join('') : '<div class="skel" style="height:72px;grid-column:1/-1"></div>';

  const loc = state.loc || LONDON;
  const locNote = loc.fallback ? 'London (location not available)' : loc.label;
  const cd = nxt ? fmtCd(nxt.at - Date.now()) : '—';
  const nxtLab = nxt ? (nxt.tomorrow ? 'Fajr (tomorrow)' : nxt.name) : 'Next prayer';

  const dow = new Date().getDay();
  let banners = '';
  const last = store.get('lastRead');
  if (last) {
    banners += `<a class="banner" data-go="#/quran/${last.chapter}${last.verse ? '/' + last.verse : ''}">Continue last read<span>${esc(last.name || ('Surah ' + last.chapter))}${last.verse ? ' · ayah ' + last.verse : ''}</span></a>`;
  }
  if (dow === 5) {
    banners += `<a class="banner" data-go="#/quran/18">Friday · Surah Al-Kahf<span>A well-known Friday reading</span></a>`;
  }
  if (dow === 1 || dow === 4) {
    banners += `<div class="banner" style="display:block">Sunnah fast today<span>${dow === 1 ? 'Monday' : 'Thursday'} — a fast the Prophet ﷺ often kept. This is a reminder, not a ruling.</span></div>`;
  }

  setView(`
    <div class="card" id="nextCard">
      <div class="kicker">Next prayer</div>
      <div class="next-name" id="nxtName">${esc(nxtLab)}</div>
      <div class="next-count" id="cd">${esc(cd)}</div>
      <div class="next-loc">${esc(locNote)}${pack ? ' · ' + esc(hijriLine(pack)) : ''}</div>
      <div class="times">${times}</div>
    </div>
    <div class="stack" style="margin-top:12px">${banners}</div>
    <div class="card" id="dailyCard" style="margin-top:12px">
      <div class="kicker">Daily verse</div>
      <div id="dailyInner"><div class="skel" style="height:80px;margin-top:10px"></div></div>
    </div>
    <p class="fine">Times are calculated from your location and chosen method, and are not a fatwa.</p>
  `);
  if (state.timesErr && !pack) {
    $('#nextCard').insertAdjacentHTML('beforeend', `<p class="note">Could not load prayer times. <button data-act="retry-times" style="color:var(--accent);font-weight:700">Retry</button></p>`);
  }
  dailyVerse().then(v => {
    const el = $('#dailyInner');
    if (!el) return;
    el.innerHTML = `<p class="verse-ar" lang="ar">${esc(v.ar)}</p><p class="verse-en">${esc(v.en)}</p>
      <a class="verse-ref" data-go="#/quran/${v.key.replace(':', '/')}">${esc(v.key)} · Sahih International</a>`;
  }).catch(() => {
    const el = $('#dailyInner');
    if (el) el.innerHTML = `<p class="note">Could not load today’s verse.</p>`;
  });
}

function viewPrayer() {
  const pack = state.times;
  const nxt = nextPrayer(pack);
  const loc = state.loc || LONDON;
  if (!pack) {
    setView(`<div class="card"><div class="skel" style="height:220px"></div></div>
      ${state.timesErr ? '<p class="note">Could not load times. <button data-act="retry-times" style="color:var(--accent);font-weight:700">Retry</button></p>' : ''}`);
    return;
  }
  const t = pack.today.timings;
  const rows = [
    ['Fajr', t.Fajr],
    ['Sunrise', t.Sunrise],
    ['Dhuhr', t.Dhuhr],
    ['Asr', t.Asr],
    ['Maghrib', t.Maghrib],
    ['Isha', t.Isha]
  ].map(([n, v]) => `<div class="pr ${nxt && n === nxt.name && !nxt.tomorrow ? 'on' : ''}"><b>${n}</b><span class="t">${fmtT(v)}</span></div>`).join('');

  setView(`
    <div class="card">
      <div class="kicker">${esc(loc.label)} · ${esc(hijriLine(pack))}</div>
      <div class="next-name" style="font-size:22px;margin:6px 0 2px">${esc(nxt ? (nxt.tomorrow ? 'Fajr tomorrow' : nxt.name) : '')}</div>
      <div class="next-count" id="cd" style="font-size:32px">${nxt ? fmtCd(nxt.at - Date.now()) : '—'}</div>
      <div class="times-full" style="margin-top:8px">${rows}</div>
    </div>
    <div class="card">
      <div class="kicker">Fasting</div>
      <div class="times-full">
        <div class="pr"><b>Suhur ends (Imsak)</b><span class="t">${fmtT(t.Imsak || t.Fajr)}</span></div>
        <div class="pr"><b>Iftar (Maghrib)</b><span class="t">${fmtT(t.Maghrib)}</span></div>
      </div>
    </div>
    <div class="card">
      <div class="kicker">Tahajjud</div>
      <p>The last third of the night begins at <b>${fmtT(t.Lastthird)}</b> and runs until Fajr (${fmtT(t.Fajr)}). Midnight is ${fmtT(t.Midnight)}.</p>
      <p class="note">Taken from today’s calculated night (Maghrib to Fajr). This is not a fatwa.</p>
    </div>
    <div class="card">
      <div class="kicker">Forbidden times</div>
      <p>Voluntary prayer is commonly avoided in three periods:</p>
      <div class="times-full" style="margin-top:8px">
        <div class="pr"><b>After Fajr until sunrise</b><span class="t">${fmtT(t.Fajr)}–${fmtT(t.Sunrise)}</span></div>
        <div class="pr"><b>When the sun is at its zenith, until Dhuhr</b><span class="t">~${fmtT(t.Dhuhr)}</span></div>
        <div class="pr"><b>After Asr until Maghrib</b><span class="t">${fmtT(t.Asr)}–${fmtT(t.Maghrib)}</span></div>
      </div>
      <p class="note">This is a commonly cited teaching, not a ruling for your situation.</p>
    </div>
    <a class="banner" data-go="#/prayer/qibla" style="margin-top:12px;display:flex">${ICO.compass}<div>Qibla compass<span>Direction of the Kaaba from here</span></div></a>
    <p class="fine">Method: ${esc((METHODS.find(m => m[0] === store.get('method', 3)) || [])[1] || '')}${store.get('school', 0) === 1 ? ' · Hanafi Asr' : ''}. Change this in Settings.</p>
  `);
}

function viewQibla() {
  const deg = state.qibla;
  const heading = state.heading;
  const live = heading != null && deg != null;
  const rot = live ? (deg - heading) : (deg || 0);
  setView(`
    <div class="card">
      <div class="compass-wrap">
        <div class="compass" id="compass">
          <div class="ring"></div>
          <div class="n">N</div>
          <div class="needle" id="needle" style="transform:rotate(${rot}deg)"><i></i></div>
          <div class="kaaba" title="Kaaba"></div>
        </div>
        <div class="deg" id="qDeg">${deg != null ? Math.round(deg) + '°' : '…'} <span>from north</span></div>
        <p class="note" id="qHint" style="text-align:center">${live ? 'Hold your phone flat. The green arrow points to the Qibla.' : 'Hold your phone flat and allow motion sensors for a live compass. Until then, the Qibla is shown as degrees from north.'}</p>
      </div>
    </div>
    <p class="fine">Bearing from the Aladhan Qibla API for ${esc((state.loc || LONDON).label)}.</p>
  `);
  if (deg == null) loadQibla().then(() => { if (state.route.name === 'qibla') viewQibla(); }).catch(() => {
    const h = $('#qHint'); if (h) h.textContent = 'Could not load the Qibla direction.';
  });
  startCompass();
}

function startCompass() {
  stopCompass();
  const onOrient = e => {
    let heading = null;
    if (typeof e.webkitCompassHeading === 'number') heading = e.webkitCompassHeading;
    else if (e.alpha != null) heading = (360 - e.alpha) % 360;
    if (heading == null || Number.isNaN(heading)) return;
    state.heading = heading;
    const needle = $('#needle');
    if (needle && state.qibla != null) needle.style.transform = `rotate(${state.qibla - heading}deg)`;
    const hint = $('#qHint');
    if (hint) hint.textContent = 'Hold your phone flat. The green arrow points to the Qibla.';
  };
  state._onOrient = onOrient;
  const listen = () => {
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  };
  if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    DeviceOrientationEvent.requestPermission().then(s => { if (s === 'granted') listen(); }).catch(() => {});
  } else listen();
}
function stopCompass() {
  if (!state._onOrient) return;
  window.removeEventListener('deviceorientationabsolute', state._onOrient, true);
  window.removeEventListener('deviceorientation', state._onOrient, true);
  state._onOrient = null;
}

function viewQuranIndex() {
  setView(`
    <div class="search">${ICO.search}<input id="qsearch" type="search" placeholder="Search the Quran" enterkeyhint="search"></div>
    <div class="chips">
      <button class="chip on" data-act="qmode" data-mode="surah">Surah</button>
      <button class="chip" data-act="qmode" data-mode="juz">Juz</button>
    </div>
    <div id="qlist"><div class="skel" style="height:48px"></div><div class="skel" style="height:48px;margin-top:8px"></div></div>
  `);
  const input = $('#qsearch');
  let tmr;
  input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => runSearch(input.value.trim()), 280); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(input.value.trim()); });
  chapters().then(chs => {
    if (state.route.name !== 'quran') return;
    state._qmode = 'surah';
    drawChapterList(chs);
  }).catch(() => { const l = $('#qlist'); if (l) l.innerHTML = '<p class="empty">Could not load the surah list. Check your connection.</p>'; });
}
function drawChapterList(chs) {
  const last = store.get('lastRead');
  $('#qlist').innerHTML = `<div class="list">${chs.map(c => {
    const on = last && last.chapter === c.id ? ' style="outline:1.5px solid var(--accent)"' : '';
    return `<a class="row" data-go="#/quran/${c.id}"${on}><div class="no">${c.id}</div><div class="nm"><b>${esc(c.name_simple)}</b><span>${c.revelation_place === 'makkah' ? 'Makki' : 'Madani'} · ${c.verses_count} ayahs</span></div><div class="ar-nm" lang="ar">${esc(c.name_arabic)}</div></a>`;
  }).join('')}</div>`;
}
function drawJuzList() {
  $('#qlist').innerHTML = `<div class="list">${JUZ_START.map((start, i) => {
    const n = i + 1;
    const ch = (state.chapters || []).find(c => c.id === start[0]);
    const nm = ch ? ch.name_simple : ('Surah ' + start[0]);
    return `<a class="row" data-go="#/quran/juz/${n}"><div class="no">${n}</div><div class="nm"><b>Juz ${n}</b><span>Starts ${esc(nm)} ${start[0]}:${start[1]}</span></div></a>`;
  }).join('')}</div>`;
}
async function runSearch(q) {
  if (!q) {
    if (state._qmode === 'juz') drawJuzList();
    else drawChapterList(state.chapters || []);
    return;
  }
  const box = $('#qlist');
  box.innerHTML = '<div class="skel" style="height:80px"></div>';
  try {
    const d = await getJSON(`${QAPI}/search?q=${encodeURIComponent(q)}&size=20&page=1&language=en`);
    const results = d.search?.results || d.results || [];
    if (!results.length) { box.innerHTML = '<p class="empty">No verses found.</p>'; return; }
    box.innerHTML = `<div class="list">${results.map(r => {
      const key = r.verse_key || r.key;
      const [c, v] = String(key).split(':');
      const text = strip(r.text || (r.translations && r.translations[0] && r.translations[0].text) || '');
      return `<a class="row" data-go="#/quran/${c}/${v}"><div class="no">${esc(key)}</div><div class="nm"><b>${esc(text)}</b></div></a>`;
    }).join('')}</div>`;
  } catch {
    box.innerHTML = '<p class="empty">Search failed. Check your connection.</p>';
  }
}

async function viewReader(kind, n, focusVerse) {
  const qsize = store.get('qsize', 28);
  setView(`<div id="reader" style="--qsize:${qsize}px"><div class="skel" style="height:120px;margin-top:8px"></div></div>`);
  try {
    const [verses, recs] = await Promise.all([loadVerses(kind, n), recitations().catch(() => [])]);
    if (kind === 'chapter') {
      const ch = (await chapters()).find(c => c.id === n);
      setLastRead(n, focusVerse || 1, ch ? ch.name_simple : 'Surah ' + n);
      renderTop();
    } else {
      const first = verses[0];
      if (first) setLastRead(first.chapter_id, first.verse_number, 'Juz ' + n);
    }
    const reciter = store.get('reciter', 7);
    const recOpts = (recs || []).map(r =>
      `<option value="${r.id}" ${r.id === reciter ? 'selected' : ''}>${esc(r.reciter_name)}${r.style ? ' · ' + esc(r.style) : ''}</option>`
    ).join('');
    const wbw = store.get('wbw', false);
    const html = `
      <div class="search" style="border-radius:var(--r-sm)">
        <label class="mute" style="font-size:12px;color:var(--mute);flex:none">Reciter</label>
        <select id="reciter" style="flex:1;min-width:0;background:transparent">${recOpts}</select>
        <button type="button" class="icon-btn" data-act="play-chapter" data-kind="${kind}" data-n="${n}" aria-label="Play">${ICO.play}</button>
      </div>
      <div>${verses.map(v => ayahHtml(v, wbw)).join('')}</div>
      <p class="fine">Arabic via Quran.com · translation: Sahih International. Audio from the reciter above. Tafsir: Ibn Kathir (abridged, English).</p>
    `;
    const box = $('#reader');
    if (box) box.innerHTML = html;
    const sel = $('#reciter');
    if (sel) sel.addEventListener('change', () => store.set('reciter', +sel.value));
    if (focusVerse) {
      requestAnimationFrame(() => {
        const el = document.getElementById('a' + focusVerse);
        if (el) el.scrollIntoView({ block: 'center' });
      });
    }
  } catch {
    const box = $('#reader');
    if (box) box.innerHTML = '<p class="empty">Could not load these verses. Check your connection.</p>';
  }
}
function ayahHtml(v, wbw) {
  const key = v.verse_key;
  const vn = v.verse_number;
  const ch = v.chapter_id || +String(key).split(':')[0];
  const words = (v.words || []).filter(w => (w.char_type_name || 'word') !== 'end');
  let ar;
  if (wbw && words.length) {
    ar = words.map((w, i) => {
      const tr = esc(w.translation?.text || '');
      const tl = esc(w.transliteration?.text || '');
      return `<span class="w" data-act="word" data-tr="${tr}" data-tl="${tl}" data-ar="${esc(w.text_uthmani || w.text || '')}">${esc(w.text_uthmani || w.text || '')}</span>`;
    }).join(' ');
  } else {
    ar = esc(v.text_uthmani || words.map(w => w.text_uthmani || w.text).join(' '));
  }
  const en = strip((v.translations || [])[0]?.text || '');
  const starred = isBookmarked(key);
  return `<article class="ayah" id="a${vn}" data-key="${esc(key)}">
    <div class="ayah-top">
      <div class="ayah-no">${vn}</div>
      <div class="actions">
        <button type="button" data-act="bookmark" data-key="${esc(key)}" class="${starred ? 'on' : ''}" aria-label="Bookmark">${ICO.star}</button>
        <button type="button" data-act="tafsir" data-key="${esc(key)}" aria-label="Tafsir">${ICO.book}</button>
        <button type="button" data-act="play-verse" data-key="${esc(key)}" aria-label="Play ayah" hidden></button>
      </div>
    </div>
    <p class="ayah-ar" lang="ar">${ar}</p>
    <div class="word-pop" hidden></div>
    <p class="ayah-en">${esc(en)}</p>
  </article>`;
}

function viewDuas() {
  const cat = state.route.cat || 'morning';
  setView(`<div class="chips" id="duaCats"></div><div id="duaList"><div class="skel" style="height:120px"></div></div>`);
  loadDuas().then(data => {
    if (state.route.name !== 'duas') return;
    const cats = data.categories || [];
    $('#duaCats').innerHTML = cats.map(c =>
      `<button class="chip ${c.id === cat ? 'on' : ''}" data-go="#/duas/${c.id}">${esc(c.name)}</button>`
    ).join('');
    const items = (data.items || []).filter(i => (i.cats || []).includes(cat));
    $('#duaList').innerHTML = items.length ? items.map(i => `
      <div class="card dua">
        <h3>${esc(i.title)}</h3>
        <p class="verse-ar" lang="ar">${esc(i.ar)}</p>
        <p class="verse-en">${esc(i.en)}</p>
        ${i.repeat > 1 ? `<span class="rep">Repeat ${i.repeat}×</span>` : ''}
        <div class="src">${esc(i.source)}${i.verse ? ` · <a data-go="#/quran/${i.verse.replace(':', '/')}" style="color:var(--accent)">Open in Quran</a>` : ''}</div>
      </div>
    `).join('') : '<p class="empty">No duas in this category.</p>';
  }).catch(() => { const l = $('#duaList'); if (l) l.innerHTML = '<p class="empty">Could not load duas.</p>'; });
}

function viewMore() {
  setView(`
    <div class="list">
      <a class="row" data-go="#/names"><div class="no">99</div><div class="nm"><b>99 Names of Allah</b><span>Asma ul Husna</span></div></a>
      <a class="row" data-go="#/bookmarks"><div class="no">★</div><div class="nm"><b>Bookmarks</b><span>Saved verses</span></div></a>
      <a class="row" data-go="#/settings"><div class="no">⚙</div><div class="nm"><b>Settings</b><span>Theme, location, calculation method</span></div></a>
    </div>
    <p class="fine">Taqarrub means drawing nearer. Prayer times from Aladhan, Quran from Quran.com. This is not a fatwa and not financial or legal advice of any kind — it is a worship companion.</p>
  `);
}

function viewNames() {
  setView(`<div id="nameList"><div class="skel" style="height:80px"></div></div>`);
  loadNames().then(data => {
    if (state.route.name !== 'names') return;
    const focus = state.route.n;
    $('#nameList').innerHTML = `<div class="list">${(data.items || []).map(n => `
      <div class="card" id="n${n.n}" style="padding:16px 18px">
        <div class="kicker">${n.n}</div>
        <div class="name-ar" lang="ar">${esc(n.ar)}</div>
        <div class="name-tr">${esc(n.tr)}</div>
        <div class="name-en">${esc(n.en)}</div>
      </div>
    `).join('')}</div>
    <p class="fine">Names and English meanings from the Aladhan Asma al-Husna list, a commonly cited enumeration.</p>`;
    if (focus) requestAnimationFrame(() => document.getElementById('n' + focus)?.scrollIntoView({ block: 'center' }));
  }).catch(() => { const l = $('#nameList'); if (l) l.innerHTML = '<p class="empty">Could not load the names.</p>'; });
}

function viewBookmarks() {
  const b = store.get('bookmarks', []);
  if (!b.length) { setView('<p class="empty">No bookmarked verses yet. Open a surah and tap the star.</p>'); return; }
  setView(`<div class="list">${b.map(x => {
    const [c, v] = String(x.key).split(':');
    return `<a class="row" data-go="#/quran/${c}/${v}"><div class="no">${esc(x.key)}</div><div class="nm"><b>Ayah ${esc(x.key)}</b><span>${x.ts ? new Date(x.ts).toLocaleDateString() : ''}</span></div></a>`;
  }).join('')}</div>`);
}

function viewSettings() {
  const theme = store.get('theme', 'system');
  const method = store.get('method', 3);
  const school = store.get('school', 0);
  const loc = state.loc || LONDON;
  const locLab = loc.fallback ? 'London (fallback)' : loc.label + (loc.manual ? ' (set)' : '');
  setView(`
    <div class="card">
      <div class="setting">
        <label>Theme</label>
        <div class="seg" role="radiogroup">
          <button type="button" data-act="theme" data-v="system" class="${theme === 'system' ? 'on' : ''}">System</button>
          <button type="button" data-act="theme" data-v="light" class="${theme === 'light' ? 'on' : ''}">Light</button>
          <button type="button" data-act="theme" data-v="dark" class="${theme === 'dark' ? 'on' : ''}">Dark</button>
        </div>
      </div>
      <div class="setting">
        <label>Location</label>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:650">${esc(locLab)}</div>
          <button type="button" data-act="use-gps" style="color:var(--accent);font-size:12px;font-weight:700">Use my location</button>
          ·
          <button type="button" data-act="use-london" style="color:var(--accent);font-size:12px;font-weight:700">London</button>
        </div>
      </div>
      <div class="setting">
        <label for="method">Calculation method</label>
        <select id="method">${METHODS.map(([id, n]) => `<option value="${id}" ${id === method ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      </div>
      <div class="setting">
        <label>Asr</label>
        <div class="seg">
          <button type="button" data-act="school" data-v="0" class="${school === 0 ? 'on' : ''}">Standard</button>
          <button type="button" data-act="school" data-v="1" class="${school === 1 ? 'on' : ''}">Hanafi</button>
        </div>
      </div>
    </div>
    <p class="fine">Default method is Muslim World League, which is commonly used in the UK. Prayer notifications and a nearby-mosque map are not in this version.</p>
  `);
  $('#method')?.addEventListener('change', async e => {
    store.set('method', +e.target.value);
    await loadTimes(true);
  });
}

function renderPlayer() {
  let wrap = $('#playerWrap');
  const audio = $('#player');
  const playing = state.playing && audio && !audio.paused;
  if (!state.playing) {
    if (wrap) wrap.remove();
    document.body.classList.remove('has-player');
    return;
  }
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'player';
    wrap.id = 'playerWrap';
    document.body.appendChild(wrap);
  }
  const ch = (state.chapters || []).find(c => c.id === state.playing.chapter);
  const name = state.playing.label || (ch ? ch.name_simple : ('Surah ' + (state.playing.chapter || '')));
  wrap.innerHTML = `<div class="player-in">
    <button type="button" class="pbtn" data-act="toggle-play" aria-label="${playing ? 'Pause' : 'Play'}">${playing ? ICO.pause : ICO.play}</button>
    <div class="grow"><b>${esc(name)}</b><span>${esc(state.playing.reciterName || 'Recitation')}</span></div>
    <button type="button" class="icon-btn" data-act="stop-play" aria-label="Close">${ICO.close}</button>
  </div>`;
  document.body.classList.toggle('has-player', true);
}

async function playChapter(n) {
  const reciter = store.get('reciter', 7);
  const recs = await recitations().catch(() => []);
  const rec = (recs || []).find(r => r.id === reciter);
  const d = await getJSON(`${QAPI}/chapter_recitations/${reciter}/${n}`);
  const url = d.audio_file?.audio_url;
  if (!url) throw new Error('No audio');
  const audio = $('#player');
  audio.src = url;
  state.playing = { chapter: n, reciter, reciterName: rec ? rec.reciter_name : '', label: null };
  const chs = state.chapters || [];
  const ch = chs.find(c => c.id === n);
  state.playing.label = ch ? ch.name_simple : ('Surah ' + n);
  try { await audio.play(); } catch {}
  renderPlayer();
}

function updateCountdown() {
  const el = $('#cd'), nm = $('#nxtName');
  if (!el || !state.times) return;
  const nxt = nextPrayer(state.times);
  if (!nxt) return;
  el.textContent = fmtCd(nxt.at - Date.now());
  if (nm) nm.textContent = nxt.tomorrow ? 'Fajr (tomorrow)' : nxt.name;
}

function openSheet(title, body) {
  const el = $('#sheet');
  el.hidden = false;
  el.innerHTML = `<div class="sheet-in"><div class="grab"></div><h2>${esc(title)}</h2><div>${body}</div></div>`;
}
function closeSheet() { const el = $('#sheet'); el.hidden = true; el.innerHTML = ''; }

async function onAct(act, el) {
  if (act === 'toggle-wbw') {
    store.set('wbw', !store.get('wbw', false));
    render();
  } else if (act === 'qsize-down') {
    store.set('qsize', Math.max(20, store.get('qsize', 28) - 2));
    const r = $('#reader'); if (r) r.style.setProperty('--qsize', store.get('qsize') + 'px');
    else render();
  } else if (act === 'qsize-up') {
    store.set('qsize', Math.min(40, store.get('qsize', 28) + 2));
    const r = $('#reader'); if (r) r.style.setProperty('--qsize', store.get('qsize') + 'px');
    else render();
  } else if (act === 'qmode') {
    state._qmode = el.dataset.mode;
    $$('.chips .chip').forEach(c => c.classList.toggle('on', c === el));
    if (state._qmode === 'juz') drawJuzList();
    else drawChapterList(state.chapters || []);
  } else if (act === 'bookmark') {
    toggleBookmark(el.dataset.key);
    el.classList.toggle('on', isBookmarked(el.dataset.key));
  } else if (act === 'tafsir') {
    const key = el.dataset.key;
    openSheet('Ibn Kathir · ' + key, '<div class="skel" style="height:80px"></div>');
    try {
      const d = await getJSON(`${QAPI}/tafsirs/${TAFSIR_ID}/by_ayah/${key}`);
      const text = strip(d.tafsir?.text || d.tafsir?.text_clean || 'No tafsir is available for this verse.');
      if (!$('#sheet').hidden) openSheet('Ibn Kathir · ' + key, `<div class="tafsir">${esc(text)}</div>`);
    } catch {
      if (!$('#sheet').hidden) openSheet('Ibn Kathir · ' + key, '<p class="note">Could not load tafsir. Check your connection.</p>');
    }
  } else if (act === 'word') {
    const art = el.closest('.ayah');
    const pop = art && art.querySelector('.word-pop');
    if (!pop) return;
    $$('.ayah-ar .w.on').forEach(w => w.classList.remove('on'));
    if (state.wbwKey === el) { pop.hidden = true; state.wbwKey = null; return; }
    el.classList.add('on');
    pop.hidden = false;
    pop.innerHTML = `<div class="wa" lang="ar">${el.dataset.ar || el.textContent}</div><div>${esc(el.dataset.tl || '')}</div><div>${esc(el.dataset.tr || '')}</div>`;
    state.wbwKey = el;
  } else if (act === 'play-chapter') {
    let n = +el.dataset.n;
    if (el.dataset.kind === 'juz') {
      const verses = state.verseCache['juz:' + n] || [];
      n = verses[0]?.chapter_id;
    }
    if (n) playChapter(n).catch(() => openSheet('Audio', '<p class="note">Could not start the recitation.</p>'));
  } else if (act === 'toggle-play') {
    const audio = $('#player');
    if (audio.paused) audio.play(); else audio.pause();
    renderPlayer();
  } else if (act === 'stop-play') {
    const audio = $('#player');
    audio.pause(); audio.removeAttribute('src'); audio.load();
    state.playing = null;
    renderPlayer();
  } else if (act === 'theme') {
    store.set('theme', el.dataset.v);
    applyTheme();
    viewSettings();
  } else if (act === 'school') {
    store.set('school', +el.dataset.v);
    await loadTimes(true);
    viewSettings();
  } else if (act === 'use-london') {
    const loc = { ...LONDON, manual: true };
    store.set('loc', loc); state.loc = loc;
    await loadTimes(true);
    viewSettings();
  } else if (act === 'use-gps') {
    const prev = store.get('loc');
    if (prev) { const p = { ...prev }; delete p.manual; store.set('loc', p); }
    else store.set('loc', null);
    await tryGetLoc();
    await loadTimes(true);
    viewSettings();
  } else if (act === 'retry-times') {
    try { await loadTimes(true); render(); } catch { render(); }
  }
}

function bind() {
  document.addEventListener('click', e => {
    if (e.target === $('#sheet')) { closeSheet(); return; }
    const goEl = e.target.closest('[data-go]');
    if (goEl) { e.preventDefault(); go(goEl.getAttribute('data-go')); return; }
    const tab = e.target.closest('#tabs [data-tab]');
    if (tab) { go('#/' + tab.dataset.tab); return; }
    const act = e.target.closest('[data-act]');
    if (act) onAct(act.dataset.act, act);
  });
  window.addEventListener('hashchange', () => render());
  const audio = $('#player');
  audio.addEventListener('play', renderPlayer);
  audio.addEventListener('pause', renderPlayer);
  audio.addEventListener('ended', () => { state.playing = null; renderPlayer(); });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
  setInterval(updateCountdown, 1000);
}

async function boot() {
  applyTheme();
  if (!location.hash) history.replaceState(null, '', '#/home');
  bind();
  state.loc = store.get('loc') || LONDON;
  renderTabs();
  render();
  tryGetLoc().then(async () => {
    try { await loadTimes(true); } catch {}
    if (['home', 'prayer', 'qibla'].includes(state.route.name)) render();
    else updateCountdown();
  });
  try { await loadTimes(); } catch {}
  if (['home', 'prayer'].includes(parseRoute().name)) render();
  chapters().catch(() => {});
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      location.reload();
    });
  }
}

boot();
