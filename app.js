/* ==========================================================
 * Vòng Quay 19/11 — chọn 13 bạn nam nhận quà
 * Mỗi bạn nữ quay 1 lượt -> ra 1 bạn nam. Bạn nam đã trúng rời khỏi vòng quay.
 * Có thể chỉ định trước kết quả cho từng bạn nữ (bảng cài đặt ẩn).
 * Mọi dữ liệu lưu trong localStorage của trình duyệt đang dùng.
 * ========================================================== */
(function () {
  'use strict';

  /* ---------- Danh sách gốc ---------- */
  const DEFAULT_BOYS = [
    'Nguyễn Đăng Vũ Anh', 'Đặng Gia Bách', 'Lê Gia Bảo', 'Nguyễn Ngọc Cương', 'Phan Trí Dũng',
    'Đỗ Minh Đức', 'Nguyễn Anh Đức', 'Võ Phúc Hiệp', 'Đặng Lương Huy', 'Trần Đức Huy',
    'Trần Gia Huy', 'Mai Gia Hưng', 'Nguyễn Minh Hưng', 'Trịnh Quang Khải', 'Đặng Bảo Khang',
    'Hà Tuấn Khang', 'Nguyễn Hoàng An Khang', 'Nguyễn Tường Khang', 'Tạ Minh Khang', 'Ngô Đức Khanh',
    'Trần Minh Khôi', 'Trương Ngọc Kiên', 'Nguyễn Vũ Lâm', 'Bế Trần Bảo Long', 'Hoàng Sỹ Long',
    'Đào Khải Minh', 'Hoàng Đăng Minh', 'Lê Nhật Minh', 'Nguyễn Tuấn Minh', 'Tống Quốc Khai Minh',
    'Trần Nhật Minh', 'Lê Khôi Nguyên', 'Phạm Hải Nguyên', 'Nguyễn Minh Nhân', 'Nguyễn Nam Phong',
    'Lê Xuân Phúc', 'Bùi Minh Quang', 'Nguyễn Đức Quang', 'Chu Anh Quân', 'Dương Hoàng Quân',
    'Nguyễn Ngọc Minh Quân', 'Tạ Đức Thắng', 'Vũ Quyết Thắng', 'Nguyễn Việt Tiến', 'Nguyễn Minh Trí'
  ];
  const DEFAULT_GIRLS = [
    'Trần Hà Châu', 'Lê Hương Giang', 'Nguyễn Cao Vân Giang', 'Phạm Ngân Giang', 'Chu Gia Hân',
    'Nguyễn Linh Hương', 'Nguyễn Minh Khánh', 'Phan Ngô Hà My', 'Lê Thị Minh Ngân', 'Phạm Minh Ngọc',
    'Lê Hoàng Hạnh Nguyên', 'Nguyễn Thảo Uyên', 'Trần Phương Vy'
  ];

  // Màu các ô trên vòng quay và màu chữ tương ứng
  const COLORS = ['#14213d', '#fca311', '#2a9d8f', '#e76f51', '#8ecae6', '#3d5a80'];
  const TEXT_ON = { '#14213d': '#ffffff', '#fca311': '#14213d', '#2a9d8f': '#ffffff', '#e76f51': '#ffffff', '#8ecae6': '#14213d', '#3d5a80': '#ffffff' };
  const FONT = '"Be Vietnam Pro", "Segoe UI", sans-serif';
  const KEY = 'vongquay1911.v1';

  /* ---------- Tiện ích ---------- */
  const $ = id => document.getElementById(id);
  const norm = s => String(s == null ? '' : s).normalize('NFC').replace(/\s+/g, ' ').trim();
  const same = (a, b) => norm(a).toLocaleLowerCase('vi') === norm(b).toLocaleLowerCase('vi');
  const linesOf = text => String(text).split(/\r?\n/).map(norm).filter(Boolean);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---------- Lưu trữ ---------- */
  function freshState() {
    return { boys: DEFAULT_BOYS.slice(), girls: DEFAULT_GIRLS.slice(), results: [], rig: {}, className: 'Lớp 9A1', sound: true, hidePanel: false };
  }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.boys) && Array.isArray(s.girls)) return Object.assign(freshState(), s);
    } catch (e) { /* bỏ qua */ }
    return freshState();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* bỏ qua */ }
  }
  let state = load();

  /* ---------- Mã hoá chỉ định để gửi qua link (chỉ làm rối, không phải bảo mật) ---------- */
  const MASK = 'quoc-te-nam-gioi-19-11';
  function encodeRig(obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = '';
    bytes.forEach((b, i) => { bin += String.fromCharCode(b ^ MASK.charCodeAt(i % MASK.length)); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decodeRig(code) {
    const bin = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) ^ MASK.charCodeAt(i % MASK.length);
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  /* ---------- Truy vấn trạng thái ---------- */
  const resultOf = girl => state.results.find(r => same(r.girl, girl));
  const wonBoys = () => state.results.map(r => r.boy);
  const remainingBoys = () => state.boys.filter(b => !wonBoys().some(w => same(w, b)));
  const pendingGirls = () => state.girls.filter(g => !resultOf(g));

  /** Chọn bạn nam cho lượt quay của bạn nữ `girl` trong số `pool`. */
  function pickBoy(girl, pool) {
    // 1) Có chỉ định và bạn đó còn trên vòng quay -> ra đúng bạn đó
    const want = state.rig[girl];
    if (want) {
      const hit = pool.find(b => same(b, want));
      if (hit) return hit;
    }
    // 2) Ngẫu nhiên, nhưng tránh các bạn đang được "giữ chỗ" cho bạn nữ khác chưa quay
    const reserved = pendingGirls().filter(g => !same(g, girl)).map(g => state.rig[g]).filter(Boolean);
    let free = pool.filter(b => !reserved.some(r => same(r, b)));
    if (!free.length) free = pool;
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return free[arr[0] % free.length];
  }

  /* ==========================================================
   * Âm thanh (Web Audio, không cần file)
   * ========================================================== */
  let audio = null;
  function ac() {
    if (!audio) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audio = new AC();
    }
    if (audio && audio.state === 'suspended') audio.resume();
    return audio;
  }
  function tick() {
    if (!state.sound) return;
    const a = ac(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'triangle'; o.frequency.value = 1800;
    g.gain.setValueAtTime(0.18, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.04);
    o.connect(g).connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.05);
  }
  function fanfare() {
    if (!state.sound) return;
    const a = ac(); if (!a) return;
    [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5].forEach((f, i) => {
      const t = a.currentTime + i * 0.11 + (i > 3 ? 0.08 : 0);
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'square'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (i === 5 ? 0.6 : 0.16));
      o.connect(g).connect(a.destination);
      o.start(t); o.stop(t + 0.7);
    });
  }

  /* ==========================================================
   * Vẽ vòng quay
   * ========================================================== */
  const canvas = $('wheel');
  const ctx = canvas.getContext('2d');
  let rot = 0;                 // góc xoay hiện tại (radian)
  let wheelNames = [];         // các tên đang hiện trên vòng quay
  let spinning = false;
  let idle = true;             // xoay nhẹ khi đang chờ

  function colorFor(i, n) {
    let c = i % COLORS.length;
    // Tránh ô cuối trùng màu với ô đầu
    if (i === n - 1 && n > 1 && c === 0) c = 2;
    return COLORS[c];
  }

  function drawWheel() {
    const W = canvas.width, R = W / 2 - 14, cx = W / 2, cy = W / 2;
    ctx.clearRect(0, 0, W, W);

    // Viền ngoài
    ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();

    const n = wheelNames.length;
    if (!n) {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = '#dde2ec'; ctx.fill();
      ctx.fillStyle = '#5b6680'; ctx.font = `700 34px ${FONT}`; ctx.textAlign = 'center';
      ctx.fillText('Hết tên rồi!', cx, cy - R / 2);
      return;
    }
    const seg = Math.PI * 2 / n;
    for (let i = 0; i < n; i++) {
      const a0 = rot + i * seg, a1 = a0 + seg;
      const color = colorFor(i, n);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      if (n > 1) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.5; ctx.stroke(); }

      // Chữ: căn phải sát mép ngoài, chạy dọc theo bán kính
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a0 + seg / 2);
      const maxW = R * 0.74 - 24;
      // Cỡ chữ vừa với độ rộng ô (đo ở khoảng giữa bán kính để chữ không lấn sang ô bên cạnh)
      let size = Math.min(38, Math.max(11, seg * R * 0.4));
      ctx.font = `700 ${size}px ${FONT}`;
      const name = wheelNames[i];
      const w = ctx.measureText(name).width;
      if (w > maxW) { size = Math.max(10, size * maxW / w); ctx.font = `700 ${size}px ${FONT}`; }
      ctx.fillStyle = TEXT_ON[color];
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText(name, R - 24, 0);
      ctx.restore();
    }
    // Chấm trang trí trên viền
    const dots = Math.max(16, Math.min(48, n));
    for (let i = 0; i < dots; i++) {
      const a = rot + i * Math.PI * 2 / dots;
      ctx.beginPath(); ctx.arc(cx + Math.cos(a) * (R + 5), cy + Math.sin(a) * (R + 5), 3.2, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? '#fca311' : '#14213d'; ctx.fill();
    }
  }

  /** Chỉ số ô đang nằm dưới mũi tên (mũi tên ở góc 0 — phía bên phải). */
  function indexAtPointer() {
    const n = wheelNames.length;
    if (!n) return -1;
    const seg = Math.PI * 2 / n;
    const a = ((-rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    return Math.floor(a / seg) % n;
  }

  // Vòng lặp xoay nhẹ khi chờ
  function idleLoop() {
    if (idle && !spinning && wheelNames.length) { rot += 0.0016; drawWheel(); }
    requestAnimationFrame(idleLoop);
  }

  /* ==========================================================
   * Quay
   * ========================================================== */
  function spin() {
    if (spinning) return;
    const girl = $('girlSelect').value;
    if (!girl) { toast(pendingGirls().length ? 'Hãy chọn bạn nữ quay lượt này' : 'Đã đủ 13 bạn rồi! 🎉'); return; }
    if (resultOf(girl)) { toast(girl + ' đã quay rồi'); return; }
    const pool = remainingBoys();
    if (!pool.length) { toast('Không còn bạn nam nào trên vòng quay'); return; }

    ac(); // mở khoá âm thanh ngay khi người dùng bấm
    wheelNames = pool.slice();
    const boy = pickBoy(girl, pool);
    const idx = wheelNames.findIndex(b => same(b, boy));

    // Lưu kết quả ngay khi bấm quay để tải lại trang cũng không quay lại được
    state.results.push({ girl, boy, at: Date.now() });
    save();

    spinning = true; idle = false;
    setBusy(true);

    // Tính góc dừng: dừng ở vị trí ngẫu nhiên bên trong ô (không sát mép)
    const n = wheelNames.length, seg = Math.PI * 2 / n, TAU = Math.PI * 2;
    const inside = 0.15 + Math.random() * 0.7;
    const want = -(idx + inside) * seg;
    let delta = ((want - rot) % TAU + TAU) % TAU;
    delta += TAU * (7 + Math.floor(Math.random() * 3));
    const start = rot, dur = 9000 + Math.random() * 1500;
    const t0 = performance.now();
    let lastIdx = indexAtPointer(), lastTick = 0;

    function frame(now) {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - t, 4);           // chậm dần
      rot = start + delta * e;
      drawWheel();
      const cur = indexAtPointer();
      if (cur !== lastIdx && now - lastTick > 35) { tick(); lastTick = now; }
      lastIdx = cur;
      if (t < 1) requestAnimationFrame(frame);
      else finish(girl, boy);
    }
    requestAnimationFrame(frame);
  }

  function finish(girl, boy) {
    spinning = false;
    fanfare();
    confetti();
    $('winName').textContent = boy;
    $('winGirl').textContent = girl;
    $('winModal').classList.remove('hidden');
    $('btnWinOk').focus();
    renderResults(true);
    renderCounts();
  }

  function closeWin() {
    $('winModal').classList.add('hidden');
    setBusy(false);
    idle = true;
    refreshAll();
  }

  function setBusy(b) {
    $('hub').disabled = b;
    $('girlSelect').disabled = b;
    $('entries').disabled = b;
    $('hint').style.visibility = b ? 'hidden' : 'visible';
  }

  /* ==========================================================
   * Giao diện
   * ========================================================== */
  function renderGirlSelect() {
    const sel = $('girlSelect');
    const prev = sel.value;
    const pend = pendingGirls();
    sel.innerHTML = pend.length
      ? pend.map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('')
      : '<option value="">— Đã quay xong —</option>';
    if (pend.some(g => g === prev)) sel.value = prev;
    $('turnCount').textContent = `${state.results.length}/${state.girls.length}`;
  }

  function renderEntries() {
    if (document.activeElement === $('entries')) return; // đang gõ thì không ghi đè
    $('entries').value = remainingBoys().join('\n');
  }

  function renderCounts() {
    $('cntEntries').textContent = spinning ? wheelNames.length : remainingBoys().length;
    $('cntResults').textContent = state.results.length - (spinning ? 1 : 0);
  }

  function renderResults(fresh) {
    const list = spinning ? state.results.slice(0, -1) : state.results;
    $('results').innerHTML = list.map((r, i) =>
      `<li class="${fresh && i === list.length - 1 ? 'fresh' : ''}"><span class="n">${i + 1}</span>` +
      `<span class="boy">${esc(r.boy)}</span><span class="from">🎁 từ ${esc(r.girl)}</span></li>`).join('');
    $('resultsEmpty').classList.toggle('hidden', list.length > 0);
  }

  function renderBoard() {
    const list = spinning ? state.results.slice(0, -1) : state.results;
    const cards = state.girls.map((g, i) => {
      const r = list.find(x => same(x.girl, g));
      const c = COLORS[[1, 2, 3, 5, 4][i % 5]];
      return r
        ? `<div class="bcard" style="--c:${c}"><div class="boy">${esc(r.boy)}</div><div class="from">🎁 từ ${esc(g)}</div></div>`
        : `<div class="bcard empty"><div class="boy">?</div><div class="from">🎁 từ ${esc(g)}</div></div>`;
    });
    $('boardGrid').innerHTML = cards.join('');
  }

  function applyPanel() {
    document.querySelector('.layout').classList.toggle('no-panel', !!state.hidePanel);
    document.querySelector('.panel').classList.toggle('hidden', !!state.hidePanel);
    let b = $('btnShowPanel');
    if (state.hidePanel && !b) {
      b = document.createElement('button');
      b.id = 'btnShowPanel'; b.className = 'tbtn'; b.innerHTML = '📋<span> Danh sách</span>';
      b.onclick = () => { state.hidePanel = false; save(); applyPanel(); };
      document.querySelector('.top-actions').prepend(b);
    } else if (!state.hidePanel && b) b.remove();
  }

  function refreshAll() {
    $('className').textContent = state.className ? '· ' + state.className : '';
    $('btnSound').textContent = state.sound ? '🔊' : '🔇';
    if (!spinning) wheelNames = remainingBoys();
    renderGirlSelect();
    renderEntries();
    renderResults(false);
    renderCounts();
    applyPanel();
    drawWheel();
  }

  /* ---------- Bảng cài đặt / chỉ định ---------- */
  function renderRig() {
    const won = wonBoys();
    const html = state.girls.map((g, gi) => {
      const r = resultOf(g);
      if (r) return `<div class="g done">${esc(g)}</div><div class="note">Đã quay: <b>${esc(r.boy)}</b></div>`;
      const mine = state.rig[g] || '';
      const takenByOthers = state.girls.filter(o => o !== g && !resultOf(o)).map(o => state.rig[o]).filter(Boolean);
      const opts = state.boys.filter(b => !won.some(w => same(w, b))).map(b => {
        const dis = takenByOthers.some(t => same(t, b)) ? ' disabled' : '';
        const selAttr = same(b, mine) ? ' selected' : '';
        return `<option value="${esc(b)}"${dis}${selAttr}>${esc(b)}</option>`;
      }).join('');
      return `<div class="g">${esc(g)}</div><select data-g="${gi}" class="${mine ? 'set' : ''}"><option value="">🎲 Ngẫu nhiên</option>${opts}</select>`;
    }).join('');
    $('rigTable').innerHTML = html;
    $('girlsText').value = state.girls.join('\n');
    $('classInput').value = state.className || '';
  }

  function openAdmin() {
    if (spinning) return;
    renderRig();
    $('adminModal').classList.remove('hidden');
  }

  /* ---------- Pháo giấy ---------- */
  const cv = $('confetti'), cc = cv.getContext('2d');
  let bits = [];
  function confetti() {
    cv.width = innerWidth; cv.height = innerHeight;
    const cols = ['#fca311', '#2a9d8f', '#e76f51', '#8ecae6', '#14213d', '#ffffff'];
    for (let i = 0; i < 220; i++) {
      bits.push({
        x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .45,
        vx: (Math.random() - .5) * 22, vy: -Math.random() * 20 - 6,
        w: 6 + Math.random() * 7, h: 8 + Math.random() * 10,
        r: Math.random() * 6, vr: (Math.random() - .5) * .4,
        c: cols[i % cols.length], life: 0
      });
    }
    if (bits.length <= 220) requestAnimationFrame(stepConfetti);
  }
  function stepConfetti() {
    cc.clearRect(0, 0, cv.width, cv.height);
    bits.forEach(b => {
      b.vy += 0.45; b.vx *= 0.985; b.x += b.vx; b.y += b.vy; b.r += b.vr; b.life++;
      cc.save(); cc.translate(b.x, b.y); cc.rotate(b.r);
      cc.fillStyle = b.c; cc.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.life / 6)));
      cc.restore();
    });
    bits = bits.filter(b => b.y < cv.height + 40 && b.life < 400);
    if (bits.length) requestAnimationFrame(stepConfetti);
    else cc.clearRect(0, 0, cv.width, cv.height);
  }

  /* ==========================================================
   * Sự kiện
   * ========================================================== */
  canvas.addEventListener('click', spin);
  $('hub').addEventListener('click', spin);
  $('btnWinOk').addEventListener('click', closeWin);

  document.addEventListener('keydown', e => {
    const tag = (document.activeElement || {}).tagName;
    const typing = tag === 'TEXTAREA' || tag === 'INPUT' || tag === 'SELECT';
    const winOpen = !$('winModal').classList.contains('hidden');
    if (winOpen && (e.key === 'Enter' || e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); closeWin(); return; }
    if (e.key === 'Escape') { document.querySelectorAll('.modal').forEach(m => { if (m.id !== 'winModal') m.classList.add('hidden'); }); refreshAll(); return; }
    if (e.altKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) { e.preventDefault(); openAdmin(); return; }
    const anyModal = [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
    if (e.key === ' ' && !typing && !anyModal) { e.preventDefault(); spin(); }
  });

  // Tabs
  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === t));
    $('pane-entries').classList.toggle('hidden', t.dataset.tab !== 'entries');
    $('pane-results').classList.toggle('hidden', t.dataset.tab !== 'results');
  }));

  // Sửa danh sách bạn nam trực tiếp
  let editTimer;
  $('entries').addEventListener('input', () => {
    clearTimeout(editTimer);
    editTimer = setTimeout(() => {
      const typed = linesOf($('entries').value);
      const won = wonBoys();
      state.boys = won.concat(typed.filter(b => !won.some(w => same(w, b))));
      save();
      wheelNames = remainingBoys();
      renderCounts(); drawWheel();
    }, 250);
  });
  $('entries').addEventListener('blur', () => renderEntries());

  $('btnShuffle').addEventListener('click', () => {
    if (spinning) return;
    for (let i = state.boys.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.boys[i], state.boys[j]] = [state.boys[j], state.boys[i]];
    }
    save(); refreshAll();
  });
  $('btnSort').addEventListener('click', () => {
    if (spinning) return;
    // Sắp xếp theo tên (chữ cuối), giống thói quen sổ điểm Việt Nam
    const last = s => s.split(' ').slice(-1)[0];
    state.boys.sort((a, b) => last(a).localeCompare(last(b), 'vi') || a.localeCompare(b, 'vi'));
    save(); refreshAll();
  });
  $('btnHide').addEventListener('click', () => { state.hidePanel = true; save(); applyPanel(); });

  $('btnBoard').addEventListener('click', () => { renderBoard(); $('boardModal').classList.remove('hidden'); });
  $('btnSound').addEventListener('click', () => { state.sound = !state.sound; save(); refreshAll(); });
  $('btnFull').addEventListener('click', () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });

  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => {
    $(b.dataset.close).classList.add('hidden'); refreshAll();
  }));
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', e => {
    if (e.target !== m) return;
    if (m.id === 'winModal') closeWin(); else { m.classList.add('hidden'); refreshAll(); }
  }));

  // Mở bảng cài đặt: bấm nhanh 3 lần vào logo
  let clicks = [];
  $('brand').addEventListener('click', () => {
    const now = Date.now();
    clicks = clicks.filter(t => now - t < 700).concat(now);
    if (clicks.length >= 3) { clicks = []; openAdmin(); }
  });

  // Các nút trong bảng cài đặt
  $('rigTable').addEventListener('change', e => {
    const s = e.target.closest('select'); if (!s) return;
    const g = state.girls[+s.dataset.g];
    if (s.value) state.rig[g] = s.value; else delete state.rig[g];
    save(); renderRig();
  });
  $('btnRigClear').addEventListener('click', () => {
    if (!confirm('Bỏ hết chỉ định? Tất cả lượt sẽ quay ngẫu nhiên.')) return;
    state.rig = {}; save(); renderRig();
  });
  $('btnRigLink').addEventListener('click', () => {
    const url = location.href.split('#')[0] + '#cc=' + encodeRig(state.rig);
    const done = () => toast('Đã copy link. Mở link này trên máy chiếu là có chỉ định.');
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, () => prompt('Copy link này:', url));
    else prompt('Copy link này:', url);
  });
  $('girlsText').addEventListener('change', () => {
    const list = linesOf($('girlsText').value);
    if (!list.length) { toast('Danh sách bạn nữ không được trống'); return; }
    state.girls = list; save(); renderRig(); refreshAll();
  });
  $('classInput').addEventListener('input', () => { state.className = norm($('classInput').value); save(); refreshAll(); });
  $('btnUndo').addEventListener('click', () => {
    const r = state.results[state.results.length - 1];
    if (!r) { toast('Chưa có lượt nào'); return; }
    if (!confirm(`Huỷ lượt: ${r.girl} → ${r.boy}?`)) return;
    state.results.pop(); save(); renderRig(); refreshAll();
  });
  $('btnCsv').addEventListener('click', () => {
    const cell = v => /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    const rows = [['STT', 'Bạn nam nhận quà', 'Bạn nữ tặng quà']].concat(state.results.map((r, i) => [String(i + 1), r.boy, r.girl]));
    const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'ket-qua-19-11.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('btnReset').addEventListener('click', () => {
    if (!confirm('Xoá toàn bộ kết quả đã quay? (Chỉ định vẫn giữ nguyên)')) return;
    state.results = []; save(); renderRig(); refreshAll(); toast('Đã xoá kết quả');
  });
  $('btnFactory').addEventListener('click', () => {
    if (!confirm('Khôi phục danh sách gốc? Kết quả và chỉ định sẽ bị xoá hết.')) return;
    const keepSound = state.sound;
    state = freshState(); state.sound = keepSound; save(); renderRig(); refreshAll(); toast('Đã khôi phục');
  });

  /* ---------- Đọc link (#cc=... hoặc #cocau) ---------- */
  function readHash() {
    const h = location.hash.slice(1);
    if (h.startsWith('cc=')) {
      try {
        const rig = decodeRig(h.slice(3));
        if (rig && typeof rig === 'object' && !Array.isArray(rig)) { state.rig = rig; save(); }
      } catch (e) { /* link hỏng thì bỏ qua */ }
      history.replaceState(null, '', location.pathname + location.search); // xoá dấu vết khỏi thanh địa chỉ
    } else if (h === 'cocau') {
      history.replaceState(null, '', location.pathname + location.search);
      setTimeout(openAdmin, 50);
    }
  }
  window.addEventListener('hashchange', readHash);

  /* ---------- Khởi động ---------- */
  readHash();
  refreshAll();
  requestAnimationFrame(idleLoop);
  // Vẽ lại khi font tải xong để chữ trên vòng quay đúng font
  if (document.fonts && document.fonts.load) {
    document.fonts.load(`700 30px ${FONT}`, 'Đặng Nguyễn').then(drawWheel, drawWheel);
  }
})();
