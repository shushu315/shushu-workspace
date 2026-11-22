/* 应用主控：导航、共享工具、考试日程同步、PWA 安装 */
(function (global) {
  const App = {};
  const VIEWS = [
    { key: 'home',     label: '首页' },
    { key: 'todo',     label: '今日待办' },
    { key: 'schedule', label: '日程计划' },
    { key: 'health',   label: '健康生活' },
    { key: 'english',  label: '英语学习' },
    { key: 'diary',    label: '树洞小记' }
  ];
  const MODULES = {};
  let current = 'home';

  App.escape = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  App.toast = function (msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(App._tt);
    App._tt = setTimeout(() => t.classList.remove('show'), 2200);
  };

  App.quoteHTML = function (dateStr) {
    const q = Data.quoteOf(dateStr);
    return `<div class="hero-quote">
      <div class="cn">${App.escape(q.cn)}<span class="em">${q.em}</span></div>
      <div class="en">${App.escape(q.en)}</div>
    </div>`;
  };

  App.nodesHTML = function (dateStr) {
    const { holiday, ecom } = Data.nodesOf(dateStr);
    let out = '';
    if (holiday) out += `<span class="chip holiday">🎀 ${App.escape(holiday)}</span>`;
    if (ecom) out += `<span class="chip ecom">🛒 ${App.escape(ecom)}</span>`;
    return out;
  };

  /** 某天计划（含自动生成的周测/月测） */
  App.plansFor = function (dateStr) {
    return Store.schedule(dateStr).slice();
  };

  /** 确保某月的周测（每周日）与月测（月末）写入日程 */
  App.ensureExamPlans = function (year, month) {
    const { weekly, monthly } = Data.testDatesInMonth(year, month);
    const all = [...weekly.map(d => ({ d, title: '英语周测 · 30 分钟', id: 'wk-' + d })),
                 { d: monthly, title: '英语月测 · 30 分钟', id: 'mo-' + monthly }];
    let changed = false;
    all.forEach(({ d, title, id }) => {
      const list = Store.schedule(d);
      if (!list.some(p => p.id === id)) {
        list.push({ id, text: title, color: 'exam', done: false, source: 'exam' });
        Store.setSchedule(d, list);
        changed = true;
      }
    });
    if (changed) Store.save();
  };

  App.modal = function (html) {
    const root = document.getElementById('modalRoot');
    root.innerHTML = `<div class="modal-mask" id="modalMask"><div class="modal">${html}</div></div>`;
    document.getElementById('modalMask').addEventListener('click', (e) => {
      if (e.target.id === 'modalMask') App.closeModal();
    });
  };
  App.closeModal = function () { document.getElementById('modalRoot').innerHTML = ''; };

  App.go = function (key) {
    if (!VIEWS.some(v => v.key === key)) key = 'home';
    current = key;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById('view-' + key);
    if (el) el.classList.add('active');
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.key === key));
    document.getElementById('viewContainer').scrollTop = 0;
    App.refresh();
    location.hash = key;
  };

  App.refresh = function () {
    if (MODULES[current] && MODULES[current].render) MODULES[current].render();
    App.renderTopbar();
  };

  App.renderTopbar = function () {
    const now = new Date();
    const h = now.getHours();
    let greet = '夜深了';
    if (h >= 5 && h < 11) greet = '早上好';
    else if (h >= 11 && h < 13) greet = '中午好';
    else if (h >= 13 && h < 18) greet = '下午好';
    else if (h >= 18 && h < 21) greet = '傍晚好';
    else if (h >= 21) greet = '晚上好';
    const today = Store.todayISO();
    const nodes = Data.nodesText(today);
    document.getElementById('greeting').innerHTML = `${greet}，树树 <small id="greetSub">${nodes ? App.escape(nodes) : '按自己的节奏，稳稳向前 🌿'}</small>`;
    document.getElementById('dateChip').innerHTML = `${now.getMonth() + 1} 月 ${now.getDate()} 日 · ${Data.weekdayCN(today)}${nodes ? ` · <b>${App.escape(nodes)}</b>` : ''}`;
  };

  App.register = function (key, mod) { MODULES[key] = mod; };

  /* ---------- 三端同步 ---------- */
  App.renderSyncChip = function (state, msg) {
    const chip = document.getElementById('syncChip');
    if (!chip) return;
    const map = {
      online:   { cls: 'ok',   text: '已同步' },
      syncing:  { cls: 'busy', text: '同步中' },
      pending:  { cls: 'warn', text: '待同步' },
      offline:  { cls: 'off',  text: '本地' },
      error:    { cls: 'err',  text: '同步异常' }
    };
    const m = map[state] || map.offline;
    chip.className = 'sync-chip ' + m.cls;
    chip.querySelector('.sync-text').textContent = m.text;
    chip.title = msg || m.text;
  };

  App.initSyncUI = function () {
    if (typeof Sync === 'undefined') return;
    Sync.onStatus((state, msg) => App.renderSyncChip(state, msg));
    App.renderSyncChip(Sync.isLoggedIn() ? 'online' : 'offline');

    const screen = document.getElementById('loginScreen');
    const form = document.getElementById('loginForm');
    const err = document.getElementById('authErr');
    const submit = document.getElementById('authSubmit');
    let mode = 'login';

    // 未登录显示遮罩，已登录直接进入
    if (!Sync.isLoggedIn()) screen.classList.add('show');
    else { screen.classList.remove('show'); Sync.start(); }

    document.querySelectorAll('.login-tab').forEach(t => t.onclick = () => {
      mode = t.dataset.tab;
      document.querySelectorAll('.login-tab').forEach(x => x.classList.toggle('active', x === t));
      submit.textContent = mode === 'login' ? '登录并同步' : '注册并同步';
      document.getElementById('authPass').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
      err.textContent = '';
    });

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('authEmail').value;
      const pass = document.getElementById('authPass').value;
      err.textContent = '';
      submit.disabled = true; submit.textContent = '请稍候…';
      try {
        if (mode === 'signup') {
          const r = await Sync.signup(email, pass);
          if (r.needVerify) {
            err.textContent = '注册成功！请先去邮箱点验证链接，再回来登录。';
            submit.disabled = false; submit.textContent = '注册并同步';
            return;
          }
        } else {
          await Sync.login(email, pass);
        }
        screen.classList.remove('show');
        App.renderSyncChip('syncing', '正在连接云端');
        await Sync.start();
        App.toast('已连接云端，三端数据同步中 ☁️');
        App.refresh();
      } catch (ex) {
        err.textContent = (ex && ex.message) ? ex.message : '操作失败，请重试';
      } finally {
        submit.disabled = false;
        submit.textContent = mode === 'login' ? '登录并同步' : '注册并同步';
      }
    };
  };

  App.settingsModal = function () {
    const p = Store.all().profile;
    const logged = (typeof Sync !== 'undefined') && Sync.isLoggedIn();
    App.modal(`
      <h3>⚙️ 数据与个人设置</h3>
      <p class="tiny muted">数据自动保留最近 2 年，登录同一账号可在手机 / iPad / 电脑间同步。</p>
      <div class="card" style="box-shadow:none;margin-top:12px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>☁️ 三端云同步</div>
        ${logged ? `
          <div class="row" style="justify-content:space-between">
            <span class="tiny muted">当前账号：${App.escape(Sync.email())}</span>
            <span class="chip ok">已登录</span>
          </div>
          <div class="row wrap" style="margin-top:10px">
            <button class="btn ghost sm" id="syncNowBtn">立即同步</button>
            <button class="btn ghost sm" id="pushNowBtn">上传本机</button>
            <button class="btn ghost sm" id="pullNowBtn">下载云端</button>
            <button class="btn sm" style="background:#F8D4D2;margin-left:auto" id="logoutBtn">退出登录</button>
          </div>`
        : `<div class="row" style="justify-content:space-between">
            <span class="tiny muted">未登录 · 当前仅保存在本机</span>
            <button class="btn primary sm" id="goLoginBtn">登录同步</button>
          </div>`}
      </div>
      <div class="card" style="box-shadow:none;margin-top:12px">
        <div class="card-title"><span class="dot"></span>经期周期</div>
        <div class="health-input-grid"><span class="tiny">上次开始</span><input class="input" type="date" id="setPeriod" value="${p.lastPeriodStart}"></div>
        <div class="health-input-grid"><span class="tiny">周期天数</span><input class="input" type="number" id="setCycle" min="18" max="60" value="${p.cycleLength}"></div>
        <div class="health-input-grid"><span class="tiny">持续天数</span><input class="input" type="number" id="setLen" min="2" max="12" value="${p.periodLength}"></div>
      </div>
      <div class="row wrap" style="margin-top:16px">
        <button class="btn ghost sm" id="exportBtn">导出备份</button>
        <button class="btn ghost sm" id="importBtn">导入备份</button>
        <button class="btn sm" style="background:#F8D4D2" id="clearBtn">清空数据</button>
        <input type="file" id="importFile" accept="application/json" style="display:none">
      </div>
      <div class="row" style="margin-top:18px;justify-content:flex-end">
        <button class="btn ghost" onclick="App.closeModal()">取消</button>
        <button class="btn primary" id="saveSettings">保存</button>
      </div>
    `);
    document.getElementById('saveSettings').onclick = () => {
      Store.setProfile({
        lastPeriodStart: document.getElementById('setPeriod').value || p.lastPeriodStart,
        cycleLength: Number(document.getElementById('setCycle').value) || 28,
        periodLength: Number(document.getElementById('setLen').value) || 5
      });
      App.closeModal(); App.toast('已保存 ✅'); App.refresh();
    };
    document.getElementById('exportBtn').onclick = () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `树树工作台备份-${Store.todayISO()}.json`;
      a.click();
      App.toast('备份已下载');
    };
    document.getElementById('importBtn').onclick = () => document.getElementById('importFile').click();
    document.getElementById('importFile').onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { try { Store.importJSON(r.result); App.closeModal(); App.toast('导入成功'); App.refresh(); } catch (err) { App.toast('文件格式有误'); } };
      r.readAsText(f);
    };
    document.getElementById('clearBtn').onclick = () => {
      if (confirm('确定清空全部数据吗？此操作不可恢复，建议先导出备份。')) {
        Store.clearAll(); App.closeModal(); App.toast('已清空'); App.refresh();
      }
    };
    // 云同步管理
    if (document.getElementById('syncNowBtn')) {
      document.getElementById('syncNowBtn').onclick = async () => {
        App.toast('正在同步…'); const r = await Sync.pull({ force: true });
        App.toast(r.ok ? '同步完成 ☁️' : ('同步失败：' + (r.error?.message || '请检查网络')));
      };
      document.getElementById('pushNowBtn').onclick = async () => {
        App.toast('正在上传…'); const r = await Sync.push(false, { allowEmpty: true });
        App.toast(r.ok ? '已上传到云端 ☁️' : '上传失败，请检查网络或云端配置');
      };
      document.getElementById('pullNowBtn').onclick = async () => {
        if (!confirm('下载云端数据会覆盖本机当前数据，确定继续吗？')) return;
        App.toast('正在下载…');
        // 强制拉取：临时清掉 dirty 标记，允许云端覆盖
        const r = await Sync.pull({ force: true, preferRemote: true });
        App.toast(r.ok ? '已下载云端数据 ☁️' : '下载失败，请检查网络');
      };
      document.getElementById('logoutBtn').onclick = () => {
        if (!confirm('退出后本机数据仍保留，但不再同步。确定退出吗？')) return;
        Sync.logout(); App.closeModal(); App.toast('已退出登录');
        document.getElementById('loginScreen').classList.add('show');
        App.renderSyncChip('offline');
      };
    }
    if (document.getElementById('goLoginBtn')) {
      document.getElementById('goLoginBtn').onclick = () => {
        App.closeModal(); document.getElementById('loginScreen').classList.add('show');
      };
    }
  };

  function init() {
    Object.assign(MODULES, global.__MODULES__ || {});
    // 头像（用户提供的卡通小树，已修边高清处理）
    document.getElementById('brandAvatar').innerHTML = '<img src="icons/avatar-tree.png" alt="树树">';
    // 导航（左侧竖排，带分组）
    const NAV_GROUPS = [
      { label: '总览', keys: ['home'] },
      { label: '我的管理', keys: ['todo', 'schedule', 'health', 'english', 'diary'] }
    ];
    document.getElementById('navList').innerHTML = NAV_GROUPS.map(g => `
      <div class="nav-group">
        <div class="nav-group-label">${g.label}</div>
        ${g.keys.map(k => {
          const v = VIEWS.find(x => x.key === k);
          return `<div class="nav-item" data-key="${v.key}"><div class="bear">${Icons.bearIcon(v.key, 46)}</div><div class="nav-label">${v.label}</div></div>`;
        }).join('')}
      </div>`).join('');
    document.querySelectorAll('.nav-item').forEach(n => n.onclick = () => App.go(n.dataset.key));
    document.getElementById('settingsBtn').onclick = App.settingsModal;

    // 考试日程（本月 + 上下月）
    const now = new Date();
    App.ensureExamPlans(now.getFullYear(), now.getMonth() + 1);

    App.renderTopbar();
    const hash = location.hash.replace('#', '');
    App.go(VIEWS.some(v => v.key === hash) ? hash : 'home');

    // PWA —— 应用启动时先彻底清理旧版缓存/SW，再注册带版本号的新 SW
    // 这样即使设备上残留旧 Service Worker，也能强制加载最新功能
    if ('serviceWorker' in navigator) {
      const APP_VER = '14';
      const bootSW = () => {
        // 清理所有旧的 Cache Storage（保留 v9）
        if (window.caches && caches.keys) {
          caches.keys().then(keys => Promise.all(
            keys.filter(k => k.indexOf('shushu-workspace-') === 0 && k !== 'shushu-workspace-v' + APP_VER)
                .map(k => caches.delete(k))
          )).catch(() => {});
        }
        // 卸载所有旧 SW（scriptURL 不是当前版本的）
        navigator.serviceWorker.getRegistrations().then(regs => {
          regs.forEach(r => {
            const script = (r.active && r.active.scriptURL) || (r.installing && r.installing.scriptURL) || '';
            if (script.indexOf('v=' + APP_VER) === -1) r.unregister().catch(() => {});
          });
        }).catch(() => {}).then(() => {
          // 注册带版本号的新 SW，URL 变化 → 浏览器必然当作新脚本安装
          return navigator.serviceWorker.register('sw.js?v=' + APP_VER);
        }).then((reg) => {
          reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
              if (nw.state === 'installed' && navigator.serviceWorker.controller) {
                nw.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });
        }).catch(() => {});
      };
      bootSW();
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }
    // PWA 安装：捕获浏览器原生安装事件，提供一键安装入口（装出来是全屏无地址栏的独立 App）
    App._installDeferred = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      App._installDeferred = e;
      if (App.updateInstallUI) App.updateInstallUI();
    });
    window.addEventListener('appinstalled', () => {
      App._installDeferred = null;
      if (App.updateInstallUI) App.updateInstallUI();
      App.toast('已安装到桌面 🌿 从桌面图标打开即可全屏使用');
    });
    App.canInstall = () => !!App._installDeferred;
    App.installApp = async () => {
      if (App._installDeferred) {
        await App._installDeferred.prompt();
        const choice = await App._installDeferred.userChoice;
        App._installDeferred = null;
        if (App.updateInstallUI) App.updateInstallUI();
        if (choice && choice.outcome === 'accepted') App.toast('正在安装到桌面 🌿');
      } else {
        App.toast('请点浏览器底部/右上角菜单 →「安装应用」或「添加到主屏幕」');
      }
    };
    global.__installPrompt = App.installApp;

    // 三端同步
    App.initSyncUI();
  }

  document.addEventListener('DOMContentLoaded', init);
  global.App = App;
})(window);
