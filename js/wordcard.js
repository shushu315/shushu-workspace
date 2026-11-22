/* 全局单词小卡：任意英文单词点击后弹出，含释义/词性/音标/搭配/例句/易混词/点读/加入单词本 */
(function (global) {
  const WordCard = {};

  function speak(text) {
    if (global.EnglishContent && EnglishContent.speak) EnglishContent.speak(text);
  }

  /** 该词是否已在单词本 */
  function inBook(word) {
    const wb = (Store.english().wordBook) || [];
    return wb.some(x => x.en && x.en.toLowerCase() === word.toLowerCase());
  }

  /** 加入单词本（累积式，带日期、卡片完整信息、来源标记为手动查询） */
  function addToBook(info) {
    const eng = Store.english();
    if (eng.wordBook.some(x => x.en && x.en.toLowerCase() === info.word.toLowerCase())) {
      App.toast('这个词已经在单词本里啦 📕');
      return;
    }
    eng.wordBook.push({
      en: info.word, zh: info.zh, ex: info.examples[0] || '',
      phonetic: info.phonetic, pos: info.pos,
      collocations: info.collocations, confuse: info.confuse,
      day: eng.currentDay || 1, added: Store.todayISO(), source: 'manual', box: 0
    });
    Store.saveEnglish();
    App.toast('已加入单词本 📕');
    // 更新按钮状态
    const btn = document.getElementById('wcAddBtn');
    if (btn) { btn.textContent = '✓ 已加入单词本'; btn.disabled = true; btn.classList.add('added'); }
  }

  /** 弹出单词卡 */
  WordCard.show = function (rawWord) {
    const info = Dictionary.lookup(rawWord);
    if (!info.word) return;
    const added = inBook(info.word);
    const mask = document.createElement('div');
    mask.className = 'wc-mask';
    mask.id = 'wordCardMask';
    const coll = info.collocations.length
      ? `<div class="wc-sec"><div class="wc-sec-t">常用搭配</div>${info.collocations.map(c => `<div class="wc-line">· ${App.escape(c)}</div>`).join('')}</div>` : '';
    const ex = info.examples.length
      ? `<div class="wc-sec"><div class="wc-sec-t">例句</div>${info.examples.map(e => `<div class="wc-ex">${Dictionary.clickableHTML(e)} <button class="wc-play" data-say="${App.escape(e)}">🔊</button></div>`).join('')}</div>` : '';
    const confuse = info.confuse.length
      ? `<div class="wc-sec"><div class="wc-sec-t">易混淆词</div>${info.confuse.map(c => `<div class="wc-line">· ${App.escape(c)}</div>`).join('')}</div>` : '';
    mask.innerHTML = `
      <div class="wc-card" role="dialog" aria-label="单词卡片">
        <button class="wc-close" id="wcClose">✕</button>
        <div class="wc-head">
          <div class="wc-word">${App.escape(info.word)} <button class="wc-play big" id="wcSayWord" title="朗读单词">🔊</button></div>
          ${info.phonetic ? `<div class="wc-ph">${App.escape(info.phonetic)}</div>` : ''}
          <div class="wc-pos">${App.escape(info.pos)}</div>
        </div>
        <div class="wc-meaning">${info.zh ? App.escape(info.zh) : '这个词暂无释义，可先加入单词本，之后补充。'}</div>
        ${coll}${ex}${confuse}
        <button class="btn primary" id="wcAddBtn" ${added ? 'disabled' : ''} style="width:100%;margin-top:14px">${added ? '✓ 已加入单词本' : '＋ 加入单词本'}</button>
        <div class="tiny muted" style="text-align:center;margin-top:8px">点卡片里的其它英文单词可继续查词</div>
      </div>`;
    document.body.appendChild(mask);
    mask.addEventListener('click', (e) => { if (e.target === mask) WordCard.close(); });
    mask.querySelector('#wcClose').onclick = () => WordCard.close();
    mask.querySelector('#wcSayWord').onclick = () => speak(info.word);
    mask.querySelectorAll('[data-say]').forEach(b => b.onclick = () => speak(b.dataset.say));
    // 卡片内继续查词
    mask.querySelectorAll('.dict-word').forEach(w => w.onclick = () => WordCard.show(w.dataset.word));
    const addBtn = mask.querySelector('#wcAddBtn');
    if (!added) addBtn.classList.remove('added');
    addBtn.onclick = () => { if (!added) addToBook(info); };
  };

  WordCard.close = function () {
    const m = document.getElementById('wordCardMask');
    if (m) m.remove();
  };

  /** 全局事件委托：点击任意 .dict-word 即弹卡（在所有视图生效，只需绑定一次） */
  WordCard.init = function () {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('.dict-word');
      if (!el) return;
      // 若在词卡内部，交给卡片自己的处理器，避免重复
      if (el.closest('#wordCardMask')) return;
      e.preventDefault(); e.stopPropagation();
      WordCard.show(el.dataset.word);
    });
  };

  global.WordCard = WordCard;
})(window);
