// https://davidsimpson.me/2014/05/27/add-googles-universal-analytics-tracking-chrome-extension/
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-134635576-1', 'auto');
// Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('set', 'checkProtocolTask', function () {});
ga('require', 'displayfeatures');
ga('send', 'pageview', '/options.html');



let checkedColors = [];
let originTab = '';
let originTimes = '';

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('options-form');
  const status = document.getElementById('status');

  function initOptions() {
    chrome.storage.sync.get(
      ['checkedColors', 'tabFirstShow', 'displayTimes'],
      function (items) {
        if (items.checkedColors) {
          checkedColors = items.checkedColors;
        } else {
          checkedColors = ['font-gray', 'font-brown', 'font-orange', 'font-yellow', 'font-green', 'font-blue', 'font-purple', 'font-pink', 'font-red', 'background-gray', 'background-brown', 'background-orange', 'background-yellow', 'background-green', 'background-blue', 'background-purple', 'background-pink', 'background-red'];
        }
        checkedColors.forEach(function (color) {
          constructOption(color);
        });

        originTab = items.tabFirstShow ? items.tabFirstShow : 'comments';
        document.getElementById(originTab).checked = true;

        originTimes = items.displayTimes ? items.displayTimes : 'once';
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
        checkedColors,
        tabFirstShow: checkedTab,
        displayTimes: checkedTimes,
      },
      function () {
        const checkedFontColors = [];
        const checkedBackgroundColors = [];
        checkedColors.forEach(function (color) {
          if (color.indexOf('font-') !== -1) {
            checkedFontColors.push(color.split('font-')[1]);
          } else {
            checkedBackgroundColors.push(color.split('background-')[1]);
          }
        });
        status.textContent = 'Your options have been saved!';
        // GA
        ga('send', 'event', 'Options', 'Save');
        // ga('send', 'event', 'Options', 'Check', `[Notion+ Mark Manager] [font color] [${checkedFontColors.join()}]`, checkedFontColors.length);
        // ga('send', 'event', 'Options', 'Check', `[Notion+ Mark Manager] [background color] [${checkedBackgroundColors.join()}]`, checkedBackgroundColors.length);
        if (checkedTab !== originTab) {
          ga('send', 'event', 'Options', 'Select', `[Notion+ Mark Manager] [tab first show] [${checkedTab}]`);
        }
        if (checkedTimes !== originTimes) {
          ga('send', 'event', 'Options', 'Select', `[Notion+ Mark Manager] [display times] [${checkedTimes}]`);
        }

        setTimeout(function () {
          status.textContent = '';
        }, 3000);
      }
    );
  });
});