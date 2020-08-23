import DEFAULT_OPTIONS from './data/default-options.js';

import {
  COLORS_LIGHT_FONTS,
  COLORS_LIGHT_BACKGROUNDS,
  COLORS_DARK_FONTS,
  COLORS_DARK_BACKGROUNDS,
} from './data/colors.js';

function readyToLoad() {
  const bodyEl = document.body;
  const notionApp = document.querySelector('.notion-app-inner');
  const isLightTheme = Boolean(document.querySelector('.notion-light-theme'));

  storeCurrentTheme(isLightTheme);

  function getColoredTexts() {
    const fontColors = isLightTheme ? COLORS_LIGHT_FONTS : COLORS_DARK_FONTS;
    const backgroundColors = isLightTheme
      ? COLORS_LIGHT_BACKGROUNDS
      : COLORS_DARK_BACKGROUNDS;
    let results = {};
    fontColors.forEach(function (color) {
      if (options.checkedColors.indexOf(color.name) !== -1) {
        getColoredText(color.value, color.name, results);
      }
    });
    backgroundColors.forEach(function (color) {
      if (options.checkedColors.indexOf(color.name) !== -1) {
        getColoredText(color.value, color.name, results);
      }
    });
    if (options.displayTimes === 'once') {
      for (let coloredTextID in repeatedColoredTexts) {
        const repeatedColoredText = repeatedColoredTexts[coloredTextID];
        delete results[coloredTextID];
        const result = (results[coloredTextID] = {});
        result.nodeName = repeatedColoredText.nodeName;
        result.colorName = repeatedColoredText.colorName;
        result.coloredTextHTML = repeatedColoredText.coloredTextHTML;
      }
    }
    repeatedColoredTexts = {};

    return results;
  }

  let repeatedColoredTexts = {};
  function getColoredText(value, className, results) {
    const coloredTexts = document.querySelectorAll(
      `[style*="${value}"], [style*="${value.replace(/, /g, ',')}"]`
    );
    if (!coloredTexts.length) return;

    let coloredTextNodes = [];
    const blocks = Array.prototype.map.call(coloredTexts, function (text, idx) {
      coloredTextNodes[idx] = text.nodeName;
      return text.closest('.notion-selectable');
    });

    // 移除同一顏色的重複區塊
    const uniqueBlocks = blocks.filter(function (block, idx, arr) {
      return arr.indexOf(block) === idx;
    });

    let blockIDs = [];
    let blocksContent = [];
    uniqueBlocks.map(function (block, idx) {
      blockIDs[idx] = block.dataset.blockId;
      const editedContent = block.querySelector('[contenteditable]');
      // 解除加上顏色的 Table of Contents 功能的錯誤（雖然是顏色文字，但子元素並沒 contenteditable 屬性）
      if (editedContent) {
        blocksContent.push(editedContent);
      }
    });

    blocksContent.forEach(function (content, idx) {
      const nodeName = coloredTextNodes[idx];
      const blockID = blockIDs[idx];
      const coloredTextHTML = content.innerHTML;

      if (!results[blockID]) {
        const result = (results[blockID] = {});
        result.nodeName = nodeName;
        result.colorName = className;
        result.coloredTextHTML = coloredTextHTML;
        return;
      }

      // 顯示與色彩數量同樣多次
      function displayMoreTimes() {
        if (!repeatedColoredTexts[blockID]) {
          repeatedColoredTexts[blockID] = [];
        }
        const repeatedColoredTextIDs = repeatedColoredTexts[blockID];
        const prefixID = `${blockID}{{${className}-${idx}}}`;
        const prefixResult = (results[prefixID] = {});
        if (results[blockID].nodeName !== 'DIV') {
          if (nodeName === 'DIV') {
            let result = results[blockID];
            result.nodeName = nodeName;
            result.colorName = className;
            repeatedColoredTextIDs.forEach(function (coloredTextID) {
              const result = (results[coloredTextID] = {});
              result.nodeName = nodeName;
              result.colorName = className;
            });
          }
          repeatedColoredTextIDs.push(prefixID);
          prefixResult.nodeName = nodeName;
          prefixResult.colorName = className;
        } else {
          prefixResult.nodeName = results[blockID].nodeName;
          prefixResult.colorName = results[blockID].colorName;
        }
        prefixResult.coloredTextHTML = coloredTextHTML;
      }
      // 只顯示一次
      function displayOnce() {
        if (results[blockID].nodeName !== 'DIV') {
          results[blockID] = {};
          if (nodeName === 'DIV') {
            let repeatedColoredText = repeatedColoredTexts[blockID];
            if (!repeatedColoredText) {
              repeatedColoredText = {};
              repeatedColoredText.coloredTextHTML = coloredTextHTML;
            }
            repeatedColoredText.nodeName = nodeName;
            repeatedColoredText.colorName = className;
          }
          if (!repeatedColoredTexts[blockID]) {
            const repeatedColoredText = (repeatedColoredTexts[blockID] = {});
            repeatedColoredText.coloredTextHTML = coloredTextHTML;
            repeatedColoredText.nodeName = nodeName;
            repeatedColoredText.colorName = className;
          }
        } else {
          let result = results[blockID];
          var repeatedColoredText = repeatedColoredTexts[blockID];
          if (!repeatedColoredText) {
            repeatedColoredText = {};
            repeatedColoredText.coloredTextHTML = coloredTextHTML;
          }
          repeatedColoredText.nodeName = result.nodeName;
          repeatedColoredText.colorName = result.className;
          result = {};
        }
      }

      if (options.displayTimes === 'once') {
        displayOnce();
      } else {
        displayMoreTimes();
      }
    });
  }

  function scrollToCommemt(blockID) {
    bodyEl.click();
    const commentedBlock = document.querySelector(
      `[data-block-id="${blockID}"]`
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

  function scrollToColoredText(blockID) {
    const blockIDRemovePrefix = blockID.replace(/\{\{.*\}\}/, '');
    bodyEl.click();
    const coloredTextBlock = document.querySelector(
      `[data-block-id="${blockIDRemovePrefix}"]`
    );
    coloredTextBlock.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    switch (message.action) {
      case 'get comments': {
        let result = getComments();
        sendResponse(result);
        break;
      }
      case 'get colored texts': {
        let result = getColoredTexts();
        sendResponse(result);
        break;
      }

      case 'scroll to comment':
        scrollToCommemt(message.id);
        break;
      case 'scroll to colored text':
        scrollToColoredText(message.id);
        break;
      default:
        break;
    }
  });

  function getComments() {
    const commentIconElems = document.querySelectorAll('.speechBubble');

    return Array.from(commentIconElems)
      .map(getBlockElem)
      .filter(removeDuplicateElem)
      .map(constructContentHtml)
      .filter(removeFalsy);

    function getBlockElem(elem) {
      return elem.closest('[data-block-id]');
    }

    function constructContentHtml(block) {
      const content = block.querySelector('[contenteditable]');

      if (!content) {
        return undefined;
      }

      return {
        id: block.dataset.blockId,
        html: content.innerHTML,
      };
    }

    function removeDuplicateElem(currentElem, idx, elems) {
      return elems.findIndex(isEqualElem) === idx;

      function isEqualElem(otherElem) {
        return currentElem.isEqualNode(otherElem);
      }
    }
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

function storeCurrentTheme(isLightTheme) {
  chrome.storage.sync.set({ theme: isLightTheme ? 'light' : 'dark' });
}
