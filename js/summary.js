/* 智能周/月总结：基于全量数据分析生成，定时推送（周六21点 / 月末21点） */
(function (global) {
  const Summary = {};
  const META_KEY = 'shushu_summary_meta_v1'; // { lastWeekly, lastMonthly }

  function getMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function setMeta(m) { localStorage.setItem(META_KEY, JSON.stringify(m)); }

  function parse(s) { return Data.parse(s); }
  function addDays(s, n) { return Data.addDays(s, n); }
  function today() { return Store.todayISO(); }

  /** 汇总指定日期区间的数据 */
  function collect(start, end) {
    const all = Store.load();
    const days = all.days || {};
    let todosTotal = 0, todosDone = 0, waterCups = 0, sleepSum = 0, sleepN = 0;
    let exerciseDays = 0, resistMin = 0, aerobicMin = 0, foodsN = 0;
    let engSec = 0, diaries = [], activeDays = 0;
    Object.keys(days).forEach(k => {
      if (k < start || k > end) return;
      activeDays++;
      const d = days[k] || {};
      const todos = d.todo || [];
      todosTotal += todos.length; todosDone += todos.filter(t => t && t.done).length;
      waterCups += (d.water || 0);
      if (d.sleep) { sleepSum += Number(d.sleep) || 0; sleepN++; }
      if (d.exerciseCheck) exerciseDays++;
      resistMin += Number(d.resistance && d.resistance.min) || 0;
      aerobicMin += Number(d.aerobic && d.aerobic.min) || 0;
      foodsN += (d.foods || []).length;
      engSec += (all.english.studyLog && all.english.studyLog[k]) || 0;
      if (d.diary && (d.diary.text || d.diary.mood)) diaries.push({ date: k, text: d.diary.text || '', mood: d.diary.mood || '' });
    });
    const eng = all.english || {};
    const newWords = (eng.wordBook || []).filter(w => w.added && w.added >= start && w.added <= end);
    const quizzes = (eng.quizResults || []).filter(q => q.date >= start && q.date <= end);
    const tests = (eng.tests || []).filter(t => t.date >= start && t.date <= end);
    return {
      start, end, activeDays, todosTotal, todosDone,
      todoRate: todosTotal ? Math.round(todosDone / todosTotal * 100) : 0,
      waterMl: waterCups * 500, sleepAvg: sleepN ? (sleepSum / sleepN).toFixed(1) : '—',
      exerciseDays, resistMin, aerobicMin, foodsN,
      engMin: Math.round(engSec / 60), newWords: newWords.length,
      quizAvg: quizzes.length ? Math.round(quizzes.reduce((s, q) => s + q.score / (q.total || 1), 0) / quizzes.length * 100) : null,
      tests: tests.length, diaries
    };
  }

  /** 生成总结文本（做了什么 / 收获 / 建议） */
  function compose(kind, s) {
    const periodLabel = kind === 'weekly' ? '本周' : '本月';
    const did = [];
    did.push(`记录生活 ${s.activeDays} 天`);
    did.push(`完成待办 ${s.todosDone}/${s.todosTotal} 项（完成率 ${s.todoRate}%）`);
    if (s.exerciseDays) did.push(`运动打卡 ${s.exerciseDays} 天，抗阻 ${s.resistMin} 分钟、有氧 ${s.aerobicMin} 分钟`);
    if (s.engMin) did.push(`英语学习 ${s.engMin} 分钟，新增词汇 ${s.newWords} 个`);
    if (s.tests) did.push(`完成 ${s.tests} 次测试`);
    if (s.diaries.length) did.push(`写下 ${s.diaries.length} 篇日记`);
    if (s.foodsN) did.push(`记录 ${s.foodsN} 次饮食`);

    const gain = [];
    if (s.todoRate >= 80) gain.push('待办完成率很高，执行力稳定，把计划落到了实处。');
    else if (s.todoRate >= 50) gain.push('待办完成过半，节奏不错，仍有提升空间。');
    else if (s.todosTotal) gain.push('待办完成率偏低，可能是任务排得太满，建议精简到每天 3 件最重要的事。');
    if (s.engMin >= 150) gain.push('英语投入充足，累积效应正在形成，继续保持每日接触。');
    else if (s.engMin >= 60) gain.push('英语保持了一定的连续性，语言学习贵在坚持。');
    if (s.exerciseDays >= 3) gain.push('运动习惯正在建立，身体是长期战斗力的根基。');
    if (s.diaries.length >= 3) gain.push('持续记录情绪与思考，这是很宝贵的自我觉察习惯。');
    if (s.sleepAvg !== '—' && Number(s.sleepAvg) >= 5) gain.push(`平均睡眠 ${s.sleepAvg} 小时，达到了你给自己设定的目标。`);
    else if (s.sleepAvg !== '—') gain.push(`平均睡眠 ${s.sleepAvg} 小时，略低于 5 小时目标，注意补觉。`);
    if (!gain.length) gain.push('这段时间主要在休整，也是节奏的一部分，不必苛责自己。');

    const advice = [];
    if (s.todoRate < 70) advice.push('① 用「三件事法则」：每天只锁定 3 件最重要的待办，完成后再考虑其它，完成感会明显提升。');
    if (s.engMin < 120) advice.push('② 英语可以碎片化：早晚各 10 分钟单词卡 + 通勤听音频，累积比单次突击更有效。');
    if (s.exerciseDays < 3) advice.push('③ 运动从「每天 5 分钟」起步，先建立不断链的习惯，再逐步加量。');
    if (s.waterMl < 20000) advice.push('④ 饮水偏少，可以在桌面放一个水杯提醒，补水对精力和皮肤都很重要。');
    advice.push('⑤ 结合品牌创业，建议把每周最有价值的客户反馈或灵感，沉淀成一条「品牌洞察」笔记，长期会成为你的竞争壁垒。');
    if (kind === 'monthly') advice.push('⑥ 月末花 20 分钟回顾这个月的核心进展与卡点，写下下月唯一的关键目标，聚焦比发散更有力量。');

    const moodSummary = s.diaries.length
      ? `这${periodLabel}你记录了 ${s.diaries.length} 篇心情日记，最近的关键词是「${(s.diaries.slice(-3).map(x => x.mood).filter(Boolean).join('、') || '平静')}」。`
      : `这${periodLabel}还没有写日记，给自己留一点记录情绪的时间吧。`;

    return {
      kind, periodLabel, range: `${s.start} ~ ${s.end}`,
      did, gain, advice, moodSummary,
      stats: s,
      createdAt: Date.now()
    };
  }

  /** 生成并存档一份总结 */
  function generate(kind) {
    const tdy = today();
    let start, end = tdy;
    if (kind === 'weekly') {
      // 最近 7 天
      start = addDays(tdy, -6);
    } else {
      // 当月 1 号到今天
      start = tdy.slice(0, 8) + '01';
    }
    const s = collect(start, end);
    const result = compose(kind, s);
    const all = Store.load();
    all.summaries = all.summaries || [];
    all.summaries.unshift(result);
    if (all.summaries.length > 60) all.summaries.length = 60;
    Store.save();
    return result;
  }

  /** 渲染总结为 HTML */
  function toHTML(r) {
    return `
      <div class="summary-card">
        <div class="row" style="justify-content:space-between">
          <b>📊 ${r.periodLabel}总结</b>
          <span class="tiny muted">${r.range}</span>
        </div>
        <div class="wc-sec-t" style="margin-top:10px">✅ 这${r.periodLabel}做了什么</div>
        <ul class="summary-list">${r.did.map(x => `<li>${App.escape(x)}</li>`).join('')}</ul>
        <div class="wc-sec-t" style="margin-top:8px">🌱 收获与变化</div>
        <ul class="summary-list">${r.gain.map(x => `<li>${App.escape(x)}</li>`).join('')}</ul>
        <div class="wc-sec-t" style="margin-top:8px">💡 给你的建议</div>
        <ul class="summary-list">${r.advice.map(x => `<li>${App.escape(x)}</li>`).join('')}</ul>
        <div class="tiny muted" style="margin-top:10px">${App.escape(r.moodSummary)}</div>
      </div>`;
  }

  /** 请求通知权限（在用户交互时调用成功率更高） */
  function requestNotify() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }
  function pushNotify(title, body) {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: 'icons/icon-192.png' });
      } else if (global.App && App.toast) {
        App.toast(title + ' · ' + body);
      }
    } catch (e) {}
  }

  /** 定时检查：周六 21:00 周总结，月末 21:00 月总结（本地时区） */
  function checkSchedule() {
    const now = new Date();
    const h = now.getHours();
    if (h !== 21) return; // 只在 21 点档触发
    const key = today() + '-' + h;
    const meta = getMeta();
    const dow = now.getDay(); // 0=周日, 6=周六
    const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    // 周六
    if (dow === 6 && meta.lastWeekly !== key) {
      meta.lastWeekly = key; setMeta(meta);
      const r = generate('weekly');
      pushNotify('🌸 树树的本周总结已生成', `完成待办 ${r.stats.todosDone} 项 · 英语 ${r.stats.engMin} 分钟 · 点开首页查看`);
    }
    // 月末
    if (now.getDate() === dim && meta.lastMonthly !== key) {
      meta.lastMonthly = key; setMeta(meta);
      const r = generate('monthly');
      pushNotify('🌙 树树的本月总结已生成', `完成率 ${r.stats.todoRate}% · 新词 ${r.stats.newWords} 个 · 点开首页查看`);
    }
  }

  Summary.generate = generate;
  Summary.toHTML = toHTML;
  Summary.collect = collect;
  Summary.requestNotify = requestNotify;
  Summary.checkSchedule = checkSchedule;
  Summary.all = function () { return (Store.load().summaries) || []; };

  Summary.init = function () {
    requestNotify();
    checkSchedule();
    // 每 10 分钟检查一次是否到点
    setInterval(checkSchedule, 10 * 60 * 1000);
  };

  global.Summary = Summary;
})(window);
