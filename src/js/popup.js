import {
  inProdEnv,
  getChromeStorage,
  loadGa,
  sendGaPageview,
  sendGaEvent,
} from './utils/index.js';
import { DEFAULT_TAB_ACTIVATED_FIRST } from './data/default-options.js';

document.addEventListener('DOMContentLoaded', () => {
  setTheme();
  loadBlocks();
  listenTabClicked();
  listenScrollToToggleNavbar();

  if (inProdEnv) {
    loadGa();
    sendGaPageview('/popup.html');
  }

  async function setTheme() {
    var theme;

    {
      const getTheme = getChromeStorage({ theme: 'light' });
      ({ theme } = await getTheme());
    }

    document.body.classList.add(theme);
  }

  function listenTabClicked() {
    var tabElems = document.querySelectorAll('.tab');

    bindClickEvtListeners(tabElems, handleClickTab);

    function handleClickTab() {
      activateItem(tabElems, this);

      var { tab } = this.dataset;

      if (tab == 'colored-texts') {
        sendMessageToGetColoredTexts();
      } else {
        sendMessageToGetComments();
      }

      // GA: 'comments' 與 'colored texts' tab 各被按幾次？
      sendGaEvent('Tabs', 'Click', `[Notion+ Mark Manager] [${tab}]`);
    }
  }

  async function loadBlocks() {
    var tab;

    {
      const getTabActivated = getChromeStorage({
        tabActivatedFirst: DEFAULT_TAB_ACTIVATED_FIRST,
      });

      ({ tabActivatedFirst: tab } = await getTabActivated());
    }

    if (tab == 'colored-texts') {
      sendMessageToGetColoredTexts();
    } else {
      sendMessageToGetComments();
    }

    activateTab(tab);

    function activateTab(name) {
      document.querySelector(`[data-tab="${name}"]`).classList.add('active');
    }
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
      `[Notion+ Mark Manager] [${action.split('scroll to the ')[1]}]`
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
