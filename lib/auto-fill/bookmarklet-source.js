(function () {
  if (window.__tabuddyAutoFill) return;
  window.__tabuddyAutoFill = true;

  var CSS =
    '#tabuddy-panel{all:initial;position:fixed;top:20px;right:20px;z-index:999999;width:380px;max-height:90vh;background:#fff;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.18);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:14px;line-height:1.5;color:#333;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e8e8e8}' +
    '#tabuddy-panel *{all:revert;box-sizing:border-box}' +
    '#tabuddy-panel .header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#4f46e5;color:#fff;font-weight:600;font-size:15px}' +
    '#tabuddy-panel .header button{all:revert;background:none;border:none;color:#fff;font-size:20px;cursor:pointer;padding:0 4px;line-height:1}' +
    '#tabuddy-panel .body{padding:12px 16px;overflow-y:auto;flex:1}' +
    '#tabuddy-panel .section{margin-bottom:12px}' +
    '#tabuddy-panel .section label{display:block;font-size:12px;font-weight:600;color:#666;margin-bottom:4px}' +
    '#tabuddy-panel textarea{all:revert;width:100%;min-height:60px;padding:8px 10px;border:1px solid #ddd;border-radius:6px;font-size:13px;font-family:monospace;resize:vertical}' +
    '#tabuddy-panel textarea:focus{outline:none;border-color:#4f46e5}' +
    '#tabuddy-panel .student-list{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px}' +
    '#tabuddy-panel .student-list button{all:revert;padding:4px 10px;border-radius:14px;border:1px solid #ddd;background:#f5f5f5;cursor:pointer;font-size:12px;transition:all .15s}' +
    '#tabuddy-panel .student-list button:hover{border-color:#4f46e5;color:#4f46e5}' +
    '#tabuddy-panel .student-list button.active{background:#4f46e5;color:#fff;border-color:#4f46e5}' +
    '#tabuddy-panel .preview-box{background:#f9f9fb;border-radius:6px;padding:10px;font-size:13px;color:#444;min-height:40px;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}' +
    '#tabuddy-panel .preview-box.empty{color:#bbb;font-style:italic}' +
    '#tabuddy-panel .actions{display:flex;gap:6px;margin-top:8px}' +
    '#tabuddy-panel .actions button{all:revert;flex:1;padding:8px 0;border-radius:6px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s}' +
    '#tabuddy-panel .btn-primary{background:#4f46e5;color:#fff}' +
    '#tabuddy-panel .btn-primary:hover{background:#4338ca}' +
    '#tabuddy-panel .btn-primary:disabled{background:#a5b4fc;cursor:default}' +
    '#tabuddy-panel .btn-secondary{background:#e5e7eb;color:#333}' +
    '#tabuddy-panel .btn-secondary:hover{background:#d1d5db}' +
    '#tabuddy-panel .status-bar{margin-top:8px;padding:6px 10px;border-radius:6px;font-size:12px;display:none}' +
    '#tabuddy-panel .status-bar.success{display:block;background:#ecfdf5;color:#065f46}' +
    '#tabuddy-panel .status-bar.error{display:block;background:#fef2f2;color:#991b1b}' +
    '#tabuddy-panel .status-bar.info{display:block;background:#eff6ff;color:#1e40af}';

  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function showStatus(msg, type) {
    var el = document.getElementById('tabuddy-status');
    if (!el) return;
    el.textContent = msg;
    el.className = 'status-bar ' + type;
    if (type === 'success' || type === 'error') {
      setTimeout(function () { el.style.display = 'none'; }, 3000);
    }
  }

  function findStudentButtons() {
    var all = document.querySelectorAll('button, a, [role="tab"], [role="button"]');
    var result = [];
    var seen = new Set();
    all.forEach(function (el) {
      var text = (el.textContent || '').trim();
      if (text.length >= 2 && text.length <= 6 && /^[\u4e00-\u9fa5a-zA-Z]+$/.test(text) && !seen.has(text)) {
        seen.add(text);
        result.push({ name: text, el: el });
      }
    });
    return result;
  }

  function findTextareasByLabel(labelText) {
    var textareas = document.querySelectorAll('textarea');
    var results = [];
    textareas.forEach(function (ta) {
      var parent = ta.parentElement;
      var found = false;
      for (var i = 0; i < 5; i++) {
        if (!parent) break;
        var labels = parent.querySelectorAll('label, span, div, h1, h2, h3, h4');
        for (var j = 0; j < labels.length; j++) {
          if (labels[j].textContent.indexOf(labelText) !== -1) {
            found = true;
            break;
          }
        }
        if (found) break;
        parent = parent.parentElement;
      }
      if (found) results.push(ta);
    });
    return results;
  }

  function fillTextarea(ta, value) {
    ta.value = value;
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new Event('change', { bubbles: true }));
    ta.dispatchEvent(new Event('blur', { bubbles: true }));
  }

  var panel = document.createElement('div');
  panel.id = 'tabuddy-panel';
  panel.innerHTML =
    '<div class="header"><span>📋 TABuddy 填写助手</span><button onclick="var p=document.getElementById(\'tabuddy-panel\');p.parentNode.removeChild(p);window.__tabuddyAutoFill=false">✕</button></div>' +
    '<div class="body">' +
    '<div class="section">' +
    '<label>📥 第一步：粘贴数据（从 TABuddy 复制）</label>' +
    '<textarea id="tabuddy-data-input" placeholder="在 TABuddy 点击「复制书签数据」，然后粘贴到这里..."></textarea>' +
    '</div>' +
    '<div class="section">' +
    '<label>👤 第二步：选择学生</label>' +
    '<div class="student-list" id="tabuddy-students"></div>' +
    '</div>' +
    '<div class="section">' +
    '<label>📝 反馈预览</label>' +
    '<div class="preview-box empty" id="tabuddy-preview">选择学生后显示反馈内容</div>' +
    '</div>' +
    '<div class="section">' +
    '<label>🎯 填写目标</label>' +
    '<select id="tabuddy-target-field" style="width:100%;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px">' +
    '<option value="课堂表现">课堂表现</option>' +
    '<option value="上节课练习情况">上节课练习情况</option>' +
    '<option value="建议练习">建议练习</option>' +
    '<option value="课中掌握情况">课中掌握情况</option>' +
    '<option value="课堂入门测">课堂入门测</option>' +
    '<option value="课堂出门测">课堂出门测</option>' +
    '<option value="custom">自定义选择器</option>' +
    '</select>' +
    '<input id="tabuddy-custom-selector" placeholder="输入 CSS 选择器，如 .feedback-input" style="display:none;width:100%;margin-top:4px;padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:13px">' +
    '</div>' +
    '<div class="actions">' +
    '<button class="btn-secondary" id="tabuddy-btn-prev">← 上一个</button>' +
    '<button class="btn-primary" id="tabuddy-btn-fill" disabled>✏️ 填写</button>' +
    '<button class="btn-secondary" id="tabuddy-btn-next">下一个 →</button>' +
    '</div>' +
    '<div class="status-bar" id="tabuddy-status"></div>' +
    '</div>';

  injectCSS();
  document.body.appendChild(panel);

  var currentData = null;
  var currentStudents = [];
  var currentIndex = -1;

  var dataInput = document.getElementById('tabuddy-data-input');
  var studentContainer = document.getElementById('tabuddy-students');
  var previewBox = document.getElementById('tabuddy-preview');
  var fillBtn = document.getElementById('tabuddy-btn-fill');
  var prevBtn = document.getElementById('tabuddy-btn-prev');
  var nextBtn = document.getElementById('tabuddy-btn-next');
  var targetSelect = document.getElementById('tabuddy-target-field');
  var customSelectorInput = document.getElementById('tabuddy-custom-selector');

  targetSelect.addEventListener('change', function () {
    customSelectorInput.style.display = this.value === 'custom' ? 'block' : 'none';
  });

  dataInput.addEventListener('paste', function () {
    setTimeout(parseData, 100);
  });

  function parseData() {
    var raw = dataInput.value.trim();
    if (!raw) return;
    try {
      currentData = JSON.parse(raw);
      if (!currentData.students || !Array.isArray(currentData.students)) {
        showStatus('数据格式错误：缺少 students 数组', 'error');
        return;
      }
      currentStudents = currentData.students;
      renderStudents();
      showStatus('已加载 ' + currentStudents.length + ' 名学生数据', 'success');
    } catch (e) {
      showStatus('数据解析失败：' + e.message, 'error');
    }
  }

  function renderStudents() {
    studentContainer.innerHTML = '';
    currentStudents.forEach(function (s, i) {
      var btn = document.createElement('button');
      btn.textContent = s.name;
      btn.onclick = function () { selectStudent(i); };
      if (i === currentIndex) btn.className = 'active';
      studentContainer.appendChild(btn);
    });
  }

  function selectStudent(idx) {
    currentIndex = idx;
    var btns = studentContainer.querySelectorAll('button');
    btns.forEach(function (b, i) { b.className = i === idx ? 'active' : ''; });
    var student = currentStudents[idx];
    if (student && student.feedback) {
      previewBox.textContent = student.feedback;
      previewBox.className = 'preview-box';
      fillBtn.disabled = false;
    } else {
      previewBox.textContent = '该学生暂无反馈内容';
      previewBox.className = 'preview-box empty';
      fillBtn.disabled = true;
    }
  }

  function getTargetField() {
    var val = targetSelect.value;
    if (val === 'custom') {
      return customSelectorInput.value.trim();
    }
    return val;
  }

  function getTextareasForField(field) {
    if (field === 'custom') {
      var sel = customSelectorInput.value.trim();
      if (!sel) return [];
      return document.querySelectorAll(sel);
    }
    return findTextareasByLabel(field);
  }

  fillBtn.addEventListener('click', function () {
    if (currentIndex < 0 || !currentStudents[currentIndex]) return;
    var student = currentStudents[currentIndex];
    var field = getTargetField();
    if (!field) { showStatus('请先选择填写目标', 'error'); return; }

    var textareas = getTextareasForField(field);
    if (textareas.length === 0) {
      showStatus('未找到「' + field + '」输入框，请检查选择器', 'error');
      return;
    }
    fillTextarea(textareas[0], student.feedback);
    showStatus('✅ 已填入「' + student.name + '」的反馈', 'success');
  });

  prevBtn.addEventListener('click', function () {
    if (!currentStudents.length) return;
    var idx = currentIndex <= 0 ? currentStudents.length - 1 : currentIndex - 1;
    selectStudent(idx);
  });

  nextBtn.addEventListener('click', function () {
    if (!currentStudents.length) return;
    var idx = currentIndex >= currentStudents.length - 1 ? 0 : currentIndex + 1;
    selectStudent(idx);
  });

  showStatus('已启动！请粘贴数据开始使用', 'info');
})();
