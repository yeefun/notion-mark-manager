import menu from './feature/menu.js';
import nav from './store/nav.js';

import { getChromeStorage, sendMessageToContentscript } from './utils/index.js';
import { DEFAULT_TAB_ACTIVATED_FIRST } from './data/default-options.js';

document.addEventListener('DOMContentLoaded', async () => {
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

  localize();
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

  function localize() {
    const uiLang = chrome.i18n.getUILanguage();
    if (uiLang === 'zh-TW' || uiLang === 'zh-CN') {
      addClassName(document.body, 'zh');
    }

    document
      .querySelectorAll('[data-i18n]')
      .forEach(function setLocalizedString(paragraph) {
        setHtml(paragraph, chrome.i18n.getMessage(paragraph.dataset.i18n));
      });
  }

  async function setTheme() {
    var theme;

    {
      const getTheme = getChromeStorage({ theme: 'light' });

      ({ theme } = await getTheme());
    }

    addClassName(document.body, theme);
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
      addClassName(document.querySelector(`[data-tab="${name}"]`), 'active');
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
          removeClassName(nav, 'shown');
        } else {
          addClassName(nav, 'shown');
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
        addClassName(supportInfo, 'shown');
      });

    supportInfo.addEventListener('click', function hideSupportInfo(evt) {
      if (evt.target === evt.currentTarget) {
        removeClassName(supportInfo, 'shown');
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
    removeClassNames(blocksContainers, 'shown');
    addClassName(container, 'shown');
  }

  function activateItem(item, items) {
    removeClassNames(items, 'active');
    addClassName(item, 'active');
  }

  function focusItem(item, items) {
    removeClassNames(items, 'focused');
    addClassName(item, 'focused');
  }

  function removeClassNames(elems, className) {
    elems.forEach((elem) => {
      removeClassName(elem, className);
    });
  }

  function addClassName(elem, className) {
    elem.classList.add(className);
  }

  function removeClassName(elem, className) {
    elem.classList.remove(className);
  }

  function loading() {
    addClassName(loadingSpinner, 'shown');
    removeClassName(prompt, 'shown');
  }

  function loaded(hasAnyBlocks = true) {
    removeClassName(loadingSpinner, 'shown');

    if (hasAnyBlocks === true) {
      removeClassName(prompt, 'shown');
      menu.show();
    } else {
      addClassName(prompt, 'shown');
      emptyBlocks.textContent =
        nav.state.tab === 'colored-texts' ? 'colored texts' : 'comments';
      menu.hide();
    }
  }

  function isLoading() {
    return loadingSpinner.classList.contains('shown');
  }
});
