/* Taqarrub tq-v2 */
const VER = '2';
const QAPI = 'https://api.quran.com/api/v4';
const AAPI = 'https://api.aladhan.com/v1';
const AUDIO_BASE = 'https://audio.qurancdn.com/';
const LONDON = { lat: 51.5074, lng: -0.1278, label: 'London' };
const TAFSIRS = [
  [169, 'Ibn Kathir (abridged)'],
  [168, "Ma'arif al-Qur'an"],
  [817, 'Tazkirul Quran']
];
const EN_TRANSLATIONS = [
  [20, 'Sahih International'],
  [19, 'Pickthall'],
  [22, 'Yusuf Ali'],
  [85, 'Abdel Haleem'],
  [84, 'Taqi Usmani'],
  [203, 'Hilali & Khan']
];
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
const ISLAMIC_DAYS = [
  [1,1,'Islamic New Year'],
  [1,10,'Ashura'],
  [3,12,'Mawlid (observed by many)'],
  [7,27,'Isra and Miʿraj (commonly observed)'],
  [8,15,'Mid-Shaʿban'],
  [9,1,'Ramadan begins'],
  [9,27,'Laylat al-Qadr (commonly observed on the 27th)'],
  [10,1,'Eid al-Fitr'],
  [12,9,'Day of Arafah'],
  [12,10,'Eid al-Adha']
];
const HERO_MSG = {
  Tahajjud: 'The last third of the night is quiet, and the door is open.',
  Fajr: 'Begin the day with Fajr, and let the rest follow.',
  Sunrise: 'The sun is up. The time after Fajr until sunrise has now passed.',
  Dhuhr: 'Pause the middle of the day for Dhuhr.',
  Asr: 'Asr is a trust — do not leave it to the edge of Maghrib.',
  Maghrib: 'Maghrib is here. If you are fasting, this is Iftar.',
  Isha: 'Close the day with Isha.'
};
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
  return String(s ?? '').replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
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
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), +m[1], +m[2], 0, 0);
}
function fmtCd(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}
function reduceMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }
async function getJSON(url, opt) {
  const r = await fetch(url, { headers: { Accept: 'application/json' }, ...opt });
  if (!r.ok) throw new Error('Could not load');
  return r.json();
}
function todayStart() { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate()); }
function haversine(a, b, c, d) {
  const R = 6371, to = x => x * Math.PI / 180;
  const dLat = to(c - a), dLon = to(d - b);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(to(a)) * Math.cos(to(c)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
function audioUrl(u) {
  if (!u) return '';
  if (/^https?:/i.test(u)) return u;
  return AUDIO_BASE + String(u).replace(/^\//, '');
}
const ICO = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 3l2.6 5.6L21 9.3l-4.5 4.2L17.6 21 12 17.8 6.4 21l1.1-7.5L3 9.3l6.4-.7z"/></svg>',
  book: '<svg viewBox="0 0 24 24"><path d="M5 4h11a3 3 0 013 3v13H8a3 3 0 00-3 3V4z"/><path d="M5 4a3 3 0 00-3 3v13a3 3 0 013-3h14"/></svg>',
  compass: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5L10 10l-.5 4.5 4.5-.5z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5"/></svg>',
  share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.2"/><circle cx="6" cy="12" r="2.2"/><circle cx="18" cy="19" r="2.2"/><path d="M8 11l8-5M8 13l8 5"/></svg>',
  pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z"/><circle cx="12" cy="10" r="2.2"/></svg>'
};
const state = {
  loc: null, times: null, timesErr: null, qibla: null, heading: null,
  chapters: null, duas: null, names: null, recitations: null,
  verseCache: {}, playing: null, wbwKey: null, route: { name: 'home' }, _trans: false
};
const wordAudio = new Audio();
function translations() { return store.get('translations', [20]); }
function tafsirId() { return store.get('tafsirId', 169); }
function applyTheme() {
  const t = store.get('theme', 'system');
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  const meta = $('#themeColor');
  if (meta) meta.content = dark ? '#0E1311' : '#F3EBDD';
}
function parseRoute() {
  const p = (location.hash || '').replace(/^#\/?/, '').split('/').filter(Boolean);
  if (!p.length || p[0] === 'home') return { name: 'home' };
  const a = p[0];
  if (a === 'quran' && p[1] === 'juz') return { name: 'juz', n: +p[2] || 1 };
  if (a === 'quran' && p[1] === 'hizb') return { name: 'hizb', n: +p[2] || 1 };
  if (a === 'quran' && p[1] === 'page') return { name: 'page', n: +p[2] || 1 };
  if (a === 'quran' && p[1]) return { name: 'surah', n: +p[1], v: p[2] ? +p[2] : null };
  if (a === 'quran') return { name: 'quran' };
  if (a === 'prayer' && p[1] === 'qibla') return { name: 'qibla' };
  if (a === 'prayer') return { name: 'prayer' };
  if (a === 'duas' && p[1] === 'g') return { name: 'duas', group: +p[2] };
  if (a === 'duas') return { name: 'duas', cat: p[1] || '' };
  if (a === 'names') return { name: 'names', n: p[1] ? +p[1] : null };
  if (a === 'bookmarks') return { name: 'bookmarks' };
  if (a === 'settings') return { name: 'settings' };
  if (a === 'mosques') return { name: 'mosques' };
  if (a === 'calendar') return { name: 'calendar' };
  if (a === 'goals') return { name: 'goals' };
  if (a === 'more') return { name: 'more' };
  return { name: 'home' };
}
function tabOf(r) {
  if (!r) return 'home';
  if (r.name === 'home') return 'home';
  if (['quran', 'surah', 'juz', 'hizb', 'page'].includes(r.name)) return 'quran';
  if (r.name === 'prayer' || r.name === 'qibla' || r.name === 'mosques') return 'prayer';
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
    store.set('loc', loc); state.loc = loc; return loc;
  } catch {
    state.loc = saved || { ...LONDON, fallback: true };
    if (!saved) store.set('loc', { ...LONDON, manual: false, fallback: true });
    return state.loc;
  }
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
    state.times = pack; state.timesErr = null; store.set('timesCache', pack);
    scheduleNotifications(pack);
    return pack;
  } catch (e) {
    if (cached) { state.times = cached; return cached; }
    state.timesErr = true; throw e;
  }
}
function prayerMoments(pack, dayOffset = 0) {
  if (!pack) return [];
  const base = todayStart(); base.setDate(base.getDate() + dayOffset);
  const src = dayOffset === 1 ? pack.tomorrow : pack.today;
  if (!src) return [];
  const t = src.timings;
  return [
    { name: 'Fajr', at: atDate(base, t.Fajr) },
    { name: 'Sunrise', at: atDate(base, t.Sunrise) },
    { name: 'Dhuhr', at: atDate(base, t.Dhuhr) },
    { name: 'Asr', at: atDate(base, t.Asr) },
    { name: 'Maghrib', at: atDate(base, t.Maghrib) },
    { name: 'Isha', at: atDate(base, t.Isha) },
    { name: 'Tahajjud', at: atDate(base, t.Lastthird), special: true }
  ].filter(x => x.at);
}
function nextPrayer(pack) {
  if (!pack) return null;
  const now = new Date();
  for (const p of [...prayerMoments(pack, 0), ...prayerMoments(pack, 1)].filter(x => PRAY_MAIN.includes(x.name))) {
    if (p.at > now) return { ...p, tomorrow: p.at.getDate() !== now.getDate() };
  }
  return null;
}
function currentPeriod(pack) {
  if (!pack) return null;
  const now = new Date();
  const t = pack.today.timings;
  const day = todayStart();
  const lastThird = atDate(day, t.Lastthird);
  const fajr = atDate(day, t.Fajr);
  if (lastThird && fajr && now >= lastThird && now < fajr) return { name: 'Tahajjud', at: lastThird, end: fajr };
  const moments = prayerMoments(pack, 0).filter(x => !x.special);
  let cur = null;
  for (const p of moments) if (p.at <= now) cur = p;
  const nxt = nextPrayer(pack);
  if (!cur) {
    const yest = new Date(day.getTime() - 86400000);
    const ishaAt = atDate(yest, t.Isha);
    return { name: 'Isha', at: ishaAt || fajr, end: fajr };
  }
  return { name: cur.name, at: cur.at, end: nxt ? nxt.at : null };
}
function heroTod(name) {
  if (name === 'Fajr') return 'fajr';
  if (name === 'Dhuhr' || name === 'Sunrise') return 'day';
  if (name === 'Asr') return 'asr';
  if (name === 'Maghrib') return 'maghrib';
  return 'night';
}
async function chapters() {
  if (state.chapters) return state.chapters;
  const cached = store.get('chapters');
  if (cached && cached.length === 114) { state.chapters = cached; return cached; }
  const d = await getJSON(`${QAPI}/chapters?language=en`);
  state.chapters = d.chapters; store.set('chapters', state.chapters); return state.chapters;
}
async function recitations() {
  if (state.recitations) return state.recitations;
  const cached = store.get('reciters_v2');
  if (cached && cached.length) { state.recitations = cached; return cached; }
  let list = [];
  try {
    const d = await getJSON(`${QAPI}/resources/chapter_reciters?language=en`);
    list = (d.reciters || []).map(r => ({ id: r.id, reciter_name: r.name || r.translated_name?.name, style: r.style?.name }));
  } catch {}
  if (!list.length) {
    const d = await getJSON(`${QAPI}/resources/recitations?language=en`);
    list = d.recitations || [];
  }
  state.recitations = list; store.set('reciters_v2', list); return list;
}
async function loadVerses(kind, n) {
  const key = kind + ':' + n;
  if (state.verseCache[key]) return state.verseCache[key];
  const all = [];
  let page = 1, total = 1;
  const path = kind === 'juz' ? `verses/by_juz/${n}` : kind === 'hizb' ? `verses/by_hizb/${n}` : kind === 'page' ? `verses/by_page/${n}` : `verses/by_chapter/${n}`;
  const trs = translations().join(',');
  while (page <= total) {
    const url = `${QAPI}/${path}?language=en&words=true&translations=${trs}&fields=text_uthmani,verse_key,verse_number,chapter_id,page_number&word_fields=text_uthmani,translation,transliteration,audio_url,page_number,line_number&per_page=50&page=${page}`;
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
  const d = await getJSON(`${QAPI}/verses/by_key/${key}?language=en&translations=${translations()[0] || 20}&fields=text_uthmani`);
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
function bookmarks() { return store.get('bookmarks', []); }
function isBookmarked(key) { return bookmarks().some(b => b.key === key); }
function toggleBookmark(key) {
  let b = bookmarks();
  if (b.some(x => x.key === key)) b = b.filter(x => x.key !== key);
  else b.unshift({ key, ts: Date.now(), note: '' });
  store.set('bookmarks', b);
}
function setBookmarkNote(key, note) {
  store.set('bookmarks', bookmarks().map(x => x.key === key ? { ...x, note } : x));
}
function setLastRead(chapter, verse, name) {
  store.set('lastRead', { chapter, verse, name, ts: Date.now() });
}
function hijriLine(pack) {
  const h = pack?.today?.date?.hijri;
  if (!h) return '';
  return `${h.day} ${h.month?.en || ''} ${h.year}`.trim();
}
function hijriParts(pack) {
  const h = pack?.today?.date?.hijri;
  if (!h) return null;
  return { day: +h.day, month: +(h.month?.number || 0), year: +h.year, monthName: h.month?.en, weekday: h.weekday?.en };
}
function notifEnabled() { return store.get('notifsOn', false); }
function reminderFlags() {
  return store.get('reminders', { morning: true, evening: true, kahf: true, mulk: true, beed: true, prayers: { Fajr: true, Dhuhr: true, Asr: true, Maghrib: true, Isha: true } });
}
async function requestNotifs() {
  if (!('Notification' in window)) return 'unsupported';
  const p = await Notification.requestPermission();
  store.set('notifsOn', p === 'granted');
  return p;
}
function fireNotice(tag, title, body, url) {
  const day = dateKey(new Date());
  const fired = store.get('firedNotifs', {});
  const id = day + ':' + tag;
  if (fired[id]) return;
  fired[id] = Date.now();
  store.set('firedNotifs', fired);
  const opts = { body, tag, icon: './icons/icon-192.png', data: { url: url || './#/home' } };
  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(reg => reg.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch {} });
  } else { try { new Notification(title, opts); } catch {} }
  if (store.get('chime', true) && !document.hidden) playChime();
}
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = 528; g.gain.value = 0.04; o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.35);
  } catch {}
}
function checkDueNotifs() {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !notifEnabled() || !state.times) return;
  const flags = reminderFlags();
  const now = new Date();
  const pack = state.times;
  for (const p of prayerMoments(pack, 0).filter(x => PRAY_MAIN.includes(x.name))) {
    if (!flags.prayers?.[p.name]) continue;
    const dt = now - p.at;
    if (dt >= 0 && dt < 90 * 1000) fireNotice('prayer-' + p.name, 'Time for ' + p.name, `It's ${fmtT(pack.today.timings[p.name])}.`, '#/prayer');
  }
  const t = pack.today.timings;
  const day = todayStart();
  if (flags.morning) {
    const fajr = atDate(day, t.Fajr);
    if (fajr && now - fajr >= 2 * 60 * 1000 && now - fajr < 5 * 60 * 1000)
      fireNotice('morning', 'Morning adhkar', 'A quiet moment for the morning remembrances.', '#/duas/g/27');
  }
  if (flags.evening) {
    const asr = atDate(day, t.Asr);
    if (asr && now - asr >= 0 && now - asr < 90 * 1000)
      fireNotice('evening', 'Evening adhkar', 'Time for the evening remembrances.', '#/duas/g/27');
  }
  if (flags.mulk) {
    const isha = atDate(day, t.Isha);
    if (isha && now - isha >= 0 && now - isha < 90 * 1000)
      fireNotice('mulk', 'Surah Al-Mulk', 'A well-known night reading.', '#/quran/67');
  }
  if (flags.kahf && now.getDay() === 5 && now.getHours() === 9 && now.getMinutes() < 2)
    fireNotice('kahf', 'Friday · Surah Al-Kahf', 'A well-known Friday reading.', '#/quran/18');
  const h = hijriParts(pack);
  if (flags.beed && h && [13, 14, 15].includes(h.day) && now.getHours() === 6 && now.getMinutes() < 2)
    fireNotice('beed', 'Ayyam al-Beed', 'The 13th-15th of the lunar month — a well-known sunnah fast.', '#/home');
}
async function scheduleNotifications(pack) {
  checkDueNotifs();
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted' || !notifEnabled() || !pack) return;
  if (typeof TimestampTrigger === 'undefined' || !navigator.serviceWorker) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const flags = reminderFlags();
    const existing = await reg.getNotifications({ includeTriggered: true }).catch(() => []);
    for (const n of existing) if (String(n.tag || '').startsWith('sched-')) n.close();
    for (const p of prayerMoments(pack, 0).concat(prayerMoments(pack, 1)).filter(x => PRAY_MAIN.includes(x.name))) {
      if (!flags.prayers?.[p.name] || p.at <= new Date()) continue;
      await reg.showNotification('Time for ' + p.name, {
        tag: 'sched-' + p.name + '-' + p.at.getTime(),
        body: `It's ${fmtT(pad(p.at.getHours()) + ':' + pad(p.at.getMinutes()))}.`,
        icon: './icons/icon-192.png',
        showTrigger: new TimestampTrigger(p.at.getTime()),
        data: { url: './#/prayer' }
      });
    }
  } catch {}
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
  const nav = $('#tabs');
  if (!nav.dataset.bound) bindTabBar(nav);
  nav.innerHTML = '<div class="pill" id="tabPill"></div>' + tabs.map(([id, lab, svg]) =>
    `<button type="button" data-tab="${id}" class="${id === on ? 'on' : ''}" aria-current="${id === on ? 'page' : 'false'}">${svg}<span>${lab}</span></button>`
  ).join('');
  requestAnimationFrame(() => placePill(false));
  requestAnimationFrame(() => placePill(true));
}
function placePill(animate) {
  const pill = $('#tabPill'), btn = $('#tabs button.on');
  if (!pill || !btn) return;
  pill.style.transition = (!animate || reduceMotion()) ? 'none' : '';
  pill.style.left = btn.offsetLeft + 'px';
  pill.style.width = btn.offsetWidth + 'px';
}
function bindTabBar(nav) {
  nav.dataset.bound = '1';
  let sx = null, dragging = false;
  nav.addEventListener('pointerdown', e => {
    if (reduceMotion() || !e.target.closest('button')) return;
    sx = e.clientX; dragging = false;
    try { nav.setPointerCapture(e.pointerId); } catch {}
  });
  nav.addEventListener('pointermove', e => {
    if (sx == null) return;
    if (Math.abs(e.clientX - sx) > 10) {
      dragging = true; nav.classList.add('drag');
      const btns = $$('#tabs button'); if (!btns.length) return;
      const w = btns[0].offsetWidth, rect = nav.getBoundingClientRect();
      const left = Math.max(6, Math.min(e.clientX - rect.left - w / 2, rect.width - w - 6));
      const pill = $('#tabPill');
      if (pill) { pill.style.transition = 'none'; pill.style.left = left + 'px'; pill.style.width = w + 'px'; }
    }
  });
  const end = e => {
    if (sx == null) return;
    const was = dragging; sx = null; dragging = false; nav.classList.remove('drag');
    if (!was) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const btn = el && el.closest && el.closest('#tabs button');
    const btns = $$('#tabs button');
    let pick = btn;
    if (!pick && btns.length) {
      const x = e.clientX;
      pick = btns.reduce((a, b) => Math.abs(b.getBoundingClientRect().left + b.offsetWidth / 2 - x) < Math.abs(a.getBoundingClientRect().left + a.offsetWidth / 2 - x) ? b : a);
    }
    if (pick) go('#/' + pick.dataset.tab);
    else placePill(true);
  };
  nav.addEventListener('pointerup', end);
  nav.addEventListener('pointercancel', end);
}
function renderTop() {
  const r = state.route;
  const back = to => `<button class="icon-btn" data-go="${to}" aria-label="Back">${ICO.back}</button>`;
  const loc = state.loc || LONDON;
  const locLab = loc.fallback ? 'London' : loc.label;
  const locBtn = `<button class="loc-chip" data-go="#/settings" type="button">${ICO.pin}<span>${esc(locLab)}</span></button>`;
  let left = '', title = 'Home', sub = '', right = locBtn;
  if (r.name === 'home') title = 'Home';
  else if (r.name === 'quran') { title = 'Quran'; sub = 'Read, listen, search'; right = ''; }
  else if (r.name === 'surah') {
    const ch = (state.chapters || []).find(c => c.id === r.n);
    left = back('#/quran'); title = ch ? ch.name_simple : ('Surah ' + r.n); sub = ch ? ch.name_arabic : ''; right = readerTools();
  } else if (r.name === 'juz') { left = back('#/quran'); title = 'Juz ' + r.n; right = readerTools(); }
  else if (r.name === 'hizb') { left = back('#/quran'); title = 'Hizb ' + r.n; right = readerTools(); }
  else if (r.name === 'page') { left = back('#/quran'); title = 'Page ' + r.n; right = readerTools(true); }
  else if (r.name === 'prayer') { title = 'Prayer'; right = `<button class="icon-btn" data-go="#/prayer/qibla" aria-label="Qibla">${ICO.compass}</button>`; }
  else if (r.name === 'qibla') { left = back('#/prayer'); title = 'Qibla'; sub = locLab; right = ''; }
  else if (r.name === 'duas') { title = 'Duas & adhkar'; sub = 'Hisnul Muslim'; right = ''; }
  else if (r.name === 'more') { title = 'More'; right = ''; }
  else if (r.name === 'names') { left = back('#/more'); title = '99 Names'; sub = 'Asma ul Husna'; right = ''; }
  else if (r.name === 'bookmarks') { left = back('#/more'); title = 'Bookmarks'; right = ''; }
  else if (r.name === 'settings') { left = back('#/more'); title = 'Settings'; right = ''; }
  else if (r.name === 'mosques') { left = back('#/prayer'); title = 'Nearby mosques'; right = ''; }
  else if (r.name === 'calendar') { left = back('#/more'); title = 'Calendar'; right = ''; }
  else if (r.name === 'goals') { left = back('#/more'); title = 'Mission & goals'; right = ''; }
  const subH = sub ? `<div class="sub ${/[\u0600-\u06FF]/.test(sub) ? 'ar' : ''}">${esc(sub)}</div>` : '';
  $('#top').innerHTML = `<div class="top-in">${left}<div><h1>${esc(title)}</h1>${subH}</div><div class="top-r">${right}</div></div>`;
}
function readerTools(mushafPage) {
  const wbw = store.get('wbw', false);
  const mushaf = store.get('mushaf', false) || mushafPage;
  return `<button class="icon-btn" data-act="toggle-mushaf" title="Mushaf" aria-pressed="${mushaf}" style="${mushaf ? 'color:var(--accent);background:var(--accent-s)' : ''}"><svg viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg></button>
    <button class="icon-btn" data-act="toggle-wbw" title="Word by word" aria-pressed="${wbw}" style="${wbw ? 'color:var(--accent);background:var(--accent-s)' : ''}"><svg viewBox="0 0 24 24"><path d="M4 7h7M4 12h7M4 17h7M15 7h5M15 12h5M15 17h5"/></svg></button>
    <button class="icon-btn" data-act="qsize-down" aria-label="Smaller text">A-</button>
    <button class="icon-btn" data-act="qsize-up" aria-label="Larger text">A+</button>`;
}
function render(immediate) {
  const next = parseRoute();
  const prev = state.route;
  if (!immediate && !reduceMotion() && prev && tabOf(prev) !== tabOf(next) && !state._trans) {
    state._trans = true;
    $('#view').classList.add('leave');
    setTimeout(() => { state._trans = false; $('#view').classList.remove('leave'); paint(next); }, 180);
    state.route = next;
    return;
  }
  paint(next);
}
function paint(r) {
  state._trans = false;
  const view = document.getElementById('view');
  if (view) view.classList.remove('leave');
  state.route = r || parseRoute();
  if (state.route.name !== 'qibla') stopCompass();
  renderTabs();
  renderTop();
  const n = state.route.name;
  const map = {
    home: viewHome, quran: viewQuranIndex, prayer: viewPrayer, qibla: viewQibla,
    duas: viewDuas, more: viewMore, names: viewNames, bookmarks: viewBookmarks,
    settings: viewSettings, mosques: viewMosques, calendar: viewCalendar, goals: viewGoals
  };
  if (n === 'surah') viewReader('chapter', state.route.n, state.route.v);
  else if (n === 'juz') viewReader('juz', state.route.n);
  else if (n === 'hizb') viewReader('hizb', state.route.n);
  else if (n === 'page') viewReader('page', state.route.n);
  else (map[n] || viewHome)();
  renderPlayer();
}
function setView(html) { $('#view').innerHTML = `<div class="view-in">${html}</div>`; }
function skySvg() {
  return `<svg class="hero-sky" viewBox="0 0 360 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <circle cx="300" cy="36" r="18" fill="rgba(255,255,230,.2)"/>
    <circle cx="312" cy="32" r="14" fill="rgba(20,28,25,.55)"/>
    <circle cx="40" cy="24" r="1.2" fill="#fff"/><circle cx="80" cy="40" r="1" fill="#fff"/>
    <circle cx="140" cy="18" r="1.1" fill="#fff"/><circle cx="220" cy="28" r="0.9" fill="#fff"/>
    <path d="M0 140 C60 110, 110 150, 180 120 C250 92, 300 140, 360 118 L360 180 L0 180 Z" fill="rgba(0,0,0,.25)"/>
  </svg>`;
}
function reminderCards(pack) {
  const cards = [];
  const dow = new Date().getDay();
  const now = new Date();
  const h = hijriParts(pack);
  const last = store.get('lastRead');
  if (last) cards.push(`<a class="banner" data-go="#/quran/${last.chapter}${last.verse ? '/' + last.verse : ''}">Continue last read<span>${esc(last.name || ('Surah ' + last.chapter))}${last.verse ? ' · ayah ' + last.verse : ''}</span></a>`);
  if (dow === 5) cards.push(`<a class="banner" data-go="#/quran/18">Friday · Surah Al-Kahf<span>A well-known Friday reading</span></a>`);
  const t = pack?.today?.timings;
  if (t) {
    const day = todayStart();
    const fajr = atDate(day, t.Fajr), sunrise = atDate(day, t.Sunrise), asr = atDate(day, t.Asr), isha = atDate(day, t.Isha);
    if (fajr && sunrise && now >= fajr && now < sunrise) cards.push(`<a class="banner" data-go="#/duas/g/27">Morning adhkar<span>The remembrances of the morning</span></a>`);
    if (asr && now >= asr && (!isha || now < isha)) cards.push(`<a class="banner" data-go="#/duas/g/27">Evening adhkar<span>The remembrances of the evening</span></a>`);
    if (isha && now >= isha) cards.push(`<a class="banner" data-go="#/quran/67">Surah Al-Mulk<span>A well-known night reading</span></a>`);
  }
  if (h && [13, 14, 15].includes(h.day)) cards.push(`<div class="banner" style="display:block">Ayyam al-Beed<span>The 13th-15th of the lunar month — a well-known sunnah fast. This is a reminder, not a ruling.</span></div>`);
  if (dow === 1 || dow === 4) cards.push(`<div class="banner" style="display:block">Sunnah fast today<span>${dow === 1 ? 'Monday' : 'Thursday'} — a fast the Prophet often kept. This is a reminder, not a ruling.</span></div>`);
  return cards.join('');
}
function icoQuran(){return `<svg viewBox="0 0 32 32" fill="none" stroke="#1E6B54" stroke-width="1.7"><path d="M6 7h16a3 3 0 013 3v15H10a4 4 0 00-4 4V7z"/><path d="M6 7a3 3 0 00-3 3v16a3 3 0 013-3h4"/><path d="M12 12h10M12 16h8"/></svg>`}
function icoDua(){return `<svg viewBox="0 0 32 32" fill="none" stroke="#8A6A2A" stroke-width="1.7"><rect x="7" y="5" width="18" height="22" rx="3"/><path d="M11 11h10M11 16h10M11 21h6"/></svg>`}
function icoKaaba(){return `<svg viewBox="0 0 32 32" fill="#1B1914" stroke="#C49A3C" stroke-width="1.6"><path d="M8 12l8-5 8 5v13H8V12z"/><path d="M8 16h16" stroke="#C49A3C"/></svg>`}
function icoMosque(){return `<svg viewBox="0 0 32 32" fill="none" stroke="#4B3C7A" stroke-width="1.7"><path d="M6 26V16l5-4 5 4 5-4 5 4v10H6z"/><path d="M16 6v4"/><circle cx="16" cy="5" r="1.4" fill="#4B3C7A"/></svg>`}
function icoCal(){return `<svg viewBox="0 0 32 32" fill="none" stroke="#2A5A6A" stroke-width="1.7"><rect x="6" y="8" width="20" height="18" rx="3"/><path d="M6 13h20M11 6v4M21 6v4"/></svg>`}
function icoNames(){return `<svg viewBox="0 0 32 32" fill="none" stroke="#7A4A28" stroke-width="1.7"><circle cx="16" cy="16" r="10"/><path d="M11 17c1.2-3 9-3 10 2" stroke-linecap="round"/><path d="M16 10v5" stroke-linecap="round"/></svg>`}
function viewHome() {
  const pack = state.times;
  const nxt = nextPrayer(pack);
  const cur = currentPeriod(pack);
  const progress = (cur && cur.end && cur.at) ? Math.min(100, Math.max(0, (Date.now() - cur.at) / (cur.end - cur.at) * 100)) : 0;
  const tod = heroTod(cur?.name || nxt?.name || 'Isha');
  const cd = nxt ? fmtCd(nxt.at - Date.now()) : '—';
  const leftName = cur?.name || 'Now';
  const leftTime = cur?.at ? fmtT(pad(cur.at.getHours()) + ':' + pad(cur.at.getMinutes())) : '';
  const rightName = nxt ? nxt.name : '';
  const rightTime = nxt ? fmtT(pad(nxt.at.getHours()) + ':' + pad(nxt.at.getMinutes())) : '';
  const strip = pack ? PRAY_MAIN.map((n, i) => {
    const on = nxt && n === nxt.name && !nxt.tomorrow;
    const done = nxt && PRAY_MAIN.indexOf(nxt.name) > i && !nxt.tomorrow;
    return { n, t: fmtT(pack.today.timings[n]), on, done };
  }) : [];
  setView(`
    <div class="salam"><div class="hi" lang="ar">السلام عليكم</div>
      <div class="date">${pack ? esc(hijriLine(pack)) : '…'}${pack?.today?.date?.hijri?.weekday?.en ? ' · ' + esc(pack.today.date.hijri.weekday.en) : ''}</div></div>
    <div class="hero" id="hero" data-tod="${tod}">
      ${skySvg()}
      <div class="hero-row">
        <div class="hero-side">${esc(leftName)}<b id="heroLeft">${esc(leftTime)}</b></div>
        <div class="hero-side" style="text-align:right">${esc(rightName)}<b id="heroRight">${esc(rightTime)}</b></div>
      </div>
      <div class="hero-bar"><i id="heroBar" style="width:${progress}%"></i></div>
      <div class="hero-cd" id="cd">${esc(cd)}</div>
      <p class="hero-msg">${esc(HERO_MSG[cur?.name] || HERO_MSG[nxt?.name] || '')}</p>
    </div>
    ${pack ? `<div class="card" style="margin-top:12px">
      <div class="pline">${strip.map((p,i)=>`${i?'<s class="'+(p.done||p.on?'on':'')+'"></s>':''}<i class="${p.on?'on':p.done?'done':''}"></i>`).join('')}</div>
      <div class="pstrip">${strip.map(p=>`<div class="pt ${p.on?'on':''}">${p.n}<b>${p.t}</b></div>`).join('')}</div>
      <a data-go="#/prayer" style="display:block;text-align:center;color:var(--accent);font-weight:700;font-size:13px;margin-top:6px">View prayer times</a>
    </div>` : '<div class="card" style="margin-top:12px"><div class="skel" style="height:72px"></div></div>'}
    <div class="section-h"><h2>Explore</h2></div>
    <div class="explore">
      <a class="tile" data-go="#/quran"><div class="ic ic-q">${icoQuran()}</div><span>Quran</span></a>
      <a class="tile" data-go="#/duas"><div class="ic ic-d">${icoDua()}</div><span>Dua &amp; dhikr</span></a>
      <a class="tile" data-go="#/prayer/qibla"><div class="ic ic-b">${icoKaaba()}</div><span>Qibla</span></a>
      <a class="tile" data-go="#/mosques"><div class="ic ic-m">${icoMosque()}</div><span>Mosques</span></a>
      <a class="tile" data-go="#/calendar"><div class="ic ic-c">${icoCal()}</div><span>Calendar</span></a>
      <a class="tile" data-go="#/names"><div class="ic ic-n">${icoNames()}</div><span>Allah's Names</span></a>
    </div>
    <div class="section-h"><h2>Daily refresh</h2><a data-go="#/goals" style="color:var(--accent);font-size:13px;font-weight:700">Goals</a></div>
    <div class="stack" id="reminders">${reminderCards(pack)}</div>
    <div class="card" id="dailyCard" style="margin-top:12px">
      <div class="kicker">Daily verse</div>
      <div id="dailyInner"><div class="skel" style="height:80px;margin-top:10px"></div></div>
    </div>
    <p class="fine">Times are calculated from your location and chosen method, and are not a fatwa.</p>
  `);
  dailyVerse().then(v => {
    const el = $('#dailyInner'); if (!el) return;
    el.innerHTML = `<p class="verse-ar" lang="ar">${esc(v.ar)}</p><p class="verse-en">${esc(v.en)}</p>
      <div class="btn-row">
        <a class="verse-ref" data-go="#/quran/${v.key.replace(':', '/')}">${esc(v.key)}</a>
        <button class="icon-btn" data-act="share-verse" data-ar="${esc(v.ar)}" data-en="${esc(v.en)}" data-ref="${esc(v.key)}" aria-label="Share">${ICO.share}</button>
      </div>`;
  }).catch(() => { const el = $('#dailyInner'); if (el) el.innerHTML = `<p class="note">Could not load today's verse.</p>`; });
}

