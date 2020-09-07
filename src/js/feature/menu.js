import clipboard from 'clipboard';
import { saveAs } from 'file-saver';

var inputsBlock;
var btnsWrapperElem = document.getElementById('exporter-btns-wrapper');
var inputSelectAll = document.getElementById('select-all');
var totalCheckedBlocks = 0;

function listenTabClicked() {
  document
    .querySelector('.menu .tab')
    .addEventListener('click', function handleClickTab() {
      document.body.classList.add('exported');
    });
}

function listenInputsBlockClicked() {
  document
    .getElementById('blocks-container')
    .addEventListener('click', function handleClick(evt) {
      if (evt.target.nodeName !== 'INPUT') {
        return;
      }

      if (evt.target.checked) {
        totalCheckedBlocks += 1;

        btnsWrapperElem.classList.add('shown');

        if (inputsBlock === undefined) {
          inputsBlock = document.querySelectorAll('#blocks-container input');
        }

        if (totalCheckedBlocks === inputsBlock.length) {
          inputSelectAll.checked = true;
        }
      } else {
        totalCheckedBlocks -= 1;

        if (totalCheckedBlocks === 0) {
          btnsWrapperElem.classList.remove('shown');
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
      if (inputsBlock === undefined) {
        inputsBlock = document.querySelectorAll('#blocks-container input');
      }

      inputsBlock.forEach(toggleInput);

      if (inputSelectAll.checked) {
        btnsWrapperElem.classList.add('shown');

        totalCheckedBlocks = inputsBlock.length;
      } else {
        btnsWrapperElem.classList.remove('shown');

        totalCheckedBlocks = 0;
      }

      function toggleInput(input) {
        input.checked = inputSelectAll.checked;
      }
    });
  }

  function listenBtnsClicked() {
    document
      .getElementById('cancel')
      .addEventListener('click', function handleCancel() {
        document.body.classList.remove('exported');
      });

    listenCopyClicked();
    listenDownloadClicked();
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
      document.querySelectorAll('#blocks-container input:checked')
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

export default {
  listenTabClicked,
  listenInputsBlockClicked,
  exporter,
};
