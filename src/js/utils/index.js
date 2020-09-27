export { getChromeStorage, setChromeStorage } from './storage.js';
export { sendMessageToContentscript } from './tabs.js';

export { removeFalsy };

function removeFalsy(value) {
  return value;
}
