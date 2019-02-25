const nodesForEach = Array.prototype.forEach;
const bodyEl = document.body;
const htmlEl = document.documentElement;

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
    if (this.dataset.tab === 'comments') {
      loadComments();
    } else {
      loadMarks();
    }
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
      for (let commentId in commentObj) {
        let commentHTML = commentObj[commentId].commentHTML;
        // result += `
        //   <div class="block comment" data-id="${commentId}">
        //     <i class="icon-angle-double-right"></i>
        //     ${commentHTML}
        //   </div>
        // `;
        result += `<div class="block comment" data-id="${commentId}">${commentHTML}</div>`;
      }
      container.innerHTML = result;
      bindClickEventToJump('.comment');
    }
  );
}

function loadMarks() {
  sendMessageToContentScript({
      action: 'load marks',
    },
    function (response) {
      const markObj = response;
      let result = '';
      for (let markId in markObj) {
        const markHTML = markObj[markId].markHTML;
        const nodeName = markObj[markId].nodeName;
        const colorName = markObj[markId].colorName;
        result += `<div class="block mark ${nodeName === 'DIV' ? colorName : ''}" data-id="${markId}">${markHTML}</div>`;
      }
      container.innerHTML = result;
      bindClickEventToJump('.mark');
    }
  );
}

function bindClickEventToJump(className) {
  const marks = document.querySelectorAll(className);
  const action = className === '.comment' ? 'jump to commented' : 'jump to marked';
  nodesForEach.call(marks, function (mark) {
    mark.addEventListener('click', function () {
      const blockId = this.dataset.id;
      sendMessageToContentScript({
        action,
        id: blockId,
      });
      nodesForEach.call(marks, function (mark) {
        mark.classList.remove('active');
      });
      this.classList.add('active');
    });
  });
}

chrome.storage.sync.get(
  ['tabFirstShow'],
  function (items) {
    var tabFirstShowName = items.tabFirstShow;
    if (tabFirstShowName) {
      if (tabFirstShowName === 'comments') {
        loadComments();
        document.querySelector('[data-tab="comments"]').classList.add('active');
      } else {
        loadMarks();
        document.querySelector('[data-tab="marks"]').classList.add('active');
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