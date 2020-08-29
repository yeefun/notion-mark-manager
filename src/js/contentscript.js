import { removeDuplicate } from './utils/index.js';
import DEFAULT_OPTIONS from './data/default-options.js';
import {
  COLOR_LIGHT_FONTS,
  COLOR_LIGHT_BACKGROUNDS,
  COLOR_DARK_FONTS,
  COLOR_DARK_BACKGROUNDS,
} from './data/colors.js';

let options = {};
chrome.storage.sync.get(['checkedColors', 'displayTimes'], function (
  userOptions
) {
  options = {
    ...DEFAULT_OPTIONS,
    ...userOptions,
  };

  readyToLoad();
});

function readyToLoad() {
  const notionApp = document.querySelector('.notion-app-inner');
  const isLightTheme = Boolean(document.querySelector('.notion-light-theme'));

  storeCurrentTheme(isLightTheme);

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    switch (message.action) {
      case 'get colored texts': {
        let result = getColoredTexts();
        sendResponse(result);
        break;
      }
      case 'get comments': {
        let result = getComments();
        sendResponse(result);
        break;
      }

      case 'scroll to the colored text':
        scrollToTheColoredText(message.blockId);
        break;
      case 'scroll to the comment':
        scrollToTheComment(message.blockId);
        break;
    }
  });

  function getColoredTexts() {
    var blocks;

    {
      const coloredFonts = isLightTheme ? COLOR_LIGHT_FONTS : COLOR_DARK_FONTS;
      const coloredBackgrounds = isLightTheme
        ? COLOR_LIGHT_BACKGROUNDS
        : COLOR_DARK_BACKGROUNDS;

      const allColors = [...coloredFonts, ...coloredBackgrounds];

      const shouldDisplayOnce = options.displayTimes == 'once';

      if (shouldDisplayOnce) {
        blocks = allColors
          .filter(isCheckedColor)
          .map(getColoredTextElem)
          .flatMap(constructBlock)
          .filter(removeFalsy)
          .reduce(moveBlockHavingDivWrapperForward, [])
          .filter(removeDuplicateBlock);
      } else {
        blocks = allColors
          .filter(isCheckedColor)
          .map(getColoredTextElem)
          .flatMap(constructBlock)
          .filter(removeFalsy);

        blocks.forEach(modifyWrapperNodeNameAndColorName);
      }
    }

    return blocks;

    function isCheckedColor(color) {
      return options.checkedColors.includes(color.name);
    }

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
      return block.wrapperNodeName == 'DIV' ? [block, ...acc] : [...acc, block];
    }

    function removeDuplicateBlock({ id }, idx, blocks) {
      return blocks.findIndex(doesIdEqual) === idx;

      function doesIdEqual({ id: otherId }) {
        return id === otherId;
      }
    }

    function modifyWrapperNodeNameAndColorName(block, idx, blocks) {
      if (block.wrapperNodeName == 'DIV') {
        return;
      }

      {
        const blockHavingEqualWrapper = blocks
          .filter(hasDivWrapper)
          .find(doesIdEqual);

        if (blockHavingEqualWrapper == undefined) {
          return;
        }

        block.wrapperNodeName = 'DIV';
        block.colorName = blockHavingEqualWrapper.colorName;
      }

      function doesIdEqual(blockHavingDivWrapper) {
        return block.id == blockHavingDivWrapper.id;
      }
    }

    function hasDivWrapper(block) {
      return block.wrapperNodeName == 'DIV';
    }
  }

  function getComments() {
    var blocks;

    {
      const commentIconElems = document.querySelectorAll('.speechBubble');

      if (commentIconElems.length == 0) {
        return [];
      }

      blocks = Array.from(commentIconElems)
        .map(getBlockElem)
        .filter(removeDuplicate)
        .map(constructBlock)
        .filter(removeFalsy);
    }

    return blocks;

    function getBlockElem(elem) {
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
      let blockElem = getBlockElem(blockId);

      intersectionObserver = new IntersectionObserver(handleObserve);

      intersectionObserver.observe(blockElem);

      blockElem.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    function handleObserve(entries) {
      var blockElem;

      {
        let isIntersecting;

        {
          let [entry] = entries;

          ({ target: blockElem, isIntersecting } = entry);
        }

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

  function getBlockElem(id) {
    return document.querySelector(`[data-block-id="${id}"]`);
  }

  function removeFalsy(value) {
    return value;
  }

  const mutationObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'class') {
        const isLightTheme = Boolean(
          mutation.target.classList.contains('notion-light-theme')
        );

        storeCurrentTheme(isLightTheme);
      }
    });
  });
  mutationObserver.observe(notionApp, {
    attributes: true,
  });
}

function storeCurrentTheme(isLightTheme) {
  chrome.storage.sync.set({ theme: isLightTheme ? 'light' : 'dark' });
}
