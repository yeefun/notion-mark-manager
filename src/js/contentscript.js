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

  // function getColoredTexts() {
  //   const coloredFonts = isLightTheme ? COLOR_LIGHT_FONTS : COLOR_DARK_FONTS;
  //   const coloredBackgrounds = isLightTheme
  //     ? COLOR_LIGHT_BACKGROUNDS
  //     : COLOR_DARK_BACKGROUNDS;

  //   let results = {};

  //   coloredFonts.filter(isCheckedColor).forEach(function (color) {
  //     getColoredText(color.value, color.name, results);
  //   });

  //   coloredBackgrounds.filter(isCheckedColor).forEach(function (color) {
  //     getColoredText(color.value, color.name, results);
  //   });

  //   if (options.displayTimes === 'once') {
  //     for (let coloredTextID in repeatedColoredTexts) {
  //       const repeatedColoredText = repeatedColoredTexts[coloredTextID];
  //       delete results[coloredTextID];
  //       const result = (results[coloredTextID] = {});
  //       result.nodeName = repeatedColoredText.nodeName;
  //       result.colorName = repeatedColoredText.colorName;
  //       result.coloredTextHTML = repeatedColoredText.coloredTextHTML;
  //     }
  //   }

  //   repeatedColoredTexts = {};

  //   return results;

  //   function isCheckedColor(color) {
  //     return options.checkedColors.includes(color.name);
  //   }
  // }

  // let repeatedColoredTexts = {};

  // function getColoredText(value, className, results) {
  //   const coloredTextElems = document.querySelectorAll(
  //     `[style*="${value}"], [style*="${value.replace(/, /g, ',')}"]`
  //   );

  //   if (!coloredTextElems.length) {
  //     return;
  //   }

  //   const blocksContent = Array.from(coloredTextElems)
  //     .map(constructBlock)
  //     .filter(removeFalsy)
  //     .filter(removeDuplicateId);

  //   blocksContent.forEach(
  //     (
  //       {
  //         id: blockId,
  //         coloredTextNodeName: nodeName,
  //         contentHtml: coloredTextHTML,
  //       },
  //       idx
  //     ) => {
  //       if (!results[blockId]) {
  //         const result = (results[blockId] = {});

  //         result.nodeName = nodeName;
  //         result.colorName = className;
  //         result.coloredTextHTML = coloredTextHTML;
  //         return;
  //       }

  //       options.displayTimes === 'once' ? displayOnce() : displayMoreTimes();

  //       function displayOnce() {
  //         if (results[blockId].nodeName !== 'DIV') {
  //           results[blockId] = {};

  //           if (nodeName === 'DIV') {
  //             let repeatedColoredText = repeatedColoredTexts[blockId];

  //             if (!repeatedColoredText) {
  //               repeatedColoredText = {};
  //               repeatedColoredText.coloredTextHTML = coloredTextHTML;
  //             }

  //             repeatedColoredText.nodeName = nodeName;
  //             repeatedColoredText.colorName = className;
  //           }

  //           if (!repeatedColoredTexts[blockId]) {
  //             const repeatedColoredText = (repeatedColoredTexts[blockId] = {});

  //             repeatedColoredText.coloredTextHTML = coloredTextHTML;
  //             repeatedColoredText.nodeName = nodeName;
  //             repeatedColoredText.colorName = className;
  //           }
  //         } else {
  //           let result = results[blockId];
  //           var repeatedColoredText = repeatedColoredTexts[blockId];

  //           if (!repeatedColoredText) {
  //             repeatedColoredText = {};
  //             repeatedColoredText.coloredTextHTML = coloredTextHTML;
  //           }

  //           repeatedColoredText.nodeName = result.nodeName;
  //           repeatedColoredText.colorName = result.className;

  //           result = {};
  //         }
  //       }

  //       function displayMoreTimes() {
  //         if (!repeatedColoredTexts[blockId]) {
  //           repeatedColoredTexts[blockId] = [];
  //         }

  //         const repeatedColoredTextIDs = repeatedColoredTexts[blockId];
  //         const prefixID = `${blockId}{{${className}-${idx}}}`;
  //         const prefixResult = (results[prefixID] = {});

  //         if (results[blockId].nodeName !== 'DIV') {
  //           if (nodeName === 'DIV') {
  //             let result = results[blockId];

  //             result.nodeName = nodeName;
  //             result.colorName = className;
  //             repeatedColoredTextIDs.forEach(function (coloredTextID) {
  //               const result = (results[coloredTextID] = {});

  //               result.nodeName = nodeName;
  //               result.colorName = className;
  //             });
  //           }

  //           repeatedColoredTextIDs.push(prefixID);

  //           prefixResult.nodeName = nodeName;
  //           prefixResult.colorName = className;
  //         } else {
  //           prefixResult.nodeName = results[blockId].nodeName;
  //           prefixResult.colorName = results[blockId].colorName;
  //         }

  //         prefixResult.coloredTextHTML = coloredTextHTML;
  //       }
  //     }
  //   );

  //   function constructBlock(coloredTextElem) {
  //     const { nodeName: coloredTextNodeName } = coloredTextElem;
  //     const blockElem = coloredTextElem.closest('[data-block-id]');
  //     const { blockId: id } = blockElem.dataset;
  //     const contentElem = blockElem.querySelector('[contenteditable]');

  //     if (!contentElem) {
  //       return undefined;
  //     }

  //     const { innerHTML: contentHtml } = contentElem;

  //     return {
  //       id,
  //       coloredTextNodeName,
  //       contentHtml,
  //     };
  //   }

  //   function removeDuplicateId({ id }, idx, blocks) {
  //     return blocks.findIndex(doesIdEqual) === idx;

  //     function doesIdEqual({ id: otherId }) {
  //       return id === otherId;
  //     }
  //   }
  // }

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

      case 'scroll to comment':
        scrollToComment(message.id);
        break;
      case 'scroll to colored text':
        scrollToColoredText(message.id);
        break;
    }
  });

  function getColoredTexts() {
    const coloredFonts = isLightTheme ? COLOR_LIGHT_FONTS : COLOR_DARK_FONTS;
    const coloredBackgrounds = isLightTheme
      ? COLOR_LIGHT_BACKGROUNDS
      : COLOR_DARK_BACKGROUNDS;

    const allColors = [...coloredFonts, ...coloredBackgrounds];

    const shouldDisplayOnce = options.displayTimes == 'once';

    var blocks;

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
        const { nodeName: wrapperNodeName } = coloredTextElem;
        const blockElem = coloredTextElem.closest('[data-block-id]');
        const { blockId: id } = blockElem.dataset;
        const contentElem = blockElem.querySelector('[contenteditable]');

        if (!contentElem) {
          return undefined;
        }

        const { innerHTML: contentHtml } = contentElem;

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

      const blockHavingEqualWrapper = blocks
        .filter(hasDivWrapper)
        .find(doesIdEqual);

      if (blockHavingEqualWrapper == undefined) {
        return;
      }

      block.wrapperNodeName = 'DIV';
      block.colorName = blockHavingEqualWrapper.colorName;

      function doesIdEqual(blockHavingDivWrapper) {
        return block.id == blockHavingDivWrapper.id;
      }
    }

    function hasDivWrapper(block) {
      return block.wrapperNodeName == 'DIV';
    }
  }

  function getComments() {
    const commentIconElems = document.querySelectorAll('.speechBubble');

    if (commentIconElems.length == 0) {
      return [];
    }

    const blocks = Array.from(commentIconElems)
      .map(getBlockElem)
      .filter(removeDuplicate)
      .map(constructBlock)
      .filter(removeFalsy);

    return blocks;

    function getBlockElem(elem) {
      return elem.closest('[data-block-id]');
    }

    function constructBlock(blockElem) {
      const contentElem = blockElem.querySelector('[contenteditable]');
      const { blockId: id } = blockElem.dataset;

      if (!contentElem) {
        return undefined;
      }

      const { innerHTML: contentHtml } = contentElem;

      return {
        id,
        contentHtml,
      };
    }
  }

  function scrollToComment(blockId) {
    document.body.click();
    const commentedBlock = document.querySelector(
      `[data-block-id="${blockId}"]`
    );
    const intersectionObserver = new IntersectionObserver(function (entries) {
      const entry = entries[0];
      const target = entry.target;
      if (entry.isIntersecting) {
        setTimeout(function () {
          const spanEls = commentedBlock.getElementsByTagName('SPAN');
          const commentedSpan = Array.prototype.find.call(spanEls, function (
            spanEl
          ) {
            return (
              spanEl.style['border-bottom'] === '2px solid rgb(255, 212, 0)'
            );
          });
          if (commentedSpan) {
            commentedSpan.click();
          }
        }, 80);
        intersectionObserver.unobserve(target);
      }
    });
    intersectionObserver.observe(commentedBlock);
    commentedBlock.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function scrollToColoredText(blockId) {
    const blockIDRemovePrefix = blockId.replace(/\{\{.*\}\}/, '');
    document.body.click();
    const coloredTextBlock = document.querySelector(
      `[data-block-id="${blockIDRemovePrefix}"]`
    );
    coloredTextBlock.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
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
