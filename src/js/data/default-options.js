const DEFAULT_OPTIONS = {
  colorNames: [
    'font-gray',
    'font-brown',
    'font-orange',
    'font-yellow',
    'font-green',
    'font-blue',
    'font-purple',
    'font-pink',
    'font-red',
    'background-gray',
    'background-brown',
    'background-orange',
    'background-yellow',
    'background-green',
    'background-blue',
    'background-purple',
    'background-pink',
    'background-red',
  ],
  tabActivatedFirst: 'colored-texts',
  displayedTimes: 'once',
};

const DEFAULT_COLOR_NAMES = DEFAULT_OPTIONS.colorNames;
const DEFAULT_TAB_ACTIVATED_FIRST = DEFAULT_OPTIONS.tabActivatedFirst;
const DEFAULT_DISPLAYED_TIMES = DEFAULT_OPTIONS.displayedTimes;

export {
  DEFAULT_OPTIONS as default,
  DEFAULT_COLOR_NAMES,
  DEFAULT_TAB_ACTIVATED_FIRST,
  DEFAULT_DISPLAYED_TIMES,
};
