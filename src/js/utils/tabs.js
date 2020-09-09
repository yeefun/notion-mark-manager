export { sendMessageToContentscript };

function sendMessageToContentscript(message) {
  return function thunk() {
    return new Promise((resolve) => {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        function handleQueriedTabs(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, message, function callback(
            response
          ) {
            resolve(response);
          });
        }
      );
    });
  };
}
