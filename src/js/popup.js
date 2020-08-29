import {
  inProdEnv,
  removeDuplicate,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';

if (inProdEnv) {
  loadGa();
  sendGaPageview('/popup.html');
}

const containerElem = document.getElementById('container');
const navElems = document.querySelectorAll('.nav-item');

chrome.storage.sync.get(['theme'], setTheme);

function setTheme(result) {
  document.body.classList.add(result.theme);
}

bindClickEvtListeners(navElems, handleClickNavs);

function handleClickNavs() {
  removeAllFocusedClass(navElems);
  addFocusedClass(this);

  const tabName = this.dataset.tab;
  if (tabName === 'comments') {
    loadComments();
  } else {
    loadColoredTexts();
  }

  // GA: 'comments' 與 'colored texts' tab 各被按幾次？
  sendGaEvent('Tabs', 'Click', `[Notion+ Mark Manager] [${tabName}]`);
}

function loadColoredTexts() {
  sendMessageToContentscript({ action: 'get colored texts' }, handleResponse);

  function handleResponse(response = []) {
    if (response.length == 0) {
      return;
    }

    {
      const coloredTextsHtml = constructColoredTextsHtml(response);
      setHtml(containerElem, coloredTextsHtml);
    }

    bindClickEvtListenerToScroll('.colored-text', handleClickBlock);

    {
      const [loadedFontColors, loadedBackgroundColors] = response
        .map(extractColorName)
        .filter(removeDuplicate)
        .reduce(classifyColor, [[], []]);

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

    function constructColoredTextsHtml(blocks) {
      return blocks.map(constructColoredTextHtml).join('');

      function constructColoredTextHtml({
        id,
        wrapperNodeName,
        colorName,
        contentHtml,
      }) {
        var hasDivWrapper = wrapperNodeName === 'DIV';

        return `
          <div
            class="block colored-text ${hasDivWrapper ? colorName : ''}"
            data-id="${id}"
          >
            ${contentHtml}
          </div>
        `;
      }
    }

    function extractColorName(block) {
      return block.colorName;
    }

    function classifyColor([fontNames, backgroundNames], colorName) {
      var [, currentName] = colorName.split('-');

      if (colorName.includes('font')) {
        return [[...fontNames, currentName], backgroundNames];
      } else {
        return [fontNames, [...backgroundNames, currentName]];
      }
    }
  }
}

function loadComments() {
  sendMessageToContentscript({ action: 'get comments' }, handleResponse);

  function handleResponse(response = []) {
    if (response.length == 0) {
      return;
    }

    {
      const commentsHtml = constructCommentsHtml(response);
      setHtml(containerElem, commentsHtml);
    }

    bindClickEvtListenerToScroll('.comment', handleClickBlock);
  }

  function constructCommentsHtml(blocks) {
    return blocks.map(constructCommentHtml).join('');

    function constructCommentHtml({ id, contentHtml }) {
      return `<div class="block comment" data-id="${id}">${contentHtml}</div>`;
    }
  }
}

function setHtml(elem, html) {
  elem.innerHTML = html;
}

function bindClickEvtListenerToScroll(selectors, callback) {
  var blockElems = document.querySelectorAll(selectors);
  var action =
    selectors === '.colored-text'
      ? 'scroll to the colored text'
      : 'scroll to the comment';

  bindClickEvtListeners(blockElems, (evt) => {
    callback(evt, action, blockElems);
  });
}

function handleClickBlock(evt, action, blocks) {
  {
    let currentBlock = evt.currentTarget;
    let { id: blockId } = currentBlock.dataset;

    sendMessageToContentscript({
      action,
      blockId,
    });

    focusBlock(blocks, currentBlock);
  }

  // GA: 點擊幾次 'comment' 或 'colored text' 以捲動頁面？
  sendGaEvent(
    'Marks',
    'Scroll To',
    `[Notion+ Mark Manager] [${action.split('scroll to ')[1]}]`
  );
}

function focusBlock(blocks, currentBlock) {
  removeAllFocusedClass(blocks);
  addFocusedClass(currentBlock);
}

chrome.storage.sync.get(['tabFirstShow'], function (items) {
  const tabFirstShowName = items.tabFirstShow || 'colored-texts';
  if (tabFirstShowName === 'colored-texts') {
    loadColoredTexts();
    document
      .querySelector('[data-tab="colored texts"]')
      .classList.add('focused');
  } else {
    loadComments();
    document.querySelector('[data-tab="comments"]').classList.add('focused');
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

function removeAllFocusedClass(elems) {
  elems.forEach((elem) => {
    elem.classList.remove('focused');
  });
}

function addFocusedClass(elem) {
  elem.classList.add('focused');
}
