/* 同步引擎：Supabase Auth + REST，纯 fetch，无外部依赖
 * 本地 localStorage 仍是主存储（离线可用），Supabase 作为三端同步中枢。
 * v18 安全铁律（针对 11-22 二次事故彻底加固）：
 *   1) "有真实数据"的判定绝不依赖会随时间变化的默认值（已删除经期误判）
 *   2) 本地时间戳来自真实编辑（load 不再刷新），空壳永远没有"假的最新时间戳"
 *   3) 空壳绝不覆盖有数据的一方；空壳绝不推送（doPush 铁律）
 *   4) 云端镜像自愈：拉取时若发现云端数据"缩水"（比本地/保险箱少很多），自动拒绝覆盖并反向保护
 */
(function (global) {
  const URL = 'https://aehpykzahalcgifzpccz.supabase.co';
  const KEY = 'sb_publishable_vxWsNXAlJqGzpjKTqmETvg_E912WQjA';
  const AUTH_KEY = 'shushu_auth_v1';
  const SYNC_META = 'shushu_sync_meta_v1';

  let auth = null;
  try { auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { auth = null; }
  let meta = null;
  try { meta = JSON.parse(localStorage.getItem(SYNC_META) || 'null'); } catch (e) { meta = null; }
  if (!meta) meta = { dirty: false, lastPushAt: 0, lastPullAt: 0 };

  let syncing = false;
  let pushTimer = null;
  let listeners = [];
  let booting = true;
  setTimeout(() => { booting = false; }, 3000);

  const S = {};
  S.URL = URL;
  S.READY = false;

  function saveAuth() { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }
  function saveMeta() { localStorage.setItem(SYNC_META, JSON.stringify(meta)); }
  function notify(state, msg) { listeners.forEach(fn => { try { fn(state, msg); } catch (e) {} }); }
  S.onStatus = function (fn) { listeners.push(fn); };

  /**
   * 判断"这份数据是否含真实用户内容"—— 直接复用 store.js 的 hasContent 口径。
   * v18 关键修复：不再使用"经期日期≠今天"这类会随时间变化的判断。
   * 那种判断会把一个从未记录过任何东西的空壳，在隔天打开时误判为"有数据"，
   * 进而骗过 doPush 的空壳保护，把空数据推上云端造成三端清空。
   */
  function hasRealData(d) {
    return !!(global.Store && Store.hasContent && Store.hasContent(d));
  }

  /** 数据"丰富度"评分：用于自愈比对，防止云端缩水覆盖本地 */
  function richness(d) {
    try {
      if (!d) return 0;
      let n = 0;
      const days = d.days || {};
      for (const k of Object.keys(days)) {
        const day = days[k] || {};
        n += (day.todo || []).length + (day.foods || []).length + (day.supplements || []).length;
        if (day.water) n += 0.2; if (day.sleep) n += 0.2; if (day.englishMin) n += 0.2;
      }
      const sched = d.schedule || {};
      for (const k of Object.keys(sched)) n += (sched[k] || []).filter(p => p.source !== 'exam').length;
      const eng = d.english || {};
      n += (eng.completed || []).length + (eng.quizResults || []).length + (eng.wordBook || []).length;
      return n;
    } catch (e) { return 0; }
  }

  function headers(withAuth = true) {
    const h = { 'apikey': KEY, 'Content-Type': 'application/json' };
    if (withAuth && auth && auth.accessToken) h['Authorization'] = 'Bearer ' + auth.accessToken;
    return h;
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, opts);
    let body = null;
    try { body = await res.json(); } catch (e) {}
    if (!res.ok) {
      const err = new Error((body && (body.msg || body.message || body.error_description)) || ('HTTP ' + res.status));
      err.status = res.status; err.body = body; throw err;
    }
    return body;
  }

  S.isLoggedIn = function () { return !!(auth && auth.accessToken); };
  S.email = function () { return auth ? auth.email : ''; };

  async function ensureToken() {
    if (!auth || !auth.accessToken) throw new Error('未登录');
    const now = Date.now();
    if (auth.expiresAt && now < auth.expiresAt - 60000) return;
    if (!auth.refreshToken) throw new Error('登录已过期，请重新登录');
    const data = await fetchJSON(URL + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: headers(false),
      body: JSON.stringify({ refresh_token: auth.refreshToken })
    });
    auth.accessToken = data.access_token;
    auth.refreshToken = data.refresh_token || auth.refreshToken;
    auth.expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    saveAuth();
  }

  S.login = async function (email, password) {
    const data = await fetchJSON(URL + '/auth/v1/token?grant_type=password', {
      method: 'POST', headers: headers(false),
      body: JSON.stringify({ email: email.trim(), password })
    });
    auth = {
      accessToken: data.access_token, refreshToken: data.refresh_token,
      userId: data.user && data.user.id, email: data.user && data.user.email || email.trim(),
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000
    };
    saveAuth();
    notify('online', '已登录');
    return auth;
  };

  S.signup = async function (email, password) {
    const data = await fetchJSON(URL + '/auth/v1/signup', {
      method: 'POST', headers: headers(false),
      body: JSON.stringify({ email: email.trim(), password })
    });
    if (data.access_token) {
      auth = {
        accessToken: data.access_token, refreshToken: data.refresh_token,
        userId: data.user && data.user.id, email: data.user && data.user.email || email.trim(),
        expiresAt: Date.now() + (data.expires_in || 3600) * 1000
      };
      saveAuth();
    }
    return { needVerify: !data.access_token, user: data.user };
  };

  S.logout = function () {
    auth = null; localStorage.removeItem(AUTH_KEY);
    meta.dirty = false; saveMeta();
    notify('offline', '已退出登录');
  };

  S.markDirty = function () {
    if (!S.isLoggedIn()) return;
    if (booting) return;
    meta.dirty = true; saveMeta();
    notify('pending', '待同步');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => S.push(true), 700);
  };

  S.pull = async function (opts) {
    opts = opts || {};
    if (!S.isLoggedIn()) return { ok: false, reason: '未登录' };
    if (syncing && !opts.force) return { ok: false, reason: '同步中' };
    syncing = true; notify('syncing', '同步中');
    try {
      await ensureToken();
      const rows = await fetchJSON(URL + '/rest/v1/workspace_data?select=data,updated_at&user_id=eq.' + encodeURIComponent(auth.userId), { headers: headers() });
      if (!Array.isArray(rows) || rows.length === 0) {
        meta.lastPullAt = Date.now(); saveMeta();
        S.READY = true;
        notify('online', '云端暂无数据');
        return { ok: true, empty: true };
      }
      S.READY = true;
      const remote = rows[0].data;
      const local = Store.load();
      const localTs = local.__updatedAt || 0;
      const localHasData = hasRealData(local);
      const remoteHasData = hasRealData(remote);
      const localRich = richness(local);
      const remoteRich = richness(remote);

      // 强制下载：云端覆盖本地（用户手动确认后）
      if (opts.preferRemote) {
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已下载云端数据');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // ===== v18 合并铁律：空壳永远不能覆盖有数据的一方，时间戳只作同级裁决 =====

      // 场景1 本地空壳、云端有真实数据 → 拉取云端（新设备/iPad 首次登录走这里）
      if (!localHasData && remoteHasData) {
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已拉取云端数据');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // 场景2 本地有真实数据、云端是空壳 → 上传本地（保护本地，绝不空壳覆盖）
      if (localHasData && !remoteHasData) {
        notify('syncing', '正在上传本地变更');
        await doPush();
        notify('online', '已同步');
        return { ok: true, pushed: true };
      }

      // 场景3 两端都有真实数据 → 时间戳新的一方胜；但云端明显缩水时拒绝覆盖并反向保护
      if (localHasData && remoteHasData) {
        // 自愈：云端丰富度远低于本地（疑似被空壳/残缺数据污染），拒绝拉取，反向上传本地
        if (remoteRich + 3 < localRich) {
          await doPush();
          notify('online', '已保护本地数据并修复云端');
          return { ok: true, pushed: true, protected: true };
        }
        if (localTs > remoteTs) {
          await doPush();
          notify('online', '已同步');
          return { ok: true, pushed: true };
        }
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已拉取最新');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // 场景4 两端都是空壳 → 无需操作
      meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
      notify('online', '已是最新');
      return { ok: true };
    } catch (e) {
      notify('error', e.message || '拉取失败');
      return { ok: false, error: e };
    } finally { syncing = false; }
  };

  async function doPush(opts) {
    opts = opts || {};
    await ensureToken();
    const data = Store.load();
    // 铁律：本地是空壳时绝不推送，任何情况都不允许空壳覆盖云端真实数据。
    if (!hasRealData(data)) {
      notify('online', '本地无数据，已阻止上传以保护云端');
      return false;
    }
    data.__updatedAt = Date.now();
    const payload = { user_id: auth.userId, data: data, updated_at: new Date().toISOString() };
    await fetchJSON(URL + '/rest/v1/workspace_data?on_conflict=user_id', {
      method: 'POST',
      headers: Object.assign(headers(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify([payload])
    });
    meta.dirty = false; meta.lastPushAt = Date.now(); saveMeta();
  }

  S.push = async function (silent, opts) {
    if (!S.isLoggedIn()) return { ok: false, reason: '未登录' };
    if (syncing) return { ok: false, reason: '同步中' };
    syncing = true;
    if (!silent) notify('syncing', '上传中');
    try {
      const pushed = await doPush(opts);
      if (pushed === false) {
        notify('error', '本地暂无数据，未上传（云端数据受保护）');
        return { ok: false, reason: '本地无数据' };
      }
      notify('online', '已同步 ☁️');
      return { ok: true };
    } catch (e) {
      if (e.status === 404 || (e.body && e.body.code === 'PGRST205')) {
        notify('error', '云端数据表未建好');
        return { ok: false, needSetup: true, error: e };
      }
      notify('error', e.message || '上传失败');
      return { ok: false, error: e };
    } finally { syncing = false; }
  };

  /** 登录后的初始化：先拉云端；本地有真实数据且云端空则上传 */
  S.start = async function () {
    if (!S.isLoggedIn()) { notify('offline', '未登录'); return; }
    const r = await S.pull({ force: true });
    if (r.ok && r.empty) {
      if (hasRealData(Store.load())) await S.push(true);
    }
    booting = false;
  };

  /** 从保险箱找回：先恢复到本地，再主动推送云端（供 UI 调用） */
  S.rescueVault = async function () {
    if (!Store.restoreVault()) return { ok: false, reason: '保险箱为空' };
    if (typeof App !== 'undefined' && App.refresh) App.refresh();
    if (S.isLoggedIn()) await S.push(true);
    return { ok: true };
  };

  /** 只读取云端状态，不覆盖本地（供抢救中心判断云端是否还有数据） */
  S.inspectCloud = async function () {
    if (!S.isLoggedIn()) return { ok: false, reason: '未登录' };
    try {
      await ensureToken();
      const rows = await fetchJSON(URL + '/rest/v1/workspace_data?select=data,updated_at&user_id=eq.' + encodeURIComponent(auth.userId), { headers: headers() });
      if (!Array.isArray(rows) || rows.length === 0) return { ok: true, empty: true };
      const d = rows[0].data;
      const days = (d && d.days) || {};
      let todos = 0;
      Object.keys(days).forEach(k => { todos += ((days[k] || {}).todo || []).length; });
      return {
        ok: true, empty: false,
        real: hasRealData(d),
        days: Object.keys(days).length,
        todos,
        updatedAt: d && d.__updatedAt || 0,
        rowUpdatedAt: rows[0].updated_at
      };
    } catch (e) { return { ok: false, error: e }; }
  };

  document.addEventListener('visibilitychange', () => {
    if (!S.isLoggedIn()) return;
    if (document.hidden) {
      if (meta.dirty) S.push(true);
    } else {
      S.pull();
    }
  });
  setInterval(() => {
    if (S.isLoggedIn() && !document.hidden && !syncing) S.pull();
  }, 12000);
  window.addEventListener('beforeunload', () => {
    if (S.isLoggedIn() && meta.dirty) {
      try { S.push(true); } catch (e) {}
    }
  });
  window.addEventListener('online', () => { if (S.isLoggedIn()) S.pull(); });

  global.Sync = S;
})(window);
