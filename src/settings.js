import { Color } from "./utils/color"

export const settings = {
  radius: 0.006,
  rendering: {
    cell: {
      scale: 2.2,
    },
  },
  signals: {
    loss: 0.99,
  },
  food: {
    default: {
      color: new Color(0, 0, 255),
      radius: 0.02,
    },
  },
  microscopy: {
    light: {
      backlightColor: new Color(1, 1, 1),
    },
  },
}
