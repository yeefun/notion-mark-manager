function readyToLoad() {
  var bodyEl = document.body;
  var notionApp = document.querySelector('.notion-app-inner');
  var isLightTheme = true;

  function storeTheme() {
    isLightTheme = document.getElementById('notion-app').firstChild.classList.contains('notion-light-theme');
    if (isLightTheme) {
      chrome.storage.sync.set({
        theme: 'light',
      });
    } else {
      chrome.storage.sync.set({
        theme: 'dark',
      });
    }
  }
  storeTheme();

  var fontLightColors = [
    {
      value: 'rgb(155, 154, 151)',
      name: 'font-gray',
    },
    {
      value: 'rgb(100, 71, 58)',
      name: 'font-brown',
    },
    {
      value: 'rgb(217, 115, 13)',
      name: 'font-orange',
    },
    {
      value: 'rgb(223, 171, 1)',
      name: 'font-yellow',
    },
    {
      value: 'rgb(15, 123, 108)',
      name: 'font-green',
    },
    {
      value: 'rgb(11, 110, 153)',
      name: 'font-blue',
    },
    {
      value: 'rgb(105, 64, 165)',
      name: 'font-purple',
    },
    {
      value: 'rgb(173, 26, 114)',
      name: 'font-pink',
    },
    {
      value: 'rgb(224, 62, 62)',
      name: 'font-red',
    }
  ];
  var fontDarkColors = [
    {
      value: 'rgba(151, 154, 155, 0.95)',
      name: 'font-gray',
    },
    {
      value: 'rgb(147, 114, 100)',
      name: 'font-brown',
    },
    {
      value: 'rgb(255, 163, 68)',
      name: 'font-orange',
    },
    {
      value: 'rgb(255, 220, 73)',
      name: 'font-yellow',
    },
    {
      value: 'rgb(77, 171, 154)',
      name: 'font-green',
    },
    {
      value: 'rgb(82, 156, 202)',
      name: 'font-blue',
    },
    {
      value: 'rgb(154, 109, 215)',
      name: 'font-purple',
    },
    {
      value: 'rgb(226, 85, 161)',
      name: 'font-pink',
    },
    {
      value: 'rgb(255, 115, 105)',
      name: 'font-red',
    }
  ];
  var backgroundLightColors = [
    {
      value: 'rgb(235, 236, 237)',
      name: 'background-gray',
    },
    {
      value: 'rgb(233, 229, 227)',
      name: 'background-brown',
    },
    {
      value: 'rgb(250, 235, 221)',
      name: 'background-orange',
    },
    {
      value: 'rgb(251, 243, 219)',
      name: 'background-yellow',
    },
    {
      value: 'rgb(221, 237, 234)',
      name: 'background-green',
    },
    {
      value: 'rgb(221, 235, 241)',
      name: 'background-blue',
    },
    {
      value: 'rgb(234, 228, 242)',
      name: 'background-purple',
    },
    {
      value: 'rgb(244, 223, 235)',
      name: 'background-pink',
    },
    {
      value: 'rgb(251, 228, 228)',
      name: 'background-red',
    }
  ];
  var backgroundDarkColors = [
    {
      value: 'rgb(69, 75, 78)',
      name: 'background-gray',
    },
    {
      value: 'rgb(67, 64, 64)',
      name: 'background-brown',
    },
    {
      value: 'rgb(89, 74, 58)',
      name: 'background-orange',
    },
    {
      value: 'rgb(89, 86, 59)',
      name: 'background-yellow',
    },
    {
      value: 'rgb(53, 76, 75)',
      name: 'background-green',
    },
    {
      value: 'rgb(54, 73, 84)',
      name: 'background-blue',
    },
    {
      value: 'rgb(68, 63, 87)',
      name: 'background-purple',
    },
    {
      value: 'rgb(83, 59, 76)',
      name: 'background-pink',
    },
    {
      value: 'rgb(89, 65, 65)',
      name: 'background-red',
    }
  ];
  var commentIconSelector = 'path[d="M0.913134,0.920639 C1.49851,0.331726 2.29348,0 3.12342,0 L10.8766,0 C11.7065,0 12.5015,0.331725 13.0869,0.920639 C13.6721,1.50939 14,2.30689 14,3.13746 L14,7.62943 C13.9962,8.01443 13.9059,8.47125 13.7629,8.82852 C13.6128,9.183 13.3552,9.57088 13.0869,9.84625 C12.813,10.1163 12.4265,10.3761 12.0734,10.5274 C11.7172,10.6716 11.2607,10.763 10.8766,10.7669 L10.1234,10.7669 L10.1234,12.5676 L10.1209,12.5676 C10.1204,12.793 10.0633,13.0792 9.97807,13.262 C9.8627,13.466 9.61158,13.7198 9.40818,13.8382 L9.40662,13.8391 L9.40539,13.8398 C9.22962,13.9255 8.94505,13.9951 8.75059,14 L8.74789,14 C8.35724,13.9963 7.98473,13.8383 7.71035,13.5617 L5.39553,10.7669 L3.12342,10.7669 C2.29348,10.7669 1.49851,10.4352 0.913134,9.84625 C0.644826,9.57089 0.387187,9.183 0.23711,8.82852 C0.0941235,8.47125 0.00379528,8.01443 0,7.62943 L0,3.13746 C0,2.30689 0.327915,1.50939 0.913134,0.920639 Z M3.12342,1.59494 C2.71959,1.59494 2.33133,1.75628 2.04431,2.04503 C1.75713,2.33395 1.59494,2.72681 1.59494,3.13746 L1.59494,7.62943 C1.59114,7.85901 1.62114,8.01076 1.71193,8.22129 C1.79563,8.4346 1.88065,8.56264 2.04431,8.72185 C2.33133,9.01061 2.71959,9.17195 3.12342,9.17195 L5.72383,9.17195 C5.93413,9.17195 6.13592,9.25502 6.28527,9.40308 L8.52848,12.1269 L8.52848,9.96942 C8.52848,9.52899 8.88552,9.17195 9.32595,9.17195 L10.8766,9.17195 C11.1034,9.17583 11.2517,9.14614 11.4599,9.05518 C11.6712,8.97132 11.7976,8.88635 11.9557,8.72185 C12.1193,8.56264 12.2044,8.4346 12.2881,8.22129 C12.3789,8.01076 12.4089,7.85901 12.4051,7.62943 L12.4051,3.13746 C12.4051,2.72681 12.2429,2.33394 11.9557,2.04503 C11.6687,1.75628 11.2804,1.59494 10.8766,1.59494 L3.12342,1.59494 Z"]';



  var getStyle = function (el, prop) {
    return window.getComputedStyle(el)[prop];
  }
  var getElementsByStyle = function (tag, prop, value) {
    var els = document.getElementsByTagName(tag || '*');
    return Array.prototype.filter.call(els, function (el) {
      return getStyle(el, prop) === value;
    });
  }
  function closest(el, classSelector) {
    while (!el.classList.contains(classSelector)) {
      el = el.parentNode;
    }
    return el;
  }
  function loadCommentedText(sendResponse) {
    var commentIcons = document.querySelectorAll(commentIconSelector);
    var result = {};
    var blockIds = [];
    var blocks = Array.prototype.map.call(commentIcons, function (icon) {
      return closest(icon, 'notion-selectable');
    });
    blocks = blocks.map(function (block, idx) {
      blockIds[idx] = block.dataset.blockId;
      return block.querySelector('[contenteditable]');
    });
    blocks.forEach(function (block, idx) {
      var id = blockIds[idx];
      var commentHTML = block.outerHTML;
      commentHTML = commentHTML.replace(/contenteditable="true"/g, '');
      commentHTML = commentHTML.replace(/-webkit-user-modify:\s*read-write-plaintext-only;/g, '');
      commentHTML = commentHTML.replace(/padding:\s*3px 2px;/g, '');
      result[id] = {};
      result[id].commentHTML = commentHTML;
    });
    sendResponse(result);
  }
  function loadMarkedText(sendResponse) {
    var fontColors = isLightTheme ? fontLightColors : fontDarkColors;
    var backgroundColors = isLightTheme ? backgroundLightColors : backgroundDarkColors;
    var result = {};
    fontColors.forEach(function (color) {
      if (checkedColors.indexOf(color.name) !== -1) {
        getMarkedText('color', color.value, color.name, result);
      }
    });
    backgroundColors.forEach(function (color) {
      if (checkedColors.indexOf(color.name) !== -1) {
        getMarkedText('background-color', color.value, color.name, result);
      }
    });
    sendResponse(result);
  }
  function getMarkedText(prop, value, className, result) {
    // var markedTextsDiv = getElementsByStyle('DIV', prop, value);
    // var markedTextsSpan = getElementsByStyle('SPAN', prop, value);
    // var markedTexts = markedTextsDiv.concat(markedTextsSpan);
    var markedTexts = getElementsByStyle('DIV', prop, value);
    if (!markedTexts.length) {
      return;
    }
    var blockIds = [];
    var blocks = Array.prototype.map.call(markedTexts, function (text) {
      return closest(text, 'notion-selectable');
    });
    blocks = blocks.map(function (block, idx) {
      blockIds[idx] = block.dataset.blockId;
      return block.querySelector('[contenteditable]');
    });
    blocks.forEach(function (block, idx) {
      var id = blockIds[idx];
      var markHTML = block.outerHTML;
      markHTML = markHTML.replace(/contenteditable="true"/g, '');
      markHTML = markHTML.replace(/-webkit-user-modify:\s*read-write-plaintext-only;/g, '');
      markHTML = markHTML.replace(/padding:\s*3px 2px;/g, '');
      result[id] = {};
      result[id].colorName = className;
      result[id].markHTML = markHTML;
    });
  }


  
  function jumpToCommemted(blockId) {
    bodyEl.click();
    var commentedBlock = document.querySelector(`[data-block-id="${blockId}"]`);
    var intersectionObserver = new IntersectionObserver(function (entries) {
      var entry = entries[0];
      var target = entry.target;
      if (entry.isIntersecting) {
        setTimeout(function () {
          var spans = commentedBlock.getElementsByTagName('SPAN');
          var markedSpan = Array.prototype.find.call(spans, function (span) {
            // var commentColor = isLightTheme ? 'rgba(255, 212, 0, 0.14)' : 
            return getStyle(span, 'background-color') === 'rgba(255, 212, 0, 0.14)';
          });
          markedSpan.click();
        }, 120);
        intersectionObserver.unobserve(target);
      }
    });
    intersectionObserver.observe(commentedBlock);
    commentedBlock.scrollIntoView({
      behavior: 'smooth'
    });
  }
  function jumpToMarked(blockId) {
    bodyEl.click();
    var markedBlock = document.querySelector(`[data-block-id="${blockId}"]`);
    markedBlock.scrollIntoView({
      behavior: 'smooth'
    });
  }
  chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.action) {
      case 'load comments':
        loadCommentedText(sendResponse);
        break;
      case 'load marks':
        loadMarkedText(sendResponse);
        break;
      case 'jump to commented':
        jumpToCommemted(message.id);
        break;
      case 'jump to marked':
        jumpToMarked(message.id);
        break;
      default:
        break;
    }
  });
  var mutationObserver = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.attributeName === 'class') {
        storeTheme();
      }
    });
  });
  mutationObserver.observe(notionApp, {
    attributes: true,
  });
}

var checkedColors = [];
chrome.storage.sync.get(
  ['checkedColors'],
  function (items) {
    if (items.checkedColors) {
      checkedColors = items.checkedColors;
    } else {
      checkedColors = ['font-gray', 'font-brown', 'font-orange', 'font-yellow', 'font-green', 'font-blue', 'font-purple', 'font-pink', 'font-red', 'background-gray', 'background-brown', 'background-orange', 'background-yellow', 'background-green', 'background-blue', 'background-purple', 'background-pink', 'background-red'];
    }
    readyToLoad();
  }
);