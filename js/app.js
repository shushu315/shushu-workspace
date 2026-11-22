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
      <p class="tiny muted">数据自动保留最近 2 年。登录同一账号后，三端实时自动同步：编辑后自动上传，每 12 秒自动拉取，无需手动操作。</p>
      <div class="card" style="box-shadow:none;margin-top:12px;border:1.5px solid #F0C24B">
        <div class="card-title"><span class="dot" style="background:#F0C24B"></span>🔍 数据丢了？去抢救中心</div>
        <p class="tiny muted">如果数据意外被清空，可扫描本机所有残留快照或从云端找回。</p>
        <button class="btn ghost sm" id="openRescueBtn" style="margin-top:8px">打开数据抢救中心</button>
      </div>
      <div class="card" style="box-shadow:none;margin-top:12px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>☁️ 三端云同步（实时）</div>
        ${logged ? `
          <div class="row" style="justify-content:space-between">
            <span class="tiny muted">当前账号：${App.escape(Sync.email())}</span>
            <span class="chip ok">已登录 · 自动同步中</span>
          </div>
          <div class="tiny muted" style="margin-top:8px">✅ 任何改动会自动上传；其它设备每 12 秒自动获取最新数据。下面按钮仅用于特殊情况下手动处理。</div>
          <div class="row wrap" style="margin-top:10px">
            <button class="btn ghost sm" id="syncNowBtn">手动刷新</button>
            <button class="btn sm" style="background:#F8D4D2;margin-left:auto" id="logoutBtn">退出登录</button>
          </div>`
        : `<div class="row" style="justify-content:space-between">
            <span class="tiny muted">未登录 · 当前仅保存在本机</span>
            <button class="btn primary sm" id="goLoginBtn">登录同步</button>
          </div>`}
      </div>
      ${(function () {
        const v = Store.vault && Store.vault();
        if (!v) return '';
        const vd = v.days || {};
        const cnt = Object.keys(vd).length;
        const todos = Object.values(vd).reduce((s, d) => s + ((d && d.todo) ? d.todo.length : 0), 0);
        return `<div class="card" style="box-shadow:none;margin-top:12px">
          <div class="card-title"><span class="dot" style="background:#F0C24B"></span>🗄️ 数据保险箱</div>
          <p class="tiny muted">每次编辑都会自动留存最新快照（${cnt} 天记录 · ${todos} 条待办）。若数据意外丢失，可在此一键找回并同步云端。</p>
          <button class="btn ghost sm" id="restoreVaultBtn" style="margin-top:8px">从保险箱找回数据</button>
        </div>`;
      }).call(this)}
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
    document.getElementById('openRescueBtn').onclick = () => { App.closeModal(); App.rescueModal(); };
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
    const restoreVaultBtn = document.getElementById('restoreVaultBtn');
    if (restoreVaultBtn) restoreVaultBtn.onclick = async () => {
      if (!confirm('从保险箱找回数据？找回后本机数据将被保险箱快照替换。')) return;
      if (Store.restoreVault()) {
        App.closeModal(); App.toast('已从保险箱找回数据'); App.refresh();
        // 若已登录，找回后立即同步到云端，其它设备可拉取
        if (typeof Sync !== 'undefined' && Sync.isLoggedIn()) {
          try { await Sync.push(true); } catch (e) {}
        }
      } else App.toast('保险箱暂无可用快照');
    };
    // 云同步管理
    if (document.getElementById('syncNowBtn')) {
      document.getElementById('syncNowBtn').onclick = async () => {
        App.toast('正在同步…');
        const r = await Sync.pull({ force: true });
        App.toast(r.ok ? '同步完成 ☁️' : ('同步失败：' + (r.error?.message || '请检查网络')));
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

  /* ---------- 数据抢救中心：事故后扫描本机所有残留数据并恢复 ---------- */
  App.rescueModal = async function () {
    App.modal(`<h3>🔍 数据抢救中心</h3>
      <p class="tiny muted">正在扫描本机残留数据…</p>`);
    const snaps = Store.scanSnapshots ? Store.scanSnapshots() : [];
    const box = document.getElementById('modalRoot').querySelector('.modal');
    const realOnes = snaps.filter(s => s.real && s.key !== 'shushu_workspace_data_v1');
    const current = snaps.find(s => s.key === 'shushu_workspace_data_v1');

    let html = `<h3>🔍 数据抢救中心</h3>
      <p class="tiny muted">先在<b>你平时记录数据的那台设备</b>上打开这里。系统会扫描本机所有残留数据快照。</p>
      <div class="card" style="box-shadow:none;margin-top:10px">
        <div class="card-title"><span class="dot"></span>当前使用中的数据</div>
        <p class="tiny">${current ? `${current.days} 天 · ${current.todos} 条待办 · ${current.diaries} 篇日记` : '空'}</p>
      </div>`;

    if (realOnes.length) {
      html += `<div class="card" style="box-shadow:none;margin-top:10px">
        <div class="card-title"><span class="dot" style="background:#F0C24B"></span>可找回的快照（${realOnes.length}）</div>`;
      realOnes.forEach((s, i) => {
        const label = s.key.includes('vault') ? '数据保险箱' : (s.key.includes('data') ? '历史数据备份' : s.key);
        html += `<div class="row wrap" style="justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #f2e8e4">
          <span class="tiny"><b>${App.escape(label)}</b><br>${s.days} 天 · ${s.todos} 条待办 · ${s.diaries} 篇日记<br><span class="muted">${App.escape(s.range)}</span></span>
          <button class="btn primary sm" data-snap="${i}">恢复这份</button>
        </div>`;
      });
      html += `</div>`;
    } else {
      html += `<div class="card" style="box-shadow:none;margin-top:10px">
        <p class="tiny muted">本机没有找到其它含数据的快照。</p></div>`;
    }

    html += `<div class="card" style="box-shadow:none;margin-top:10px">
      <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>云端数据</div>
      <p class="tiny muted" id="cloudStat">${(typeof Sync !== 'undefined' && Sync.isLoggedIn()) ? '正在检查云端…' : '未登录，无法检查云端'}</p>
      ${(typeof Sync !== 'undefined' && Sync.isLoggedIn()) ? '<button class="btn ghost sm" id="pullCloudBtn" style="display:none">用云端数据覆盖本机</button>' : ''}
    </div>
    <div class="row wrap" style="margin-top:14px;justify-content:space-between">
      <button class="btn ghost sm" id="exportNowBtn">先导出当前数据</button>
      <button class="btn ghost" onclick="App.closeModal()">关闭</button>
    </div>`;
    box.innerHTML = html;

    // 绑定快照恢复
    box.querySelectorAll('[data-snap]').forEach(btn => {
      btn.onclick = () => {
        const s = realOnes[Number(btn.dataset.snap)];
        if (!confirm(`恢复「${s.key}」这份数据？\n当前数据会被存入保险箱备份。`)) return;
        if (Store.restoreSnapshot(s.key)) {
          App.closeModal(); App.toast('数据已恢复 🌿'); App.refresh();
          if (typeof Sync !== 'undefined' && Sync.isLoggedIn()) {
            App.modal(`<p class="tiny">数据已恢复到本机。是否立即同步到云端？</p>
              <div class="row wrap" style="margin-top:10px;justify-content:flex-end">
                <button class="btn ghost sm" onclick="App.closeModal()">稍后</button>
                <button class="btn primary sm" id="doPushAfterRescue">立即同步</button>
              </div>`);
            document.getElementById('doPushAfterRescue').onclick = async () => {
              await Sync.push(true); App.closeModal(); App.toast('已同步到云端 ☁️');
            };
          }
        } else App.toast('恢复失败');
      };
    });
    // 导出当前
    const ex = document.getElementById('exportNowBtn');
    if (ex) ex.onclick = () => {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `树树工作台备份-${Store.todayISO()}.json`;
      a.click();
      App.toast('已导出');
    };
    // 检查云端
    if (typeof Sync !== 'undefined' && Sync.isLoggedIn()) {
      try {
        const c = await Sync.inspectCloud();
        const stat = document.getElementById('cloudStat');
        const pullBtn = document.getElementById('pullCloudBtn');
        if (!stat) return;
        if (c.ok && !c.empty && c.real) {
          stat.innerHTML = `<b style="color:var(--green,#4a9)">云端有数据：</b>${c.days} 天 · ${c.todos} 条待办`;
          if (pullBtn) {
            pullBtn.style.display = 'inline-block';
            pullBtn.onclick = async () => {
              if (!confirm('用云端数据覆盖本机？当前数据会先存入保险箱。')) return;
              const r = await Sync.pull({ force: true, preferRemote: true });
              App.closeModal(); App.toast(r.ok ? '已用云端数据恢复 ☁️' : '拉取失败'); App.refresh();
            };
          }
        } else if (c.ok && c.empty) {
          stat.textContent = '云端暂无数据';
        } else if (c.ok && !c.empty && !c.real) {
          stat.textContent = '云端目前是空数据（可能已被覆盖）';
        } else {
          stat.textContent = '云端检查失败：' + ((c.error && c.error.message) || '网络异常');
        }
      } catch (e) {}
    }
  };

  /* 手机软键盘弹出时不遮挡输入框：滚动到可视区中央 */
  function initKeyboardFix() {
    // 聚焦输入框/文本域时，延迟滚动确保键盘已弹出
    document.addEventListener('focusin', (e) => {
      const el = e.target;
      if (!el || !/^(INPUT|TEXTAREA)$/.test(el.tagName)) return;
      // 给键盘弹出留出时间
      setTimeout(() => {
        try {
          const box = el.getBoundingClientRect();
          const vv = window.visualViewport;
          const viewH = vv ? vv.height : window.innerHeight;
          // 若输入框底部超出可视区，滚动使其居中偏上
          if (box.bottom > viewH - 20) {
            const targetTop = Math.max(0, window.scrollY + box.top - viewH * 0.42);
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
            // viewContainer 是可滚动容器，也处理它
            const vc = document.getElementById('viewContainer');
            if (vc) {
              const vcBox = vc.getBoundingClientRect();
              if (box.bottom > vcBox.bottom - 20) {
                vc.scrollTo({ top: vc.scrollTop + (box.bottom - vcBox.bottom) + 80, behavior: 'smooth' });
              }
            }
          }
        } catch (err) {}
      }, 260);
    });
    // visualViewport 变化时再兜底一次
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => {
        const ae = document.activeElement;
        if (ae && /^(INPUT|TEXTAREA)$/.test(ae.tagName)) {
          setTimeout(() => ae.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
        }
      });
    }
  }

  /** 开机自检：本地若为空壳、但保险箱/云端有真实数据，自动提示找回，防事故后无痛丢数据 */
  function checkDataRescue() {
    try {
      const empty = !Store.hasContent(Store.load());
      const snaps = Store.scanSnapshots ? Store.scanSnapshots().filter(s => s.real && s.key !== 'shushu_workspace_data_v1') : [];
      if (empty && snaps.length) {
        setTimeout(() => {
          App.modal(`
            <h3>🗄️ 发现可找回的数据</h3>
            <p class="tiny muted">检测到本机当前没有记录，但找到了 ${snaps.length} 份之前的数据快照。要打开抢救中心找回吗？</p>
            <div class="row wrap" style="margin-top:14px;justify-content:flex-end">
              <button class="btn ghost" id="rescueLater">暂时不要</button>
              <button class="btn primary" id="rescueNow">去找回</button>
            </div>`);
            document.getElementById('rescueLater').onclick = () => App.closeModal();
            document.getElementById('rescueNow').onclick = () => App.rescueModal();
          }, 1000);
        }
    } catch (e) {}
  }

  function init() {
    Object.assign(MODULES, global.__MODULES__ || {});
    initKeyboardFix();
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
      const APP_VER = '21';
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
    // 单词卡全局点击委托
    if (global.WordCard && WordCard.init) WordCard.init();
    // 智能总结：请求通知权限 + 定时检查（周六/月末 21:00 推送）
    if (global.Summary && Summary.init) Summary.init();
    // 数据救援自检：空壳但有保险箱快照时自动提示找回
    checkDataRescue();
  }

  document.addEventListener('DOMContentLoaded', init);
  global.App = App;
})(window);
