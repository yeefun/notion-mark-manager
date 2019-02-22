var nodesForEach = Array.prototype.forEach;
var bodyEl = document.body;

var container = document.getElementById('container');
var navItems = document.querySelectorAll('.nav-item');

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
      var commentObj = response;
      var result = '';
      for (var commentId in commentObj) {
        var commentHTML = commentObj[commentId].commentHTML;
        result += `
          <div class="block comment" data-id="${commentId}">
            <i class="icon-angle-double-right"></i>
            ${commentHTML}
          </div>
        `;
      }
      container.innerHTML = result;
      bindClickEventForJump('.comment');
    }
  );
}

function loadMarks() {
  sendMessageToContentScript({
      action: 'load marks',
    },
    function (response) {
      var markObj = response;
      var result = '';
      for (var markId in markObj) {
        var markHTML = markObj[markId].markHTML;
        var colorName = markObj[markId].colorName;
        result += `
          <div class="block mark ${colorName}" data-id="${markId}">
            <i class="icon-angle-double-right"></i>
            ${markHTML}
          </div>
        `;
      }
      container.innerHTML = result;
      bindClickEventForJump('.mark');
    }
  );
}

function bindClickEventForJump(className) {
  var marks = document.querySelectorAll(className);
  var action = className === '.comment' ? 'jump to commented' : 'jump to marked';
  nodesForEach.call(marks, function (mark) {
    mark.addEventListener('click', function () {
      var blockId = this.dataset.id;
      sendMessageToContentScript({
        action: action,
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