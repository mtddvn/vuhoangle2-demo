
(function () {
  'use strict';
  var CONSENT_TEXT = 'Tôi đồng ý cho Vũ Hoàng Lê dùng họ tên, số điện thoại, mẫu xe, ngày lái thử và ghi chú tôi nhập để liên hệ tư vấn và xếp lịch lái thử.';
  var NOTICE_VERSION = 'PDP-2026.1';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  
  $$('[data-fade]').forEach(function (el) {
    var edge = function () {
      el.classList.toggle('more', el.scrollWidth - el.clientWidth - el.scrollLeft > 4);
      el.classList.toggle('less', el.scrollLeft > 4);
    };
    el.addEventListener('scroll', edge, { passive: true });
    window.addEventListener('resize', edge);
    edge();
  });

  
  $$('.nav-m a').forEach(function (a) {
    a.addEventListener('click', function () {
      var d = a.closest('details');
      if (d) { d.removeAttribute('open'); }
    });
  });

  
  var cat = $('[data-catalog]');
  if (cat) {
    var bar = $('.tabbar', cat);
    var groups = $$('.grp', cat);
    var tabs = [];
    var show = function (id, focus) {
      groups.forEach(function (g, i) {
        var on = g.id === id;
        if (on) { g.removeAttribute('hidden'); } else { g.setAttribute('hidden', ''); }
        tabs[i].setAttribute('aria-selected', on ? 'true' : 'false');
        tabs[i].tabIndex = on ? 0 : -1;
        if (on && focus) { tabs[i].focus(); }
        if (on && bar.scrollTo) { center(tabs[i]); }
      });
    };
    groups.forEach(function (g) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tab';
      b.setAttribute('role', 'tab');
      b.id = 'tab-' + g.getAttribute('data-grp');
      b.setAttribute('aria-controls', g.id);
      var s = document.createElement('span');
      s.textContent = g.getAttribute('data-title');
      var n = document.createElement('span');
      n.className = 'n';
      n.textContent = g.getAttribute('data-n');
      b.appendChild(s);
      b.appendChild(n);
      g.setAttribute('role', 'tabpanel');
      g.setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', function () { show(g.id, false); });
      b.addEventListener('keydown', function (ev) {
        var i = tabs.indexOf(b), j = -1;
        if (ev.key === 'ArrowRight') { j = (i + 1) % tabs.length; }
        else if (ev.key === 'ArrowLeft') { j = (i - 1 + tabs.length) % tabs.length; }
        else if (ev.key === 'Home') { j = 0; }
        else if (ev.key === 'End') { j = tabs.length - 1; }
        if (j >= 0) { ev.preventDefault(); show(groups[j].id, true); }
      });
      tabs.push(b);
      bar.appendChild(b);
    });
    var fade = function () {
      bar.classList.toggle('more', bar.scrollWidth - bar.clientWidth - bar.scrollLeft > 4);
      bar.classList.toggle('less', bar.scrollLeft > 4);
    };
    var center = function (t) {
      if (bar.scrollWidth <= bar.clientWidth) { return; }
      var br = bar.getBoundingClientRect(), tr = t.getBoundingClientRect();
      var left = bar.scrollLeft + (tr.left - br.left) - (bar.clientWidth - tr.width) / 2;
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      bar.scrollTo({ left: left, behavior: calm ? 'auto' : 'smooth' });
    };
    bar.addEventListener('scroll', fade, { passive: true });
    window.addEventListener('resize', fade);
    var start = groups[0].id;
    var h = (location.hash || '').replace('#', '');
    groups.forEach(function (g) { if (g.id === h) { start = h; } });
    show(start, false);
    fade();
    window.addEventListener('hashchange', function () {
      var k = (location.hash || '').replace('#', '');
      groups.forEach(function (g) { if (g.id === k) { show(k, false); } });
    });
  }

  
  var q = new URLSearchParams(location.search);
  var colorKey = q.get('color');
  if (colorKey) {
    var radio = document.getElementById('color-' + colorKey);
    if (radio) { radio.checked = true; }
  }
  var cmpBtn = document.getElementById('cmp-btn');
  var cmp = document.getElementById('compare');
  if (cmpBtn && cmp) {
    cmpBtn.addEventListener('click', function () {
      var open = cmp.classList.toggle('open');
      cmpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) { cmp.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    });
    var sel = document.getElementById('cmp-sel');
    var nm = document.getElementById('cmp-name');
    if (sel && nm) {
      sel.addEventListener('change', function () {
        nm.textContent = sel.value ? sel.options[sel.selectedIndex].text : 'Chọn một mẫu xe';
      });
    }
  }

  
  var form = document.getElementById('ride-form');
  if (!form) { return; }

  var seq = 0;
  var API = {
    submitRide: function (payload) {
      return new Promise(function (resolve) {
        window.setTimeout(function () { seq += 1; resolve({ id: 'demo-' + seq, at: new Date() }); }, 600);
      });
    },
    withdrawConsent: function (id) {
      return new Promise(function (resolve) {
        window.setTimeout(function () { resolve({ at: new Date() }); }, 300);
      });
    }
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmt(d) {
    return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' +
      pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
  }
  function maskPhone(digits) { return digits.slice(0, 4) + ' *** ' + digits.slice(-3); }

  var f = {
    name: document.getElementById('f-name'), phone: document.getElementById('f-phone'),
    model: document.getElementById('f-model'), date: document.getElementById('f-date'),
    note: document.getElementById('f-note'), consent: document.getElementById('f-consent')
  };
  var box = document.getElementById('consent-box');
  var summary = document.getElementById('summary');
  var btn = document.getElementById('submit-btn');
  var ok = document.getElementById('ok-box');
  var body = document.getElementById('log-body');
  var records = $$('tr', body).map(function (tr) {
    return {
      id: tr.getAttribute('data-id'), who: tr.getAttribute('data-who'), phone: tr.getAttribute('data-phone'),
      at: tr.getAttribute('data-at'), text: CONSENT_TEXT, ver: tr.getAttribute('data-ver'),
      state: tr.getAttribute('data-state'), off: tr.getAttribute('data-off') || '', sample: tr.getAttribute('data-sample') === '1'
    };
  });

  var now = new Date();
  f.date.min = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  var pre = q.get('model');
  if (pre) { f.model.value = pre; }

  function setErr(input, id, show) {
    var el = document.getElementById(id);
    if (show) { el.classList.add('show'); } else { el.classList.remove('show'); }
    if (input === f.consent) {
      if (show) { box.classList.add('bad'); } else { box.classList.remove('bad'); }
    }
    input.setAttribute('aria-invalid', show ? 'true' : 'false');
    return show;
  }
  function phoneDigits() { return f.phone.value.replace(/[\s.\-]/g, ''); }
  function checkName() { return !setErr(f.name, 'e-name', f.name.value.trim().length < 2); }
  function checkPhone() { return !setErr(f.phone, 'e-phone', !/^0[0-9]{9}$/.test(phoneDigits())); }
  function checkConsent() { return !setErr(f.consent, 'e-consent', !f.consent.checked); }
  f.name.addEventListener('blur', function () { if (f.name.value) { checkName(); } });
  f.phone.addEventListener('blur', function () { if (f.phone.value) { checkPhone(); } });
  f.name.addEventListener('input', function () { if (f.name.getAttribute('aria-invalid') === 'true') { checkName(); } });
  f.phone.addEventListener('input', function () { if (f.phone.getAttribute('aria-invalid') === 'true') { checkPhone(); } });
  f.consent.addEventListener('change', function () { if (f.consent.checked) { checkConsent(); summary.classList.remove('show'); } });

  function addRow(id, name, phoneMasked, at) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-id', id);
    tr.className = 'new';
    records.unshift({ id: id, who: name, phone: phoneMasked, at: fmt(at), text: CONSENT_TEXT, ver: NOTICE_VERSION, state: 'active', off: '', sample: false });
    function td(label) { var c = document.createElement('td'); c.setAttribute('data-label', label); tr.appendChild(c); return c; }
    var c1 = td('Ai đồng ý');
    var b = document.createElement('b'); b.textContent = name; c1.appendChild(b);
    var sp = document.createElement('span'); sp.className = 'ph'; sp.textContent = phoneMasked; c1.appendChild(sp);
    td('Lúc nào').textContent = fmt(at);
    td('Nội dung đồng ý').textContent = CONSENT_TEXT;
    td('Phiên bản thông báo').textContent = NOTICE_VERSION;
    var c5 = td('Trạng thái');
    var st = document.createElement('span'); st.className = 'st st-ok'; st.textContent = 'Đang hiệu lực'; c5.appendChild(st);
    c5.appendChild(document.createTextNode(' '));
    var w = document.createElement('button'); w.type = 'button'; w.className = 'lnk'; w.setAttribute('data-act', 'withdraw'); w.textContent = 'Rút lại'; c5.appendChild(w);
    body.insertBefore(tr, body.firstChild);
  }

  body.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!t || t.getAttribute('data-act') !== 'withdraw') { return; }
    var tr = t.closest('tr');
    t.disabled = true;
    API.withdrawConsent(tr.getAttribute('data-id')).then(function (res) {
      records.forEach(function (r) { if (r.id === tr.getAttribute('data-id')) { r.state = 'withdrawn'; r.off = fmt(res.at); } });
      var cell = t.parentNode;
      while (cell.firstChild) { cell.removeChild(cell.firstChild); }
      var st = document.createElement('span');
      st.className = 'st st-off';
      st.textContent = 'Đã rút lại lúc ' + fmt(res.at);
      cell.appendChild(st);
    });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var a = checkName(), b = checkPhone(), c = checkConsent();
    if (!(a && b && c)) {
      var n = (a ? 0 : 1) + (b ? 0 : 1) + (c ? 0 : 1);
      summary.textContent = 'Chưa gửi được. Hãy kiểm tra ' + n + ' mục được đánh dấu.';
      summary.classList.add('show');
      (!a ? f.name : (!b ? f.phone : f.consent)).focus();
      return;
    }
    summary.classList.remove('show');
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.textContent = 'Đang ghi nhận';
    var name = f.name.value.trim();
    var digits = phoneDigits();
    API.submitRide({
      name: name, phone: digits, model: f.model.value, date: f.date.value, note: f.note.value,
      consent: { text: CONSENT_TEXT, noticeVersion: NOTICE_VERSION }
    }).then(function (res) {
      addRow(res.id, name, maskPhone(digits), res.at);
      var dl = document.getElementById('ok-dl');
      while (dl.firstChild) { dl.removeChild(dl.firstChild); }
      var row = function (k, v) {
        var dt = document.createElement('dt'); dt.textContent = k;
        var dd = document.createElement('dd'); dd.textContent = v;
        dl.appendChild(dt); dl.appendChild(dd);
      };
      row('Họ và tên', name);
      row('Số điện thoại', maskPhone(digits));
      row('Mẫu xe', f.model.value ? f.model.options[f.model.selectedIndex].text : 'Chưa chọn');
      row('Ngày lái thử', f.date.value ? f.date.value.split('-').reverse().join('/') : 'Chưa chọn');
      form.classList.add('gone');
      ok.classList.add('show');
      ok.focus();
      btn.disabled = false;
      btn.removeAttribute('aria-busy');
      btn.textContent = 'Gửi đăng ký lái thử';
    });
  });

  document.getElementById('again-btn').addEventListener('click', function () {
    form.reset();
    if (pre) { f.model.value = pre; }
    f.name.setAttribute('aria-invalid', 'false');
    f.phone.setAttribute('aria-invalid', 'false');
    ok.classList.remove('show');
    form.classList.remove('gone');
    f.name.focus();
  });

  
  document.getElementById('csv-btn').addEventListener('click', function () {
    var lines = [['Ai đồng ý', 'Số điện thoại (che bớt)', 'Lúc nào', 'Nội dung đồng ý', 'Phiên bản thông báo', 'Trạng thái', 'Rút lại lúc', 'Dữ liệu mẫu']];
    records.forEach(function (r) {
      lines.push([r.who, r.phone, r.at, r.text, r.ver, r.state === 'active' ? 'Đang hiệu lực' : 'Đã rút lại', r.off, r.sample ? 'Mẫu' : '']);
    });
    function cell(x) {
      x = String(x);
      if (/^[=+\-@\t\r]/.test(x)) { x = "'" + x; }
      return '"' + x.replace(/"/g, '""') + '"';
    }
    var csv = lines.map(function (r) { return r.map(cell).join(','); }).join('\r\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'consent-log-demo.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
})();
