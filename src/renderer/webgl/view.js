import { Controls } from "../../controls"

export function viewUniform(gl, progObject, worldSpace = false) {
  if (worldSpace) {
    gl.uniform4f(progObject.uniforms.u_view, 0, 0, 1, 0)
  } else {
    gl.uniform4f(
      progObject.uniforms.u_view,
      Controls.txy.x,
      Controls.txy.y,
      Controls.scale,
      0
    )
  }
}
