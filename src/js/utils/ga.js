export { loadGa, sendGaPageview, sendGaEvt };

function loadGa() {
  // References: https://davidsimpson.me/2014/05/27/add-googles-universal-analytics-tracking-chrome-extension/
  (function (i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    (i[r] =
      i[r] ||
      function () {
        (i[r].q = i[r].q || []).push(arguments);
      }),
      (i[r].l = 1 * new Date());
    (a = s.createElement(o)), (m = s.getElementsByTagName(o)[0]);
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(
    window,
    document,
    'script',
    'https://www.google-analytics.com/analytics.js',
    'ga'
  );
}

function sendGaPageview(page) {
  window.ga('create', 'UA-134635576-1', 'auto');
  // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
  window.ga('set', 'checkProtocolTask', function () {});
  window.ga('require', 'displayfeatures');
  window.ga('send', 'pageview', page);
}

function sendGaEvt(category, action, label, value = 1) {
  if (!window.ga) {
    return;
  }

  window.ga('send', 'event', category, action, label, value);
}
