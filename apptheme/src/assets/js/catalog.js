// ═══ جستجوی زنده فروشگاه — با تایپ، بدون دکمه ═══
(function () {
  'use strict';
  var input = document.getElementById('liveSearch');
  var grid = document.getElementById('catalogGrid');
  if (!input || !grid) return;
  var timer = null;

  function fetchGrid(url) {
    var hint = document.getElementById('searchHint');
    if (hint) hint.hidden = false;
    fetch(url, { headers: { 'X-Partial': 'grid' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var fresh = doc.getElementById('catalogGrid');
        if (fresh) grid.innerHTML = fresh.innerHTML;
        if (hint) hint.hidden = true;
      })
      .catch(function () { if (hint) hint.hidden = true; });
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    timer = setTimeout(function () {
      var u = new URL(location.href);
      if (input.value.trim()) u.searchParams.set('q', input.value.trim()); else u.searchParams.delete('q');
      u.searchParams.delete('page');
      history.replaceState(null, '', u);
      fetchGrid(u);
    }, 320);
  });
})();
