/* 英语学习：每日文章+30词、练习批改、听说演练、复习、单词本、语法、周测月测 */
(function (global) {
  const mod = {};
  const C = global.EnglishContent;

  let tab = 'today';
  let lesson = null;
  let answers = {};
  let submitted = false;
  let timerHandle = null, timerStart = 0;
  let flashIdx = 0, flashFlipped = false, reviewPool = [];
  let wordQuery = '';
  let test = null;

  /* ---------- 工具 ---------- */
  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim(); }
  function similarity(a, b) {
    const A = norm(a).split(' ').filter(Boolean), B = norm(b).split(' ').filter(Boolean);
    if (!A.length || !B.length) return 0;
    const setB = new Set(B); let hit = 0;
    A.forEach(w => { if (setB.has(w)) hit++; });
    return hit / Math.max(A.length, B.length);
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function dayNumber() {
    // 课程进度由完成状态驱动：没完成当天课程就不推进，第二天继续学同一课
    const eng = Store.english();
    return Math.max(1, Number(eng.currentDay) || 1);
  }
  function speak(text) { C.speak(text); }
  function addStudyMinutes(min) {
    const d = Store.todayISO();
    Store.updateDay(d, { englishMin: (Store.day(d).englishMin || 0) + min });
  }
  function startTimer(host) {
    clearInterval(timerHandle); timerStart = Date.now();
    timerHandle = setInterval(() => {
      const el = host.querySelector('#studyTimer');
      if (!el || tab !== 'today') { clearInterval(timerHandle); return; }
      const s = Math.floor((Date.now() - timerStart) / 1000);
      el.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
  }

  /* ---------- 生成课程 ---------- */
  function buildLesson(n) {
    const sc = C.SCENARIOS[(n - 1) % C.SCENARIOS.length];
    const rotation = (Math.floor((n - 1) / C.SCENARIOS.length) * 3);
    const pool = C.WORDS.filter(w => w.cat === sc.cat).concat(C.WORDS.filter(w => w.cat === 'general'));
    const seen = new Set(), uniq = [];
    pool.forEach(w => { if (!seen.has(w.en)) { seen.add(w.en); uniq.push(w); } });
    const r = rotation % uniq.length;
    const rotated = uniq.slice(r).concat(uniq.slice(0, r));
    const words = rotated.slice(0, 30);
    const meanings = words.map(w => w.zh);

    const vocabQs = shuffle(words).slice(0, 3).map(w => {
      const opts = shuffle([w.zh, ...shuffle(meanings.filter(m => m !== w.zh)).slice(0, 3)]);
      return { q: `文中 “${w.en}” 的意思最可能是？`, opts, a: opts.indexOf(w.zh),
        why: `“${w.en}” 意为「${w.zh}」。例句：${w.ex}。做题时回到文章原句结合上下文判断，不要只凭眼熟。`, type: 'vocab' };
    });
    const compQs = sc.comp.map(c => ({ q: c.q, opts: c.opts, a: c.a, why: c.why, type: 'comp' }));
    const questions = shuffle(vocabQs.concat(compQs));

    const fills = shuffle(words.filter(w => /[A-Za-z]/.test(w.ex))).slice(0, 5).map(w => {
      const target = w.en.split(' ')[0].replace(/[^A-Za-z]/g, '');
      const sentence = w.ex.replace(new RegExp('\\b' + target + '\\b', 'i'), '______');
      const opts = shuffle([w.en, ...shuffle(words.filter(x => x.en !== w.en)).slice(0, 2).map(x => x.en)]);
      return { sentence, opts, a: opts.indexOf(w.en), why: `正确答案 ${w.en}（${w.zh}）。完整句：${w.ex}`, word: w };
    });

    const sentences = sc.articleEN.split(/(?<=[.!?])\s+/).filter(s => s.trim().split(' ').length >= 6);
    const listening = shuffle(sentences).slice(0, 3);

    return { n, sc, words, questions, fills, listening, speak: sc.speak,
      grammar: C.GRAMMAR[(n - 1) % C.GRAMMAR.length], articleEN: sc.articleEN, articleCN: sc.articleCN };
  }

  /* ---------- 今日学习 ---------- */
  function renderToday(host) {
    if (!lesson) lesson = buildLesson(dayNumber());
    if (submitted) { renderResult(host); return; }
    host.innerHTML = `
      <div class="row wrap" style="margin-bottom:14px">
        <span class="timer-pill">⏱ 今日学习 <span id="studyTimer">00:00</span></span>
        <span class="chip">第 ${lesson.n} 课</span>
        <span class="tiny muted">建议 30 分钟完成学习与测试，睡前再用 30 分钟复习巩固</span>
      </div>
      <div class="tiny" style="margin:-6px 0 14px;color:var(--pink-ink)">🌱 今天的课完成后才会解锁下一课；若今天没学完，明天继续学这一课，不跳过。</div>
      <div class="card">
        <div class="card-title"><span class="dot"></span>${App.escape(lesson.sc.title)}</div>
        <div class="article-box">
          <div class="row"><h3 style="margin:0">📖 外贸实景阅读</h3><div class="spacer"></div><button class="btn ghost sm" id="playArticle">🔊 朗读全文</button></div>
          <div class="article-en" style="margin-top:10px">${App.escape(lesson.articleEN)}</div>
          <div class="article-cn" id="articleCn">${App.escape(lesson.articleCN)}</div>
          <button class="btn mini ghost" id="toggleCn" style="margin-top:10px">显示中文对照</button>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>今日 30 个商务词汇与短语</div>
        <div style="max-height:340px;overflow-y:auto">
          <table class="word-table"><thead><tr><th>#</th><th>英文</th><th>中文</th><th>例句</th><th></th></tr></thead>
          <tbody>${lesson.words.map((w, i) => `<tr><td class="muted">${i + 1}</td><td class="word-en">${App.escape(w.en)}</td><td>${App.escape(w.zh)}</td><td class="muted">${App.escape(w.ex)}</td><td class="word-play" data-say="${App.escape(w.ex)}">🔊</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>一、阅读理解（5 题）</div>
        ${lesson.questions.map((q, i) => `<div class="quiz-q" data-q="${i}"><div class="qtext">${i + 1}. ${App.escape(q.q)}</div>${q.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}">${String.fromCharCode(65 + j)}. ${App.escape(o)}</label>`).join('')}</div>`).join('')}
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>二、词汇填空（5 题）</div>
        ${lesson.fills.map((f, i) => `<div class="quiz-q" data-fill="${i}"><div class="qtext">${i + 1}. ${App.escape(f.sentence)}</div>${f.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}">${App.escape(o)}</label>`).join('')}</div>`).join('')}
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>三、听说训练（6 题）</div>
        <p class="tiny muted">听力：点击 🔊 听句子并写下内容；口语：点击 🎤 说出中文对应的英文，系统会纠正用词与发音。</p>
        ${lesson.listening.map((s, i) => `<div class="quiz-q" data-listen="${i}"><div class="qtext">听力 ${i + 1}. <button class="btn mini ghost" data-say="${App.escape(s)}">🔊 播放句子</button></div><input class="input" data-listen-input="${i}" placeholder="写下你听到的英文句子"></div>`).join('')}
        ${lesson.speak.map((s, i) => `<div class="quiz-q"><div class="qtext">口语 ${i + 1}. 请说出：${App.escape(s.cn)} <button class="btn mini ghost" data-say="${App.escape(s.target)}">🔊 听范例</button></div><div class="row"><button class="mic-btn" data-mic="${i}">🎤</button><div style="margin-left:14px;flex:1"><div class="tiny muted" data-mic-status="${i}">点击麦克风开始朗读</div><input class="input" data-speak-input="${i}" placeholder="识别结果 / 手动输入" style="margin-top:6px"></div></div></div>`).join('')}
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn primary" id="submitQuiz" style="padding:12px 28px">提交并批改 ✅</button>
        <span class="tiny muted">做完再提交，系统会给出答案解析、纠错与答题方法论</span>
      </div>`;

    startTimer(host);
    host.querySelector('#playArticle').onclick = () => speak(lesson.articleEN);
    host.querySelector('#toggleCn').onclick = (e) => {
      const el = host.querySelector('#articleCn'); el.classList.toggle('show');
      e.target.textContent = el.classList.contains('show') ? '隐藏中文对照' : '显示中文对照';
    };
    host.querySelectorAll('[data-say]').forEach(el => el.onclick = () => speak(el.dataset.say));
    host.querySelectorAll('.quiz-q[data-q]').forEach(q => {
      const i = Number(q.dataset.q);
      q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = () => {
        q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected'); answers['q' + i] = Number(o.dataset.opt);
      });
    });
    host.querySelectorAll('.quiz-q[data-fill]').forEach(q => {
      const i = Number(q.dataset.fill);
      q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = () => {
        q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected'); answers['f' + i] = Number(o.dataset.opt);
      });
    });
    bindMic(host);
    host.querySelector('#submitQuiz').onclick = () => submit(host);
  }

  function bindMic(host) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    host.querySelectorAll('.mic-btn').forEach(btn => {
      btn.onclick = () => {
        const i = Number(btn.dataset.mic);
        const status = host.querySelector(`[data-mic-status="${i}"]`);
        const input = host.querySelector(`[data-speak-input="${i}"]`);
        if (!SR) { status.textContent = '浏览器不支持语音识别，请手动输入'; input.focus(); return; }
        const rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
        btn.classList.add('recording'); status.textContent = '正在聆听，请朗读…';
        rec.onresult = (e) => { input.value = e.results[0][0].transcript; status.textContent = '识别完成，可修正后提交'; };
        rec.onerror = () => { status.textContent = '识别失败，请手动输入'; };
        rec.onend = () => btn.classList.remove('recording');
        rec.start();
      };
    });
  }

  function submit(host) {
    clearInterval(timerHandle);
    let score = 0, total = 0; const details = [];
    lesson.questions.forEach((q, i) => {
      total++; const ok = answers['q' + i] === q.a; if (ok) score++;
      details.push({ type: '阅读', ok, q: q.q, correct: String.fromCharCode(65 + q.a) + '. ' + q.opts[q.a], why: q.why,
        mine: answers['q' + i] != null ? String.fromCharCode(65 + answers['q' + i]) : '未作答' });
    });
    lesson.fills.forEach((f, i) => {
      total++; const ok = answers['f' + i] === f.a; if (ok) score++;
      details.push({ type: '填空', ok, q: f.sentence, correct: f.opts[f.a], why: f.why,
        mine: answers['f' + i] != null ? f.opts[answers['f' + i]] : '未作答' });
    });
    lesson.listening.forEach((s, i) => {
      total++; const v = host.querySelector(`[data-listen-input="${i}"]`)?.value || '';
      const sim = similarity(v, s); const ok = sim >= 0.7; if (ok) score++;
      details.push({ type: '听力', ok, q: '听写句子', correct: s,
        why: `匹配度 ${Math.round(sim * 100)}%。先抓主干名词与动词，再补虚词；每天跟读 3 遍，注意连读与弱读。`, mine: v || '未作答' });
    });
    lesson.speak.forEach((s, i) => {
      total++; const v = host.querySelector(`[data-speak-input="${i}"]`)?.value || '';
      const sim = similarity(v, s.target); const ok = sim >= 0.7; if (ok) score++;
      details.push({ type: '口语', ok, q: s.cn, correct: s.target,
        why: `相似度 ${Math.round(sim * 100)}%。纠正方法：慢速跟读范例 3 遍 → 录音 → 回放对比 → 标记卡壳词 → 再读 3 遍。注意 the / of / to 轻读。`, mine: v || '未作答' });
    });

    const eng = Store.english();
    eng.quizResults.push({ date: Store.todayISO(), day: lesson.n, score, total, at: Date.now() });
    // 完成并提交后，才解锁下一课（未完成则停在原课，次日继续）
    if (!eng.completed.includes(lesson.n)) eng.completed.push(lesson.n);
    if (eng.currentDay <= lesson.n) eng.currentDay = lesson.n + 1;
    lesson.words.forEach(w => {
      if (!eng.wordBook.some(x => x.en === w.en)) eng.wordBook.push({ en: w.en, zh: w.zh, ex: w.ex, day: lesson.n, added: Store.todayISO(), box: 0 });
    });
    if (!eng.grammarNotes.some(g => g.title === lesson.grammar.title)) eng.grammarNotes.push(lesson.grammar);
    Store.saveEnglish(); addStudyMinutes(30);
    submitted = true; mod._details = details; mod._score = score; mod._total = total;
    renderResult(host);
  }

  function renderResult(host) {
    const pct = Math.round(mod._score / mod._total * 100);
    host.innerHTML = `
      <div class="result-card ${pct >= 70 ? 'good' : 'bad'}">
        <div class="row" style="justify-content:space-between">
          <div><div style="font-size:34px;font-weight:800">${mod._score} / ${mod._total}</div><div class="tiny">正确率 ${pct}% · 已计入今日英语学习 30 分钟</div></div>
          <div style="font-size:44px">${pct >= 85 ? '🌟' : pct >= 70 ? '👏' : '💪'}</div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>逐题解析 · 纠错 · 答题方法论</div>
        ${mod._details.map((d, i) => `<div style="padding:12px 0;border-bottom:1px dashed var(--line)">
          <div class="row"><span class="chip" style="${d.ok ? 'background:var(--green-2);color:#2F5C2C' : 'background:#F8D4D2;color:#B96A66'}">${d.ok ? '✓ 正确' : '✕ 错误'}</span><span class="tiny muted">${d.type} · 第 ${i + 1} 题</span></div>
          <div style="margin-top:6px"><b>${App.escape(d.q)}</b></div>
          ${!d.ok ? `<div class="tiny" style="margin-top:4px;color:#B96A66">你的答案：${App.escape(String(d.mine))}</div>` : ''}
          <div class="tiny" style="margin-top:4px">✅ 正确答案：<b>${App.escape(d.correct)}</b></div>
          <div class="analysis">📌 ${App.escape(d.why)}</div>
        </div>`).join('')}
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn primary" id="goReview">进入睡前复习（30 分钟）→</button>
        <button class="btn ghost" id="backToday">返回今日学习</button>
      </div>`;
    host.querySelector('#goReview').onclick = () => switchTab('review');
    host.querySelector('#backToday').onclick = () => { submitted = false; answers = {}; mod.render(); };
  }

  /* ---------- 复习 ---------- */
  function renderReview(host) {
    if (!reviewPool.length) reviewPool = shuffle(Store.english().wordBook.slice(-40));
    const w = reviewPool[flashIdx % (reviewPool.length || 1)];
    host.innerHTML = `
      <div class="row wrap" style="margin-bottom:14px"><span class="timer-pill">🌙 睡前复习模式</span><span class="chip">${reviewPool.length} 张卡片</span><span class="tiny muted">建议 30 分钟 · 今日词汇 + 历史词汇滚动复习</span></div>
      ${w ? `<div class="flashcard" id="flashcard"><div class="big">${flashFlipped ? App.escape(w.zh) : App.escape(w.en)}</div><div class="hint">${flashFlipped ? App.escape(w.ex) : '点击卡片翻面查看释义'}</div></div>
        <div class="row" style="justify-content:center;margin-top:16px">
          <button class="btn ghost" id="flipCard">🔄 翻面</button>
          <button class="btn ghost" id="sayCard">🔊 朗读</button>
          <button class="btn primary" id="nextCard">下一个 →</button>
        </div>
        <p class="tiny muted" style="text-align:center;margin-top:16px">${flashIdx + 1} / ${reviewPool.length}</p>
        <button class="btn ghost sm" id="finishReview" style="display:block;margin:18px auto 0">完成复习并记录 30 分钟 ✓</button>`
        : `<div class="empty">还没有可复习的单词，先完成今日学习吧 🌱</div>`}`;
    if (w) {
      host.querySelector('#flashcard').onclick = () => { flashFlipped = !flashFlipped; renderReview(host); };
      host.querySelector('#flipCard').onclick = () => { flashFlipped = !flashFlipped; renderReview(host); };
      host.querySelector('#sayCard').onclick = () => speak(w.ex);
      host.querySelector('#nextCard').onclick = () => { flashIdx++; flashFlipped = false; renderReview(host); };
      host.querySelector('#finishReview').onclick = () => {
        addStudyMinutes(30);
        const eng = Store.english(); eng.reviews.push({ date: Store.todayISO(), count: reviewPool.length, at: Date.now() }); Store.saveEnglish();
        reviewPool = []; flashIdx = 0; App.toast('复习完成，已记录 30 分钟 🌙'); mod.render();
      };
    }
  }

  /* ---------- 单词本 ---------- */
  function renderWords(host) {
    const eng = Store.english();
    const q = wordQuery.toLowerCase();
    const list = eng.wordBook.filter(w => !q || w.en.toLowerCase().includes(q) || w.zh.includes(q));
    host.innerHTML = `
      <div class="card">
        <input class="input" id="wordSearch" placeholder="搜索单词或中文释义…" value="${App.escape(wordQuery)}">
        <div style="max-height:60vh;overflow-y:auto;margin-top:12px">
          ${list.length ? `<table class="word-table"><thead><tr><th>英文</th><th>中文</th><th>例句</th><th>来源</th><th></th></tr></thead><tbody>
            ${list.map(w => `<tr><td class="word-en">${App.escape(w.en)}</td><td>${App.escape(w.zh)}</td><td class="muted">${App.escape(w.ex)}</td><td class="muted">第 ${w.day} 课</td><td class="word-play" data-say="${App.escape(w.ex)}">🔊</td></tr>`).join('')}
          </tbody></table>` : `<div class="empty">暂无单词，完成每日学习后自动收录</div>`}
        </div>
      </div>`;
    host.querySelector('#wordSearch').oninput = (e) => {
      wordQuery = e.target.value; renderWords(host);
      const inp = host.querySelector('#wordSearch'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    };
    host.querySelectorAll('[data-say]').forEach(el => el.onclick = () => speak(el.dataset.say));
  }

  /* ---------- 语法总结 ---------- */
  function renderGrammar(host) {
    const eng = Store.english();
    const dow = (new Date(Store.todayISO()).getDay() + 6) % 7;
    const weekStart = Data.addDays(Store.todayISO(), -dow);
    const weekWords = eng.wordBook.filter(w => w.added >= weekStart);
    host.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>本周词汇小结（${weekWords.length} 个）</div>
          ${weekWords.length ? `<div class="row wrap">${weekWords.map(w => `<span class="chip" title="${App.escape(w.zh)}">${App.escape(w.en)}</span>`).join('')}</div>` : '<div class="empty">本周尚未学习新词</div>'}
          <div class="card-title" style="margin-top:18px"><span class="dot" style="background:var(--yellow-2)"></span>本月词汇本</div>
          <div class="tiny muted">累计 ${eng.wordBook.length} 词，按月归纳，周测月测会滚动复习早期内容。</div>
        </div>
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>语法规则卡片</div>
          ${eng.grammarNotes.length ? eng.grammarNotes.map(g => `<div style="padding:10px 0;border-bottom:1px dashed var(--line)">
            <b>${App.escape(g.title)}</b>
            <div class="tiny muted" style="margin-top:3px">${App.escape(g.rule)}</div>
            <div class="tiny" style="margin-top:3px;color:var(--pink-ink)">💡 ${App.escape(g.tip)}</div>
          </div>`).join('') : '<div class="empty">完成课程后自动归纳语法点</div>'}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>答题技巧总纲</div>
        <div class="grid grid-2">
          <div class="tiny">① <b>词义题</b>：回原文定位单词所在句，结合上下文判断，不选"看起来眼熟"的选项。</div>
          <div class="tiny">② <b>细节题</b>：圈出题干关键词（数字、时间、名词），原文定位后逐词比对。</div>
          <div class="tiny">③ <b>听力题</b>：先抓主干名词与动词，虚词靠语感补；每天跟读 3 遍强化连读。</div>
          <div class="tiny">④ <b>口语题</b>：慢速跟读 → 录音 → 回放对比 → 标记卡壳词 → 再读 3 遍。</div>
        </div>
      </div>`;
  }

  /* ---------- 周测月测 ---------- */
  function buildTest(kind) {
    const eng = Store.english();
    const now = new Date(Store.todayISO());
    let pool;
    if (kind === 'weekly') {
      const dow = (now.getDay() + 6) % 7;
      pool = eng.wordBook.filter(w => w.added >= Data.addDays(Store.todayISO(), -dow - 7));
    } else {
      const y = now.getFullYear(), m = now.getMonth() + 1;
      pool = eng.wordBook.filter(w => w.added >= Data.iso(y, m - 2, 1));
    }
    if (!pool || pool.length < 4) pool = eng.wordBook.slice(-20);
    return shuffle(pool).slice(0, 10).map(w => {
      const opts = shuffle([w.zh, ...shuffle(eng.wordBook.filter(x => x.zh !== w.zh)).slice(0, 3).map(x => x.zh)]);
      return { q: `“${w.en}” 的意思是？`, opts, a: opts.indexOf(w.zh), why: `${w.en} = ${w.zh}。${w.ex}` };
    });
  }

  function renderTests(host) {
    const eng = Store.english();
    if (test) {
      host.innerHTML = `<div class="card">
        ${test.qs.map((q, i) => `<div class="quiz-q" data-tq="${i}"><div class="qtext">${i + 1}. ${App.escape(q.q)}</div>${q.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}">${String.fromCharCode(65 + j)}. ${App.escape(o)}</label>`).join('')}</div>`).join('')}
        <button class="btn primary" id="submitTest" style="margin-top:16px">提交试卷 ✅</button>
      </div>`;
      host.querySelectorAll('.quiz-q[data-tq]').forEach(q => {
        const i = Number(q.dataset.tq);
        q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = () => {
          q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
          o.classList.add('selected'); test.ans[i] = Number(o.dataset.opt);
        });
      });
      host.querySelector('#submitTest').onclick = () => {
        let s = 0; test.qs.forEach((q, i) => { if (test.ans[i] === q.a) s++; });
        eng.tests.push({ kind: test.kind, date: Store.todayISO(), score: s, total: test.qs.length, at: Date.now() });
        Store.saveEnglish();
        const kind = test.kind; test = null;
        App.toast(`测试完成：${s}/10`); mod.render();
      };
      return;
    }
    const now = new Date(Store.todayISO());
    const td = Data.testDatesInMonth(now.getFullYear(), now.getMonth() + 1);
    const hist = eng.tests.slice().reverse();
    host.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>本月考试日程（已同步日历）</div>
          <div class="tiny muted">周测（每周日）：${td.weekly.join('、') || '无'}</div>
          <div class="tiny muted" style="margin-top:6px">月测（月末）：${td.monthly}</div>
          <div class="row wrap" style="margin-top:14px">
            <button class="btn primary" id="startWeekly">开始周测（30 分钟）</button>
            <button class="btn" id="startMonthly" style="background:var(--lavender);color:#6E5A87">开始月测（30 分钟）</button>
          </div>
          <p class="tiny muted" style="margin-top:12px">月测会加入 2 个月前学过的知识点，防止遗忘。</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>历史成绩</div>
          ${hist.length ? hist.map(t => `<div class="row" style="padding:7px 0;border-bottom:1px dashed var(--line)"><span class="chip">${t.kind === 'weekly' ? '周测' : '月测'}</span><span class="tiny muted">${t.date}</span><div class="spacer"></div><b>${t.score}/${t.total}</b></div>`).join('') : '<div class="empty">还没有考试记录</div>'}
        </div>
      </div>`;
    host.querySelector('#startWeekly').onclick = () => { test = { kind: 'weekly', qs: buildTest('weekly'), ans: {} }; renderTests(host); };
    host.querySelector('#startMonthly').onclick = () => { test = { kind: 'monthly', qs: buildTest('monthly'), ans: {} }; renderTests(host); };
  }

  function switchTab(t) { tab = t; clearInterval(timerHandle); mod.render(); }

  mod.render = function () {
    const tabs = [['today', '📖 今日学习'], ['review', '🔁 复习巩固'], ['words', '📕 单词本'], ['grammar', '📐 语法总结'], ['tests', '📅 周测月测']];
    const root = document.getElementById('view-english');
    root.innerHTML = `
      <div class="section-head"><h2>🇬🇧 英语学习</h2><span class="sub">商务英语 · 外贸实战 · 每天 30 分钟</span></div>
      <div class="eng-tabs">${tabs.map(([k, l]) => `<button class="tab ${k === tab ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="engBody"></div>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
    const host = root.querySelector('#engBody');
    if (tab === 'today') renderToday(host);
    else if (tab === 'review') renderReview(host);
    else if (tab === 'words') renderWords(host);
    else if (tab === 'grammar') renderGrammar(host);
    else if (tab === 'tests') renderTests(host);
  };

  global.English = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['english'] = mod;
})(window);
