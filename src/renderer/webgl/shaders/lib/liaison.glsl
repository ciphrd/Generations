// Returns the liaison deformed UV 
vec2 liaisonUV(in vec2 uv, float llength) {
  vec2 luv = uv;
  float xm = pow(1.0 - abs((uv.x - 0.5) * 2.0), 0.5);
  float expand = max(0.0, (llength - 1.0) * 1.1);
  luv.y -= 0.5;
  luv.y *= (1.0 + expand * xm);
  luv.y += 0.5;
  return luv;
}