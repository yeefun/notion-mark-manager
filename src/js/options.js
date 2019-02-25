let checkedColors = [];

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('options-form');
  const status = document.getElementById('status');

  function initOptions() {
    chrome.storage.sync.get(
      ['checkedColors', 'tabFirstShow'],
      function (items) {
        if (items.checkedColors) {
          checkedColors = items.checkedColors;
        } else {
          checkedColors = ['font-gray', 'font-brown', 'font-orange', 'font-yellow', 'font-green', 'font-blue', 'font-purple', 'font-pink', 'font-red', 'background-gray', 'background-brown', 'background-orange', 'background-yellow', 'background-green', 'background-blue', 'background-purple', 'background-pink', 'background-red'];
        }
        checkedColors.forEach(function (color) {
          constructOption(color);
        });

        const tabFirstShowName = items.tabFirstShow;
        if (tabFirstShowName) {
          document.getElementById(tabFirstShowName).checked = true;
        } else {
          document.getElementById('comments').checked = true;
        }
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
    const checkedRadio = document.querySelector('[type="radio"]:checked').value;
    Array.prototype.forEach.call(checkedboxes, function (checkedbox) {
      checkedColors.push(checkedbox.value);
    });

    chrome.storage.sync.set(
      {
        checkedColors: checkedColors,
        tabFirstShow: checkedRadio,
      },
      function () {
        status.textContent = 'Your options have been saved!';
        setTimeout(function () {
          status.textContent = '';
        }, 3000);
      }
    );
  });
});