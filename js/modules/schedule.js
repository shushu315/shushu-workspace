/* 日程计划：日历 + 日/周/月看板 + 三色标注 + 经期同步 */
(function (global) {
  const mod = {};
  let viewYear, viewMonth, selected;

  function initState() {
    const now = new Date();
    if (!viewYear) { viewYear = now.getFullYear(); viewMonth = now.getMonth() + 1; selected = Store.todayISO(); }
  }

  function periodInfo() { return Data.periodInfo(Store.all().profile, Store.todayISO()); }

  function renderCalendar() {
    const first = new Date(viewYear, viewMonth - 1, 1);
    const startDow = (first.getDay() + 6) % 7; // 周一为 0
    const start = new Date(viewYear, viewMonth - 1, 1 - startDow);
    const pi = periodInfo();
    const today = Store.todayISO();

    let html = `<div class="cal-head">
      <button class="icon-btn" id="calPrev">‹</button>
      <div class="title">${viewYear} 年 ${viewMonth} 月</div>
      <div class="cal-nav">
        <button class="btn ghost sm" id="calToday">今天</button>
        <button class="icon-btn" id="calNext">›</button>
      </div>
    </div>
    <div class="cal-grid">`;
    ['一', '二', '三', '四', '五', '六', '日'].forEach(d => html += `<div class="cal-dow">${d}</div>`);

    for (let i = 0; i < 42; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const s = Data.toISO(d);
      const other = d.getMonth() + 1 !== viewMonth;
      const nodes = Data.nodesOf(s);
      const plans = Store.schedule(s);
      const isPeriod = !!pi.periodDates[s];
      const marks = [];
      if (nodes.holiday) marks.push('<i class="dot-mark dot-holiday"></i>');
      if (nodes.ecom) marks.push('<i class="dot-mark dot-ecom"></i>');
      if (plans.some(p => p.source === 'exam')) marks.push('<i class="dot-mark dot-exam"></i>');
      if (plans.some(p => p.source !== 'exam')) marks.push('<i class="dot-mark dot-plan"></i>');
      if (isPeriod) marks.push('<i class="dot-mark dot-period"></i>');
      html += `<div class="cal-cell ${other ? 'other' : ''} ${s === today ? 'today' : ''} ${s === selected ? 'selected' : ''}" data-date="${s}">
        <div class="dnum ${isPeriod ? 'period-day' : ''}">${d.getDate()}</div>
        <div class="dots">${marks.join('')}</div>
      </div>`;
    }
    html += `</div>
    <div class="cal-legend">
      <span><i class="dot-holiday"></i>节假日</span>
      <span><i class="dot-ecom"></i>电商节点</span>
      <span><i class="dot-plan"></i>计划</span>
      <span><i class="dot-exam"></i>周测/月测</span>
      <span><i class="dot-period"></i>姨妈期</span>
    </div>
    <div class="row" style="margin-top:14px;padding:12px;background:var(--pink-1);border-radius:12px">
      <span style="font-size:20px">🌸</span>
      <div class="tiny"><b>经期预测</b><br>预计 ${pi.nextStart} 到来，还有 <b style="color:var(--pink-ink);font-size:15px">${pi.daysUntil}</b> 天 · 周期 ${pi.cycle} 天 / 持续 ${pi.len} 天${pi.isPeriod ? ' · 现在是姨妈期，注意休息 🫶' : ''}</div>
    </div>`;
    return html;
  }

  function plansInRange(startDate, endDate) {
    const out = [];
    let cur = startDate;
    let guard = 0;
    while (cur <= endDate && guard++ < 400) {
      Store.schedule(cur).forEach(p => out.push({ ...p, date: cur }));
      cur = Data.addDays(cur, 1);
    }
    return out;
  }

  function renderPlanBoard() {
    const { holiday, ecom } = Data.nodesOf(selected);
    const pi = periodInfo();
    let scope = mod._scope || 'day';
    const dayPlans = Store.schedule(selected);

    let board = '';
    if (scope === 'day') {
      board = dayPlans.length ? dayPlans.map(p => planRow(p, selected)).join('') : '<div class="empty">这一天还没有计划</div>';
    } else if (scope === 'week') {
      const dow = (Data.parse(selected).getDay() + 6) % 7;
      const ws = Data.addDays(selected, -dow);
      const we = Data.addDays(ws, 6);
      const list = plansInRange(ws, we);
      board = list.length ? list.map(p => planRow(p, p.date)).join('') : '<div class="empty">本周暂无计划</div>';
    } else {
      const y = Data.parse(selected).getFullYear(), m = Data.parse(selected).getMonth() + 1;
      const last = new Date(y, m, 0).getDate();
      const list = plansInRange(Data.iso(y, m, 1), Data.iso(y, m, last));
      board = list.length ? list.map(p => planRow(p, p.date)).join('') : '<div class="empty">本月暂无计划</div>';
    }

    return `
      <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>${selected} ${Data.weekdayCN(selected)} 的安排</div>
      <div class="row wrap" style="margin-bottom:10px">
        ${holiday ? `<span class="chip holiday">🎀 ${App.escape(holiday)}</span>` : ''}
        ${ecom ? `<span class="chip ecom">🛒 ${App.escape(ecom)}</span>` : ''}
        ${pi.periodDates[selected] ? `<span class="chip" style="background:#F8D5D7;color:#C47478">🌸 姨妈期</span>` : ''}
      </div>
      <div class="plan-tabs">
        <button class="tab ${scope === 'day' ? 'active' : ''}" data-scope="day">日计划</button>
        <button class="tab ${scope === 'week' ? 'active' : ''}" data-scope="week">周计划</button>
        <button class="tab ${scope === 'month' ? 'active' : ''}" data-scope="month">月计划</button>
      </div>
      <div class="input-group" style="margin-bottom:14px">
        <div class="row">
          <input class="input" id="planInput" placeholder="添加一个计划，如：打样确认 / 直播选品…" maxlength="100">
          <button class="btn primary sm" id="planAdd">添加</button>
        </div>
        <div class="row wrap" style="margin-top:8px">
          <label class="tiny muted row" style="gap:4px"><input type="checkbox" id="repeatWeek"> 重复到本周每天</label>
          <label class="tiny muted row" style="gap:4px"><input type="checkbox" id="repeatMonth"> 重复到本月每天</label>
        </div>
      </div>
      <div>${board}</div>
      <p class="tiny muted" style="margin-top:12px">💡 计划会自动同步到当天「今日待办」的计划板块；周测/月测已作为考试日程自动写入日历。</p>
    `;
  }

  function planRow(p, dateStr) {
    const color = p.color === 'exam' ? '#BCA6D4' : '#9CC4D3';
    return `<div class="plan-row ${p.done ? 'done' : ''}" data-id="${p.id}" data-date="${dateStr}">
      <div class="bar" style="background:${color}"></div>
      <div class="txt">${App.escape(p.text)} <span class="tiny muted">· ${dateStr.slice(5)}</span></div>
      ${p.source !== 'exam' ? `<button class="btn mini ghost" data-act="del">✕</button>` : ''}
      <div class="todo-check ${p.done ? 'checked' : ''}" data-act="done" style="width:20px;height:20px;font-size:12px;flex-basis:20px">${p.done ? '✓' : ''}</div>
    </div>`;
  }

  function bindBoard() {
    document.querySelectorAll('#view-schedule .tab').forEach(t => t.onclick = () => { mod._scope = t.dataset.scope; mod.render(); });
    const add = () => {
      const inp = document.getElementById('planInput');
      const v = inp.value.trim(); if (!v) return;
      const rw = document.getElementById('repeatWeek').checked;
      const rm = document.getElementById('repeatMonth').checked;
      const targets = [];
      if (rm) {
        const y = Data.parse(selected).getFullYear(), m = Data.parse(selected).getMonth() + 1;
        const last = new Date(y, m, 0).getDate();
        for (let i = 1; i <= last; i++) targets.push(Data.iso(y, m, i));
      } else if (rw) {
        const dow = (Data.parse(selected).getDay() + 6) % 7;
        const ws = Data.addDays(selected, -dow);
        for (let i = 0; i < 7; i++) targets.push(Data.addDays(ws, i));
      } else targets.push(selected);

      targets.forEach(dt => {
        const list = Store.schedule(dt);
        list.push({ id: 'p' + Date.now() + Math.random().toString(36).slice(2, 6), text: v, color: 'plan', done: false, source: 'manual' });
        Store.setSchedule(dt, list);
      });
      App.toast(`已添加 ${targets.length} 条计划`);
      mod.render();
    };
    document.getElementById('planAdd').onclick = add;
    document.getElementById('planInput').onkeydown = (e) => { if (e.key === 'Enter') add(); };

    document.querySelectorAll('#view-schedule .plan-row').forEach(row => {
      const id = row.dataset.id, dt = row.dataset.date;
      row.querySelector('[data-act="done"]').onclick = () => {
        const list = Store.schedule(dt); const p = list.find(x => x.id === id);
        if (p) p.done = !p.done; Store.setSchedule(dt, list); mod.render();
      };
      const del = row.querySelector('[data-act="del"]');
      if (del) del.onclick = () => {
        Store.setSchedule(dt, Store.schedule(dt).filter(x => x.id !== id));
        mod.render();
      };
    });
  }

  mod.render = function () {
    initState();
    App.ensureExamPlans(viewYear, viewMonth);
    document.getElementById('view-schedule').innerHTML = `
      <div class="section-head">
        <h2>🗓️ 日程计划</h2>
        <span class="sub">计划 · 节假日 · 电商节点 · 经期 一屏掌握</span>
      </div>
      <div class="grid grid-2">
        <div class="card" id="calCard">${renderCalendar()}</div>
        <div class="card" id="planCard">${renderPlanBoard()}</div>
      </div>
    `;

    document.getElementById('calPrev').onclick = () => {
      viewMonth--; if (viewMonth < 1) { viewMonth = 12; viewYear--; } mod.render();
    };
    document.getElementById('calNext').onclick = () => {
      viewMonth++; if (viewMonth > 12) { viewMonth = 1; viewYear++; } mod.render();
    };
    document.getElementById('calToday').onclick = () => {
      const now = new Date(); viewYear = now.getFullYear(); viewMonth = now.getMonth() + 1; selected = Store.todayISO(); mod.render();
    };
    document.querySelectorAll('#view-schedule .cal-cell').forEach(c => c.onclick = () => { selected = c.dataset.date; mod.render(); });
    bindBoard();
  };

  global.Schedule = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['schedule'] = mod;
})(window);
