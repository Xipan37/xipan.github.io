/***** Data Layer *****/
const Store = {
  _prefix: 'dreamcomm_',
  _get(key) {
    try { return JSON.parse(localStorage.getItem(this._prefix + key)); } catch { return null; }
  },
  _set(key, val) {
    localStorage.setItem(this._prefix + key, JSON.stringify(val));
  },
  _genId() {
    const id = this._get('nextId') || 1;
    this._set('nextId', id + 1);
    return id;
  },

  getSettings() {
    const defaults = {
      userName: '我', characterName: '梦角',
      userAvatar: '👤', characterAvatar: '✨',
      replyMin: 3, replyMax: 300,
      autoMsg: false, autoInterval: 600, letterInterval: 4,
      combine: false, combineCount: 3,
      themeColor: '#d48bb5', autoReply: true,
      userBubbleColor: '#d48bb5', charBubbleColor: '#f0e6ee',
      chatBgType: 'color', chatBgColor: '#faf5f8', chatBgImage: null,
      fontSize: 15, useSystemFont: false
    };
    const saved = this._get('settings');
    return saved ? { ...defaults, ...saved } : defaults;
  },
  saveSettings(s) {
    this._set('settings', s);
  },

  getCards() { return this._get('cards') || []; },
  saveCards(cards) { this._set('cards', cards); },
  addCard(text, group) {
    const cards = this.getCards();
    if (cards.some(c => c.text === text)) return false;
    cards.push({ id: this._genId(), text, type: 'card', group: group || '' });
    this.saveCards(cards);
    return true;
  },
  updateCard(id, text, group) {
    const cards = this.getCards();
    const idx = cards.findIndex(c => c.id === id);
    if (idx === -1) return false;
    if (text !== undefined) cards[idx].text = text;
    if (group !== undefined) cards[idx].group = group;
    this.saveCards(cards);
    return true;
  },
  deleteCard(id) {
    this.saveCards(this.getCards().filter(c => c.id !== id));
  },
  batchImportCards(texts, group) {
    const cards = this.getCards();
    const existing = new Set(cards.map(c => c.text));
    let count = 0;
    for (const t of texts) {
      const s = t.trim();
      if (s && !existing.has(s)) {
        cards.push({ id: this._genId(), text: s, type: 'card', group: group || '' });
        existing.add(s);
        count++;
      }
    }
    this.saveCards(cards);
    return count;
  },
  getCardGroups() {
    const cards = this.getCards();
    const groups = [...new Set(cards.map(c => c.group || ''))];
    groups.sort((a, b) => {
      if (!a && b) return -1;
      if (a && !b) return 1;
      return a.localeCompare(b, 'zh');
    });
    return groups;
  },
  renameGroup(oldName, newName) {
    const cards = this.getCards();
    cards.forEach(c => { if ((c.group || '') === oldName) c.group = newName; });
    this.saveCards(cards);
  },
  deleteGroup(name) {
    const cards = this.getCards();
    cards.forEach(c => { if ((c.group || '') === name) c.group = ''; });
    this.saveCards(cards);
  },

  getEmojis() {
    let emojis = this._get('emojis');
    if (!emojis || !emojis.length) {
      emojis = this._initEmojis();
    }
    return emojis;
  },
  saveEmojis(emojis) { this._set('emojis', emojis); },
  _initEmojis() {
    const defaultEmojis = ['😊','🥰','😎','🤗','✨','🌟','💫','🌸','🌺','🌷','🌈','💕','💖','💗','🦋','🌙','⭐','☀️','🍀','🎀','👑','💎','🧸','🎠','🌊','🍃','🌻','🌹','💝','🕊️','🦄','🐱','🐶','🐰','🦊','🐼','🐨','🦁','🐯','😀','😂','🤣','😍','🥺','😘','😭','😤','🤩','🥳','😏','😌','🙃','🤔','🤭','🤫','😴','💪','🔥','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💋','👀','🍰','🎂','🍦','☕','🎵','🎶','🎬','📸','🎁','🎉','🎊','🏆','⭐','🌈','⚡','🔥','💧','🌊','🍁','🌸','🌴','🌵','🍄'];
    let nextId = this._get('nextId') || 1;
    const emojis = defaultEmojis.map(text => ({ id: nextId++, text, type: 'text', builtin: true }));
    this._set('nextId', nextId);
    this.saveEmojis(emojis);
    return emojis;
  },
  addEmoji(text, type, src) {
    const emojis = this.getEmojis();
    if (type !== 'image' && emojis.some(e => e.text === text && e.type !== 'image')) return false;
    const emoji = { id: this._genId(), text, type: type || 'text' };
    if (src) emoji.src = src;
    emojis.push(emoji);
    this.saveEmojis(emojis);
    return true;
  },
  deleteEmoji(id) {
    this.saveEmojis(this.getEmojis().filter(e => e.id !== id));
  },



  getMessages() { return this._get('messages') || []; },
  saveMessages(msgs) { this._set('messages', msgs); },
  addMessage(content, sender, cardIds, quoteId) {
    const msgs = this.getMessages();
    const msg = { id: this._genId(), content, sender, cardIds: cardIds || [], timestamp: Date.now(), quoteId: quoteId || null, recalled: false, favorited: false };
    msgs.push(msg);
    this.saveMessages(msgs);
    return msg;
  },
  recallMessage(id) {
    const msgs = this.getMessages();
    const msg = msgs.find(m => m.id === id);
    if (!msg || msg.sender !== 'user') return false;
    if (Date.now() - msg.timestamp > 120000) return false; // only within 2 min
    msg.recalled = true;
    msg.content = '';
    this.saveMessages(msgs);
    return true;
  },
  deleteMessage(id) {
    this.saveMessages(this.getMessages().filter(m => m.id !== id));
  },
  toggleFavorite(id) {
    const msgs = this.getMessages();
    const msg = msgs.find(m => m.id === id);
    if (!msg) return false;
    msg.favorited = !msg.favorited;
    this.saveMessages(msgs);
    return msg.favorited;
  },
  getFavorites() {
    return this.getMessages().filter(m => m.favorited);
  },

  getMoods() { return this._get('moods') || []; },
  saveMoods(moods) { this._set('moods', moods); },
  addMood(moodEmoji, statusText, customDate) {
    const moods = this.getMoods();
    const dateObj = customDate || new Date();
    const dateStr = dateObj.toDateString();
    const entry = { id: this._genId(), mood: moodEmoji, status: statusText, timestamp: dateObj.getTime(), date: dateStr };
    const existingToday = moods.findIndex(m => m.date === dateStr);
    if (existingToday >= 0) moods[existingToday] = entry;
    else moods.push(entry);
    this.saveMoods(moods);
    return entry;
  },
  getLatestMood() {
    const moods = this.getMoods();
    return moods.length ? moods[moods.length - 1] : null;
  },
  getTodayMood() {
    const today = new Date().toDateString();
    return this.getMoods().find(m => m.date === today) || null;
  },

  getAtmospheres() { return this._get('atmospheres') || []; },
  saveAtmospheres(a) { this._set('atmospheres', a); },
  addAtmosphere(text) {
    const list = this.getAtmospheres();
    if (list.some(a => a.text === text)) return false;
    list.push({ id: this._genId(), text });
    this.saveAtmospheres(list);
    return true;
  },
  deleteAtmosphere(id) {
    this.saveAtmospheres(this.getAtmospheres().filter(a => a.id !== id));
  },
  batchImportAtmospheres(texts) {
    const list = this.getAtmospheres();
    const existing = new Set(list.map(a => a.text));
    let count = 0;
    for (const t of texts) {
      const s = t.trim();
      if (s && !existing.has(s)) {
        list.push({ id: this._genId(), text: s });
        existing.add(s);
        count++;
      }
    }
    this.saveAtmospheres(list);
    return count;
  },

  getStatusPhrases() { return this._get('statusPhrases') || []; },
  saveStatusPhrases(p) { this._set('statusPhrases', p); },
  addStatusPhrase(text) {
    const list = this.getStatusPhrases();
    if (list.some(s => s.text === text)) return false;
    list.push({ id: this._genId(), text });
    this.saveStatusPhrases(list);
    return true;
  },
  deleteStatusPhrase(id) {
    this.saveStatusPhrases(this.getStatusPhrases().filter(s => s.id !== id));
  },
  batchImportStatusPhrases(texts) {
    const list = this.getStatusPhrases();
    const existing = new Set(list.map(s => s.text));
    let count = 0;
    for (const t of texts) {
      const s = t.trim();
      if (s && !existing.has(s)) {
        list.push({ id: this._genId(), text: s });
        existing.add(s);
        count++;
      }
    }
    this.saveStatusPhrases(list);
    return count;
  },
  getRandomStatusPhrase() {
    const list = this.getStatusPhrases();
    if (!list.length) return '';
    return list[rand(0, list.length - 1)].text;
  },

  getLetters() { return this._get('letters') || []; },
  saveLetters(letters) { this._set('letters', letters); },
  addLetter(sender, content, replyToId) {
    const letters = this.getLetters();
    const letter = {
      id: this._genId(), sender, content,
      replyToId: replyToId || null,
      status: 'pending',
      timestamp: Date.now(),
      replyTimestamp: null,
      replyContent: null
    };
    letters.push(letter);
    this.saveLetters(letters);
    return letter;
  },
  updateLetter(id, updates) {
    const letters = this.getLetters();
    const idx = letters.findIndex(l => l.id === id);
    if (idx === -1) return;
    Object.assign(letters[idx], updates);
    this.saveLetters(letters);
  },

  exportAll() {
    return {
      cards: this.getCards(),
      emojis: this.getEmojis(),
      messages: this.getMessages(),
      letters: this.getLetters(),
      moods: this.getMoods(),
      atmospheres: this.getAtmospheres(),
      statusPhrases: this.getStatusPhrases(),
      settings: this.getSettings()
    };
  },
  importAll(data) {
    if (data.cards) this.saveCards(data.cards);
    if (data.emojis) this.saveEmojis(data.emojis);
    if (data.messages) this.saveMessages(data.messages);
    if (data.letters) this.saveLetters(data.letters);
    if (data.moods) this.saveMoods(data.moods);
    if (data.atmospheres) this.saveAtmospheres(data.atmospheres);
    if (data.statusPhrases) this.saveStatusPhrases(data.statusPhrases);
    if (data.settings) this.saveSettings(data.settings);
  },
  clearAll() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(this._prefix));
    keys.forEach(k => localStorage.removeItem(k));
    this._set('nextId', 1);
  }
};

