// https://davidsimpson.me/2014/05/27/add-googles-universal-analytics-tracking-chrome-extension/
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-134635576-1', 'auto');
// Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
ga('set', 'checkProtocolTask', function () {});
ga('require', 'displayfeatures');
ga('send', 'pageview', '/popup.html');



const nodesForEach = Array.prototype.forEach;
const bodyEl = document.body;

const container = document.getElementById('container');
const navItems = document.querySelectorAll('.nav-item');

chrome.storage.sync.get(['theme'], function (result) {
  if (result.theme === 'light') {
    bodyEl.classList.add('light');
  } else {
    bodyEl.classList.add('dark');
  }
});

nodesForEach.call(navItems, function (item) {
  item.addEventListener('click', function () {
    nodesForEach.call(navItems, function (item) {
      item.classList.remove('active');
    });
    this.classList.add('active');
    const tabName = this.dataset.tab;
    if (tabName === 'comments') {
      loadComments();
    } else {
      loadColoredTexts();
    }
    // GA: 'comments' 與 'colored texts' tab 各被按幾次？
    ga('send', 'event', 'Tabs', 'Click', `[Notion+ Mark Manager] [${tabName}]`);
  });
});

function sendMessageToContentScript(message, responseCallback) {
  chrome.tabs.query(
    {
      active: true,
      currentWindow: true,
    },
    function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, message, responseCallback);
    }
  );
}



function loadComments() {
  sendMessageToContentScript({
      action: 'load comments',
    },
    function (response) {
      const commentObj = response;
      let result = '';
      for (let commentID in commentObj) {
        let commentHTML = commentObj[commentID].commentHTML;
        result += `<div class="block comment" data-id="${commentID}">${commentHTML}</div>`;
      }
      container.innerHTML = result;
      bindClickEventToScrollInto('.comment');
    }
  );
}

function loadColoredTexts() {
  sendMessageToContentScript({
      action: 'load colored texts',
    },
    function (response) {
      const coloredTextObj = response;
      let result = '';
      for (let colorTextID in coloredTextObj) {
        const coloredTextHTML = coloredTextObj[colorTextID].coloredTextHTML;
        const nodeName = coloredTextObj[colorTextID].nodeName;
        const colorName = coloredTextObj[colorTextID].colorName;
        result += `<div class="block colored-text ${nodeName === 'DIV' ? colorName : ''}" data-id="${colorTextID}">${coloredTextHTML}</div>`;
      }
      container.innerHTML = result;
      bindClickEventToScrollInto('.colored-text');
    }
  );
}

function bindClickEventToScrollInto(className) {
  const marks = document.querySelectorAll(className);
  const action = className === '.comment' ? 'scroll into comment' : 'scroll into colored text';
  nodesForEach.call(marks, function (mark) {
    mark.addEventListener('click', function () {
      const blockID = this.dataset.id;
      sendMessageToContentScript({
        action,
        id: blockID,
      });
      nodesForEach.call(marks, function (mark) {
        mark.classList.remove('active');
      });
      this.classList.add('active');
      // GA: scroll into 'comment' 與 'colored text' 各被觸發幾次？
      ga('send', 'event', 'Marks', 'Scroll Into', `[Notion+ Mark Manager] [${action.split('scroll into ')[1]}]`);
    });
  });
}

chrome.storage.sync.get(
  ['tabFirstShow'],
  function (items) {
    const tabFirstShowName = items.tabFirstShow;
    if (tabFirstShowName) {
      if (tabFirstShowName === 'comments') {
        loadComments();
        document.querySelector('[data-tab="comments"]').classList.add('active');
      } else {
        loadColoredTexts();
        document.querySelector('[data-tab="colored texts"]').classList.add('active');
      }
    } else {
      loadComments();
      document.querySelector('[data-tab="comments"]').classList.add('active');
    }
  }
);

const navbar = document.getElementById('navbar');
let beforeScrollY = window.scrollY;
window.addEventListener('scroll', function () {
  const currentScrollY = this.scrollY;
  const scrollDelta = currentScrollY - beforeScrollY;
  if (scrollDelta > 0) {
    navbar.classList.remove('show');
  } else {
    navbar.classList.add('show');
  }
  beforeScrollY = currentScrollY;
});