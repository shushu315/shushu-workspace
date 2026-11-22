/* 健康生活：运动 / 视频 / 饮水 / 睡眠 / 经期 / 补剂 / 身体数据 / 饮食热量 */
(function (global) {
  const mod = {};
  const date = () => Store.todayISO();
  const HC = global.HealthContent;
  let foodCat = '全部';
  let foodQuery = '';
  let photoData = null;   // 拍照待确认的图
  let selectedFood = null; // 拍照识别后选中的食物

  mod.render = function () {
    const d = date();
    const day = Store.day(d);
    const profile = Store.all().profile;
    const body = profile.body || {};
    const pi = Data.periodInfo(profile, d);
    const sup = day.supplements || [];
    const plan = HC.todayPlan(d);
    const w = plan.workout, st = plan.stretch;

    const bmr = HC.bmr(body);                 // 基础代谢
    const burn = HC.burn(day);                // 运动消耗
    const intake = HC.intake(day);            // 今日摄入
    const totalBurn = bmr + burn;             // 总消耗
    const remain = totalBurn - intake;        // 还可摄入
    const foods = day.foods || [];

    const cups = Array.from({ length: 8 }, (_, i) =>
      `<span class="cup" data-cup="${i + 1}">${Icons.waterCup(i < (day.water || 0), 38)}</span>`
    ).join('');

    document.getElementById('view-health').innerHTML = `
      <div class="section-head">
        <h2>🌿 健康生活</h2>
        <span class="sub">${d} · 照顾好自己，才能照顾好事业</span>
      </div>

      <div class="grid grid-4">
        <div class="card big-metric">
          <div class="num">${pi.daysUntil}</div>
          <div class="unit">天后进入经期</div>
          <div class="tiny muted" style="margin-top:6px">预计 ${pi.nextStart}${pi.isPeriod ? ' · 经期中 🫶' : ''}</div>
        </div>
        <div class="card big-metric" style="background:linear-gradient(160deg,var(--blue),#F2F8FA)">
          <div class="num" style="color:#5C8494">${(day.water || 0) * 500}</div>
          <div class="unit">ml 今日饮水</div>
          <div class="tiny muted" style="margin-top:6px">目标 4000 ml · ${day.water || 0}/8 杯</div>
        </div>
        <div class="card big-metric" style="background:linear-gradient(160deg,var(--green),#F4F8F1)">
          <div class="num" style="color:#5C8A52">${day.sleep || '—'}</div>
          <div class="unit">小时 昨夜睡眠</div>
          <div class="tiny muted" style="margin-top:6px">目标 5 小时以上</div>
        </div>
        <div class="card big-metric" style="background:linear-gradient(160deg,var(--yellow),#FEF9EC)">
          <div class="num" style="color:#A88437">${day.exerciseCheck ? '✓' : '—'}</div>
          <div class="unit">今日运动打卡</div>
          <div class="tiny muted" style="margin-top:6px">20 分钟轻量化抗阻</div>
        </div>
      </div>

      <!-- 今日热量收支 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--pink-ink)"></span>今日热量收支 <span class="tiny muted">${bmr ? `基础代谢按身高体重自动计算` : '先在下方身体数据卡填身高体重'}</span></div>
        <div class="kcal-board">
          <div class="kcal-cell">
            <div class="kcal-num" style="color:#B0843A">${intake}</div>
            <div class="kcal-lbl">🍽 今日摄入</div>
          </div>
          <div class="kcal-cell kcal-op" style="color:var(--ink-3)">−</div>
          <div class="kcal-cell">
            <div class="kcal-num" style="color:#5C8A52">${totalBurn}</div>
            <div class="kcal-lbl">🔥 总消耗</div>
          </div>
          <div class="kcal-cell kcal-op" style="color:var(--ink-3)">=</div>
          <div class="kcal-cell">
            <div class="kcal-num" style="color:${remain >= 0 ? 'var(--pink-ink)' : '#C46B72'}">${remain}</div>
            <div class="kcal-lbl">${remain >= 0 ? '还可摄入 kcal' : '已超出 kcal'}</div>
          </div>
        </div>
        <div class="tiny muted" style="text-align:center;margin-top:8px">总消耗 = 基础代谢 ${bmr} + 运动消耗 ${burn} kcal（运动按抗阻 5/分、有氧 6/分估算）</div>
      </div>

      <!-- 今日视频推荐 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>今日训练视频 · 每天不同部位</div>
        <div class="grid grid-2" style="gap:14px">
          <div class="video-card">
            <div class="video-thumb" style="background:linear-gradient(135deg,#F6D9E2,#FBE9F0)">
              <span class="video-emoji">${w.emoji}</span>
              <span class="video-badge">${App.escape(w.level || '0基础')}</span>
              <span class="video-play">▶</span>
            </div>
            <div class="video-info">
              <div class="video-title">抗阻训练 · ${App.escape(w.part)}</div>
              <div class="tiny muted">${App.escape(w.focus)} · ${App.escape(w.equip)}</div>
              <div class="move-list">
                ${w.moves.map(mv => `<div class="move-row"><b>${App.escape(mv.n)}</b><span>${App.escape(mv.set)}</span><div class="tiny muted">${App.escape(mv.tip)}</div></div>`).join('')}
              </div>
              <button class="btn sm" style="margin-top:10px;width:100%" data-follow="workout">▶ 开始跟练（无需跳转）</button>
            </div>
          </div>
          <div class="video-card">
            <div class="video-thumb" style="background:linear-gradient(135deg,#D9E9F4,#EAF3F8)">
              <span class="video-emoji">🧘</span>
              <span class="video-badge">5 分钟</span>
              <span class="video-play">▶</span>
            </div>
            <div class="video-info">
              <div class="video-title">拉伸放松 · ${App.escape(st.name)}</div>
              <div class="tiny muted">训练后拉伸，缓解僵硬</div>
              <div class="move-list">
                ${st.moves.map((mv, i) => `<div class="move-row"><b>${i + 1}. ${App.escape(mv)}</b></div>`).join('')}
              </div>
              <button class="btn ghost sm" style="margin-top:10px;width:100%" data-follow="stretch">▶ 开始跟练（无需跳转）</button>
            </div>
          </div>
        </div>
        <div class="tiny muted" style="margin-top:10px">点「开始跟练」直接在页面内逐步带练，动作慢、强度低、0基础友好，手机也能用，不跳第三方。器械：弹力带 / 哑铃 / 瑜伽垫（可用矿泉水瓶代替）。每天自动轮换部位。</div>
      </div>

      <div class="grid grid-2" style="margin-top:16px">
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>今日运动记录</div>
          <div class="tiny muted" style="margin-bottom:6px">🏋️ 抗阻运动（轻量化）</div>
          <div class="health-input-grid">
            <input class="input" type="number" id="resMin" placeholder="时长(分)" value="${day.resistance?.min || ''}">
            <input class="input" id="resItems" placeholder="项目，如：深蹲 / 弹力带划船" value="${App.escape(day.resistance?.items || '')}">
          </div>
          <div class="tiny muted" style="margin:12px 0 6px">🚶 有氧运动</div>
          <div class="health-input-grid">
            <input class="input" type="number" id="aerMin" placeholder="时长(分)" value="${day.aerobic?.min || ''}">
            <input class="input" id="aerItems" placeholder="项目，如：快走 / 拉伸" value="${App.escape(day.aerobic?.items || '')}">
          </div>
          <div class="row" style="margin-top:12px">
            <button class="btn sm" id="saveSport">保存运动记录</button>
            <button class="checkin-btn ${day.exerciseCheck ? 'done' : ''}" id="healthCheckin" style="flex:1;padding:9px">${day.exerciseCheck ? '✓ 已打卡运动' : '点击打卡抗阻运动'}</button>
          </div>
        </div>

        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>今日饮水 · 8 杯水</div>
          <div class="water-big">${cups}</div>
          <div class="water-total">已喝 <b>${(day.water || 0) * 500}</b> ml · 点击杯子记录，每杯 500ml</div>
          <button class="btn ghost sm" id="waterReset" style="margin-top:10px;width:100%">重置今日饮水</button>
        </div>
      </div>

      <!-- 身体数据卡 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--pink-ink)"></span>身体数据 <span class="tiny muted">用于计算基础代谢，随时可更新</span></div>
        <div class="body-grid">
          ${[['height','身高 cm'],['weight','体重 kg'],['age','年龄'],['arm','手围 cm'],['waist','腰围 cm'],['hip','臀围 cm'],['thigh','腿围 cm']].map(([k,l]) => `
            <label class="body-field"><span>${l}</span><input class="input" type="number" step="0.5" data-body="${k}" placeholder="—" value="${App.escape(body[k] || '')}"></label>
          `).join('')}
        </div>
        <div class="row" style="margin-top:12px">
          <button class="btn sm" id="saveBody">保存身体数据</button>
          <span class="tiny muted">基础代谢（BMR）≈ <b>${bmr || '—'}</b> kcal/天</span>
        </div>
      </div>

      <!-- 饮食记录 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>饮食记录 · 拍照估算热量</div>
        <div class="row wrap" style="gap:8px">
          <button class="btn sm" id="btnCamera">📷 拍照</button>
          <button class="btn ghost sm" id="btnAlbum">🖼 从相册选</button>
          <button class="btn ghost sm" id="btnManual">✏️ 手动添加/搜索</button>
          <span class="tiny muted">合计 <b style="color:var(--pink-ink)">${intake}</b> kcal</span>
        </div>
        <div class="tiny muted" style="margin-top:6px">拍照留证后从食物库选对应食物估算热量（离线可用）；搜不到可直接手动输入热量。家常菜、常见外卖和包装食品都已收录。</div>
        <input type="file" id="cameraInput" accept="image/*" capture="environment" style="display:none">
        <input type="file" id="albumInput" accept="image/*" style="display:none">
        ${foods.length ? `<div class="food-list" style="margin-top:14px">
          ${foods.map((f, i) => `<div class="food-row" data-fidx="${i}">
            ${f.photo ? `<img class="food-thumb" src="${f.photo}" alt="食物">` : '<div class="food-thumb food-noimg">🍽</div>'}
            <div style="flex:1"><div><b>${App.escape(f.name)}</b></div><div class="tiny muted">${App.escape(f.time || '')} · ${f.qty || 1} 份</div></div>
            <b style="color:var(--pink-ink)">${f.kcal} kcal</b>
            <button class="btn mini ghost food-del" data-fidx="${i}">✕</button>
          </div>`).join('')}
        </div>` : `<div class="empty" style="margin-top:12px">还没有记录饮食，拍照或手动添加吧 🍽</div>`}
      </div>

      <!-- 补剂 + 睡眠 -->
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>今日补给 · 一键点亮吃过的补剂</div>
        <div class="sup-grid">
          ${Data.SUPPLEMENTS.map((s, i) => `
            <div class="sup-item ${sup.includes(s) ? 'on' : ''}" data-sup="${App.escape(s)}">
              <span class="em">${['💊','☀️','🌸','🐟','🟡','🦠','💇','🍬'][i]}</span>${App.escape(s)}
            </div>`).join('')}
        </div>
        <div class="row" style="margin-top:14px">
          <span class="tiny muted">昨日睡眠时长</span>
          <input class="input" type="number" step="0.5" min="0" max="24" id="sleepInput" placeholder="如 6.5" value="${day.sleep || ''}" style="width:100px">
          <span class="tiny muted">小时</span>
          <button class="btn sm" id="saveSleep">保存</button>
        </div>
      </div>

      <div id="foodModalRoot"></div>
    `;

    bindEvents(d, day);
  };

  function bindEvents(d, day) {
    // 运动
    document.getElementById('saveSport').onclick = () => {
      Store.updateDay(d, {
        resistance: { min: document.getElementById('resMin').value, items: document.getElementById('resItems').value.trim() },
        aerobic: { min: document.getElementById('aerMin').value, items: document.getElementById('aerItems').value.trim() }
      });
      App.toast('运动记录已保存 💪'); mod.render();
    };
    document.getElementById('healthCheckin').onclick = () => {
      Store.updateDay(d, { exerciseCheck: !Store.day(d).exerciseCheck });
      App.toast(Store.day(d).exerciseCheck ? '运动打卡成功 ✅' : '已取消打卡'); mod.render();
    };
    // 饮水
    document.querySelectorAll('#view-health .cup').forEach(c => c.onclick = () => {
      const n = Number(c.dataset.cup);
      const cur = Store.day(d).water || 0;
      Store.updateDay(d, { water: cur === n ? n - 1 : n }); mod.render();
    });
    document.getElementById('waterReset').onclick = () => { Store.updateDay(d, { water: 0 }); mod.render(); };
    // 补剂
    document.querySelectorAll('#view-health .sup-item').forEach(el => el.onclick = () => {
      const s = el.dataset.sup;
      const cur = Store.day(d).supplements || [];
      const next = cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s];
      Store.updateDay(d, { supplements: next }); mod.render();
    });
    // 睡眠
    document.getElementById('saveSleep').onclick = () => {
      const v = document.getElementById('sleepInput').value;
      Store.updateDay(d, { sleep: v }); App.toast('睡眠已记录 😴'); mod.render();
    };
    // 跟练面板：页面内直接带练，不跳第三方
    document.querySelectorAll('#view-health [data-follow]').forEach(b => b.onclick = () => {
      const plan = HC.todayPlan(d);
      const session = b.dataset.follow === 'stretch'
        ? { title: '拉伸放松 · ' + plan.stretch.name, moves: plan.stretch.moves.map(x => ({ n: x, set: '', tip: '', alt: '' })), bvid: '', video: plan.stretch.video, sec: 40 }
        : { title: '抗阻训练 · ' + plan.workout.part, moves: plan.workout.moves, bvid: plan.workout.bvid || '', video: plan.workout.video, sec: 45 };
      openFollow(session);
    });
    // 身体数据
    document.getElementById('saveBody').onclick = () => {
      const body = {};
      document.querySelectorAll('#view-health [data-body]').forEach(inp => { body[inp.dataset.body] = inp.value.trim(); });
      Store.setProfile({ body });
      App.toast('身体数据已保存 📏'); mod.render();
    };
    // 饮食记录
    document.getElementById('btnManual').onclick = () => openFoodModal(d, null);
    // 拍照 / 相册：两个入口，各自触发对应 input
    document.getElementById('btnCamera').onclick = () => document.getElementById('cameraInput').click();
    document.getElementById('btnAlbum').onclick = () => document.getElementById('albumInput').click();
    ['cameraInput', 'albumInput'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
          // 压缩图片，避免占用过多本地/云存储
          const img = new Image();
          img.onload = () => {
            const max = 720;
            const scale = Math.min(1, max / Math.max(img.width, img.height));
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            photoData = cv.toDataURL('image/jpeg', 0.7);
            openFoodModal(d, photoData);
          };
          img.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        e.target.value = '';
      };
    });
    document.querySelectorAll('#view-health .food-del').forEach(b => b.onclick = (e) => {
      e.stopPropagation();
      const i = Number(b.dataset.fidx);
      const list = Store.day(d).foods || [];
      list.splice(i, 1);
      Store.updateDay(d, { foods: list }); mod.render();
    });
  }

  /* ---------- 内置跟练面板：点开即练，不跳第三方，手机可用 ---------- */
  function openFollow(session) {
    const root = document.getElementById('modalRoot');
    const moves = session.moves;
    let idx = 0, left = session.sec, timer = null, running = false, done = new Set();

    function fmt(s) { return String(Math.max(0, s)).padStart(2, '0'); }
    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } running = false; }
    function startTimer() {
      if (running) { stopTimer(); return; }
      running = true;
      timer = setInterval(() => {
        left--;
        const cd = root.querySelector('#flCountdown');
        if (cd) cd.textContent = fmt(left);
        if (left <= 0) { stopTimer(); next(); }
      }, 1000);
    }
    function next() {
      stopTimer();
      if (idx < moves.length - 1) { idx++; left = session.sec; draw(); }
      else { finish(); }
    }
    function prev() { stopTimer(); if (idx > 0) { idx--; left = session.sec; draw(); } }
    function finish() {
      stopTimer();
      root.innerHTML = `
        <div class="modal-mask"><div class="modal follow-modal">
          <div class="fl-done">
            <div class="fl-done-emoji">🎉</div>
            <h3>完成跟练！</h3>
            <p class="tiny muted">已做完 ${done.size}/${moves.length} 个动作，记得喝水、拉伸一下 🫶</p>
            <button class="btn primary" id="flFinishClose" style="margin-top:14px;width:100%">完成</button>
          </div>
        </div></div>`;
      root.querySelector('#flFinishClose').onclick = () => { root.innerHTML = ''; };
      // 只要开始过跟练就记一次运动打卡
      if (moves.length) { Store.updateDay(date(), { exerciseCheck: true }); }
    }

    function draw() {
      const mv = moves[idx];
      const isStretch = !mv.set;
      root.innerHTML = `
        <div class="modal-mask"><div class="modal follow-modal">
          <div class="fl-head">
            <div>
              <div class="fl-title">${App.escape(session.title)}</div>
              <div class="tiny muted">第 ${idx + 1} / ${moves.length} 个动作</div>
            </div>
            <button class="btn mini ghost" id="flClose">✕</button>
          </div>
          <div class="fl-progress"><span style="width:${Math.round((idx + 1) / moves.length * 100)}%"></span></div>
          <div class="fl-stage">
            <div class="fl-idx">${idx + 1}</div>
            <div class="fl-name">${App.escape(mv.n)}</div>
            ${mv.set ? `<div class="fl-set">${App.escape(mv.set)}</div>` : ''}
            ${mv.tip ? `<div class="fl-tip">💡 ${App.escape(mv.tip)}</div>` : ''}
            ${mv.alt ? `<div class="fl-alt">0基础替代：${App.escape(mv.alt)}</div>` : ''}
            <div class="fl-timer">
              <button class="fl-round" id="flTimerBtn"><span id="flCountdown">${fmt(left)}</span><small>${running ? '暂停' : '秒 · 点此开始/暂停'}</small></button>
            </div>
          </div>
          <div class="fl-nav">
            <button class="btn ghost sm" id="flPrev" ${idx === 0 ? 'disabled' : ''}>← 上一个</button>
            <button class="btn ghost sm" id="flDone">${done.has(idx) ? '✓ 已完成' : '标记完成'}</button>
            <button class="btn primary sm" id="flNext">${idx === moves.length - 1 ? '完成 ✓' : '下一个 →'}</button>
          </div>
          <div class="fl-video">
            <div class="tiny muted">想看真人示范？（可选，需联网）</div>
            <div class="fl-video-links">
              ${session.bvid ? `<button class="btn mini ghost" id="flEmbed">▶ 内嵌视频</button>` : ''}
              <button class="btn mini ghost" id="flBili">在 B 站看示范 ↗</button>
            </div>
            <div id="flPlayer"></div>
          </div>
        </div></div>`;

      root.querySelector('#flClose').onclick = () => { stopTimer(); root.innerHTML = ''; };
      root.querySelector('#flTimerBtn').onclick = startTimer;
      root.querySelector('#flPrev').onclick = prev;
      root.querySelector('#flNext').onclick = next;
      root.querySelector('#flDone').onclick = () => { done.add(idx); draw(); };
      root.querySelector('#flBili').onclick = () => {
        const url = session.bvid
          ? 'https://www.bilibili.com/video/' + session.bvid
          : 'https://search.bilibili.com/all?keyword=' + encodeURIComponent(session.video);
        window.open(url, '_blank', 'noopener');
      };
      const embed = root.querySelector('#flEmbed');
      if (embed) embed.onclick = () => {
        root.querySelector('#flPlayer').innerHTML =
          `<iframe src="https://player.bilibili.com/player.html?bvid=${session.bvid}&page=1&high_quality=1&danmaku=0" allowfullscreen="true" frameborder="0" scrolling="no"></iframe>`;
      };
    }
    draw();
  }

  /* 食物选择弹窗（拍照识别的降级：拍照后从食物库匹配，离线可用） */
  function openFoodModal(d, photo) {
    selectedFood = null; foodCat = '全部'; foodQuery = '';
    const root = document.getElementById('foodModalRoot');
    function draw() {
      let list = HC.FOODS;
      if (foodCat !== '全部') list = list.filter(f => f.c === foodCat);
      if (foodQuery) list = list.filter(f => f.n.includes(foodQuery) || f.c.includes(foodQuery));
      list = list.slice(0, 60);
      root.innerHTML = `
        <div class="food-mask">
          <div class="food-sheet">
            <div class="row" style="justify-content:space-between">
              <h3 style="margin:0">${photo ? '📷 照片已记录 · 选择食物估算热量' : '✏️ 添加饮食'}</h3>
              <button class="btn mini ghost" id="foodClose">✕</button>
            </div>
            ${photo ? `<div class="photo-preview"><img src="${photo}" alt="食物照片"></div>` : ''}
            ${selectedFood ? `
              <div class="food-selected">
                <div><b>${App.escape(selectedFood.n)}</b> · ${selectedFood.k} kcal/份</div>
                <div class="row" style="margin-top:8px;align-items:center">
                  <span class="tiny">份量</span>
                  <input class="input" type="number" id="foodQty" value="1" step="0.5" min="0.5" style="width:80px">
                  <span class="tiny muted">合计 <b id="foodTotal" style="color:var(--pink-ink)">${selectedFood.k}</b> kcal</span>
                </div>
                <button class="btn primary" id="foodConfirm" style="width:100%;margin-top:10px">确认添加 ✓</button>
              </div>` : `
              <input class="input" id="foodSearch" placeholder="搜索食物名，如：米饭 / 鸡蛋 / 奶茶" value="${App.escape(foodQuery)}">
              <div class="food-cats">
                ${['全部', ...HC.FOOD_CATS].map(c => `<span class="food-cat ${c === foodCat ? 'on' : ''}" data-cat="${c}">${c}</span>`).join('')}
              </div>
              <div class="food-grid">
                ${list.map((f, i) => `<div class="food-opt" data-idx="${HC.FOODS.indexOf(f)}"><div class="food-opt-emoji">${foodEmoji(f.c)}</div><div class="food-opt-name">${App.escape(f.n)}</div><div class="tiny" style="color:var(--pink-ink)">${f.k} kcal</div></div>`).join('') || '<div class="empty">没找到，试试手动输入热量</div>'}
              </div>
              <div class="row" style="margin-top:10px">
                <input class="input" id="customName" placeholder="自定义食物名" style="flex:1">
                <input class="input" id="customKcal" type="number" placeholder="热量 kcal" style="width:110px">
                <button class="btn sm" id="customAdd">添加</button>
              </div>`}
          </div>
        </div>`;

      root.querySelector('#foodClose').onclick = () => { photoData = null; root.innerHTML = ''; };
      root.querySelector('.food-mask').onclick = (e) => { if (e.target.classList.contains('food-mask')) { photoData = null; root.innerHTML = ''; } };

      if (selectedFood) {
        const qty = root.querySelector('#foodQty');
        const upd = () => { root.querySelector('#foodTotal').textContent = Math.round(selectedFood.k * (Number(qty.value) || 0)); };
        qty.oninput = upd;
        root.querySelector('#foodConfirm').onclick = () => {
          const q = Number(qty.value) || 1;
          addFood(d, { name: selectedFood.n, kcal: Math.round(selectedFood.k * q), qty: q, photo: photoData || '', time: nowTime() });
          photoData = null; root.innerHTML = ''; mod.render();
        };
      } else {
        const s = root.querySelector('#foodSearch');
        s.oninput = () => { foodQuery = s.value.trim(); draw(); const el = root.querySelector('#foodSearch'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } };
        root.querySelectorAll('.food-cat').forEach(el => el.onclick = () => { foodCat = el.dataset.cat; draw(); });
        root.querySelectorAll('.food-opt').forEach(el => el.onclick = () => { selectedFood = HC.FOODS[Number(el.dataset.idx)]; draw(); });
        root.querySelector('#customAdd').onclick = () => {
          const name = root.querySelector('#customName').value.trim();
          const kcal = Number(root.querySelector('#customKcal').value) || 0;
          if (!name) { App.toast('请填食物名'); return; }
          addFood(d, { name, kcal, qty: 1, photo: photoData || '', time: nowTime() });
          photoData = null; root.innerHTML = ''; mod.render();
        };
      }
    }
    draw();
  }

  function addFood(d, item) {
    const list = Store.day(d).foods || [];
    list.push(item);
    Store.updateDay(d, { foods: list });
    App.toast('已记录 ' + item.name + ' · ' + item.kcal + ' kcal 🍽');
  }

  function foodEmoji(cat) {
    return ({ '主食': '🍚', '家常菜': '🍲', '蛋白': '🥚', '蔬菜': '🥬', '水果': '🍎', '坚果': '🥜', '饮品': '🥤', '零食': '🍪', '外食': '🍔' })[cat] || '🍽';
  }
  function nowTime() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  global.Health = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['health'] = mod;
})(window);
