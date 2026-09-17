/* ==========================================================================
   離れ（Hanare）— 骨格レイヤーの挙動
   --------------------------------------------------------------------------
   方針
   - 外部通信なし。CDN・トラッキング・フォント取得を行わない
   - 保存するのは「昼夜の別」だけ。個人データは一切持たない
   - JavaScriptを切っても、データはHTMLに書き出してあるため全部読める
   - 破壊的操作を置かない（削除はこの画面に存在しない）
   ========================================================================== */
(function () {
  'use strict';

  var body = document.body;
  var root = document.documentElement;

  /* ---------- データあり / 空の状態 ---------- */
  var modeButtons = document.querySelectorAll('[data-mode-set]');
  Array.prototype.forEach.call(modeButtons, function (btn) {
    btn.addEventListener('click', function () {
      var mode = btn.getAttribute('data-mode-set');
      body.setAttribute('data-mode', mode);
      Array.prototype.forEach.call(modeButtons, function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      say(mode === 'empty' ? '空の状態を表示しています' : 'データありの状態に戻しました', null);
    });
  });

  /* ---------- 昼 / 夜 ---------- */
  var themeBtn = document.getElementById('theme');
  var saved = null;
  try { saved = localStorage.getItem('hanare-theme'); } catch (e) { /* 保存できなくても動く */ }
  if (saved === 'night') { setTheme('night'); }

  themeBtn.addEventListener('click', function () {
    setTheme(root.getAttribute('data-theme') === 'night' ? 'day' : 'night');
  });

  function setTheme(v) {
    root.setAttribute('data-theme', v);
    themeBtn.setAttribute('aria-pressed', String(v === 'night'));
    themeBtn.querySelector('.lamp-btn__t').textContent = v === 'night' ? '昼' : '夜';
    try { localStorage.setItem('hanare-theme', v); } catch (e) { /* 無視 */ }
  }

  /* ---------- 状態の変更（5秒間は取り消せる） ---------- */
  Array.prototype.forEach.call(document.querySelectorAll('select.state'), function (sel) {
    sel.addEventListener('change', function () {
      var before = sel.getAttribute('data-v');
      sel.setAttribute('data-v', sel.value);
      var row = sel.closest('tr');
      var name = row ? row.querySelector('th').textContent : '作業';
      say('「' + name + '」を ' + sel.value + ' にしました', function () {
        sel.value = before;
        sel.setAttribute('data-v', before);
      });
    });
  });

  /* ---------- 止まっているものだけ ---------- */
  var onlyStuck = document.getElementById('only-stuck');
  onlyStuck.addEventListener('change', filterRows);

  /* ---------- 画面内を探す ---------- */
  var q = document.getElementById('q');
  q.addEventListener('input', filterRows);
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== q) { e.preventDefault(); q.focus(); }
    if (e.key === 'Escape') {
      if (document.activeElement === q) { q.value = ''; filterRows(); q.blur(); }
      hide();
    }
  });

  function filterRows() {
    var word = q.value.trim();
    var stuckOnly = onlyStuck.checked;
    var rows = document.querySelectorAll('.grid tbody tr');
    var shown = 0;

    Array.prototype.forEach.call(rows, function (tr) {
      var hitWord = !word || tr.textContent.indexOf(word) !== -1;
      var hitStuck = !stuckOnly || tr.getAttribute('data-stuck') === 'true';
      var ok = hitWord && hitStuck;
      tr.hidden = !ok;
      if (ok) { shown++; }
    });

    var tbody = document.querySelector('.grid tbody');
    var none = document.getElementById('no-hit');
    if (shown === 0 && !none) {
      none = document.createElement('tr');
      none.id = 'no-hit';
      none.innerHTML = '<td colspan="6">当てはまる作業はありません。言葉を短くするか、絞り込みを外してくださいませ。</td>';
      tbody.appendChild(none);
    } else if (shown > 0 && none) {
      none.remove();
    }
  }

  /* ---------- 報せ（取り消し付き） ---------- */
  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toast-msg');
  var toastUndo = document.getElementById('toast-undo');
  var timer = null;
  var undoFn = null;

  function say(msg, undo) {
    toastMsg.textContent = msg;
    undoFn = undo || null;
    toastUndo.hidden = !undo;
    toast.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(hide, 5000);
  }
  function hide() { toast.hidden = true; undoFn = null; }

  toastUndo.addEventListener('click', function () {
    if (undoFn) { undoFn(); }
    hide();
  });

  /* ---------- 側柱の現在地 ---------- */
  var links = document.querySelectorAll('.nav a');
  Array.prototype.forEach.call(links, function (a) {
    a.addEventListener('click', function () {
      Array.prototype.forEach.call(links, function (b) { b.removeAttribute('aria-current'); });
      a.setAttribute('aria-current', 'page');
    });
  });
})();
