// Returns a cell deformed UVs
vec2 cellUV(in vec2 uv, in float id) {
  vec2 cuv = uv;
  cuv.x += snoise(vec3(uv, id)) * 0.03;
  cuv.x += snoise(vec3(uv * 4.0, id * 23.494)) * 0.01;
  cuv.y += snoise(vec3(uv, id + 1.5)) * 0.03;
  cuv.y += snoise(vec3(uv * 4.0, (id + 1.5) * 73.102)) * 0.01;
  return cuv;
}