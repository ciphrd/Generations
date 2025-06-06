Object.getOwnPropertyNames(Math).forEach((el) => (window[el] = Math[el]))
window.TAU = 2 * PI
