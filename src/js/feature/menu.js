import Clipboard from 'clipboard';
import { saveAs } from 'file-saver';

import nav from '../store/nav.js';
import { removeFalsy } from '../utils/index.js';

var inputsBlock = {
  'colored-texts': undefined,
  comments: undefined,
};
var btnsWrapper = document.getElementById('exporter-btns-wrapper');
var inputSelectAll = document.getElementById('select-all');
var status = document.getElementById('status');
var totalCheckedBlocks = {
  'colored-texts': 0,
  comments: 0,
};

function listenTabClicked() {
  document
    .querySelector('#menu .tab')
    .addEventListener('click', function handleClickTab() {
      document.body.classList.add('exported');
    });
}

function listenInputsBlockClicked() {
  document
    .getElementById('blocks')
    .addEventListener('click', function handleClick(evt) {
      if (evt.target.nodeName !== 'INPUT') {
        return;
      }

      if (evt.target.checked) {
        totalCheckedBlocks[nav.state.tab] += 1;

        if (!btnsWrapper.classList.contains('shown')) {
          btnsWrapper.classList.add('shown');
        }

        {
          const currentInputsBlock = getCurrentInputsBlock();
          const areAllBlocksChecked =
            totalCheckedBlocks[nav.state.tab] === currentInputsBlock.length;

          if (areAllBlocksChecked) {
            inputSelectAll.checked = true;
          }
        }
      } else {
        totalCheckedBlocks[nav.state.tab] -= 1;

        {
          const areNoBlocksChecked = totalCheckedBlocks[nav.state.tab] === 0;

          if (areNoBlocksChecked) {
            btnsWrapper.classList.remove('shown');
          }
        }

        inputSelectAll.checked = false;
      }
    });
}

const exporter = (function createExporter() {
  return {
    listenOptionsClicked,
    listenBtnsClicked,
  };

  function listenOptionsClicked() {
    inputSelectAll.addEventListener('change', function handleSelectAll() {
      var currentInputsBlock = getCurrentInputsBlock();

      currentInputsBlock.forEach(function toggleInput(input) {
        input.checked = inputSelectAll.checked;
      });

      if (inputSelectAll.checked) {
        btnsWrapper.classList.add('shown');

        totalCheckedBlocks[nav.state.tab] = currentInputsBlock.length;
      } else {
        btnsWrapper.classList.remove('shown');

        totalCheckedBlocks[nav.state.tab] = 0;
      }
    });
  }

  function listenBtnsClicked() {
    listenCancelClicked();
    listenCopyClicked();
    listenDownloadClicked();
  }

  function listenCancelClicked() {
    document
      .getElementById('cancel')
      .addEventListener('click', function handleCancel() {
        document.body.classList.remove('exported');

        reset();
      });

    function reset() {
      totalCheckedBlocks['colored-texts'] = 0;
      totalCheckedBlocks.comments = 0;

      getAllInputsBlock().forEach(function uncheck(input) {
        input.checked = false;
      });

      inputSelectAll.checked = false;

      btnsWrapper.classList.remove('shown');
    }

    function getAllInputsBlock() {
      return Object.values(inputsBlock)
        .filter(removeFalsy)
        .map(unary(Array.from))
        .flat();

      function unary(func) {
        return function onlyOneArg(arg) {
          return func(arg);
        };
      }
    }
  }

  function listenCopyClicked() {
    var clipboard = new Clipboard('#copy', {
      text: getCheckedBlocksText,
    });

    clipboard.on('success', function showStatus() {
      setStatus('Successfully copied!');
      setTimeout(clearStatus, 3000);
    });
  }

  function listenDownloadClicked() {
    document
      .getElementById('download')
      .addEventListener('click', function handleDownload() {
        var blob = new Blob([getCheckedBlocksText()], {
          type: 'text/plain;charset=utf-8',
        });

        saveAs(blob, 'nmm-export.txt');

        setStatus('Successfully downloaded!');
        setTimeout(clearStatus, 3000);
      });
  }

  function getCheckedBlocksText() {
    const inputsBlockChecked = Array.from(
      document.querySelectorAll(`#${nav.state.tab}-container input:checked`)
    );

    return inputsBlockChecked
      .map(getClosestWrapperElem)
      .map(extractText)
      .join('\n\r');

    function getClosestWrapperElem(elem) {
      return elem.closest('.wrapper');
    }

    function extractText(elem) {
      return elem.innerText;
    }
  }

  function setStatus(content) {
    status.textContent = content;
  }

  function clearStatus() {
    setStatus('');
  }
})();

function changeInputSelectAll() {
  var currentInputsBlock = getCurrentInputsBlock();

  inputSelectAll.checked =
    totalCheckedBlocks[nav.state.tab] === currentInputsBlock.length;
}

function hide() {
  document.body.classList.remove('menu');
}

function show() {
  document.body.classList.add('menu');
}

function getCurrentInputsBlock() {
  if (inputsBlock[nav.state.tab] === undefined) {
    return (inputsBlock[nav.state.tab] = document.querySelectorAll(
      `#${nav.state.tab}-container input`
    ));
  }

  return inputsBlock[nav.state.tab];
}

export default {
  listenTabClicked,
  listenInputsBlockClicked,
  show,
  hide,
  exporter,
  changeInputSelectAll,
};
