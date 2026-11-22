/* 首页：汇总所有板块核心数据 + 每日待办 + 周月智能总结 */
(function (global) {
  const mod = {};

  function statCard(icon, val, unit, label, sub, go) {
    return `<div class="card stat-card stat-clickable"${go ? ` data-go="${go}"` : ''} role="button" tabindex="0">
      <div class="ico">${icon}</div>
      <div class="val">${val}<small>${unit || ''}</small></div>
      <div class="lbl">${label}</div>
      ${sub ? `<div class="sub">${sub}</div>` : ''}
      <div class="go-hint">进入 →</div>
    </div>`;
  }

  mod.render = function () {
    const date = Store.todayISO();
    const d = Store.day(date);
    const p = Store.all().profile;
    const pi = Data.periodInfo(p, date);
    const plans = App.plansFor(date);
    const todos = d.todo || [];
    const done = todos.filter(t => t.done).length;
    const waterMl = (d.water || 0) * 500;
    const nodes = Data.nodesOf(date);
    const todayMin = Store.english().studyLog ? (Store.english().studyLog[date] || 0) : 0;
    const engMin = Math.round(todayMin / 60);
    const supCount = (d.supplements || []).length;

    const cups = Array.from({ length: 8 }, (_, i) =>
      `<span class="cup" data-cup="${i + 1}" title="点击记录饮水">${Icons.waterCup(i < (d.water || 0), 24)}</span>`
    ).join('');

    const summaries = (typeof Summary !== 'undefined') ? Summary.all() : [];
    const latestWeek = summaries.find(s => s.kind === 'weekly');
    const latestMonth = summaries.find(s => s.kind === 'monthly');

    document.getElementById('view-home').innerHTML = `
      <div class="section-head">
        <h2>🏡 树树的主页</h2>
        <span class="sub">${date} · ${Data.weekdayCN(date)} ${nodes.holiday || nodes.ecom ? '· ' + App.escape((nodes.holiday ? nodes.holiday + ' ' : '') + (nodes.ecom || '')) : ''}</span>
      </div>

      ${App.quoteHTML(date)}

      <div class="grid grid-4" style="margin-top:16px">
        ${statCard('📝', `${done}/${todos.length}`, '', '今日待办', done === todos.length && todos.length ? '全部完成 🎉' : '点开清单去看看', 'todo')}
        ${statCard('🕒', engMin, '分钟', '今日英语', '真实学习时长 · 点开学习', 'english')}
        ${statCard('😴', d.sleep || '—', d.sleep ? '小时' : '', '昨日睡眠', '目标 5 小时以上', 'health')}
        ${statCard('🌸', pi.daysUntil, '天', '距经期', pi.isPeriod ? '经期进行中，注意休息' : `预计 ${pi.nextStart}`, 'health')}
      </div>

      <!-- 每日待办：放在看板卡片下面一栏 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title">
          <span class="dot" style="background:var(--pink-500)"></span>每日待办
          <span class="tiny muted" style="font-weight:400">· ${done}/${todos.length} 完成</span>
          <button class="btn mini ghost" id="goTodoFull" style="margin-left:auto">查看全部 →</button>
        </div>
        ${todos.length ? `<ul class="today-list">${todos.slice(0, 10).map(t => `
          <li class="home-todo-row"><span class="home-todo-check ${t.done ? 'checked' : ''}" data-todo="${t.id}" role="button" tabindex="0" title="点击标记完成">${t.done ? '✓' : ''}</span><span class="${t.done ? 'muted' : ''}" style="${t.done ? 'text-decoration:line-through' : ''}">${App.escape(t.text)}</span></li>
        `).join('')}</ul>${todos.length > 10 ? `<div class="tiny muted" style="margin-top:8px">还有 ${todos.length - 10} 项，点「查看全部」</div>` : ''}` : `<div class="empty">清单空空，去「今日待办」记下要做的事吧 ✨</div>`}
        <div class="todo-input-row" style="margin-top:10px">
          <input class="input" id="homeTodoInput" placeholder="快速添加待办，回车确认…" maxlength="120">
          <button class="btn primary sm" id="homeTodoAdd">添加</button>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="card home-jump" data-go="health" role="button" tabindex="0">
          <div class="card-title"><span class="dot"></span>今日健康打卡 <span class="jump-hint">进入 →</span></div>
          <div class="grid grid-2" style="gap:14px">
            <div>
              <div class="tiny muted" style="margin-bottom:8px">轻量化抗阻运动</div>
              <button class="checkin-btn ${d.exerciseCheck ? 'done' : ''}" id="homeCheckin">${d.exerciseCheck ? '✓ 今日已打卡' : '点击打卡运动'}</button>
            </div>
            <div>
              <div class="tiny muted" style="margin-bottom:8px">今日饮水</div>
              <div class="cups">${cups}</div>
              <div class="water-tiny tiny muted" style="text-align:center;margin-top:6px">${waterMl} ml / 4000 ml</div>
            </div>
          </div>
        </div>

        <div class="card home-jump" data-go="schedule" role="button" tabindex="0">
          <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>今日计划（同步日程） <span class="jump-hint">进入 →</span></div>
          ${plans.length ? `<ul class="today-list">${plans.slice(0, 6).map(pl => `
            <li><span class="tag" style="background:${pl.color === 'exam' ? 'var(--lavender)' : 'var(--blue)'};color:${pl.color === 'exam' ? '#7C6597' : '#4E7A8C'}">${pl.color === 'exam' ? '考试' : '计划'}</span><span>${App.escape(pl.text)}</span></li>
          `).join('')}</ul>` : `<div class="empty">今天还没有安排计划，去「日程计划」添加吧 🌿</div>`}
          ${(nodes.holiday || nodes.ecom) ? `<div class="row wrap" style="margin-top:10px">${App.nodesHTML(date)}</div>` : ''}
        </div>
      </div>

      <!-- 本周 / 本月总结 -->
      <div class="section-head" style="margin-top:22px">
        <h2>📊 成长复盘</h2>
        <span class="sub">基于你的全部数据自动生成 · 每周六、每月底 21:00 推送</span>
      </div>
      <div class="grid grid-2" style="margin-top:10px">
        <div class="card summary-jump ${latestWeek ? '' : 'summary-empty'}" id="weekCard" role="button" tabindex="0">
          <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>本周总结 <span class="jump-hint">${latestWeek ? '查看 →' : '未生成'}</span></div>
          ${latestWeek ? `<div class="tiny">完成 ${latestWeek.stats.todosDone} 项 · 英语 ${latestWeek.stats.engMin} 分 · 新词 ${latestWeek.stats.newWords} 个</div>
            <div class="tiny muted" style="margin-top:6px">${App.escape(latestWeek.range)}</div>`
            : `<div class="tiny muted">每周六 21:00 自动生成，或点这里立即生成</div>`}
        </div>
        <div class="card summary-jump ${latestMonth ? '' : 'summary-empty'}" id="monthCard" role="button" tabindex="0">
          <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>本月总结 <span class="jump-hint">${latestMonth ? '查看 →' : '未生成'}</span></div>
          ${latestMonth ? `<div class="tiny">完成率 ${latestMonth.stats.todoRate}% · 新词 ${latestMonth.stats.newWords} 个 · 运动 ${latestMonth.stats.exerciseDays} 天</div>
            <div class="tiny muted" style="margin-top:6px">${App.escape(latestMonth.range)}</div>`
            : `<div class="tiny muted">每月底 21:00 自动生成，或点这里立即生成</div>`}
        </div>
      </div>
    `;

    // 四宫格跳转
    document.querySelectorAll('#view-home .stat-clickable[data-go]').forEach(c => {
      const go = () => App.go(c.dataset.go);
      c.addEventListener('click', go);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

    document.getElementById('goTodoFull').onclick = () => App.go('todo');
    document.getElementById('homeCheckin').onclick = () => {
      Store.updateDay(date, { exerciseCheck: !d.exerciseCheck });
      App.toast(d.exerciseCheck ? '已取消打卡' : '运动打卡成功 💪');
      mod.render();
    };
    document.querySelectorAll('#view-home .cup').forEach(c => {
      c.onclick = () => {
        const n = Number(c.dataset.cup);
        const cur = Store.day(date).water || 0;
        Store.updateDay(date, { water: cur === n ? n - 1 : n });
        mod.render();
      };
    });

    // 健康/计划卡片跳转
    document.querySelectorAll('#view-home .home-jump').forEach(card => {
      const go = () => App.go(card.dataset.go);
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, .cup, input, [data-cup]')) return;
        go();
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });

    // 待办对勾
    document.querySelectorAll('#view-home .home-todo-check').forEach(el => {
      const toggle = (e) => {
        if (e) e.stopPropagation();
        const id = el.dataset.todo;
        const list = Store.day(date).todo || [];
        const t = list.find(x => x.id === id);
        if (t) { t.done = !t.done; Store.updateDay(date, { todo: list }); mod.render(); }
      };
      el.onclick = toggle;
      el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } };
    });

    // 首页快速添加待办
    function quickAdd() {
      const inp = document.getElementById('homeTodoInput');
      const v = inp.value.trim(); if (!v) return;
      const list = Store.day(date).todo || [];
      list.push({ id: 't' + Date.now() + Math.random().toString(36).slice(2, 6), text: v, done: false });
      Store.updateDay(date, { todo: list });
      App.toast('已添加待办 ✅'); mod.render();
      document.getElementById('homeTodoInput')?.focus();
    }
    document.getElementById('homeTodoAdd').onclick = quickAdd;
    document.getElementById('homeTodoInput').onkeydown = (e) => { if (e.key === 'Enter') quickAdd(); };

    // 总结卡片：查看/生成
    function openSummary(kind) {
      let list = (typeof Summary !== 'undefined') ? Summary.all().filter(s => s.kind === kind) : [];
      if (!list.length && typeof Summary !== 'undefined') {
        const r = Summary.generate(kind);
        App.toast('已生成总结 📊');
        mod.render();
        list = [r];
      }
      if (!list.length) { App.toast('总结功能暂不可用'); return; }
      App.modal(`<h3>📊 ${kind === 'weekly' ? '本周' : '本月'}总结</h3>
        <div style="max-height:66vh;overflow-y:auto">${Summary.toHTML(list[0])}</div>
        <div class="row" style="margin-top:14px;justify-content:flex-end">
          <button class="btn ghost" onclick="App.closeModal()">关闭</button>
          <button class="btn primary" id="regenSummary">重新生成</button>
        </div>`);
      document.getElementById('regenSummary').onclick = () => {
        const r = Summary.generate(kind);
        App.closeModal(); mod.render();
        App.toast('已重新生成 📊');
      };
    }
    document.getElementById('weekCard').onclick = () => openSummary('weekly');
    document.getElementById('monthCard').onclick = () => openSummary('monthly');
  };

  global.Home = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['home'] = mod;
})(window);
