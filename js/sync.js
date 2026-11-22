/* 同步引擎：Supabase Auth + REST，纯 fetch，无外部依赖
 * 本地 localStorage 仍是主存储（离线可用），Supabase 作为三端同步中枢。
 * 合并策略：按整体 updatedAt 取较新者；本地未同步的变更会排队，恢复后推送。
 */
(function (global) {
  const URL = 'https://aehpykzahalcgifzpccz.supabase.co';
  const KEY = 'sb_publishable_vxWsNXAlJqGzpjKTqmETvg_E912WQjA';
  const AUTH_KEY = 'shushu_auth_v1';        // {accessToken, refreshToken, userId, email, expiresAt}
  const SYNC_META = 'shushu_sync_meta_v1';  // {lastPushAt, lastPullAt, dirty}

  let auth = null;
  try { auth = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch (e) { auth = null; }
  let meta = null;
  try { meta = JSON.parse(localStorage.getItem(SYNC_META) || 'null'); } catch (e) { meta = null; }
  if (!meta) meta = { dirty: false, lastPushAt: 0, lastPullAt: 0 };

  let syncing = false;
  let pushTimer = null;
  let listeners = [];
  let booting = true; // 启动宽限期：首次 Sync.start() 完成前，抑制自动推送，防止空壳覆盖云端
  setTimeout(() => { booting = false; }, 8000); // 兜底：8秒后强制解除，避免卡死

  const S = {};
  S.URL = URL;
  S.READY = false; // 表是否已建好（通过首次 pull 判断）

  function saveAuth() { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }
  function saveMeta() { localStorage.setItem(SYNC_META, JSON.stringify(meta)); }
  function notify(state, msg) { listeners.forEach(fn => { try { fn(state, msg); } catch (e) {} }); }
  S.onStatus = function (fn) { listeners.push(fn); };

  /** 判断本地是否含真实用户数据（区别于新设备初始化产生的空壳） */
  function hasRealData(d) {
    if (!d) return false;
    const days = d.days || {};
    for (const k of Object.keys(days)) {
      const day = days[k];
      if (!day) continue;
      if ((day.todo && day.todo.length) || day.water || day.sleep || day.exerciseCheck ||
          (day.diary && typeof day.diary === 'object' && Object.keys(day.diary).length) ||
          (day.resistance && day.resistance.min) || (day.aerobic && day.aerobic.min) ||
          (day.supplements && day.supplements.length) || day.englishMin) return true;
    }
    const sched = d.schedule || {};
    for (const k of Object.keys(sched)) {
      // 排除自动生成的周测/月测，只认用户自己加的计划
      if ((sched[k] || []).some(p => p.source !== 'exam')) return true;
    }
    const eng = d.english || {};
    if ((eng.completed && eng.completed.length) || (eng.quizResults && eng.quizResults.length) ||
        (eng.wordBook && eng.wordBook.length) || eng.currentDay > 1) return true;
    if (d.profile && d.profile.lastPeriodStart && d.profile.lastPeriodStart !== todayOffsetDefault()) return true;
    return false;
  }
  function todayOffsetDefault() {
    const d = new Date(); d.setDate(d.getDate() - 16);
    const p = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
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

  /** 判断登录态 */
  S.isLoggedIn = function () { return !!(auth && auth.accessToken); };
  S.email = function () { return auth ? auth.email : ''; };

  /** 确保 access_token 有效（过期则刷新） */
  async function ensureToken() {
    if (!auth || !auth.accessToken) throw new Error('未登录');
    const now = Date.now();
    if (auth.expiresAt && now < auth.expiresAt - 60000) return; // 还有 1 分钟以上
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

  /** 邮箱密码登录 */
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

  /** 注册新用户 */
  S.signup = async function (email, password) {
    const data = await fetchJSON(URL + '/auth/v1/signup', {
      method: 'POST', headers: headers(false),
      body: JSON.stringify({ email: email.trim(), password })
    });
    // 若开启了邮箱验证，data.user 存在但 session 为空
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

  /** 标记本地有变更，防抖推送 */
  S.markDirty = function () {
    if (!S.isLoggedIn()) return;
    // 启动初始化阶段不排队推送，避免空壳覆盖云端
    if (booting) { return; }
    meta.dirty = true; saveMeta();
    notify('pending', '待同步');
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => S.push(true), 1500);
  };

  /** 从云端拉取数据 */
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
      const remoteTs = remote && remote.__updatedAt ? remote.__updatedAt : 0;
      const local = Store.load();
      const localTs = local.__updatedAt || 0;
      const localHasData = hasRealData(local);
      const remoteHasData = hasRealData(remote);

      // 强制下载：云端覆盖本地（用户手动确认后）
      if (opts.preferRemote) {
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已下载云端数据');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // ===== v15 合并策略：空壳永远不能覆盖有数据的一方 =====
      // 只要一端有真实数据、另一端是空壳，就以「有数据」的一端为准，与时间戳无关。
      // 时间戳只在「两端都有真实数据」时才作为裁决依据。

      // 场景1 用户手动强制下载：云端覆盖本地（明确的用户意图）
      if (opts.preferRemote) {
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已下载云端数据');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // 场景2 本地空壳、云端有真实数据 → 拉取云端
      if (!localHasData && remoteHasData) {
        Store.importJSON(remote);
        meta.dirty = false; meta.lastPullAt = Date.now(); saveMeta();
        notify('online', '已拉取云端数据');
        if (typeof App !== 'undefined' && App.refresh) App.refresh();
        return { ok: true, pulled: true };
      }

      // 场景3 本地有真实数据、云端是空壳 → 上传本地（关键修复：不再用空云端覆盖本地）
      if (localHasData && !remoteHasData) {
        notify('syncing', '正在上传本地变更');
        await doPush();
        notify('online', '已同步');
        return { ok: true, pushed: true };
      }

      // 场景4 两端都有真实数据 → 时间戳新的一方胜
      if (localHasData && remoteHasData) {
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

      // 场景5 两端都是空壳 → 无需操作
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
    // 这是造成 11-22 数据事故的根源，永久封死。
    if (!hasRealData(data)) {
      notify('online', '本地无数据，已阻止上传以保护云端');
      return false;
    }
    data.__updatedAt = Date.now();
    const payload = { user_id: auth.userId, data: data, updated_at: new Date().toISOString() };
    // upsert：冲突时按主键更新
    await fetchJSON(URL + '/rest/v1/workspace_data?on_conflict=user_id', {
      method: 'POST',
      headers: Object.assign(headers(), { 'Prefer': 'resolution=merge-duplicates,return=minimal' }),
      body: JSON.stringify([payload])
    });
    meta.dirty = false; meta.lastPushAt = Date.now(); saveMeta();
  }

  /** 推送本地数据到云端 */
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

  /** 登录后的初始化：先拉云端，若本地有数据且云端为空则上传 */
  S.start = async function () {
    if (!S.isLoggedIn()) { notify('offline', '未登录'); return; }
    const r = await S.pull({ force: true });
    if (r.ok && r.empty) {
      // 云端为空：仅当本地有真实数据时才作为初始版本上传
      if (hasRealData(Store.load())) await S.push(true);
    }
    booting = false; // 首次同步完成，解除推送抑制
  };

  // 页面切到后台/关闭前推送，回到前台拉取
  document.addEventListener('visibilitychange', () => {
    if (!S.isLoggedIn()) return;
    if (document.hidden) {
      if (meta.dirty) S.push(true);
    } else {
      S.pull();
    }
  });
  window.addEventListener('beforeunload', () => {
    if (S.isLoggedIn() && meta.dirty) {
      // 尽力推送（不保证完成）
      try { S.push(true); } catch (e) {}
    }
  });
  // 网络恢复自动同步
  window.addEventListener('online', () => { if (S.isLoggedIn()) S.pull(); });

  global.Sync = S;
})(window);
