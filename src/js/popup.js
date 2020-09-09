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
  var blocks = document.getElementById('blocks');
  var coloredTextsContainer = document.getElementById(
    'colored-texts-container'
  );
  var commentsContainer = document.getElementById('comments-container');
  var blocksContainers = [coloredTextsContainer, commentsContainer];

  var isLoadingBlocks = false;

  var coloredTextsHtml = '';
  var commentsHtml = '';

  setTheme();

  await initNav();
  loadBlocks();

  listenBlockClicked();
  listenNavTabClicked();
  listenScrollToToggleNav();

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
      if (!evt.target.classList.contains('block')) {
        return;
      }

      var action = '';

      {
        const block = evt.target;
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

      sendGaEvt('marks', 'scroll', action.split('scroll to the ')[1]);
    });
  }

  async function loadBlocks() {
    isLoadingBlocks = true;

    if (nav.state.tab === 'colored-texts') {
      await loadColoredTexts();
      showBlocksContainer(coloredTextsContainer);
    } else {
      await loadComments();
      showBlocksContainer(commentsContainer);
    }

    isLoadingBlocks = false;
  }

  function listenNavTabClicked() {
    var tabs = document.querySelectorAll('#nav .tab');

    bindClickEvtListeners(tabs, async function handleClickTab() {
      if (isLoadingBlocks || this.dataset.tab === nav.state.tab) {
        return;
      }

      activateItem(this, tabs);
      nav.setTab(this.dataset.tab);

      if (coloredTextsHtml === '') {
        await loadColoredTexts();
      } else if (commentsHtml === '') {
        await loadComments();
      }

      showBlocksContainer(
        nav.state.tab === 'colored-texts'
          ? coloredTextsContainer
          : commentsContainer
      );

      menu.changeInputSelectAll();

      sendGaEvt('tabs', 'click', nav.state.tab);
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
      response = await getColoredTexts();
    }

    if (response.length == 0) {
      return;
    }

    coloredTextsHtml = constructColoredTextsHtml(response);
    setHtml(coloredTextsContainer, coloredTextsHtml);

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
      response = await getComments();
    }

    if (response.length == 0) {
      return;
    }

    commentsHtml = constructCommentsHtml(response);
    setHtml(commentsContainer, commentsHtml);

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
    var beforeScrollTop = blocks.scrollTop;

    blocks.addEventListener('scroll', function toggleNav() {
      var currentScrollTop = this.scrollTop;

      {
        const delta = currentScrollTop - beforeScrollTop;

        if (delta > 0) {
          nav.classList.remove('shown');
        } else {
          nav.classList.add('shown');
        }
      }

      beforeScrollTop = currentScrollTop;
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
});
