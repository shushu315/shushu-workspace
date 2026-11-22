/* 数据层：localStorage 持久化，按日期存储，自动保留 2 年 */
(function (global) {
  const KEY = 'shushu_workspace_data_v1';
  const KEEP_DAYS = 730; // 2 年

  function todayISO(offset = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  function defaultData() {
    return {
      version: 1,
      createdAt: Date.now(),
      profile: {
        name: '树树',
        // 首次使用时默认设为 16 天前，可在健康板块修改
        lastPeriodStart: todayISO(-16),
        cycleLength: 28,
        periodLength: 5,
        // 身体数据（用于基础代谢计算）
        body: { height: '', weight: '', age: '', arm: '', hip: '', waist: '', thigh: '' }
      },
      days: {},        // days['YYYY-MM-DD'] = { todo:[], plan:[], exerciseCheck, resistance, aerobic, water, sleep, supplements:[], englishMin, diary:{} }
      schedule: {},    // schedule['YYYY-MM-DD'] = [ {id,text,scope,color,done} ]
      english: {
        currentDay: 1,
        completed: [],
        quizResults: [],
        wordBook: [],
        grammarNotes: [],
        reviews: [],
        tests: []
      },
      settings: { lastCleanup: todayISO() }
    };
  }

  let cache = null;

  function load() {
    if (cache) return cache;
    try {
      const raw = localStorage.getItem(KEY);
      cache = raw ? JSON.parse(raw) : defaultData();
    } catch (e) {
      cache = defaultData();
    }
    // 确保结构完整（含从云端拉取的不完整数据兜底）
    const d = defaultData();
    for (const k of Object.keys(d)) if (cache[k] === undefined || cache[k] === null) cache[k] = d[k];
    if (typeof cache.days !== 'object' || Array.isArray(cache.days)) cache.days = {};
    if (typeof cache.schedule !== 'object' || Array.isArray(cache.schedule)) cache.schedule = {};
    if (typeof cache.profile !== 'object') cache.profile = d.profile;
    if (!cache.profile.body) cache.profile.body = d.profile.body;
    if (typeof cache.english !== 'object') cache.english = d.english;
    prune();
    save();
    return cache;
  }

  function save() {
    if (!cache) return;
    cache.__updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* 超额忽略 */ }
    // 通知同步引擎标记待同步（引擎内部会防抖推送，且 pull/导入时会抑制）
    if (global.Sync && !global.__SYNC_SUPPRESS__ && global.Sync.isLoggedIn && global.Sync.isLoggedIn()) {
      global.Sync.markDirty();
    }
  }

  /** 清理 2 年前数据 */
  function prune() {
    const cutoff = todayISO(-KEEP_DAYS);
    for (const map of [cache.days, cache.schedule]) {
      Object.keys(map).forEach((k) => { if (k < cutoff) delete map[k]; });
    }
    cache.settings.lastCleanup = todayISO();
  }

  function day(date, init = true) {
    const d = load();
    if (!d.days[date] && init) {
      d.days[date] = {
        todo: [], plan: [], exerciseCheck: false,
        resistance: { min: '', items: '' }, aerobic: { min: '', items: '' },
        water: 0, sleep: '', supplements: [], englishMin: 0, diary: null, foods: []
      };
      save();
    }
    if (!Array.isArray(d.days[date].foods)) d.days[date].foods = [];
    return d.days[date];
  }

  function updateDay(date, patch) {
    const cur = day(date);
    Object.assign(cur, patch);
    save();
    return cur;
  }

  function schedule(date) {
    const d = load();
    if (!d.schedule[date]) { d.schedule[date] = []; save(); }
    return d.schedule[date];
  }

  function setSchedule(date, list) {
    const d = load();
    d.schedule[date] = list;
    save();
  }

  function setProfile(patch) { Object.assign(load().profile, patch); save(); }
  function english() { return load().english; }
  function saveEnglish() { save(); }
  function all() { return load(); }

  function exportJSON() { return JSON.stringify(load(), null, 2); }
  function importJSON(text) {
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    cache = parsed;
    // 导入/云同步覆盖属于"接收"，不应立即回推，抑制一次
    global.__SYNC_SUPPRESS__ = true;
    save();
    global.__SYNC_SUPPRESS__ = false;
  }
  function clearAll() {
    cache = defaultData();
    save();
  }

  global.Store = { load, save, day, updateDay, schedule, setSchedule, setProfile, english, saveEnglish, all, exportJSON, importJSON, clearAll, todayISO, KEEP_DAYS };
})(window);
