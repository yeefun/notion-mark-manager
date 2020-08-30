export { getChromeStorage, setChromeStorage };

function getChromeStorage(keys) {
  return function thunk() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, function callback(result) {
        resolve(result);
      });
    });
  };
}

function setChromeStorage(items = {}) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(items, function callback() {
      resolve(undefined);
    });
  });
}
