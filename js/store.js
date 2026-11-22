/* 数据层：localStorage 持久化，按日期存储，自动保留 2 年
 * v18 安全加固：
 *  - save(touch=false)：读取/结构补全只持久化，不刷新时间戳、不触发同步
 *    （新设备打开 app 不再获得"假的最新时间戳"，空壳无法在时间战里胜出）
 *  - 保险箱升级为「最后一份有真实内容的数据快照」，每次真实编辑都自动留存
 *    （任何形式的静默清空/覆盖，都能从保险箱找回）
 *  - 只有用户主动"清空数据"才清除保险箱，区分"事故"与"主动意愿"
 */
(function (global) {
  const KEY = 'shushu_workspace_data_v1';
  const VAULT_KEY = 'shushu_workspace_vault_v1'; // 保险箱：最后一份"有真实内容"的数据快照
  const KEEP_DAYS = 730; // 2 年

  // 判断是否含真实用户内容（与 sync.js 的 hasRealData 同口径，独立实现避免依赖）
  // 注意：绝不能用会随时间变化的默认值（如经期默认日期）作为"有数据"的证据 —— 那是 v17 事故的元凶之一
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
    // 排除自动生成的周测/月测，只认用户自己加的计划
    const sched = d.schedule || {};
    for (const k of Object.keys(sched)) { if ((sched[k] || []).some(p => p.source !== 'exam')) return true; }
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
        lastPeriodStart: todayISO(-16),
        cycleLength: 28,
        periodLength: 5,
        body: { height: '', weight: '', age: '', arm: '', hip: '', waist: '', thigh: '' }
      },
      days: {},
      schedule: {},
      english: {
        currentDay: 1,
        completed: [],
        quizResults: [],
        wordBook: [],
        grammarNotes: [],
        reviews: [],
        tests: [],
        papers: [],
        notes: [],
        studyLog: {}
      },
      summaries: [],
      notifications: [],
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
    ['papers', 'notes', 'wordBook', 'grammarNotes', 'reviews', 'tests', 'completed', 'quizResults'].forEach(k => {
      if (!Array.isArray(cache.english[k])) cache.english[k] = [];
    });
    if (typeof cache.english.studyLog !== 'object' || Array.isArray(cache.english.studyLog)) cache.english.studyLog = {};
    if (typeof cache.english.currentDay !== 'number') cache.english.currentDay = 1;
    if (!Array.isArray(cache.summaries)) cache.summaries = [];
    if (!Array.isArray(cache.notifications)) cache.notifications = [];
    prune();
    save(false); // 读取不属于数据变更：不刷新时间戳、不触发同步
    return cache;
  }

  /**
   * touch=true（默认）：真实数据变更 → 刷新 __updatedAt + 更新保险箱 + 标记待同步
   * touch=false：读取/结构补全/接收云端数据 → 仅持久化，不做上述动作
   */
  function save(touch) {
    if (!cache) return;
    if (touch !== false) {
      cache.__updatedAt = Date.now();
      // 保险箱：每次真实编辑都留存最新有内容快照，任何清空/覆盖都能找回
      try { if (hasContent(cache)) localStorage.setItem(VAULT_KEY, JSON.stringify(cache)); } catch (e) {}
    }
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* 超额忽略 */ }
    if (touch !== false && global.Sync && !global.__SYNC_SUPPRESS__ && global.Sync.isLoggedIn && global.Sync.isLoggedIn()) {
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
      save(false); // 仅创建空结构，不算数据变更
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
    if (!d.schedule[date]) { d.schedule[date] = []; save(false); }
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
  function addStudySeconds(sec) {
    const d = load();
    const day = todayISO();
    d.english.studyLog[day] = (d.english.studyLog[day] || 0) + sec;
    const dayData = d.days[day] || (day(day, true));
    dayData.englishMin = Math.round(d.english.studyLog[day] / 60);
    save();
  }
  function all() { return load(); }

  function exportJSON() { return JSON.stringify(load(), null, 2); }
  function importJSON(text) {
    const parsed = typeof text === 'string' ? JSON.parse(text) : text;
    // 保险箱：若当前有真实内容、即将被空壳覆盖，永久留存当前快照
    try {
      if (hasContent(cache) && !hasContent(parsed)) {
        localStorage.setItem(VAULT_KEY, JSON.stringify(cache));
      }
    } catch (e) {}
    cache = parsed;
    // 接收云端数据属于"接收"，不制造本地新时间戳、不回推
    global.__SYNC_SUPPRESS__ = true;
    save(false);
    global.__SYNC_SUPPRESS__ = false;
  }
  /** 读取保险箱里的历史快照 */
  function vault() {
    try { const raw = localStorage.getItem(VAULT_KEY); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
  }
  /** 从保险箱恢复到当前数据 */
  function restoreVault() {
    const v = vault();
    if (!v) return false;
    cache = v;
    save(false);
    return true;
  }
  function clearAll() {
    cache = defaultData();
    // 主动清空：同时清除保险箱，区分"用户意愿"与"同步事故"
    try { localStorage.removeItem(VAULT_KEY); } catch (e) {}
    save();
  }

  /**
   * 数据抢救：扫描本机 localStorage 里所有"像工作台数据"的 JSON 快照，
   * 统计每份的真实内容量，供事故后判断哪一份还能救回。
   */
  function scanSnapshots() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        const raw = localStorage.getItem(k);
        if (!raw || raw.length < 20) continue;
        let v;
        try { v = JSON.parse(raw); } catch (e) { continue; }
        if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
        if (!('days' in v) && !('english' in v) && !('schedule' in v)) continue;
        const days = v.days || {};
        const dk = Object.keys(days);
        let todos = 0, diaries = 0;
        dk.forEach(d => {
          const day = days[d] || {};
          todos += (day.todo || []).length;
          if (day.diary && typeof day.diary === 'object' && Object.keys(day.diary).length) diaries++;
        });
        const sorted = dk.slice().sort();
        out.push({
          key: k,
          days: dk.length,
          todos,
          diaries,
          range: sorted.length ? (sorted[0] + ' ~ ' + sorted[sorted.length - 1]) : '',
          real: hasContent(v),
          size: raw.length,
          updatedAt: v.__updatedAt || 0
        });
      }
    } catch (e) {}
    out.sort((a, b) => (b.todos + b.diaries * 2) - (a.todos + a.diaries * 2));
    return out;
  }
  /** 从指定 key 的快照恢复到当前数据（恢复前先把当前有内容的数据存入保险箱） */
  function restoreSnapshot(key) {
    const raw = localStorage.getItem(key);
    if (!raw) return false;
    let parsed;
    try { parsed = JSON.parse(raw); } catch (e) { return false; }
    if (hasContent(cache) && !hasContent(parsed)) {
      try { localStorage.setItem(VAULT_KEY, JSON.stringify(cache)); } catch (e) {}
    }
    cache = parsed;
    global.__SYNC_SUPPRESS__ = true;
    save(false);
    global.__SYNC_SUPPRESS__ = false;
    return true;
  }

  global.Store = { load, save, day, updateDay, schedule, setSchedule, setProfile, english, saveEnglish, addStudySeconds, all, exportJSON, importJSON, clearAll, vault, restoreVault, hasContent, scanSnapshots, restoreSnapshot, todayISO, KEEP_DAYS };
})(window);
