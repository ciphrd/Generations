import { Controls } from "../../controls"

export function viewUniform(gl, progObject, worldSpace = false) {
  if (worldSpace) {
    gl.uniform4f(progObject.uniforms.u_view, 0, 0, 1, 1)
  } else {
    gl.uniform4fv(progObject.uniforms.u_view, Controls.getTxMatrix())
  }
}
