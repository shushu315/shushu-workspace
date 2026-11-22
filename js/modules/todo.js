/* 今日待办：鸡汤同步 + 当日计划同步 + 可拖拽排序的清单 */
(function (global) {
  const mod = {};
  const date = () => Store.todayISO();

  function saveTodos(list) { Store.updateDay(date(), { todo: list }); }

  /** 汇总最近 30 天（不含今天）未完成的待办，附带来源日期 */
  function collectOverdue() {
    const all = Store.load();
    const today = date();
    const cutoff = Store.todayISO(-30);
    const items = [];
    Object.keys(all.days || {}).forEach(d => {
      if (d >= today || d < cutoff) return;
      const todos = (all.days[d].todo || []).filter(t => t && !t.done && t.text);
      todos.forEach(t => items.push({ src: d, id: t.id, text: t.text }));
    });
    // 旧日期排前面，先清最早的
    items.sort((a, b) => a.src < b.src ? -1 : (a.src > b.src ? 1 : 0));
    return items;
  }

  function dayGap(from, to) {
    return Math.round((new Date(to) - new Date(from)) / 86400000);
  }

  /** 长按拖拽排序（鼠标与触屏通用） */
  function enableDrag(listEl, onChange) {
    if (mod._dragCleanup) mod._dragCleanup();
    let timer = null, dragging = null, startY = 0, active = false;

    const move = (e) => {
      if (timer && !active && Math.abs(e.clientY - startY) > 10) { clearTimeout(timer); timer = null; }
      if (!active || !dragging) return;
      e.preventDefault();
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const over = target && target.closest('.todo-item');
      if (over && over !== dragging) {
        const rect = over.getBoundingClientRect();
        const before = e.clientY < rect.top + rect.height / 2;
        listEl.insertBefore(dragging, before ? over : over.nextSibling);
      }
    };
    const up = () => {
      clearTimeout(timer); timer = null;
      if (active && dragging) {
        dragging.classList.remove('dragging');
        dragging = null; active = false;
        const ids = Array.from(listEl.children).map(li => li.dataset.id);
        onChange(ids);
      }
    };
    mod._dragCleanup = () => {
      clearTimeout(timer);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
    };

    listEl.querySelectorAll('.todo-handle').forEach(handle => {
      handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const li = handle.closest('.todo-item');
        startY = e.clientY;
        active = false;
        timer = setTimeout(() => {
          active = true;
          dragging = li;
          li.classList.add('dragging');
          if (navigator.vibrate) navigator.vibrate(20);
        }, 320);
      });
    });

    document.addEventListener('pointermove', move, { passive: false });
    document.addEventListener('pointerup', up);
  }

  mod.render = function () {
    const d = date();
    const dayData = Store.day(d);
    const todos = dayData.todo || [];
    const plans = App.plansFor(d);
    const nodes = Data.nodesOf(d);
    const overdue = collectOverdue();

    document.getElementById('view-todo').innerHTML = `
      <div class="section-head">
        <h2>✅ 今日待办</h2>
        <span class="sub">${d} · ${Data.weekdayCN(d)} · 完成 ${todos.filter(t => t.done).length}/${todos.length}</span>
      </div>

      ${App.quoteHTML(d)}

      ${overdue.length ? `
      <div class="card overdue-card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:#E8A9A4"></span>昨日未完成 <span class="tiny muted" style="font-weight:400">· ${overdue.length} 项待清理</span></div>
        <div class="tiny muted" style="margin-bottom:8px">这些是前几天没做完的事，勾 ✓ 标记完成，或点「移到今天」继续做。</div>
        <ul class="overdue-list">
          ${overdue.map((o, i) => `<li class="overdue-item" data-oi="${i}">
            <div class="overdue-check" data-oact="done">✓</div>
            <div class="overdue-text">${App.escape(o.text)}</div>
            <div class="overdue-src" title="来源日期">${App.escape(o.src.slice(5))} · ${dayGap(o.src, d)}天前</div>
            <button class="btn mini ghost" data-oact="move">移到今天</button>
          </li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>今日计划（来自日程计划）</div>
        ${plans.length || nodes.holiday || nodes.ecom ? `
          <ul class="today-list">
            ${plans.map(pl => `<li><span class="tag" style="background:${pl.color === 'exam' ? 'var(--lavender)' : 'var(--blue)'};color:${pl.color === 'exam' ? '#7C6597' : '#4E7A8C'}">${pl.color === 'exam' ? '考试' : '计划'}</span><span>${App.escape(pl.text)}</span></li>`).join('')}
            ${nodes.holiday ? `<li><span class="tag holiday" style="background:#FDE8E6;color:#C07A76">节日</span><span>${App.escape(nodes.holiday)}</span></li>` : ''}
            ${nodes.ecom ? `<li><span class="tag" style="background:var(--yellow);color:#A88437">电商节点</span><span>${App.escape(nodes.ecom)}</span></li>` : ''}
          </ul>` : `<div class="empty">今天暂无计划与节点</div>`}
      </div>

      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>碎片事项清单 <span class="tiny muted" style="font-weight:400">· 长按 ⠿ 拖动排序优先级</span></div>
        <div class="todo-input-row">
          <input class="input" id="todoInput" placeholder="随手记下要做的事，回车添加…" maxlength="120">
          <button class="btn primary" id="todoAdd">添加</button>
        </div>
        <ul class="todo-list" id="todoList">
          ${todos.length ? todos.map(t => `
            <li class="todo-item ${t.done ? 'done' : ''}" data-id="${t.id}">
              <div class="todo-check ${t.done ? 'checked' : ''}" data-act="check">${t.done ? '✓' : ''}</div>
              <div class="todo-text">${App.escape(t.text)}</div>
              <div class="todo-handle" title="长按拖动排序">⠿</div>
              <div class="todo-del" data-act="del" title="删除">✕</div>
            </li>`).join('') : `<div class="empty">还没有事项，先把脑子里的事情倒出来吧 🧠</div>`}
        </ul>
      </div>
    `;

    function add() {
      const inp = document.getElementById('todoInput');
      const v = inp.value.trim();
      if (!v) return;
      const list = Store.day(d).todo || [];
      list.push({ id: 't' + Date.now() + Math.random().toString(36).slice(2, 6), text: v, done: false });
      saveTodos(list);
      inp.value = '';
      mod.render();
      document.getElementById('todoInput')?.focus();
    }
    document.getElementById('todoAdd').onclick = add;
    document.getElementById('todoInput').onkeydown = (e) => { if (e.key === 'Enter') add(); };

    document.querySelectorAll('#todoList .todo-item').forEach(li => {
      const id = li.dataset.id;
      li.querySelector('[data-act="check"]').onclick = () => {
        const list = Store.day(d).todo || [];
        const item = list.find(x => x.id === id);
        if (item) item.done = !item.done;
        saveTodos(list); mod.render();
      };
      const del = li.querySelector('[data-act="del"]');
      if (del) del.onclick = () => {
        saveTodos((Store.day(d).todo || []).filter(x => x.id !== id));
        mod.render();
      };
    });

    if (todos.length > 1) {
      enableDrag(document.getElementById('todoList'), (ids) => {
        const list = Store.day(d).todo || [];
        const map = Object.fromEntries(list.map(x => [x.id, x]));
        saveTodos(ids.map(id => map[id]).filter(Boolean));
        App.toast('优先级顺序已更新');
      });
    }

    // 昨日未完成：勾选完成 / 移到今天
    document.querySelectorAll('#view-todo .overdue-item').forEach(li => {
      const i = Number(li.dataset.oi);
      const o = overdue[i];
      const doneBtn = li.querySelector('[data-oact="done"]');
      if (doneBtn) doneBtn.onclick = () => {
        const srcList = Store.day(o.src).todo || [];
        const item = srcList.find(x => x.id === o.id);
        if (item) item.done = true;
        Store.updateDay(o.src, { todo: srcList });
        App.toast('已完成，棒！🎉'); mod.render();
      };
      const moveBtn = li.querySelector('[data-oact="move"]');
      if (moveBtn) moveBtn.onclick = () => {
        // 从原日期移除
        const srcList = (Store.day(o.src).todo || []).filter(x => x.id !== o.id);
        Store.updateDay(o.src, { todo: srcList });
        // 加到今天
        const todayList = Store.day(d).todo || [];
        todayList.push({ id: o.id, text: o.text, done: false });
        saveTodos(todayList);
        App.toast('已移到今天 ✅'); mod.render();
      };
    });
  };

  global.Todo = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['todo'] = mod;
})(window);