/***** Generate Chinese characters *****/
/***** Utilities *****/
function fmtTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtDate(ts) {
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toast(msg, duration) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.add('hidden'), duration || 2000);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom(arr) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hideModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function confirmDialog(title, msg) {
  return new Promise((resolve) => {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = msg;
    showModal('confirm-dialog');
    const ok = document.getElementById('confirm-ok');
    const cancel = document.getElementById('confirm-cancel');
    const cleanup = () => {
      hideModal('confirm-dialog');
      ok.removeEventListener('click', onOk);
      cancel.removeEventListener('click', onCancel);
    };
    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };
    ok.addEventListener('click', onOk);
    cancel.addEventListener('click', onCancel);
  });
}

/***** Chat System *****/
const Chat = {
  _replyTimer: null,
  _autoTimer: null,

  init() {
    this.render();
    this.scrollToBottom();
  },

  render() {
    const container = document.getElementById('message-list');
    const msgs = Store.getMessages();
    container.innerHTML = msgs.map(m => {
      if (m.recalled) {
        const isUser = m.sender === 'user';
        return `<div class="system-message">${isUser ? '你' : Store.getSettings().characterName} 撤回了一条消息</div>`;
      }
      const isUser = m.sender === 'user';
      const cls = isUser ? 'user' : 'character';
      const extraCls = m.cardIds && m.cardIds.length ? ' card-message' : '';
      const star = m.favorited ? ' ★' : '';
      let quoteHtml = '';
      if (m.quoteId) {
        const quoted = Store.getMessages().find(q => q.id === m.quoteId);
        if (quoted && !quoted.recalled) {
          const qText = this._renderContent(quoted.content.slice(0, 50));
          quoteHtml = `<div class="msg-quote">${quoted.sender === 'user' ? '你' : Store.getSettings().characterName}: ${qText}${quoted.content.length > 50 ? '…' : ''}</div>`;
        }
      }
      const displayContent = this._renderContent(m.content);
      return `<div class="message ${cls}${extraCls}" data-id="${m.id}">
        ${quoteHtml}
        <div class="msg-text">${displayContent}</div>
        <div class="msg-footer">
          <span class="msg-time">${fmtTime(m.timestamp)}${star}</span>
          <span class="msg-actions">
            <button class="msg-action quote-btn" title="引用">💬</button>
            ${isUser && Date.now() - m.timestamp < 120000 ? `<button class="msg-action recall-btn" title="撤回">↩</button>` : ''}
            <button class="msg-action fav-btn" title="收藏">${m.favorited ? '⭐' : '☆'}</button>
            <button class="msg-action delete-btn" title="删除">✕</button>
          </span>
        </div>
      </div>`;
    }).join('');

    container.querySelectorAll('.quote-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const msgEl = btn.closest('.message');
        const id = Number(msgEl.dataset.id);
        const msg = Store.getMessages().find(m => m.id === id);
        if (!msg) return;
        const text = msg.content.replace(/\[e:\d+\]/g, '').slice(0, 40);
        document.getElementById('chat-input').value = '';
        document.getElementById('chat-input').placeholder = `引用: ${text}...`;
        document.getElementById('chat-input').focus();
        document.getElementById('chat-input')._quoteId = id;
      });
    });
    container.querySelectorAll('.recall-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.closest('.message').dataset.id);
        if (Store.recallMessage(id)) { this.render(); toast('已撤回'); }
        else toast('撤回失败，超过2分钟');
      });
    });
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.closest('.message').dataset.id);
        const favorited = Store.toggleFavorite(id);
        this.render();
        toast(favorited ? '已收藏' : '已取消收藏');
      });
    });
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.closest('.message').dataset.id);
        Store.deleteMessage(id);
        this.render();
        toast('已删除');
      });
    });
    this.scrollToBottom();
  },

  _renderContent(content) {
    if (!content) return '';
    return content.replace(/\[e:(\d+)\]/g, (m, id) => {
      const emojis = Store.getEmojis();
      const e = emojis.find(em => em.id === Number(id));
      if (!e) return m;
      if (e.type === 'image' && e.src) {
        return `<img class="msg-emoji-img" src="${e.src}" alt="${e.text}" title="${e.text}">`;
      }
      return `<span class="msg-emoji">${e.text}</span>`;
    }).replace(/\n/g, '<br>');
  },

  scrollToBottom() {
    const container = document.getElementById('message-list');
    requestAnimationFrame(() => { container.scrollTop = container.scrollHeight; });
  },

  sendMessage(text) {
    if (!text.trim()) return;
    const input = document.getElementById('chat-input');
    const quoteId = input._quoteId || null;
    const processed = this._processInput(text.trim());
    Store.addMessage(processed.text, 'user', [], quoteId);
    input._quoteId = null;
    input.placeholder = '输入消息...';
    this.render();
    toast('已发送');
    this.scheduleReply();
  },

  _processInput(text) {
    return { text };
  },

  scheduleReply() {
    clearTimeout(this._replyTimer);
    const sources = this._getAllSources();
    if (!sources.length) {
      this._showReplyIndicator('字卡库与汉字库均为空，无法回复');
      return;
    }
    const settings = Store.getSettings();
    const delay = rand(settings.replyMin * 1000, settings.replyMax * 1000);
    this._showReplyIndicator(`回复中... (${Math.round(delay/1000)}秒后)`);
    this._replyTimer = setTimeout(() => {
      this.generateReply();
      this._showReplyIndicator('');
    }, delay);
  },

  _getAllSources() {
    const cards = Store.getCards();
    const allSources = [];
    const seen = new Set();
    for (const c of cards) {
      if (!seen.has(c.text)) {
        allSources.push({ id: c.id, text: c.text, type: 'card' });
        seen.add(c.text);
      }
    }
    return allSources;
  },

  generateReply() {
    const settings = Store.getSettings();
    const cards = Store.getCards();
    const allSources = this._getAllSources();
    if (!allSources.length) {
      this._showReplyIndicator('字卡库与汉字库均为空，无法回复');
      return;
    }

    let replyContent = '';
    let cardIds = [];

    if (settings.combine) {
      const count = Math.min(settings.combineCount, allSources.length);
      const picked = [];
      const used = new Set();
      while (picked.length < count) {
        const idx = rand(0, allSources.length - 1);
        if (used.has(idx)) continue;
        used.add(idx);
        picked.push(allSources[idx]);
      }
      cardIds = picked.filter(s => s.type === 'card').map(s => s.id);
      replyContent = picked.map(s => s.text).join('');
    } else if (cards.length) {
      const card = pickRandom(cards);
      cardIds = [card.id];
      replyContent = card.text;
    } else {
      const src = pickRandom(allSources);
      cardIds = [];
      replyContent = src.text;
    }

    if (Store.getEmojis().length && Math.random() > 0.5) {
      const emoji = pickRandom(Store.getEmojis());
      if (Math.random() > 0.5) {
        replyContent = replyContent + ` [e:${emoji.id}]`;
      } else {
        replyContent = `[e:${emoji.id}] ` + replyContent;
      }
    }

    const msg = Store.addMessage(replyContent, 'character', cardIds);
    this.render();
    toast('收到新消息');
  },

  _showReplyIndicator(text) {
    document.getElementById('reply-indicator').textContent = text;
  },

  startAutoMessages() {
    // Handled by _startProactiveMessages
  },

  stopAutoMessages() {
    // Handled by _startProactiveMessages
  }
};

