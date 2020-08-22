export { loadGa, sendGaPageview, sendGaEvent } from './ga.js';

const inProdEnv = process.env.NODE_ENV === 'production';

export { inProdEnv };
