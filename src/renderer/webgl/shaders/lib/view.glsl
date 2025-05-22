//! assumes
// uniform vec4 u_view;
// xy: translation
// z: scale

// Give some 2d coordinates in world space, returns 2d coordinates in screen
// space after the view transformation is applied.
vec2 viewTx(in vec2 P) {
  return P * u_view.z + u_view.xy;
}

vec2 invViewTx(in vec2 P) {
  return (P - 0.5) / u_view.z + 0.5 - u_view.xy;
}