/***** Cards System *****/
const Cards = {
  render() {
    this.renderCards();
    this.renderEmojis();
  },

  renderCards() {
    const container = document.getElementById('card-list');
    const cards = Store.getCards();
    if (!cards.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">暂无字卡，添加一些吧 ✨</p>';
      return;
    }

    const searchText = (document.getElementById('card-search-input')?.value || '').trim().toLowerCase();
    const groupFilter = document.getElementById('card-group-filter')?.value || '';
    const batchMode = document.getElementById('card-list')?.dataset.batch === '1';

    let filtered = cards.filter(c => {
      if (searchText && !c.text.toLowerCase().includes(searchText)) return false;
      if (groupFilter && (c.group || '') !== groupFilter) return false;
      return true;
    });

    if (!filtered.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">没有匹配的字卡</p>';
      return;
    }

    const groups = {};
    filtered.forEach(c => {
      const g = c.group || '';
      if (!groups[g]) groups[g] = [];
      groups[g].push(c);
    });

    let html = '';
    const groupKeys = Object.keys(groups).sort((a, b) => {
      if (!a && b) return -1;
      if (a && !b) return 1;
      return a.localeCompare(b, 'zh');
    });

    groupKeys.forEach(g => {
      const label = g || '未分组';
      html += `<div class="card-group-header">${this._escapeHtml(label)} <span class="card-group-count">${groups[g].length}</span></div>`;
      groups[g].forEach(c => {
        const cb = batchMode ? `<input type="checkbox" class="batch-checkbox card-batch-cb" data-id="${c.id}">` : '';
        html += `<div class="item-card${batchMode ? ' batch-mode' : ''}" data-id="${c.id}">
          ${cb}
          <span class="item-text">${this._escapeHtml(c.text)}</span>
          <div class="item-actions">
            <button class="item-btn edit-card-btn" data-id="${c.id}">✎</button>
            <button class="item-btn delete delete-card-btn" data-id="${c.id}">✕</button>
          </div>
        </div>`;
      });
    });

    container.innerHTML = html;

    container.querySelectorAll('.edit-card-btn').forEach(btn => {
      btn.addEventListener('click', () => this.editCard(Number(btn.dataset.id)));
    });
    container.querySelectorAll('.delete-card-btn').forEach(btn => {
      btn.addEventListener('click', () => this.deleteCard(Number(btn.dataset.id)));
    });

    if (batchMode) {
      container.querySelectorAll('.card-batch-cb').forEach(cb => {
        cb.addEventListener('change', updateCardBatchCount);
      });
    }
  },

  refreshGroupFilter() {
    const sel = document.getElementById('card-group-filter');
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = '<option value="">全部分组</option>';
    const groups = Store.getCardGroups();
    groups.forEach(g => {
      if (!g) return;
      const opt = document.createElement('option');
      opt.value = g;
      opt.textContent = g;
      sel.appendChild(opt);
    });
    sel.value = current;
  },

  renderEmojis() {
    const container = document.getElementById('emoji-list');
    const emojis = Store.getEmojis();
    if (!emojis.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">暂无表情包 ✨</p>';
      return;
    }
    const batchMode = container?.dataset.batch === '1';
    const builtin = emojis.filter(e => e.builtin);
    const custom = emojis.filter(e => !e.builtin);
    let html = '';

    if (builtin.length) {
      html += '<h4 class="emoji-section-title">Emoji</h4><div class="emoji-grid-inner">';
      html += builtin.map(e => {
        const cb = batchMode ? `<input type="checkbox" class="batch-checkbox emoji-batch-cb" data-id="${e.id}">` : '';
        const inner = e.type === 'image' && e.src
          ? `<img class="emoji-img" src="${e.src}" alt="${e.text}" title="${e.text}">`
          : `<span>${e.text}</span>`;
        return `<div class="emoji-item${batchMode ? ' batch-mode' : ''}" data-id="${e.id}">
          ${cb}${inner}
          <button class="emoji-delete" data-id="${e.id}">✕</button>
        </div>`;
      }).join('');
      html += '</div>';
    }

    if (custom.length) {
      html += '<h4 class="emoji-section-title">自定义</h4><div class="emoji-grid-inner">';
      html += custom.map(e => {
        const cb = batchMode ? `<input type="checkbox" class="batch-checkbox emoji-batch-cb" data-id="${e.id}">` : '';
        const inner = e.type === 'image' && e.src
          ? `<img class="emoji-img" src="${e.src}" alt="${e.text}" title="${e.text}">`
          : `<span>${e.text}</span>`;
        return `<div class="emoji-item${batchMode ? ' batch-mode' : ''}" data-id="${e.id}">
          ${cb}${inner}
          <button class="emoji-delete" data-id="${e.id}">✕</button>
        </div>`;
      }).join('');
      html += '</div>';
    }

    if (!builtin.length && !custom.length) {
      html = '<p class="hint-text" style="text-align:center;padding:20px;">暂无表情包 ✨</p>';
    }

    container.innerHTML = html;

    container.querySelectorAll('.emoji-delete').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        this.deleteEmoji(Number(btn.dataset.id));
      });
    });

    if (batchMode) {
      container.querySelectorAll('.emoji-batch-cb').forEach(cb => {
        cb.addEventListener('change', updateEmojiBatchCount);
      });
    }
  },



  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  editCard(id) {
    const card = Store.getCards().find(c => c.id === id);
    if (!card) return;
    document.getElementById('edit-card-input').value = card.text;
    document.getElementById('edit-card-group-input').value = card.group || '';
    showModal('edit-card-modal');
    document.getElementById('edit-card-confirm').onclick = () => {
      const text = document.getElementById('edit-card-input').value.trim();
      const group = document.getElementById('edit-card-group-input').value.trim();
      if (!text) { toast('内容不能为空'); return; }
      Store.updateCard(id, text, group);
      hideModal('edit-card-modal');
      this.renderCards();
      this.refreshGroupFilter();
      toast('已更新');
    };
  },

  async deleteCard(id) {
    const ok = await confirmDialog('删除字卡', '确定要删除这张字卡吗？');
    if (!ok) return;
    Store.deleteCard(id);
    this.renderCards();
    this.refreshGroupFilter();
    toast('已删除');
  },

  async deleteEmoji(id) {
    const ok = await confirmDialog('删除表情', '确定要删除这个表情吗？');
    if (!ok) return;
    Store.deleteEmoji(id);
    this.renderEmojis();
    this._updateEmojiPicker();
    toast('已删除');
  },

  _updateEmojiPicker() {
    this._populateEmojiPicker(document.getElementById('emoji-grid-picker'));
    this._populateEmojiPicker(document.getElementById('avatar-emoji-picker'), true);
  },

  _populateEmojiPicker(container, isAvatar) {
    if (!container) return;
    const emojis = Store.getEmojis();
    container.innerHTML = emojis.map(e => {
      const inner = e.type === 'image' && e.src
        ? `<img class="emoji-img-sm" src="${e.src}" alt="${e.text}">`
        : `<span>${e.text}</span>`;
      return `<div class="emoji-item" data-text="${e.text}" data-id="${e.id}">${inner}</div>`;
    }).join('');
  }
};

/***** Letters System *****/
const Letters = {
  init() {
    this.render();
    this.checkPendingReplies();
    this._checkTimer = setInterval(() => this.checkPendingReplies(), 60000);
  },

  render() {
    this.renderInbox();
    this.renderOutbox();
    this.updateBadge();
  },

  renderInbox() {
    const container = document.getElementById('inbox-list');
    const letters = Store.getLetters().filter(l => l.sender === 'character').sort((a, b) => b.timestamp - a.timestamp);
    const charName = Store.getSettings().characterName;
    if (!letters.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">收件箱为空 ✨</p>';
      return;
    }
    container.innerHTML = letters.map(l => {
      const isReply = l.replyToId != null;
      const statusLabel = l.status === 'replied' ? '已回复' : (l.status === 'read' ? '已读' : '未读');
      const statusClass = l.status;
      return `<div class="letter-item" data-id="${l.id}">
        <div class="letter-preview">
          <span class="letter-sender">${isReply ? '回复：' : ''}${charName}</span>
          <span class="letter-time">${fmtDate(l.timestamp)}</span>
        </div>
        <div class="letter-excerpt">${l.content.slice(0, 60)}${l.content.length > 60 ? '...' : ''}</div>
        <span class="letter-status ${statusClass}">${statusLabel}</span>
      </div>`;
    }).join('');

    container.querySelectorAll('.letter-item').forEach(el => {
      el.addEventListener('click', () => this.showLetter(Number(el.dataset.id)));
    });
  },

  renderOutbox() {
    const container = document.getElementById('outbox-list');
    const letters = Store.getLetters().filter(l => l.sender === 'user').sort((a, b) => b.timestamp - a.timestamp);
    const charName = Store.getSettings().characterName;
    if (!letters.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">发件箱为空 ✨</p>';
      return;
    }
    container.innerHTML = letters.map(l => {
      const reply = l.replyContent ? Store.getLetters().find(r => r.id === l.replyContent) : null;
      const statusLabel = l.status === 'replied' ? `${charName}已回复` : '等待回复';
      const statusClass = l.status;
      return `<div class="letter-item" data-id="${l.id}">
        <div class="letter-preview">
          <span class="letter-sender">寄给 ${charName}</span>
          <span class="letter-time">${fmtDate(l.timestamp)}</span>
        </div>
        <div class="letter-excerpt">${l.content.slice(0, 60)}${l.content.length > 60 ? '...' : ''}</div>
        <span class="letter-status ${statusClass}">${statusLabel}</span>
      </div>`;
    }).join('');

    container.querySelectorAll('.letter-item').forEach(el => {
      el.addEventListener('click', () => this.showLetter(Number(el.dataset.id)));
    });
  },

  updateBadge() {
    const badge = document.getElementById('letter-badge');
    const unread = Store.getLetters().filter(l => l.sender === 'character' && l.status === 'pending').length;
    if (unread > 0) {
      badge.textContent = unread > 99 ? '99+' : unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  },

  showLetter(id) {
    const letter = Store.getLetters().find(l => l.id === id);
    if (!letter) return;
    const settings = Store.getSettings();
    const charName = settings.characterName;
    const userName = settings.userName;

    document.getElementById('letter-detail-title').textContent = letter.sender === 'user' ? `寄给 ${charName}` : `来自 ${charName}`;
    document.getElementById('letter-detail-sender').textContent = letter.sender === 'user' ? userName : charName;
    document.getElementById('letter-detail-time').textContent = fmtDate(letter.timestamp);
    document.getElementById('letter-detail-body').textContent = letter.content;

    const replyArea = document.getElementById('letter-detail-reply');
    const replyBody = document.getElementById('letter-detail-reply-body');
    const replyTime = document.getElementById('letter-detail-reply-time');

    if (letter.replyContent) {
      const replyLetter = Store.getLetters().find(l => l.id === letter.replyContent);
      if (replyLetter) {
        replyArea.classList.remove('hidden');
        replyBody.textContent = replyLetter.content;
        replyTime.textContent = fmtDate(replyLetter.timestamp);
      } else {
        replyArea.classList.add('hidden');
      }
    } else {
      replyArea.classList.add('hidden');
    }

    if (letter.sender === 'character' && letter.status === 'pending') {
      Store.updateLetter(id, { status: 'read' });
      this.render();
    }

    showModal('letter-detail-modal');
  },

  sendLetter(content) {
    if (!content.trim()) { toast('请写入信内容'); return; }
    const letter = Store.addLetter('user', content.trim());
    toast('信件已寄出，梦角将在12小时内回复 ✨');
    this.render();
    this.scheduleLetterReply(letter.id);
  },

  scheduleLetterReply(letterId) {
    const delay = 12 * 60 * 60 * 1000;
    setTimeout(() => {
      this.generateLetterReply(letterId);
    }, delay);
  },

  generateLetterReply(letterId) {
    const sources = Chat._getAllSources();
    if (!sources.length) return;
    const sentenceCount = rand(1, 30);
    let content = '';
    for (let i = 0; i < sentenceCount; i++) {
      const src = pickRandom(sources);
      content += src.text;
      if (i < sentenceCount - 1 && Math.random() > 0.5) content += '。';
    }
    const reply = Store.addLetter('character', content, null);
    Store.updateLetter(letterId, { status: 'replied', replyContent: reply.id });
    this.render();
    toast('梦角回复了你的信 ✨');
  },

  checkPendingReplies() {
    const letters = Store.getLetters().filter(l => l.sender === 'user' && l.status === 'pending');
    const now = Date.now();
    const twelveHours = 12 * 60 * 60 * 1000;
    letters.forEach(l => {
      if (now - l.timestamp >= twelveHours && !l.replyContent) {
        this.generateLetterReply(l.id);
      }
    });
  },

  _scheduleAutoLetter() {
    const settings = Store.getSettings();
    if (!settings.autoMsg) return;
    this._autoLetterTimer = setInterval(() => {
      if (document.hidden) return;
      const sources = Chat._getAllSources();
      if (!sources.length) return;
      const sentToday = Store.getLetters().filter(l =>
        l.sender === 'character' && !l.replyToId &&
        new Date(l.timestamp).toDateString() === new Date().toDateString()
      );
      if (sentToday.length >= 3) return;

      const sentenceCount = rand(1, 10);
      let content = '';
      for (let i = 0; i < sentenceCount; i++) {
        const src = pickRandom(sources);
        content += src.text;
        if (i < sentenceCount - 1 && Math.random() > 0.5) content += '。';
      }
      const letter = Store.addLetter('character', content, null);
      this.render();
      toast('梦角寄来了一封信 ✉️');
    }, 4 * 60 * 60 * 1000);
  }
};

/***** Appearance *****/
function adjustColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xFF) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xFF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xFF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function applyAppearance(s) {
  if (!s) s = Store.getSettings();
  const root = document.documentElement;

  // Theme color
  root.style.setProperty('--primary', s.themeColor);
  root.style.setProperty('--primary-dark', adjustColor(s.themeColor, -20));
  root.style.setProperty('--primary-light', adjustColor(s.themeColor, 40));

  // Bubble colors
  root.style.setProperty('--user-msg', s.userBubbleColor);
  root.style.setProperty('--user-msg-text', getContrastColor(s.userBubbleColor));
  root.style.setProperty('--char-msg', s.charBubbleColor);
  root.style.setProperty('--char-msg-text', getContrastColor(s.charBubbleColor));

  // Chat background
  const msgList = document.getElementById('message-list');
  if (msgList) {
    if (s.chatBgType === 'image' && s.chatBgImage) {
      msgList.style.background = `url(${s.chatBgImage}) center/cover no-repeat`;
      msgList.style.backgroundColor = 'transparent';
    } else {
      msgList.style.background = '';
      msgList.style.backgroundColor = s.chatBgColor;
    }
  }

  // Font size
  root.style.setProperty('--font-size', s.fontSize + 'px');
  root.style.setProperty('--msg-font-size', (s.fontSize + 1) + 'px');

  // Font family - follow system
  root.style.setProperty('--font-family', s.useSystemFont
    ? '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    : '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif');
}

function getContrastColor(hex) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xFF, g = (num >> 8) & 0xFF, b = num & 0xFF;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#3d2c3a' : '#ffffff';
}

