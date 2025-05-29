#version 300 es
precision highp float;

uniform sampler2D u_texture;

in vec2 v_uv;
out vec4 outColor;

void main() {
  vec3 light = vec3(0.89, 0.89, 0.86);
  vec4 T = texture(u_texture, v_uv);
  vec3 C = light - T.rgb * clamp(T.a, 0.0, 1.0);
  outColor = vec4(C, 1.0);

  // vec3 light = vec3(74.0/255.0, 91.0/255.0, 253.0/255.0);
  // vec4 T = texture(u_texture, v_uv);
  // vec3 C = mix(light, (vec3(1) - T.rgb), clamp(T.a, 0.0, 1.0));
  // outColor = vec4(C, 1.0);
}