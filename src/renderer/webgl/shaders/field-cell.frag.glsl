#version 300 es
precision highp float;

#include <noise.glsl>
#include <cell.glsl>

in vec2 v_uv;
in float v_id;
out vec4 outColor;

void main() {
  vec2 uv = cellUV(v_uv, v_id);

  float L = length(uv - 0.5);
  float S = smoothstep(0.5, 0.49, L);
  L += snoise(vec3(uv * 10.2, 2982.23)) * 0.02 * S;
  float S2 = 1.0 - min(1.0, L * 2.0);

  vec3 C = hash31(float(v_id));
  float lC = C.r + C.g + C.g;
  if (lC < 0.6) {
    C = (C + 0.1) / max(lC, 0.1);
  }
  // C.r += snoise(vec3(v_uv * 3.0, v_id * 123.938)) * 0.2;
  // C.g += snoise(vec3(v_uv * 3.0, v_id * 22.9)) * 0.2;
  // C.b += snoise(vec3(v_uv * 3.0, v_id * 13.291)) * 0.2;
  C.rgb -= snoise(vec3(v_uv * 3.0, v_id * 123.938)) * 0.5;

  outColor = vec4(C * S, S2)
          //  * (1.0 + snoise(vec3(uv * 1.2, 2982.23)) * 0.5)
           ;

  gl_FragDepth = L;
}