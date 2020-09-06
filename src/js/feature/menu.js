import Clipboard from 'clipboard';

function listenTabClicked() {
  document
    .querySelector('.menu .tab')
    .addEventListener('click', function handleClickTab() {
      document.body.classList.add('export');
    });
}

const exporter = (function createExporter() {
  return {
    listenOptionsClicked,
    listenBtnsClicked,
  };

  function listenOptionsClicked() {
    document
      .getElementById('select-all')
      .addEventListener('change', function handleSelectAll(evt) {
        var selectAllInput = evt.currentTarget;

        document
          .querySelectorAll('.blocks-container input')
          .forEach(toggleInput);

        function toggleInput(input) {
          input.checked = selectAllInput.checked;
        }
      });
  }

  function listenBtnsClicked() {
    document
      .getElementById('cancel')
      .addEventListener('click', function handleCancel() {
        document.body.classList.remove('export');
      });

    listenCopyClicked();
  }

  function listenCopyClicked() {
    new Clipboard('#copy', {
      text: function copyCheckedBlocksText() {
        const checkedInputs = Array.from(
          document.querySelectorAll('.blocks-container input:checked')
        );

        return checkedInputs
          .map(getClosestWrapperElem)
          .map(extractText)
          .join('\n\r');

        function getClosestWrapperElem(elem) {
          return elem.closest('.wrapper');
        }

        function extractText(elem) {
          return elem.innerText;
        }
      },
    });
  }
})();

export default {
  listenTabClicked,
  exporter,
};
