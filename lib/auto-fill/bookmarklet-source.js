(function() {
  if (document.getElementById('__tabuddy_bm')) return

  var data = __FEEDBACK_DATA__

  var s = document.createElement('style')
  s.id = '__tabuddy_bm_s'
  s.textContent = '#__tabuddy_bm{position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483647;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.4);backdrop-filter:blur(4px);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}#__bm_p{width:720px;max-width:95vw;max-height:85vh;background:#fff;border-radius:16px;box-shadow:0 25px 80px rgba(0,0,0,.25);display:flex;flex-direction:column;overflow:hidden;animation:__bm_i .25s ease-out}@keyframes __bm_i{from{opacity:0;transform:scale(.95) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}#__bm_h{display:flex;align-items:center;padding:14px 20px;border-bottom:1px solid #f0f0f0;gap:12px;flex-shrink:0}#__bm_lg{font-size:15px;font-weight:700;color:#7c3aed}#__bm_ct{font-size:12px;color:#999;flex:1}#__bm_x{width:28px;height:28px;border:none;background:#f5f5f5;border-radius:8px;font-size:16px;color:#666;cursor:pointer;display:flex;align-items:center;justify-content:center}#__bm_x:hover{background:#eee;color:#333}#__bm_b{display:flex;flex:1;min-height:0;overflow:hidden}#__bm_l{width:200px;flex-shrink:0;overflow-y:auto;border-right:1px solid #f0f0f0;padding:8px}.i{display:flex;align-items:center;padding:10px 12px;border-radius:10px;cursor:pointer;gap:10px;font-size:13px;transition:all .15s;margin-bottom:2px;color:#333}.i:hover{background:#f8f5ff}.ia{background:#f3eeff!important;color:#7c3aed!important;font-weight:600}.ic .ck{opacity:1}.idx{width:22px;height:22px;border-radius:6px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#999;flex-shrink:0}.ia .idx{background:#7c3aed;color:#fff}.nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ck{color:#22c55e;font-size:11px;font-weight:700;opacity:0;transition:opacity .2s}#__bm_c{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column}.t{font-size:18px;font-weight:700;color:#1a1a1a;margin-bottom:16px}.tx{font-size:14px;line-height:1.8;color:#444;white-space:pre-wrap;flex:1;margin-bottom:20px}.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;align-self:flex-start;padding:10px 24px;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 4px 14px rgba(124,58,237,.3)}.btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(124,58,237,.4)}#__bm_f{padding:10px 20px;border-top:1px solid #f0f0f0;flex-shrink:0}.hint{font-size:11px;color:#bbb}'
  document.head.appendChild(s)

  var c = document.createElement('div')
  c.id = '__tabuddy_bm'
  c.innerHTML = '<div id="__bm_p"><div id="__bm_h"><span id="__bm_lg">📋 TABuddy 反馈</span><span id="__bm_ct">' + data.length + ' 位学生</span><button id="__bm_x">&times;</button></div><div id="__bm_b"><div id="__bm_l"></div><div id="__bm_c"></div></div><div id="__bm_f"><span class="hint">↑↓ 切换 · 1~9 快速选择 · Ctrl+C 复制 · Esc 关闭</span></div></div>'
  document.body.appendChild(c)

  var idx = 0, cp = {}, l = document.getElementById('__bm_l'), r = document.getElementById('__bm_c')

  function bl() {
    var h = ''
    for (var i = 0; i < data.length; i++) {
      var cls = 'i'
      if (i === idx) cls += ' ia'
      if (cp[data[i].n]) cls += ' ic'
      h += '<div class="' + cls + '" data-x="' + i + '"><span class="idx">' + (i + 1) + '</span><span class="nm">' + data[i].n + '</span><span class="ck">✓</span></div>'
    }
    l.innerHTML = h
  }

  function sc() {
    var d = data[idx]
    r.innerHTML = '<div class="t">' + d.n + '</div><div class="tx">' + d.c.replace(/\\n/g, '<br>') + '</div><button class="btn" id="__bm_btn">📋 点击复制 (Ctrl+C)</button>'
    document.getElementById('__bm_btn').onclick = cc
  }

  function ua() {
    var its = l.querySelectorAll('.i')
    for (var i = 0; i < its.length; i++) {
      var cls = 'i'
      if (i === idx) cls += ' ia'
      if (cp[data[i].n]) cls += ' ic'
      its[i].className = cls
    }
    sc()
  }

  function cc() {
    var d = data[idx], ta = document.createElement('textarea')
    ta.value = d.c; ta.style.cssText = 'position:fixed;left:-9999px'
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    cp[d.n] = true; ua()
    var b = document.getElementById('__bm_btn')
    if (b) { b.textContent = '✅ ' + d.n + ' 已复制'; setTimeout(function() { var x = document.getElementById('__bm_btn'); if (x) x.textContent = '📋 点击复制 (Ctrl+C)' }, 1500) }
  }

  bl(); sc()

  l.addEventListener('click', function(e) {
    var it = e.target.closest('.i')
    if (it) { idx = parseInt(it.getAttribute('data-x')); ua() }
  })

  function kd(e) {
    var t = (e.target || {}).tagName
    if (t === 'INPUT' || t === 'TEXTAREA') return
    if (e.key === 'Escape') { c.remove(); s.remove(); document.removeEventListener('keydown', kd) }
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, data.length - 1); ua() }
    if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); ua() }
    if (e.key >= '1' && e.key <= '9') { var x = parseInt(e.key) - 1; if (x < data.length) { e.preventDefault(); idx = x; ua() } }
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); cc() }
  }

  document.addEventListener('keydown', kd)
  document.getElementById('__bm_x').onclick = function() { c.remove(); s.remove() }
})()
