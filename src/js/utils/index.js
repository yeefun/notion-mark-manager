export { loadGa, sendGaPageview, sendGaEvent } from './ga.js';

const inProdEnv = process.env.NODE_ENV === 'production';

export { inProdEnv, removeDuplicate };

function removeDuplicate(item, idx, arr) {
  return arr.indexOf(item) === idx;
}
