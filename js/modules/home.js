/* 首页：汇总所有板块核心数据 */
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

    const cups = Array.from({ length: 8 }, (_, i) =>
      `<span class="cup" data-cup="${i + 1}" title="点击记录饮水">${Icons.waterCup(i < (d.water || 0), 24)}</span>`
    ).join('');

    document.getElementById('view-home').innerHTML = `
      <div class="section-head">
        <h2>🏡 树树的主页</h2>
        <span class="sub">${date} · ${Data.weekdayCN(date)} ${nodes.holiday || nodes.ecom ? '· ' + App.escape((nodes.holiday ? nodes.holiday + ' ' : '') + (nodes.ecom || '')) : ''}</span>
      </div>

      ${App.quoteHTML(date)}

      <div class="grid grid-4" style="margin-top:16px">
        ${statCard('📝', `${done}/${todos.length}`, '', '今日待办', done === todos.length && todos.length ? '全部完成 🎉' : '点开清单去看看', 'todo')}
        ${statCard('🕒', d.englishMin || 0, '分钟', '今日英语', '30 分钟学习 + 30 复习', 'english')}
        ${statCard('😴', d.sleep || '—', d.sleep ? '小时' : '', '昨日睡眠', '目标 5 小时以上', 'health')}
        ${statCard('🌸', pi.daysUntil, '天', '距经期', pi.isPeriod ? '经期进行中，注意休息' : `预计 ${pi.nextStart}`, 'health')}
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

      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>今日待办速览</div>
        ${todos.length ? `<ul class="today-list">${todos.slice(0, 8).map(t => `
          <li class="home-todo-row"><span class="home-todo-check ${t.done ? 'checked' : ''}" data-todo="${t.id}" role="button" tabindex="0" title="点击标记完成">${t.done ? '✓' : ''}</span><span class="${t.done ? 'muted' : ''}" style="${t.done ? 'text-decoration:line-through' : ''}">${App.escape(t.text)}</span></li>
        `).join('')}</ul>${todos.length > 8 ? `<div class="tiny muted" style="margin-top:8px">还有 ${todos.length - 8} 项，去「今日待办」查看全部 →</div>` : ''}` : `<div class="empty">清单空空，把碎片化的事情记进来吧 ✨</div>`}
      </div>
    `;

    // 四宫格点击跳转到对应功能
    document.querySelectorAll('#view-home .stat-clickable[data-go]').forEach(c => {
      const go = () => App.go(c.dataset.go);
      c.addEventListener('click', go);
      c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });

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

    // 健康打卡 / 今日计划卡片点击跳转（卡片内的交互元素不触发跳转）
    document.querySelectorAll('#view-home .home-jump').forEach(card => {
      const go = () => App.go(card.dataset.go);
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, .cup, input, [data-cup]')) return;
        go();
      });
      card.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    });

    // 待办速览：点击对勾直接完成/取消
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
  };

  global.Home = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['home'] = mod;
})(window);
