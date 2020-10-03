import {
  getChromeStorage,
  setChromeStorage,
  removeFalsy,
} from './utils/index.js';
import {
  DEFAULT_COLOR_NAMES,
  DEFAULT_DISPLAYED_TIMES,
} from './data/default-options.js';
import COLORS from './data/colors.js';

(async function init() {
  var notionAppInner = undefined;

  await (function resolveWhenNotionAppInnerExist() {
    return new Promise((resolve) => {
      var intervalId = setInterval(function detectExistNotionAppInner() {
        notionAppInner = document.querySelector('.notion-app-inner');

        if (notionAppInner) {
          resolve(undefined);
          clearInterval(intervalId);
        }
      }, 16);
    });
  })();

  var theme = notionAppInner.classList.contains('notion-light-theme')
    ? 'light'
    : 'dark';

  {
    const getUserOptions = getChromeStorage({
      colorNames: DEFAULT_COLOR_NAMES,
      displayedTimes: DEFAULT_DISPLAYED_TIMES,
    });
    const userOptions = await getUserOptions();

    setUpMessageListener(userOptions);
  }

  storeCurrentTheme(theme);

  listenThemeChanged();

  function setUpMessageListener(options) {
    chrome.runtime.onMessage.addListener(handleMessage);

    var shouldDisplayOnce = options.displayedTimes === 'once';

    function handleMessage(message, sender, sendResponse) {
      switch (message.action) {
        case 'get colored texts': {
          const themeColors = getThemeColors(theme);
          const checkedColors = getCheckedColors(
            themeColors,
            options.colorNames
          );

          sendResponse(getColoredTexts(checkedColors, shouldDisplayOnce));
          break;
        }
        case 'get comments':
          sendResponse(getComments());
          break;

        case 'scroll to the colored text':
          scrollToTheColoredText(message.blockId);
          break;
        case 'scroll to the comment':
          scrollToTheComment(message.blockId);
          break;
      }

      function getThemeColors(theme) {
        var coloredFonts = COLORS[theme].fonts;
        var coloredBackgrounds = COLORS[theme].backgrounds;

        return [...coloredFonts, ...coloredBackgrounds];
      }

      function getCheckedColors(themeColors, colorNames) {
        return themeColors.filter(isCheckedColor);

        function isCheckedColor(color) {
          return colorNames.includes(color.name);
        }
      }
    }
  }

  function storeCurrentTheme(theme) {
    setChromeStorage({ theme });
  }

  function listenThemeChanged() {
    var mutationObserver = new MutationObserver(handleMutate);

    mutationObserver.observe(notionAppInner, {
      attributes: true,
    });

    function handleMutate(mutations) {
      mutations.forEach(({ attributeName, target }) => {
        if (attributeName != 'class') {
          return;
        }

        theme = target.classList.contains('notion-light-theme')
          ? 'light'
          : 'dark';

        storeCurrentTheme(theme);
      });
    }
  }

  function getColoredTexts(checkedColors, shouldDisplayOnce) {
    var blocks;

    {
      if (shouldDisplayOnce) {
        blocks = checkedColors
          .map(getColoredTextElem)
          .flatMap(constructBlock)
          .filter(removeFalsy)
          .reduce(moveBlockHavingDivWrapperForward, [])
          .filter(removeDuplicateBlock);
      } else {
        blocks = checkedColors
          .map(getColoredTextElem)
          .flatMap(constructBlock)
          .filter(removeFalsy);

        blocks.forEach(modifyWrapperNodeNameAndColorName);
      }
    }

    return blocks;

    function getColoredTextElem(color) {
      return [
        Array.from(
          document.querySelectorAll(`
            [data-block-id] [style*="${color.value}"],
            [data-block-id] [style*="${color.value.replace(/, /g, ',')}"]
          `)
        ),
        color.name,
      ];
    }

    function constructBlock([coloredTextElems, colorName]) {
      return coloredTextElems.map((coloredTextElem) => {
        var id;
        var { nodeName: wrapperNodeName } = coloredTextElem;
        var contentHtml;

        {
          const blockElem = coloredTextElem.closest('[data-block-id]');
          ({ blockId: id } = blockElem.dataset);
          const contentElem = blockElem.querySelector('[contenteditable]');

          if (!contentElem) {
            return undefined;
          }

          ({ innerHTML: contentHtml } = contentElem);
        }

        return {
          id,
          wrapperNodeName,
          colorName,
          contentHtml,
        };
      });
    }

    function moveBlockHavingDivWrapperForward(acc, block) {
      return block.wrapperNodeName === 'DIV'
        ? [block, ...acc]
        : [...acc, block];
    }

    function removeDuplicateBlock({ id }, idx, blocks) {
      return blocks.findIndex(doesIdEqual) === idx;

      function doesIdEqual({ id: otherId }) {
        return id === otherId;
      }
    }

    function modifyWrapperNodeNameAndColorName(block, idx, blocks) {
      if (block.wrapperNodeName === 'DIV') {
        return;
      }

      {
        const blockHavingEqualWrapper = blocks
          .filter(hasDivWrapper)
          .find(doesIdEqual);

        if (blockHavingEqualWrapper === undefined) {
          return;
        }

        block.wrapperNodeName = 'DIV';
        block.colorName = blockHavingEqualWrapper.colorName;
      }

      function doesIdEqual(blockHavingDivWrapper) {
        return block.id === blockHavingDivWrapper.id;
      }
    }

    function hasDivWrapper(block) {
      return block.wrapperNodeName === 'DIV';
    }
  }

  function getComments() {
    var blocks;

    {
      const commentIconElems = document.querySelectorAll('.speechBubble');

      if (commentIconElems.length === 0) {
        return [];
      }

      blocks = Array.from(commentIconElems)
        .map(getClosestBlockElem)
        .filter(removeDuplicate)
        .map(constructBlock)
        .filter(removeFalsy);
    }

    return blocks;

    function getClosestBlockElem(elem) {
      return elem.closest('[data-block-id]');
    }

    function constructBlock(blockElem) {
      var id;
      var contentHtml;

      {
        const contentElem = blockElem.querySelector('[contenteditable]');
        ({ blockId: id } = blockElem.dataset);

        if (!contentElem) {
          return undefined;
        }

        ({ innerHTML: contentHtml } = contentElem);
      }

      return {
        id,
        contentHtml,
      };
    }
  }

  function scrollToTheColoredText(blockId) {
    document.body.click();

    getBlockElem(blockId).scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function scrollToTheComment(blockId) {
    var intersectionObserver;

    document.body.click();

    {
      const blockElem = getBlockElem(blockId);

      intersectionObserver = new IntersectionObserver(handleIntersect);

      intersectionObserver.observe(blockElem);

      blockElem.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    function handleIntersect([entry]) {
      var blockElem;

      {
        let isIntersecting;

        ({ target: blockElem, isIntersecting } = entry);

        if (!isIntersecting) {
          return;
        }
      }

      setTimeout(openComment, 90);

      intersectionObserver.unobserve(blockElem);

      function openComment() {
        var commentUnderlinerElem = blockElem.querySelector(
          '[style*="rgb(255, 212, 0)"], [style*="rgb(255,212,0)"]'
        );

        if (commentUnderlinerElem) {
          commentUnderlinerElem.click();
        }
      }
    }
  }

  function removeDuplicate(item, idx, arr) {
    return arr.indexOf(item) === idx;
  }

  function getBlockElem(id) {
    return document.querySelector(`[data-block-id="${id}"]`);
  }
})();
