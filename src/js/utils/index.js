export { getChromeStorage, setChromeStorage } from './storage.js';
export { sendMessageToContentscript } from './tabs.js';
export { loadGa, sendGaPageview, sendGaEvt } from './ga.js';

const inProdEnv = process.env.NODE_ENV === 'production';

export { inProdEnv };
