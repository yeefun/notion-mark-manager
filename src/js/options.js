import {
  inProdEnv,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';

if (inProdEnv) {
  loadGa();
  sendGaPageview('/options.html');
}

let originColorNames = [];
let originTab = '';
let originTimes = '';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('options-form');
  const status = document.getElementById('status');

  function initOptions() {
    chrome.storage.sync.get(
      ['checkedColorNames', 'tabFirstShow', 'displayTimes'],
      function (items) {
        originColorNames = items.checkedColorNames || [
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
        originColorNames.forEach(function (color) {
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
    let checkedColorNames = [];
    const checkedboxes = document.querySelectorAll('[type="checkbox"]:checked');
    const checkedTab = document.querySelector('[name="tab"]:checked').value;
    const checkedTimes = document.querySelector('[name="times"]:checked').value;
    Array.prototype.forEach.call(checkedboxes, function (checkedbox) {
      checkedColorNames.push(checkedbox.value);
    });

    chrome.storage.sync.set(
      {
        checkedColorNames,
        tabFirstShow: checkedTab,
        displayTimes: checkedTimes,
      },
      function () {
        let checkedFontColors = [];
        let checkedBackgroundColors = [];
        checkedColorNames.forEach(function (color) {
          if (color.indexOf('font-') !== -1) {
            checkedFontColors.push(color);
          } else {
            checkedBackgroundColors.push(color);
          }
        });
        status.textContent = 'Your options have been saved!';

        const originColorsStr = originColorNames.join();
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
        sendGaEvent('Options', 'Save', '[Notion+ Mark Manager]');
        // GA: 讓哪個 tab 先顯示？這次儲存是否有更改到此選項（[origin]）？
        sendGaEvent(
          'Options',
          'Select',
          `[Notion+ Mark Manager] [tab first show] [${checkedTab}]${
            checkedTab === originTab ? ' [origin]' : ''
          }`
        );
        // GA: 選了哪項顯示次數？這次儲存是否有更改到此選項（[origin]）？
        sendGaEvent(
          'Options',
          'Select',
          `[Notion+ Mark Manager] [display times] [${checkedTimes}]${
            checkedTimes === originTimes ? ' [origin]' : ''
          }`
        );
        // GA: 選了哪些顏色（font）？這次儲存是否有更改到此選項（[origin]）？
        sendGaEvent(
          'Options',
          'Check',
          `[Notion+ Mark Manager] [font color] [${checkedFontColors.replace(
            /font-/g,
            ''
          )}]${isFontColorsEqual ? ' [origin]' : ''}`,
          checkedFontColors.length
        );
        // GA: 選了哪些顏色（background）？這次儲存是否有更改到此選項（[origin]）？
        sendGaEvent(
          'Options',
          'Check',
          `[Notion+ Mark Manager] [background color] [${checkedBackgroundColors.replace(
            /background-/g,
            ''
          )}]${isBackgroundColorsEqual ? ' [origin]' : ''}`,
          checkedBackgroundColors.length
        );

        originColorNames = checkedColorNames;
        originTab = checkedTab;
        originTimes = checkedTimes;

        setTimeout(function () {
          status.textContent = '';
        }, 3000);
      }
    );
  });
});
