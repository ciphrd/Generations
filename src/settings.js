import { Color } from "./utils/color"

export const settings = {
  radius: 0.006,
  signals: {
    loss: 0.99,
  },
  food: {
    default: {
      color: new Color(0, 0, 1),
      radius: 0.02,
    },
  },
  microscopy: {
    light: {
      backlightColor: new Color(1, 1, 1),
    },
  },
}
