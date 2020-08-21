// https://davidsimpson.me/2014/05/27/add-googles-universal-analytics-tracking-chrome-extension/
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

ga('create', 'UA-134635576-1', 'auto');
// Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('set', 'checkProtocolTask', function () {});
ga('require', 'displayfeatures');
ga('send', 'pageview', '/options.html');

let originColors = [];
let originTab = '';
let originTimes = '';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('options-form');
  const status = document.getElementById('status');

  function initOptions() {
    chrome.storage.sync.get(
      ['textColors', 'tabFirstShow', 'displayTimes'],
      function (items) {
        originColors = items.textColors || [
          'font-gray',
          'font-brown',
          'font-orange',
          'font-yellow',
          'font-green',
          'font-blue',
          'font-purple',
          'font-pink',
          'font-red',
          'background-gray',
          'background-brown',
          'background-orange',
          'background-yellow',
          'background-green',
          'background-blue',
          'background-purple',
          'background-pink',
          'background-red',
        ];
        originColors.forEach(function (color) {
          constructOption(color);
        });

        originTab = items.tabFirstShow || 'colored-texts';
        document.getElementById(originTab).checked = true;

        originTimes = items.displayTimes || 'once';
        document.getElementById(originTimes).checked = true;
      }
    );
  }

  function constructOption(checkedColor) {
    const inputCheckbox = document.getElementById(checkedColor);
    inputCheckbox.checked = true;
  }

  initOptions();

  form.addEventListener('submit', function (evt) {
    evt.preventDefault();
    let checkedColors = [];
    const checkedboxes = document.querySelectorAll('[type="checkbox"]:checked');
    const checkedTab = document.querySelector('[name="tab"]:checked').value;
    const checkedTimes = document.querySelector('[name="times"]:checked').value;
    Array.prototype.forEach.call(checkedboxes, function (checkedbox) {
      checkedColors.push(checkedbox.value);
    });

    chrome.storage.sync.set(
      {
        textColors: checkedColors,
        tabFirstShow: checkedTab,
        displayTimes: checkedTimes,
      },
      function () {
        let checkedFontColors = [];
        let checkedBackgroundColors = [];
        checkedColors.forEach(function (color) {
          if (color.indexOf('font-') !== -1) {
            checkedFontColors.push(color);
          } else {
            checkedBackgroundColors.push(color);
          }
        });
        status.textContent = 'Your options have been saved!';

        const originColorsStr = originColors.join();
        const originFontColors = originColorsStr.substring(
          originColorsStr.indexOf(',background-'),
          0
        );
        const originBackgroundColors = originColorsStr.substring(
          originColorsStr.indexOf(',background-') + 1
        );
        checkedFontColors = checkedFontColors.join();
        checkedBackgroundColors = checkedBackgroundColors.join();
        const isFontColorsEqual = checkedFontColors === originFontColors;
        const isBackgroundColorsEqual =
          checkedBackgroundColors === originBackgroundColors;

        // GA: 按 'Save' 儲存選項幾次？
        ga('send', 'event', 'Options', 'Save', '[Notion+ Mark Manager]');
        // GA: 讓哪個 tab 先顯示？這次儲存是否有更改到此選項（[origin]）？
        ga(
          'send',
          'event',
          'Options',
          'Select',
          `[Notion+ Mark Manager] [tab first show] [${checkedTab}]${
            checkedTab === originTab ? ' [origin]' : ''
          }`
        );
        // GA: 選了哪項顯示次數？這次儲存是否有更改到此選項（[origin]）？
        ga(
          'send',
          'event',
          'Options',
          'Select',
          `[Notion+ Mark Manager] [display times] [${checkedTimes}]${
            checkedTimes === originTimes ? ' [origin]' : ''
          }`
        );
        // GA: 選了哪些顏色（font）？這次儲存是否有更改到此選項（[origin]）？
        ga(
          'send',
          'event',
          'Options',
          'Check',
          `[Notion+ Mark Manager] [font color] [${checkedFontColors.replace(
            /font-/g,
            ''
          )}]${isFontColorsEqual ? ' [origin]' : ''}`,
          checkedFontColors.length
        );
        // GA: 選了哪些顏色（background）？這次儲存是否有更改到此選項（[origin]）？
        ga(
          'send',
          'event',
          'Options',
          'Check',
          `[Notion+ Mark Manager] [background color] [${checkedBackgroundColors.replace(
            /background-/g,
            ''
          )}]${isBackgroundColorsEqual ? ' [origin]' : ''}`,
          checkedBackgroundColors.length
        );
        originColors = checkedColors;
        originTab = checkedTab;
        originTimes = checkedTimes;

        setTimeout(function () {
          status.textContent = '';
        }, 3000);
      }
    );
  });
});