function viewPrayer() {
  const pack = state.times;
  const nxt = nextPrayer(pack);
  const loc = state.loc || LONDON;
  if (!pack) { setView(`<div class="card"><div class="skel" style="height:220px"></div></div>`); return; }
  const t = pack.today.timings;
  const rows = PRAY_HOME.map(n => `<div class="pr ${nxt && n === nxt.name && !nxt.tomorrow ? 'on' : ''}"><b>${n}</b><span class="t">${fmtT(t[n])}</span></div>`).join('');
  setView(`
    <div class="card">
      <div class="kicker">${esc(loc.fallback ? 'London' : loc.label)} · ${esc(hijriLine(pack))}</div>
      <div class="next-count" id="cd" style="font-size:32px;font-weight:750;letter-spacing:-.04em;color:var(--accent);margin:8px 0 2px">${nxt ? fmtCd(nxt.at - Date.now()) : '—'}</div>
      <div style="font-size:14px;color:var(--mute);margin-bottom:8px">${nxt ? 'Until ' + (nxt.tomorrow ? 'Fajr tomorrow' : nxt.name) : ''}</div>
      <div class="times-full">${rows}</div>
    </div>
    <div class="section-h"><h2>Fasting</h2></div>
    <div class="fast3">
      <div class="f"><div class="n">Suhur ends</div><div class="t">${fmtT(t.Imsak || t.Fajr)}</div></div>
      <div class="f"><div class="n">Iftar</div><div class="t">${fmtT(t.Maghrib)}</div></div>
      <div class="f"><div class="n">Tahajjud</div><div class="t">${fmtT(t.Lastthird)}</div></div>
    </div>
    <div class="card" style="margin-top:12px">
      <div class="kicker">Tahajjud</div>
      <p>The last third of the night begins at <b>${fmtT(t.Lastthird)}</b> and runs until Fajr (${fmtT(t.Fajr)}). Midnight is ${fmtT(t.Midnight)}.</p>
      <p class="note">Taken from today's calculated night (Maghrib to Fajr). This is not a fatwa.</p>
    </div>
    <div class="section-h"><h2>Forbidden times</h2></div>
    <div class="ftimes">
      <div class="ftime"><div class="art" style="background:linear-gradient(180deg,#F6C98A,#F3EBDD)"></div><div><b>After Fajr until sunrise</b><span>${fmtT(t.Fajr)} – ${fmtT(t.Sunrise)}</span></div></div>
      <div class="ftime"><div class="art" style="background:linear-gradient(180deg,#F3E27A,#E9F0F4)"></div><div><b>When the sun is at its zenith, until Dhuhr</b><span>around ${fmtT(t.Dhuhr)}</span></div></div>
      <div class="ftime"><div class="art" style="background:linear-gradient(180deg,#E89B74,#3A2A44)"></div><div><b>After Asr until Maghrib</b><span>${fmtT(t.Asr)} – ${fmtT(t.Maghrib)}</span></div></div>
    </div>
    <p class="note">Voluntary prayer is commonly avoided in these periods. This is a commonly cited teaching, not a ruling for your situation.</p>
    <a class="banner" data-go="#/prayer/qibla" style="margin-top:14px;display:flex">${ICO.compass}<div>Qibla compass<span>Direction of the Kaaba from here</span></div></a>
    <a class="banner" data-go="#/mosques" style="margin-top:8px;display:flex">${icoMosque()}<div>Nearby mosques<span>From OpenStreetMap, around your location</span></div></a>
    <p class="fine">Method: ${esc((METHODS.find(m => m[0] === store.get('method', 3)) || [])[1] || '')}${store.get('school', 0) === 1 ? ' · Hanafi Asr' : ''}. Change this in Settings.</p>
  `);
}
function viewQibla() {
  const deg = state.qibla;
  const heading = state.heading;
  const live = heading != null && deg != null;
  const rot = live ? (deg - heading) : (deg || 0);
  let hint = 'Hold your phone flat and allow motion sensors for a live compass.';
  if (live) {
    let turn = ((deg - heading + 540) % 360) - 180;
    const abs = Math.abs(turn);
    hint = abs < 8 ? 'You are facing the Qibla.' : `Turn ${Math.round(abs)}° ${turn > 0 ? 'right' : 'left'}`;
  }
  setView(`<div class="card"><div class="compass-wrap">
    <div class="compass" id="compass"><div class="ring"></div><div class="n">N</div>
      <div class="needle" id="needle" style="transform:rotate(${rot}deg)"><i></i></div>
      <div class="kaaba" title="Kaaba"></div></div>
    <div class="deg" id="qDeg">${deg != null ? Math.round(deg) + '°' : '…'} <span>${esc(hint)}</span></div>
  </div></div>
  <p class="fine">Bearing from the Aladhan Qibla API for ${esc((state.loc || LONDON).label)}.</p>`);
  if (deg == null) loadQibla().then(() => { if (state.route.name === 'qibla') viewQibla(); }).catch(() => {});
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
    if ($('#needle') && state.qibla != null) $('#needle').style.transform = `rotate(${state.qibla - heading}deg)`;
    const degEl = $('#qDeg span');
    if (degEl && state.qibla != null) {
      let turn = ((state.qibla - heading + 540) % 360) - 180;
      const abs = Math.abs(turn);
      degEl.textContent = abs < 8 ? 'You are facing the Qibla.' : `Turn ${Math.round(abs)}° ${turn > 0 ? 'right' : 'left'}`;
    }
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
async function viewMosques() {
  const loc = state.loc || LONDON;
  setView(`<p class="note">Mosques within about 6 km, from OpenStreetMap. Distances are approximate.</p><div id="mlist"><div class="skel" style="height:80px;margin-top:10px"></div></div>`);
  try {
    if (loc.fallback && !loc.manual) await tryGetLoc();
    const L = state.loc || loc;
    const q = `[out:json][timeout:20];(node["amenity"="place_of_worship"]["religion"="muslim"](around:6000,${L.lat},${L.lng});way["amenity"="place_of_worship"]["religion"="muslim"](around:6000,${L.lat},${L.lng});relation["amenity"="place_of_worship"]["religion"="muslim"](around:6000,${L.lat},${L.lng}););out center;`;
    let data;
    try {
      data = await getJSON('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    } catch {
      data = await getJSON('https://overpass.kumi.systems/api/interpreter', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(q) });
    }
    const rows = (data.elements || []).map(el => {
      const lat = el.lat || el.center?.lat, lng = el.lon || el.center?.lon;
      const name = el.tags?.name || el.tags?.['name:en'] || 'Mosque';
      if (lat == null) return null;
      return { name, lat, lng, km: haversine(L.lat, L.lng, lat, lng) };
    }).filter(Boolean).sort((a, b) => a.km - b.km).slice(0, 30);
    const box = $('#mlist'); if (!box) return;
    if (!rows.length) { box.innerHTML = '<p class="empty">No mosques found nearby. Try enabling location in Settings.</p>'; return; }
    box.innerHTML = `<div class="list">${rows.map(m => {
      const maps = `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
      const dist = m.km < 1 ? Math.round(m.km * 1000) + ' m' : m.km.toFixed(1) + ' km';
      return `<a class="row" href="${maps}" target="_blank" rel="noopener"><div class="no">M</div><div class="nm"><b>${esc(m.name)}</b><span>${dist}</span></div><div class="meta">Maps</div></a>`;
    }).join('')}</div><p class="fine">Opens in Google Maps. Data © OpenStreetMap contributors.</p>`;
  } catch {
    const box = $('#mlist'); if (box) box.innerHTML = '<p class="empty">Could not load mosques. Check your connection and try again.</p>';
  }
}
function viewQuranIndex() {
  setView(`
    <div class="search">${ICO.search}<input id="qsearch" type="search" placeholder="Search the Quran" enterkeyhint="search"></div>
    <div class="chips">
      <button class="chip on" data-act="qmode" data-mode="surah">Surah</button>
      <button class="chip" data-act="qmode" data-mode="juz">Juz</button>
      <button class="chip" data-act="qmode" data-mode="hizb">Hizb</button>
      <button class="chip" data-act="qmode" data-mode="page">Page</button>
    </div>
    <div id="qlist"><div class="skel" style="height:48px"></div></div>`);
  const input = $('#qsearch');
  let tmr;
  input.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => runSearch(input.value.trim()), 280); });
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(input.value.trim()); });
  chapters().then(chs => {
    if (state.route.name !== 'quran') return;
    state._qmode = 'surah';
    drawChapterList(chs);
  }).catch(() => { const l = $('#qlist'); if (l) l.innerHTML = '<p class="empty">Could not load the surah list.</p>'; });
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
    const n = i + 1; const ch = (state.chapters || []).find(c => c.id === start[0]);
    const nm = ch ? ch.name_simple : ('Surah ' + start[0]);
    return `<a class="row" data-go="#/quran/juz/${n}"><div class="no">${n}</div><div class="nm"><b>Juz ${n}</b><span>Starts ${esc(nm)} ${start[0]}:${start[1]}</span></div></a>`;
  }).join('')}</div>`;
}
function drawHizbList() {
  $('#qlist').innerHTML = `<div class="list">${Array.from({ length: 60 }, (_, i) => {
    const n = i + 1;
    return `<a class="row" data-go="#/quran/hizb/${n}"><div class="no">${n}</div><div class="nm"><b>Hizb ${n}</b><span>One of the 60 hizb of the Quran</span></div></a>`;
  }).join('')}</div>`;
}
function drawPageList() {
  $('#qlist').innerHTML = `<div class="card"><label>Go to Mushaf page (1-604)</label>
    <div class="btn-row"><input id="pageNum" type="number" min="1" max="604" value="1" style="width:80px;background:var(--bg2);border-radius:10px;padding:8px 10px">
    <button class="btn" data-act="go-page">Open</button></div></div>
    <p class="note">Or jump from a surah into Mushaf mode, which follows the 604-page Madinah mushaf.</p>`;
}
async function runSearch(q) {
  if (!q) {
    if (state._qmode === 'juz') drawJuzList();
    else if (state._qmode === 'hizb') drawHizbList();
    else if (state._qmode === 'page') drawPageList();
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
  } catch { box.innerHTML = '<p class="empty">Search failed. Check your connection.</p>'; }
}
async function viewReader(kind, n, focusVerse) {
  const qsize = store.get('qsize', 28);
  const mushaf = store.get('mushaf', false) || kind === 'page';
  setView(`<div id="reader" style="--qsize:${qsize}px"><div class="skel" style="height:120px;margin-top:8px"></div></div>`);
  try {
    const [verses, recs] = await Promise.all([loadVerses(kind, n), recitations().catch(() => [])]);
    if (kind === 'chapter') {
      const ch = (await chapters()).find(c => c.id === n);
      setLastRead(n, focusVerse || 1, ch ? ch.name_simple : 'Surah ' + n);
      renderTop();
    } else if (verses[0]) {
      setLastRead(verses[0].chapter_id, verses[0].verse_number, kind === 'page' ? 'Page ' + n : kind === 'hizb' ? 'Hizb ' + n : 'Juz ' + n);
    }
    const reciter = store.get('reciter', 7);
    const recOpts = (recs || []).map(r =>
      `<option value="${r.id}" ${r.id === reciter ? 'selected' : ''}>${esc(r.reciter_name || r.name || '')}${r.style ? ' · ' + esc(r.style) : ''}</option>`
    ).join('');
    const wbw = store.get('wbw', false);
    const maxV = verses.length ? Math.max(...verses.map(v => v.verse_number)) : 1;
    const minV = verses.length ? Math.min(...verses.map(v => v.verse_number)) : 1;
    const controls = `
      <div class="search" style="border-radius:var(--r-sm)">
        <label style="font-size:12px;color:var(--mute);flex:none">Reciter</label>
        <select id="reciter" style="flex:1;min-width:0;background:transparent">${recOpts}</select>
        <button type="button" class="icon-btn" data-act="play-chapter" data-kind="${kind}" data-n="${n}" aria-label="Play">${ICO.play}</button>
      </div>
      ${kind === 'page' ? pageNav(n) : ''}
      ${kind === 'chapter' ? `<div class="range">
        Play ayahs <input id="rFrom" type="number" min="${minV}" max="${maxV}" value="${focusVerse || minV}">
        to <input id="rTo" type="number" min="${minV}" max="${maxV}" value="${maxV}">
        <select id="rRepeat"><option value="1">Once</option><option value="3">3x</option><option value="0">Loop</option></select>
        <button class="btn" data-act="play-range" data-chapter="${n}" style="padding:6px 12px;font-size:12px">Play range</button>
      </div>` : ''}`;
    let body;
    if (mushaf) {
      body = `<div class="mushaf" lang="ar">${verses.map(v =>
        `<span id="a${v.verse_number}">${esc(v.text_uthmani || '')}<span class="ayah-no">(${v.verse_number})</span></span>`
      ).join(' ')}</div>
      ${kind === 'page' ? pageNav(n) : (verses[0]?.page_number ? `<p class="fine">Mushaf page ${verses[0].page_number}. <a data-go="#/quran/page/${verses[0].page_number}" style="color:var(--accent)">Open this page</a></p>` : '')}`;
    } else body = verses.map(v => ayahHtml(v, wbw)).join('');
    const box = $('#reader');
    if (box) box.innerHTML = controls + body + `<p class="fine">Arabic via Quran.com. Tafsir: ${esc((TAFSIRS.find(t => t[0] === tafsirId()) || TAFSIRS[0])[1])}. Tap a word (with word-by-word on) to hear it.</p>`;
    $('#reciter')?.addEventListener('change', e => store.set('reciter', +e.target.value));
    if (focusVerse) requestAnimationFrame(() => document.getElementById('a' + focusVerse)?.scrollIntoView({ block: 'center' }));
  } catch {
    const box = $('#reader');
    if (box) box.innerHTML = '<p class="empty">Could not load these verses. Check your connection.</p>';
  }
}
function pageNav(n) {
  const prev = n > 1 ? n - 1 : null, next = n < 604 ? n + 1 : null;
  return `<div class="btn-row" style="justify-content:space-between;margin:8px 0 14px">
    ${prev ? `<a class="btn ghost" data-go="#/quran/page/${prev}">Page ${prev}</a>` : '<span></span>'}
    <span style="font-weight:700;color:var(--mute)">${n} / 604</span>
    ${next ? `<a class="btn ghost" data-go="#/quran/page/${next}">Page ${next}</a>` : '<span></span>'}
  </div>`;
}
function ayahHtml(v, wbw) {
  const key = v.verse_key, vn = v.verse_number;
  const words = (v.words || []).filter(w => (w.char_type_name || 'word') !== 'end');
  let ar;
  if (wbw && words.length) {
    ar = words.map(w => {
      const tr = esc(w.translation?.text || '');
      const tl = esc(w.transliteration?.text || '');
      const au = esc(w.audio_url || '');
      return `<span class="w" data-act="word" data-tr="${tr}" data-tl="${tl}" data-au="${au}" data-ar="${esc(w.text_uthmani || w.text || '')}">${esc(w.text_uthmani || w.text || '')}</span>`;
    }).join(' ');
  } else ar = esc(v.text_uthmani || words.map(w => w.text_uthmani || w.text).join(' '));
  const ens = (v.translations || []).map(t => `<p class="ayah-en">${esc(strip(t.text || ''))}</p>`).join('');
  const starred = isBookmarked(key);
  return `<article class="ayah" id="a${vn}" data-key="${esc(key)}">
    <div class="ayah-top"><div class="ayah-no">${vn}</div>
      <div class="actions">
        <button type="button" data-act="play-from" data-key="${esc(key)}" aria-label="Play from here">${ICO.play}</button>
        <button type="button" data-act="share-ayah" data-key="${esc(key)}" aria-label="Share">${ICO.share}</button>
        <button type="button" data-act="bookmark" data-key="${esc(key)}" class="${starred ? 'on' : ''}" aria-label="Bookmark">${ICO.star}</button>
        <button type="button" data-act="tafsir" data-key="${esc(key)}" aria-label="Tafsir">${ICO.book}</button>
      </div></div>
    <p class="ayah-ar" lang="ar">${ar}</p>
    <div class="word-pop" hidden></div>
    ${ens}
  </article>`;
}

