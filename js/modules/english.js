/* 英语学习：数据看板 + 每日文章 + 即点词卡 + 全选择题 + 资料库 + 累积单词本 + 语法练习 + 百词斩复习 + 试卷夹 */
(function (global) {
  const mod = {};
  const C = global.EnglishContent;

  let tab = 'dashboard';
  let lesson = null;
  let answers = {};
  let submitted = false;
  let timerHandle = null, timerStart = 0, accumMs = 0;
  let flashIdx = 0, flashAnswered = false, reviewPool = [], reviewCorrect = 0;
  let wordQuery = '';
  let test = null;
  let grammarQuiz = null;

  /* ---------- 工具 ---------- */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  function dayNumber() {
    const eng = Store.english();
    return Math.max(1, Number(eng.currentDay) || 1);
  }
  function speak(text) { C.speak(text); }
  // 可点击英文文本
  function en(text) { return Dictionary.clickableHTML(text); }

  /* ---------- 真实计时（无上限） ---------- */
  function persistElapsed() {
    if (accumMs <= 0) return;
    Store.addStudySeconds(Math.round(accumMs / 1000));
    accumMs = 0;
  }
  function startTimer(host) {
    clearInterval(timerHandle);
    timerStart = Date.now(); accumMs = 0;
    timerHandle = setInterval(() => {
      const el = host.querySelector('#studyTimer');
      if (!el || tab !== 'today') { persistElapsed(); clearInterval(timerHandle); return; }
      const totalSec = Math.round((Store.english().studyLog[Store.todayISO()] || 0)) + Math.floor(accumMs / 1000);
      el.textContent = `${String(Math.floor(totalSec / 60)).padStart(2, '0')}:${String(totalSec % 60).padStart(2, '0')}`;
    }, 1000);
  }
  function stopTimer() { persistElapsed(); clearInterval(timerHandle); }

  /* ---------- 生成课程（题目全部选择题） ---------- */
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

    // 题型一：词汇选择题
    const vocabQs = shuffle(words).slice(0, 3).map(w => {
      const opts = shuffle([w.zh, ...shuffle(meanings.filter(m => m !== w.zh)).slice(0, 3)]);
      return { type: 'vocab', q: `文中 “${w.en}” 的意思最可能是？`, opts, a: opts.indexOf(w.zh),
        why: `“${w.en}” 意为「${w.zh}」。例句：${w.ex}。回到原句结合上下文判断，不要只凭眼熟。` };
    });
    // 题型二：阅读理解（原文已有）
    const compQs = sc.comp.map(c => ({ type: 'reading', q: c.q, opts: c.opts, a: c.a, why: c.why }));
    // 题型三：完形填空（把例句挖空，四选一）
    const cloze = shuffle(words.filter(w => /[A-Za-z]/.test(w.ex))).slice(0, 4).map(w => {
      const target = w.en.split(' ')[0].replace(/[^A-Za-z]/g, '');
      const sentence = w.ex.replace(new RegExp('\\b' + target + '\\b', 'i'), '______');
      const distract = shuffle(C.WORDS.filter(x => x.en !== w.en && x.en.split(' ').length === 1)).slice(0, 3).map(x => x.en);
      const opts = shuffle([w.en.split(' ')[0], ...distract]);
      return { type: 'cloze', q: `完形填空：${sentence}`, opts, a: opts.indexOf(w.en.split(' ')[0]),
        why: `正确答案 ${w.en}（${w.zh}）。完整句：${w.ex}` };
    });
    // 题型四：听力选择题（听句子，选中文意思）
    const sentences = sc.articleEN.split(/(?<=[.!?])\s+/).filter(s => s.trim().split(' ').length >= 6);
    const listenQs = shuffle(sentences).slice(0, 3).map(s => {
      const right = C.WORDS.length ? (C.SCENARIOS.find(x => x.articleEN === sc.articleEN) ? '' : '') : '';
      // 用文章中文对应句做正确项：简单取该句关键词 manufactures 的手工释义回退
      const zh = translateSentence(s, sc.articleCN);
      const others = shuffle(C.SCENARIOS.filter(x => x.key !== sc.key)).slice(0, 3).map(x => x.title.split('·').pop().trim());
      const opts = shuffle([zh, ...others]);
      return { type: 'listen', audio: s, q: '听录音，选出你听到的句子大意：', opts, a: opts.indexOf(zh),
        why: `原文：${s}` };
    });
    // 题型五：情景口语选择题（给中文，选最得体的英文表达）
    const speakQs = sc.speak.map(s => {
      const others = shuffle(C.SCENARIOS.filter(x => x.key !== sc.key)).slice(0, 1)
        .flatMap(x => x.speak).slice(0, 3).map(x => x.target);
      const opts = shuffle([s.target, ...others]);
      return { type: 'speak', q: `情景表达：${s.cn}`, opts, a: opts.indexOf(s.target), why: `得体表达：${s.target}` };
    });

    const questions = shuffle(vocabQs.concat(compQs, cloze, listenQs, speakQs));
    return {
      n, sc, words, questions, speak: sc.speak,
      grammar: C.GRAMMAR[(n - 1) % C.GRAMMAR.length],
      articleEN: sc.articleEN, articleCN: sc.articleCN
    };
  }

  // 从中文译文里粗略定位某英文句的含义：按文章分段对应，取最相近的一句
  function translateSentence(enSent, cnArticle) {
    // 用文章里出现的关键词映射到中文释义（词典）
    const words = enSent.match(/[A-Za-z]+/g) || [];
    const known = words.map(w => Dictionary.lookup(w)).filter(x => x.known && x.zh);
    if (known.length >= 2) return known.slice(0, 3).map(x => `${x.word}(${x.zh.split('；')[0]})`).join(' · ');
    return cnArticle.slice(0, 24);
  }

  /* ---------- 数据看板（第一板块） ---------- */
  function renderDashboard(host) {
    const eng = Store.english();
    const todaySec = eng.studyLog[Store.todayISO()] || 0;
    const todayMin = Math.round(todaySec / 60);
    const totalWords = (eng.wordBook || []).length;
    const scenes = new Set((eng.completed || [])).size;
    const quizzes = eng.quizResults || [];
    const avg = quizzes.length ? Math.round(quizzes.reduce((s, q) => s + (q.score / (q.total || 1)), 0) / quizzes.length * 100) : 0;
    let level = '入门';
    if (totalWords >= 120 && avg >= 80) level = '进阶';
    else if (totalWords >= 60 && avg >= 70) level = '初中级';
    else if (totalWords >= 30) level = '基础';
    host.innerHTML = `
      <div class="grid grid-2">
        <div class="card dash-metric"><div class="dm-num">${totalWords}</div><div class="dm-lbl">📚 累计词汇量</div><div class="tiny muted">累积式单词本，只增不减</div></div>
        <div class="card dash-metric"><div class="dm-num">${todayMin}<small> 分</small></div><div class="dm-lbl">⏱ 今日学习时长</div><div class="tiny muted">真实计时 · 已同步首页看板</div></div>
        <div class="card dash-metric"><div class="dm-num">${scenes}<small> / ${C.SCENARIOS.length}</small></div><div class="dm-lbl">🗂 已学商务场景</div><div class="tiny muted">外贸实景课程</div></div>
        <div class="card dash-metric"><div class="dm-num" style="font-size:26px">${level}</div><div class="dm-lbl">📈 目前英语水平</div><div class="tiny muted">按词汇量与正确率综合评估</div></div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>今日学习路径</div>
        <div class="tiny muted">建议顺序：① 今日学习（读文章 + 做选择题）→ ② 睡前复习（百词斩式）→ ③  grammar 语法练习 → ④ 单词本翻看。所有英文单词都可以点开查看小卡并加入单词本。</div>
        <button class="btn primary" id="dashStart" style="margin-top:12px">开始今日学习 →</button>
      </div>`;
    host.querySelector('#dashStart').onclick = () => switchTab('today');
  }

  /* ---------- 今日学习 ---------- */
  function renderToday(host) {
    if (!lesson) lesson = buildLesson(dayNumber());
    if (submitted) { renderResult(host); return; }
    host.innerHTML = `
      <div class="row wrap" style="margin-bottom:14px">
        <span class="timer-pill">⏱ 今日学习 <span id="studyTimer">00:00</span></span>
        <span class="chip">第 ${lesson.n} 课</span>
        <span class="tiny muted">真实计时，学多久记多久，无上限</span>
      </div>
      <div class="tiny" style="margin:-6px 0 14px;color:var(--pink-ink)">🌱 完成并提交后才解锁下一课；今天没学完，明天继续学这一课，不跳课。</div>
      <div class="card">
        <div class="card-title"><span class="dot"></span>${App.escape(lesson.sc.title)} <span class="tiny muted" style="font-weight:400">· 点文中任意英文可查词</span></div>
        <div class="article-box">
          <div class="row"><h3 style="margin:0">📖 外贸实景阅读</h3><div class="spacer"></div><button class="btn ghost sm" id="playArticle">🔊 朗读全文</button></div>
          <div class="article-en" style="margin-top:10px">${en(lesson.articleEN)}</div>
          <div class="article-cn" id="articleCn">${App.escape(lesson.articleCN)}</div>
          <button class="btn mini ghost" id="toggleCn" style="margin-top:10px">显示中文对照</button>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>今日 30 个商务词汇与短语 <span class="tiny muted" style="font-weight:400">· 点单词看小卡</span></div>
        <div style="max-height:340px;overflow-y:auto">
          <table class="word-table"><thead><tr><th>#</th><th>英文</th><th>中文</th><th>例句</th><th></th></tr></thead>
          <tbody>${lesson.words.map((w, i) => `<tr><td class="muted">${i + 1}</td><td class="word-en dict-word" data-word="${w.en.toLowerCase()}">${App.escape(w.en)}</td><td>${App.escape(w.zh)}</td><td class="muted">${en(w.ex)}</td><td class="word-play" data-say="${App.escape(w.ex)}">🔊</td></tr>`).join('')}</tbody></table>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--blue-2)"></span>随堂练习（${lesson.questions.length} 题 · 全选择题）</div>
        ${lesson.questions.map((q, i) => questionHTML(q, i, 'q')).join('')}
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn primary" id="submitQuiz" style="padding:12px 28px">提交并批改 ✅</button>
        <span class="tiny muted">全部为选择题，点选项即可作答，手机/iPad 也能轻松完成</span>
      </div>`;

    startTimer(host);
    bindQuestionOpts(host, 'q');
    host.querySelector('#playArticle').onclick = () => speak(lesson.articleEN);
    host.querySelector('#toggleCn').onclick = (e) => {
      const el = host.querySelector('#articleCn'); el.classList.toggle('show');
      e.target.textContent = el.classList.contains('show') ? '隐藏中文对照' : '显示中文对照';
    };
    host.querySelectorAll('[data-say]').forEach(el => el.onclick = (e) => { e.stopPropagation(); speak(el.dataset.say); });
    host.querySelector('#submitQuiz').onclick = () => submitQuiz(host);
  }

  function questionHTML(q, i, prefix) {
    const typeName = ({ vocab: '词义', reading: '阅读理解', cloze: '完形填空', listen: '听力', speak: '情景口语' })[q.type] || '选择';
    const audioBtn = q.audio ? `<button class="btn mini ghost" data-say="${App.escape(q.audio)}">🔊 播放录音</button>` : '';
    return `<div class="quiz-q" data-${prefix}="${i}">
      <div class="qrow"><span class="chip mini">${typeName}</span><span class="qtext">${i + 1}. ${audioBtn} ${en(q.q)}</span></div>
      ${q.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}"><span class="opt-key">${String.fromCharCode(65 + j)}</span><span class="opt-txt">${en(o)}</span></label>`).join('')}
    </div>`;
  }

  function bindQuestionOpts(host, prefix) {
    host.querySelectorAll(`.quiz-q[data-${prefix}]`).forEach(q => {
      const i = Number(q.dataset[prefix]);
      q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = (e) => {
        if (e.target.closest('.dict-word')) return; // 点单词是查词，不选答案
        q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected'); answers[prefix + i] = Number(o.dataset.opt);
      });
    });
  }

  function submitQuiz(host) {
    stopTimer();
    let score = 0, total = 0; const details = [];
    lesson.questions.forEach((q, i) => {
      total++; const ok = answers['q' + i] === q.a; if (ok) score++;
      details.push({ type: ({ vocab: '词义', reading: '阅读', cloze: '完形', listen: '听力', speak: '口语' })[q.type],
        ok, q: q.q, correct: String.fromCharCode(65 + q.a) + '. ' + q.opts[q.a], why: q.why,
        mine: answers['q' + i] != null ? String.fromCharCode(65 + answers['q' + i]) : '未作答' });
    });
    const eng = Store.english();
    eng.quizResults.push({ date: Store.todayISO(), day: lesson.n, score, total, at: Date.now() });
    if (!eng.completed.includes(lesson.n)) eng.completed.push(lesson.n);
    if (eng.currentDay <= lesson.n) eng.currentDay = lesson.n + 1;
    // 课程词进入累积单词本（按日期，不覆盖旧词）
    lesson.words.forEach(w => {
      if (!eng.wordBook.some(x => x.en === w.en)) {
        eng.wordBook.push({ en: w.en, zh: w.zh, ex: w.ex, phonetic: Dictionary.lookup(w.en).phonetic,
          pos: Dictionary.lookup(w.en).pos, day: lesson.n, added: Store.todayISO(), source: 'course', box: 0 });
      }
    });
    if (!eng.grammarNotes.some(g => g.title === lesson.grammar.title)) eng.grammarNotes.push(lesson.grammar);
    // 存入每日学习资料库
    eng.notes.push({
      date: Store.todayISO(), day: lesson.n, title: lesson.sc.title,
      articleEN: lesson.articleEN, articleCN: lesson.articleCN,
      words: lesson.words.map(w => ({ en: w.en, zh: w.zh, ex: w.ex })),
      grammar: lesson.grammar, questions: lesson.questions,
      at: Date.now()
    });
    Store.saveEnglish();
    submitted = true; mod._details = details; mod._score = score; mod._total = total;
    renderResult(host);
  }

  function renderResult(host) {
    const pct = Math.round(mod._score / mod._total * 100);
    host.innerHTML = `
      <div class="result-card ${pct >= 70 ? 'good' : 'bad'}">
        <div class="row" style="justify-content:space-between">
          <div><div style="font-size:34px;font-weight:800">${mod._score} / ${mod._total}</div><div class="tiny">正确率 ${pct}% · 今日学习已真实计时记录</div></div>
          <div style="font-size:44px">${pct >= 85 ? '🌟' : pct >= 70 ? '👏' : '💪'}</div>
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>逐题解析 · 纠错 · 方法论</div>
        ${mod._details.map((d, i) => `<div style="padding:12px 0;border-bottom:1px dashed var(--line)">
          <div class="row"><span class="chip" style="${d.ok ? 'background:var(--green-2);color:#2F5C2C' : 'background:#F8D4D2;color:#B96A66'}">${d.ok ? '✓ 正确' : '✕ 错误'}</span><span class="tiny muted">${d.type} · 第 ${i + 1} 题</span></div>
          <div style="margin-top:6px">${en(d.q)}</div>
          ${!d.ok ? `<div class="tiny" style="margin-top:4px;color:#B96A66">你的答案：${App.escape(String(d.mine))}</div>` : ''}
          <div class="tiny" style="margin-top:4px">✅ 正确答案：<b>${App.escape(d.correct)}</b></div>
          <div class="analysis">📌 ${en(d.why)}</div>
        </div>`).join('')}
      </div>
      <div class="row" style="margin-top:18px">
        <button class="btn primary" id="goReview">进入睡前复习 →</button>
        <button class="btn ghost" id="backToday">返回今日学习</button>
      </div>`;
    host.querySelector('#goReview').onclick = () => switchTab('review');
    host.querySelector('#backToday').onclick = () => { submitted = false; answers = {}; lesson = null; mod.render(); };
  }

  /* ---------- 百词斩式复习（四选一，防蒙混） ---------- */
  function renderReview(host) {
    const book = Store.english().wordBook || [];
    if (!reviewPool.length && book.length) reviewPool = shuffle(book).slice(0, 30);
    const w = reviewPool[flashIdx % (reviewPool.length || 1)];
    if (!w) {
      host.innerHTML = `<div class="empty">还没有可复习的单词，先完成今日学习吧 🌱</div>`;
      return;
    }
    // 生成 4 个中文选项
    let opts = [w.zh];
    const distract = shuffle(book.filter(x => x.zh !== w.zh)).slice(0, 3).map(x => x.zh);
    while (opts.length < 4 && distract.length) opts.push(distract.shift());
    opts = shuffle(opts);
    const correctIdx = opts.indexOf(w.zh);
    host.innerHTML = `
      <div class="row wrap" style="margin-bottom:14px"><span class="timer-pill">🌙 百词斩式复习</span><span class="chip">${reviewPool.length} 张</span><span class="tiny muted">看英文选中文，选对才算掌握 · 答对 ${reviewCorrect} 题</span></div>
      <div class="bcz-card">
        <div class="bcz-word">${App.escape(w.en)} <button class="btn mini ghost" id="bczSay">🔊</button></div>
        ${w.phonetic ? `<div class="wc-ph">${App.escape(w.phonetic)}</div>` : ''}
        <div class="bcz-options">
          ${opts.map((o, i) => `<button class="bcz-opt" data-i="${i}">${String.fromCharCode(65 + i)}. ${App.escape(o)}</button>`).join('')}
        </div>
        <div id="bczFeedback" class="bcz-feedback"></div>
      </div>
      <div class="row" style="justify-content:center;margin-top:16px">
        <button class="btn ghost" id="bczDetail">看单词卡详情</button>
        <button class="btn primary" id="bczNext">下一张 →</button>
      </div>
      <div class="tiny muted" style="text-align:center;margin-top:12px">${flashIdx + 1} / ${reviewPool.length}</div>
      <button class="btn ghost sm" id="finishReview" style="display:block;margin:16px auto 0">完成本轮复习 ✓</button>`;
    host.querySelector('#bczSay').onclick = () => speak(w.ex || w.en);
    host.querySelector('#bczDetail').onclick = () => WordCard.show(w.en);
    host.querySelectorAll('.bcz-opt').forEach(b => b.onclick = () => {
      if (flashAnswered) return;
      flashAnswered = true;
      const i = Number(b.dataset.i);
      const ok = i === correctIdx;
      if (ok) reviewCorrect++;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) host.querySelectorAll('.bcz-opt')[correctIdx].classList.add('right');
      host.querySelector('#bczFeedback').innerHTML = ok
        ? `<span style="color:#5C8A52">✓ 正确！${App.escape(w.zh)}</span>`
        : `<span style="color:#B96A66">✕ 正确答案：${App.escape(w.zh)}</span>`;
    });
    host.querySelector('#bczNext').onclick = () => { flashIdx++; flashAnswered = false; renderReview(host); };
    host.querySelector('#finishReview').onclick = () => {
      const eng = Store.english();
      eng.reviews.push({ date: Store.todayISO(), count: reviewPool.length, correct: reviewCorrect, at: Date.now() });
      Store.saveEnglish();
      reviewPool = []; flashIdx = 0; reviewCorrect = 0;
      App.toast(`复习完成，答对 ${reviewCorrect} 题 🌙`); mod.render();
    };
  }

  /* ---------- 累积单词本（按日期分组） ---------- */
  function renderWords(host) {
    const eng = Store.english();
    const q = wordQuery.toLowerCase();
    let list = eng.wordBook.filter(w => !q || (w.en || '').toLowerCase().includes(q) || (w.zh || '').includes(q));
    // 按 added 日期分组（新日期在前）
    const groups = {};
    list.forEach(w => { const dt = w.added || '未标注'; (groups[dt] = groups[dt] || []).push(w); });
    const dates = Object.keys(groups).sort().reverse();
    host.innerHTML = `
      <div class="card">
        <div class="card-title"><span class="dot"></span>📕 我的累积单词本 <span class="tiny muted" style="font-weight:400">· 共 ${eng.wordBook.length} 词 · 按日期累积不覆盖</span></div>
        <input class="input" id="wordSearch" placeholder="搜索单词或中文释义…" value="${App.escape(wordQuery)}">
        <div style="max-height:64vh;overflow-y:auto;margin-top:12px">
          ${dates.length ? dates.map(dt => `
            <div class="wb-group">
              <div class="wb-date">📅 ${App.escape(dt)} · ${groups[dt].length} 词</div>
              ${groups[dt].map(w => `<div class="wb-row">
                <span class="word-en dict-word" data-word="${App.escape(w.en)}">${App.escape(w.en)}</span>
                ${w.phonetic ? `<span class="tiny muted">${App.escape(w.phonetic)}</span>` : ''}
                <span>${App.escape(w.zh)}</span>
                <span class="tiny muted">${App.escape(w.ex || '')}</span>
                <span class="wb-src">${w.source === 'manual' ? '点词加入' : '课程'}</span>
                <button class="wc-play" data-say="${App.escape(w.ex || w.en)}">🔊</button>
              </div>`).join('')}
            </div>`).join('') : `<div class="empty">暂无单词，完成课程或点开文章里的单词加入吧</div>`}
        </div>
      </div>`;
    host.querySelector('#wordSearch').oninput = (e) => {
      wordQuery = e.target.value; renderWords(host);
      const inp = host.querySelector('#wordSearch'); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
    };
    host.querySelectorAll('[data-say]').forEach(el => el.onclick = (e) => { e.stopPropagation(); speak(el.dataset.say); });
  }

  /* ---------- 语法总结 + 练习 ---------- */
  function renderGrammar(host) {
    const eng = Store.english();
    const notes = eng.grammarNotes || [];
    host.innerHTML = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>语法规则卡片 <span class="tiny muted" style="font-weight:400">· 每学一课归纳一个语法点</span></div>
        ${notes.length ? notes.map((g, i) => `<div class="grammar-item" data-gi="${i}">
          <div class="row"><b>${App.escape(g.title)}</b><button class="btn mini" data-practice="${i}" style="margin-left:auto">做练习 →</button></div>
          <div class="tiny muted" style="margin-top:4px">${en(g.rule)}</div>
          <div class="tiny" style="margin-top:4px;color:var(--pink-ink)">💡 ${en(g.tip)}</div>
        </div>`).join('') : '<div class="empty">完成课程后自动归纳语法点</div>'}
      </div>
      <div id="grammarQuizRoot"></div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>答题技巧总纲</div>
        <div class="grid grid-2">
          <div class="tiny">① <b>词义题</b>：回原文定位单词所在句，结合上下文判断。</div>
          <div class="tiny">② <b>细节题</b>：圈出关键词（数字、时间、名词），原文定位后逐词比对。</div>
          <div class="tiny">③ <b>听力题</b>：先抓主干名词与动词，虚词靠语感补。</div>
          <div class="tiny">④ <b>情景题</b>：注意商务礼貌语气，优先 Could you / Would you。</div>
        </div>
      </div>`;
    host.querySelectorAll('[data-practice]').forEach(b => b.onclick = () => {
      const i = Number(b.dataset.practice);
      grammarQuiz = buildGrammarQuiz(notes[i]);
      renderGrammarQuiz(host, notes[i]);
    });
  }

  function buildGrammarQuiz(g) {
    // 每个语法点配 3 道选择题（基于语法标题的规则生成）
    const bank = {
      '情态动词表委婉请求': [
        { q: '_____ you send us a quote?（更礼貌）', opts: ['Can', 'Could', 'Will', 'Must'], a: 1, why: 'Could you 比 Can you 更委婉礼貌，适合商务邮件。' },
        { q: '_____ you mind opening the window?', opts: ['Would', 'Do', 'Are', 'Have'], a: 0, why: 'Would you mind + doing 是固定礼貌句式。' }
      ],
      '条件句表让步与结果': [
        { q: 'If you _____ the volume, we will give you a better price.', opts: ['increase', 'increases', 'increased', 'will increase'], a: 0, why: '真实条件句：If + 一般现在时，主句 will + 动词原形。' },
        { q: 'If it _____ tomorrow, we will delay the shipment.', opts: ['rain', 'rains', 'rained', 'raining'], a: 1, why: '第三人称单数用 rains，主句 will delay。' }
      ],
      'so...that 与 so 表结果': [
        { q: 'The margin is thin, _____ the price is firm.', opts: ['but', 'so', 'because', 'although'], a: 1, why: 'so 表结果：利润薄，所以价格不能降。' },
        { q: 'It was _____ expensive that we could not afford it.', opts: ['so', 'such', 'very', 'too'], a: 0, why: 'so + adj + that 从句。' }
      ],
      '被动语态在商务中的应用': [
        { q: 'The goods _____ on Friday.', opts: ['ship', 'are shipped', 'shipping', 'shipped'], a: 1, why: '被动语态 be + 过去分词：are shipped。' },
        { q: 'The invoice _____ by email yesterday.', opts: ['sent', 'was sent', 'is sending', 'sends'], a: 1, why: '过去被动：was sent。' }
      ],
      '时间状语与介词': [
        { q: 'Please finalize the design _____ Friday.', opts: ['within', 'by', 'after', 'in'], a: 1, why: 'by + 时间点表示"最迟、截止"。' },
        { q: 'We will resolve it _____ 48 hours.', opts: ['by', 'on', 'within', 'at'], a: 2, why: 'within + 时间段表示"在…之内"。' }
      ],
      '高频商务习语': [
        { q: '"on the same page" 的意思是？', opts: ['在同一页', '意见一致', '一起阅读', '在同一房间'], a: 1, why: 'on the same page = 意见一致。' },
        { q: '"win-win" 的意思是？', opts: ['双赢', '胜负', '平局', '单赢'], a: 0, why: 'win-win = 双赢。' }
      ],
      '名词化结构': [
        { q: 'reach a _____（做决定，更正式）', opts: ['decide', 'decision', 'deciding', 'decided'], a: 1, why: '名词化：reach a decision 比 decide 更正式。' },
        { q: 'We made an _____ to the plan.', opts: ['improve', 'improvement', 'improving', 'improved'], a: 1, why: 'make an improvement，用名词。' }
      ],
      '异议与转折表达': [
        { q: 'We can be flexible on design. _____, the price is firm.', opts: ['However', 'Also', 'And', 'So'], a: 0, why: 'However 表转折，后常加逗号。' },
        { q: '_____ he is young, he is experienced.', opts: ['Although', 'But', 'However', 'Therefore'], a: 0, why: 'Although 引导让步状语从句。' }
      ]
    };
    const qs = bank[g.title] || bank['高频商务习语'];
    return shuffle(qs).slice(0, 3).map(q => ({ q: q.q, opts: q.opts, a: q.a, why: q.why }));
  }

  function renderGrammarQuiz(host, g) {
    const root = host.querySelector('#grammarQuizRoot');
    root.innerHTML = `<div class="card" style="margin-top:16px">
      <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>语法练习：${App.escape(g.title)}</div>
      ${grammarQuiz.map((q, i) => `<div class="quiz-q" data-gq="${i}">
        <div class="qtext">${i + 1}. ${en(q.q)}</div>
        ${q.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}"><span class="opt-key">${String.fromCharCode(65 + j)}</span><span class="opt-txt">${en(o)}</span></label>`).join('')}
        <div class="gq-why" id="gqWhy${i}"></div>
      </div>`).join('')}
      <button class="btn primary sm" id="checkGrammar" style="margin-top:12px">批改练习</button>
    </div>`;
    let ans = {};
    root.querySelectorAll('.quiz-q[data-gq]').forEach(q => {
      const i = Number(q.dataset.gq);
      q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = (e) => {
        if (e.target.closest('.dict-word')) return;
        q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
        o.classList.add('selected'); ans[i] = Number(o.dataset.opt);
      });
    });
    root.querySelector('#checkGrammar').onclick = () => {
      let s = 0;
      grammarQuiz.forEach((q, i) => {
        const ok = ans[i] === q.a; if (ok) s++;
        const why = root.querySelector('#gqWhy' + i);
        why.innerHTML = `<div class="analysis">${ok ? '✓ 正确！' : '✕ '} ${en(q.why)}</div>`;
      });
      App.toast(`语法练习：${s}/${grammarQuiz.length}`);
    };
  }

  /* ---------- 周测月测 + 试卷夹 ---------- */
  function buildTest(kind) {
    const eng = Store.english();
    const today = Store.todayISO();
    const dow = (new Date(today).getDay() + 6) % 7;
    let pool;
    if (kind === 'weekly') pool = (eng.wordBook || []).filter(w => w.added >= Data.addDays(today, -dow - 7));
    else {
      const y = new Date(today).getFullYear(), m = new Date(today).getMonth() + 1;
      pool = (eng.wordBook || []).filter(w => w.added >= Data.iso(y, m - 2, 1));
    }
    if (!pool || pool.length < 4) pool = (eng.wordBook || []).slice(-20);
    const qs = shuffle(pool).slice(0, 10).map(w => {
      const opts = shuffle([w.zh, ...shuffle((eng.wordBook || []).filter(x => x.zh !== w.zh)).slice(0, 3).map(x => x.zh)]);
      return { q: `“${w.en}” 的意思是？`, opts, a: opts.indexOf(w.zh), why: `${w.en} = ${w.zh}。${w.ex || ''}` };
    });
    return { kind, qs, ans: {}, date: today };
  }

  function renderTests(host) {
    const eng = Store.english();
    if (test) {
      host.innerHTML = `<div class="card">
        <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>${test.kind === 'weekly' ? '周测' : '月测'}试卷（10 题）</div>
        ${test.qs.map((q, i) => `<div class="quiz-q" data-tq="${i}">
          <div class="qtext">${i + 1}. ${en(q.q)}</div>
          ${q.opts.map((o, j) => `<label class="quiz-opt" data-opt="${j}"><span class="opt-key">${String.fromCharCode(65 + j)}</span><span class="opt-txt">${en(o)}</span></label>`).join('')}
        </div>`).join('')}
        <button class="btn primary" id="submitTest" style="margin-top:16px">提交试卷 ✅</button>
      </div>`;
      host.querySelectorAll('.quiz-q[data-tq]').forEach(q => {
        const i = Number(q.dataset.tq);
        q.querySelectorAll('.quiz-opt').forEach(o => o.onclick = (e) => {
          if (e.target.closest('.dict-word')) return;
          q.querySelectorAll('.quiz-opt').forEach(x => x.classList.remove('selected'));
          o.classList.add('selected'); test.ans[i] = Number(o.dataset.opt);
        });
      });
      host.querySelector('#submitTest').onclick = () => {
        let s = 0; test.qs.forEach((q, i) => { if (test.ans[i] === q.a) s++; });
        const answersDetail = test.qs.map((q, i) => ({ q: q.q, opts: q.opts, a: q.a, mine: test.ans[i] ?? null, why: q.why }));
        eng.tests.push({ kind: test.kind, date: test.date, score: s, total: test.qs.length, at: Date.now() });
        eng.papers.push({ id: 'p' + Date.now(), kind: test.kind, date: test.date, score: s, total: test.qs.length,
          answers: answersDetail, at: Date.now() });
        Store.saveEnglish();
        const kind = test.kind, score = s; test = null;
        App.toast(`测试完成：${score}/10，已存入试卷夹`); mod.render();
      };
      return;
    }
    const now = new Date(Store.todayISO());
    const td = Data.testDatesInMonth(now.getFullYear(), now.getMonth() + 1);
    host.innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--lavender)"></span>本月考试日程</div>
          <div class="tiny muted">周测（每周日）：${td.weekly.join('、') || '无'}</div>
          <div class="tiny muted" style="margin-top:6px">月测（月末）：${td.monthly}</div>
          <div class="row wrap" style="margin-top:14px">
            <button class="btn primary" id="startWeekly">开始周测</button>
            <button class="btn" id="startMonthly" style="background:var(--lavender);color:#6E5A87">开始月测</button>
          </div>
          <p class="tiny muted" style="margin-top:12px">月测会加入更早学过的词，防止遗忘。全部为选择题。</p>
        </div>
        <div class="card">
          <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>历史成绩</div>
          ${eng.tests.length ? eng.tests.slice().reverse().slice(0, 8).map(t => `<div class="row" style="padding:7px 0;border-bottom:1px dashed var(--line)"><span class="chip">${t.kind === 'weekly' ? '周测' : '月测'}</span><span class="tiny muted">${t.date}</span><div class="spacer"></div><b>${t.score}/${t.total}</b></div>`).join('') : '<div class="empty">还没有考试记录</div>'}
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot" style="background:var(--yellow-2)"></span>📁 试卷夹 <span class="tiny muted" style="font-weight:400">· 所有测试存档，随时翻看</span></div>
        ${eng.papers && eng.papers.length ? `<div class="paper-grid">${eng.papers.slice().reverse().map(p => `
          <button class="paper-item" data-paper="${p.id}">
            <div class="pi-kind">${p.kind === 'weekly' ? '📅 周测' : '🗓 月测'}</div>
            <div class="pi-score">${p.score}/${p.total}</div>
            <div class="tiny muted">${p.date}</div>
          </button>`).join('')}</div>` : '<div class="empty">完成测试后会自动存档到这里</div>'}
      </div>`;
    host.querySelector('#startWeekly').onclick = () => { test = buildTest('weekly'); renderTests(host); };
    host.querySelector('#startMonthly').onclick = () => { test = buildTest('monthly'); renderTests(host); };
    host.querySelectorAll('[data-paper]').forEach(b => b.onclick = () => {
      const p = eng.papers.find(x => x.id === b.dataset.paper);
      if (!p) return;
      App.modal(`<h3>${p.kind === 'weekly' ? '周测' : '月测'}试卷 · ${p.date}</h3>
        <div class="tiny muted">得分 ${p.score}/${p.total}</div>
        <div style="max-height:62vh;overflow-y:auto;margin-top:10px">
          ${p.answers.map((q, i) => `<div style="padding:10px 0;border-bottom:1px dashed var(--line)">
            <div>${i + 1}. ${en(q.q)}</div>
            <div class="tiny">你的答案：${q.mine != null ? String.fromCharCode(65 + q.mine) + '. ' + en(q.opts[q.mine]) : '未作答'}</div>
            <div class="tiny" style="color:#5C8A52">正确答案：${String.fromCharCode(65 + q.a)}. ${en(q.opts[q.a])}</div>
            <div class="analysis">${en(q.why)}</div>
          </div>`).join('')}
        </div>
        <div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn ghost" onclick="App.closeModal()">关闭</button></div>`);
    });
  }

  /* ---------- 学习资料库 ---------- */
  function renderLibrary(host) {
    const notes = Store.english().notes || [];
    host.innerHTML = `
      <div class="card">
        <div class="card-title"><span class="dot" style="background:var(--green-2)"></span>📚 学习资料库 <span class="tiny muted" style="font-weight:400">· 每天学过的内容自动归档，可随时复习</span></div>
        ${notes.length ? notes.slice().reverse().map(n => `
          <div class="lib-item">
            <div class="row"><b>${App.escape(n.title)}</b><span class="tiny muted" style="margin-left:auto">${App.escape(n.date)}</span></div>
            <button class="btn mini ghost" data-lib="${n.at}">展开复习 →</button>
          </div>`).join('') : '<div class="empty">完成每日学习后，知识点会自动归档到这里</div>'}
      </div>
      <div id="libDetailRoot"></div>`;
    host.querySelectorAll('[data-lib]').forEach(b => b.onclick = () => {
      const n = notes.find(x => x.at === Number(b.dataset.lib));
      if (!n) return;
      const root = host.querySelector('#libDetailRoot');
      root.innerHTML = `<div class="card" style="margin-top:16px">
        <div class="card-title"><span class="dot"></span>${App.escape(n.title)} · 复习资料</div>
        <div class="wc-sec-t">📖 课文</div>
        <div class="article-en">${en(n.articleEN)}</div>
        <div class="article-cn show">${App.escape(n.articleCN)}</div>
        <div class="wc-sec-t" style="margin-top:12px">📝 本课词汇（${n.words.length}）</div>
        <div class="row wrap">${n.words.map(w => `<span class="chip dict-word" data-word="${App.escape(w.en)}" title="${App.escape(w.zh)}">${App.escape(w.en)}</span>`).join('')}</div>
        <div class="wc-sec-t" style="margin-top:12px">📐 本课语法</div>
        <div class="tiny">${App.escape(n.grammar.title)}：${en(n.grammar.rule)}</div>
        <div class="tiny" style="margin-top:4px;color:var(--pink-ink)">💡 ${en(n.grammar.tip)}</div>
      </div>`;
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function switchTab(t) { tab = t; stopTimer(); lesson = null; mod.render(); }

  mod.render = function () {
    const tabs = [
      ['dashboard', '📊 数据看板'], ['today', '📖 今日学习'], ['review', '🔁 复习巩固'],
      ['words', '📕 单词本'], ['library', '📚 资料库'], ['grammar', '📐 语法'],
      ['tests', '📅 测试/试卷夹']
    ];
    const root = document.getElementById('view-english');
    root.innerHTML = `
      <div class="section-head"><h2>🇬🇧 英语学习</h2><span class="sub">商务英语 · 外贸实战 · 即点即查词</span></div>
      <div class="eng-tabs">${tabs.map(([k, l]) => `<button class="tab ${k === tab ? 'active' : ''}" data-tab="${k}">${l}</button>`).join('')}</div>
      <div id="engBody"></div>`;
    root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => switchTab(b.dataset.tab));
    const host = root.querySelector('#engBody');
    if (tab === 'dashboard') renderDashboard(host);
    else if (tab === 'today') renderToday(host);
    else if (tab === 'review') renderReview(host);
    else if (tab === 'words') renderWords(host);
    else if (tab === 'library') renderLibrary(host);
    else if (tab === 'grammar') renderGrammar(host);
    else if (tab === 'tests') renderTests(host);
  };

  // 离开英语板块时确保计时落盘
  const _origGo = null;
  document.addEventListener('visibilitychange', () => { if (document.hidden && tab === 'today') stopTimer(); });

  global.English = mod;
  (global.__MODULES__ = global.__MODULES__ || {})['english'] = mod;
})(window);
