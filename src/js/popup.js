import {
  inProdEnv,
  getChromeStorage,
  loadGa,
  sendGaPageview,
  sendGaEvt,
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

      sendGaEvt('tabs', 'click', tab);
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

  const exportCheckboxHtml = `
    <label>
      <input type="checkbox" />
      <div>
        <div class="checkbox">
          <svg class="checked-icon" viewBox="0 0 14 14">
            <polygon points="5.5 11.9993304 14 3.49933039 12.5 2 5.5 8.99933039 1.5 4.9968652 0 6.49933039"></polygon>
          </svg>
          <svg class="unchecked-icon" viewBox="0 0 16 16">
            <path d="M1.5,1.5 L1.5,14.5 L14.5,14.5 L14.5,1.5 L1.5,1.5 Z M0,0 L16,0 L16,16 L0,16 L0,0 Z"></path>
          </svg>
        </div>
      </div>
    </label>
  `;

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
          <div class="wrapper">
            ${exportCheckboxHtml}
            <div
              class="block colored-text ${hasDivWrapper ? colorName : ''}"
              data-block-id="${id}"
            >
              ${contentHtml}
            </div>
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
        return `
          <div class="wrapper">
            ${exportCheckboxHtml}
            <div class="block comment" data-block-id="${id}">${contentHtml}</div>
          </div>
        `;
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
          navbarElem.classList.remove('shown');
        } else {
          navbarElem.classList.add('shown');
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

    sendGaEvt('marks', 'scroll', action.split('scroll to the ')[1]);
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
