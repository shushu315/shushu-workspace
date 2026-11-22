/* 共享数据：节假日 / 电商节点 / 双语鸡汤 / 补剂 / 经期计算 / 考试日程 */
(function (global) {
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(y, m, d) { return `${y}-${pad(m)}-${pad(d)}`; }
  function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function toISO(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + n); return toISO(d); }
  function diffDays(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function weekdayCN(s) { return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][parse(s).getDay()]; }

  /* ---------- 节假日（公历 + 农历固定日期，覆盖 2025-2028） ---------- */
  const HOLIDAY_MAP = {
    // 2025
    '2025-01-01': '元旦', '2025-01-28': '除夕', '2025-01-29': '春节', '2025-02-12': '元宵节',
    '2025-04-04': '清明节', '2025-05-01': '劳动节', '2025-05-31': '端午节', '2025-08-29': '七夕节',
    '2025-10-01': '国庆节', '2025-10-06': '中秋节', '2025-10-29': '重阳节',
    // 2026
    '2026-01-01': '元旦', '2026-02-16': '除夕', '2026-02-17': '春节', '2026-03-03': '元宵节',
    '2026-04-05': '清明节', '2026-05-01': '劳动节', '2026-06-19': '端午节', '2026-08-19': '七夕节',
    '2026-09-25': '中秋节', '2026-10-01': '国庆节', '2026-10-18': '重阳节',
    // 2027
    '2027-01-01': '元旦', '2027-02-05': '除夕', '2027-02-06': '春节', '2027-02-20': '元宵节',
    '2027-04-05': '清明节', '2027-05-01': '劳动节', '2027-06-09': '端午节', '2027-08-08': '七夕节',
    '2027-09-15': '中秋节', '2027-10-01': '国庆节', '2027-10-08': '重阳节',
    // 2028
    '2028-01-01': '元旦', '2028-01-25': '除夕', '2028-01-26': '春节', '2028-02-09': '元宵节',
    '2028-04-04': '清明节', '2028-05-01': '劳动节', '2028-05-28': '端午节', '2028-08-26': '七夕节',
    '2028-09-28': '中秋节', '2028-10-01': '国庆节', '2028-10-26': '重阳节'
  };

  /* ---------- 电商营销节点（每年循环，按公历月-日） ---------- */
  const ECOM_BY_MD = {
    '01-01': '年货节', '02-14': '情人节', '03-08': '女神节', '03-15': '品质消费日',
    '04-19': '春夏焕新季', '05-01': '五一大促', '05-20': '520 告白日', '06-01': '儿童节',
    '06-18': '618 年中大促', '07-07': '会员日', '08-18': '818 发烧购物节',
    '09-09': '99 划算节', '10-01': '国庆焕新季', '10-21': '双11 预售', '11-01': '双11 开门红',
    '11-11': '双十一', '12-01': '双12 预售', '12-12': '双十二', '12-24': '平安夜', '12-25': '圣诞节'
  };

  function nodesOf(dateStr) {
    const holiday = HOLIDAY_MAP[dateStr] || null;
    const md = dateStr.slice(5);
    const ecom = ECOM_BY_MD[md] || null;
    return { holiday, ecom };
  }

  function nodesText(dateStr) {
    const { holiday, ecom } = nodesOf(dateStr);
    const arr = [];
    if (holiday) arr.push('🎀 ' + holiday);
    if (ecom) arr.push('🛒 ' + ecom);
    return arr.join('  ·  ');
  }

  /* ---------- 每日双语心灵鸡汤（文艺成长向，短句 + emoji） ---------- */
  const QUOTES = [
    { cn: '你只管向阳生长，风自会把种子带去远方。', en: 'Just grow toward the sun — the wind will carry your seeds far.', em: '🌿' },
    { cn: '把热爱熬成光，照亮自己，也温暖同行的人。', en: 'Turn your passion into light — for yourself and those beside you.', em: '✨' },
    { cn: '慢一点没关系，只要方向是你想要的。', en: 'Slow is fine, as long as you are heading where you want.', em: '🐢' },
    { cn: '认真生活的每一天，都在为未来悄悄存钱。', en: 'Every day lived earnestly is a quiet deposit on your future.', em: '🌱' },
    { cn: '别急着开花，先好好扎根。', en: 'Do not rush to bloom; take time to root deeply first.', em: '🌳' },
    { cn: '你今日埋头的样子，是明日惊喜的伏笔。', en: 'The way you bury yourself in work today is the prologue to tomorrow’s surprise.', em: '🌷' },
    { cn: '允许自己慢慢来，但不允许自己停下。', en: 'Allow yourself to go slow, but never to stop.', em: '🕊️' },
    { cn: '把复杂的事做简单，就是最大的温柔。', en: 'Making complicated things simple is the greatest kind of gentleness.', em: '🫧' },
    { cn: '星光不问赶路人，时光不负有心人。', en: 'Stars do not ask the traveler; time never fails the earnest heart.', em: '🌟' },
    { cn: '先成为自己的靠山，再谈其他。', en: 'Be your own anchor before anything else.', em: '⛰️' },
    { cn: '生活不是等待暴风雨过去，而是学会在雨中起舞。', en: 'Life is not about waiting for the storm to pass, but learning to dance in the rain.', em: '🌧️' },
    { cn: '你比自己以为的，更能扛事，也更值得。', en: 'You are more capable — and more deserving — than you think.', em: '💫' },
    { cn: '把今天过好，就是对未来最好的交代。', en: 'Living today well is the best answer to your future.', em: '🍃' },
    { cn: '热爱可抵岁月漫长，细节可抵世间慌张。', en: 'Passion outlasts the long years; care outlasts the hurry of the world.', em: '🕯️' },
    { cn: '每一次整理，都是和自己的重新对话。', en: 'Every tidy-up is a fresh conversation with yourself.', em: '🧺' },
    { cn: '不必事事完美，但要事事有回声。', en: 'Not everything must be perfect, but everything should leave an echo.', em: '🔔' },
    { cn: '你种下的秩序，终会长成自由。', en: 'The order you plant will one day grow into freedom.', em: '🌾' },
    { cn: '早起的困倦，是梦想在跟你打招呼。', en: 'The tiredness of early rising is your dream saying hello.', em: '🌅' },
    { cn: '把注意力放在能控制的事上，焦虑就少了一半。', en: 'Focus on what you can control, and half your anxiety fades.', em: '🧭' },
    { cn: '认真的人，运气都不会太差。', en: 'Luck rarely fails those who take life seriously.', em: '🍀' },
    { cn: '给自己一点耐心，花有花期，你有你的节奏。', en: 'Be patient with yourself — flowers have their season, and you have yours.', em: '🌸' },
    { cn: '完成，比完美更重要。', en: 'Done is better than perfect.', em: '✅' },
    { cn: '你今天的坚持，会变成明天的底气。', en: 'Today’s persistence becomes tomorrow’s confidence.', em: '💪' },
    { cn: '把碎片串起来，就是你的星河。', en: 'String the fragments together, and they become your galaxy.', em: '🌌' },
    { cn: '越努力，越幸运，越清醒。', en: 'The harder you work, the luckier and clearer you become.', em: '🪞' },
    { cn: '温柔且有力量，是我给你的最好祝福。', en: 'Gentle yet strong — that is the best blessing I can give you.', em: '🤍' },
    { cn: '别怕慢，就怕站；别怕难，就怕烦。', en: 'Fear not slowness, but standing still; fear not difficulty, but losing heart.', em: '🪜' },
    { cn: '所有看似随便的成功，都是处心积虑的坚持。', en: 'Every effortless-looking success is a well-planned persistence.', em: '🎯' },
    { cn: '把日子过成喜欢的样子，就是最好的创作。', en: 'Living a life you love is the greatest creation of all.', em: '🎨' },
    { cn: '今天也是值得全力以赴的一天，加油，树树。', en: 'Today is another day worth giving your all. Go, Shushu!', em: '🌈' }
  ];

  function quoteOf(dateStr) {
    const base = parse('2024-01-01');
    const idx = Math.abs(diffDays(toISO(base), dateStr)) % QUOTES.length;
    return QUOTES[idx];
  }

  /* ---------- 补剂清单 ---------- */
  const SUPPLEMENTS = ['维生素B', '维生素D', '肌醇', '鱼油', '姜黄素', '益生菌', '生物素', '补铁软糖'];

  /* ---------- 经期计算 ---------- */
  function periodInfo(profile, todayStr) {
    const cycle = Math.max(18, Number(profile.cycleLength) || 28);
    const len = Math.max(2, Number(profile.periodLength) || 5);
    let start = profile.lastPeriodStart || addDays(todayStr, -16);
    // 推进到 >= 今天的最近一次周期起点
    while (diffDays(start, todayStr) >= cycle) start = addDays(start, cycle);
    while (diffDays(start, todayStr) < 0) start = addDays(start, -cycle);
    let next = start;
    if (diffDays(todayStr, next) < 0) next = addDays(next, cycle); // 今天已过本周期起点
    const daysUntil = diffDays(todayStr, next);
    const isPeriod = diffDays(start, todayStr) >= 0 && diffDays(start, todayStr) < len;
    // 生成未来 3 个周期的经期日期
    const periodDates = {};
    for (let i = -2; i <= 3; i++) {
      const s = addDays(next, i * cycle);
      for (let j = 0; j < len; j++) periodDates[addDays(s, j)] = true;
    }
    return { nextStart: next, daysUntil, isPeriod, periodDates, cycle, len };
  }

  /* ---------- 周测 / 月测日程 ---------- */
  function testDatesInMonth(year, month) {
    const lastDay = new Date(year, month, 0).getDate();
    const monthly = iso(year, month, lastDay);
    const weeklies = [];
    const d = new Date(year, month - 1, 1);
    while (d.getMonth() === month - 1) {
      if (d.getDay() === 0) weeklies.push(iso(year, month, d.getDate()));
      d.setDate(d.getDate() + 1);
    }
    return { weekly: weeklies, monthly };
  }

  global.Data = {
    pad, iso, parse, toISO, addDays, diffDays, weekdayCN,
    nodesOf, nodesText, QUOTES, quoteOf, SUPPLEMENTS, periodInfo, testDatesInMonth,
    HOLIDAY_MAP, ECOM_BY_MD
  };
})(window);
