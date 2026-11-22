/* 数据层：localStorage 持久化，按日期存储，自动保留 2 年 */
(function (global) {
  const KEY = 'shushu_workspace_data_v1';
  const VAULT_KEY = 'shushu_workspace_vault_v1'; // 保险箱：永远保留最后一份"有内容"的数据快照，防同步事故
  const KEEP_DAYS = 730; // 2 年

  // 判断一份数据是否含真实用户内容（与 sync.js 的 hasRealData 同口径，独立实现避免依赖）
  function hasContent(d) {
    if (!d) return false;
    const days = d.days || {};
    for (const k of Object.keys(days)) {
      const day = days[k];
      if (!day) continue;
      if ((day.todo && day.todo.length) || day.water || day.sleep || day.exerciseCheck ||
          (day.diary && typeof day.diary === 'object' && Object.keys(day.diary).length) ||
          (day.resistance && day.resistance.min) || (day.aerobic && day.aerobic.min) ||
          (day.supplements && day.supplements.length) || day.englishMin ||
          (day.foods && day.foods.length)) return true;
    }
    const sched = d.schedule || {};
    for (const k of Object.keys(sched)) { if ((sched[k] || []).length) return true; }
    const eng = d.english || {};
    if ((eng.completed && eng.completed.length) || (eng.quizResults && eng.quizResults.length) ||
        (eng.wordBook && eng.wordBook.length) || eng.currentDay > 1) return true;
    return false;
  }

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
    // 【保险箱】覆盖前：若当前数据有真实内容，且即将被"空壳"覆盖，则永久留存一份。
    // 这样即便同步出意外把本地清空，也能从保险箱一键找回。
    try {
      if (hasContent(cache) && !hasContent(parsed)) {
        const prev = localStorage.getItem(VAULT_KEY);
        // 只保留内容更"多"的那份，避免旧快照反复覆盖更好的快照
        const shouldSave = !prev || vaultScore(parsed) < vaultScore(JSON.parse(prev));
        if (shouldSave) localStorage.setItem(VAULT_KEY, JSON.stringify(cache));
      }
    } catch (e) {}
    cache = parsed;
    // 导入/云同步覆盖属于"接收"，不应立即回推，抑制一次
    global.__SYNC_SUPPRESS__ = true;
    save();
    global.__SYNC_SUPPRESS__ = false;
  }
  // 粗略估算数据"丰富度"，用于比较保险箱快照
  function vaultScore(d) {
    try {
      const days = d.days || {};
      let n = Object.keys(days).length;
      for (const k of days) { const day = days[k] || {}; n += (day.todo || []).length + (day.foods || []).length; }
      return n;
    } catch (e) { return 0; }
  }
  /** 读取保险箱里的历史快照（供 UI 展示"找回"用） */
  function vault() {
    try { const raw = localStorage.getItem(VAULT_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  /** 从保险箱恢复到当前数据 */
  function restoreVault() {
    const v = vault();
    if (!v) return false;
    cache = v;
    global.__SYNC_SUPPRESS__ = true;
    save();
    global.__SYNC_SUPPRESS__ = false;
    return true;
  }
  function clearAll() {
    cache = defaultData();
    save();
  }

  global.Store = { load, save, day, updateDay, schedule, setSchedule, setProfile, english, saveEnglish, all, exportJSON, importJSON, clearAll, vault, restoreVault, todayISO, KEEP_DAYS };
})(window);