function viewDuas() {
  const r = state.route;
  setView(`<div class="search">${ICO.search}<input id="dsearch" type="search" placeholder="Search duas"></div>
    <div class="chips" id="duaCats"></div>
    <div id="duaList"><div class="skel" style="height:120px"></div></div>`);
  loadDuas().then(data => {
    if (state.route.name !== 'duas') return;
    const cats = data.categories || [];
    const activeCat = r.cat || '';
    const activeGroup = r.group;
    $('#duaCats').innerHTML = `<button class="chip ${!activeCat && !activeGroup ? 'on' : ''}" data-go="#/duas">Chapters</button>` +
      cats.map(c => `<button class="chip ${c.id === activeCat ? 'on' : ''}" data-go="#/duas/${c.id}">${esc(c.name)}</button>`).join('');
    const qbox = $('#dsearch');
    const renderList = (filter) => {
      const f = (filter || '').toLowerCase();
      if (activeGroup) {
        const g = (data.groups || []).find(x => x.id === activeGroup);
        const items = (data.items || []).filter(i => i.gid === activeGroup && (!f || (i.ar + i.en + i.title + i.source).toLowerCase().includes(f)));
        $('#duaList').innerHTML = `<h2 style="font-size:18px;margin:4px 0 12px">${esc(g ? g.name : 'Chapter')}</h2>` + (items.map(duaCard).join('') || '<p class="empty">No duas in this chapter.</p>');
        return;
      }
      if (activeCat) {
        const items = (data.items || []).filter(i => (i.cats || []).includes(activeCat) && (!f || (i.ar + i.en + i.title).toLowerCase().includes(f)));
        $('#duaList').innerHTML = items.map(duaCard).join('') || '<p class="empty">No duas in this category.</p>';
        return;
      }
      const groups = (data.groups || []).filter(g => !f || g.name.toLowerCase().includes(f));
      $('#duaList').innerHTML = `<div class="list">${groups.map(g =>
        `<a class="row" data-go="#/duas/g/${g.id}"><div class="no">${g.id}</div><div class="nm"><b>${esc(g.name)}</b><span>${g.count} dua${g.count===1?'':'s'}</span></div></a>`
      ).join('')}</div><p class="fine">${esc(data.source || 'Hisnul Muslim')}</p>`;
    };
    renderList('');
    let tmr;
    qbox.addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(() => renderList(qbox.value), 200); });
  }).catch(() => { const l = $('#duaList'); if (l) l.innerHTML = '<p class="empty">Could not load duas.</p>'; });
}
function duaCard(i) {
  return `<div class="card dua"><h3>${esc(i.title)}</h3>
    <p class="verse-ar" lang="ar">${esc(i.ar)}</p>
    <p class="verse-en">${esc(i.en)}</p>
    ${i.repeat > 1 ? `<span class="rep">Repeat ${i.repeat}x</span>` : ''}
    <div class="src">${esc(i.source)}</div>
    <div class="btn-row"><button class="icon-btn" data-act="share-verse" data-ar="${esc(i.ar)}" data-en="${esc(i.en)}" data-ref="${esc(i.source)}" data-title="${esc(i.title)}" aria-label="Share">${ICO.share}</button></div>
  </div>`;
}
function viewMore() {
  setView(`<div class="list">
    <a class="row" data-go="#/goals"><div class="no">o</div><div class="nm"><b>Mission &amp; goals</b><span>Set a mission, break it into goals — no streaks</span></div></a>
    <a class="row" data-go="#/names"><div class="no">99</div><div class="nm"><b>99 Names of Allah</b><span>Asma ul Husna</span></div></a>
    <a class="row" data-go="#/calendar"><div class="no">Cal</div><div class="nm"><b>Calendar</b><span>Hijri and Gregorian, with key dates</span></div></a>
    <a class="row" data-go="#/mosques"><div class="no">M</div><div class="nm"><b>Nearby mosques</b><span>Around your location</span></div></a>
    <a class="row" data-go="#/bookmarks"><div class="no">*</div><div class="nm"><b>Bookmarks</b><span>Verses, with your notes</span></div></a>
    <a class="row" data-go="#/settings"><div class="no">i</div><div class="nm"><b>Settings</b><span>Theme, notifications, translations, method</span></div></a>
  </div>
  <p class="fine">Taqarrub means drawing nearer. Prayer times from Aladhan, Quran from Quran.com, mosques from OpenStreetMap, duas from Hisnul Muslim. This is not a fatwa.</p>`);
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
      </div>`).join('')}</div>
    <p class="fine">Names and English meanings from the Aladhan Asma al-Husna list, a commonly cited enumeration.</p>`;
    if (focus) requestAnimationFrame(() => document.getElementById('n' + focus)?.scrollIntoView({ block: 'center' }));
  }).catch(() => { const l = $('#nameList'); if (l) l.innerHTML = '<p class="empty">Could not load the names.</p>'; });
}
function viewBookmarks() {
  const b = bookmarks();
  if (!b.length) { setView('<p class="empty">No bookmarked verses yet. Open a surah and tap the star. You can add a private note to any bookmark.</p>'); return; }
  setView(`<div class="list">${b.map(x => {
    const [c, v] = String(x.key).split(':');
    return `<div class="card" style="margin-bottom:8px">
      <a class="row" data-go="#/quran/${c}/${v}" style="box-shadow:none;padding:0;border:0"><div class="no">${esc(x.key)}</div><div class="nm"><b>Ayah ${esc(x.key)}</b><span>${x.ts ? new Date(x.ts).toLocaleDateString() : ''}</span></div></a>
      <textarea class="mission" data-note-key="${esc(x.key)}" placeholder="Add a private note..." style="min-height:64px;margin-top:8px">${esc(x.note || '')}</textarea>
    </div>`;
  }).join('')}</div>`);
  $$('textarea[data-note-key]').forEach(t => t.addEventListener('change', () => setBookmarkNote(t.dataset.noteKey, t.value)));
}
function viewGoals() {
  const g = store.get('goals', { mission: '', items: [] });
  setView(`
    <div class="card">
      <div class="kicker">My mission</div>
      <p class="note">Write it in your own words. This stays on your phone.</p>
      <textarea class="mission" id="mission" placeholder="What do you want to live for?">${esc(g.mission)}</textarea>
    </div>
    <div class="section-h"><h2>Goals</h2></div>
    <div class="card" id="goalList">
      ${(g.items || []).map((it, i) => `
        <div class="goal ${it.done ? 'done' : ''}">
          <input type="checkbox" data-act="goal-tog" data-i="${i}" ${it.done ? 'checked' : ''}>
          <p>${esc(it.text)}</p>
        </div>`).join('') || '<p class="note">No goals yet. Add one below — gently, without streaks or pressure.</p>'}
    </div>
    <div class="card" style="margin-top:12px">
      <input id="newGoal" placeholder="Add a goal" style="width:100%;background:var(--bg2);border-radius:12px;padding:10px 12px">
      <div class="btn-row"><button class="btn" data-act="goal-add">Add goal</button></div>
    </div>
    <p class="fine">There are no streaks here. Miss a day, begin again.</p>`);
  $('#mission')?.addEventListener('change', e => {
    const cur = store.get('goals', { mission: '', items: [] });
    cur.mission = e.target.value; store.set('goals', cur);
  });
}
function islamicEvent(hMonth, hDay) {
  const ev = ISLAMIC_DAYS.find(x => x[0] === hMonth && x[1] === hDay);
  if (ev) return ev[2];
  if ([13, 14, 15].includes(hDay)) return 'Ayyam al-Beed';
  return null;
}
async function viewCalendar() {
  const now = new Date();
  const mode = store.get('calMode', 'gregorian');
  state._cal = state._cal || { y: now.getFullYear(), m: now.getMonth() + 1 };
  setView(`
    <div class="seg" style="margin-bottom:12px">
      <button data-act="cal-mode" data-v="gregorian" class="${mode === 'gregorian' ? 'on' : ''}">Gregorian</button>
      <button data-act="cal-mode" data-v="hijri" class="${mode === 'hijri' ? 'on' : ''}">Hijri</button>
    </div>
    <div class="card">
      <div class="section-h" style="margin-top:0"><button class="icon-btn" data-act="cal-prev" aria-label="Previous">${ICO.back}</button>
        <h2 id="calTitle">...</h2>
        <button class="icon-btn" data-act="cal-next" aria-label="Next" style="transform:scaleX(-1)">${ICO.back}</button>
      </div>
      <div id="calGrid"><div class="skel" style="height:200px"></div></div>
    </div>
    <div class="section-h"><h2>Key dates</h2></div>
    <div id="calEvents"></div>`);
  await drawCal();
}
async function drawCal() {
  const mode = store.get('calMode', 'gregorian');
  const { y, m } = state._cal;
  try {
    const d = await getJSON(`${AAPI}/gToHCalendar/${m}/${y}`);
    const days = d.data || [];
    if (!days.length) throw new Error('empty');
    const first = new Date(y, m - 1, 1).getDay();
    const startMon = (first + 6) % 7;
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    let cells = labels.map(x => `<div class="hd">${x}</div>`).join('');
    for (let i = 0; i < startMon; i++) cells += `<div class="day muted"></div>`;
    const todayK = dateKey(new Date());
    days.forEach(row => {
      const g = row.gregorian, h = row.hijri;
      const dk = `${pad(+g.day)}-${pad(m)}-${y}`;
      const ev = islamicEvent(+h.month.number, +h.day);
      const on = dk === todayK;
      const primary = mode === 'hijri' ? +h.day : +g.day;
      const secondary = mode === 'hijri' ? +g.day : +h.day;
      cells += `<div class="day ${on ? 'on' : ''} ${ev ? 'ev' : ''}" title="${esc(ev || '')}"><span>${primary}</span><span class="h">${secondary}</span></div>`;
    });
    const monthName = new Date(y, m - 1, 1).toLocaleString('en-GB', { month: 'long', year: 'numeric' });
    const hijriMonths = [...new Set(days.map(x => `${x.hijri.month.en} ${x.hijri.year}`))].join(' / ');
    const title = $('#calTitle'); if (title) title.textContent = mode === 'hijri' ? hijriMonths : monthName;
    const grid = $('#calGrid'); if (grid) grid.innerHTML = `<div class="cal">${cells}</div>`;
    const upcoming = [];
    days.forEach(row => {
      const ev = islamicEvent(+row.hijri.month.number, +row.hijri.day);
      if (ev) upcoming.push({ ev, g: row.gregorian, h: row.hijri });
    });
    const box = $('#calEvents');
    if (box) box.innerHTML = upcoming.length ? upcoming.map(e =>
      `<div class="row" style="margin-top:8px"><div class="no">*</div><div class="nm"><b>${esc(e.ev)}</b><span>${+e.g.day} ${monthName.split(' ')[0]} · ${e.h.day} ${e.h.month.en}</span></div></div>`
    ).join('') : '<p class="note">No highlighted dates this month. Ayyam al-Beed (13-15) and the major eids and nights are marked when they fall here.</p>';
  } catch {
    const grid = $('#calGrid'); if (grid) grid.innerHTML = '<p class="empty">Could not load this month.</p>';
  }
}
function viewSettings() {
  const theme = store.get('theme', 'system');
  const method = store.get('method', 3);
  const school = store.get('school', 0);
  const loc = state.loc || LONDON;
  const locLab = loc.fallback ? 'London (fallback)' : loc.label + (loc.manual ? ' (set)' : '');
  const trs = translations();
  const flags = reminderFlags();
  const on = notifEnabled() && typeof Notification !== 'undefined' && Notification.permission === 'granted';
  const triggerOk = typeof TimestampTrigger !== 'undefined';
  setView(`
    <div class="card">
      <div class="setting"><label>Theme</label>
        <div class="seg">
          <button type="button" data-act="theme" data-v="system" class="${theme === 'system' ? 'on' : ''}">System</button>
          <button type="button" data-act="theme" data-v="light" class="${theme === 'light' ? 'on' : ''}">Light</button>
          <button type="button" data-act="theme" data-v="dark" class="${theme === 'dark' ? 'on' : ''}">Dark</button>
        </div></div>
      <div class="setting"><label>Location</label>
        <div style="text-align:right">
          <div style="font-size:13px;font-weight:650">${esc(locLab)}</div>
          <button type="button" data-act="use-gps" style="color:var(--accent);font-size:12px;font-weight:700">Use my location</button>
          · <button type="button" data-act="use-london" style="color:var(--accent);font-size:12px;font-weight:700">London</button>
        </div></div>
      <div class="setting"><label for="method">Calculation method</label>
        <select id="method">${METHODS.map(([id, n]) => `<option value="${id}" ${id === method ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      </div>
      <div class="setting"><label>Asr</label>
        <div class="seg">
          <button type="button" data-act="school" data-v="0" class="${school === 0 ? 'on' : ''}">Standard</button>
          <button type="button" data-act="school" data-v="1" class="${school === 1 ? 'on' : ''}">Hanafi</button>
        </div></div>
    </div>
    <div class="section-h"><h2>Quran</h2></div>
    <div class="card">
      <label style="font-weight:650">Translations</label>
      <p class="note">Shown under each ayah. Sahih International is on by default.</p>
      ${EN_TRANSLATIONS.map(([id, n]) => `<label class="setting"><span>${esc(n)}</span>
        <input type="checkbox" data-act="tr-tog" data-id="${id}" ${trs.includes(id) ? 'checked' : ''}></label>`).join('')}
      <div class="setting"><label for="tafsir">Tafsir</label>
        <select id="tafsir">${TAFSIRS.map(([id, n]) => `<option value="${id}" ${id === tafsirId() ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
      </div>
    </div>
    <div class="section-h"><h2>Notifications</h2></div>
    <div class="card">
      <div class="setting"><label>Prayer and reminder alerts</label>
        <button class="toggle ${on ? 'on' : ''}" data-act="notif-tog" type="button" role="switch" aria-checked="${on}"><i></i></button></div>
      <div class="setting"><label>Chime while the app is open</label>
        <button class="toggle ${store.get('chime', true) ? 'on' : ''}" data-act="chime-tog" type="button" role="switch"><i></i></button></div>
      <p class="note">${triggerOk
        ? 'This browser can schedule notifications ahead of time. They still depend on the system allowing the site to notify you.'
        : 'This browser cannot reliably wake the phone for an adhan once Taqarrub is closed. Alerts will fire while the app is open (or running in the background if the system allows). For a guaranteed adhan, use your clock alarms as well.'}</p>
      <p class="note">A website cannot offer the same always-on adhan as a native app. That is a browser limit, not something we can fully fix here.</p>
    </div>
    <div class="card">
      <div class="kicker">Remind me about</div>
      ${[['morning','Morning adhkar'],['evening','Evening adhkar'],['kahf','Surah Al-Kahf on Friday'],['mulk','Surah Al-Mulk at night'],['beed','Ayyam al-Beed fasting']].map(([k,l]) =>
        `<div class="setting"><label>${l}</label><button class="toggle ${flags[k] ? 'on' : ''}" data-act="rem-tog" data-k="${k}" type="button"><i></i></button></div>`
      ).join('')}
      <div class="kicker" style="margin-top:8px">Prayers</div>
      ${PRAY_MAIN.map(n => `<div class="setting"><label>${n}</label><button class="toggle ${flags.prayers?.[n] !== false ? 'on' : ''}" data-act="prayer-tog" data-k="${n}" type="button"><i></i></button></div>`).join('')}
    </div>
    <p class="fine">Default method is Muslim World League, commonly used in the UK. A home-screen prayer widget is not available in a web app on Android.</p>`);
  $('#method')?.addEventListener('change', async e => { store.set('method', +e.target.value); await loadTimes(true); });
  $('#tafsir')?.addEventListener('change', e => store.set('tafsirId', +e.target.value));
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
    wrap.className = 'player'; wrap.id = 'playerWrap';
    document.body.appendChild(wrap);
  }
  wrap.innerHTML = `<div class="player-in">
    <button type="button" class="pbtn" data-act="toggle-play" aria-label="${playing ? 'Pause' : 'Play'}">${playing ? ICO.pause : ICO.play}</button>
    <div class="grow"><b>${esc(state.playing.label || 'Recitation')}</b><span>${esc(state.playing.sub || state.playing.reciterName || '')}</span></div>
    <button type="button" class="icon-btn" data-act="stop-play" aria-label="Close">${ICO.close}</button>
  </div>`;
  document.body.classList.toggle('has-player', true);
}
async function playChapter(n) {
  const reciter = store.get('reciter', 7);
  const recs = await recitations().catch(() => []);
  const rec = (recs || []).find(r => r.id === reciter);
  const d = await getJSON(`${QAPI}/chapter_recitations/${reciter}/${n}`);
  const url = audioUrl(d.audio_file?.audio_url);
  if (!url) throw new Error('No audio');
  const audio = $('#player');
  audio.src = url;
  const ch = (state.chapters || []).find(c => c.id === n);
  state.playing = { chapter: n, reciter, reciterName: rec ? rec.reciter_name : '', label: ch ? ch.name_simple : ('Surah ' + n), sub: rec ? rec.reciter_name : '' };
  try { await audio.play(); } catch {}
  renderPlayer();
}
async function playVerseRange(chapter, from, to, repeat) {
  const reciter = store.get('reciter', 7);
  const recs = await recitations().catch(() => []);
  const rec = (recs || []).find(r => r.id === reciter);
  const d = await getJSON(`${QAPI}/recitations/${reciter}/by_chapter/${chapter}`);
  const files = (d.audio_files || []).filter(f => {
    const v = +String(f.verse_key).split(':')[1];
    return v >= from && v <= to;
  });
  if (!files.length) { await playChapter(chapter); return; }
  const ch = (state.chapters || []).find(c => c.id === chapter);
  state._queue = { files, i: 0, repeat: repeat || 1, loops: 0, chapter, from, to };
  state.playing = { chapter, reciter, reciterName: rec ? rec.reciter_name : '', label: (ch ? ch.name_simple : 'Surah ' + chapter) + ` ${from}-${to}`, sub: rec ? rec.reciter_name : '' };
  playQueueItem();
}
function playQueueItem() {
  const q = state._queue; if (!q) return;
  const f = q.files[q.i]; if (!f) return;
  $$('.ayah.playing').forEach(el => el.classList.remove('playing'));
  const vn = +String(f.verse_key).split(':')[1];
  document.getElementById('a' + vn)?.classList.add('playing');
  document.getElementById('a' + vn)?.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' });
  const audio = $('#player');
  audio.src = audioUrl(f.url);
  audio.play().catch(() => {});
  renderPlayer();
}
function onPlayerEnded() {
  const q = state._queue;
  if (!q) { state.playing = null; $$('.ayah.playing').forEach(el => el.classList.remove('playing')); renderPlayer(); return; }
  if (q.i < q.files.length - 1) { q.i++; playQueueItem(); return; }
  q.loops++;
  if (q.repeat === 0 || q.loops < q.repeat) { q.i = 0; playQueueItem(); return; }
  state._queue = null; state.playing = null;
  $$('.ayah.playing').forEach(el => el.classList.remove('playing'));
  renderPlayer();
}
function updateCountdown() {
  const pack = state.times; if (!pack) return;
  const nxt = nextPrayer(pack);
  const cur = currentPeriod(pack);
  const el = $('#cd');
  if (el && nxt) el.textContent = fmtCd(nxt.at - Date.now());
  const bar = $('#heroBar');
  if (bar && cur && cur.end && cur.at) bar.style.width = Math.min(100, Math.max(0, (Date.now() - cur.at) / (cur.end - cur.at) * 100)) + '%';
}
function openSheet(title, body) {
  const el = $('#sheet'); el.hidden = false;
  el.innerHTML = `<div class="sheet-in"><div class="grab"></div><h2>${esc(title)}</h2><div>${body}</div></div>`;
}
function closeSheet() { const el = $('#sheet'); el.hidden = true; el.innerHTML = ''; }
async function shareCard({ ar, en, ref, title }) {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#F3EBDD'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#1E6B54'; ctx.fillRect(0, 0, 1080, 16);
  ctx.fillStyle = '#C49A3C'; ctx.fillRect(80, 80, 120, 6);
  try { await document.fonts.ready; await Promise.allSettled([document.fonts.load('64px "Amiri Quran"'), document.fonts.load('32px "DM Sans"')]); } catch {}
  ctx.fillStyle = '#1B1914';
  ctx.textAlign = 'right';
  ctx.font = '58px "Amiri Quran", "Noto Naskh Arabic", serif';
  wrapText(ctx, ar || '', 1000, 200, 880, 92);
  ctx.textAlign = 'left';
  ctx.font = '32px "DM Sans", sans-serif';
  ctx.fillStyle = '#3E3A32';
  wrapText(ctx, en || '', 80, 820, 920, 46);
  ctx.font = '24px "DM Sans", sans-serif';
  ctx.fillStyle = '#C49A3C';
  ctx.fillText(((title ? title + ' · ' : '') + (ref || '')).slice(0, 80), 80, 1220);
  ctx.fillStyle = '#1E6B54';
  ctx.font = '700 28px "DM Sans", sans-serif';
  ctx.fillText('Taqarrub', 80, 1280);
  const blob = await new Promise(res => c.toBlob(res, 'image/png'));
  const file = new File([blob], 'taqarrub.png', { type: 'image/png' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Taqarrub', text: ref || '' });
      return;
    }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'taqarrub.png';
  a.click();
}
function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(/\s+/);
  let line = '', yy = y;
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lineH; }
    else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

async function onAct(act, el) {
  if (act === 'toggle-wbw') { store.set('wbw', !store.get('wbw', false)); render(true); }
  else if (act === 'toggle-mushaf') { store.set('mushaf', !store.get('mushaf', false)); render(true); }
  else if (act === 'qsize-down') {
    store.set('qsize', Math.max(20, store.get('qsize', 28) - 2));
    const r = $('#reader'); if (r) r.style.setProperty('--qsize', store.get('qsize') + 'px'); else render(true);
  } else if (act === 'qsize-up') {
    store.set('qsize', Math.min(44, store.get('qsize', 28) + 2));
    const r = $('#reader'); if (r) r.style.setProperty('--qsize', store.get('qsize') + 'px'); else render(true);
  } else if (act === 'qmode') {
    state._qmode = el.dataset.mode;
    $$('.chips .chip').forEach(c => c.classList.toggle('on', c === el));
    if (state._qmode === 'juz') drawJuzList();
    else if (state._qmode === 'hizb') drawHizbList();
    else if (state._qmode === 'page') drawPageList();
    else drawChapterList(state.chapters || []);
  } else if (act === 'go-page') {
    go('#/quran/page/' + Math.min(604, Math.max(1, +$('#pageNum')?.value || 1)));
  } else if (act === 'bookmark') {
    toggleBookmark(el.dataset.key);
    el.classList.toggle('on', isBookmarked(el.dataset.key));
  } else if (act === 'tafsir') {
    const key = el.dataset.key;
    const id = tafsirId();
    const name = (TAFSIRS.find(t => t[0] === id) || TAFSIRS[0])[1];
    openSheet(name + ' · ' + key, '<div class="skel" style="height:80px"></div>');
    try {
      const d = await getJSON(`${QAPI}/tafsirs/${id}/by_ayah/${key}`);
      const text = strip(d.tafsir?.text || d.tafsir?.text_clean || 'No tafsir is available for this verse.');
      if (!$('#sheet').hidden) openSheet(name + ' · ' + key, `<div class="tafsir">${esc(text)}</div><p class="note">Change the tafsir in Settings.</p>`);
    } catch {
      if (!$('#sheet').hidden) openSheet(name + ' · ' + key, '<p class="note">Could not load tafsir.</p>');
    }
  } else if (act === 'word') {
    const art = el.closest('.ayah');
    const pop = art && art.querySelector('.word-pop');
    if (!pop) return;
    $$('.ayah-ar .w.on').forEach(w => w.classList.remove('on'));
    if (state.wbwKey === el) { pop.hidden = true; state.wbwKey = null; return; }
    el.classList.add('on'); pop.hidden = false;
    pop.innerHTML = `<div class="wa" lang="ar">${el.dataset.ar || el.textContent}</div><div>${esc(el.dataset.tl || '')}</div><div>${esc(el.dataset.tr || '')}</div>`;
    state.wbwKey = el;
    if (el.dataset.au) { try { wordAudio.src = audioUrl(el.dataset.au); wordAudio.play(); } catch {} }
  } else if (act === 'play-chapter') {
    let n = +el.dataset.n;
    if (el.dataset.kind !== 'chapter') {
      const verses = state.verseCache[el.dataset.kind + ':' + n] || [];
      n = verses[0]?.chapter_id;
    }
    if (n) playChapter(n).catch(() => openSheet('Audio', '<p class="note">Could not start the recitation.</p>'));
  } else if (act === 'play-range') {
    const ch = +el.dataset.chapter;
    const from = +$('#rFrom')?.value || 1;
    const to = +$('#rTo')?.value || from;
    const rep = +$('#rRepeat')?.value;
    playVerseRange(ch, Math.min(from, to), Math.max(from, to), rep).catch(() => openSheet('Audio', '<p class="note">Could not play that range. Try another reciter.</p>'));
  } else if (act === 'play-from') {
    const [c, v] = String(el.dataset.key).split(':').map(Number);
    const last = $$('.ayah');
    const to = last.length ? +last[last.length - 1].id.replace('a', '') : v;
    playVerseRange(c, v, to, 1).catch(() => {});
  } else if (act === 'toggle-play') {
    const audio = $('#player');
    if (audio.paused) audio.play(); else audio.pause();
    renderPlayer();
  } else if (act === 'stop-play') {
    const audio = $('#player');
    audio.pause(); audio.removeAttribute('src'); audio.load();
    state.playing = null; state._queue = null;
    $$('.ayah.playing').forEach(x => x.classList.remove('playing'));
    renderPlayer();
  } else if (act === 'share-verse' || act === 'share-ayah') {
    if (act === 'share-ayah') {
      const art = document.querySelector('.ayah[data-key="' + CSS.escape(el.dataset.key) + '"]');
      const ar = art?.querySelector('.ayah-ar')?.innerText || '';
      const en = art?.querySelector('.ayah-en')?.innerText || '';
      await shareCard({ ar, en, ref: el.dataset.key });
    } else await shareCard({ ar: el.dataset.ar, en: el.dataset.en, ref: el.dataset.ref, title: el.dataset.title });
  } else if (act === 'theme') { store.set('theme', el.dataset.v); applyTheme(); viewSettings(); }
  else if (act === 'school') { store.set('school', +el.dataset.v); await loadTimes(true); viewSettings(); }
  else if (act === 'use-london') {
    const loc = { ...LONDON, manual: true }; store.set('loc', loc); state.loc = loc; await loadTimes(true); viewSettings();
  } else if (act === 'use-gps') {
    const prev = store.get('loc');
    if (prev) { const p = { ...prev }; delete p.manual; store.set('loc', p); }
    else store.set('loc', null);
    await tryGetLoc(); await loadTimes(true); viewSettings();
  } else if (act === 'retry-times') {
    try { await loadTimes(true); render(true); } catch { render(true); }
  } else if (act === 'tr-tog') {
    let trs = translations();
    const id = +el.dataset.id;
    if (el.checked) { if (!trs.includes(id)) trs.push(id); }
    else trs = trs.filter(x => x !== id);
    if (!trs.length) trs = [20];
    store.set('translations', trs);
    state.verseCache = {};
  } else if (act === 'notif-tog') {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') {
      const p = await requestNotifs();
      if (p !== 'granted') { store.set('notifsOn', false); return; }
    } else store.set('notifsOn', !notifEnabled());
    if (notifEnabled()) scheduleNotifications(state.times);
    viewSettings();
  } else if (act === 'chime-tog') { store.set('chime', !store.get('chime', true)); viewSettings(); }
  else if (act === 'rem-tog') {
    const f = reminderFlags(); f[el.dataset.k] = !f[el.dataset.k]; store.set('reminders', f); viewSettings();
  } else if (act === 'prayer-tog') {
    const f = reminderFlags(); f.prayers = f.prayers || {}; f.prayers[el.dataset.k] = !el.classList.contains('on'); store.set('reminders', f); viewSettings();
  } else if (act === 'goal-add') {
    const t = $('#newGoal')?.value.trim(); if (!t) return;
    const g = store.get('goals', { mission: '', items: [] });
    g.items.push({ text: t, done: false }); store.set('goals', g); viewGoals();
  } else if (act === 'goal-tog') {
    const g = store.get('goals', { mission: '', items: [] });
    const i = +el.dataset.i; if (g.items[i]) g.items[i].done = el.checked;
    store.set('goals', g); viewGoals();
  } else if (act === 'cal-mode') { store.set('calMode', el.dataset.v); viewCalendar(); }
  else if (act === 'cal-prev') { state._cal.m--; if (state._cal.m < 1) { state._cal.m = 12; state._cal.y--; } viewCalendar(); }
  else if (act === 'cal-next') { state._cal.m++; if (state._cal.m > 12) { state._cal.m = 1; state._cal.y++; } viewCalendar(); }
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
  audio.addEventListener('ended', onPlayerEnded);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme());
  setInterval(() => { updateCountdown(); checkDueNotifs(); }, 1000);
}
async function boot() {
  applyTheme();
  if (!location.hash) history.replaceState(null, '', '#/home');
  bind();
  state.loc = store.get('loc') || LONDON;
  renderTabs();
  render(true);
  tryGetLoc().then(async () => {
    try { await loadTimes(true); } catch {}
    if (['home', 'prayer', 'qibla'].includes(state.route.name)) render(true);
    else updateCountdown();
  });
  try { await loadTimes(); } catch {}
  if (['home', 'prayer'].includes(parseRoute().name)) render(true);
  chapters().catch(() => {});
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return; refreshing = true; location.reload();
    });
  }
}
boot();
