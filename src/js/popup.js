import {
  inProdEnv,
  removeDuplicate,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';
import DEFAULT_OPTIONS from './data/default-options.js';

document.addEventListener('DOMContentLoaded', () => {
  setTheme();
  loadBlocks();
  listenTabClicked();
  listenScrollToToggleNavbar();

  if (inProdEnv) {
    loadGa();
    sendGaPageview('/popup.html');
  }

  function setTheme() {
    chrome.storage.sync.get(['theme'], function callback({ theme = 'light' }) {
      document.body.classList.add(theme);
    });
  }

  function listenTabClicked() {
    var tabElems = document.querySelectorAll('.tab');

    bindClickEvtListeners(tabElems, handleClickTab);

    function handleClickTab() {
      activateItem(tabElems, this);

      {
        const { tab } = this.dataset;

        if (tab === 'comments') {
          sendMessageToGetComments();
        } else {
          sendMessageToGetColoredTexts();
        }

        // GA: 'comments' 與 'colored texts' tab 各被按幾次？
        sendGaEvent('Tabs', 'Click', `[Notion+ Mark Manager] [${tab}]`);
      }
    }
  }

  function loadBlocks() {
    chrome.storage.sync.get(['tabActivatedFirst'], function callback({
      tabActivatedFirst = DEFAULT_OPTIONS.tabActivatedFirst,
    }) {
      if (tabActivatedFirst == 'colored-texts') {
        sendMessageToGetColoredTexts();
      } else {
        sendMessageToGetComments();
      }

      activateTab(tabActivatedFirst);

      function activateTab(name) {
        document.querySelector(`[data-tab="${name}"]`).classList.add('active');
      }
    });
  }

  function sendMessageToGetColoredTexts() {
    sendMessageToContentscript(
      { action: 'get colored texts' },
      handleGetColoredTextsResponse
    );
  }

  function handleGetColoredTextsResponse(response = []) {
    if (response.length == 0) {
      return;
    }

    {
      const coloredTextsHtml = constructColoredTextsHtml(response);
      setHtmlForBlocksContainer(coloredTextsHtml);
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
            data-block-id="${id}"
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

  function sendMessageToGetComments() {
    sendMessageToContentscript(
      { action: 'get comments' },
      handleGetCommentsResponse
    );
  }

  function handleGetCommentsResponse(response = []) {
    if (response.length == 0) {
      return;
    }

    {
      const commentsHtml = constructCommentsHtml(response);
      setHtmlForBlocksContainer(commentsHtml);
    }

    bindClickEvtListenerToScroll('.comment', handleClickBlock);

    function constructCommentsHtml(blocks) {
      return blocks.map(constructCommentHtml).join('');

      function constructCommentHtml({ id, contentHtml }) {
        return `<div class="block comment" data-block-id="${id}">${contentHtml}</div>`;
      }
    }
  }

  function listenScrollToToggleNavbar() {
    window.addEventListener('scroll', toggleNavbar);

    var navbarElem = document.getElementById('navbar');
    var beforeScrollY = window.pageYOffset;

    function toggleNavbar() {
      const currentScrollY = this.pageYOffset;

      {
        const delta = currentScrollY - beforeScrollY;

        if (delta > 0) {
          navbarElem.classList.remove('show');
        } else {
          navbarElem.classList.add('show');
        }
      }

      beforeScrollY = currentScrollY;
    }
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
      const currentBlock = evt.currentTarget;
      const { blockId } = currentBlock.dataset;

      sendMessageToContentscript({
        action,
        blockId,
      });

      focusItem(blocks, currentBlock);
    }

    // GA: 點擊幾次 'comment' 或 'colored text' 以捲動頁面？
    sendGaEvent(
      'Marks',
      'Scroll To',
      `[Notion+ Mark Manager] [${action.split('scroll to ')[1]}]`
    );
  }

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

  var blocksContainerElem = document.getElementById('blocks-container');
  function setHtmlForBlocksContainer(html) {
    blocksContainerElem.innerHTML = html;
  }

  function activateItem(items, currentItem) {
    removeClassNames('active', items);
    addClassName('active', currentItem);
  }

  function focusItem(items, currentItem) {
    removeClassNames('focused', items);
    addClassName('focused', currentItem);
  }

  function removeClassNames(className, elems) {
    elems.forEach((elem) => {
      elem.classList.remove(className);
    });
  }

  function addClassName(className, elem) {
    elem.classList.add(className);
  }
});
