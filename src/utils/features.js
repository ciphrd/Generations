import { Params } from "../parametric-space"

function feature(features, value, min, max) {
  return features[floor((features.length * (value - min)) / (max - min))]
}

const lowHigh = ["very low", "low", "medium", "high", "very high"]

function hueToColor(hue) {
  hue = hue % 1
  const deg = hue * 360
  if (deg < 15 || deg >= 345) {
    return "red"
  } else if (deg < 45) {
    return "orange"
  } else if (deg < 70) {
    return "yellow"
  } else if (deg < 90) {
    return "lime"
  } else if (deg < 165) {
    return "green"
  } else if (deg < 195) {
    return "cyan"
  } else if (deg < 255) {
    return "blue"
  } else if (deg < 285) {
    return "purple"
  } else if (deg < 345) {
    return "pink"
  } else {
    return "red"
  }
}

export function defineFeatures() {
  $fx.features({
    "Cells density": feature(lowHigh, min(Params.nbCells, 400), 10, 400),
    "Bacterias density": feature(lowHigh, Params.sedimentNbAgents, 16, 128),
    "Substrate thickness": Params.rdGaussianFilterSize < 4 ? "thin" : "thick",
    "Cells pigment": feature(
      lowHigh,
      0.1 + (0.4 - Params.cellsColorSpread),
      0.1,
      0.4
    ),
    "Env color": hueToColor(Params.sedimentHues[0]),
    "Substrate color": hueToColor(Params.sedimentHues[1]),
    Generation: $fx.depth,
  })
}
