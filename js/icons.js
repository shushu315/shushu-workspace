/* 图标资源：卡通小树头像 + 6 只不同造型的小熊头 + 水杯 */
(function (global) {
  const FUR = '#F0D6C2';
  const FUR_DARK = '#E6C6AE';
  const INNER = '#F7DED4';
  const INK = '#6B5B54';

  /** 卡通小树头像（与 App 图标一致） */
  function treeAvatar(size = 44) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs><radialGradient id="tg" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#FCEDE9"/><stop offset="100%" stop-color="#F4D9D5"/></radialGradient></defs>
      <circle cx="50" cy="50" r="49" fill="url(#tg)"/>
      <ellipse cx="50" cy="85" rx="26" ry="4.5" fill="#E4C4BC" opacity="0.5"/>
      <path d="M44 61 L38 85 Q50 89 62 85 L56 61 Z" fill="#C99B7B"/>
      <path d="M50 85 L50 70" stroke="#B68466" stroke-width="2.4" stroke-linecap="round"/>
      <circle cx="50" cy="43" r="22" fill="#AFCFA6"/>
      <circle cx="35" cy="55" r="17" fill="#C4DEB8"/>
      <circle cx="65" cy="55" r="17" fill="#C4DEB8"/>
      <circle cx="50" cy="32" r="18" fill="#BBD9B0"/>
      <circle cx="40" cy="27" r="9.5" fill="#CBE4C0"/>
      <path d="M50 15 q4 -7 9 -6 q-3 6 -9 8" fill="#9CC593"/>
      <circle cx="43" cy="44" r="2.6" fill="#5A4F4A"/>
      <circle cx="57" cy="44" r="2.6" fill="#5A4F4A"/>
      <circle cx="41.7" cy="43.2" r="0.85" fill="#fff"/>
      <circle cx="55.7" cy="43.2" r="0.85" fill="#fff"/>
      <ellipse cx="36" cy="50" rx="4.2" ry="2.8" fill="#F2B9BA" opacity="0.85"/>
      <ellipse cx="64" cy="50" rx="4.2" ry="2.8" fill="#F2B9BA" opacity="0.85"/>
      <path d="M45 51 Q50 56.5 55 51" stroke="#5A4F4A" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    </svg>`;
  }

  const MENU = {
    home:     { bg: '#F7E1DE', label: '首页',     fur: '#F1D8C6' },
    todo:     { bg: '#F9EDD2', label: '今日待办', fur: '#F0D9BC' },
    schedule: { bg: '#DDEAEE', label: '日程计划', fur: '#EAD6C4' },
    health:   { bg: '#E1ECDA', label: '健康生活', fur: '#EED7C3' },
    english:  { bg: '#EAE3F0', label: '英语学习', fur: '#EDD8C6' },
    diary:    { bg: '#F8E6DC', label: '树洞小记', fur: '#EFD6C2' }
  };

  function accessory(type) {
    switch (type) {
      case 'home': // 小房子
        return `<g transform="translate(50 20)">
          <path d="M-13 0 L0 -11 L13 0 Z" fill="#EBAFAE" stroke="#D89796" stroke-width="1.4" stroke-linejoin="round"/>
          <rect x="-10" y="0" width="20" height="14" rx="2.5" fill="#FBEDE4" stroke="#E0B7A6" stroke-width="1.4"/>
          <rect x="-3.5" y="5" width="7" height="9" rx="1.5" fill="#D9B49E"/>
        </g>`;
      case 'todo': // 清单夹板
        return `<g transform="translate(50 21)">
          <rect x="-12" y="-3" width="24" height="20" rx="3" fill="#FFFBF2" stroke="#D9B98E" stroke-width="1.5"/>
          <rect x="-5" y="-6" width="10" height="5" rx="2" fill="#E7C9A6" stroke="#D9B98E" stroke-width="1.2"/>
          <path d="M-8 5 l2.5 2.5 L-2 3" stroke="#A8C99A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M-8 12 l2.5 2.5 L-2 10" stroke="#A8C99A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <line x1="2" y1="6" x2="8" y2="6" stroke="#CBB9A6" stroke-width="1.6" stroke-linecap="round"/>
          <line x1="2" y1="13" x2="8" y2="13" stroke="#CBB9A6" stroke-width="1.6" stroke-linecap="round"/>
        </g>`;
      case 'schedule': // 日历
        return `<g transform="translate(50 20)">
          <rect x="-13" y="-3" width="26" height="20" rx="3" fill="#FFFBF2" stroke="#9FBCC6" stroke-width="1.5"/>
          <path d="M-13 3 H13" stroke="#9FBCC6" stroke-width="1.5"/>
          <rect x="-10" y="-7" width="3.5" height="7" rx="1.7" fill="#8FB0BC"/>
          <rect x="6.5" y="-7" width="3.5" height="7" rx="1.7" fill="#8FB0BC"/>
          <circle cx="-6" cy="9" r="2.2" fill="#F0B9B8"/><circle cx="0" cy="9" r="2.2" fill="#F0B9B8"/>
          <circle cx="6" cy="9" r="2.2" fill="#CBDCC4"/>
        </g>`;
      case 'health': // 爱心
        return `<g transform="translate(50 20)">
          <path d="M0 11 C-16 1 -13 -10 -4 -10 C-1 -10 0 -8 0 -8 C0 -8 1 -10 4 -10 C13 -10 16 1 0 11 Z" fill="#E8AEB0" stroke="#D29496" stroke-width="1.4"/>
          <path d="M-7 -2 q3 -4 6 -1" stroke="#FFF4F0" stroke-width="2" fill="none" stroke-linecap="round"/>
        </g>`;
      case 'english': // 打开的书
        return `<g transform="translate(50 21)">
          <path d="M0 4 Q-8 -4 -16 -2 L-16 14 Q-8 12 0 19 Q8 12 16 14 L16 -2 Q8 -4 0 4 Z" fill="#FFFBF2" stroke="#B7A6C9" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M0 4 V19" stroke="#B7A6C9" stroke-width="1.4"/>
          <line x1="-13" y1="4" x2="-4" y2="7" stroke="#CBBBD9" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="-13" y1="9" x2="-5" y2="11" stroke="#CBBBD9" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="4" y1="7" x2="13" y2="4" stroke="#CBBBD9" stroke-width="1.4" stroke-linecap="round"/>
          <line x1="5" y1="11" x2="13" y2="9" stroke="#CBBBD9" stroke-width="1.4" stroke-linecap="round"/>
        </g>`;
      case 'diary': // 羽毛笔 + 叶子
        return `<g transform="translate(50 20)">
          <path d="M-9 13 Q-2 -2 12 -12 Q10 4 -4 14 Z" fill="#E8C9AE" stroke="#C9A582" stroke-width="1.3"/>
          <path d="M-9 13 L-12 18" stroke="#B98C6A" stroke-width="2" stroke-linecap="round"/>
          <path d="M12 -12 Q4 -2 -2 6" stroke="#C9A582" stroke-width="1" fill="none"/>
          <path d="M-14 -4 q7 -4 10 2 q-7 4 -10 -2 Z" fill="#BCD9B0" stroke="#9FC294" stroke-width="1"/>
        </g>`;
      default:
        return '';
    }
  }

  /** 小熊头菜单图标 */
  function bearIcon(type, size = 64) {
    const m = MENU[type] || MENU.home;
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="50" cy="50" r="49" fill="${m.bg}"/>
      <circle cx="29" cy="31" r="12.5" fill="${FUR_DARK}"/>
      <circle cx="71" cy="31" r="12.5" fill="${FUR_DARK}"/>
      <circle cx="29" cy="31" r="6.8" fill="${INNER}"/>
      <circle cx="71" cy="31" r="6.8" fill="${INNER}"/>
      <ellipse cx="50" cy="57" rx="29.5" ry="26.5" fill="${m.fur}"/>
      <ellipse cx="50" cy="67" rx="15" ry="10.5" fill="#FFF9F3"/>
      <circle cx="40" cy="53" r="3" fill="${INK}"/>
      <circle cx="60" cy="53" r="3" fill="${INK}"/>
      <circle cx="39.2" cy="52.2" r="0.9" fill="#fff"/>
      <circle cx="59.2" cy="52.2" r="0.9" fill="#fff"/>
      <ellipse cx="33.5" cy="60" rx="4" ry="2.6" fill="#F2B9BA" opacity="0.7"/>
      <ellipse cx="66.5" cy="60" rx="4" ry="2.6" fill="#F2B9BA" opacity="0.7"/>
      <ellipse cx="50" cy="62.5" rx="4" ry="2.8" fill="#7A6358"/>
      <path d="M46 68 Q50 72 54 68" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      ${accessory(type)}
    </svg>`;
  }

  /** 水杯：filled = true 表示满杯 */
  function waterCup(filled, size = 34) {
    const water = filled
      ? `<path d="M8 13 L32 13 L29 42 Q29 45 26 45 L14 45 Q11 45 11 42 Z" fill="#A9D3E0"/>
         <path d="M8 17 Q20 21 32 17 L31.5 22 Q20 26 8.5 22 Z" fill="#C3E2EC"/>`
      : `<path d="M8 13 L32 13 L29 42 Q29 45 26 45 L14 45 Q11 45 11 42 Z" fill="#FFFFFF" opacity="0.7"/>`;
    return `<svg viewBox="0 0 40 50" width="${size}" height="${size * 1.25}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      ${water}
      <path d="M8 13 L11 43 Q11 46 14 46 L26 46 Q29 46 29 43 L32 13" fill="none" stroke="${filled ? '#8FBCCB' : '#D8CFC7'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 12 L34 12" stroke="${filled ? '#8FBCCB' : '#D8CFC7'}" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  global.Icons = { treeAvatar, bearIcon, waterCup, MENU };
})(window);
