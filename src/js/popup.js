import {
  inProdEnv,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';

if (inProdEnv) {
  loadGa();
  sendGaPageview('/popup.html');
}

const container = document.getElementById('container');
const navs = document.querySelectorAll('.nav-item');

chrome.storage.sync.get(['theme'], setTheme);

function setTheme(result) {
  document.body.classList.add(result.theme);
}

bindClickEvtListeners(navs, handleClickNavs);

function handleClickNavs() {
  removeAllActiveClass(navs);
  addActiveClass(this);

  const tabName = this.dataset.tab;
  if (tabName === 'comments') {
    loadComments();
  } else {
    loadColoredTexts();
  }
  // GA: 'comments' 與 'colored texts' tab 各被按幾次？
  sendGaEvent('Tabs', 'Click', `[Notion+ Mark Manager] [${tabName}]`);
}

function loadComments() {
  sendMessageToContentscript({ action: 'get comments' }, handleResponse);

  function handleResponse(response) {
    const commentsHtml = constructCommentsHtml(response);
    setHtml(container, commentsHtml);

    bindClickEventToScrollTo('.comment');
  }
}

function constructCommentsHtml(contentHtmls) {
  return contentHtmls.map(constructCommentHtml).join('');

  function constructCommentHtml({ id, html }) {
    return `<div class="block comment" data-id="${id}">${html}</div>`;
  }
}

function setHtml(elem, html) {
  elem.innerHTML = html;
}

function loadColoredTexts() {
  sendMessageToContentscript(
    {
      action: 'get colored texts',
    },
    function (response) {
      const coloredTextObj = response;
      let result = '';
      let colorNames = [];
      for (let colorTextID in coloredTextObj) {
        const coloredTextHTML = coloredTextObj[colorTextID].coloredTextHTML;
        const nodeName = coloredTextObj[colorTextID].nodeName;
        const colorName = coloredTextObj[colorTextID].colorName;
        colorNames.push(colorName);
        result += `<div class="block colored-text ${
          nodeName === 'DIV' ? colorName : ''
        }" data-id="${colorTextID}">${coloredTextHTML}</div>`;
      }
      container.innerHTML = result;
      bindClickEventToScrollTo('.colored-text');

      const loadedFontColors = [];
      const loadedBackgroundColors = [];
      colorNames.forEach(function (color, idx, arr) {
        if (arr.indexOf(color) === idx) {
          if (color.indexOf('font-') !== -1) {
            loadedFontColors.push(color.split('font-')[1]);
          } else {
            loadedBackgroundColors.push(color.split('background-')[1]);
          }
        }
      });

      // GA: 有哪些顏色文字（font）被載入？
      sendGaEvent(
        'Marks',
        'Load',
        `[Notion+ Mark Manager] [font color] [${loadedFontColors.join()}]`,
        loadedFontColors.length
      );
      // GA: 有哪些顏色文字（background）被載入？
      sendGaEvent(
        'Marks',
        'Load',
        `[Notion+ Mark Manager] [background color] [${loadedBackgroundColors.join()}]`,
        loadedBackgroundColors.length
      );
    }
  );
}

function bindClickEventToScrollTo(selectors) {
  const marks = document.querySelectorAll(selectors);
  const action =
    selectors === '.comment' ? 'scroll to comment' : 'scroll to colored text';

  bindClickEvtListeners(marks, function () {
    const blockID = this.dataset.id;
    sendMessageToContentscript({
      action,
      id: blockID,
    });

    removeAllActiveClass(marks);
    addActiveClass(this);

    // GA: 點擊幾次 'comment' 或 'colored text' 以捲動頁面？
    sendGaEvent(
      'Marks',
      'Scroll To',
      `[Notion+ Mark Manager] [${action.split('scroll to ')[1]}]`
    );
  });
}

chrome.storage.sync.get(['tabFirstShow'], function (items) {
  const tabFirstShowName = items.tabFirstShow || 'colored-texts';
  if (tabFirstShowName === 'colored-texts') {
    loadColoredTexts();
    document
      .querySelector('[data-tab="colored texts"]')
      .classList.add('active');
  } else {
    loadComments();
    document.querySelector('[data-tab="comments"]').classList.add('active');
  }
});

const navbar = document.getElementById('navbar');
let beforeScrollY = window.scrollY;
window.addEventListener('scroll', function () {
  const currentScrollY = this.scrollY;
  const scrollDelta = currentScrollY - beforeScrollY;
  if (scrollDelta > 0) {
    navbar.classList.remove('show');
  } else {
    navbar.classList.add('show');
  }
  beforeScrollY = currentScrollY;
});

function sendMessageToContentscript(message, handleResponse) {
  chrome.tabs.query({ active: true, currentWindow: true }, handleQueriedTabs);

  function handleQueriedTabs(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message, handleResponse);
  }
}

function bindClickEvtListeners(elems, handleClick) {
  elems.forEach(bindClickEvtListener);

  function bindClickEvtListener(elem) {
    elem.addEventListener('click', handleClick);
  }
}

function removeAllActiveClass(elems) {
  elems.forEach((elem) => {
    elem.classList.remove('active');
  });
}

function addActiveClass(elem) {
  elem.classList.add('active');
}
