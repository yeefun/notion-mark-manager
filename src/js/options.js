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

  var currentOptions = await getOptions();

  checkInputs();

  listenOptionsSaved();

  if (inProdEnv) {
    loadGa();
    sendGaPageview('/options.html');
  }

  function checkInputs() {
    var { colorNames, tabActivatedFirst, displayedTimes } = currentOptions;

    [...colorNames, tabActivatedFirst, displayedTimes].forEach(checkInput);

    function checkInput(id) {
      document.getElementById(id).checked = true;
    }
  }

  function listenOptionsSaved() {
    document.getElementById('form').addEventListener('submit', handleSubmit);

    async function handleSubmit(evt) {
      evt.preventDefault();

      var newOptions = getNewOptions();

      await setOptions(newOptions);

      setFormStatus('Your options have been saved!');
      setTimeout(clearFormStatus, 3000);

      {
        const {
          tabActivatedFirst: oldTabActivatedFirst,
          displayedTimes: oldDisplayedTimes,
        } = currentOptions;
        const {
          tabActivatedFirst: newTabActivatedFirst,
          displayedTimes: newDisplayedTimes,
        } = newOptions;

        if (newTabActivatedFirst !== oldTabActivatedFirst) {
          // GA: 讓哪個 tab 先顯示？
          sendGaEvent(
            'Options',
            'Select',
            `[Notion+ Mark Manager] [tab first show] [${newTabActivatedFirst}]`
          );
        }

        if (newDisplayedTimes !== oldDisplayedTimes) {
          // GA: 選了哪項顯示次數？
          sendGaEvent(
            'Options',
            'Select',
            `[Notion+ Mark Manager] [display times] [${newDisplayedTimes}]`
          );
        }
      }

      currentOptions = newOptions;

      function getNewOptions() {
        var newOptions = {};

        {
          const inputNames = ['tab', 'displayed-times', 'color-name'];

          [
            newOptions.tabActivatedFirst,
            newOptions.displayedTimes,
            ...newOptions.colorNames
          ] = inputNames.flatMap(getCheckedInputs).map(extractValue);
        }

        return newOptions;

        function getCheckedInputs(name) {
          return Array.from(
            document.querySelectorAll(`[name="${name}"]:checked`)
          );
        }

        function extractValue(input) {
          return input.value;
        }
      }

      function setOptions(options) {
        return setChromeStorage(options);
      }

      var formStatusElem = document.getElementById('form-status');
      function setFormStatus(content) {
        formStatusElem.textContent = content;
      }

      function clearFormStatus() {
        setFormStatus('');
      }
    }
  }
});
