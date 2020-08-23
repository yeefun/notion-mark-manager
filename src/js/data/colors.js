const COLORS = {
  light: {
    fonts: [
      {
        value: 'rgb(155, 154, 51)',
        name: 'font-gray',
      },
      {
        value: 'rgb(100, 71, 58)',
        name: 'font-brown',
      },
      {
        value: 'rgb(217, 115, 13)',
        name: 'font-orange',
      },
      {
        value: 'rgb(223, 171, 1)',
        name: 'font-yellow',
      },
      {
        value: 'rgb(15, 123, 108)',
        name: 'font-green',
      },
      {
        value: 'rgb(11, 110, 153)',
        name: 'font-blue',
      },
      {
        value: 'rgb(105, 64, 165)',
        name: 'font-purple',
      },
      {
        value: 'rgb(173, 26, 114)',
        name: 'font-pink',
      },
      {
        value: 'rgb(224, 62, 62)',
        name: 'font-red',
      },
    ],
    backgrounds: [
      {
        value: 'rgb(235, 236, 237)',
        name: 'background-gray',
      },
      {
        value: 'rgb(233, 229, 227)',
        name: 'background-brown',
      },
      {
        value: 'rgb(250, 235, 221)',
        name: 'background-orange',
      },
      {
        value: 'rgb(251, 243, 219)',
        name: 'background-yellow',
      },
      {
        value: 'rgb(221, 237, 234)',
        name: 'background-green',
      },
      {
        value: 'rgb(221, 235, 241)',
        name: 'background-blue',
      },
      {
        value: 'rgb(234, 228, 242)',
        name: 'background-purple',
      },
      {
        value: 'rgb(244, 223, 235)',
        name: 'background-pink',
      },
      {
        value: 'rgb(251, 228, 228)',
        name: 'background-red',
      },
    ],
  },
  dark: {
    fonts: [
      {
        value: 'rgba(151, 154, 155, 0.95)',
        name: 'font-gray',
      },
      {
        value: 'rgb(147, 114, 100)',
        name: 'font-brown',
      },
      {
        value: 'rgb(255, 163, 68)',
        name: 'font-orange',
      },
      {
        value: 'rgb(255, 220, 73)',
        name: 'font-yellow',
      },
      {
        value: 'rgb(77, 171, 154)',
        name: 'font-green',
      },
      {
        value: 'rgb(82, 156, 202)',
        name: 'font-blue',
      },
      {
        value: 'rgb(154, 109, 215)',
        name: 'font-purple',
      },
      {
        value: 'rgb(226, 85, 161)',
        name: 'font-pink',
      },
      {
        value: 'rgb(255, 115, 105)',
        name: 'font-red',
      },
    ],
    backgrounds: [
      {
        value: 'rgb(69, 75, 78)',
        name: 'background-gray',
      },
      {
        value: 'rgb(67, 64, 64)',
        name: 'background-brown',
      },
      {
        value: 'rgb(89, 74, 58)',
        name: 'background-orange',
      },
      {
        value: 'rgb(89, 86, 59)',
        name: 'background-yellow',
      },
      {
        value: 'rgb(53, 76, 75)',
        name: 'background-green',
      },
      {
        value: 'rgb(54, 73, 84)',
        name: 'background-blue',
      },
      {
        value: 'rgb(68, 63, 87)',
        name: 'background-purple',
      },
      {
        value: 'rgb(83, 59, 76)',
        name: 'background-pink',
      },
      {
        value: 'rgb(89, 65, 65)',
        name: 'background-red',
      },
    ],
  },
};

const COLORS_LIGHT_FONTS = COLORS.light.fonts;
const COLORS_LIGHT_BACKGROUNDS = COLORS.light.backgrounds;
const COLORS_DARK_FONTS = COLORS.dark.fonts;
const COLORS_DARK_BACKGROUNDS = COLORS.light.backgrounds;

export {
  COLORS_LIGHT_FONTS,
  COLORS_LIGHT_BACKGROUNDS,
  COLORS_DARK_FONTS,
  COLORS_DARK_BACKGROUNDS,
};
