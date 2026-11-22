/* 树洞小记：文艺手账风日记，每日不同信纸，手写文艺字体 */
(function (global) {
  const mod = {};
  let selected = null;

  const MOODS = ['🌸 开心', '🥰 满足', '😌 平静', '💪 元气', '🤔 思考', '😮‍💨 疲惫', '😢 低落', '✨ 灵感'];
  const WEATHERS = ['☀️ 晴', '⛅ 多云', '🌧️ 雨', '🌙 夜'];

  function styleOf(dateStr) {
    let h = 0;
    for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
    return h % 8;
  }

  function getDiary(dateStr) {
    const d = Store.day(dateStr);
    return d.diary || { text: '', mood: '', weather: '', title: '' };
  }

  function saveDiary(dateStr, patch) {
    const d = Store.day(dateStr);
    d.diary = Object.assign({}, getDiary(dateStr), patch);
    Store.save();
  }

  function entries() {
    const days = Store.all().days;
    return Object.keys(days).filter(k => days[k].diary && (days[k].diary.text || days[k].diary.mood)).sort().reverse();
  }

  mod.render = function () {
    const today = Store.todayISO();
    if (!selected) selected = today;
    const list = entries();
    if (!list.includes(today)) list.unshift(today);
    const diary = getDiary(selected);
    const style = styleOf(selected);
    const dow = Data.weekdayCN(selected);

    document.getElementById('view-diary').innerHTML = `
      <div class="section-head">
        <h2>🌳 树洞小记</h2>
        <span class="sub">写给自己的碎碎念 · 每一天的信纸都不一样</span>
      </div>
      <div class="diary-layout">
        <div>
          <div class="card diary-sidelist" style="padding:10px">
            <div class="card-title" style="padding:6px 6px 10px"><span class="dot"></span>时光抽屉 <span class="tiny muted" style="font-weight:400">· 共 ${entries().length} 篇 · 点击可往前翻看</span></div>
            <input class="input" id="diarySearch" placeholder="按日期查找，如 2026-11" style="margin-bottom:8px;font-size:12px;padding:7px 10px">
            <div id="diaryListWrap">
            ${list.map(dt => {
              const d = getDiary(dt);
              const preview = (d.text || '').replace(/\n/g, ' ').slice(0, 18) || (d.mood ? d.mood : '空白的一页');
              return `<div class="diary-entry-mini ${dt === selected ? 'active' : ''}" data-date="${dt}">
                <div class="d">${dt === today ? '今天 · ' : ''}${dt.slice(5)} <span class="tiny muted">${dowOf(dt)}</span></div>
                <div class="p">${App.escape(preview)}</div>
              </div>`;
            }).join('')}
            </div>
          </div>
          <button class="btn ghost sm" id="newEntry" style="width:100%;margin-top:10px">✏️ 写一篇今天</button>
        </div>

        <div class="paper paper-style-${style}" id="paper">
          <div class="tape"></div>
          <div class="paper-date">${selected.slice(0, 4)} 年 ${Number(selected.slice(5, 7))} 月 ${Number(selected.slice(8, 10))} 日 · ${dow}</div>
          <div class="paper-meta">${Data.nodesText(selected) || '写给树树自己的一页'}</div>
          <div class="paper-lines">${'<i></i>'.repeat(12)}</div>
          <div class="mood-row">
            ${MOODS.map(m => `<span class="mood-chip ${diary.mood === m ? 'on' : ''}" data-mood="${m}">${m}</span>`).join('')}
          </div>
          <div class="mood-row">
            ${WEATHERS.map(w => `<span class="mood-chip ${diary.weather === w ? 'on' : ''}" data-weather="${w}">${w}</span>`).join('')}
          </div>
          <textarea id="diaryText" placeholder="今天的心情、感悟、小小的成长…写下来就好 🌿">${App.escape(diary.text || '')}</textarea>
          <div class="saved-hint" id="savedHint">${diary.savedAt ? '已保存 ' + new Date(diary.savedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '输入即自动保存'}</div>
        </div>
      </div>
    `;

    document.querySelectorAll('.diary-entry-mini').forEach(el => el.onclick = () => { selected = el.dataset.date; mod.render(); });
    const dSearch = document.getElementById('diarySearch');
    if (dSearch) dSearch.oninput = () => {
      const kw = dSearch.value.trim();
      document.querySelectorAll('.diary-entry-mini').forEach(el => {
        el.style.display = (!kw || el.dataset.date.includes(kw)) ? '' : 'none';
      });
    };
    document.getElementById('newEntry').onclick = () => { selected = today; mod.render(); document.getElementById('diaryText').focus(); };
    document.querySelectorAll('[data-mood]').forEach(el => el.onclick = () => {
      const v = getDiary(selected).mood === el.dataset.mood ? '' : el.dataset.mood;
      saveDiary(selected, { mood: v, savedAt: Date.now() }); mod.render();
    });
    document.querySelectorAll('[data-weather]').forEach(el => el.onclick = () => {
      const v = getDiary(selected).weather === el.dataset.weather ? '' : el.dataset.weather;
      saveDiary(selected, { weather: v, savedAt: Date.now() }); mod.render();
    });

    const ta = document.getElementById('diaryText');
    let saveTimer = null;
    ta.addEventListener('input', () => {
      clearTimeout(saveTimer);
      document.getElementById('savedHint').textContent = '输入中…';
      saveTimer = setTimeout(() => {
        saveDiary(selected, { text: ta.value, savedAt: Date.now() });
        document.getElementById('savedHint').textContent = '已自动保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      }, 600);
    });
    ta.addEventListener('blur', () => { clearTimeout(saveTimer); saveDiary(selected, { text: ta.value, savedAt: Date.now() }); });
  };

  function dowOf(dateStr) {
    return ['日', '一', '二', '三', '四', '五', '六'][Data.parse(dateStr).getDay()];
  }

  global.Diary = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['diary'] = mod;
})(window);
