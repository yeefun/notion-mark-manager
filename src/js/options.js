import {
  inProdEnv,
  getChromeStorage,
  setChromeStorage,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';
import DEFAULT_OPTIONS from './data/default-options.js';

document.addEventListener('DOMContentLoaded', async () => {
  const getOptions = getChromeStorage(DEFAULT_OPTIONS);

  var options = await getOptions();

  checkOptions();

  listenOptionsSaved();

  if (inProdEnv) {
    loadGa();
    sendGaPageview('/options.html');
  }

  function listenOptionsSaved() {
    var formStatusElem = document.getElementById('form-status');

    document.getElementById('form').addEventListener('submit', handleSubmit);

    async function handleSubmit(evt) {
      evt.preventDefault();

      const inputNames = ['tab', 'displayed-times', 'color-name'];
      const [
        newTabActivatedFirst,
        newDisplayedTimes,
        ...newColorNames
      ] = inputNames.flatMap(getCheckedInputs).map(extractValue);

      await setOptions({
        colorNames: newColorNames,
        tabActivatedFirst: newTabActivatedFirst,
        displayedTimes: newDisplayedTimes,
      });

      setFormStatus('Your options have been saved!');
      setTimeout(clearFormStatus, 3000);

      let checkedFontColors = [];
      let checkedBackgroundColors = [];

      newColorNames.forEach(function (color) {
        if (color.indexOf('font-') !== -1) {
          checkedFontColors.push(color);
        } else {
          checkedBackgroundColors.push(color);
        }
      });

      const originColorsStr = options.colorNames.join();
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
        `[Notion+ Mark Manager] [tab first show] [${newTabActivatedFirst}]${
          newTabActivatedFirst === options.tabActivatedFirst ? ' [origin]' : ''
        }`
      );
      // GA: 選了哪項顯示次數？這次儲存是否有更改到此選項（[origin]）？
      sendGaEvent(
        'Options',
        'Select',
        `[Notion+ Mark Manager] [display times] [${newDisplayedTimes}]${
          newDisplayedTimes === options.displayedTimes ? ' [origin]' : ''
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

      options = {
        colorNames: newColorNames,
        tabActivatedFirst: newTabActivatedFirst,
        displayedTimes: newDisplayedTimes,
      };

      function getCheckedInputs(name) {
        return Array.from(
          document.querySelectorAll(`[name="${name}"]:checked`)
        );
      }

      function extractValue(input) {
        return input.value;
      }

      function setOptions(options) {
        return setChromeStorage(options);
      }

      function setFormStatus(content) {
        formStatusElem.textContent = content;
      }

      function clearFormStatus() {
        setFormStatus('');
      }
    }
  }

  function checkOptions() {
    var { colorNames, tabActivatedFirst, displayedTimes } = options;

    [...colorNames, tabActivatedFirst, displayedTimes].forEach(checkOption);

    function checkOption(id) {
      document.getElementById(id).checked = true;
    }
  }
});