/***** Settings System *****/
const Settings = {
  _avatarTarget: null,

  init() {
    this.load();
    this.bindEvents();
  },

  load() {
    const s = Store.getSettings();
    document.getElementById('settings-user-name').value = s.userName;
    document.getElementById('settings-character-name').value = s.characterName;
    this._setAvatar('settings-user-avatar', s.userAvatar);
    this._setAvatar('settings-character-avatar', s.characterAvatar);
    document.getElementById('settings-reply-min').value = s.replyMin;
    document.getElementById('settings-reply-max').value = s.replyMax;
    document.getElementById('settings-auto-msg').checked = s.autoMsg;
    document.getElementById('settings-auto-interval').value = s.autoInterval;
    document.getElementById('settings-combine').checked = s.combine;
    document.getElementById('settings-combine-count').value = s.combineCount;
    document.getElementById('settings-combine-count-label').textContent = s.combineCount + '句';
    document.getElementById('toggle-combine').checked = s.combine;
    document.getElementById('settings-theme-color').value = s.themeColor;
    document.getElementById('settings-user-bubble').value = s.userBubbleColor;
    document.getElementById('settings-char-bubble').value = s.charBubbleColor;
    document.getElementById('settings-chat-bg-color').value = s.chatBgColor;
    document.getElementById('settings-chat-bg-type-color').checked = s.chatBgType === 'color';
    document.getElementById('settings-chat-bg-type-image').checked = s.chatBgType === 'image';
    document.getElementById('settings-font-size').value = s.fontSize;
    document.getElementById('settings-font-size-label').textContent = s.fontSize + 'px';
    document.getElementById('settings-use-system-font').checked = s.useSystemFont;
    document.getElementById('settings-auto-reply').checked = s.autoReply !== false;
    document.getElementById('settings-letter-interval').value = s.letterInterval;
    document.getElementById('settings-letter-interval-label').textContent = s.letterInterval + '小时';
    this._updateSliderLabels(s);
    this._updateAutoIntervalVisibility(s.autoMsg);
    this._updateHeader();
    this._updateCombineUI(s);
    this._updateChatBgUI(s);
    applyAppearance(s);
  },

  _setAvatar(elId, val) {
    const el = document.getElementById(elId);
    if (val.startsWith('data:') || val.startsWith('http')) {
      el.innerHTML = `<img src="${val}" alt="avatar">`;
    } else {
      el.textContent = val;
    }
  },

  _updateSliderLabels(s) {
    const fmt = (sec) => {
      if (sec >= 60) return `${Math.round(sec/60)}分钟`;
      return `${sec}秒`;
    };
    document.getElementById('settings-reply-min-label').textContent = fmt(s.replyMin);
    document.getElementById('settings-reply-max-label').textContent = fmt(s.replyMax);
    document.getElementById('settings-auto-interval-label').textContent = fmt(s.autoInterval);
  },

  _updateAutoIntervalVisibility(visible) {
    document.getElementById('settings-auto-interval-row').style.display = visible ? 'flex' : 'none';
  },

  _updateCombineUI(s) {
    document.getElementById('settings-combine-count-row').style.display = s.combine ? 'flex' : 'none';
  },

  _updateChatBgUI(s) {
    const isImage = s.chatBgType === 'image';
    document.getElementById('settings-chat-bg-file-row').style.display = isImage ? 'flex' : 'none';
    document.getElementById('settings-chat-bg-color-row').style.display = isImage ? 'none' : 'flex';
  },

  _updateHeader() {
    const s = Store.getSettings();
    this._setAvatar('header-avatar', s.characterAvatar);
    document.getElementById('header-name').textContent = s.characterName;
    const title = document.querySelector('title');
    if (title) title.textContent = `${s.characterName} - 梦角传讯`;
    const statusEl = document.getElementById('header-mood-status');
    const phrase = Store.getRandomStatusPhrase();
    if (phrase) {
      statusEl.textContent = phrase.replace('{char}', s.characterName).replace('{user}', s.userName);
    } else {
      statusEl.textContent = '';
    }
  },

  save() {
    const old = Store.getSettings();
    const s = Store.getSettings();
    s.userName = document.getElementById('settings-user-name').value.trim() || '我';
    s.characterName = document.getElementById('settings-character-name').value.trim() || '梦角';
    s.replyMin = Number(document.getElementById('settings-reply-min').value);
    s.replyMax = Number(document.getElementById('settings-reply-max').value);
    s.autoMsg = document.getElementById('settings-auto-msg').checked;
    s.autoInterval = Number(document.getElementById('settings-auto-interval').value);
    s.combine = document.getElementById('settings-combine').checked;
    s.combineCount = Number(document.getElementById('settings-combine-count').value);
    s.themeColor = document.getElementById('settings-theme-color').value;
    s.userBubbleColor = document.getElementById('settings-user-bubble').value;
    s.charBubbleColor = document.getElementById('settings-char-bubble').value;
    s.chatBgColor = document.getElementById('settings-chat-bg-color').value;
    s.chatBgType = document.getElementById('settings-chat-bg-type-color').checked ? 'color' : 'image';
    s.fontSize = Number(document.getElementById('settings-font-size').value);
    s.useSystemFont = document.getElementById('settings-use-system-font').checked;
    s.autoReply = document.getElementById('settings-auto-reply').checked;
    s.letterInterval = Number(document.getElementById('settings-letter-interval').value);
    Store.saveSettings(s);
    this._updateHeader();
    this._updateSliderLabels(s);
    document.getElementById('toggle-combine').checked = s.combine;
    this._updateCombineUI(s);
    this._updateChatBgUI(s);
    if (Chat._startProactiveMessages) {
      Chat._startProactiveMessages();
    }
    if (Letters._ensureProactiveLetters) {
      Letters._ensureProactiveLetters();
    }
    applyAppearance(s);
    toast('设置已保存');
  },

  bindEvents() {
    const s = Store.getSettings();
    const debounce = (fn, ms) => {
      let timer;
      return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
    };
    const saveDebounced = debounce(() => this.save(), 500);

    document.getElementById('settings-user-name').addEventListener('change', () => this.save());
    document.getElementById('settings-character-name').addEventListener('change', () => this.save());

    ['settings-reply-min', 'settings-reply-max', 'settings-auto-interval'].forEach(id => {
      document.getElementById(id).addEventListener('input', () => {
        const s = Store.getSettings();
        s.replyMin = Number(document.getElementById('settings-reply-min').value);
        s.replyMax = Number(document.getElementById('settings-reply-max').value);
        s.autoInterval = Number(document.getElementById('settings-auto-interval').value);
        this._updateSliderLabels(s);
        saveDebounced();
      });
    });

    document.getElementById('settings-auto-msg').addEventListener('change', () => {
      this._updateAutoIntervalVisibility(document.getElementById('settings-auto-msg').checked);
      this.save();
    });

    document.getElementById('settings-combine').addEventListener('change', () => this.save());

    document.getElementById('toggle-combine').addEventListener('change', () => {
      document.getElementById('settings-combine').checked = document.getElementById('toggle-combine').checked;
      this.save();
    });

    document.getElementById('settings-letter-interval').addEventListener('input', () => {
      const val = Number(document.getElementById('settings-letter-interval').value);
      document.getElementById('settings-letter-interval-label').textContent = val + '小时';
      saveDebounced();
    });

    document.getElementById('settings-auto-reply').addEventListener('change', () => this.save());

    document.getElementById('btn-open-atmosphere').addEventListener('click', () => {
      renderAtmos();
      showModal('atmosphere-modal');
    });

    document.getElementById('settings-combine-count').addEventListener('input', () => {
      const val = Number(document.getElementById('settings-combine-count').value);
      document.getElementById('settings-combine-count-label').textContent = val + '句';
      saveDebounced();
    });

    document.getElementById('settings-theme-color').addEventListener('input', () => {
      const color = document.getElementById('settings-theme-color').value;
      const s = Store.getSettings(); s.themeColor = color;
      applyAppearance(s);
      saveDebounced();
    });

    document.getElementById('settings-user-bubble').addEventListener('input', () => {
      const s = Store.getSettings(); s.userBubbleColor = document.getElementById('settings-user-bubble').value;
      applyAppearance(s);
      saveDebounced();
    });
    document.getElementById('settings-char-bubble').addEventListener('input', () => {
      const s = Store.getSettings(); s.charBubbleColor = document.getElementById('settings-char-bubble').value;
      applyAppearance(s);
      saveDebounced();
    });
    document.getElementById('settings-chat-bg-color').addEventListener('input', () => {
      const s = Store.getSettings(); s.chatBgColor = document.getElementById('settings-chat-bg-color').value;
      applyAppearance(s);
      saveDebounced();
    });
    document.querySelectorAll('input[name="chat-bg-type"]').forEach(el => {
      el.addEventListener('change', () => {
        const type = document.getElementById('settings-chat-bg-type-color').checked ? 'color' : 'image';
        const s = Store.getSettings(); s.chatBgType = type;
        this._updateChatBgUI(s);
        applyAppearance(s);
        saveDebounced();
      });
    });
    document.getElementById('btn-chat-bg-upload').addEventListener('click', () => {
      document.getElementById('chat-bg-file-input').click();
    });
    document.getElementById('chat-bg-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const s = Store.getSettings();
        s.chatBgImage = ev.target.result;
        s.chatBgType = 'image';
        document.getElementById('settings-chat-bg-type-image').checked = true;
        this._updateChatBgUI(s);
        Store.saveSettings(s);
        applyAppearance(s);
        toast('聊天背景已更新');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
    document.getElementById('btn-chat-bg-clear').addEventListener('click', () => {
      const s = Store.getSettings();
      s.chatBgImage = null;
      s.chatBgType = 'color';
      document.getElementById('settings-chat-bg-type-color').checked = true;
      this._updateChatBgUI(s);
      applyAppearance(s);
      saveDebounced();
    });

    document.getElementById('settings-font-size').addEventListener('input', () => {
      const val = Number(document.getElementById('settings-font-size').value);
      document.getElementById('settings-font-size-label').textContent = val + 'px';
      const s = Store.getSettings(); s.fontSize = val;
      applyAppearance(s);
      saveDebounced();
    });
    document.getElementById('settings-use-system-font').addEventListener('change', () => this.save());

    document.getElementById('btn-change-user-avatar').addEventListener('click', () => {
      this._avatarTarget = 'user';
      this._openAvatarPicker();
    });
    document.getElementById('btn-change-character-avatar').addEventListener('click', () => {
      this._avatarTarget = 'character';
      this._openAvatarPicker();
    });

    document.getElementById('btn-upload-avatar').addEventListener('click', () => {
      document.getElementById('avatar-file-input').click();
    });
    document.getElementById('avatar-file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        if (this._avatarTarget === 'user') {
          const s = Store.getSettings();
          s.userAvatar = dataUrl;
          Store.saveSettings(s);
          this._setAvatar('settings-user-avatar', dataUrl);
        } else {
          const s = Store.getSettings();
          s.characterAvatar = dataUrl;
          Store.saveSettings(s);
          this._setAvatar('settings-character-avatar', dataUrl);
        }
        this._updateHeader();
        hideModal('avatar-picker-modal');
        toast('头像已更新');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    });
  },

  _openAvatarPicker() {
    const container = document.getElementById('avatar-emoji-picker');
    const emojis = ['😊', '🥰', '😎', '🤗', '✨', '🌟', '💫', '🌸', '🌺', '🌷', '🌈', '💕', '💖', '💗', '🦋', '🌙', '⭐', '☀️', '🍀', '🎀', '👑', '💎', '🧸', '🎠', '🌊', '🍃', '🌻', '🌹', '💝', '🕊️', '🦄', '🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯'];
    container.innerHTML = emojis.map(e =>
      `<div class="emoji-item" data-text="${e}"><span>${e}</span></div>`
    ).join('');

    container.querySelectorAll('.emoji-item').forEach(el => {
      el.addEventListener('click', () => {
        const emoji = el.dataset.text;
        const s = Store.getSettings();
        if (this._avatarTarget === 'user') {
          s.userAvatar = emoji;
          this._setAvatar('settings-user-avatar', emoji);
        } else {
          s.characterAvatar = emoji;
          this._setAvatar('settings-character-avatar', emoji);
        }
        Store.saveSettings(s);
        this._updateHeader();
        hideModal('avatar-picker-modal');
        toast('头像已更新');
      });
    });

    showModal('avatar-picker-modal');
  }
};

