//! assumes
// uniform vec4 u_view;
// xy: translation
// z: scale

// Give some 2d coordinates in world space, returns 2d coordinates in screen
// space after the view transformation is applied.
vec2 viewTx(in vec2 P) {
  return P * u_view.zw + u_view.xy;
}

vec2 invViewTx(in vec2 P) {
  return ((P - u_view.xy * 0.5) - 0.5) / u_view.zw + 0.5;
}