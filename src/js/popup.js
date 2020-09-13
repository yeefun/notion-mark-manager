import menu from './feature/menu.js';
import nav from './store/nav.js';

import {
  getChromeStorage,
  sendMessageToContentscript,
  inProdEnv,
  loadGa,
  sendGaPageview,
  sendGaEvt,
} from './utils/index.js';
import { DEFAULT_TAB_ACTIVATED_FIRST } from './data/default-options.js';

document.addEventListener('DOMContentLoaded', async () => {
  if (/firefox/i.test(navigator.userAgent)) {
    document.body.style.width = 'auto';
  }

  var blocks = document.getElementById('blocks');
  var loadingSpinner = document.getElementById('loading-spinner');
  var prompt = document.getElementById('prompt');
  var emptyBlocks = document.getElementById('empty-blocks');
  var coloredTextsContainer = document.getElementById(
    'colored-texts-container'
  );
  var commentsContainer = document.getElementById('comments-container');
  var blocksContainers = [coloredTextsContainer, commentsContainer];

  var coloredTextsHtml = '';
  var commentsHtml = '';

  setTheme();

  await initNav();
  loadBlocks();

  listenBlockClicked();
  listenNavTabClicked();
  listenScrollToToggleNav();
  listenSupportClick();

  menu.listenTabClicked();
  menu.listenInputsBlockClicked();
  menu.exporter.listenOptionsClicked();
  menu.exporter.listenBtnsClicked();

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

  async function initNav() {
    await setTab();
    activateTab(nav.state.tab);

    async function setTab() {
      var tabActivatedFirst;

      {
        const getTabActivatedFirst = getChromeStorage({
          tabActivatedFirst: DEFAULT_TAB_ACTIVATED_FIRST,
        });

        ({ tabActivatedFirst } = await getTabActivatedFirst());
      }

      nav.setTab(tabActivatedFirst);
    }

    function activateTab(name) {
      document.querySelector(`[data-tab="${name}"]`).classList.add('active');
    }
  }

  function listenBlockClicked() {
    blocks.addEventListener('click', function handleClickBlock(evt) {
      var action = '';

      {
        const block = evt.target.closest('.block');

        if (!block) {
          return;
        }

        {
          let blocks;

          {
            const isColoredText = block.classList.contains('colored-text');
            action = isColoredText
              ? 'scroll to the colored text'
              : 'scroll to the comment';
            blocks = document.querySelectorAll(
              isColoredText ? '.colored-text' : '.comment'
            );
          }

          {
            let scrollToTheBlock;

            {
              const { blockId } = block.dataset;

              scrollToTheBlock = sendMessageToContentscript({
                action,
                blockId,
              });
            }

            scrollToTheBlock();
          }

          focusItem(block, blocks);
        }
      }

      sendGaEvt('marks', 'scroll', action.split('scroll to the ')[1]);
    });
  }

  async function loadBlocks() {
    var hasAnyBlocks = true;

    loading();

    if (nav.state.tab === 'colored-texts') {
      hasAnyBlocks = await loadColoredTexts();

      showBlocksContainer(coloredTextsContainer);
    } else {
      hasAnyBlocks = await loadComments();
      showBlocksContainer(commentsContainer);
    }

    loaded(hasAnyBlocks);
  }

  function listenNavTabClicked() {
    var tabs = document.querySelectorAll('#nav .tab');

    bindClickEvtListeners(tabs, async function handleClickTab() {
      var { tab: currentTab } = this.dataset;

      if (isLoading() || currentTab === nav.state.tab) {
        return;
      }

      {
        let hasAnyBlocks = true;

        loading();

        activateItem(this, tabs);
        nav.setTab(currentTab);

        if (currentTab === 'colored-texts') {
          if (coloredTextsHtml === '') {
            hasAnyBlocks = await loadColoredTexts();
          }
        } else {
          if (commentsHtml === '') {
            hasAnyBlocks = await loadComments();
          }
        }

        showBlocksContainer(
          currentTab === 'colored-texts'
            ? coloredTextsContainer
            : commentsContainer
        );

        menu.changeInputSelectAll();

        loaded(hasAnyBlocks);
      }

      sendGaEvt('tabs', 'click', currentTab);
    });
  }

  var exportedCheckboxHtml = `
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

  async function loadColoredTexts() {
    var response = [];

    {
      const getColoredTexts = sendMessageToContentscript({
        action: 'get colored texts',
      });
      response = (await getColoredTexts()) || [];
    }

    if (response.length === 0) {
      return false;
    }

    coloredTextsHtml = constructColoredTextsHtml(response);
    setHtml(coloredTextsContainer, coloredTextsHtml);

    return true;

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
            ${exportedCheckboxHtml}
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

  async function loadComments() {
    var response = [];

    {
      const getComments = sendMessageToContentscript({
        action: 'get comments',
      });
      response = (await getComments()) || [];
    }

    if (response.length === 0) {
      return false;
    }

    commentsHtml = constructCommentsHtml(response);
    setHtml(commentsContainer, commentsHtml);

    return true;

    function constructCommentsHtml(blocks) {
      return blocks.map(constructCommentHtml).join('');

      function constructCommentHtml({ id, contentHtml }) {
        return `
          <div class="wrapper">
            ${exportedCheckboxHtml}
            <div class="block comment" data-block-id="${id}">${contentHtml}</div>
          </div>
        `;
      }
    }
  }

  function listenScrollToToggleNav() {
    var nav = document.getElementById('nav');
    var beforeScrollY = window.pageYOffset;

    window.addEventListener('scroll', function toggleNav() {
      var currentScrollY = this.pageYOffset;

      {
        const delta = currentScrollY - beforeScrollY;

        if (delta > 0) {
          nav.classList.remove('shown');
        } else {
          nav.classList.add('shown');
        }
      }

      beforeScrollY = currentScrollY;
    });
  }

  function listenSupportClick() {
    var supportInfo = document.getElementById('support-info');

    document
      .getElementById('support')
      .addEventListener('click', function showSupportInfo() {
        supportInfo.classList.add('shown');
      });

    supportInfo.addEventListener('click', function hideSupportInfo(evt) {
      if (evt.target === evt.currentTarget) {
        supportInfo.classList.remove('shown');
      }
    });
  }

  function bindClickEvtListeners(elems, handleClick) {
    elems.forEach(function bindClickEvtListener(elem) {
      elem.addEventListener('click', handleClick);
    });
  }

  function setHtml(elem, html) {
    elem.innerHTML = html;
  }

  function showBlocksContainer(container) {
    removeClassNames('shown', blocksContainers);
    addClassName('shown', container);
  }

  function activateItem(item, items) {
    removeClassNames('active', items);
    addClassName('active', item);
  }

  function focusItem(item, items) {
    removeClassNames('focused', items);
    addClassName('focused', item);
  }

  function removeClassNames(className, elems) {
    elems.forEach((elem) => {
      elem.classList.remove(className);
    });
  }

  function addClassName(className, elem) {
    elem.classList.add(className);
  }

  function loading() {
    loadingSpinner.classList.add('shown');

    prompt.classList.remove('shown');
  }

  function loaded(hasAnyBlocks = true) {
    loadingSpinner.classList.remove('shown');

    if (hasAnyBlocks === true) {
      prompt.classList.remove('shown');
      menu.show();
    } else {
      prompt.classList.add('shown');
      emptyBlocks.textContent =
        nav.state.tab === 'colored-texts' ? 'colored texts' : 'comments';
      menu.hide();
    }
  }

  function isLoading() {
    return loadingSpinner.classList.contains('shown');
  }
});