/***** Atmosphere render (global) *****/
function renderAtmos() {
  const container = document.getElementById('atmosphere-list');
  if (!container) return;
  const list = Store.getAtmospheres();
  if (!list.length) {
    container.innerHTML = '<p class="hint-text" style="text-align:center;padding:12px;">暂无氛围语，添加一些吧</p>';
    return;
  }
  container.innerHTML = list.map(a =>
    `<div class="item-card"><span class="item-text">${(()=>{const d=document.createElement('div');d.textContent=a.text;return d.innerHTML;})()}</span>
    <div class="item-actions"><button class="item-btn delete delete-atm-btn" data-id="${a.id}">✕</button></div></div>`
  ).join('');
  container.querySelectorAll('.delete-atm-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      Store.deleteAtmosphere(Number(btn.dataset.id));
      renderAtmos();
      toast('已删除');
    });
  });
}

/***** App Initialization *****/
function init() {
  // Load settings
  Settings.init();

  // Chat init
  Chat.init();

  // Cards init
  Cards.render();
  Cards.refreshGroupFilter();

  // Letters init
  Letters.init();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${tab}`).classList.add('active');
      if (tab === 'chat') Chat.scrollToBottom();
      if (tab === 'letters') Letters.render();
      if (tab === 'cards') { Cards.render(); Cards.refreshGroupFilter(); }
    });
  });

  // View tabs inside views
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.dataset.tab;
      const parent = tab.closest('.view');
      parent.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      parent.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Chat send
  document.getElementById('btn-send').addEventListener('click', () => {
    const input = document.getElementById('chat-input');
    Chat.sendMessage(input.value);
    input.value = '';
  });
  document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.getElementById('btn-send').click();
    }
  });

  // Emoji picker
  document.getElementById('btn-emoji-picker').addEventListener('click', () => {
    Cards._populateEmojiPicker(document.getElementById('emoji-grid-picker'));
    showModal('emoji-picker-modal');
  });
  document.getElementById('emoji-grid-picker').addEventListener('click', (e) => {
    const item = e.target.closest('.emoji-item');
    if (!item) return;
    const emojiId = item.dataset.id;
    const input = document.getElementById('chat-input');
    input.value += ` [e:${emojiId}] `;
    input.focus();
    hideModal('emoji-picker-modal');
  });

  // Image upload in chat
  document.getElementById('btn-img-upload').addEventListener('click', () => {
    document.getElementById('chat-img-input').click();
  });
  document.getElementById('chat-img-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target.result;
      Store.addEmoji('图片', 'image', src);
      const stored = Store.getEmojis();
      const emoji = stored.find(e => e.src === src);
      if (emoji) {
        const input = document.getElementById('chat-input');
        input.value += ` [e:${emoji.id}] `;
        input.focus();
        Cards._updateEmojiPicker();
        toast('图片已添加到表情包');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });

  // Modal close handlers
  document.querySelectorAll('.modal-close, .modal-backdrop').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop') && e.target.closest('.modal').id === 'confirm-dialog') return;
      if (e.target.classList.contains('modal-backdrop')) {
        e.currentTarget.closest('.modal').classList.add('hidden');
      }
      const modal = e.target.closest('.modal');
      if (modal) modal.classList.add('hidden');
    });
  });

  // Add card
  document.getElementById('btn-add-card').addEventListener('click', () => {
    document.getElementById('add-card-input').value = '';
    document.getElementById('add-card-group-input').value = '';
    showModal('add-card-modal');
  });
  document.getElementById('add-card-confirm').addEventListener('click', () => {
    const text = document.getElementById('add-card-input').value.trim();
    const group = document.getElementById('add-card-group-input').value.trim();
    if (!text) { toast('内容不能为空'); return; }
    if (Store.addCard(text, group)) {
      toast('已添加');
      Cards.renderCards();
      Cards.refreshGroupFilter();
      hideModal('add-card-modal');
    } else {
      toast('已存在相同字卡');
    }
  });

  // Batch import
  document.getElementById('btn-batch-import').addEventListener('click', () => {
    document.getElementById('batch-input').value = '';
    document.getElementById('batch-group-input').value = '';
    showModal('batch-modal');
  });
  document.getElementById('batch-confirm').addEventListener('click', () => {
    const text = document.getElementById('batch-input').value;
    const group = document.getElementById('batch-group-input').value.trim();
    const lines = text.split('\n').filter(l => l.trim());
    if (!lines.length) { toast('请输入内容'); return; }
    const count = Store.batchImportCards(lines, group);
    Cards.renderCards();
    Cards.refreshGroupFilter();
    hideModal('batch-modal');
    toast(`成功导入 ${count} 张字卡${lines.length - count > 0 ? `，跳过 ${lines.length - count} 个重复` : ''}`);
  });

  // Card search & group filter
  document.getElementById('card-search-input').addEventListener('input', () => { Cards.renderCards(); });
  document.getElementById('card-group-filter').addEventListener('change', () => { Cards.renderCards(); });

  // Group management
  document.getElementById('btn-manage-groups').addEventListener('click', () => {
    renderGroupList();
    showModal('group-modal');
  });

  function renderGroupList() {
    const container = document.getElementById('group-list');
    const groups = Store.getCardGroups();
    const counts = {};
    Store.getCards().forEach(c => { const g = c.group || ''; counts[g] = (counts[g] || 0) + 1; });
    if (!groups.length || (groups.length === 1 && !groups[0])) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:12px;">暂无分组</p>';
      return;
    }
    container.innerHTML = groups.map(g => {
      if (!g) return '';
      const count = counts[g] || 0;
      return `<div class="item-card">
        <span class="item-text">${Cards._escapeHtml(g)} <span style="font-size:12px;color:var(--text-secondary);">(${count})</span></span>
        <div class="item-actions">
          <button class="item-btn rename-group-btn" data-group="${Cards._escapeHtml(g)}">✎</button>
          <button class="item-btn delete delete-group-btn" data-group="${Cards._escapeHtml(g)}">✕</button>
        </div>
      </div>`;
    }).join('');
    container.querySelectorAll('.rename-group-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const oldName = btn.dataset.group;
        const newName = prompt('输入新名称：', oldName);
        if (!newName || newName === oldName) return;
        Store.renameGroup(oldName, newName);
        renderGroupList();
        Cards.renderCards();
        Cards.refreshGroupFilter();
        toast('已重命名');
      });
    });
    container.querySelectorAll('.delete-group-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.group;
        const ok = await confirmDialog('删除分组', `确定删除分组"${name}"？字卡将移至"未分组"。`);
        if (!ok) return;
        Store.deleteGroup(name);
        renderGroupList();
        Cards.renderCards();
        Cards.refreshGroupFilter();
        toast('已删除分组');
      });
    });
  }

  // ---- Batch Management ----
  let _cardBatchMode = false;
  let _emojiBatchMode = false;

  function updateCardBatchCount() {
    const checked = document.querySelectorAll('.card-batch-cb:checked').length;
    document.getElementById('card-selected-count').textContent = `已选 ${checked} 项`;
  }

  function updateEmojiBatchCount() {
    const checked = document.querySelectorAll('.emoji-batch-cb:checked').length;
    document.getElementById('emoji-selected-count').textContent = `已选 ${checked} 项`;
  }

  document.getElementById('btn-card-batch-mode').addEventListener('click', () => {
    _cardBatchMode = !_cardBatchMode;
    document.getElementById('card-list').dataset.batch = _cardBatchMode ? '1' : '0';
    document.getElementById('card-batch-actions').classList.toggle('hidden', !_cardBatchMode);
    document.getElementById('btn-card-batch-mode').textContent = _cardBatchMode ? '退出批量' : '批量管理';
    Cards.renderCards();
  });

  document.getElementById('btn-card-batch-exit').addEventListener('click', () => {
    document.getElementById('btn-card-batch-mode').click();
  });

  document.getElementById('btn-card-batch-select-all').addEventListener('click', () => {
    document.querySelectorAll('.card-batch-cb').forEach(cb => cb.checked = true);
    updateCardBatchCount();
  });

  document.getElementById('btn-card-batch-clear').addEventListener('click', () => {
    document.querySelectorAll('.card-batch-cb').forEach(cb => cb.checked = false);
    updateCardBatchCount();
  });

  document.getElementById('btn-card-batch-delete').addEventListener('click', async () => {
    const checked = document.querySelectorAll('.card-batch-cb:checked');
    if (!checked.length) { toast('请先选择字卡'); return; }
    const ok = await confirmDialog('批量删除', `确定删除选中的 ${checked.length} 张字卡？`);
    if (!ok) return;
    checked.forEach(cb => Store.deleteCard(Number(cb.dataset.id)));
    Cards.renderCards();
    Cards.refreshGroupFilter();
    updateCardBatchCount();
    toast(`已删除 ${checked.length} 张字卡`);
  });

  // Emoji batch mode
  document.getElementById('btn-emoji-batch-mode').addEventListener('click', () => {
    _emojiBatchMode = !_emojiBatchMode;
    document.getElementById('emoji-list').dataset.batch = _emojiBatchMode ? '1' : '0';
    document.getElementById('emoji-batch-actions').classList.toggle('hidden', !_emojiBatchMode);
    document.getElementById('btn-emoji-batch-mode').textContent = _emojiBatchMode ? '退出批量' : '批量管理';
    Cards.renderEmojis();
  });

  document.getElementById('btn-emoji-batch-exit').addEventListener('click', () => {
    document.getElementById('btn-emoji-batch-mode').click();
  });

  document.getElementById('btn-emoji-batch-select-all').addEventListener('click', () => {
    document.querySelectorAll('.emoji-batch-cb').forEach(cb => cb.checked = true);
    updateEmojiBatchCount();
  });

  document.getElementById('btn-emoji-batch-clear').addEventListener('click', () => {
    document.querySelectorAll('.emoji-batch-cb').forEach(cb => cb.checked = false);
    updateEmojiBatchCount();
  });

  document.getElementById('btn-emoji-batch-delete').addEventListener('click', async () => {
    const checked = document.querySelectorAll('.emoji-batch-cb:checked');
    if (!checked.length) { toast('请先选择表情'); return; }
    const ok = await confirmDialog('批量删除', `确定删除选中的 ${checked.length} 个表情？`);
    if (!ok) return;
    checked.forEach(cb => Store.deleteEmoji(Number(cb.dataset.id)));
    Cards.renderEmojis();
    updateEmojiBatchCount();
    toast(`已删除 ${checked.length} 个表情`);
  });

  // Batch add emoji images
  document.getElementById('btn-emoji-batch-add').addEventListener('click', () => {
    document.getElementById('emoji-batch-img-input').click();
  });
  document.getElementById('emoji-batch-img-input').addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files.length) return;
    let loaded = 0;
    let total = files.length;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        Store.addEmoji(file.name.replace(/\.[^.]+$/, ''), 'image', ev.target.result);
        loaded++;
        if (loaded === total) {
          Cards.renderEmojis();
          toast(`已添加 ${total} 张图片到表情包`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  // Add emoji
  document.getElementById('btn-add-emoji').addEventListener('click', () => {
    document.getElementById('add-emoji-input').value = '';
    document.getElementById('add-emoji-preview').classList.add('hidden');
    document.getElementById('add-emoji-preview').textContent = '';
    showModal('add-emoji-modal');
  });
  document.getElementById('btn-emoji-upload-img').addEventListener('click', () => {
    document.getElementById('emoji-img-input').click();
  });
  document.getElementById('emoji-img-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = document.getElementById('add-emoji-preview');
      preview.classList.remove('hidden');
      preview.innerHTML = `<img src="${ev.target.result}" style="max-width:80px;max-height:80px;border-radius:8px;">`;
      preview._src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  document.getElementById('add-emoji-confirm').addEventListener('click', () => {
    const text = document.getElementById('add-emoji-input').value.trim();
    const preview = document.getElementById('add-emoji-preview');
    const imgSrc = preview._src;
    if (!text && !imgSrc) { toast('请输入文字或选择图片'); return; }
    if (imgSrc) {
      Store.addEmoji(text || '图片', 'image', imgSrc);
    } else {
      if (Store.addEmoji(text)) {
        toast('已添加');
      } else {
        toast('已存在相同表情');
        return;
      }
    }
    Cards.renderEmojis();
    Cards._updateEmojiPicker();
    hideModal('add-emoji-modal');
    toast('表情已添加');
  });

  // Write letter
  document.getElementById('btn-write-letter').addEventListener('click', () => {
    document.getElementById('letter-content-input').value = '';
    const name = Store.getSettings().characterName;
    document.getElementById('write-letter-recipient').textContent = name;
    showModal('write-letter-modal');
  });
  document.getElementById('send-letter-confirm').addEventListener('click', () => {
    const content = document.getElementById('letter-content-input').value;
    Letters.sendLetter(content);
    hideModal('write-letter-modal');
  });

  // Export/Import/Clear data
  document.getElementById('btn-export-data').addEventListener('click', () => {
    const data = Store.exportAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `梦角传讯数据_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('数据已导出');
  });

  document.getElementById('btn-import-data').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          Store.importAll(data);
          Settings.init();
          Chat.render();
          Cards.render();
          Letters.render();
          toast('数据已导入');
        } catch {
          toast('导入失败，文件格式不正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });

  document.getElementById('btn-clear-data').addEventListener('click', async () => {
    const ok = await confirmDialog('清空数据', '确定要清空所有数据吗？此操作不可恢复！');
    if (!ok) return;
    Store.clearAll();
    Settings.init();
    Chat.render();
    Cards.render();
    Letters.render();
    toast('所有数据已清空');
  });

  // Mood Journal
  document.getElementById('btn-mood-journal').addEventListener('click', () => openMoodJournal());

  let _calMonth = new Date().getMonth();
  let _calYear = new Date().getFullYear();

  function openMoodJournal() {
    const emojiContainer = document.getElementById('mood-emoji-picker');
    const emojis = Store.getEmojis();
    emojiContainer.innerHTML = emojis.map(e => {
      const inner = e.type === 'image' && e.src
        ? `<img class="emoji-img-sm" src="${e.src}" alt="${e.text}">`
        : `<span>${e.text}</span>`;
      return `<div class="emoji-item" data-id="${e.id}">${inner}</div>`;
    }).join('');
    const today = Store.getTodayMood();
    if (today) {
      document.getElementById('mood-status-text').textContent = today.status || '(无状态)';
    } else {
      document.getElementById('mood-status-text').textContent = '点击下方表情选择今日心情…';
    }
    _calMonth = new Date().getMonth();
    _calYear = new Date().getFullYear();
    renderMoodCalendar();
    renderMoodHistory();
    showModal('mood-modal');

    // Select mood emoji
    emojiContainer.querySelectorAll('.emoji-item').forEach(el => {
      el.addEventListener('click', () => {
        emojiContainer.querySelectorAll('.emoji-item').forEach(e => e.style.borderColor = 'var(--border)');
        el.style.borderColor = 'var(--primary)';
        el._selected = true;
        const id = Number(el.dataset.id);
        const charName = Store.getSettings().characterName;
        const atm = Store.getAtmospheres();
        const atmText = atm.length ? atm[rand(0, atm.length-1)].text : '';
        const statusParts = [];
        const cards = Store.getCards();
        if (cards.length) {
          const count = rand(1, Math.min(3, cards.length));
          const used = new Set();
          while (statusParts.length < count) {
            const c = cards[rand(0, cards.length-1)];
            if (used.has(c.id)) continue;
            used.add(c.id);
            statusParts.push(c.text);
          }
        }
        let status = statusParts.join('、');
        if (atmText) status = status ? `${status} · ${atmText}` : atmText;
        document.getElementById('mood-status-text').textContent = status || '(无状态)';
        el._selectedStatus = status;
      });
    });
  }

  function renderMoodCalendar() {
    const container = document.getElementById('mood-calendar');
    if (!container) return;
    const moods = Store.getMoods();
    const moodByDate = {};
    moods.forEach(m => { moodByDate[m.date] = m; });

    document.getElementById('cal-title').textContent = `${_calYear}年${_calMonth+1}月`;

    const firstDay = new Date(_calYear, _calMonth, 1).getDay();
    const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
    const todayStr = new Date().toDateString();

    let html = '';
    const weekdays = ['日','一','二','三','四','五','六'];
    weekdays.forEach(d => { html += `<div class="cal-header">${d}</div>`; });

    for (let i = 0; i < firstDay; i++) {
      html += '<div class="cal-day cal-empty"></div>';
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(_calYear, _calMonth, d);
      const dateStr = date.toDateString();
      const entry = moodByDate[dateStr];
      const isToday = dateStr === todayStr;
      const hasEntry = !!entry;
      let classes = 'cal-day';
      if (isToday) classes += ' cal-today';
      if (hasEntry) classes += ' cal-has-entry';
      const emojiObj = entry ? Store.getEmojis().find(e => e.id === Number(entry.mood)) : null;
      const emojiText = emojiObj ? (emojiObj.type === 'image' && emojiObj.src ? '🖼️' : emojiObj.text) : '';
      html += `<div class="${classes}" data-date="${dateStr}">
        ${emojiText ? `<span class="cal-emoji">${emojiText}</span>` : ''}
        <span class="cal-date">${d}</span>
      </div>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('.cal-day.cal-has-entry').forEach(el => {
      el.addEventListener('click', () => {
        const dateStr = el.dataset.date;
        const entry = moodByDate[dateStr];
        if (!entry) return;
        const emojiObj = Store.getEmojis().find(e => e.id === Number(entry.mood));
        const emojiText = emojiObj ? (emojiObj.type === 'image' && emojiObj.src ? '🖼️' : emojiObj.text) : '💭';
        const elId = document.getElementById('mood-emoji-picker');
        elId.querySelectorAll('.emoji-item').forEach(e => e.style.borderColor = 'var(--border)');
        const targetEmoji = elId.querySelector(`[data-id="${entry.mood}"]`);
        if (targetEmoji) targetEmoji.style.borderColor = 'var(--primary)';
        document.getElementById('mood-status-text').textContent = entry.status || '(无状态)';
        toast(`${emojiText} ${fmtDate(entry.timestamp)}`);
      });
    });
  }

  document.getElementById('btn-save-mood').addEventListener('click', () => {
    const selected = document.querySelector('#mood-emoji-picker .emoji-item[style*="var(--primary)"]');
    if (!selected) { toast('请选择一个心情表情'); return; }
    const moodId = selected.dataset.id;
    const status = document.getElementById('mood-status-text').textContent;
    Store.addMood(moodId, status);
    Settings._updateHeader();
    renderMoodCalendar();
    renderMoodHistory();
    hideModal('mood-modal');
    toast('心情已记录');
  });

  // Calendar navigation
  document.getElementById('cal-prev').addEventListener('click', () => {
    _calMonth--;
    if (_calMonth < 0) { _calMonth = 11; _calYear--; }
    renderMoodCalendar();
  });
  document.getElementById('cal-next').addEventListener('click', () => {
    _calMonth++;
    if (_calMonth > 11) { _calMonth = 0; _calYear++; }
    renderMoodCalendar();
  });

  function renderMoodHistory() {
    const container = document.getElementById('mood-history-list');
    const moods = Store.getMoods();
    if (!moods.length) {
      container.innerHTML = '<p class="hint-text">暂无心情记录</p>';
      return;
    }
    container.innerHTML = moods.slice().reverse().slice(0, 30).map(m => {
      const e = Store.getEmojis().find(em => em.id === Number(m.mood));
      const emojiText = e ? (e.type === 'image' && e.src ? '🖼️' : e.text) : '💭';
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px;">
        <span>${emojiText} ${m.status || ''}</span>
        <span style="color:var(--text-secondary);font-size:12px;">${fmtDate(m.timestamp)}</span>
      </div>`;
    }).join('');
  }

  // Favorites
  document.getElementById('btn-favorites').addEventListener('click', () => {
    const container = document.getElementById('favorites-list');
    const favs = Store.getFavorites().slice().reverse();
    if (!favs.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:20px;">暂无收藏的消息</p>';
    } else {
      container.innerHTML = favs.map(m => {
        const who = m.sender === 'user' ? '你' : Store.getSettings().characterName;
        return `<div class="item-card">
          <div><span style="font-weight:600;font-size:13px;">${who}</span><br>
          <span style="font-size:13px;color:var(--text-secondary);">${Chat._renderContent(m.content.slice(0,80))}</span></div>
          <span style="font-size:12px;color:var(--text-secondary);white-space:nowrap;">${fmtDate(m.timestamp)}</span>
        </div>`;
      }).join('');
    }
    showModal('favorites-modal');
  });

  // Call System
  let callTimer = null;
  let callSeconds = 0;
  let callScale = 1;
  let incomingCallTimer = null;
  let callActive = false;

  function setupActiveCall(type) {
    const s = Store.getSettings();
    Settings._setAvatar('call-avatar-display', s.characterAvatar);
    document.getElementById('call-name-display').textContent = s.characterName;
    document.getElementById('call-status-display').textContent = type === 'video' ? '视频通话中...' : '语音通话中...';
    document.getElementById('call-timer').classList.add('hidden');
    document.getElementById('call-extra-controls').classList.add('hidden');
    document.getElementById('call-btn-mute').classList.remove('active');
    document.getElementById('call-btn-speaker').classList.remove('active');
    callSeconds = 0;
    callScale = 1;
    callActive = true;
    document.getElementById('call-content').style.transform = 'scale(1)';
    showModal('call-modal');
    if (callTimer) clearInterval(callTimer);
    setTimeout(() => {
      if (!callActive) return;
      document.getElementById('call-status-display').textContent = '已连接';
      document.getElementById('call-timer').classList.remove('hidden');
      document.getElementById('call-extra-controls').classList.remove('hidden');
      callTimer = setInterval(() => {
        callSeconds++;
        const m = String(Math.floor(callSeconds / 60)).padStart(2, '0');
        const sec = String(callSeconds % 60).padStart(2, '0');
        document.getElementById('call-timer').textContent = `${m}:${sec}`;
      }, 1000);
    }, 2000);
  }

  function endCall() {
    callActive = false;
    if (callTimer) clearInterval(callTimer);
    callTimer = null;
    hideModal('call-modal');
  }

  // User initiates call - character may reject
  function userStartCall(type) {
    if (Math.random() < 0.3) {
      // Character rejects
      const s = Store.getSettings();
      toast(`${s.characterName} 拒绝了通话`);
      Store.addMessage('抱歉，我在忙', 'character', []);
      Chat.render();
      return;
    }
    setupActiveCall(type);
  }

  // Character initiates incoming call
  function incomingCall(type) {
    const s = Store.getSettings();
    Settings._setAvatar('incoming-call-avatar', s.characterAvatar);
    document.getElementById('incoming-call-name').textContent = s.characterName;
    document.getElementById('incoming-call-type').textContent = type === 'video' ? '视频通话...' : '语音通话...';
    document.getElementById('incoming-call-overlay').classList.remove('hidden');

    // Auto-decline after 10 seconds (missed call)
    clearTimeout(incomingCallTimer);
    incomingCallTimer = setTimeout(() => {
      document.getElementById('incoming-call-overlay').classList.add('hidden');
      // Missed call message
      Store.addMessage(`📞 未接来电`, 'character', []);
      Chat.render();
      toast(`错过了 ${s.characterName} 的来电`);
    }, 10000);
  }

  // Accept incoming call
  document.getElementById('incoming-call-accept').addEventListener('click', () => {
    clearTimeout(incomingCallTimer);
    document.getElementById('incoming-call-overlay').classList.add('hidden');
    setupActiveCall('voice');
  });

  // Decline incoming call
  document.getElementById('incoming-call-decline').addEventListener('click', () => {
    clearTimeout(incomingCallTimer);
    document.getElementById('incoming-call-overlay').classList.add('hidden');
    Store.addMessage('抱歉，我在忙', 'character', []);
    Chat.render();
    toast('已拒绝');
  });

  document.getElementById('btn-call').addEventListener('click', () => userStartCall('voice'));
  document.getElementById('btn-video-call').addEventListener('click', () => userStartCall('video'));
  document.getElementById('call-btn-end').addEventListener('click', endCall);
  document.getElementById('call-btn-mute').addEventListener('click', function() {
    this.classList.toggle('active');
    toast(this.classList.contains('active') ? '已静音' : '已取消静音');
  });
  document.getElementById('call-btn-speaker').addEventListener('click', function() {
    this.classList.toggle('active');
    toast(this.classList.contains('active') ? '已开启扬声器' : '已关闭扬声器');
  });
  document.getElementById('call-btn-minimize').addEventListener('click', () => {
    hideModal('call-modal');
    toast('通话已最小化');
  });
  document.getElementById('call-btn-zoom-in').addEventListener('click', () => {
    callScale = Math.min(callScale + 0.2, 2);
    document.getElementById('call-content').style.transform = `scale(${callScale})`;
  });
  document.getElementById('call-btn-zoom-out').addEventListener('click', () => {
    callScale = Math.max(callScale - 0.2, 0.5);
    document.getElementById('call-content').style.transform = `scale(${callScale})`;
  });
  document.querySelector('#call-modal .call-backdrop').addEventListener('click', endCall);

  // Character periodically initiates calls
  function scheduleIncomingCall() {
    const s = Store.getSettings();
    if (!s.autoMsg) { setTimeout(scheduleIncomingCall, 60000); return; }
    const delay = rand(300000, 1800000); // 5~30 min
    setTimeout(() => {
      if (document.hidden || callActive) { scheduleIncomingCall(); return; }
      const type = Math.random() > 0.5 ? 'voice' : 'video';
      incomingCall(type);
      scheduleIncomingCall();
    }, delay);
  }
  scheduleIncomingCall();

  // Poke (双点头像)
  let pokeTimer = null;
  document.getElementById('header-avatar').addEventListener('dblclick', () => {
    const atm = Store.getAtmospheres();
    const charName = Store.getSettings().characterName;
    let pokeMsg = `你拍了拍 ${charName}`;
    if (atm.length) pokeMsg = atm[rand(0, atm.length-1)].replace('{char}', charName).replace('{user}', '你');
    const overlay = document.getElementById('poke-overlay');
    const text = document.getElementById('poke-text');
    text.textContent = pokeMsg;
    overlay.classList.remove('hidden');
    clearTimeout(pokeTimer);
    pokeTimer = setTimeout(() => overlay.classList.add('hidden'), 1800);

    // Character might poke back
    if (Math.random() > 0.5) {
      setTimeout(() => {
        const atm2 = Store.getAtmospheres();
        let backMsg = `${charName} 拍了拍你`;
        if (atm2.length) backMsg = atm2[rand(0, atm2.length-1)].replace('{char}', charName).replace('{user}', '你');
        text.textContent = backMsg;
        overlay.classList.remove('hidden');
        clearTimeout(pokeTimer);
        pokeTimer = setTimeout(() => overlay.classList.add('hidden'), 1800);
      }, 2000 + rand(0, 2000));
    }
  });

  // Atmosphere phrases management
  document.getElementById('btn-add-atmosphere').addEventListener('click', () => {
    document.getElementById('add-atmosphere-input').value = '';
    showModal('add-atmosphere-modal');
  });
  document.getElementById('add-atmosphere-confirm').addEventListener('click', () => {
    const text = document.getElementById('add-atmosphere-input').value.trim();
    if (!text) { toast('内容不能为空'); return; }
    if (Store.addAtmosphere(text)) { toast('已添加'); renderAtmos(); hideModal('add-atmosphere-modal'); }
    else toast('已存在相同内容');
  });
  document.getElementById('btn-batch-atmosphere').addEventListener('click', () => {
    document.getElementById('batch-atmosphere-input').value = '';
    showModal('batch-atmosphere-modal');
  });
  document.getElementById('batch-atmosphere-confirm').addEventListener('click', () => {
    const text = document.getElementById('batch-atmosphere-input').value;
    const lines = text.split('\n').filter(l => l.trim());
    if (!lines.length) { toast('请输入内容'); return; }
    const count = Store.batchImportAtmospheres(lines);
    renderAtmos();
    hideModal('batch-atmosphere-modal');
    toast(`成功导入 ${count} 条`);
  });

  // Status phrases management
  document.getElementById('btn-open-status-phrases').addEventListener('click', () => {
    renderStatusPhrases();
    showModal('status-phrases-modal');
  });
  document.getElementById('btn-add-status-phrase').addEventListener('click', () => {
    document.getElementById('add-status-phrase-input').value = '';
    showModal('add-status-phrase-modal');
  });
  document.getElementById('add-status-phrase-confirm').addEventListener('click', () => {
    const text = document.getElementById('add-status-phrase-input').value.trim();
    if (!text) { toast('内容不能为空'); return; }
    if (Store.addStatusPhrase(text)) { toast('已添加'); renderStatusPhrases(); hideModal('add-status-phrase-modal'); }
    else toast('已存在相同内容');
  });
  document.getElementById('btn-batch-status-phrases').addEventListener('click', () => {
    document.getElementById('batch-status-phrases-input').value = '';
    showModal('batch-status-phrases-modal');
  });
  document.getElementById('batch-status-phrases-confirm').addEventListener('click', () => {
    const text = document.getElementById('batch-status-phrases-input').value;
    const lines = text.split('\n').filter(l => l.trim());
    if (!lines.length) { toast('请输入内容'); return; }
    const count = Store.batchImportStatusPhrases(lines);
    renderStatusPhrases();
    hideModal('batch-status-phrases-modal');
    toast(`成功导入 ${count} 条`);
  });

  function renderStatusPhrases() {
    const container = document.getElementById('status-phrases-list');
    if (!container) return;
    const list = Store.getStatusPhrases();
    if (!list.length) {
      container.innerHTML = '<p class="hint-text" style="text-align:center;padding:12px;">暂无状态语</p>';
      return;
    }
    container.innerHTML = list.map(s =>
      `<div class="item-card"><span class="item-text">${Cards._escapeHtml(s.text)}</span>
      <div class="item-actions"><button class="item-btn delete delete-sp-btn" data-id="${s.id}">✕</button></div></div>`
    ).join('');
    container.querySelectorAll('.delete-sp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        Store.deleteStatusPhrase(Number(btn.dataset.id));
        renderStatusPhrases();
        toast('已删除');
      });
    });
  }

  // Initialize atmosphere (poke) phrases with defaults if empty
  if (!Store.getAtmospheres().length) {
    ['轻轻拍了拍 {char} 的头', '{char} 看了你一眼', '氛围突然变得温柔起来', '风轻轻吹过', '{char} 微微一笑', '{user} 戳了戳 {char}', '{char} 回过头来'].forEach(t => Store.addAtmosphere(t));
  }
  if (!Store.getStatusPhrases().length) {
    ['正在发呆', '看着窗外出神', '心情很好', '有点困', '在想你', '听着音乐', '在看书', '刚睡醒', '在发呆', '喝咖啡中', '心情愉悦', '有点小情绪'].forEach(t => Store.addStatusPhrase(t));
  }
  renderAtmos();

  // Periodically refresh header status (every hour)
  setInterval(() => {
    Settings._updateHeader();
  }, 3600000);

  // Auto-generate moods for recent days (today + past 7 days if missing)
  function generateMoodForDate(date) {
    const dateStr = date.toDateString();
    const existing = Store.getMoods().find(m => m.date === dateStr);
    if (existing) return null;
    const emojis = Store.getEmojis();
    const cards = Store.getCards();
    if (!emojis.length) return null;
    const moodEmoji = pickRandom(emojis);
    let statusParts = [];
    if (cards.length) {
      const count = rand(1, Math.min(3, cards.length));
      const used = new Set();
      while (statusParts.length < count) {
        const c = cards[rand(0, cards.length-1)];
        if (used.has(c.id)) continue;
        used.add(c.id);
        statusParts.push(c.text);
      }
    }
    const atm = Store.getAtmospheres();
    let status = statusParts.join('、');
    if (atm.length) {
      const atmText = pickRandom(atm).text.replace('{char}', Store.getSettings().characterName).replace('{user}', '你');
      status = status ? `${status} · ${atmText}` : atmText;
    }
    Store.addMood(String(moodEmoji.id), status, date);
  }

  const now = new Date();
  for (let i = 0; i >= -7; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    generateMoodForDate(d);
  }

  // Auto-reply improvement: natural timing
  // Override scheduleReply to be more natural
  Chat._originalScheduleReply = Chat.scheduleReply;
  Chat.scheduleReply = function() {
    clearTimeout(this._replyTimer);
    const sources = this._getAllSources();
    if (!sources.length) {
      this._showReplyIndicator('字卡库与汉字库均为空，无法回复');
      return;
    }
    const settings = Store.getSettings();
    if (!settings.autoReply) return;
    const delay = rand(settings.replyMin * 1000, settings.replyMax * 1000);
    this._showReplyIndicator(`回复中... (${Math.round(delay/1000)}秒后)`);
    this._replyTimer = setTimeout(() => {
      if (Math.random() > 0.25) { // 75% chance to actually reply
        this.generateReply();
      }
      this._showReplyIndicator('');
    }, delay);
  };

  // Character sends proactive messages (not just replies)
  Chat._startProactiveMessages = function() {
    if (this._proactiveTimer) clearInterval(this._proactiveTimer);
    if (this._proactiveTimer2) clearInterval(this._proactiveTimer2);
    const settings = Store.getSettings();
    if (!settings.autoMsg) return;
    if (!this._getAllSources().length) return;
    this._proactiveTimer = setInterval(() => {
      if (document.hidden) return;
      if (Math.random() > 0.35) {
        this.generateReply();
        if (Math.random() > 0.6) {
          setTimeout(() => this.generateReply(), rand(3000, 15000));
        }
      }
    }, settings.autoInterval * 1000);
    // Also send occasional message outside auto interval
    this._proactiveTimer2 = setInterval(() => {
      if (document.hidden) return;
      if (Math.random() > 0.5) this.generateReply();
    }, settings.autoInterval * 3000);
  };
  Chat._startProactiveMessages();
}

