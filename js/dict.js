/* 词典增强层：为单词卡提供 释义/词性/搭配/例句/易混词/音标
 * 复用 EnglishContent.WORDS 作为基础词库，并补充音标、词性、搭配、易混词。
 * 任何页面出现的英文单词都可通过 Dictionary.lookup(word) 拿到一张完整的卡片数据。
 */
(function (global) {
  // 词性映射（按词形/词尾规则推断 + 高频词覆盖）
  const POS_OVERRIDE = {
    'quote': 'v. / n.', 'quotation': 'n.', 'inquiry': 'n.', 'MOQ': 'n.（缩写）', 'lead time': 'n.',
    'FOB': 'n.（缩写）', 'CIF': 'n.（缩写）', 'sample': 'n. / v.', 'specification': 'n.', 'catalog': 'n.',
    'unit price': 'n.', 'discount': 'n. / v.', 'validity': 'n.', 'bulk order': 'n.', 'payment terms': 'n.',
    'price list': 'n.', 'request': 'v. / n.', 'available': 'adj.', 'detail': 'n.', 'follow up': 'v.',
    'negotiate': 'v.', 'negotiation': 'n.', 'margin': 'n.', 'concession': 'n.', 'counterpart': 'n.',
    'terms': 'n.', 'volume': 'n.', 'competitive': 'adj.', 'acceptable': 'adj.', 'compromise': 'n. / v.',
    'win-win': 'adj. / n.', 'budget': 'n.', 'firm': 'adj.', 'meet halfway': 'phrase', 'leverage': 'v. / n.',
    'proposal': 'n.', 'counteroffer': 'n.', 'agree on': 'phrase', 'flexible': 'adj.', 'bottom line': 'n.',
    'confirm': 'v.', 'deposit': 'n.', 'production schedule': 'n.', 'workshop': 'n.', 'quality control': 'n.',
    'inspection': 'n.', 'delay': 'n. / v.', 'capacity': 'n.', 'raw material': 'n.', 'craftsmanship': 'n.',
    'sample approval': 'n.', 'mass production': 'n.', 'quality standard': 'n.', 'defect': 'n.', 'rework': 'n. / v.',
    'supplier': 'n.', 'in stock': 'phrase', 'out of stock': 'phrase', 'process': 'n. / v.', 'finalize': 'v.',
    'shipment': 'n.', 'carrier': 'n.', 'tracking number': 'n.', 'customs': 'n.', 'invoice': 'n.',
    'packing list': 'n.', 'delivery': 'n.', 'warehouse': 'n.', 'freight': 'n.', 'insurance': 'n.',
    'bill of lading': 'n.', 'clearance': 'n.', 'dispatch': 'v. / n.', 'eta': 'n.（缩写）', 'fragile': 'adj.',
    'package': 'n. / v.', 'consignee': 'n.', 'port': 'n.', 'container': 'n.', 'on time': 'phrase',
    'campaign': 'n.', 'listing': 'n.', 'conversion': 'n.', 'engagement': 'n.', 'audience': 'n.',
    'brand awareness': 'n.', 'promotion': 'n.', 'follower': 'n.', 'launch': 'v. / n.', 'highlight': 'v. / n.',
    'visual': 'adj. / n.', 'traffic': 'n.', 'content': 'n.', 'niche': 'n. / adj.', 'positioning': 'n.',
    'testimonial': 'n.', 'click-through rate': 'n.', 'retargeting': 'n.', 'influencer': 'n.', 'seasonal': 'adj.',
    'agenda': 'n.', 'recap': 'n. / v.', 'align': 'v.', 'action item': 'n.', 'stakeholder': 'n.',
    'deadline': 'n.', 'brainstorm': 'v. / n.', 'decision': 'n.', 'minutes': 'n.', 'schedule a call': 'phrase',
    'circle back': 'phrase', 'on the same page': 'phrase', 'clarify': 'v.', 'prioritize': 'v.',
    'update': 'v. / n.', 'remind': 'v.', 'attendee': 'n.', 'wrapping up': 'phrase',
    'complaint': 'n.', 'refund': 'n. / v.', 'replacement': 'n.', 'feedback': 'n.', 'resolve': 'v.',
    'warranty': 'n.', 'damage': 'n. / v.', 'claim': 'n. / v.', 'apology': 'n.', 'satisfaction': 'n.',
    'trust': 'n. / v.', 'rapport': 'n.', 'loyal': 'adj.', 'referral': 'n.', 'appreciate': 'v.',
    'partnership': 'n.', 'long-term': 'adj.', 'milestone': 'n.', 'sincere': 'adj.', 'keep in touch': 'phrase',
    'priority': 'n.', 'efficient': 'adj.', 'schedule': 'n. / v.', 'attach': 'v.', 'regarding': 'prep.',
    'according to': 'phrase', 'in addition': 'phrase', 'therefore': 'adv.', 'however': 'adv.',
    'recommend': 'v.', 'suggest': 'v.', 'ensure': 'v.', 'improve': 'v.', 'increase': 'v. / n.',
    'reduce': 'v.', 'consider': 'v.', 'expect': 'v.'
  };

  // 音标映射（高频词），未覆盖的词用规则近似或留空
  const PHONETIC = {
    'quote': '/kwəʊt/', 'quotation': '/kwəʊˈteɪʃn/', 'inquiry': '/ɪnˈkwaɪəri/', 'sample': '/ˈsɑːmpl/',
    'specification': '/ˌspesɪfɪˈkeɪʃn/', 'catalog': '/ˈkætəlɒɡ/', 'discount': '/ˈdɪskaʊnt/',
    'validity': '/vəˈlɪdəti/', 'detail': '/ˈdiːteɪl/', 'request': '/rɪˈkwest/', 'available': '/əˈveɪləbl/',
    'negotiate': '/nɪˈɡəʊʃieɪt/', 'negotiation': '/nɪˌɡəʊʃiˈeɪʃn/', 'margin': '/ˈmɑːdʒɪn/',
    'concession': '/kənˈseʃn/', 'terms': '/tɜːmz/', 'volume': '/ˈvɒljuːm/', 'competitive': '/kəmˈpetətɪv/',
    'acceptable': '/əkˈseptəbl/', 'compromise': '/ˈkɒmprəmaɪz/', 'budget': '/ˈbʌdʒɪt/', 'firm': '/fɜːm/',
    'leverage': '/ˈliːvərɪdʒ/', 'proposal': '/prəˈpəʊzl/', 'flexible': '/ˈfleksəbl/', 'confirm': '/kənˈfɜːm/',
    'deposit': '/dɪˈpɒzɪt/', 'workshop': '/ˈwɜːkʃɒp/', 'inspection': '/ɪnˈspekʃn/', 'delay': '/dɪˈleɪ/',
    'capacity': '/kəˈpæsəti/', 'defect': '/dɪˈfekt/', 'rework': '/ˈriːwɜːk/', 'supplier': '/səˈplaɪə/',
    'process': '/ˈprəʊses/', 'finalize': '/ˈfaɪnəlaɪz/', 'shipment': '/ˈʃɪpmənt/', 'carrier': '/ˈkæriə/',
    'customs': '/ˈkʌstəmz/', 'invoice': '/ˈɪnvɔɪs/', 'delivery': '/dɪˈlɪvəri/', 'warehouse': '/ˈweəhaʊs/',
    'freight': '/freɪt/', 'insurance': '/ɪnˈʃʊərəns/', 'dispatch': '/dɪˈspætʃ/', 'fragile': '/ˈfrædʒaɪl/',
    'package': '/ˈpækɪdʒ/', 'container': '/kənˈteɪnə/', 'campaign': '/kæmˈpeɪn/', 'listing': '/ˈlɪstɪŋ/',
    'conversion': '/kənˈvɜːʃn/', 'engagement': '/ɪnˈɡeɪdʒmənt/', 'audience': '/ˈɔːdiəns/', 'promotion': '/prəˈməʊʃn/',
    'follower': '/ˈfɒləʊə/', 'launch': '/lɔːntʃ/', 'highlight': '/ˈhaɪlaɪt/', 'traffic': '/ˈtræfɪk/',
    'content': '/ˈkɒntent/', 'niche': '/niːʃ/', 'positioning': '/pəˈzɪʃənɪŋ/', 'influencer': '/ˈɪnfluənsə/',
    'seasonal': '/ˈsiːzənl/', 'agenda': '/əˈdʒendə/', 'recap': '/ˈriːkæp/', 'align': '/əˈlaɪn/',
    'stakeholder': '/ˈsteɪkhəʊldə/', 'deadline': '/ˈdedlaɪn/', 'brainstorm': '/ˈbreɪnstɔːm/',
    'decision': '/dɪˈsɪʒn/', 'minutes': '/ˈmɪnɪts/', 'clarify': '/ˈklærəfaɪ/', 'prioritize': '/praɪˈɒrətaɪz/',
    'remind': '/rɪˈmaɪnd/', 'complaint': '/kənˈpleɪnt/', 'refund': '/ˈriːfʌnd/', 'replacement': '/rɪˈpleɪsmənt/',
    'feedback': '/ˈfiːdbæk/', 'resolve': '/rɪˈzɒlv/', 'warranty': '/ˈwɒrənti/', 'damage': '/ˈdæmɪdʒ/',
    'claim': '/kleɪm/', 'apology': '/əˈpɒlədʒi/', 'satisfaction': '/ˌsætɪsˈfækʃn/', 'trust': '/trʌst/',
    'rapport': '/ræˈpɔː/', 'loyal': '/ˈlɔɪəl/', 'referral': '/rɪˈfɜːrəl/', 'appreciate': '/əˈpriːʃieɪt/',
    'partnership': '/ˈpɑːtnəʃɪp/', 'milestone': '/ˈmaɪlstəʊn/', 'sincere': '/sɪnˈsɪə/', 'priority': '/praɪˈɒrəti/',
    'efficient': '/ɪˈfɪʃnt/', 'attach': '/əˈtætʃ/', 'regarding': '/rɪˈɡɑːdɪŋ/', 'therefore': '/ˈðeəfɔː/',
    'however': '/haʊˈevə/', 'recommend': '/ˌrekəˈmend/', 'suggest': '/səˈdʒest/', 'ensure': '/ɪnˈʃʊə/',
    'improve': '/ɪmˈpruːv/', 'increase': '/ɪnˈkriːs/', 'reduce': '/rɪˈdjuːs/', 'consider': '/kənˈsɪdə/',
    'expect': '/ɪkˈspekt/', 'FOB': '/ˌef əʊ ˈbiː/', 'CIF': '/ˌsiː aɪ ˈef/', 'MOQ': '/ˌem əʊ ˈkjuː/',
    'eta': '/ˈiːtɑː/', 'lead time': '/ˈliːd taɪm/', 'unit price': '/ˈjuːnɪt praɪs/'
  };

  // 常用搭配（高频词）
  const COLLOCATIONS = {
    'quote': ['send us a quote', 'quote a price', 'quote for 500 units'],
    'inquiry': ['receive an inquiry', 'inquiry from a buyer'],
    'sample': ['provide a free sample', 'sample approval', 'order a sample'],
    'discount': ['a 5% discount', 'offer a discount', 'bulk discount'],
    'negotiate': ['negotiate the price', 'negotiate terms'],
    'margin': ['a thin margin', 'profit margin'],
    'lead time': ['the lead time is', 'shorten the lead time'],
    'confirm': ['confirm the order', 'confirm the details'],
    'deposit': ['pay a deposit', '30% deposit'],
    'quality control': ['strict quality control'],
    'shipment': ['the shipment is ready', 'arrange the shipment'],
    'delivery': ['on-time delivery', 'delivery date'],
    'invoice': ['commercial invoice', 'send the invoice'],
    'tracking number': ['send the tracking number'],
    'campaign': ['launch a campaign', 'spring campaign'],
    'conversion': ['conversion rate', 'improve conversion'],
    'traffic': ['drive traffic', 'website traffic'],
    'agenda': ['go through the agenda'],
    'deadline': ['meet the deadline', 'miss the deadline'],
    'feedback': ['customer feedback', 'thank you for your feedback'],
    'refund': ['a full refund', 'issue a refund'],
    'warranty': ['under warranty'],
    'trust': ['build trust', 'earn trust'],
    'referral': ['give a referral'],
    'appreciate': ['appreciate your support', 'appreciate your time']
  };

  // 易混词
  const CONFUSE = {
    'quote': ['quotation（报价单，名词）', 'quota（配额）'],
    'sample': ['example（例子）', 'specimen（标本）'],
    'discount': ['discount（折扣）vs. count（计数）'],
    'delivery': ['delivery（交付）vs. delivery time（送达时间）'],
    'shipment': ['shipment（发货/货物）vs. shipping（运输方式）'],
    'invoice': ['invoice（发票）vs. receipt（收据）'],
    'price': ['price（价格）vs. prize（奖品）'],
    'prize': ['prize（奖品）vs. price（价格）'],
    'accept': ['accept（接受）vs. except（除了）'],
    'affect': ['affect（影响，动词）vs. effect（效果，名词）'],
    'efficient': ['efficient（高效的）vs. effective（有效的）'],
    'priority': ['priority（优先级）vs. priority mail'],
    'ensure': ['ensure（确保）vs. insure（投保）'],
    'recommend': ['recommend（推荐）vs. suggestion（建议，名词）'],
    'deadline': ['deadline（截止日）vs. schedule（日程）'],
    'feedback': ['feedback（反馈）vs. comment（评论）']
  };

  // 从 EnglishContent.WORDS 建基础索引
  function baseIndex() {
    const map = {};
    const WORDS = (global.EnglishContent && global.EnglishContent.WORDS) || [];
    WORDS.forEach(w => {
      if (!w || !w.en) return;
      // 整词与单位词都建索引（取第一个出现的释义）
      const keys = [w.en.toLowerCase()].concat(w.en.toLowerCase().split(' '));
      keys.forEach(k => { if (!map[k]) map[k] = w; });
    });
    return map;
  }
  let BASE = null;

  function esc(s) { return String(s == null ? '' : s); }

  function guessPos(word) {
    const w = word.toLowerCase();
    if (POS_OVERRIDE[w]) return POS_OVERRIDE[w];
    if (/ing$/.test(w)) return 'v.-ing / n.';
    if (/ed$/.test(w)) return 'v.-ed / adj.';
    if (/(tion|sion|ment|ness|ity|ance|ence|ship|age)$/.test(w)) return 'n.';
    if (/(ous|ful|less|able|ible|ive|al|ic|ish|ly)$/.test(w)) return 'adj. / adv.';
    if (/(ize|ise|ate|ify)$/.test(w)) return 'v.';
    if (/s$/.test(w) && w.length > 3) return 'n.(pl.) / v.';
    return '词性见例句';
  }

  /** 查词：返回 { word, zh, pos, phonetic, examples, collocations, confuse, known } */
  function lookup(rawWord) {
    if (!BASE) BASE = baseIndex();
    const clean = esc(rawWord).replace(/^[^A-Za-z]+|[^A-Za-z'-]+$/g, '').trim();
    const key = clean.toLowerCase();
    const base = BASE[key];
    return {
      word: clean,
      zh: base ? base.zh : '',
      pos: POS_OVERRIDE[key] || guessPos(key),
      phonetic: PHONETIC[key] || '',
      examples: base ? [base.ex] : [],
      collocations: COLLOCATIONS[key] || [],
      confuse: CONFUSE[key] || [],
      known: !!base
    };
  }

  /** 把一段英文文本切成可点击的单词 span（保留标点与空格） */
  function clickableHTML(text) {
    return esc(text).replace(/([A-Za-z][A-Za-z'-]*)/g, (m) =>
      `<span class="dict-word" data-word="${m.toLowerCase()}">${m}</span>`);
  }

  global.Dictionary = { lookup, clickableHTML, PHONETIC, POS_OVERRIDE };
})(window);
