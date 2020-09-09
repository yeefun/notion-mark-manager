import clipboard from 'clipboard';
import { saveAs } from 'file-saver';

import nav from '../store/nav.js';

var inputsBlock = {
  'colored-texts': undefined,
  comments: undefined,
};
var btnsWrapper = document.getElementById('exporter-btns-wrapper');
var inputSelectAll = document.getElementById('select-all');
var totalCheckedBlocks = {
  'colored-texts': 0,
  comments: 0,
};

function listenTabClicked() {
  document
    .querySelector('.menu .tab')
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
      });
  }

  function listenCopyClicked() {
    new clipboard('#copy', {
      text: getCheckedBlocksText,
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
})();

function changeInputSelectAll() {
  var currentInputsBlock = getCurrentInputsBlock();

  inputSelectAll.checked =
    totalCheckedBlocks[nav.state.tab] === currentInputsBlock.length;
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
  exporter,
  changeInputSelectAll,
};