// Proactive letters (works offline via localStorage timestamp)
Letters._ensureProactiveLetters = function() {
  if (this._proactiveLetterTimer) clearTimeout(this._proactiveLetterTimer);
  const settings = Store.getSettings();
  if (!settings.autoMsg) return;

  // Check for offline catch-up: if enough time passed since last letter, send one
  const lastSent = Store._get('lastProactiveLetter') || 0;
  const minIntervalMs = settings.letterInterval * 60 * 60 * 1000;
  if (lastSent && Date.now() - lastSent >= minIntervalMs) {
    sendLetter();
  }

  scheduleNextLetter();

  function scheduleNextLetter() {
    const s = Store.getSettings();
    const intervalMs = s.letterInterval * 60 * 60 * 1000;
    const delay = rand(Math.round(intervalMs * 0.3), intervalMs);
    Letters._proactiveLetterTimer = setTimeout(() => {
      sendLetter();
      scheduleNextLetter();
    }, delay);
  }

  function sendLetter() {
    const s = Store.getSettings();
    const src = Chat._getAllSources();
    if (!src.length) return;
    const sentToday = Store.getLetters().filter(l =>
      l.sender === 'character' && !l.replyToId &&
      new Date(l.timestamp).toDateString() === new Date().toDateString()
    );
    if (sentToday.length >= 5) return;
    const sentenceCount = rand(1, 15);
    let content = '';
    for (let i = 0; i < sentenceCount; i++) {
      const r = pickRandom(src);
      content += r.text;
      if (i < sentenceCount - 1 && Math.random() > 0.5) content += '。';
    }
    Store.addLetter('character', content, null);
    Store._set('lastProactiveLetter', Date.now());
    Letters.render();
    toast(`💌 ${s.characterName} 寄来了一封信`);
  }
};
Letters._ensureProactiveLetters();

document.addEventListener('DOMContentLoaded', init);
